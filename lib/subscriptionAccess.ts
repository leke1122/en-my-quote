import { isSubscriptionActive } from "@/lib/subscriptionLogic";
import { describePlan } from "@/lib/subscriptionPlanDisplay";

/** 与 /api/auth/me 中 subscription 字段一致 */
export type MeSubscription = {
  plan: string;
  status: string;
  validUntil: string | null;
  validFrom?: string | null;
  createdAt?: string;
};

/** 与 Stripe/Webhook 约定的 status 一致：仅 active 且未过期视为有权使用付费功能 */
export function isEntitlementActive(sub: MeSubscription | null | undefined): boolean {
  if (!sub) return false;
  if (sub.status !== "active") return false;
  return isSubscriptionActive(sub.validUntil ? new Date(sub.validUntil) : null, sub.plan);
}

/** 剩余天数（按自然日向上取整）；终身或无结束日返回 null */
export function daysRemainingInSubscription(
  sub: MeSubscription | null | undefined,
  now = new Date()
): number | null {
  if (!sub || sub.plan === "lifetime") return null;
  const v = sub.validUntil ? new Date(sub.validUntil) : null;
  if (!v || Number.isNaN(v.getTime())) return null;
  return Math.ceil((v.getTime() - now.getTime()) / 86_400_000);
}

/** 在订阅仍有效前提下，是否处于「到期前 N 天」提醒区间（含到期当日） */
export function isExpiringWithinDays(
  sub: MeSubscription | null | undefined,
  entitlementActive: boolean,
  withinDays: number,
  now = new Date()
): boolean {
  if (!entitlementActive || !sub || sub.plan === "lifetime") return false;
  const left = daysRemainingInSubscription(sub, now);
  if (left === null) return false;
  return left <= withinDays && left >= 0;
}

export function canAccessQuotes(sub: MeSubscription | null, entitlementActive: boolean): boolean {
  if (!entitlementActive || !sub) return false;
  return describePlan(sub.plan).quote;
}

export function canAccessContracts(sub: MeSubscription | null, entitlementActive: boolean): boolean {
  if (!entitlementActive || !sub) return false;
  return describePlan(sub.plan).contract;
}

/** 「从报价生成合同」需同时具备报价与合同权益 */
export function canBridgeQuoteToContract(
  sub: MeSubscription | null,
  entitlementActive: boolean
): boolean {
  if (!entitlementActive || !sub) return false;
  const f = describePlan(sub.plan);
  return f.quote && f.contract;
}
