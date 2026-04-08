import nodemailer from "nodemailer";
import { ses } from "tencentcloud-sdk-nodejs-ses";

export type VerificationEmailScene = "register" | "reset-password";

function subjectFor(scene: VerificationEmailScene): string {
  if (scene === "reset-password") return "智序商业报价合同生成系统 — 找回密码验证码";
  return "智序商业报价合同生成系统 — 注册验证码";
}

function contentFor(scene: VerificationEmailScene, code: string): { html: string; textPlain: string } {
  if (scene === "reset-password") {
    return {
      html: `<p>您正在找回智序系统账号密码。</p><p>验证码：<strong style="font-size:18px">${code}</strong></p><p>10 分钟内有效，请勿告知他人。</p>`,
      textPlain: `您正在找回智序系统账号密码。验证码：${code}，10 分钟内有效，请勿告知他人。`,
    };
  }
  return {
    html: `<p>您正在注册智序系统账号。</p><p>验证码：<strong style="font-size:18px">${code}</strong></p><p>10 分钟内有效，请勿告知他人。</p>`,
    textPlain: `您正在注册智序系统账号。验证码：${code}，10 分钟内有效，请勿告知他人。`,
  };
}

/**
 * 注册验证码发信：
 * 1）腾讯云邮件推送 HTTP API（SecretId/SecretKey；若账号仅允许模板发信，需配 TENCENT_SES_TEMPLATE_ID）
 * 2）通用 SMTP
 * 开发环境均未配置时仅在控制台打印验证码。
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
      failures.push(`腾讯云API：${msg.slice(0, 280)}`);
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
      failures.push(`SMTP：${msg.slice(0, 200)}`);
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.info(`[email dev] ${scene} code → ${to} : ${code}`);
    return { ok: true, via: "dev" };
  }

  const hasTencent = !!(tcId && tcKey && tcFrom);
  const hasSmtp = !!(smtpHost && smtpUser && smtpPass && smtpFrom);

  if ((hasTencent || hasSmtp) && failures.length > 0) {
    const hint = /模板|自定义发送|WithOutPermission/i.test(failures.join(""))
      ? " 请在腾讯云「邮件推送」新建邮件模板（正文用 {{code}} 占位），审核通过后把模板数字 ID 配到 Vercel 的 TENCENT_SES_TEMPLATE_ID；若变量名不是 code，请设置 TENCENT_SES_TEMPLATE_VAR_CODE。"
      : "";
    return {
      ok: false,
      error: `邮件发送失败。${failures.join(" ")}${hint} 详见 Vercel Logs [email]。`,
    };
  }

  return {
    ok: false,
    error:
      "未配置邮件发送。腾讯云需：TENCENT_SES_SECRET_ID、TENCENT_SES_SECRET_KEY、TENCENT_SES_FROM；若控制台仅支持模板发信，另加 TENCENT_SES_TEMPLATE_ID（及可选 TENCENT_SES_TEMPLATE_VAR_CODE）。或使用 SMTP_*。保存后 Redeploy。",
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
