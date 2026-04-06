import nodemailer from "nodemailer";

const SUBJECT = "智序商业报价合同生成系统 — 注册验证码";

/**
 * 发送注册验证码。依次尝试：SendGrid（HTTP API）→ SMTP；
 * 开发环境未配置时仅在控制台打印验证码（并在 API 响应中带 debugCode 仅供本地联调）。
 */
export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<{ ok: true; via: "sendgrid" | "smtp" | "dev" } | { ok: false; error: string }> {
  const html = `<p>您正在注册智序系统账号。</p><p>验证码：<strong style="font-size:18px">${code}</strong></p><p>10 分钟内有效，请勿告知他人。</p>`;

  const failures: string[] = [];

  const sendgridKey = process.env.SENDGRID_API_KEY?.trim();
  const sendgridFrom = process.env.SENDGRID_FROM?.trim();
  if (sendgridKey && sendgridFrom) {
    try {
      const sender = parseSender(sendgridFrom);
      const from = sender.name
        ? { email: sender.email, name: sender.name }
        : { email: sender.email };
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from,
          subject: SUBJECT,
          content: [{ type: "text/html", value: html }],
        }),
      });
      const text = await res.text();
      if (res.status === 202 || res.ok) return { ok: true, via: "sendgrid" };
      console.warn(`[email] SendGrid failed (${res.status}): ${text.slice(0, 300)}`);
      failures.push(`SendGrid：HTTP ${res.status} ${text.slice(0, 160).replace(/\s+/g, " ")}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      console.warn(`[email] SendGrid exception: ${msg}`);
      failures.push(`SendGrid：${msg.slice(0, 160)}`);
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
      const msg = e instanceof Error ? e.message : "unknown error";
      console.warn(`[email] SMTP failed: ${msg}`);
      failures.push(`SMTP：${msg.slice(0, 160)}`);
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.info(`[email dev] 验证码 → ${to} : ${code}`);
    return { ok: true, via: "dev" };
  }

  const hasAny =
    !!(sendgridKey && sendgridFrom) ||
    !!(smtpHost && smtpUser && smtpPass && smtpFrom);

  if (hasAny && failures.length > 0) {
    return {
      ok: false,
      error: `邮件发送失败（已按顺序尝试已配置的通道）。${failures.join(" ")} 请到 Vercel Logs 搜索 [email] 查看详情。`,
    };
  }

  return {
    ok: false,
    error:
      "未配置可用邮件服务。请配置 SENDGRID_API_KEY+SENDGRID_FROM，或 SMTP_HOST/SMTP_USER/SMTP_PASS/SMTP_FROM（SMTP_PORT 可选，默认 587）。保存后 Redeploy。",
  };
}

function parseSender(raw: string): { email: string; name?: string } {
  const m = raw.match(/^\s*([^<]+?)\s*<([^>]+)>\s*$/);
  if (m) {
    const name = m[1].trim();
    const email = m[2].trim();
    return name ? { name, email } : { email };
  }
  return { email: raw.trim() };
}
