import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { withHandler } from "@/lib/route-handler";
import { successResponse } from "@/lib/api-response";
import { notFound, conflict } from "@/lib/api-error";
import { updateMenuSchema, toggleMenuAvailabilitySchema } from "@/lib/validations/menu";

type Context = { params: Promise<Record<string, string>> };

export const GET = withHandler(async (req: NextRequest, ctx: Context) => {
  await requireAuth(req);
  const { id } = await ctx.params;

  const menu = await prisma.menu.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });

  if (!menu) throw notFound("ไม่พบเมนูนี้");
  return successResponse(menu);
});

export const PATCH = withHandler(async (req: NextRequest, ctx: Context) => {
  const staff = await requireAuth(req);
  requireRole(staff, "admin");
  const { id } = await ctx.params;

  const existing = await prisma.menu.findUnique({ where: { id } });
  if (!existing) throw notFound("ไม่พบเมนูนี้");

  const body = await req.json();

  // Support both full update and toggle-availability shortcut
  const isToggle = Object.keys(body).length === 1 && "isAvailable" in body;
  const data = isToggle
    ? toggleMenuAvailabilitySchema.parse(body)
    : updateMenuSchema.parse(body);

  if ("name" in data && data.name && data.name !== existing.name) {
    const duplicate = await prisma.menu.findFirst({ where: { name: data.name } });
    if (duplicate) throw conflict("ชื่อเมนูนี้มีอยู่แล้ว");
  }

  const menu = await prisma.menu.update({
    where: { id },
    data,
    include: { category: { select: { id: true, name: true } } },
  });

  return successResponse(menu);
});

export const DELETE = withHandler(async (req: NextRequest, ctx: Context) => {
  const staff = await requireAuth(req);
  requireRole(staff, "admin");
  const { id } = await ctx.params;

  const existing = await prisma.menu.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!existing) throw notFound("ไม่พบเมนูนี้");

  if (existing._count.orderItems > 0) {
    // Soft delete — disable instead of hard delete to preserve order history
    await prisma.menu.update({ where: { id }, data: { isAvailable: false } });
    return successResponse({ id, softDeleted: true });
  }

  await prisma.menu.delete({ where: { id } });
  return successResponse({ id, softDeleted: false });
});
