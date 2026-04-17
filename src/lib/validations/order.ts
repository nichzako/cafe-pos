import { z } from "zod";

// Nested schema — internal only, not exported (used only in createOrderSchema)
const orderItemSchema = z.object({
  menuId: z.string().cuid("menuId ไม่ถูกต้อง"),
  quantity: z
    .number()
    .int()
    .min(1, "จำนวนต้องอย่างน้อย 1")
    .max(99, "จำนวนสูงสุด 99"),
  note: z.string().max(100, "หมายเหตุไม่เกิน 100 ตัวอักษร").optional(),
});

export const createOrderSchema = z.object({
  tableId: z.string().cuid("tableId ไม่ถูกต้อง").nullable(),
  items: z
    .array(orderItemSchema)
    .min(1, "กรุณาเลือกเมนูอย่างน้อย 1 รายการ")
    .max(50, "สั่งได้สูงสุด 50 รายการต่อออเดอร์"),
  discount: z
    .number()
    .min(0, "ส่วนลดต้องไม่ติดลบ")
    .max(100000, "ส่วนลดสูงสุด 100,000 บาท")
    .default(0),
  note: z.string().max(200, "หมายเหตุไม่เกิน 200 ตัวอักษร").optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(
    ["pending", "preparing", "ready", "completed", "cancelled"] as const,
    { error: "สถานะออเดอร์ไม่ถูกต้อง" }
  ),
});
