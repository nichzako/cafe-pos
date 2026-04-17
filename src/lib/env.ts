/**
 * Startup environment variable validation.
 *
 * Import this module once at the top of any server entrypoint to fail fast
 * with a clear error instead of a cryptic runtime crash when required env
 * vars are missing.
 *
 * USAGE: import "@/lib/env" — at the top of lib/prisma.ts, lib/supabase/server.ts, etc.
 */
import { z } from "zod";

const envSchema = z.object({
  // Database — required
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Supabase — required
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // Payment — optional (warn if missing)
  OMISE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_OMISE_PUBLIC_KEY: z.string().optional(),

  // Email — optional
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  ADMIN_EMAIL: z.string().email().optional(),

  // Cron — optional (required only in production)
  CRON_SECRET: z.string().optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");

    throw new Error(
      `\n[cafe-pos] Missing or invalid environment variables:\n${missing}\n\nSee .env.example for all required variables.\n`
    );
  }

  // Warn about optional-but-important keys in production
  if (process.env.NODE_ENV === "production") {
    const warnings: string[] = [];
    if (!result.data.OMISE_SECRET_KEY)
      warnings.push("OMISE_SECRET_KEY — card payments will be unavailable");
    if (!result.data.RESEND_API_KEY)
      warnings.push("RESEND_API_KEY — email notifications will be disabled");
    if (!result.data.CRON_SECRET)
      warnings.push("CRON_SECRET — cron endpoints will be unprotected");

    if (warnings.length > 0) {
      process.stderr.write(
        `[cafe-pos] Optional env vars not set:\n${warnings.map((w) => `  • ${w}`).join("\n")}\n`
      );
    }
  }

  return result.data;
}

export const env = validateEnv();
