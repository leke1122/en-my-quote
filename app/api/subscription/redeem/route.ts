import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Subscription } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { parseRedeemCodes } from "@/lib/redeemCodes";
import { COOKIE_NAME, verifySessionToken } from "@/lib/sessionJwt";

export const runtime = "nodejs";

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

/** Trial/expired/none: start from redeem date; active renew: extend end date, keep validFrom */
function computeRedeemWindow(
  sub: Subscription | null,
  now: Date,
  reward: { lifetime: boolean; days: number }
): { validFrom: Date; validUntil: Date | null } {
  if (reward.lifetime) {
    return { validFrom: now, validUntil: null };
  }

  const expiredOrNoEnd =
    !sub?.validUntil || sub.validUntil.getTime() <= now.getTime();
  const isTrial =
    !sub || sub.plan === "trial" || sub.plan === "unactivated";
  const startFresh = isTrial || expiredOrNoEnd;

  if (startFresh) {
    return {
      validFrom: now,
      validUntil: addDays(now, reward.days),
    };
  }

  const base =
    sub.validUntil && sub.validUntil.getTime() > now.getTime() ? sub.validUntil : now;
  return {
    validFrom: sub.validFrom ?? now,
    validUntil: addDays(base, reward.days),
  };
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: "Database is not configured." }, { status: 503 });
  }

  const rawCookie = cookies().get(COOKIE_NAME)?.value;
  const session = rawCookie ? await verifySessionToken(rawCookie) : null;
  if (!session) {
    return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = (await request.json()) as { code?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const code = String(body.code ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ ok: false, error: "Enter a redeem code." }, { status: 400 });
  }

  const table = parseRedeemCodes();
  if (table.size === 0) {
    return NextResponse.json(
      { ok: false, error: "No redeem codes configured (SUBSCRIPTION_REDEEM_CODES)." },
      { status: 503 }
    );
  }

  const reward = table.get(code);
  if (!reward) {
    return NextResponse.json({ ok: false, error: "Invalid or expired redeem code." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { subscription: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  const sub = user.subscription;
  const now = new Date();
  const plan = reward.plan || (reward.lifetime ? "lifetime" : "paid");
  const { validFrom, validUntil } = computeRedeemWindow(sub, now, reward);

  if (sub) {
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        plan,
        status: "active",
        validFrom,
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
        validFrom,
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
          validFrom: updated.subscription.validFrom?.toISOString() ?? null,
          validUntil: updated.subscription.validUntil?.toISOString() ?? null,
        }
      : null,
  });
}
