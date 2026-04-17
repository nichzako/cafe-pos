import { redirect } from "next/navigation";

/**
 * Root page — Middleware จะ redirect อัตโนมัติตาม session state:
 * - Authenticated   → /pos
 * - Unauthenticated → /login
 *
 * Redirect นี้เป็น fallback กรณี middleware ไม่ทำงาน
 */
export default function RootPage() {
  redirect("/login");
}
