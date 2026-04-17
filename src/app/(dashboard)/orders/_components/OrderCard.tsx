"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Users, ChevronRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/Badge";
import type { OrderStatus, OrderSummary, UserRole } from "@/types/index";

export type { OrderSummary };

type Props = {
  order: OrderSummary;
  staffRole: UserRole;
  staffId: string;
};

// Primary next-status action per current status
const NEXT_ACTION: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: "preparing", label: "เริ่มทำ" },
  preparing: { status: "ready", label: "พร้อมเสิร์ฟ" },
  ready: { status: "completed", label: "เสร็จสิ้น" },
};

const CANCELLABLE: OrderStatus[] = ["pending", "preparing"];

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "เมื่อกี้";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hours / 24)} วันที่แล้ว`;
}

export function OrderCard({ order, staffRole, staffId }: Props) {
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = staffRole === "admin";
  const isOwner = order.staff.id === staffId;
  const canCancel = CANCELLABLE.includes(order.status) && (isAdmin || isOwner);
  const nextAction = NEXT_ACTION[order.status];

  async function changeStatus(newStatus: OrderStatus) {
    setIsChanging(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } catch {
      setErrorMsg("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่");
    } finally {
      setIsChanging(false);
    }
  }

  return (
    <div
      className={[
        "rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md",
        isChanging ? "opacity-60 pointer-events-none" : "",
        order.status === "ready" ? "border-emerald-200" : "border-cafe-brown-100",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Card body — click to detail */}
      <Link
        href={`/orders/${order.id}`}
        className="block p-4"
        aria-label={`ดูรายละเอียดออเดอร์ ${order.orderNumber}`}
        tabIndex={isChanging ? -1 : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-cafe-brown-900">
              {order.orderNumber}
            </p>
            <p className="mt-0.5 truncate text-xs text-cafe-brown-500">
              {order.table ? order.table.name : "Takeaway"} •{" "}
              {order.staff.name}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <OrderStatusBadge status={order.status} size="sm" />
            <ChevronRight className="h-4 w-4 text-cafe-brown-300" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-cafe-brown-400">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {order._count.items} รายการ
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatRelativeTime(order.createdAt)}
          </span>
          <span className="ml-auto font-semibold text-cafe-brown-700">
            ฿{order.total.toLocaleString("th-TH")}
          </span>
        </div>
      </Link>

      {/* Action buttons */}
      {(nextAction || canCancel) && (
        <div className="flex gap-2 border-t border-cafe-brown-50 p-3">
          {nextAction && (
            <button
              type="button"
              aria-label={`${nextAction.label} ออเดอร์ ${order.orderNumber}`}
              onClick={() => changeStatus(nextAction.status)}
              disabled={isChanging}
              className="flex-1 rounded-lg bg-cafe-brown-700 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-cafe-brown-800 disabled:opacity-50"
            >
              {nextAction.label}
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              aria-label={`ยกเลิกออเดอร์ ${order.orderNumber}`}
              onClick={() => changeStatus("cancelled")}
              disabled={isChanging}
              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              ยกเลิก
            </button>
          )}
        </div>
      )}

      {/* Error feedback */}
      {errorMsg && (
        <p role="alert" className="px-3 pb-3 text-xs text-red-600">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
