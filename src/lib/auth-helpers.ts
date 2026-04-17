import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { AuthenticatedStaff } from "@/lib/api-auth";

/**
 * Auth helpers สำหรับ Server Components และ Server Actions
 *
 * ใช้ฟังก์ชันเหล่านี้ใน layout.tsx หรือ page.tsx ที่ต้องการ session
 * สำหรับ API routes ให้ใช้ requireAuth() จาก @/lib/api-auth แทน
 */

/** คืน Supabase user ปัจจุบัน หรือ null ถ้าไม่ได้ login */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * คืน staff record ที่ verify แล้ว หรือ null ถ้าไม่ได้ login / ไม่พบ / inactive
 *
 * Wrapped ด้วย React.cache() เพื่อให้ทุก Server Component ที่ call ฟังก์ชันนี้
 * ใน request เดียวกัน share Prisma query ร่วมกัน (ป้องกัน N+1)
 *
 * ใช้ใน Server Component layouts เพื่อ guard protected pages:
 * @example
 * const staff = await getAuthenticatedStaff();
 * if (!staff) redirect("/login");
 */
export const getAuthenticatedStaff = cache(async (): Promise<AuthenticatedStaff | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const staff = await prisma.staff.findUnique({
    where: { authId: user.id },
    select: { id: true, authId: true, name: true, role: true, isActive: true },
  });

  if (!staff || !staff.isActive) return null;

  return staff as AuthenticatedStaff;
});

/** Sign out ทั้ง server และ browser session */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
