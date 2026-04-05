import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { parseRedeemCodes } from "@/lib/redeemCodes";
import { COOKIE_NAME, verifySessionToken } from "@/lib/sessionJwt";

export const runtime = "nodejs";

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: "未配置数据库" }, { status: 503 });
  }

  const rawCookie = cookies().get(COOKIE_NAME)?.value;
  const session = rawCookie ? await verifySessionToken(rawCookie) : null;
  if (!session) {
    return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = (await request.json()) as { code?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "请求体无效" }, { status: 400 });
  }

  const code = String(body.code ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ ok: false, error: "请输入激活码" }, { status: 400 });
  }

  const table = parseRedeemCodes();
  if (table.size === 0) {
    return NextResponse.json(
      { ok: false, error: "服务端未配置可用激活码（SUBSCRIPTION_REDEEM_CODES）" },
      { status: 503 }
    );
  }

  const reward = table.get(code);
  if (!reward) {
    return NextResponse.json({ ok: false, error: "激活码无效或已失效" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { subscription: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "用户不存在" }, { status: 404 });
  }

  const sub = user.subscription;
  const now = new Date();

  let validUntil: Date | null;
  let plan: string;

  if (reward.lifetime) {
    validUntil = null;
    plan = reward.plan || "lifetime";
  } else {
    const base =
      sub?.validUntil && sub.validUntil.getTime() > now.getTime() ? sub.validUntil : now;
    validUntil = addDays(base, reward.days);
    plan = reward.plan || "paid";
  }

  if (sub) {
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        plan,
        status: "active",
        validUntil,
        provider: "redeem",
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan,
        status: "active",
        validUntil,
        provider: "redeem",
      },
    });
  }

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    include: { subscription: true },
  });

  return NextResponse.json({
    ok: true,
    subscription: updated?.subscription
      ? {
          plan: updated.subscription.plan,
          status: updated.subscription.status,
          validUntil: updated.subscription.validUntil?.toISOString() ?? null,
        }
      : null,
  });
}
