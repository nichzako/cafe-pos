"use client";

import { Wifi, WifiOff, Loader2 } from "lucide-react";
import type { RealtimeStatus } from "@/hooks/useOrdersRealtime";

type Props = {
  status: RealtimeStatus;
  isRefreshing: boolean;
};

export function RealtimeBadge({ status, isRefreshing }: Props) {
  if (isRefreshing) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-cafe-brown-100 px-2.5 py-1 text-xs font-medium text-cafe-brown-600">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        กำลังอัปเดต…
      </span>
    );
  }

  if (status === "live") {
    return (
      <span
        className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
        aria-label="Real-time เชื่อมต่อแล้ว — หน้านี้อัปเดตอัตโนมัติเมื่อมีออเดอร์ใหม่"
      >
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
            aria-hidden="true"
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"
            aria-hidden="true"
          />
        </span>
        Live
      </span>
    );
  }

  if (status === "error") {
    return (
      <span
        className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600"
        aria-label="ขาดการเชื่อมต่อ real-time — กด refresh เพื่อดูข้อมูลล่าสุด"
      >
        <WifiOff className="h-3 w-3" aria-hidden="true" />
        ออฟไลน์
      </span>
    );
  }

  // "connecting" default
  return (
    <span
      className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600"
      aria-label="กำลังเชื่อมต่อ real-time"
    >
      <Wifi className="h-3 w-3" aria-hidden="true" />
      กำลังเชื่อมต่อ…
    </span>
  );
}
