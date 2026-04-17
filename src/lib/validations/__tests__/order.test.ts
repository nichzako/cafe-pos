import { describe, it, expect } from "vitest";
import { createOrderSchema, updateOrderStatusSchema } from "@/lib/validations/order";

const VALID_CUID = "clh3m7k0z0000qwer1234abcd";

describe("createOrderSchema", () => {
  const validItem = { menuId: VALID_CUID, quantity: 1 };

  it("accepts a minimal valid order", () => {
    const result = createOrderSchema.safeParse({
      tableId: null,
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it("accepts tableId as null (takeaway)", () => {
    const result = createOrderSchema.safeParse({
      tableId: null,
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty items array", () => {
    const result = createOrderSchema.safeParse({
      tableId: null,
      items: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("กรุณาเลือกเมนูอย่างน้อย 1 รายการ");
    }
  });

  it("rejects items array with more than 50 entries", () => {
    const items = Array.from({ length: 51 }, () => ({ ...validItem }));
    const result = createOrderSchema.safeParse({ tableId: null, items });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("สั่งได้สูงสุด 50 รายการต่อออเดอร์");
    }
  });

  it("rejects item quantity of 0", () => {
    const result = createOrderSchema.safeParse({
      tableId: null,
      items: [{ menuId: VALID_CUID, quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects item quantity above 99", () => {
    const result = createOrderSchema.safeParse({
      tableId: null,
      items: [{ menuId: VALID_CUID, quantity: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it("defaults discount to 0 when omitted", () => {
    const result = createOrderSchema.safeParse({
      tableId: null,
      items: [validItem],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discount).toBe(0);
    }
  });

  it("rejects negative discount", () => {
    const result = createOrderSchema.safeParse({
      tableId: null,
      items: [validItem],
      discount: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects note longer than 200 characters", () => {
    const result = createOrderSchema.safeParse({
      tableId: null,
      items: [validItem],
      note: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateOrderStatusSchema", () => {
  it.each(["pending", "preparing", "ready", "completed", "cancelled"])(
    "accepts valid status: %s",
    (status) => {
      const result = updateOrderStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  );

  it("rejects an unknown status", () => {
    const result = updateOrderStatusSchema.safeParse({ status: "shipped" });
    expect(result.success).toBe(false);
  });

  it("rejects missing status", () => {
    const result = updateOrderStatusSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
