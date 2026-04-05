/**
 * 环境变量 SUBSCRIPTION_REDEEM_CODES：逗号分隔多条，每条格式
 * `激活码|有效天数|套餐标识`
 * - 天数为 0 或 lifetime 表示永久（写入 plan=lifetime，validUntil=null）
 * - 激活码比对时不区分大小写
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
