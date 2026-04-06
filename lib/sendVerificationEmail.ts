import nodemailer from "nodemailer";

/**
 * 发送注册验证码。优先使用 Brevo（SMTP API），其次回退到 SMTP，再回退到 Resend；
 * 开发环境未配置时仅在控制台打印验证码（并在 API 响应中带 debugCode 仅供本地联调）。
 */
export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<{ ok: true; via: "brevo" | "smtp" | "resend" | "dev" } | { ok: false; error: string }> {
  const html = `<p>您正在注册智序系统账号。</p><p>验证码：<strong style="font-size:18px">${code}</strong></p><p>10 分钟内有效，请勿告知他人。</p>`;

  const brevoKey = process.env.BREVO_API_KEY?.trim();
  const brevoFrom = process.env.BREVO_FROM?.trim();
  if (brevoKey && brevoFrom) {
    try {
      const sender = parseSender(brevoFrom);
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender,
          to: [{ email: to }],
          subject: "智序商业报价合同生成系统 — 注册验证码",
          htmlContent: html,
        }),
      });
      const text = await res.text();
      if (res.ok) return { ok: true, via: "brevo" };
      // Brevo 配了但不可用，继续回退到 Resend。
      console.warn(`[email] Brevo failed (${res.status}): ${text.slice(0, 300)}`);
    } catch (e) {
      console.warn(
        `[email] Brevo exception: ${e instanceof Error ? e.message : "unknown error"}`
      );
    }
  }

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpFrom = process.env.SMTP_FROM?.trim();
  if (smtpHost && smtpPort > 0 && smtpUser && smtpPass && smtpFrom) {
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
        subject: "智序商业报价合同生成系统 — 注册验证码",
        html,
      });
      return { ok: true, via: "smtp" };
    } catch (e) {
      console.warn(`[email] SMTP failed: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";

  if (!key) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[email dev] 验证码 → ${to} : ${code}`);
      return { ok: true, via: "dev" };
    }
    return {
      ok: false,
      error:
        "未配置可用邮件服务。请配置 BREVO_API_KEY+BREVO_FROM，或 SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM，或 RESEND_API_KEY+RESEND_FROM。",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "智序商业报价合同生成系统 — 注册验证码",
        html,
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: `邮件发送失败（Resend）：${text.slice(0, 220)}` };
    }
    return { ok: true, via: "resend" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "邮件发送异常" };
  }
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
