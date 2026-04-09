/**
 * Email verification registration (requires POST /api/auth/email/send-code first).
 * The register page currently uses POST /api/auth/register; keep this route for future email-code flows.
 */
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { rateLimitCheck, requestIp } from "@/lib/authRateLimit";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { COOKIE_NAME, createSessionToken } from "@/lib/sessionJwt";
import { REGISTRATION_SUBSCRIPTION_CREATE } from "@/lib/initialSubscriptionRegistration";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: "Database is not configured." }, { status: 503 });
  }

  let body: { email?: string; password?: string; code?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string; code?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");
  const code = String(body.code ?? "").trim();
  const ip = requestIp(request);
  const rl = rateLimitCheck(`register-email:${ip}:${email}`, { max: 12, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${rl.retryAfterSec} seconds.` },
      { status: 429 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "Enter the 6-digit verification code." }, { status: 400 });
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
    return NextResponse.json({ ok: false, error: "Invalid or expired code. Request a new one." }, { status: 400 });
  }

  await prisma.emailVerificationCode.deleteMany({ where: { email } });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        subscription: {
          create: { ...REGISTRATION_SUBSCRIPTION_CREATE },
        },
      },
      include: { subscription: true },
    });

    let token: string;
    try {
      token = await createSessionToken(user.id, user.email);
    } catch {
      await prisma.user.delete({ where: { id: user.id } });
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
            validFrom: user.subscription.validFrom?.toISOString() ?? null,
            validUntil: user.subscription.validUntil?.toISOString() ?? null,
          }
        : null,
    });
  } catch (e: unknown) {
    const dup = e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002";
    if (dup) {
      return NextResponse.json({ ok: false, error: "This email is already registered." }, { status: 409 });
    }
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Registration failed." },
      { status: 500 }
    );
  }
}
