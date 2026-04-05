import type { Contract, ContractLine, QuoteExtraFee } from "./types";

export function contractLinesSubtotal(lines: ContractLine[]): number {
  return lines.reduce((s, l) => s + l.amount, 0);
}

/** 税额 = 商品金额合计 × 税率%（与报价页逻辑一致） */
export function contractTaxFromSubtotal(
  subtotal: number,
  taxIncluded: boolean,
  taxRate: number
): number {
  if (!taxIncluded) return 0;
  return Math.round(subtotal * (taxRate / 100) * 100) / 100;
}

export function contractExtraFeesTotal(extraFees: QuoteExtraFee[]): number {
  return extraFees.reduce((s, f) => s + f.amount, 0);
}

export function contractGrandTotalFromState(
  lines: ContractLine[],
  taxIncluded: boolean,
  taxRate: number,
  extraFees: QuoteExtraFee[]
): number {
  const sub = contractLinesSubtotal(lines);
  const tax = contractTaxFromSubtotal(sub, taxIncluded, taxRate);
  const extra = contractExtraFeesTotal(extraFees);
  return sub + tax + extra;
}

/** 已保存合同（兼容无 tax/extra 字段的旧数据） */
export function contractStoredGrandTotal(c: Contract): number {
  return contractGrandTotalFromState(
    c.lines,
    !!c.taxIncluded,
    typeof c.taxRate === "number" ? c.taxRate : 0,
    Array.isArray(c.extraFees) ? c.extraFees : []
  );
}
