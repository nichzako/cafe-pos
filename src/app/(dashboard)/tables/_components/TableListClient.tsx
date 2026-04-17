"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import type { TableStatus } from "@/types/index";

type TableData = {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: TableStatus;
};

type Props = { tables: TableData[] };

const statusConfig: Record<TableStatus, { label: string; classes: string }> = {
  available: { label: "ว่าง", classes: "bg-emerald-100 text-emerald-700" },
  occupied: { label: "มีลูกค้า", classes: "bg-amber-100 text-amber-700" },
  reserved: { label: "จอง", classes: "bg-blue-100 text-blue-700" },
};

type FormState = { number: string; name: string; capacity: string };
const EMPTY_FORM: FormState = { number: "", name: "", capacity: "4" };

export function TableListClient({ tables }: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<FormState> = {};
    const n = Number(form.number);
    if (!form.number || isNaN(n) || n < 1 || n > 999) next.number = "หมายเลขโต๊ะ 1–999";
    if (!form.name.trim()) next.name = "กรุณากรอกชื่อโต๊ะ";
    const cap = Number(form.capacity);
    if (!form.capacity || isNaN(cap) || cap < 1 || cap > 50) next.capacity = "ความจุ 1–50";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    setApiError(null);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: Number(form.number), name: form.name.trim(), capacity: Number(form.capacity) }),
      });
      if (res.ok) {
        router.refresh();
        setIsModalOpen(false);
        setForm(EMPTY_FORM);
      } else {
        const data = await res.json().catch(() => ({}));
        setApiError((data as { error?: string }).error ?? "เพิ่มโต๊ะไม่สำเร็จ");
      }
    } catch {
      setApiError("ไม่สามารถเชื่อมต่อได้");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(table: TableData) {
    if (!confirm(`ต้องการลบโต๊ะ "${table.name}" ใช่หรือไม่?`)) return;
    setDeletingId(table.id);
    try {
      const res = await fetch(`/api/tables/${table.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert((data as { error?: string }).error ?? "ลบไม่สำเร็จ");
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อได้");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-cafe-brown-900">จัดการโต๊ะ</h1>
        <Button onClick={() => { setForm(EMPTY_FORM); setErrors({}); setApiError(null); setIsModalOpen(true); }} size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          เพิ่มโต๊ะ
        </Button>
      </div>

      {tables.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-8 w-8" />}
          title="ยังไม่มีโต๊ะในระบบ"
          description="กดปุ่ม 'เพิ่มโต๊ะ' เพื่อเริ่มเพิ่มโต๊ะ"
          action={<Button onClick={() => setIsModalOpen(true)} size="sm"><Plus className="h-4 w-4" />เพิ่มโต๊ะ</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => {
            const s = statusConfig[table.status];
            const isDeleting = deletingId === table.id;
            return (
              <div
                key={table.id}
                className={["rounded-2xl border border-cafe-brown-100 bg-white p-4 shadow-sm", isDeleting ? "opacity-60 pointer-events-none" : ""].filter(Boolean).join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-cafe-brown-900">{table.name}</p>
                    <p className="mt-0.5 text-xs text-cafe-brown-500">โต๊ะ {table.number} • {table.capacity} ที่นั่ง</p>
                  </div>
                  <span className={["rounded-full px-2 py-0.5 text-xs font-medium", s.classes].join(" ")}>{s.label}</span>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`ลบโต๊ะ ${table.name}`}
                    onClick={() => handleDelete(table)}
                    disabled={table.status !== "available"}
                    title={table.status !== "available" ? "ลบได้เฉพาะโต๊ะที่ว่าง" : undefined}
                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add table modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="เพิ่มโต๊ะใหม่" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="หมายเลขโต๊ะ *" id="table-number" type="number" min="1" max="999" value={form.number} onChange={(e) => set("number", e.target.value)} error={errors.number} placeholder="เช่น 1" />
          <Input label="ชื่อโต๊ะ *" id="table-name" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} placeholder="เช่น โต๊ะ A1" maxLength={50} />
          <Input label="ความจุ (ที่นั่ง) *" id="table-capacity" type="number" min="1" max="50" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} error={errors.capacity} />
          {apiError && <p role="alert" className="text-sm text-red-600">{apiError}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1" disabled={isSaving}>ยกเลิก</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSaving}>เพิ่มโต๊ะ</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
