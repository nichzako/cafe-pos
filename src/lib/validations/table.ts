import { z } from "zod";

export const createTableSchema = z.object({
  number: z
    .number()
    .int()
    .min(1, "หมายเลขโต๊ะต้องมากกว่า 0")
    .max(999, "หมายเลขโต๊ะสูงสุด 999"),
  name: z
    .string()
    .min(1, "กรุณากรอกชื่อโต๊ะ")
    .max(50, "ชื่อโต๊ะไม่เกิน 50 ตัวอักษร"),
  capacity: z
    .number()
    .int()
    .min(1, "ความจุต้องอย่างน้อย 1")
    .max(50, "ความจุสูงสุด 50")
    .default(4),
});

export const updateTableSchema = createTableSchema.partial().omit({ number: true });

export const updateTableStatusSchema = z.object({
  status: z.enum(["available", "occupied", "reserved"] as const, {
    error: "สถานะโต๊ะไม่ถูกต้อง",
  }),
});
