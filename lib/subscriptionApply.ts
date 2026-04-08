import type { Prisma, PrismaClient, Subscription } from "@prisma/client";

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

/** 顺延规则：有效期内续费 -> 从 validUntil 顺延；否则从现在起算。试用/未激活也从现在起算。 */
function computeExtendWindow(
  sub: Subscription | null,
  now: Date,
  reward: { lifetime: boolean; days: number }
): { validFrom: Date; validUntil: Date | null } {
  if (reward.lifetime) return { validFrom: now, validUntil: null };

  const expiredOrNoEnd = !sub?.validUntil || sub.validUntil.getTime() <= now.getTime();
  const isTrial = !sub || sub.plan === "trial" || sub.plan === "unactivated" || sub.status !== "active";
  const startFresh = isTrial || expiredOrNoEnd;

  if (startFresh) {
    return { validFrom: now, validUntil: addDays(now, reward.days) };
  }

  const base = sub.validUntil && sub.validUntil.getTime() > now.getTime() ? sub.validUntil : now;
  return { validFrom: sub.validFrom ?? now, validUntil: addDays(base, reward.days) };
}

export async function applySubscriptionExtension(
  prisma: PrismaClient | Prisma.TransactionClient,
  userId: string,
  info: { plan: string; lifetime: boolean; addDays: number; provider: string; externalId?: string | null }
): Promise<{ ok: true; validFrom: Date; validUntil: Date | null } | { ok: false; error: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } });
  if (!user) return { ok: false, error: "用户不存在" };

  const now = new Date();
  const { validFrom, validUntil } = computeExtendWindow(user.subscription, now, {
    lifetime: info.lifetime,
    days: info.addDays,
  });

  if (user.subscription) {
    await prisma.subscription.update({
      where: { userId },
      data: {
        plan: info.plan,
        status: "active",
        validFrom,
        validUntil,
        provider: info.provider,
        externalId: info.externalId ?? undefined,
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId,
        plan: info.plan,
        status: "active",
        validFrom,
        validUntil,
        provider: info.provider,
        externalId: info.externalId ?? undefined,
      },
    });
  }

  return { ok: true, validFrom, validUntil };
}

