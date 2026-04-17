import { describe, it, expect } from "vitest";
import { toSatang } from "@/lib/omise-client";

describe("toSatang", () => {
  it("converts whole THB to satang", () => {
    expect(toSatang(100)).toBe(10000);
  });

  it("converts fractional THB correctly", () => {
    expect(toSatang(85.5)).toBe(8550);
  });

  it("rounds floating-point imprecision", () => {
    // 0.1 + 0.2 = 0.30000000000000004 — should round to 30
    expect(toSatang(0.1 + 0.2)).toBe(30);
  });

  it("handles zero", () => {
    expect(toSatang(0)).toBe(0);
  });

  it("handles large amounts", () => {
    expect(toSatang(10000)).toBe(1000000);
  });
});
