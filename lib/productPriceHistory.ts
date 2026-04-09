import type { Contract, Product, Quote } from "./types";

export type ProductPriceHistory = {
  quoteMin: number | null;
  quoteMax: number | null;
  contractMin: number | null;
  contractMax: number | null;
};

function normCode(s: string): string {
  return s.trim().toLowerCase();
}

function isUsablePrice(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

function pushPrice(arr: number[], p: number) {
  if (isUsablePrice(p)) arr.push(p);
}

/**
 * Min/max unit prices per product from saved quotes and contracts.
 * Quote lines: match by productId first, else product code.
 * Contract lines: match productCode to catalog code.
 */
export function buildProductPriceHistoryMap(
  products: Product[],
  quotes: Quote[],
  contracts: Contract[]
): Map<string, ProductPriceHistory> {
  const map = new Map<string, ProductPriceHistory>();

  for (const p of products) {
    map.set(p.id, {
      quoteMin: null,
      quoteMax: null,
      contractMin: null,
      contractMax: null,
    });
  }

  const codeToId = new Map<string, string>();
  for (const p of products) {
    codeToId.set(normCode(p.code), p.id);
  }

  const quotePricesByProduct = new Map<string, number[]>();
  const contractPricesByProduct = new Map<string, number[]>();

  for (const p of products) {
    quotePricesByProduct.set(p.id, []);
    contractPricesByProduct.set(p.id, []);
  }

  for (const q of quotes) {
    for (const line of q.lines) {
      let pid: string | undefined;
      if (line.productId && map.has(line.productId)) {
        pid = line.productId;
      } else {
        const byCode = codeToId.get(normCode(line.code));
        if (byCode) pid = byCode;
      }
      if (!pid) continue;
      const bucket = quotePricesByProduct.get(pid);
      if (bucket) pushPrice(bucket, line.price);
    }
  }

  for (const c of contracts) {
    for (const line of c.lines) {
      const pid = codeToId.get(normCode(line.productCode));
      if (!pid) continue;
      const bucket = contractPricesByProduct.get(pid);
      if (bucket) pushPrice(bucket, line.price);
    }
  }

  for (const p of products) {
    const qArr = quotePricesByProduct.get(p.id) ?? [];
    const cArr = contractPricesByProduct.get(p.id) ?? [];
    const qh: ProductPriceHistory = map.get(p.id)!;
    if (qArr.length > 0) {
      qh.quoteMin = Math.min(...qArr);
      qh.quoteMax = Math.max(...qArr);
    }
    if (cArr.length > 0) {
      qh.contractMin = Math.min(...cArr);
      qh.contractMax = Math.max(...cArr);
    }
  }

  return map;
}
