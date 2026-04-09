import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getPrisma } from "@/lib/prisma";
import { COOKIE_NAME, verifySessionToken } from "@/lib/sessionJwt";

/**
 * Settings layout guard:
 * - With cloud auth, redirect anonymous users to login (return URL)
 * - Local-only mode does not block
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

