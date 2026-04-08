import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { rateLimitCheck, requestIp } from "@/lib/authRateLimit";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { COOKIE_NAME, createSessionToken } from "@/lib/sessionJwt";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: "未配置数据库" }, { status: 503 });
  }

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "请求体无效" }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");

  const ip = requestIp(request);
  const rl = rateLimitCheck(`login:${ip}:${email}`, { max: 12, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: `尝试次数过多，请 ${rl.retryAfterSec} 秒后重试` },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ ok: false, error: "邮箱或密码错误" }, { status: 401 });
  }

  let token: string;
  try {
    token = await createSessionToken(user.id, user.email);
  } catch {
    return NextResponse.json({ ok: false, error: "JWT_SECRET 未正确配置" }, { status: 503 });
  }

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email },
    subscription: user.subscription
      ? {
          plan: user.subscription.plan,
          status: user.subscription.status,
          validUntil: user.subscription.validUntil?.toISOString() ?? null,
        }
      : null,
  });
}
