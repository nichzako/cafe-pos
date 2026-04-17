import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { withHandler } from "@/lib/route-handler";
import { successResponse } from "@/lib/api-response";
import { notFound, badRequest } from "@/lib/api-error";
import { updateStaffSchema } from "@/lib/validations/staff";

type Context = { params: Promise<Record<string, string>> };

const STAFF_SELECT = {
  id: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export const GET = withHandler(async (req: NextRequest, ctx: Context) => {
  const requestor = await requireAuth(req);
  requireRole(requestor, "admin");
  const { id } = await ctx.params;

  const member = await prisma.staff.findUnique({
    where: { id },
    select: STAFF_SELECT,
  });
  if (!member) throw notFound("ไม่พบพนักงานนี้");
  return successResponse(member);
});

export const PATCH = withHandler(async (req: NextRequest, ctx: Context) => {
  const requestor = await requireAuth(req);
  requireRole(requestor, "admin");

  const { id } = await ctx.params;

  const existing = await prisma.staff.findUnique({ where: { id } });
  if (!existing) throw notFound("ไม่พบพนักงานนี้");

  const body = await req.json();
  const data = updateStaffSchema.parse(body);

  // Prevent admin from deactivating their own account
  if (id === requestor.id && data.isActive === false) {
    throw badRequest("ไม่สามารถปิดการใช้งานบัญชีของตัวเองได้");
  }

  const updated = await prisma.staff.update({
    where: { id },
    data,
    select: STAFF_SELECT,
  });

  return successResponse(updated);
});

export const DELETE = withHandler(async (req: NextRequest, ctx: Context) => {
  const requestor = await requireAuth(req);
  requireRole(requestor, "admin");
  const { id } = await ctx.params;

  // Prevent admin from deleting their own account
  if (id === requestor.id) {
    throw badRequest("ไม่สามารถลบบัญชีของตัวเองได้");
  }

  const existing = await prisma.staff.findUnique({
    where: { id },
    include: { _count: { select: { orders: true, payments: true } } },
  });
  if (!existing) throw notFound("ไม่พบพนักงานนี้");

  // Preserve data integrity: deactivate instead of hard delete if staff has order history
  if (existing._count.orders > 0 || existing._count.payments > 0) {
    throw badRequest("ไม่สามารถลบพนักงานที่มีประวัติออเดอร์ได้ — ปิดการใช้งานแทน");
  }

  await prisma.staff.delete({ where: { id } });
  return successResponse({ id });
});
