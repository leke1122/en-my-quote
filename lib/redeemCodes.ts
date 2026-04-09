/**
 * Env SUBSCRIPTION_REDEEM_CODES: comma-separated entries, each
 * `CODE|days|planKey`
 * - days 0 or lifetime → perpetual (plan=lifetime, validUntil=null)
 * - code comparison is case-insensitive
 */
export type RedeemReward = { plan: string; days: number; lifetime: boolean };

export function parseRedeemCodes(): Map<string, RedeemReward> {
  const raw = process.env.SUBSCRIPTION_REDEEM_CODES?.trim();
  const map = new Map<string, RedeemReward>();
  if (!raw) return map;

  for (const segment of raw.split(",")) {
    const part = segment.trim();
    if (!part) continue;
    const bits = part.split("|").map((s) => s.trim());
    if (bits.length < 3) continue;
    const [code, daysStr, plan] = bits;
    if (!code || !plan) continue;
    const lower = daysStr.toLowerCase();
    const lifetime = lower === "lifetime" || lower === "0";
    let days = 0;
    if (!lifetime) {
      const n = parseInt(daysStr, 10);
      if (Number.isNaN(n) || n <= 0) continue;
      days = n;
    }
    map.set(code.toUpperCase(), { plan, days, lifetime });
  }
  return map;
}
