import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { withHandler } from "@/lib/route-handler";
import { successResponse, createdResponse } from "@/lib/api-response";
import { conflict, notFound } from "@/lib/api-error";
import { createMenuSchema } from "@/lib/validations/menu";

export const GET = withHandler(async (req: NextRequest) => {
  await requireAuth(req);

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  // ?available=all → show all menus (admin), default → available only (POS)
  const showAll = searchParams.get("available") === "all";
  const availableOnly = !showAll;

  const menus = await prisma.menu.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(availableOnly ? { isAvailable: true } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      imageUrl: true,
      isAvailable: true,
      sortOrder: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
    },
  });

  return successResponse(menus);
});

export const POST = withHandler(async (req: NextRequest) => {
  const staff = await requireAuth(req);
  requireRole(staff, "admin");

  const body = await req.json();
  const data = createMenuSchema.parse(body);

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) throw notFound("ไม่พบหมวดหมู่ที่เลือก");

  const existing = await prisma.menu.findFirst({ where: { name: data.name } });
  if (existing) throw conflict("ชื่อเมนูนี้มีอยู่แล้ว");

  const menu = await prisma.menu.create({
    data: { ...data, price: data.price },
    include: { category: { select: { id: true, name: true } } },
  });

  return createdResponse(menu, `/api/menus/${menu.id}`);
});
