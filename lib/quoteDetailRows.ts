import { normalizeDocumentCurrency } from "./format";
import { quoteDisplayStatus } from "./quoteStatus";
import { getSettings } from "./storage";
import type { Customer, Quote } from "./types";

export interface QuoteDetailRow {
  source: "local";
  quoteNo: string;
  date: string;
  customerName: string;
  productName: string;
  model: string;
  spec: string;
  unit: string;
  qty: number;
  price: number;
  amount: number;
  quoteId?: string;
  /** ISO 4217 */
  currency: string;
  validUntil: string;
  paymentTerms: string;
  status: "draft" | "sent" | "viewed" | "accepted" | "expired" | "paid";
  paymentLink: string;
}

export function localQuotesToDetailRows(
  quotes: Quote[],
  customerMap: Map<string, Customer>
): QuoteDetailRow[] {
  const defaultCur = normalizeDocumentCurrency(getSettings().documentCurrency);
  const rows: QuoteDetailRow[] = [];
  for (const q of quotes) {
    const customerName = customerMap.get(q.customerId)?.name ?? "—";
    const cur = normalizeDocumentCurrency(q.currency ?? defaultCur);
    const validUntil = q.validUntil ?? "";
    const paymentTerms = q.paymentTerms ?? "Net 30";
    const status = quoteDisplayStatus(q.status, validUntil);
    const paymentLink = q.paymentLink ?? "";
    if (!q.lines.length) {
      rows.push({
        source: "local",
        quoteNo: q.quoteNo,
        date: q.date,
        customerName,
        productName: "—",
        model: "",
        spec: "",
        unit: "",
        qty: 0,
        price: 0,
        amount: 0,
        quoteId: q.id,
        currency: cur,
        validUntil,
        paymentTerms,
        status,
        paymentLink,
      });
      continue;
    }
    for (const line of q.lines) {
      rows.push({
        source: "local",
        quoteNo: q.quoteNo,
        date: q.date,
        customerName,
        productName: line.name,
        model: line.model,
        spec: line.spec,
        unit: line.unit,
        qty: line.qty,
        price: line.price,
        amount: line.amount,
        quoteId: q.id,
        currency: cur,
        validUntil,
        paymentTerms,
        status,
        paymentLink,
      });
    }
  }
  return rows;
}

export function filterDetailRows(
  rows: QuoteDetailRow[],
  filters: {
    dateFrom: string;
    dateTo: string;
    customer: string;
    productName: string;
    model: string;
    spec: string;
    status: "all" | "draft" | "sent" | "viewed" | "accepted" | "expired" | "paid";
    source: "all" | "local";
  }
): QuoteDetailRow[] {
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

    if (filters.status !== "all" && r.status !== filters.status) return false;

    return true;
  });
}
