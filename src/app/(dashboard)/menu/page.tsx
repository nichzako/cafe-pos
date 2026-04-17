import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedStaff } from "@/lib/auth-helpers";
import { MenuListClient } from "./_components/MenuListClient";

export const metadata: Metadata = {
  title: "จัดการเมนู — Cafe POS",
};

export default async function MenuPage() {
  const staff = await getAuthenticatedStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "admin") redirect("/orders");

  const [categories, menus] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        isActive: true,
        _count: { select: { menus: true } },
      },
    }),
    prisma.menu.findMany({
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
    }),
  ]);

  const serialized = menus.map((m) => ({
    ...m,
    price: Number(m.price),
  }));

  return <MenuListClient categories={categories} menus={serialized} />;
}
