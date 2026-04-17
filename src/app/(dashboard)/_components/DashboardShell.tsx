"use client";

import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import type { UserRole } from "@/types";

type DashboardShellProps = {
  staffName: string;
  staffRole: UserRole;
  children: React.ReactNode;
};

export function DashboardShell({ staffName, staffRole, children }: DashboardShellProps) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-cafe-cream-50">
      <Sidebar
        staffName={staffName}
        staffRole={staffRole}
        onSignOut={handleSignOut}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
