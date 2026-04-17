/**
 * GET /api/staff — List all staff members (admin only)
 *
 * NOTE: Staff creation (POST) is intentionally omitted here.
 * Creating a staff account requires:
 *   1. Inviting the user via Supabase Auth (creates auth user + sends invite email)
 *   2. The auth trigger/webhook then creates the Staff record with the returned authId
 * This two-step flow cannot be collapsed into a single API route without exposing
 * SUPABASE_SERVICE_ROLE_KEY logic here — keep it in the auth layer instead.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { withHandler } from "@/lib/route-handler";
import { successResponse } from "@/lib/api-response";

export const GET = withHandler(async (req: NextRequest) => {
  const staff = await requireAuth(req);
  requireRole(staff, "admin");

  const members = await prisma.staff.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    take: 200,
  });

  return successResponse(members);
});
