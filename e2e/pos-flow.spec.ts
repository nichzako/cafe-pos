import { test, expect } from "@playwright/test";

// ทุก test ใน file นี้ใช้ storageState จาก auth.setup (inject ผ่าน playwright.config.ts)

test.describe("POS — golden path", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pos");
    // รอให้ menu grid โหลดเสร็จ (ไม่ใช่ skeleton แล้ว)
    await expect(
      page.getByRole("button", { name: /^เพิ่ม / }).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("หน้า POS แสดง layout ครบ — menu grid + order panel", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "รายการสั่ง" })).toBeVisible();
    await expect(page.getByText("ยังไม่มีรายการ")).toBeVisible();
    await expect(page.locator("#table-select")).toBeVisible();
  });

  test("เพิ่มเมนูลงตะกร้า — แสดงในรายการสั่ง", async ({ page }) => {
    const firstMenu = page.getByRole("button", { name: /^เพิ่ม / }).first();
    const menuName = (await firstMenu.getAttribute("aria-label"))
      ?.replace("เพิ่ม ", "")
      .split(" ราคา")[0];

    await firstMenu.click();

    // ตะกร้าต้องไม่ empty อีกต่อไป
    await expect(page.getByRole("list", { name: "รายการในออเดอร์" })).toBeVisible();
    await expect(page.getByText("ยังไม่มีรายการ")).not.toBeVisible();

    // ปุ่มส่งออเดอร์ปรากฏ
    await expect(page.getByRole("button", { name: /ส่งออเดอร์/ })).toBeVisible();

    // menu card แสดง indicator ว่าอยู่ในตะกร้าแล้ว (aria-pressed=true)
    if (menuName) {
      await expect(
        page.getByRole("button", { name: new RegExp(`เพิ่ม ${menuName}`) })
      ).toHaveAttribute("aria-pressed", "true");
    }
  });

  test("ล้างตะกร้า — กลับสู่ empty state", async ({ page }) => {
    await page.getByRole("button", { name: /^เพิ่ม / }).first().click();
    await expect(page.getByRole("list", { name: "รายการในออเดอร์" })).toBeVisible();

    await page.getByRole("button", { name: "ล้างรายการทั้งหมด" }).click();

    await expect(page.getByText("ยังไม่มีรายการ")).toBeVisible();
    await expect(page.getByRole("button", { name: /ส่งออเดอร์/ })).not.toBeVisible();
  });

  test("ส่งออเดอร์ → redirect ไปหน้า order detail", async ({ page }) => {
    // เพิ่มเมนูอย่างน้อย 1 รายการ
    await page.getByRole("button", { name: /^เพิ่ม / }).first().click();
    await expect(page.getByRole("button", { name: /ส่งออเดอร์/ })).toBeVisible();

    await page.getByRole("button", { name: /ส่งออเดอร์/ }).click();

    // redirect ไปหน้า order detail
    await page.waitForURL(/\/orders\/.+/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/orders\/.+/);
  });
});

test.describe("POS — payment flow", () => {
  let orderId: string;

  test.beforeAll(async ({ browser }) => {
    // สร้าง order ผ่าน POS ก่อน แล้วเก็บ orderId สำหรับ payment tests
    const page = await browser.newPage();
    await page.goto("/pos");
    await expect(
      page.getByRole("button", { name: /^เพิ่ม / }).first()
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /^เพิ่ม / }).first().click();
    await page.getByRole("button", { name: /ส่งออเดอร์/ }).click();
    await page.waitForURL(/\/orders\/.+/, { timeout: 15_000 });

    orderId = page.url().split("/orders/")[1];
    await page.close();
  });

  test("หน้า order detail แสดงข้อมูลออเดอร์และปุ่มชำระเงิน", async ({ page }) => {
    await page.goto(`/orders/${orderId}`);

    // แสดงรายการในออเดอร์
    await expect(page.getByRole("heading", { name: /ออเดอร์/ })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("ชำระเงินด้วย Mockup → redirect ไปหน้า receipt", async ({ page }) => {
    await page.goto(`/orders/${orderId}`);

    // เปิด Payment Modal
    const payButton = page.getByRole("button", { name: /ชำระเงิน/ });
    await expect(payButton).toBeVisible({ timeout: 10_000 });
    await payButton.click();

    // เลือก Mockup payment (ใช้ ENABLE_MOCKUP_GATEWAY=true)
    const mockupTab = page.getByRole("tab", { name: /ทดสอบ|mockup/i });
    if (await mockupTab.isVisible()) {
      await mockupTab.click();
    }

    const confirmButton = page.getByRole("button", { name: /ยืนยัน|ชำระ|confirm/i });
    await expect(confirmButton).toBeVisible({ timeout: 5_000 });
    await confirmButton.click();

    // redirect ไปหน้า receipt
    await page.waitForURL(/\/orders\/.+\/receipt/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/orders\/.+\/receipt/);
  });
});
