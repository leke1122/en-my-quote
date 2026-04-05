/**
 * 发送注册验证码。配置 RESEND_API_KEY 后通过 Resend 投递；
 * 开发环境未配置时仅在控制台打印验证码（并在 API 响应中带 debugCode 仅供本地联调）。
 */
export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<{ ok: true; via: "resend" | "dev" } | { ok: false; error: string }> {
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
        "未配置邮件服务（RESEND_API_KEY）。请在服务器环境变量中配置 Resend 或其它邮件服务后再启用邮箱注册。",
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
        html: `<p>您正在注册智序系统账号。</p><p>验证码：<strong style="font-size:18px">${code}</strong></p><p>10 分钟内有效，请勿告知他人。</p>`,
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: `邮件发送失败：${text.slice(0, 200)}` };
    }
    return { ok: true, via: "resend" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "邮件发送异常" };
  }
}
