"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type CashPaymentFormProps = {
  orderId: string;
  total: number;
  onSuccess: () => void;
};

// Quick-select denominations (Thai baht)
const DENOMINATIONS = [20, 50, 100, 500, 1000];

export function CashPaymentForm({ orderId, total, onSuccess }: CashPaymentFormProps) {
  const router = useRouter();
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = Math.max(0, amountTendered - total);
  const isEnough = amountTendered >= total;

  function handleDenomination(value: number) {
    setAmountTendered((prev) => {
      // First click sets to exact denomination, subsequent clicks accumulate
      const next = prev === 0 ? value : prev + value;
      return next;
    });
    setError(null);
  }

  function handleExact() {
    setAmountTendered(total);
    setError(null);
  }

  async function handleSubmit() {
    if (!isEnough) {
      setError("จำนวนเงินไม่เพียงพอ");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/payment/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amountTendered }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "ไม่สามารถบันทึกการชำระเงินได้");
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

  return (
    <div className="space-y-5">
      {/* Total */}
      <div className="rounded-xl bg-cafe-brown-50 px-4 py-3 text-center">
        <p className="text-xs text-cafe-brown-500 mb-1">ยอดที่ต้องชำระ</p>
        <p className="text-3xl font-bold text-cafe-brown-900">
          ฿{total.toLocaleString("th-TH")}
        </p>
      </div>

      {/* Amount tendered input */}
      <div>
        <label
          htmlFor="amount-tendered"
          className="block text-sm font-medium text-cafe-brown-700 mb-1.5"
        >
          รับเงินจากลูกค้า
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-brown-400 font-medium">
            ฿
          </span>
          <input
            id="amount-tendered"
            type="number"
            min={0}
            step="any"
            value={amountTendered || ""}
            onChange={(e) => {
              setAmountTendered(Number(e.target.value) || 0);
              setError(null);
            }}
            placeholder="0"
            className="w-full rounded-xl border border-cafe-brown-200 py-2.5 pl-8 pr-4 text-right text-lg font-medium text-cafe-brown-900 focus:outline-none focus:ring-2 focus:ring-cafe-brown-400"
          />
        </div>
      </div>

      {/* Quick-select denominations */}
      <div className="space-y-2">
        <p className="text-xs text-cafe-brown-500">เลือกธนบัตร</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExact}
            className="rounded-lg border border-cafe-brown-300 bg-white px-3 py-1.5 text-sm font-medium text-cafe-brown-700 hover:bg-cafe-brown-50 transition-colors"
          >
            พอดี
          </button>
          {DENOMINATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDenomination(d)}
              className="rounded-lg border border-cafe-brown-200 bg-white px-3 py-1.5 text-sm text-cafe-brown-600 hover:bg-cafe-brown-50 transition-colors"
            >
              +{d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setAmountTendered(0); setError(null); }}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            ล้าง
          </button>
        </div>
      </div>

      {/* Change display */}
      {amountTendered > 0 && (
        <div
          className={[
            "rounded-xl px-4 py-3 flex justify-between items-center",
            isEnough ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100",
          ].join(" ")}
        >
          <span className={`text-sm font-medium ${isEnough ? "text-emerald-700" : "text-red-600"}`}>
            {isEnough ? "เงินทอน" : "ขาด"}
          </span>
          <span className={`text-xl font-bold ${isEnough ? "text-emerald-700" : "text-red-600"}`}>
            ฿{(isEnough ? change : total - amountTendered).toLocaleString("th-TH")}
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        isLoading={isSubmitting}
        disabled={!isEnough}
        size="lg"
        className="w-full"
        aria-label="ยืนยันการชำระเงินสด"
      >
        ยืนยันชำระเงิน
      </Button>
    </div>
  );
}
