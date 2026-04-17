/**
 * Prisma Client Singleton
 *
 * In development, Next.js hot-reload creates new module instances on every
 * file change. Without this singleton, each reload spawns a new PrismaClient
 * which exhausts the database connection pool quickly.
 *
 * Pattern: attach the client to `globalThis` so it survives module re-evaluation.
 * In production (Vercel), `NODE_ENV === "production"` so the cache is skipped —
 * each serverless function instance creates exactly one client for its lifetime.
 *
 * USAGE:   import { prisma } from "@/lib/prisma"
 * NEVER:   new PrismaClient()  ← causes connection pool exhaustion in dev
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
