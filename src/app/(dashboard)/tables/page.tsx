import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedStaff } from "@/lib/auth-helpers";
import { TableListClient } from "./_components/TableListClient";

export const metadata: Metadata = {
  title: "จัดการโต๊ะ — Cafe POS",
};

export default async function TablesPage() {
  const staff = await getAuthenticatedStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "admin") redirect("/orders");

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

  return <TableListClient tables={tables} />;
}
