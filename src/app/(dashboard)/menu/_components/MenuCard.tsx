"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type MenuItemData = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
  categoryId: string;
  category: { id: string; name: string };
};

type Props = {
  menu: MenuItemData;
  onEdit: (menu: MenuItemData) => void;
};

export function MenuCard({ menu, onEdit }: Props) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function toggleAvailability() {
    setIsToggling(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/menus/${menu.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !menu.isAvailable }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? "เกิดข้อผิดพลาด");
      }
    } catch {
      setErrorMsg("ไม่สามารถเชื่อมต่อได้");
    } finally {
      setIsToggling(false);
    }
  }

  async function deleteMenu() {
    if (!confirm(`ต้องการลบเมนู "${menu.name}" ใช่หรือไม่?`)) return;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/menus/${menu.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? "ลบไม่สำเร็จ");
      }
    } catch {
      setErrorMsg("ไม่สามารถเชื่อมต่อได้");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className={[
      "rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
      isDeleting ? "opacity-60 pointer-events-none" : "",
      menu.isAvailable ? "border-cafe-brown-100" : "border-cafe-brown-200 bg-cafe-brown-50/50",
    ].filter(Boolean).join(" ")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={["text-sm font-bold truncate", menu.isAvailable ? "text-cafe-brown-900" : "text-cafe-brown-400"].join(" ")}>
            {menu.name}
          </p>
          {menu.description && (
            <p className="mt-0.5 truncate text-xs text-cafe-brown-400">{menu.description}</p>
          )}
        </div>
        {/* Availability toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={menu.isAvailable}
          aria-label={`${menu.isAvailable ? "ปิด" : "เปิด"}ขาย ${menu.name}`}
          onClick={toggleAvailability}
          disabled={isToggling || isDeleting}
          className={[
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-brown-500 focus-visible:ring-offset-2",
            menu.isAvailable ? "bg-emerald-500" : "bg-cafe-brown-200",
            "disabled:opacity-50",
          ].join(" ")}
        >
          <span aria-hidden="true" className={[
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            menu.isAvailable ? "translate-x-6" : "translate-x-1",
          ].join(" ")} />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-cafe-brown-700">
          ฿{menu.price.toLocaleString("th-TH")}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`แก้ไขเมนู ${menu.name}`}
            onClick={() => onEdit(menu)}
            disabled={isToggling || isDeleting}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`ลบเมนู ${menu.name}`}
            onClick={deleteMenu}
            disabled={isToggling || isDeleting}
            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {!menu.isAvailable && (
        <p className="mt-1 text-xs text-cafe-brown-400">พักขายอยู่</p>
      )}
      {errorMsg && (
        <p role="alert" className="mt-2 text-xs text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}
