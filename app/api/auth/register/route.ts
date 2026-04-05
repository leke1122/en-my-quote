import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { COOKIE_NAME, createSessionToken } from "@/lib/sessionJwt";
import { trialEndDate } from "@/lib/subscriptionLogic";

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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "邮箱格式不正确" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: "密码至少 8 位" }, { status: 400 });
  }

  const trialDays = Math.min(Math.max(Number(process.env.SUBSCRIPTION_TRIAL_DAYS) || 14, 1), 365);

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        subscription: {
          create: {
            plan: "trial",
            status: "active",
            validUntil: trialEndDate(trialDays),
            provider: "manual",
          },
        },
      },
      include: { subscription: true },
    });

    let token: string;
    try {
      token = await createSessionToken(user.id, user.email);
    } catch {
      await prisma.user.delete({ where: { id: user.id } });
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
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002";
    if (msg) {
      return NextResponse.json({ ok: false, error: "该邮箱已注册" }, { status: 409 });
    }
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "注册失败" },
      { status: 500 }
    );
  }
}
