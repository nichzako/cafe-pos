import { prisma } from "@/lib/prisma";

const PAD_LENGTH = 3;
// Bangkok is UTC+7
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

function nowInBangkok(): Date {
  return new Date(Date.now() + BANGKOK_OFFSET_MS);
}

function formatDateSegment(bangkokDate: Date): string {
  const y = bangkokDate.getUTCFullYear();
  const m = String(bangkokDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(bangkokDate.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function padSequence(n: number): string {
  return String(n).padStart(PAD_LENGTH, "0");
}

/** Returns UTC midnight at the start of the current Bangkok business day. */
function startOfBangkokDayInUtc(): Date {
  const now = nowInBangkok();
  const bangkokMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  return new Date(bangkokMidnight - BANGKOK_OFFSET_MS);
}

/**
 * Generates a human-readable order number in the format `ORD-YYYYMMDD-NNN`
 * using the Bangkok (UTC+7) business day.
 *
 * NOTE: This function uses a count-then-construct pattern. Under concurrent
 * requests two calls can receive the same number. The calling API route must
 * catch Prisma error code P2002 (unique constraint) and retry once.
 */
export async function generateOrderNumber(): Promise<string> {
  const bangkokNow = nowInBangkok();
  const prefix = `ORD-${formatDateSegment(bangkokNow)}-`;
  const startOfDay = startOfBangkokDayInUtc();

  const count = await prisma.order.count({
    where: { createdAt: { gte: startOfDay } },
  });

  return `${prefix}${padSequence(count + 1)}`;
}

/**
 * Generates a human-readable receipt number in the format `RCP-YYYYMMDD-NNN`
 * using the Bangkok (UTC+7) business day.
 *
 * NOTE: Same concurrency caveat as `generateOrderNumber` — caller must handle
 * P2002 and retry once.
 */
export async function generateReceiptNumber(): Promise<string> {
  const bangkokNow = nowInBangkok();
  const prefix = `RCP-${formatDateSegment(bangkokNow)}-`;
  const startOfDay = startOfBangkokDayInUtc();

  const count = await prisma.receipt.count({
    where: { createdAt: { gte: startOfDay } },
  });

  return `${prefix}${padSequence(count + 1)}`;
}
