import { DEFAULT_CONTRACT_CLAUSES } from "./contractDefaults";
import type { ContractLine, QuoteLine } from "./types";

export function quoteLinesToContractLines(lines: QuoteLine[]): ContractLine[] {
  return lines.map((l) => ({
    id: l.id,
    productCode: l.code,
    name: l.name,
    modelSpec: [l.model, l.spec].filter(Boolean).join(" / ") || "—",
    unit: l.unit,
    qty: l.qty,
    price: l.price,
    amount: l.amount,
    remark: l.remark ?? "",
  }));
}

export function initialClausesWithDeliveryAddress(customerAddress: string): string[] {
  const c = [...DEFAULT_CONTRACT_CLAUSES];
  if (c[1]) {
    const addr = customerAddress.trim() || "________________";
    c[1] = `II. Delivery location: ${addr} (If the supplier arranges carriage, the buyer bears freight unless otherwise agreed.)`;
  }
  return c;
}
