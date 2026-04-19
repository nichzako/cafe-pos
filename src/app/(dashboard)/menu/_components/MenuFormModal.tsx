"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { MenuItemData } from "./MenuCard";

type Category = { id: string; name: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  editingMenu: MenuItemData | null;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  imageUrl: string;
  sortOrder: string;
  isAvailable: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  imageUrl: "",
  sortOrder: "0",
  isAvailable: true,
};

export function MenuFormModal({ isOpen, onClose, categories, editingMenu }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingMenu) {
      setForm({
        name: editingMenu.name,
        description: editingMenu.description ?? "",
        price: String(editingMenu.price),
        categoryId: editingMenu.categoryId,
        imageUrl: editingMenu.imageUrl ?? "",
        sortOrder: String(editingMenu.sortOrder),
        isAvailable: editingMenu.isAvailable,
      });
    } else {
      setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? "" });
    }
    setErrors({});
    setApiError(null);
  }, [editingMenu, categories]);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "กรุณากรอกชื่อเมนู";
    if (!form.categoryId) next.categoryId = "กรุณาเลือกหมวดหมู่";
    const price = Number(form.price);
    if (!form.price || isNaN(price) || price <= 0) next.price = "กรุณากรอกราคาที่ถูกต้อง";
    if (form.imageUrl && !/^https?:\/\//.test(form.imageUrl)) next.imageUrl = "URL ต้องขึ้นต้นด้วย http:// หรือ https://";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setApiError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      categoryId: form.categoryId,
      imageUrl: form.imageUrl.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      isAvailable: form.isAvailable,
    };

    try {
      const res = await fetch(
        editingMenu ? `/api/menus/${editingMenu.id}` : "/api/menus",
        {
          method: editingMenu ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setApiError((data as { error?: string }).error ?? "บันทึกไม่สำเร็จ");
      }
    } catch {
      setApiError("ไม่สามารถเชื่อมต่อได้");
    } finally {
      setIsSaving(false);
    }
  }

  function set(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  if (categories.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="เพิ่มเมนูใหม่">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm text-cafe-brown-700">ยังไม่มีหมวดหมู่ กรุณาเพิ่มหมวดหมู่ก่อนเพิ่มเมนู</p>
          <button type="button" onClick={onClose} className="text-sm text-cafe-brown-500 underline">
            ปิด
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingMenu ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div className="flex flex-col gap-1">
          <label htmlFor="menu-category" className="text-sm font-medium text-cafe-brown-800">
            หมวดหมู่ <span className="text-red-500">*</span>
          </label>
          <select
            id="menu-category"
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className={[
              "rounded-xl border px-3 py-2 text-sm text-cafe-brown-900 bg-white",
              "focus:outline-none focus:ring-2 focus:ring-cafe-brown-500 focus:border-transparent",
              errors.categoryId ? "border-red-400" : "border-cafe-brown-200",
            ].join(" ")}
          >
            <option value="">เลือกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="text-xs text-red-600" role="alert">{errors.categoryId}</p>}
        </div>

        <Input
          label="ชื่อเมนู *"
          id="menu-name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
          placeholder="เช่น อเมริกาโน่"
          maxLength={100}
        />

        <Input
          label="คำอธิบาย"
          id="menu-desc"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
          maxLength={300}
        />

        <Input
          label="ราคา (บาท) *"
          id="menu-price"
          type="number"
          min="1"
          max="99999"
          step="0.50"
          value={form.price}
          onChange={(e) => set("price", e.target.value)}
          error={errors.price}
          placeholder="เช่น 65"
        />

        <Input
          label="URL รูปภาพ"
          id="menu-image"
          value={form.imageUrl}
          onChange={(e) => set("imageUrl", e.target.value)}
          error={errors.imageUrl}
          placeholder="https://..."
        />

        <Input
          label="ลำดับการแสดง"
          id="menu-sort"
          type="number"
          min="0"
          value={form.sortOrder}
          onChange={(e) => set("sortOrder", e.target.value)}
          hint="ตัวเลขน้อย = แสดงก่อน"
        />

        {/* isAvailable toggle */}
        <div className="flex items-center justify-between rounded-xl border border-cafe-brown-100 px-3 py-2.5">
          <label htmlFor="menu-available" className="text-sm font-medium text-cafe-brown-800">
            สถานะ
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-cafe-brown-500">{form.isAvailable ? "เปิดขาย" : "พักขาย"}</span>
            <button
              id="menu-available"
              type="button"
              role="switch"
              aria-checked={form.isAvailable}
              aria-label="สถานะการขาย"
              disabled={isSaving}
              onClick={() => set("isAvailable", !form.isAvailable)}
              className={[
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-brown-500",
                "disabled:opacity-50",
                form.isAvailable ? "bg-emerald-500" : "bg-cafe-brown-200",
              ].join(" ")}
            >
              <span aria-hidden="true" className={["inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform", form.isAvailable ? "translate-x-6" : "translate-x-1"].join(" ")} />
            </button>
          </div>
        </div>

        {apiError && <p role="alert" className="text-sm text-red-600">{apiError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isSaving}>
            ยกเลิก
          </Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={isSaving}>
            {editingMenu ? "บันทึก" : "เพิ่มเมนู"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
