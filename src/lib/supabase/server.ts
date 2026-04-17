import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client — ใช้ใน Server Components, Server Actions, API Routes
 *
 * ต้อง await เสมอ เพราะ `cookies()` ใน Next.js 15 เป็น async
 * และต้อง create ใหม่ทุก request (ไม่ใช่ singleton เหมือน prisma)
 *
 * USAGE: const supabase = await createClient();
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ถูก call จาก Server Component — middleware จะ refresh session แทน
            // สามารถ ignore error นี้ได้ถ้า middleware ทำงานถูกต้อง
          }
        },
      },
    }
  );
}
