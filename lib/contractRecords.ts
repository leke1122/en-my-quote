import { normalizeDocumentCurrency } from "./format";
import { getSettings } from "./storage";
import type { Company, Contract, Customer } from "./types";

/** Contract line row (parallel to quote detail rows for shared filters/tables) */
export interface ContractDetailRow {
  source: "local";
  contractNo: string;
  /** Signing date YYYY-MM-DD */
  date: string;
  customerName: string;
  supplierName: string;
  productName: string;
  model: string;
  spec: string;
  unit: string;
  qty: number;
  price: number;
  amount: number;
  contractId: string;
  currency: string;
}

function splitModelSpec(modelSpec: string): { model: string; spec: string } {
  const idx = modelSpec.indexOf(" / ");
  if (idx >= 0) {
    return { model: modelSpec.slice(0, idx).trim(), spec: modelSpec.slice(idx + 3).trim() };
  }
  return { model: modelSpec.trim(), spec: "" };
}

export function localContractsToDetailRows(
  contracts: Contract[],
  customerMap: Map<string, Customer>,
  companyMap: Map<string, Company>
): ContractDetailRow[] {
  const defaultCur = normalizeDocumentCurrency(getSettings().documentCurrency);
  const rows: ContractDetailRow[] = [];
  for (const c of contracts) {
    const customerName = customerMap.get(c.customerId)?.name ?? c.buyer.name ?? "—";
    const supplierName = companyMap.get(c.companyId)?.name ?? c.seller.name ?? "—";
    const cur = normalizeDocumentCurrency(c.currency ?? defaultCur);
    if (!c.lines.length) {
      rows.push({
        source: "local",
        contractNo: c.contractNo,
        date: c.signingDate,
        customerName,
        supplierName,
        productName: "—",
        model: "",
        spec: "",
        unit: "",
        qty: 0,
        price: 0,
        amount: 0,
        contractId: c.id,
        currency: cur,
      });
      continue;
    }
    for (const line of c.lines) {
      const { model, spec } = splitModelSpec(line.modelSpec);
      rows.push({
        source: "local",
        contractNo: c.contractNo,
        date: c.signingDate,
        customerName,
        supplierName,
        productName: line.name,
        model,
        spec,
        unit: line.unit,
        qty: line.qty,
        price: line.price,
        amount: line.amount,
        contractId: c.id,
        currency: cur,
      });
    }
  }
  return rows;
}

export function filterContractDetailRows(
  rows: ContractDetailRow[],
  filters: {
    dateFrom: string;
    dateTo: string;
    customer: string;
    productName: string;
    model: string;
    spec: string;
    source: "all" | "local";
  }
): ContractDetailRow[] {
  return rows.filter((r) => {
    if (filters.source === "local" && r.source !== "local") return false;

    if (filters.dateFrom && r.date && r.date < filters.dateFrom) return false;
    if (filters.dateTo && r.date && r.date > filters.dateTo) return false;

    const c = filters.customer.trim().toLowerCase();
    if (c && !r.customerName.toLowerCase().includes(c)) return false;

    const pn = filters.productName.trim().toLowerCase();
    if (pn && !r.productName.toLowerCase().includes(pn)) return false;

    const m = filters.model.trim().toLowerCase();
    if (m && !r.model.toLowerCase().includes(m)) return false;

    const sp = filters.spec.trim().toLowerCase();
    if (sp && !r.spec.toLowerCase().includes(sp)) return false;

    return true;
  });
}
