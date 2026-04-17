"use client";

import { useMemo, useState } from "react";
import { Plus, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MenuCard, type MenuItemData } from "./MenuCard";
import { MenuFormModal } from "./MenuFormModal";

type Category = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  _count: { menus: number };
};

type Props = {
  categories: Category[];
  menus: MenuItemData[];
};

export function MenuListClient({ categories, menus }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItemData | null>(null);

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = { all: menus.length };
    for (const m of menus) map[m.categoryId] = (map[m.categoryId] ?? 0) + 1;
    return map;
  }, [menus]);

  const filtered = useMemo(
    () => (activeCategory === "all" ? menus : menus.filter((m) => m.categoryId === activeCategory)),
    [menus, activeCategory],
  );

  function openAdd() {
    setEditingMenu(null);
    setIsModalOpen(true);
  }

  function openEdit(menu: MenuItemData) {
    setEditingMenu(menu);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingMenu(null);
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-cafe-brown-900">จัดการเมนู</h1>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          เพิ่มเมนู
        </Button>
      </div>

      {/* Category tabs */}
      <div
        role="tablist"
        aria-label="กรองตามหมวดหมู่"
        className="flex gap-1 overflow-x-auto rounded-xl border border-cafe-brown-100 bg-cafe-brown-50 p-1"
      >
        {[{ id: "all", name: "ทั้งหมด" }, ...categories].map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = countByCategory[cat.id] ?? 0;
          return (
            <button
              key={cat.id}
              id={`tab-${cat.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={isActive ? `panel-${cat.id}` : undefined}
              onClick={() => setActiveCategory(cat.id)}
              className={[
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-white text-cafe-brown-900 shadow-sm" : "text-cafe-brown-500 hover:text-cafe-brown-700",
              ].join(" ")}
            >
              {cat.name}
              <span className={["rounded-full px-1.5 py-0.5 text-xs", isActive ? "bg-cafe-brown-100 text-cafe-brown-700" : "bg-cafe-brown-100/60 text-cafe-brown-400"].join(" ")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Menu grid */}
      <div
        id={`panel-${activeCategory}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeCategory}`}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed className="h-8 w-8" />}
            title="ยังไม่มีเมนูในหมวดหมู่นี้"
            description="กดปุ่ม 'เพิ่มเมนู' เพื่อเริ่มเพิ่มรายการ"
            action={
              <Button onClick={openAdd} size="sm">
                <Plus className="h-4 w-4" aria-hidden="true" />
                เพิ่มเมนู
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((menu) => (
              <MenuCard key={menu.id} menu={menu} onEdit={openEdit} />
            ))}
          </div>
        )}
      </div>

      <MenuFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        categories={categories}
        editingMenu={editingMenu}
      />
    </div>
  );
}
