import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { rateLimitCheck, requestIp } from "@/lib/authRateLimit";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: "Database is not configured." }, { status: 503 });
  }

  let body: { email?: string; code?: string; newPassword?: string };
  try {
    body = (await request.json()) as { email?: string; code?: string; newPassword?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
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
      { ok: false, error: `Too many attempts. Try again in ${rl.retryAfterSec} seconds.` },
      { status: 429 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "Enter the 6-digit verification code." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ ok: false, error: "Invalid or expired code. Request a new one." }, { status: 400 });
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
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true, message: "Password updated. Sign in with your new password." });
}

