import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { rateLimitCheck, requestIp } from "@/lib/authRateLimit";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: "未配置数据库" }, { status: 503 });
  }

  let body: { email?: string; code?: string; newPassword?: string };
  try {
    body = (await request.json()) as { email?: string; code?: string; newPassword?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "请求体无效" }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const code = String(body.code ?? "").trim();
  const newPassword = String(body.newPassword ?? "");
  const ip = requestIp(request);
  const rl = rateLimitCheck(`reset:${ip}:${email}`, { max: 12, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: `尝试次数过多，请 ${rl.retryAfterSec} 秒后重试` },
      { status: 429 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "邮箱格式不正确" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "请输入 6 位数字验证码" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, error: "新密码至少 8 位" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ ok: false, error: "验证码错误或已过期，请重新获取" }, { status: 400 });
  }

  const row = await prisma.emailVerificationCode.findFirst({
    where: {
      email,
      code,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!row) {
    return NextResponse.json({ ok: false, error: "验证码错误或已过期，请重新获取" }, { status: 400 });
  }

  await prisma.emailVerificationCode.deleteMany({ where: { email } });
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true, message: "密码已重置，请使用新密码登录" });
}

