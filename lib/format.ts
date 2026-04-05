export function formatNumber(n: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

export function formatCurrency(n: number): string {
  return formatNumber(n, 2);
}

export function parseAmount(s: string): number {
  const t = s.replace(/,/g, "").trim();
  const v = Number.parseFloat(t);
  return Number.isFinite(v) ? v : 0;
}
