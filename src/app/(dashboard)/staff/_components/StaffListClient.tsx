"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaffCard, type StaffMember } from "./StaffCard";
import type { UserRole } from "@/types/index";

type FilterValue = "all" | UserRole;

const FILTER_TABS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "admin", label: "แอดมิน" },
  { value: "cashier", label: "แคชเชียร์" },
  { value: "barista", label: "บาริสต้า" },
];

type Props = {
  members: StaffMember[];
  currentStaffId: string;
};

export function StaffListClient({ members, currentStaffId }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");

  const countByRole = useMemo(() => {
    const map: Record<string, number> = { all: members.length };
    for (const m of members) {
      map[m.role] = (map[m.role] ?? 0) + 1;
    }
    return map;
  }, [members]);

  const filtered = useMemo(
    () => (activeFilter === "all" ? members : members.filter((m) => m.role === activeFilter)),
    [members, activeFilter],
  );

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-cafe-brown-900">จัดการพนักงาน</h1>
        <p className="text-sm text-cafe-brown-500">{members.length} คน</p>
      </div>

      {/* Role filter tabs */}
      <div
        role="tablist"
        aria-label="กรองตามตำแหน่ง"
        className="flex gap-1 overflow-x-auto rounded-xl border border-cafe-brown-100 bg-cafe-brown-50 p-1"
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.value;
          const count = countByRole[tab.value] ?? 0;
          return (
            <button
              key={tab.value}
              id={`tab-${tab.value}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={isActive ? `panel-${tab.value}` : undefined}
              onClick={() => setActiveFilter(tab.value)}
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

      {/* Staff grid */}
      <div
        id={`panel-${activeFilter}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeFilter}`}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="ไม่มีพนักงานในตำแหน่งนี้"
            description="เปลี่ยนตัวกรองเพื่อดูพนักงานทั้งหมด"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                currentStaffId={currentStaffId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
