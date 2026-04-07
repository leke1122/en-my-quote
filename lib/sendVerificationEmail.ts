import nodemailer from "nodemailer";
import { ses } from "tencentcloud-sdk-nodejs-ses";

const SUBJECT = "智序商业报价合同生成系统 — 注册验证码";

/**
 * 注册验证码发信：
 * 1）腾讯云邮件推送 HTTP API（个人认证无 SMTP 密码时用 SecretId/SecretKey）
 * 2）通用 SMTP（企业认证等已设置 SMTP 密码时）
 * 开发环境均未配置时仅在控制台打印验证码。
 */
export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<
  { ok: true; via: "tencent-ses" | "smtp" | "dev" } | { ok: false; error: string }
> {
  const html = `<p>您正在注册智序系统账号。</p><p>验证码：<strong style="font-size:18px">${code}</strong></p><p>10 分钟内有效，请勿告知他人。</p>`;
  const textPlain = `您正在注册智序系统账号。验证码：${code}，10 分钟内有效，请勿告知他人。`;

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
      await client.SendEmail({
        FromEmailAddress: tcFrom,
        Destination: [to],
        Subject: SUBJECT,
        Simple: {
          Html: Buffer.from(html, "utf-8").toString("base64"),
          Text: Buffer.from(textPlain, "utf-8").toString("base64"),
        },
        TriggerType: 1,
        Unsubscribe: "0",
      });
      return { ok: true, via: "tencent-ses" };
    } catch (e) {
      const msg = errMsg(e);
      console.warn(`[email] Tencent SES API failed: ${msg}`);
      failures.push(`腾讯云API：${msg.slice(0, 200)}`);
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
        subject: SUBJECT,
        html,
      });
      return { ok: true, via: "smtp" };
    } catch (e) {
      const msg = errMsg(e);
      console.warn(`[email] SMTP failed: ${msg}`);
      failures.push(`SMTP：${msg.slice(0, 200)}`);
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.info(`[email dev] 验证码 → ${to} : ${code}`);
    return { ok: true, via: "dev" };
  }

  const hasTencent = !!(tcId && tcKey && tcFrom);
  const hasSmtp = !!(smtpHost && smtpUser && smtpPass && smtpFrom);

  if ((hasTencent || hasSmtp) && failures.length > 0) {
    return {
      ok: false,
      error: `邮件发送失败。${failures.join(" ")} 若提示仅支持模板发信，需在腾讯云工单申请开通 Simple 发信或改用 SMTP（企业认证）。详见 Vercel Logs [email]。`,
    };
  }

  return {
    ok: false,
    error:
      "未配置邮件发送。个人认证请使用腾讯云 API：TENCENT_SES_SECRET_ID、TENCENT_SES_SECRET_KEY、TENCENT_SES_FROM（及可选 TENCENT_SES_REGION=ap-hongkong 或 ap-guangzhou）；或使用 SMTP：SMTP_HOST/SMTP_USER/SMTP_PASS/SMTP_FROM。也可用环境变量 TENCENTCLOUD_SECRET_ID / TENCENTCLOUD_SECRET_KEY。保存后 Redeploy。",
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
