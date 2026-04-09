import { normalizeDocumentCurrency } from "@/lib/format";
import type { Company, Customer, QuoteExtraFee, QuoteLine } from "@/lib/types";

export type QuoteCompanySnapshot = Pick<
  Company,
  | "name"
  | "contact"
  | "phone"
  | "address"
  | "logo"
  | "taxId"
  | "bankName"
  | "bankCode"
  | "abbr"
  | "sealImage"
>;

export type QuoteCustomerSnapshot = Pick<Customer, "name" | "contact" | "phone" | "address">;

export interface QuoteSharePayload {
  type?: "quote";
  quoteNo: string;
  date: string;
  companyId?: string;
  customerId?: string;
  companySnapshot?: QuoteCompanySnapshot | null;
  customerSnapshot?: QuoteCustomerSnapshot | null;
  lines?: QuoteLine[];
  taxIncluded: boolean;
  taxRate: number;
  extraFees?: QuoteExtraFee[];
  terms?: string[];
  /** Show seal (same as quote editor) */
  showSeal?: boolean;
  /** ISO 4217 */
  currency?: string;
  validUntil?: string;
  paymentTerms?: string;
  status?: "draft" | "sent" | "viewed" | "accepted" | "paid";
  paymentLink?: string;
  paidAt?: string;
}

export function parseQuoteSharePayload(raw: unknown): QuoteSharePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.type === "contract") return null;
  if (typeof o.quoteNo !== "string" || typeof o.date !== "string") return null;
  return {
    type: "quote",
    quoteNo: o.quoteNo,
    date: o.date,
    companyId: typeof o.companyId === "string" ? o.companyId : "",
    customerId: typeof o.customerId === "string" ? o.customerId : "",
    companySnapshot: (o.companySnapshot as QuoteCompanySnapshot) ?? null,
    customerSnapshot: (o.customerSnapshot as QuoteCustomerSnapshot) ?? null,
    lines: Array.isArray(o.lines) ? (o.lines as QuoteLine[]) : [],
    taxIncluded: !!o.taxIncluded,
    taxRate: typeof o.taxRate === "number" ? o.taxRate : Number(o.taxRate) || 0,
    extraFees: Array.isArray(o.extraFees) ? (o.extraFees as QuoteExtraFee[]) : [],
    terms: Array.isArray(o.terms) ? (o.terms as string[]) : [],
    showSeal: !!o.showSeal,
    currency:
      typeof o.currency === "string" ? normalizeDocumentCurrency(o.currency) : undefined,
    validUntil: typeof o.validUntil === "string" ? o.validUntil : undefined,
    paymentTerms: typeof o.paymentTerms === "string" ? o.paymentTerms : undefined,
    status:
      o.status === "draft" ||
      o.status === "sent" ||
      o.status === "viewed" ||
      o.status === "accepted" ||
      o.status === "paid"
        ? o.status
        : undefined,
    paymentLink: typeof o.paymentLink === "string" ? o.paymentLink : undefined,
    paidAt: typeof o.paidAt === "string" ? o.paidAt : undefined,
  };
}
