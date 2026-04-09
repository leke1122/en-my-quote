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
    return NextResponse.json({ ok: false, error: "Database is not configured." }, { status: 503 });
  }

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");

  const ip = requestIp(request);
  const rl = rateLimitCheck(`login:${ip}:${email}`, { max: 12, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${rl.retryAfterSec} seconds.` },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
  }

  let token: string;
  try {
    token = await createSessionToken(user.id, user.email);
  } catch {
    return NextResponse.json({ ok: false, error: "JWT_SECRET is not configured correctly." }, { status: 503 });
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
