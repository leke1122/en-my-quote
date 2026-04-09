import { isSubscriptionActive } from "@/lib/subscriptionLogic";
import { describePlan } from "@/lib/subscriptionPlanDisplay";

/** Matches subscription on /api/auth/me */
export type MeSubscription = {
  plan: string;
  status: string;
  validUntil: string | null;
  validFrom?: string | null;
  createdAt?: string;
};

/** Stripe/webhook status: only active and not expired counts as entitled */
export function isEntitlementActive(sub: MeSubscription | null | undefined): boolean {
  if (!sub) return false;
  if (sub.status !== "active") return false;
  return isSubscriptionActive(sub.validUntil ? new Date(sub.validUntil) : null, sub.plan);
}

/** Days remaining (ceil calendar days); null for lifetime / no end */
export function daysRemainingInSubscription(
  sub: MeSubscription | null | undefined,
  now = new Date()
): number | null {
  if (!sub || sub.plan === "lifetime") return null;
  const v = sub.validUntil ? new Date(sub.validUntil) : null;
  if (!v || Number.isNaN(v.getTime())) return null;
  return Math.ceil((v.getTime() - now.getTime()) / 86_400_000);
}

/** True if within N days before expiry while still active (inclusive of end day) */
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

/** Quote-to-contract needs both quote and contract entitlements */
export function canBridgeQuoteToContract(
  sub: MeSubscription | null,
  entitlementActive: boolean
): boolean {
  if (!entitlementActive || !sub) return false;
  const f = describePlan(sub.plan);
  return f.quote && f.contract;
}
