export type PaymentSku =
  | "QUOTE_1M"
  | "QUOTE_3M"
  | "QUOTE_6M"
  | "QUOTE_12M"
  | "QUOTE_LIFE"
  | "CONTRACT_1M"
  | "CONTRACT_3M"
  | "CONTRACT_6M"
  | "CONTRACT_12M"
  | "CONTRACT_LIFE"
  | "FULL_3D"
  | "FULL_1M"
  | "FULL_3M"
  | "FULL_6M"
  | "FULL_12M"
  | "FULL_LIFE";

export type PaymentSkuInfo = {
  sku: PaymentSku;
  title: string;
  amountFen: number;
  /** 顺延：增加的有效天数；lifetime=true 时忽略 */
  addDays: number;
  /** 写入 Subscription.plan */
  plan: string;
  lifetime: boolean;
};

function fen(yuan: number): number {
  return Math.round(yuan * 100);
}

export const PAYMENT_SKUS: PaymentSkuInfo[] = [
  { sku: "QUOTE_1M", title: "报价单生成+查询（1个月）", amountFen: fen(19.8), addDays: 30, plan: "quote_only", lifetime: false },
  { sku: "QUOTE_3M", title: "报价单生成+查询（3个月）", amountFen: fen(39.8), addDays: 90, plan: "quote_only", lifetime: false },
  { sku: "QUOTE_6M", title: "报价单生成+查询（6个月）", amountFen: fen(59.8), addDays: 180, plan: "quote_only", lifetime: false },
  { sku: "QUOTE_12M", title: "报价单生成+查询（12个月）", amountFen: fen(98.8), addDays: 365, plan: "quote_only", lifetime: false },
  { sku: "QUOTE_LIFE", title: "报价单生成+查询（永久版）", amountFen: fen(168.8), addDays: 0, plan: "quote_lifetime", lifetime: true },

  { sku: "CONTRACT_1M", title: "合同单生成+查询（1个月）", amountFen: fen(19.8), addDays: 30, plan: "contract_only", lifetime: false },
  { sku: "CONTRACT_3M", title: "合同单生成+查询（3个月）", amountFen: fen(39.8), addDays: 90, plan: "contract_only", lifetime: false },
  { sku: "CONTRACT_6M", title: "合同单生成+查询（6个月）", amountFen: fen(59.8), addDays: 180, plan: "contract_only", lifetime: false },
  { sku: "CONTRACT_12M", title: "合同单生成+查询（12个月）", amountFen: fen(98.8), addDays: 365, plan: "contract_only", lifetime: false },
  { sku: "CONTRACT_LIFE", title: "合同单生成+查询（永久版）", amountFen: fen(168.8), addDays: 0, plan: "contract_lifetime", lifetime: true },

  { sku: "FULL_3D", title: "全功能（3天）", amountFen: fen(8.8), addDays: 3, plan: "full", lifetime: false },
  { sku: "FULL_1M", title: "全功能（1个月）", amountFen: fen(29.8), addDays: 30, plan: "full", lifetime: false },
  { sku: "FULL_3M", title: "全功能（3个月）", amountFen: fen(49.8), addDays: 90, plan: "full", lifetime: false },
  { sku: "FULL_6M", title: "全功能（6个月）", amountFen: fen(88.8), addDays: 180, plan: "full", lifetime: false },
  { sku: "FULL_12M", title: "全功能（12个月）", amountFen: fen(118.8), addDays: 365, plan: "full", lifetime: false },
  { sku: "FULL_LIFE", title: "全功能（永久版）", amountFen: fen(198.8), addDays: 0, plan: "lifetime", lifetime: true },
];

export function getSkuInfo(sku: string): PaymentSkuInfo | null {
  return PAYMENT_SKUS.find((x) => x.sku === sku) ?? null;
}

