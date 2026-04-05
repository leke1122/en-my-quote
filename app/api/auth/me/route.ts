import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { COOKIE_NAME, verifySessionToken } from "@/lib/sessionJwt";

export const runtime = "nodejs";

export async function GET() {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: true, loggedIn: false, cloud: false });
  }

  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) {
    return NextResponse.json({ ok: true, loggedIn: false, cloud: true });
  }

  const session = await verifySessionToken(raw);
  if (!session) {
    return NextResponse.json({ ok: true, loggedIn: false, cloud: true });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { subscription: true },
  });

  if (!user) {
    return NextResponse.json({ ok: true, loggedIn: false, cloud: true });
  }

  return NextResponse.json({
    ok: true,
    loggedIn: true,
    cloud: true,
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
