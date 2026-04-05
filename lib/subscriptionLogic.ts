/** 与数据库 plan/status 字符串约定一致，供服务端与前端展示 */
export type SubscriptionPlan = "trial" | "monthly" | "yearly" | "lifetime";

export function isSubscriptionActive(validUntil: Date | null, plan: string): boolean {
  if (plan === "lifetime") return true;
  if (!validUntil) return false;
  return validUntil.getTime() > Date.now();
}

export function trialEndDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
