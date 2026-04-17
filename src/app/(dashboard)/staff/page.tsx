import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedStaff } from "@/lib/auth-helpers";
import { StaffListClient } from "./_components/StaffListClient";

export const metadata: Metadata = {
  title: "จัดการพนักงาน — Cafe POS",
};

export default async function StaffPage() {
  const staff = await getAuthenticatedStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "admin") redirect("/orders");

  const members = await prisma.staff.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  const serialized = members.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return <StaffListClient members={serialized} currentStaffId={staff.id} />;
}
