import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getPrisma } from "@/lib/prisma";
import { COOKIE_NAME, verifySessionToken } from "@/lib/sessionJwt";

/**
 * 设置页路由级守卫：
 * - 云端账号启用时，未登录直接重定向到登录页（携带返回地址）
 * - 仅本地模式下不拦截，保留本地设置能力
 */
export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const cloudAuthEnabled = Boolean(
    process.env.DATABASE_URL?.trim() &&
      process.env.JWT_SECRET?.trim() &&
      process.env.JWT_SECRET.length >= 16
  );
  if (!cloudAuthEnabled) return <>{children}</>;

  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) redirect("/login?redirect=%2Fsettings");

  const session = await verifySessionToken(raw);
  if (!session) redirect("/login?redirect=%2Fsettings");

  const prisma = getPrisma();
  if (!prisma) return <>{children}</>;

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } });
  if (!user) redirect("/login?redirect=%2Fsettings");

  return <>{children}</>;
}

