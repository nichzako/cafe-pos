"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type PromptPayFormProps = {
  orderId: string;
  total: number;
  onSuccess: () => void;
};

export function PromptPayForm({ orderId, total, onSuccess }: PromptPayFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/payment/promptpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
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

      {/* Mockup QR */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-48 w-48 rounded-xl bg-white border-2 border-cafe-brown-200 flex items-center justify-center"
          aria-label="QR Code พร้อมเพย์ (mockup)"
        >
          <MockQR />
        </div>
        <p className="text-xs text-cafe-brown-400 text-center">
          สแกน QR Code เพื่อชำระเงินผ่านพร้อมเพย์
          <br />
          <span className="text-cafe-brown-300">(mockup — ไม่ใช่ QR จริง)</span>
        </p>
      </div>

      {/* Error */}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Confirm button */}
      <Button
        onClick={handleConfirm}
        isLoading={isSubmitting}
        size="lg"
        className="w-full"
        aria-label="ยืนยันการชำระเงินพร้อมเพย์"
      >
        <CheckCircle2 className="h-5 w-5" />
        ยืนยันได้รับเงินแล้ว
      </Button>
    </div>
  );
}

// ─── Mockup QR SVG ────────────────────────────────────────────────────────────

function MockQR() {
  // Simple SVG pattern that resembles a QR code
  const cells: [number, number][] = [
    // Top-left finder
    [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],
    [0,1],[6,1],[0,2],[2,2],[3,2],[4,2],[6,2],
    [0,3],[2,3],[4,3],[6,3],[0,4],[2,4],[3,4],[4,4],[6,4],
    [0,5],[6,5],[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],
    // Top-right finder
    [14,0],[15,0],[16,0],[17,0],[18,0],[19,0],[20,0],
    [14,1],[20,1],[14,2],[16,2],[17,2],[18,2],[20,2],
    [14,3],[16,3],[18,3],[20,3],[14,4],[16,4],[17,4],[18,4],[20,4],
    [14,5],[20,5],[14,6],[15,6],[16,6],[17,6],[18,6],[19,6],[20,6],
    // Bottom-left finder
    [0,14],[1,14],[2,14],[3,14],[4,14],[5,14],[6,14],
    [0,15],[6,15],[0,16],[2,16],[3,16],[4,16],[6,16],
    [0,17],[2,17],[4,17],[6,17],[0,18],[2,18],[3,18],[4,18],[6,18],
    [0,19],[6,19],[0,20],[1,20],[2,20],[3,20],[4,20],[5,20],[6,20],
    // Random data cells
    [8,0],[10,0],[12,0],[9,1],[11,1],[8,2],[10,2],[12,2],
    [8,8],[9,8],[11,8],[13,8],[10,9],[12,9],[8,10],[11,10],
    [9,11],[10,11],[13,11],[8,12],[12,12],[10,13],[11,13],
    [8,14],[10,14],[12,14],[14,14],[9,15],[13,15],[15,15],
    [8,16],[10,16],[14,16],[12,17],[14,17],[9,18],[11,18],
    [8,19],[13,19],[9,20],[10,20],[12,20],[14,20],
    [15,8],[17,8],[19,8],[16,9],[18,9],[20,9],[15,10],[17,10],
    [16,11],[18,11],[20,11],[15,12],[19,12],[17,13],[20,13],
    [16,14],[18,14],[20,14],[15,15],[17,15],[19,15],
  ];

  return (
    <svg
      viewBox="0 0 21 21"
      width="160"
      height="160"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#1a1008" />
      ))}
    </svg>
  );
}
