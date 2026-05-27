import { test, expect } from "@playwright/test";

// ใช้ empty session ทั้ง file นี้ — ไม่ต้องการ auth
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentication", () => {
  test("login page แสดงฟอร์มครบ", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByLabel("อีเมล")).toBeVisible();
    await expect(page.getByLabel("รหัสผ่าน")).toBeVisible();
    await expect(page.getByRole("button", { name: "เข้าสู่ระบบ" })).toBeVisible();
  });

  test("redirect ไป /login เมื่อ access /pos โดยไม่ login", async ({ page }) => {
    await page.goto("/pos");
    await expect(page).toHaveURL("/login");
  });

  test("redirect ไป /login เมื่อ access /orders โดยไม่ login", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).toHaveURL("/login");
  });

  test("login ด้วย credentials ผิด แสดง error message", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#email", "notexist@cafe.test");
    await page.fill("#password", "wrongpassword123");
    await page.click('button[type="submit"]');

    // รอ error alert — Server Action อาจใช้เวลา
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
  });
});
