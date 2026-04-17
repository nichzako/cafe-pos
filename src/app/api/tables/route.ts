import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { withHandler } from "@/lib/route-handler";
import { successResponse, createdResponse } from "@/lib/api-response";
import { conflict } from "@/lib/api-error";
import { createTableSchema } from "@/lib/validations/table";

export const GET = withHandler(async (req: NextRequest) => {
  await requireAuth(req);

  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
    select: {
      id: true,
      number: true,
      name: true,
      capacity: true,
      status: true,
    },
  });

  return successResponse(tables);
});

export const POST = withHandler(async (req: NextRequest) => {
  const staff = await requireAuth(req);
  requireRole(staff, "admin");

  const body = await req.json();
  const data = createTableSchema.parse(body);

  const existing = await prisma.table.findFirst({ where: { number: data.number } });
  if (existing) throw conflict(`โต๊ะหมายเลข ${data.number} มีอยู่แล้ว`);

  const table = await prisma.table.create({ data });
  return createdResponse(table, `/api/tables/${table.id}`);
});
