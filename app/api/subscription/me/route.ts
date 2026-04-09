import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { COOKIE_NAME, verifySessionToken } from "@/lib/sessionJwt";
import { isSubscriptionActive } from "@/lib/subscriptionLogic";

export const runtime = "nodejs";

/** Current user's subscription snapshot (webhooks can update the same row) */
export async function GET() {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: "Database is not configured." }, { status: 503 });
  }

  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const session = await verifySessionToken(raw);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Session expired. Sign in again." }, { status: 401 });
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
