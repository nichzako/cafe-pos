import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { withHandler } from "@/lib/route-handler";
import { successResponse } from "@/lib/api-response";
import { notFound, badRequest } from "@/lib/api-error";
import { updateTableSchema, updateTableStatusSchema } from "@/lib/validations/table";

type Context = { params: Promise<Record<string, string>> };

export const GET = withHandler(async (req: NextRequest, ctx: Context) => {
  await requireAuth(req);
  const { id } = await ctx.params;

  const table = await prisma.table.findUnique({ where: { id } });
  if (!table) throw notFound("ไม่พบโต๊ะนี้");
  return successResponse(table);
});

export const PATCH = withHandler(async (req: NextRequest, ctx: Context) => {
  const staff = await requireAuth(req);
  const { id } = await ctx.params;

  const existing = await prisma.table.findUnique({ where: { id } });
  if (!existing) throw notFound("ไม่พบโต๊ะนี้");

  const body = await req.json();

  // Status-only update — cashier/barista can update status (e.g. mark available after order)
  if ("status" in body && Object.keys(body).length === 1) {
    const { status } = updateTableStatusSchema.parse(body);
    const table = await prisma.table.update({ where: { id }, data: { status } });
    return successResponse(table);
  }

  // Full update — admin only
  requireRole(staff, "admin");
  const data = updateTableSchema.parse(body);

  const table = await prisma.table.update({ where: { id }, data });
  return successResponse(table);
});

export const DELETE = withHandler(async (req: NextRequest, ctx: Context) => {
  const staff = await requireAuth(req);
  requireRole(staff, "admin");
  const { id } = await ctx.params;

  const existing = await prisma.table.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  });
  if (!existing) throw notFound("ไม่พบโต๊ะนี้");
  if (existing._count.orders > 0) {
    throw badRequest("ไม่สามารถลบโต๊ะที่มีประวัติออเดอร์ได้");
  }

  await prisma.table.delete({ where: { id } });
  return successResponse({ id });
});
