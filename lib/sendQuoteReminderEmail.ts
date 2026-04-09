import nodemailer from "nodemailer";
import { ses } from "tencentcloud-sdk-nodejs-ses";

interface ReminderInput {
  to: string;
  quoteNo: string;
  customerName?: string;
  validUntil?: string;
  paymentLink?: string;
  customMessage?: string;
}

export async function sendQuoteReminderEmail(input: ReminderInput): Promise<
  { ok: true; via: "tencent-ses" | "smtp" | "dev" } | { ok: false; error: string }
> {
  const subject = `Payment reminder — Quote ${input.quoteNo}`;
  const customer = input.customerName?.trim() || "Customer";
  const validUntil = input.validUntil?.trim() || "N/A";
  const paymentLine = input.paymentLink
    ? `<p>Payment link: <a href="${input.paymentLink}">${input.paymentLink}</a></p>`
    : "<p>No payment link attached. Please reply to request one.</p>";
  const custom = input.customMessage?.trim();
  const html = [
    `<p>Hello ${customer},</p>`,
    `<p>This is a friendly reminder for quote <strong>${input.quoteNo}</strong>.</p>`,
    `<p>Valid until: <strong>${validUntil}</strong></p>`,
    paymentLine,
    custom ? `<p>${custom}</p>` : "",
    "<p>If payment has already been completed, please ignore this message. Thank you.</p>",
  ].join("");
  const text = `Hello ${customer}. Reminder for quote ${input.quoteNo}. Valid until: ${validUntil}. ${
    input.paymentLink ? `Payment link: ${input.paymentLink}` : "No payment link attached."
  } ${custom ? `Message: ${custom}` : ""}`;

  const failures: string[] = [];
  const tcId = process.env.TENCENT_SES_SECRET_ID?.trim() || process.env.TENCENTCLOUD_SECRET_ID?.trim();
  const tcKey = process.env.TENCENT_SES_SECRET_KEY?.trim() || process.env.TENCENTCLOUD_SECRET_KEY?.trim();
  const tcFrom = process.env.TENCENT_SES_FROM?.trim();
  const tcRegion = process.env.TENCENT_SES_REGION?.trim() || "ap-hongkong";
  if (tcId && tcKey && tcFrom) {
    try {
      const Client = ses.v20201002.Client;
      const client = new Client({ credential: { secretId: tcId, secretKey: tcKey }, region: tcRegion });
      await client.SendEmail({
        FromEmailAddress: tcFrom,
        Destination: [input.to],
        Subject: subject,
        Simple: {
          Html: Buffer.from(html, "utf-8").toString("base64"),
          Text: Buffer.from(text, "utf-8").toString("base64"),
        },
        TriggerType: 1,
        Unsubscribe: "0",
      });
      return { ok: true, via: "tencent-ses" };
    } catch (e) {
      failures.push(errMsg(e));
    }
  }

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT?.trim() || "587");
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpFrom = process.env.SMTP_FROM?.trim();
  if (smtpHost && smtpUser && smtpPass && smtpFrom) {
    try {
      const transport = nodemailer.createTransport({
        host: smtpHost,
        port: Number.isFinite(smtpPort) && smtpPort > 0 ? smtpPort : 587,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transport.sendMail({ from: smtpFrom, to: input.to, subject, html });
      return { ok: true, via: "smtp" };
    } catch (e) {
      failures.push(errMsg(e));
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.info(`[email dev] reminder → ${input.to} ${input.quoteNo}`);
    return { ok: true, via: "dev" };
  }
  if (failures.length > 0) {
    return { ok: false, error: `Failed to send reminder email. ${failures.join(" ")}` };
  }
  return {
    ok: false,
    error:
      "Email is not configured. Set Tencent SES envs or SMTP envs and redeploy.",
  };
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "unknown error";
  }
}
