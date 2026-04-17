import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client — ใช้ใน Client Components ('use client') เท่านั้น
 *
 * ต่างจาก server.ts ตรงที่ไม่ต้อง await และใช้ anon key เหมือนกัน
 * แต่รัน browser-side ดังนั้นเข้าถึง server-only resources ไม่ได้
 *
 * USAGE: const supabase = createClient(); // ไม่มี await
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
