import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { withHandler } from "@/lib/route-handler";
import { successResponse } from "@/lib/api-response";
import { notFound, conflict } from "@/lib/api-error";
import { updateCategorySchema } from "@/lib/validations/menu";

type Context = { params: Promise<Record<string, string>> };

export const GET = withHandler(async (req: NextRequest, ctx: Context) => {
  await requireAuth(req);
  const { id } = await ctx.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      menus: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, price: true, imageUrl: true, isAvailable: true },
      },
    },
  });

  if (!category) throw notFound("ไม่พบหมวดหมู่");
  return successResponse(category);
});

export const PATCH = withHandler(async (req: NextRequest, ctx: Context) => {
  const staff = await requireAuth(req);
  requireRole(staff, "admin");
  const { id } = await ctx.params;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw notFound("ไม่พบหมวดหมู่");

  const body = await req.json();
  const data = updateCategorySchema.parse(body);

  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.category.findFirst({ where: { name: data.name } });
    if (duplicate) throw conflict("ชื่อหมวดหมู่นี้มีอยู่แล้ว");
  }

  const category = await prisma.category.update({ where: { id }, data });
  return successResponse(category);
});

export const DELETE = withHandler(async (req: NextRequest, ctx: Context) => {
  const staff = await requireAuth(req);
  requireRole(staff, "admin");
  const { id } = await ctx.params;

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { menus: true } } },
  });
  if (!existing) throw notFound("ไม่พบหมวดหมู่");
  if (existing._count.menus > 0) {
    throw conflict("ไม่สามารถลบหมวดหมู่ที่มีเมนูอยู่ได้ กรุณาย้ายหรือลบเมนูก่อน");
  }

  await prisma.category.delete({ where: { id } });
  return successResponse({ id });
});
