"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle } from "lucide-react";
import type { UserRole } from "@/types/index";

export type StaffMember = {
  id: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

type Props = {
  member: StaffMember;
  currentStaffId: string;
};

const roleConfig: Record<UserRole, { label: string; classes: string }> = {
  admin: { label: "แอดมิน", classes: "bg-purple-100 text-purple-700" },
  cashier: { label: "แคชเชียร์", classes: "bg-blue-100 text-blue-700" },
  barista: { label: "บาริสต้า", classes: "bg-amber-100 text-amber-700" },
};

export function StaffCard({ member, currentStaffId }: Props) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSelf = member.id === currentStaffId;
  const role = roleConfig[member.role];

  const joinedDate = new Date(member.createdAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  async function toggleActive() {
    if (isSelf) return; // self-deactivation prevented at UI level too
    setIsUpdating(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
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
      setIsUpdating(false);
    }
  }

  return (
    <div
      className={[
        "rounded-2xl border border-cafe-brown-100 bg-white p-4 shadow-sm",
        !member.isActive ? "opacity-60" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cafe-brown-100">
            <UserCircle className="h-5 w-5 text-cafe-brown-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-cafe-brown-900">{member.name}</p>
            <p className="mt-0.5 text-xs text-cafe-brown-500">เข้าร่วม {joinedDate}</p>
          </div>
        </div>
        <span className={["rounded-full px-2 py-0.5 text-xs font-medium", role.classes].join(" ")}>
          {role.label}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span
          className={[
            "text-xs font-medium",
            member.isActive ? "text-emerald-600" : "text-cafe-brown-400",
          ].join(" ")}
        >
          {member.isActive ? "ใช้งานอยู่" : "ปิดใช้งาน"}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={member.isActive}
          aria-label={`${member.isActive ? "ปิด" : "เปิด"}การใช้งาน ${member.name}`}
          disabled={isUpdating || isSelf}
          title={isSelf ? "ไม่สามารถเปลี่ยนสถานะบัญชีของตัวเองได้" : undefined}
          onClick={toggleActive}
          className={[
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-brown-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
            member.isActive ? "bg-emerald-500" : "bg-cafe-brown-200",
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className={[
              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform",
              member.isActive ? "translate-x-5" : "translate-x-0.5",
            ].join(" ")}
          />
        </button>
      </div>

      {errorMsg && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
