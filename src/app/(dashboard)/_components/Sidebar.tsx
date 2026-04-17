"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  UtensilsCrossed,
  ClipboardList,
  LayoutGrid,
  Users,
  LogOut,
} from "lucide-react";
import type { UserRole } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/pos",
    label: "รับออเดอร์",
    icon: <ShoppingCart className="h-5 w-5" />,
    roles: ["admin", "cashier"],
  },
  {
    href: "/orders",
    label: "ออเดอร์",
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ["admin", "cashier", "barista"],
  },
  {
    href: "/menu",
    label: "เมนู",
    icon: <UtensilsCrossed className="h-5 w-5" />,
    roles: ["admin"],
  },
  {
    href: "/tables",
    label: "โต๊ะ",
    icon: <LayoutGrid className="h-5 w-5" />,
    roles: ["admin"],
  },
  {
    href: "/staff",
    label: "พนักงาน",
    icon: <Users className="h-5 w-5" />,
    roles: ["admin"],
  },
];

type SidebarProps = {
  staffName: string;
  staffRole: UserRole;
  onSignOut: () => void;
};

export function Sidebar({ staffName, staffRole, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(staffRole));

  return (
    <aside className="flex h-full w-16 flex-col items-center gap-1 bg-cafe-brown-900 py-4 md:w-56 md:items-stretch md:px-3">
      {/* Logo */}
      <div className="mb-4 flex h-10 items-center justify-center md:justify-start md:px-2">
        <span className="text-xl" role="img" aria-label="cafe">☕</span>
        <span className="ml-2 hidden text-sm font-semibold text-cafe-cream-100 md:block">
          Cafe POS
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1" aria-label="เมนูหลัก">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex h-10 items-center justify-center rounded-xl transition-colors",
                "md:justify-start md:gap-3 md:px-3",
                isActive
                  ? "bg-cafe-brown-700 text-cafe-cream-100"
                  : "text-cafe-brown-400 hover:bg-cafe-brown-800 hover:text-cafe-cream-200",
              ].join(" ")}
            >
              {item.icon}
              <span className="hidden text-sm font-medium md:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Staff info + sign out */}
      <div className="mt-auto border-t border-cafe-brown-700 pt-3">
        <div className="hidden mb-2 px-2 md:block">
          <p className="text-xs font-medium text-cafe-cream-100 truncate">{staffName}</p>
          <p className="text-xs text-cafe-brown-400 capitalize">{staffRole}</p>
        </div>
        <button
          onClick={onSignOut}
          aria-label="ออกจากระบบ"
          className={[
            "flex h-10 w-full items-center justify-center rounded-xl transition-colors",
            "text-cafe-brown-400 hover:bg-cafe-brown-800 hover:text-red-400",
            "md:justify-start md:gap-3 md:px-3",
          ].join(" ")}
        >
          <LogOut className="h-5 w-5" />
          <span className="hidden text-sm md:block">ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
