import type { OrderStatus } from "@prisma/client";

/**
 * Statuses that represent an order currently in progress.
 * Used in both the API route and Server Component to filter visible orders
 * for non-admin staff (cashier/barista).
 */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "preparing",
  "ready",
];
