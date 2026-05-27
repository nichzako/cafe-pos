import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "TEST_USER_EMAIL และ TEST_USER_PASSWORD ต้องระบุใน .env เพื่อรัน E2E tests"
    );
  }

  await page.goto("/login");
  await expect(page.getByLabel("อีเมล")).toBeVisible();

  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');

  await page.waitForURL("/pos", { timeout: 15_000 });
  await expect(page).toHaveURL("/pos");

  // บันทึก session ให้ tests อื่นใช้ซ้ำ
  await page.context().storageState({ path: authFile });
});
