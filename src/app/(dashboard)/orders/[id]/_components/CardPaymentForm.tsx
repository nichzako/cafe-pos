"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

type CardPaymentFormProps = {
  orderId: string;
  total: number;
  onSuccess: () => void;
};

type OmiseTokenResponse =
  | { id: string; card: { last_digits: string; brand: string } }
  | { code: string; message: string };

declare global {
  interface Window {
    Omise?: {
      setPublicKey: (key: string) => void;
      createToken: (
        type: "card",
        params: {
          name: string;
          number: string;
          expiration_month: number;
          expiration_year: number;
          security_code: string;
        },
        callback: (statusCode: number, response: OmiseTokenResponse) => void
      ) => void;
    };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CardPaymentForm({ orderId, total, onSuccess }: CardPaymentFormProps) {
  const router = useRouter();
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [omiseReady, setOmiseReady] = useState(false);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicKey = process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY;
  const isLoading = isTokenizing || isSubmitting;

  function formatCardNumber(raw: string) {
    return raw
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }

  function validate(): string | null {
    if (!cardName.trim()) return "กรุณากรอกชื่อบนบัตร";
    const rawNumber = cardNumber.replace(/\s/g, "");
    if (rawNumber.length < 13) return "กรุณากรอกหมายเลขบัตรให้ครบ";
    const month = Number(expiryMonth);
    if (!month || month < 1 || month > 12) return "เดือนหมดอายุไม่ถูกต้อง (01–12)";
    if (!expiryYear || expiryYear.replace(/\D/g, "").length < 2)
      return "กรุณากรอกปีหมดอายุ";
    if (!cvv || cvv.length < 3) return "กรุณากรอก CVV (3–4 หลัก)";
    return null;
  }

  async function handleSubmit() {
    setError(null);

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    if (!window.Omise || !omiseReady || !publicKey) {
      setError("ระบบชำระเงินยังไม่พร้อม กรุณาลองใหม่อีกครั้ง");
      return;
    }

    const rawNumber = cardNumber.replace(/\s/g, "");
    const yearInput = expiryYear.replace(/\D/g, "");
    const fullYear =
      yearInput.length <= 2 ? 2000 + Number(yearInput) : Number(yearInput);

    setIsTokenizing(true);
    window.Omise.setPublicKey(publicKey);
    window.Omise.createToken(
      "card",
      {
        name: cardName.trim().toUpperCase(),
        number: rawNumber,
        expiration_month: Number(expiryMonth),
        expiration_year: fullYear,
        security_code: cvv,
      },
      async (statusCode, response) => {
        setIsTokenizing(false);

        if (statusCode !== 200 || !("id" in response)) {
          const msg =
            "message" in response
              ? response.message
              : "ข้อมูลบัตรไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
          setError(msg);
          return;
        }

        setIsSubmitting(true);
        try {
          const res = await fetch("/api/payment/card", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, omiseToken: response.id }),
          });
          const json = await res.json();

          if (!json.success) {
            setError(json.error ?? "การชำระเงินไม่สำเร็จ กรุณาลองใหม่");
            return;
          }

          onSuccess();
          router.push(`/orders/${orderId}/receipt`);
          router.refresh();
        } catch {
          setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  }

  // ── No public key configured ──────────────────────────────────────────────
  if (!publicKey) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-5 text-center">
        <CreditCard className="mx-auto mb-2 h-8 w-8 text-amber-400" aria-hidden="true" />
        <p className="text-sm font-medium text-amber-700">
          ชำระเงินด้วยบัตรยังไม่พร้อมใช้งาน
        </p>
        <p className="mt-1 text-xs text-amber-500">
          กรุณาติดต่อผู้ดูแลระบบเพื่อตั้งค่า Omise Public Key
        </p>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Load Omise.js lazily — only when this tab is rendered */}
      <Script
        src="https://cdn.omise.co/omise.js"
        strategy="lazyOnload"
        onLoad={() => setOmiseReady(true)}
        onError={() =>
          setError("โหลดระบบชำระเงินไม่สำเร็จ กรุณา refresh หน้า")
        }
      />

      <div className="space-y-4">
        {/* Total */}
        <div className="rounded-xl bg-cafe-brown-50 px-4 py-3 text-center">
          <p className="text-xs text-cafe-brown-500 mb-1">ยอดที่ต้องชำระ</p>
          <p className="text-3xl font-bold text-cafe-brown-900">
            ฿{total.toLocaleString("th-TH")}
          </p>
        </div>

        {/* Cardholder name */}
        <div>
          <label
            htmlFor="card-name"
            className="block text-sm font-medium text-cafe-brown-700 mb-1.5"
          >
            ชื่อบนบัตร
          </label>
          <input
            id="card-name"
            type="text"
            value={cardName}
            onChange={(e) => {
              setCardName(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="CARDHOLDER NAME"
            autoComplete="cc-name"
            disabled={isLoading}
            className="w-full rounded-xl border border-cafe-brown-200 px-3 py-2.5 text-sm uppercase tracking-wide text-cafe-brown-900 placeholder:normal-case placeholder:text-cafe-brown-300 focus:outline-none focus:ring-2 focus:ring-cafe-brown-400 disabled:opacity-50"
          />
        </div>

        {/* Card number */}
        <div>
          <label
            htmlFor="card-number"
            className="block text-sm font-medium text-cafe-brown-700 mb-1.5"
          >
            หมายเลขบัตร
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cafe-brown-400" aria-hidden="true" />
            <input
              id="card-number"
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => {
                setCardNumber(formatCardNumber(e.target.value));
                setError(null);
              }}
              placeholder="0000 0000 0000 0000"
              autoComplete="cc-number"
              disabled={isLoading}
              className="w-full rounded-xl border border-cafe-brown-200 py-2.5 pl-9 pr-4 font-mono text-sm tracking-widest text-cafe-brown-900 focus:outline-none focus:ring-2 focus:ring-cafe-brown-400 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Expiry month / year / CVV */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="expiry-month"
              className="block text-sm font-medium text-cafe-brown-700 mb-1.5"
            >
              เดือน
            </label>
            <input
              id="expiry-month"
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={expiryMonth}
              onChange={(e) => {
                setExpiryMonth(e.target.value.replace(/\D/g, ""));
                setError(null);
              }}
              placeholder="MM"
              autoComplete="cc-exp-month"
              disabled={isLoading}
              className="w-full rounded-xl border border-cafe-brown-200 px-3 py-2.5 text-center font-mono text-sm text-cafe-brown-900 focus:outline-none focus:ring-2 focus:ring-cafe-brown-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label
              htmlFor="expiry-year"
              className="block text-sm font-medium text-cafe-brown-700 mb-1.5"
            >
              ปี
            </label>
            <input
              id="expiry-year"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={expiryYear}
              onChange={(e) => {
                setExpiryYear(e.target.value.replace(/\D/g, ""));
                setError(null);
              }}
              placeholder="YY"
              autoComplete="cc-exp-year"
              disabled={isLoading}
              className="w-full rounded-xl border border-cafe-brown-200 px-3 py-2.5 text-center font-mono text-sm text-cafe-brown-900 focus:outline-none focus:ring-2 focus:ring-cafe-brown-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label
              htmlFor="cvv"
              className="block text-sm font-medium text-cafe-brown-700 mb-1.5"
            >
              CVV
            </label>
            <input
              id="cvv"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={cvv}
              onChange={(e) => {
                setCvv(e.target.value.replace(/\D/g, ""));
                setError(null);
              }}
              placeholder="123"
              autoComplete="cc-csc"
              disabled={isLoading}
              className="w-full rounded-xl border border-cafe-brown-200 px-3 py-2.5 text-center font-mono text-sm text-cafe-brown-900 focus:outline-none focus:ring-2 focus:ring-cafe-brown-400 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Status / Error */}
        {isTokenizing && (
          <p className="animate-pulse text-center text-sm text-cafe-brown-500">
            กำลังตรวจสอบข้อมูลบัตร...
          </p>
        )}
        {isSubmitting && (
          <p className="animate-pulse text-center text-sm text-cafe-brown-500">
            กำลังประมวลผลการชำระเงิน...
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <p className="text-center text-xs text-cafe-brown-300">
          ข้อมูลบัตรเข้ารหัสผ่าน Omise — ไม่ถูกเก็บในระบบ
        </p>

        <Button
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={isLoading || !omiseReady}
          size="lg"
          className="w-full"
          aria-label="ยืนยันชำระเงินด้วยบัตร"
        >
          ยืนยันชำระเงิน
        </Button>
      </div>
    </>
  );
}
