import { describe, it, expect } from "vitest";
import {
  cashPaymentSchema,
  cardPaymentSchema,
} from "@/lib/validations/payment";

const VALID_CUID = "clh3m7k0z0000qwer1234abcd";

describe("cashPaymentSchema", () => {
  it("accepts valid cash payment", () => {
    const result = cashPaymentSchema.safeParse({
      orderId: VALID_CUID,
      amountTendered: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amountTendered", () => {
    const result = cashPaymentSchema.safeParse({
      orderId: VALID_CUID,
      amountTendered: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amountTendered", () => {
    const result = cashPaymentSchema.safeParse({
      orderId: VALID_CUID,
      amountTendered: -50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric amountTendered", () => {
    const result = cashPaymentSchema.safeParse({
      orderId: VALID_CUID,
      amountTendered: "100",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid orderId format", () => {
    const result = cashPaymentSchema.safeParse({
      orderId: "not-a-cuid",
      amountTendered: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe("cardPaymentSchema", () => {
  it("accepts valid card payment with tokn_ prefix", () => {
    const result = cardPaymentSchema.safeParse({
      orderId: VALID_CUID,
      omiseToken: "tokn_test_abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects token without tokn_ prefix", () => {
    const result = cardPaymentSchema.safeParse({
      orderId: VALID_CUID,
      omiseToken: "card_test_abc123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("token บัตรไม่ถูกต้อง");
    }
  });

  it("rejects empty omiseToken", () => {
    const result = cardPaymentSchema.safeParse({
      orderId: VALID_CUID,
      omiseToken: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing omiseToken", () => {
    const result = cardPaymentSchema.safeParse({
      orderId: VALID_CUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid orderId format", () => {
    const result = cardPaymentSchema.safeParse({
      orderId: "bad-id",
      omiseToken: "tokn_test_abc123",
    });
    expect(result.success).toBe(false);
  });
});
