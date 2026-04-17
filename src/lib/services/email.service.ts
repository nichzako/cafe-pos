/**
 * Email service — ส่ง email ผ่าน Resend
 *
 * ทุกฟังก์ชันใช้ pattern เดียวกัน: ถ้า RESEND_API_KEY ไม่ได้ set
 * จะ log warning แต่ไม่ throw error (email เป็น optional feature)
 */
import { Resend } from "resend";
import { render } from "@react-email/components";
import { ReceiptEmail } from "@/emails/ReceiptEmail";
import { DailyReportEmail } from "@/emails/DailyReportEmail";
import type { ReceiptData } from "@/types";
import type { DailyReportData } from "@/emails/DailyReportEmail";

// ─── Client ───────────────────────────────────────────────────────────────────

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    process.stderr.write(
      "[email] RESEND_API_KEY not set — email notifications disabled\n"
    );
    return null;
  }
  return new Resend(apiKey);
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "receipt@cafe-pos.example.com";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

// ─── Public API ───────────────────────────────────────────────────────────────

export type EmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: string };

/**
 * ส่งใบเสร็จให้ลูกค้าทาง email
 * (เรียกใช้ได้เฉพาะเมื่อลูกค้าให้ email มา)
 */
export async function sendReceiptEmail(
  toEmail: string,
  receipt: ReceiptData
): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY not configured" };

  const shopName = process.env.NEXT_PUBLIC_APP_NAME ?? "Cafe POS";

  try {
    const html = await render(ReceiptEmail({ receipt }));
    const { data, error } = await resend.emails.send({
      from: `${shopName} <${FROM_EMAIL}>`,
      to: [toEmail],
      subject: `ใบเสร็จ ${receipt.receiptNumber} — ${shopName}`,
      html,
    });

    if (error) {
      process.stderr.write(`[email] sendReceiptEmail failed: ${error.message}\n`);
      return { sent: false, reason: error.message };
    }

    return { sent: true, id: data?.id ?? "unknown" };
  } catch (err) {
    process.stderr.write(`[email] sendReceiptEmail error: ${String(err)}\n`);
    return { sent: false, reason: String(err) };
  }
}

/**
 * ส่งรายงานประจำวันให้ admin
 * เรียกใช้จาก cron job /api/cron/daily-report
 */
export async function sendDailyReport(
  report: DailyReportData
): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY not configured" };

  if (!ADMIN_EMAIL) {
    return { sent: false, reason: "ADMIN_EMAIL not configured" };
  }

  const shopName = process.env.NEXT_PUBLIC_APP_NAME ?? "Cafe POS";

  try {
    const html = await render(DailyReportEmail({ report }));
    const { data, error } = await resend.emails.send({
      from: `${shopName} <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `รายงานยอดขาย ${report.date} — ${shopName}`,
      html,
    });

    if (error) {
      process.stderr.write(`[email] sendDailyReport failed: ${error.message}\n`);
      return { sent: false, reason: error.message };
    }

    return { sent: true, id: data?.id ?? "unknown" };
  } catch (err) {
    process.stderr.write(`[email] sendDailyReport error: ${String(err)}\n`);
    return { sent: false, reason: String(err) };
  }
}
