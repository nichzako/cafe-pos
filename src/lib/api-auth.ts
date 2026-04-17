import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { forbidden, unauthorized } from "@/lib/api-error";
import type { UserRole } from "@/types";

export type AuthenticatedStaff = {
  id: string;
  authId: string;
  name: string;
  role: UserRole;
  isActive: boolean;
};

/**
 * Verifies the request has a valid Supabase session and returns the staff record.
 *
 * Throws:
 * - ApiError 401 — ไม่ได้ login หรือ session หมดอายุ
 * - ApiError 401 — ไม่พบ staff record ที่ตรงกับ session
 * - ApiError 403 — บัญชีถูกระงับ (isActive = false)
 *
 * @example
 * export const GET = withHandler(async (req) => {
 *   const staff = await requireAuth(req);
 *   requireRole(staff, "admin");
 *   // ...
 * });
 */
export async function requireAuth(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _req: Request
): Promise<AuthenticatedStaff> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw unauthorized();

  const staff = await prisma.staff.findUnique({
    where: { authId: user.id },
    select: { id: true, authId: true, name: true, role: true, isActive: true },
  });

  if (!staff) throw unauthorized("ไม่พบข้อมูลพนักงาน กรุณาติดต่อผู้ดูแลระบบ");
  if (!staff.isActive) throw forbidden("บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ");

  return staff as AuthenticatedStaff;
}

/**
 * Asserts the authenticated staff has the required role.
 * Throws ApiError 403 if role does not match.
 *
 * @example
 * const staff = await requireAuth(req);
 * requireRole(staff, "admin");                    // admin only
 * requireRole(staff, ["admin", "cashier"]);       // either role
 */
export function requireRole(
  staff: AuthenticatedStaff,
  role: UserRole | UserRole[]
): void {
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(staff.role)) {
    throw forbidden("ไม่มีสิทธิ์เข้าถึงส่วนนี้");
  }
}
