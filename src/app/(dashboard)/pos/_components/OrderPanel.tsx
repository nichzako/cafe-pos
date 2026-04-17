"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CartItemRow } from "./CartItemRow";
import { getCartSubtotal, getCartTotal } from "./cartReducer";
import type { CartState, CartAction } from "@/types";

type Table = { id: string; name: string; number: number };

type OrderPanelProps = {
  cart: CartState;
  tables: Table[];
  dispatch: React.Dispatch<CartAction>;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function OrderPanel({ cart, tables, dispatch, onSubmit, isSubmitting }: OrderPanelProps) {
  const subtotal = getCartSubtotal(cart.items);
  const total = getCartTotal(cart.items, cart.discount);
  const isEmpty = cart.items.length === 0;

  return (
    <div className="flex h-full flex-col bg-white border-l border-cafe-brown-100">
      <PanelHeader isEmpty={isEmpty} onClear={() => dispatch({ type: "CLEAR_CART" })} />
      <TableSelector tableId={cart.tableId} tables={tables} dispatch={dispatch} />

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {isEmpty ? (
          <EmptyState title="ยังไม่มีรายการ" description="เลือกเมนูเพื่อเริ่มออเดอร์" />
        ) : (
          <ul className="space-y-3" aria-label="รายการในออเดอร์">
            {cart.items.map((item) => (
              <CartItemRow key={item.menuId} item={item} dispatch={dispatch} />
            ))}
          </ul>
        )}
      </div>

      {!isEmpty && (
        <OrderSummary
          subtotal={subtotal}
          discount={cart.discount}
          total={total}
          itemCount={cart.items.length}
          isSubmitting={isSubmitting}
          onDiscountChange={(v) => dispatch({ type: "SET_DISCOUNT", discount: v })}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PanelHeader({ isEmpty, onClear }: { isEmpty: boolean; onClear: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-cafe-brown-100 px-4 py-3">
      <h2 className="font-semibold text-cafe-brown-900">รายการสั่ง</h2>
      {!isEmpty && (
        <button
          onClick={onClear}
          aria-label="ล้างรายการทั้งหมด"
          className="text-xs text-cafe-brown-400 hover:text-red-500 transition-colors"
        >
          ล้างทั้งหมด
        </button>
      )}
    </div>
  );
}

function TableSelector({
  tableId,
  tables,
  dispatch,
}: {
  tableId: string | null;
  tables: Table[];
  dispatch: React.Dispatch<CartAction>;
}) {
  return (
    <div className="border-b border-cafe-brown-100 px-4 py-3">
      <label htmlFor="table-select" className="mb-1 block text-xs text-cafe-brown-500">
        โต๊ะ
      </label>
      <div className="relative">
        <select
          id="table-select"
          value={tableId ?? ""}
          onChange={(e) => dispatch({ type: "SET_TABLE", tableId: e.target.value || null })}
          className={[
            "w-full appearance-none rounded-xl border px-3 py-2 pr-8 text-sm",
            "bg-white text-cafe-brown-900 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-cafe-brown-500",
            "border-cafe-brown-200 hover:border-cafe-brown-300",
          ].join(" ")}
        >
          <option value="">— ไม่ระบุโต๊ะ (Takeaway) —</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-brown-400" />
      </div>
    </div>
  );
}

function OrderSummary({
  subtotal,
  discount,
  total,
  itemCount,
  isSubmitting,
  onDiscountChange,
  onSubmit,
}: {
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
  isSubmitting: boolean;
  onDiscountChange: (v: number) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="border-t border-cafe-brown-100 px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <label htmlFor="discount" className="shrink-0 text-xs text-cafe-brown-500">
          ส่วนลด (฿)
        </label>
        <input
          id="discount"
          type="number"
          min={0}
          max={subtotal}
          value={discount || ""}
          onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
          placeholder="0"
          className="w-full rounded-xl border border-cafe-brown-200 px-3 py-1.5 text-right text-sm text-cafe-brown-900 focus:outline-none focus:ring-2 focus:ring-cafe-brown-400"
        />
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-cafe-brown-600">
          <span>ราคารวม</span>
          <span>฿{subtotal.toLocaleString("th-TH")}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>ส่วนลด</span>
            <span>−฿{discount.toLocaleString("th-TH")}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-cafe-brown-100 pt-1 text-base font-bold text-cafe-brown-900">
          <span>ยอดรวม</span>
          <span>฿{total.toLocaleString("th-TH")}</span>
        </div>
      </div>

      <Button
        onClick={onSubmit}
        isLoading={isSubmitting}
        size="lg"
        className="w-full"
        aria-label="ส่งออเดอร์"
      >
        ส่งออเดอร์ ({itemCount} รายการ)
      </Button>
    </div>
  );
}
