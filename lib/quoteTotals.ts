import type { QuoteExtraFee, QuoteLine } from "@/lib/types";

export function quoteSubtotal(lines: QuoteLine[]): number {
  return lines.reduce((s, l) => s + l.amount, 0);
}

export function quoteTax(sub: number, taxIncluded: boolean, taxRate: number): number {
  if (!taxIncluded) return 0;
  return Math.round(sub * (taxRate / 100) * 100) / 100;
}

export function quoteGrandTotal(
  lines: QuoteLine[],
  taxIncluded: boolean,
  taxRate: number,
  extraFees: QuoteExtraFee[]
): number {
  const sub = quoteSubtotal(lines);
  const tax = quoteTax(sub, taxIncluded, taxRate);
  const extra = extraFees.reduce((s, f) => s + f.amount, 0);
  return sub + tax + extra;
}
