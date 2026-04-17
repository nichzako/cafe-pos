/**
 * Omise server-side SDK wrapper.
 *
 * omise@1.1.x uses a callback-based API — this module wraps it in Promises
 * so all callers can use async/await consistently.
 *
 * SECURITY: This module is server-side only. Never import in client components.
 *   OMISE_SECRET_KEY must never be exposed to the browser.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const omiseLib = require("omise");

// ─── Types ────────────────────────────────────────────────────────────────────

export type OmiseCard = {
  id: string;
  last_digits: string;
  brand: string;
  name: string;
  expiration_month: number;
  expiration_year: number;
};

export type OmiseCharge = {
  id: string;
  object: "charge";
  status: "successful" | "failed" | "pending" | "reversed" | "expired";
  paid: boolean;
  amount: number; // in satang (THB × 100)
  currency: string;
  description: string | null;
  failure_code: string | null;
  failure_message: string | null;
  card: OmiseCard | null;
};

type OmiseCreateChargeParams = {
  amount: number; // in satang
  currency: string;
  card: string; // Omise token (tokn_...)
  description?: string;
};

type RawOmiseClient = {
  charges: {
    create: (
      params: OmiseCreateChargeParams,
      callback: (err: Error | null, resp: OmiseCharge) => void
    ) => void;
  };
};

export type OmiseClient = {
  charges: {
    create: (params: OmiseCreateChargeParams) => Promise<OmiseCharge>;
  };
};

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Returns a promise-wrapped Omise client.
 * Throws at call time if OMISE_SECRET_KEY is not set — fail fast.
 */
export function createOmiseClient(): OmiseClient {
  const secretKey = process.env.OMISE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "OMISE_SECRET_KEY is not configured. Card payments are unavailable."
    );
  }

  const raw: RawOmiseClient = omiseLib({
    secretKey,
    omiseVersion: "2019-05-29",
  });

  return {
    charges: {
      create: (params) =>
        new Promise<OmiseCharge>((resolve, reject) => {
          raw.charges.create(params, (err, resp) => {
            if (err) reject(err);
            else resolve(resp);
          });
        }),
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert THB amount (decimal) to satang integer required by Omise API. */
export function toSatang(thb: number): number {
  return Math.round(thb * 100);
}
