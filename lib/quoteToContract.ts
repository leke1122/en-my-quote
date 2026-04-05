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
    c[1] = `二、交货地址：${customerAddress.trim() || "________________"}（如需供方代办运输，运输费用由需方承担，具体以双方协商为准）。`;
  }
  return c;
}
