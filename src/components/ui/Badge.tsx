import type { OrderStatus, TableStatus } from "@/types";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-cafe-brown-100 text-cafe-brown-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-gray-100 text-gray-600",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

// ─── Order Status Badge ───────────────────────────────────────────────────────

const orderStatusConfig: Record<
  OrderStatus,
  { label: string; variant: BadgeVariant }
> = {
  pending: { label: "รอดำเนินการ", variant: "warning" },
  preparing: { label: "กำลังเตรียม", variant: "info" },
  ready: { label: "พร้อมเสิร์ฟ", variant: "success" },
  completed: { label: "เสร็จสิ้น", variant: "neutral" },
  cancelled: { label: "ยกเลิก", variant: "error" },
};

export function OrderStatusBadge({
  status,
  size,
}: {
  status: OrderStatus;
  size?: "sm" | "md";
}) {
  const { label, variant } = orderStatusConfig[status];
  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}

// ─── Table Status Badge ───────────────────────────────────────────────────────

const tableStatusConfig: Record<
  TableStatus,
  { label: string; variant: BadgeVariant }
> = {
  available: { label: "ว่าง", variant: "success" },
  occupied: { label: "มีลูกค้า", variant: "warning" },
  reserved: { label: "จอง", variant: "info" },
};

export function TableStatusBadge({
  status,
  size,
}: {
  status: TableStatus;
  size?: "sm" | "md";
}) {
  const { label, variant } = tableStatusConfig[status];
  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}
