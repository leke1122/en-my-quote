import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/sendVerificationEmail";

export const runtime = "nodejs";

function randomSixDigit(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: "服务端未配置数据库" }, { status: 503 });
  }

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "请求体无效" }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "邮箱格式不正确" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // 不暴露账号是否存在
    return NextResponse.json({ ok: true, message: "若该邮箱已注册，验证码将发送到邮箱（含垃圾邮件箱）" });
  }

  const latest = await prisma.emailVerificationCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < 60_000) {
    return NextResponse.json({ ok: false, error: "操作过于频繁，请稍后再试（60 秒）" }, { status: 429 });
  }

  const code = randomSixDigit();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.emailVerificationCode.deleteMany({ where: { email } });
  await prisma.emailVerificationCode.create({
    data: { email, code, expiresAt },
  });

  const sent = await sendVerificationEmail(email, code, "reset-password");
  if (!sent.ok) {
    await prisma.emailVerificationCode.deleteMany({ where: { email } });
    return NextResponse.json({ ok: false, error: sent.error }, { status: 503 });
  }

  const payload: Record<string, unknown> = {
    ok: true,
    message: "若该邮箱已注册，验证码将发送到邮箱（含垃圾邮件箱）",
  };
  if (sent.via === "dev" && process.env.NODE_ENV === "development") {
    payload.debugCode = code;
  }
  return NextResponse.json(payload);
}

