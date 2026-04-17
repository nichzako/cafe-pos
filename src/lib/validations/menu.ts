import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "กรุณากรอกชื่อหมวดหมู่")
    .max(50, "ชื่อหมวดหมู่ไม่เกิน 50 ตัวอักษร"),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createMenuSchema = z.object({
  categoryId: z.string().cuid("categoryId ไม่ถูกต้อง"),
  name: z
    .string()
    .min(1, "กรุณากรอกชื่อเมนู")
    .max(100, "ชื่อเมนูไม่เกิน 100 ตัวอักษร"),
  description: z
    .string()
    .max(300, "คำอธิบายไม่เกิน 300 ตัวอักษร")
    .optional(),
  price: z
    .number({ error: "กรุณากรอกราคา" })
    .positive("ราคาต้องมากกว่า 0")
    .max(99999, "ราคาสูงสุด 99,999 บาท"),
  imageUrl: z.string().url("URL รูปภาพไม่ถูกต้อง").optional(),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateMenuSchema = createMenuSchema.partial();

export const toggleMenuAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});
