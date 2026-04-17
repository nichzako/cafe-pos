"use client";

import { AlertCircle } from "lucide-react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function OrdersError({ reset }: Props) {

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-red-400" aria-hidden="true" />
      <h2 className="text-lg font-bold text-cafe-brown-900">โหลดรายการออเดอร์ไม่สำเร็จ</h2>
      <p className="mt-2 text-sm text-cafe-brown-500">
        เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล — กรุณาลองใหม่อีกครั้ง
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-cafe-brown-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cafe-brown-800"
      >
        ลองใหม่
      </button>
    </div>
  );
}
