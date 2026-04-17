import type { CartState, CartAction, CartItem } from "@/types";

export const INITIAL_CART: CartState = {
  tableId: null,
  items: [],
  discount: 0,
};

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.menuId === action.item.menuId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.menuId === action.item.menuId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      const newItem: CartItem = {
        ...action.item,
        quantity: 1,
        note: action.note ?? "",
      };
      return { ...state, items: [...state.items, newItem] };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.menuId !== action.menuId),
      };

    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.menuId !== action.menuId),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuId === action.menuId ? { ...i, quantity: action.quantity } : i
        ),
      };
    }

    case "UPDATE_NOTE":
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuId === action.menuId ? { ...i, note: action.note } : i
        ),
      };

    case "SET_TABLE":
      return { ...state, tableId: action.tableId };

    case "SET_DISCOUNT":
      return { ...state, discount: Math.max(0, action.discount) };

    case "CLEAR_CART":
      return INITIAL_CART;

    default:
      return state;
  }
}

// ─── Derived values ───────────────────────────────────────────────────────────

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.menuPrice * i.quantity, 0);
}

export function getCartTotal(items: CartItem[], discount: number): number {
  return Math.max(0, getCartSubtotal(items) - discount);
}
