import { redirect } from "next/navigation";
import { getAuthenticatedStaff } from "@/lib/auth-helpers";
import { DashboardShell } from "./_components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getAuthenticatedStaff();

  if (!staff) {
    redirect("/login");
  }

  return (
    <DashboardShell staffName={staff.name} staffRole={staff.role}>
      {children}
    </DashboardShell>
  );
}
