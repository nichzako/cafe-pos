import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { POSClient } from "./_components/POSClient";

export const metadata: Metadata = {
  title: "รับออเดอร์ — Cafe POS",
};

export default async function POSPage() {
  // Fetch all data in parallel — Server Component, no loading state needed
  const [categories, menus, tables] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { menus: { where: { isAvailable: true } } } },
      },
    }),
    prisma.menu.findMany({
      where: { isAvailable: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        isAvailable: true,
        categoryId: true,
      },
    }),
    prisma.table.findMany({
      where: { status: { not: "reserved" } },
      orderBy: { number: "asc" },
      select: { id: true, name: true, number: true },
    }),
  ]);

  // Serialize Decimal to number before passing to Client Component
  const serializedMenus = menus.map((m) => ({
    ...m,
    price: Number(m.price),
  }));

  return (
    <POSClient
      categories={categories}
      menus={serializedMenus}
      tables={tables}
    />
  );
}
