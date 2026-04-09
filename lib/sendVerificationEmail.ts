import nodemailer from "nodemailer";
import { ses } from "tencentcloud-sdk-nodejs-ses";

export type VerificationEmailScene = "register" | "reset-password";

function subjectFor(scene: VerificationEmailScene): string {
  if (scene === "reset-password") return "My Quote — password reset code";
  return "My Quote — sign-up verification code";
}

function contentFor(scene: VerificationEmailScene, code: string): { html: string; textPlain: string } {
  if (scene === "reset-password") {
    return {
      html: `<p>You requested a password reset.</p><p>Your code: <strong style="font-size:18px">${code}</strong></p><p>Valid for 10 minutes. Do not share this code.</p>`,
      textPlain: `Password reset code: ${code}. Valid for 10 minutes. Do not share.`,
    };
  }
  return {
    html: `<p>You are creating an account.</p><p>Your code: <strong style="font-size:18px">${code}</strong></p><p>Valid for 10 minutes. Do not share this code.</p>`,
    textPlain: `Sign-up code: ${code}. Valid for 10 minutes. Do not share.`,
  };
}

/**
 * Sends verification email via:
 * 1) Tencent Cloud SES HTTP API (SecretId/SecretKey; template mode needs TENCENT_SES_TEMPLATE_ID)
 * 2) Generic SMTP
 * In development, logs the code to the console if neither is configured.
 */
export async function sendVerificationEmail(
  to: string,
  code: string,
  scene: VerificationEmailScene = "register"
): Promise<
  { ok: true; via: "tencent-ses" | "smtp" | "dev" } | { ok: false; error: string }
> {
  const subject = subjectFor(scene);
  const { html, textPlain } = contentFor(scene, code);

  const failures: string[] = [];

  const tcId =
    process.env.TENCENT_SES_SECRET_ID?.trim() ||
    process.env.TENCENTCLOUD_SECRET_ID?.trim();
  const tcKey =
    process.env.TENCENT_SES_SECRET_KEY?.trim() ||
    process.env.TENCENTCLOUD_SECRET_KEY?.trim();
  const tcFrom = process.env.TENCENT_SES_FROM?.trim();
  const tcRegion = process.env.TENCENT_SES_REGION?.trim() || "ap-hongkong";

  if (tcId && tcKey && tcFrom) {
    try {
      const Client = ses.v20201002.Client;
      const client = new Client({
        credential: { secretId: tcId, secretKey: tcKey },
        region: tcRegion,
      });

      const templateIdParsed = Number(process.env.TENCENT_SES_TEMPLATE_ID?.trim());
      const useTemplate =
        process.env.TENCENT_SES_TEMPLATE_ID?.trim() !== "" &&
        Number.isFinite(templateIdParsed) &&
        templateIdParsed > 0;

      if (useTemplate) {
        const varKey =
          process.env.TENCENT_SES_TEMPLATE_VAR_CODE?.trim() || "code";
        const templateData: Record<string, string> = { [varKey]: code };
        await client.SendEmail({
          FromEmailAddress: tcFrom,
          Destination: [to],
          Subject: subject,
          Template: {
            TemplateID: templateIdParsed,
            TemplateData: JSON.stringify(templateData),
          },
          TriggerType: 1,
          Unsubscribe: "0",
        });
      } else {
        await client.SendEmail({
          FromEmailAddress: tcFrom,
          Destination: [to],
          Subject: subject,
          Simple: {
            Html: Buffer.from(html, "utf-8").toString("base64"),
            Text: Buffer.from(textPlain, "utf-8").toString("base64"),
          },
          TriggerType: 1,
          Unsubscribe: "0",
        });
      }
      return { ok: true, via: "tencent-ses" };
    } catch (e) {
      const msg = errMsg(e);
      console.warn(`[email] Tencent SES API failed: ${msg}`);
      failures.push(`Tencent SES API: ${msg.slice(0, 280)}`);
    }
  }

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPortRaw = process.env.SMTP_PORT?.trim();
  const smtpPortParsed = smtpPortRaw ? Number(smtpPortRaw) : 587;
  const smtpPort =
    Number.isFinite(smtpPortParsed) && smtpPortParsed > 0 ? smtpPortParsed : 587;
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpFrom = process.env.SMTP_FROM?.trim();

  if (smtpHost && smtpUser && smtpPass && smtpFrom) {
    try {
      const transport = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transport.sendMail({
        from: smtpFrom,
        to,
        subject,
        html,
      });
      return { ok: true, via: "smtp" };
    } catch (e) {
      const msg = errMsg(e);
      console.warn(`[email] SMTP failed: ${msg}`);
      failures.push(`SMTP: ${msg.slice(0, 200)}`);
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.info(`[email dev] ${scene} code → ${to} : ${code}`);
    return { ok: true, via: "dev" };
  }

  const hasTencent = !!(tcId && tcKey && tcFrom);
  const hasSmtp = !!(smtpHost && smtpUser && smtpPass && smtpFrom);

  if ((hasTencent || hasSmtp) && failures.length > 0) {
    const hint = /模板|自定义发送|WithOutPermission|template|Template/i.test(failures.join(""))
      ? " In Tencent SES, create an approved template with a {{code}} placeholder, set TENCENT_SES_TEMPLATE_ID (and TENCENT_SES_TEMPLATE_VAR_CODE if the variable is not named code)."
      : "";
    return {
      ok: false,
      error: `Failed to send email. ${failures.join(" ")}${hint} Check server logs [email].`,
    };
  }

  return {
    ok: false,
    error:
      "Email is not configured. For Tencent SES set TENCENT_SES_SECRET_ID, TENCENT_SES_SECRET_KEY, TENCENT_SES_FROM; add TENCENT_SES_TEMPLATE_ID if your account requires templates (optional TENCENT_SES_TEMPLATE_VAR_CODE). Or set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM. Redeploy after changes.",
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
