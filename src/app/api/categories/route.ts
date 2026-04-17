import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { withHandler } from "@/lib/route-handler";
import { successResponse, createdResponse } from "@/lib/api-response";
import { conflict } from "@/lib/api-error";
import { createCategorySchema } from "@/lib/validations/menu";

export const GET = withHandler(async (req: NextRequest) => {
  await requireAuth(req);

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      sortOrder: true,
      isActive: true,
      _count: { select: { menus: { where: { isAvailable: true } } } },
    },
  });

  return successResponse(categories);
});

export const POST = withHandler(async (req: NextRequest) => {
  const staff = await requireAuth(req);
  requireRole(staff, "admin");

  const body = await req.json();
  const data = createCategorySchema.parse(body);

  const existing = await prisma.category.findFirst({ where: { name: data.name } });
  if (existing) {
    throw conflict("ชื่อหมวดหมู่นี้มีอยู่แล้ว");
  }

  const category = await prisma.category.create({ data });
  return createdResponse(category, `/api/categories/${category.id}`);
});
