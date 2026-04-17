import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email("อีเมลไม่ถูกต้อง")
    .max(255, "อีเมลไม่เกิน 255 ตัวอักษร"),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร")
    .max(72, "รหัสผ่านไม่เกิน 72 ตัวอักษร"),
});
