import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getPrisma } from "@/lib/prisma";
import { COOKIE_NAME, verifySessionToken } from "@/lib/sessionJwt";

export default async function WechatPayLayout({ children }: { children: ReactNode }) {
  const cloudAuthEnabled = Boolean(
    process.env.DATABASE_URL?.trim() &&
      process.env.JWT_SECRET?.trim() &&
      process.env.JWT_SECRET.length >= 16
  );
  if (!cloudAuthEnabled) redirect("/login?redirect=%2Fpay%2Fwechat");

  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) redirect("/login?redirect=%2Fpay%2Fwechat");

  const session = await verifySessionToken(raw);
  if (!session) redirect("/login?redirect=%2Fpay%2Fwechat");

  const prisma = getPrisma();
  if (!prisma) redirect("/login?redirect=%2Fpay%2Fwechat");

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } });
  if (!user) redirect("/login?redirect=%2Fpay%2Fwechat");

  return <>{children}</>;
}

