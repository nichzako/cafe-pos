import { z } from "zod";

/**
 * NOTE: Schema validates that amountTendered is positive, but cannot validate
 * that it covers the order total (total is not part of the request payload).
 * The API route MUST check: amountTendered >= order.total before processing.
 */
export const cashPaymentSchema = z.object({
  orderId: z.string().cuid("orderId ไม่ถูกต้อง"),
  amountTendered: z
    .number({ error: "กรุณากรอกจำนวนเงิน" })
    .positive("จำนวนเงินต้องมากกว่า 0"),
});

/** Initiate PromptPay payment — generates a QR code for the order. */
export const promptpayPaymentSchema = z.object({
  orderId: z.string().cuid("orderId ไม่ถูกต้อง"),
});

export const cardPaymentSchema = z.object({
  orderId: z.string().cuid("orderId ไม่ถูกต้อง"),
  // Omise tokens follow the "tokn_" prefix pattern
  omiseToken: z
    .string()
    .regex(/^tokn_/, "token บัตรไม่ถูกต้อง")
    .min(1, "กรุณาใส่ข้อมูลบัตร"),
});

export const mockupPaymentSchema = z.object({
  orderId: z.string().cuid("orderId ไม่ถูกต้อง"),
  simulateSuccess: z.boolean(),
});
