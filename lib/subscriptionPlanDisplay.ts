/**
 * 与 SUBSCRIPTION_REDEEM_CODES 第三段「套餐标识」、试用 plan 对应，用于个人信息页展示。
 * 淘宝销售时在商品说明中写明：激活码对应下列哪一种 plan 标识。
 */
export type PlanFeatures = {
  /** 面向用户的中文套餐名 */
  displayName: string;
  /** 是否包含报价功能 */
  quote: boolean;
  /** 是否包含合同功能 */
  contract: boolean;
};

export function describePlan(plan: string): PlanFeatures {
  const p = plan.trim().toLowerCase();

  if (p === "unactivated" || p === "pending") {
    return { displayName: "未激活（请兑换激活码）", quote: false, contract: false };
  }
  if (p === "trial") {
    return { displayName: "试用版（全功能）", quote: true, contract: true };
  }
  if (p === "lifetime" || p.includes("lifetime") || p.endsWith("_lifetime")) {
    return { displayName: "永久版（全功能）", quote: true, contract: true };
  }
  if (p === "quote_monthly" || p === "quote_only" || p === "quote") {
    return { displayName: "报价版", quote: true, contract: false };
  }
  if (
    p === "quote_contract_monthly" ||
    p === "quote_contract" ||
    p === "full_monthly" ||
    p === "full"
  ) {
    return { displayName: "报价+合同版", quote: true, contract: true };
  }
  if (p === "contract_monthly" || p === "contract_only" || p === "contract") {
    return { displayName: "合同版", quote: false, contract: true };
  }

  return {
    displayName: `自定义套餐（${plan}）`,
    quote: true,
    contract: true,
  };
}

/** 展示为 2026-4-6（按用户本机时区日历日） */
export function formatDateYmdCn(isoOrDate: string | Date | null | undefined): string {
  if (isoOrDate == null) return "—";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
