"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OrderCard } from "./OrderCard";
import { RealtimeBadge } from "./RealtimeBadge";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import type { OrderSummary, OrderStatus, UserRole } from "@/types/index";

type FilterValue = OrderStatus | "all";

type FilterTab = {
  value: FilterValue;
  label: string;
};

const ADMIN_TABS: FilterTab[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending", label: "รอดำเนินการ" },
  { value: "preparing", label: "กำลังเตรียม" },
  { value: "ready", label: "พร้อมเสิร์ฟ" },
  { value: "completed", label: "เสร็จสิ้น" },
  { value: "cancelled", label: "ยกเลิก" },
];

const STAFF_TABS: FilterTab[] = [
  { value: "pending", label: "รอดำเนินการ" },
  { value: "preparing", label: "กำลังเตรียม" },
  { value: "ready", label: "พร้อมเสิร์ฟ" },
];

const MAX_DISPLAY = 100;

type Props = {
  orders: OrderSummary[];
  staffRole: UserRole;
  staffId: string;
};

export function OrderListClient({ orders, staffRole, staffId }: Props) {
  const isAdmin = staffRole === "admin";
  const tabs = isAdmin ? ADMIN_TABS : STAFF_TABS;

  const [activeTab, setActiveTab] = useState<FilterValue>(
    isAdmin ? "all" : "pending"
  );

  // Realtime subscription — auto-refreshes when any order changes
  const { status: realtimeStatus, isRefreshing } = useOrdersRealtime();

  // Compute counts once per render — O(n) instead of O(n × tabs)
  const countByStatus = useMemo(() => {
    const map: Partial<Record<FilterValue, number>> = { all: orders.length };
    for (const o of orders) {
      map[o.status] = (map[o.status] ?? 0) + 1;
    }
    return map;
  }, [orders]);

  const filtered = useMemo(
    () => (activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab)),
    [orders, activeTab],
  );

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header + Live indicator */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-cafe-brown-900">รายการออเดอร์</h1>
        {/* aria-live: screen reader announces status changes (connecting → live → offline) */}
        <div aria-live="polite" aria-atomic="true">
          <RealtimeBadge status={realtimeStatus} isRefreshing={isRefreshing} />
        </div>
      </div>

      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="กรองสถานะออเดอร์"
        className="flex gap-1 overflow-x-auto rounded-xl border border-cafe-brown-100 bg-cafe-brown-50 p-1"
      >
        {tabs.map((tab) => {
          const count = countByStatus[tab.value] ?? 0;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              id={`tab-${tab.value}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              // aria-controls only set when the target panel exists in the DOM
              aria-controls={isActive ? `panel-${tab.value}` : undefined}
              onClick={() => setActiveTab(tab.value)}
              className={[
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-cafe-brown-900 shadow-sm"
                  : "text-cafe-brown-500 hover:text-cafe-brown-700",
              ].join(" ")}
            >
              {tab.label}
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-xs",
                  isActive
                    ? "bg-cafe-brown-100 text-cafe-brown-700"
                    : "bg-cafe-brown-100/60 text-cafe-brown-400",
                ].join(" ")}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Order grid */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        aria-busy={isRefreshing}
        className={isRefreshing ? "opacity-70 transition-opacity" : "transition-opacity"}
      >
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-cafe-brown-100 bg-white py-16 text-center">
            <p className="text-cafe-brown-500">ยังไม่มีออเดอร์ในสถานะนี้</p>
            {activeTab === "pending" && (
              <Link
                href="/pos"
                className="mt-4 inline-block rounded-lg bg-cafe-brown-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cafe-brown-800"
              >
                สร้างออเดอร์ใหม่
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  staffRole={staffRole}
                  staffId={staffId}
                />
              ))}
            </div>
            {/* Pagination hint — page.tsx fetches up to MAX_DISPLAY orders */}
            {orders.length >= MAX_DISPLAY && (
              <p className="mt-3 text-center text-xs text-cafe-brown-400">
                แสดง {MAX_DISPLAY} รายการล่าสุด
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
