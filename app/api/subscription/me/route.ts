import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { COOKIE_NAME, verifySessionToken } from "@/lib/sessionJwt";
import { isSubscriptionActive } from "@/lib/subscriptionLogic";

export const runtime = "nodejs";

/** 当前登录用户的订阅快照（支付对接后可由 Webhook 更新同一张表） */
export async function GET() {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: "未配置数据库" }, { status: 503 });
  }

  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  const session = await verifySessionToken(raw);
  if (!session) {
    return NextResponse.json({ ok: false, error: "登录已失效" }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.userId },
  });

  if (!sub) {
    return NextResponse.json({ ok: true, subscription: null, active: false });
  }

  const active =
    sub.status === "active" && isSubscriptionActive(sub.validUntil, sub.plan);

  return NextResponse.json({
    ok: true,
    subscription: {
      plan: sub.plan,
      status: sub.status,
      validFrom: sub.validFrom?.toISOString() ?? null,
      validUntil: sub.validUntil?.toISOString() ?? null,
      createdAt: sub.createdAt.toISOString(),
      provider: sub.provider,
    },
    active,
  });
}
