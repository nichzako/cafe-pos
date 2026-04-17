/**
 * Central type registry for the Cafe POS system.
 *
 * CONVENTION — Form types are always inferred from Zod schemas:
 *   1. Define schema in src/lib/validations/{resource}.ts
 *   2. Export as camelCase + "Schema" (e.g. createMenuSchema)
 *   3. Add inferred type here: `type XFormData = z.infer<typeof xSchema>`
 *   4. Use type in components and import { parse } schema in API routes
 *
 * This keeps validation rules and TypeScript types in sync automatically.
 */
import type { z } from "zod";
import type {
  createMenuSchema,
  updateMenuSchema,
  createCategorySchema,
  updateCategorySchema,
  toggleMenuAvailabilitySchema,
} from "@/lib/validations/menu";
import type {
  createOrderSchema,
  updateOrderStatusSchema,
} from "@/lib/validations/order";
import type {
  cashPaymentSchema,
  cardPaymentSchema,
  promptpayPaymentSchema,
  mockupPaymentSchema,
} from "@/lib/validations/payment";
import type { createStaffSchema, updateStaffSchema } from "@/lib/validations/staff";
import type {
  createTableSchema,
  updateTableSchema,
  updateTableStatusSchema,
} from "@/lib/validations/table";
import type { loginSchema } from "@/lib/validations/auth";

// ─── API Response ─────────────────────────────────────────────────────────────

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type PaginatedApiResponse<T> = ApiResponse<{
  items: T[];
  meta: { total: number; page: number; limit: number };
}>;

// ─── Domain Enums (mirrors Prisma enums) ─────────────────────────────────────

export type UserRole = "cashier" | "barista" | "admin";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "promptpay" | "card" | "mockup";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type TableStatus = "available" | "occupied" | "reserved";

// ─── POS Cart ────────────────────────────────────────────────────────────────

export type CartItem = {
  menuId: string;
  menuName: string;
  menuPrice: number;
  quantity: number;
  note: string;
};

export type CartState = {
  tableId: string | null;
  items: CartItem[];
  discount: number;
};

export type CartAction =
  | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity" | "note">; note?: string }
  | { type: "REMOVE_ITEM"; menuId: string }
  | { type: "UPDATE_QUANTITY"; menuId: string; quantity: number }
  | { type: "UPDATE_NOTE"; menuId: string; note: string }
  | { type: "SET_TABLE"; tableId: string | null }
  | { type: "SET_DISCOUNT"; discount: number }
  | { type: "CLEAR_CART" };

// ─── Order List ──────────────────────────────────────────────────────────────

/** Shape returned by the orders list page query — used by OrderCard and OrderListClient */
export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string; // ISO string (serialized from Date in Server Component)
  table: { id: string; name: string } | null;
  staff: { id: string; name: string };
  _count: { items: number };
};

// ─── Receipt ─────────────────────────────────────────────────────────────────

export type ReceiptItem = {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  note?: string;
};

export type ReceiptData = {
  receiptNumber: string;
  orderNumber: string;
  tableName: string | null;
  staffName: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  shopName: string;
};

// ─── Form types (inferred from Zod schemas) ──────────────────────────────────

export type CreateMenuFormData = z.infer<typeof createMenuSchema>;
export type UpdateMenuFormData = z.infer<typeof updateMenuSchema>;
export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;
export type ToggleMenuAvailabilityFormData = z.infer<typeof toggleMenuAvailabilitySchema>;

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusFormData = z.infer<typeof updateOrderStatusSchema>;

export type CashPaymentFormData = z.infer<typeof cashPaymentSchema>;
export type CardPaymentFormData = z.infer<typeof cardPaymentSchema>;
export type PromptPayPaymentFormData = z.infer<typeof promptpayPaymentSchema>;
export type MockupPaymentFormData = z.infer<typeof mockupPaymentSchema>;

export type CreateStaffFormData = z.infer<typeof createStaffSchema>;
export type UpdateStaffFormData = z.infer<typeof updateStaffSchema>;

export type CreateTableFormData = z.infer<typeof createTableSchema>;
export type UpdateTableFormData = z.infer<typeof updateTableSchema>;
export type UpdateTableStatusFormData = z.infer<typeof updateTableStatusSchema>;

export type LoginFormData = z.infer<typeof loginSchema>;
