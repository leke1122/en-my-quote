/** plan/status strings aligned with DB and UI */
export type SubscriptionPlan = "trial" | "monthly" | "yearly" | "lifetime";

export function isSubscriptionActive(validUntil: Date | null, plan: string): boolean {
  const p = plan.trim().toLowerCase();
  if (p === "lifetime" || p.includes("lifetime") || p.endsWith("_lifetime")) return true;
  if (!validUntil) return false;
  return validUntil.getTime() > Date.now();
}

export function trialEndDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
