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

  let brevoFailHint: string | null = null;
  let smtpFailHint: string | null = null;

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
      brevoFailHint = `HTTP ${res.status} ${text.slice(0, 180).replace(/\s+/g, " ")}`;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      console.warn(`[email] Brevo exception: ${msg}`);
      brevoFailHint = msg.slice(0, 180);
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
        subject: "智序商业报价合同生成系统 — 注册验证码",
        html,
      });
      return { ok: true, via: "smtp" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      console.warn(`[email] SMTP failed: ${msg}`);
      smtpFailHint = msg.slice(0, 180);
    }
  }

  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";

  if (!key) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[email dev] 验证码 → ${to} : ${code}`);
      return { ok: true, via: "dev" };
    }
    const brevoOk = !!(brevoKey && brevoFrom);
    const smtpOk = !!(smtpHost && smtpUser && smtpPass && smtpFrom);
    if (brevoOk && smtpOk && (brevoFailHint || smtpFailHint)) {
      const parts = [
        "Brevo（HTTP API）与 SMTP 均已配置，但两次发送都未成功。",
        brevoFailHint ? `Brevo：${brevoFailHint}` : "Brevo：无响应详情",
        smtpFailHint ? `SMTP：${smtpFailHint}` : "SMTP：无响应详情",
        "请到 Vercel → 该部署 → Logs 搜索 [email] 查看完整返回。",
        "常见原因：发件域名未在 Brevo 验证、API Key 与发件人不匹配、SMTP 登录名需用 Brevo 提供的完整邮箱而非别名。",
        "也可配置 RESEND_API_KEY+RESEND_FROM 作为备用通道。",
      ];
      return { ok: false, error: parts.join(" ") };
    }
    const miss: string[] = [];
    if (!brevoKey || !brevoFrom) miss.push("BREVO_API_KEY+BREVO_FROM");
    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      miss.push("SMTP_HOST+SMTP_USER+SMTP_PASS+SMTP_FROM（SMTP_PORT 可选，默认 587）");
    }
    if (!process.env.RESEND_API_KEY?.trim()) miss.push("RESEND_API_KEY+RESEND_FROM");
    return {
      ok: false,
      error: `未配置可用邮件服务（或 Brevo/SMTP 发送失败且未配置 Resend）。请在 Vercel Production 检查：${miss.join("；")}。保存变量后务必 Redeploy。`,
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
