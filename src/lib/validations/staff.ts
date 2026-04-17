import { z } from "zod";

export const createStaffSchema = z.object({
  email: z
    .string()
    .email("อีเมลไม่ถูกต้อง")
    .max(255, "อีเมลไม่เกิน 255 ตัวอักษร"),
  name: z
    .string()
    .min(1, "กรุณากรอกชื่อพนักงาน")
    .max(100, "ชื่อไม่เกิน 100 ตัวอักษร"),
  role: z.enum(["cashier", "barista", "admin"] as const, {
    error: "ตำแหน่งไม่ถูกต้อง",
  }),
});

export const updateStaffSchema = z
  .object({
    name: z.string().min(1, "กรุณากรอกชื่อพนักงาน").max(100, "ชื่อไม่เกิน 100 ตัวอักษร").optional(),
    role: z
      .enum(["cashier", "barista", "admin"] as const, {
        error: "ตำแหน่งไม่ถูกต้อง",
      })
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "ต้องระบุข้อมูลที่ต้องการอัปเดตอย่างน้อย 1 ฟิลด์",
  });
