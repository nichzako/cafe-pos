"use client";

import { useReducer, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CategoryTabs } from "./CategoryTabs";
import { MenuGrid } from "./MenuGrid";
import { OrderPanel } from "./OrderPanel";
import { cartReducer, INITIAL_CART } from "./cartReducer";

type Category = {
  id: string;
  name: string;
  _count: { menus: number };
};

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
};

type Table = { id: string; name: string; number: number };

type POSClientProps = {
  categories: Category[];
  menus: MenuItem[];
  tables: Table[];
};

export function POSClient({ categories, menus, tables }: POSClientProps) {
  const router = useRouter();
  const [cart, dispatch] = useReducer(cartReducer, INITIAL_CART);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredMenus = useMemo(
    () =>
      activeCategoryId
        ? menus.filter((m) => m.categoryId === activeCategoryId)
        : menus,
    [menus, activeCategoryId]
  );

  const cartItemIds = useMemo(
    () => new Set(cart.items.map((i) => i.menuId)),
    [cart.items]
  );

  async function handleSubmit() {
    if (cart.items.length === 0) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: cart.tableId,
          items: cart.items.map((i) => ({
            menuId: i.menuId,
            quantity: i.quantity,
            note: i.note || undefined,
          })),
          discount: cart.discount,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setErrorMsg(json.error ?? "ไม่สามารถสร้างออเดอร์ได้");
        return;
      }

      dispatch({ type: "CLEAR_CART" });
      router.push(`/orders/${json.data.id}`);
    } catch (err) {
      process.stderr.write(`[POS submit error] ${String(err)}\n`);
      setErrorMsg("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left — Menu */}
      <div className="flex flex-1 flex-col overflow-hidden p-4">
        {/* Category tabs */}
        <div className="mb-4">
          <CategoryTabs
            categories={categories}
            activeId={activeCategoryId}
            onSelect={setActiveCategoryId}
          />
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200"
          >
            {errorMsg}
            <button
              onClick={() => setErrorMsg(null)}
              className="ml-2 underline"
              aria-label="ปิดข้อความแจ้งเตือน"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto">
          <MenuGrid
            menus={filteredMenus}
            isLoading={false}
            cartItemIds={cartItemIds}
            dispatch={dispatch}
          />
        </div>
      </div>

      {/* Right — Order panel */}
      <div className="w-72 shrink-0 lg:w-80">
        <OrderPanel
          cart={cart}
          tables={tables}
          dispatch={dispatch}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
