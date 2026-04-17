import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem, CartAction } from "@/types";

type CartItemRowProps = {
  item: CartItem;
  dispatch: React.Dispatch<CartAction>;
};

export function CartItemRow({ item, dispatch }: CartItemRowProps) {
  return (
    <li className="flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cafe-brown-900 truncate">{item.menuName}</p>
        <p className="text-xs text-cafe-brown-500">
          ฿{item.menuPrice.toLocaleString("th-TH")} / ชิ้น
        </p>
        <input
          type="text"
          value={item.note}
          onChange={(e) =>
            dispatch({ type: "UPDATE_NOTE", menuId: item.menuId, note: e.target.value })
          }
          placeholder="หมายเหตุ..."
          maxLength={100}
          aria-label={`หมายเหตุสำหรับ ${item.menuName}`}
          className="mt-1 w-full rounded-lg border border-cafe-brown-100 px-2 py-1 text-xs text-cafe-brown-700 placeholder-cafe-brown-300 focus:outline-none focus:ring-1 focus:ring-cafe-brown-400"
        />
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() =>
            dispatch({ type: "UPDATE_QUANTITY", menuId: item.menuId, quantity: item.quantity - 1 })
          }
          aria-label={`ลด ${item.menuName}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-cafe-brown-100 text-cafe-brown-700 hover:bg-cafe-brown-200 transition-colors"
        >
          {item.quantity === 1 ? (
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <Minus className="h-3.5 w-3.5" />
          )}
        </button>
        <span className="w-6 text-center text-sm font-semibold text-cafe-brown-900">
          {item.quantity}
        </span>
        <button
          onClick={() =>
            dispatch({ type: "UPDATE_QUANTITY", menuId: item.menuId, quantity: item.quantity + 1 })
          }
          aria-label={`เพิ่ม ${item.menuName}`}
          disabled={item.quantity >= 99}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-cafe-brown-100 text-cafe-brown-700 hover:bg-cafe-brown-200 transition-colors disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Line total */}
      <p className="w-16 shrink-0 text-right text-sm font-semibold text-cafe-brown-800">
        ฿{(item.menuPrice * item.quantity).toLocaleString("th-TH")}
      </p>
    </li>
  );
}
