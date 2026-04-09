export interface Product {
  id: string;
  code: string;
  name: string;
  model: string;
  spec: string;
  unit: string;
  price: number;
  image?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  mainBusiness: string;
  taxId: string;
  bankName: string;
  bankAccount: string;
}

export interface Company {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  taxId: string;
  bankName: string;
  bankCode: string;
  logo?: string;
  /** Transparent PNG seal for contract signature block */
  sealImage?: string;
  abbr: string;
  isDefault: boolean;
}

export interface QuoteLine {
  id: string;
  productId?: string;
  code: string;
  name: string;
  model: string;
  spec: string;
  unit: string;
  price: number;
  qty: number;
  amount: number;
  image?: string;
  /** Line remark */
  remark?: string;
}

export interface QuoteExtraFee {
  id: string;
  name: string;
  amount: number;
}

export interface Quote {
  id: string;
  quoteNo: string;
  date: string;
  companyId: string;
  customerId: string;
  lines: QuoteLine[];
  taxIncluded: boolean;
  taxRate: number;
  extraFees: QuoteExtraFee[];
  /** Quote terms (multiple) */
  terms: string[];
  /** Show company seal on quote (same scale as contract) */
  showSeal?: boolean;
  /** Valid until date (YYYY-MM-DD) */
  validUntil?: string;
  /** Typical terms: Due on receipt, Net 7/15/30 */
  paymentTerms?: string;
  /** Workflow status */
  status?: "draft" | "sent" | "viewed" | "accepted" | "paid";
  /** Optional external checkout/payment URL */
  paymentLink?: string;
  /** ISO datetime when marked paid */
  paidAt?: string;
  /** Reminder email metrics */
  reminderCount?: number;
  lastReminderAt?: string;
  lastReminderTo?: string;
  /** View metrics */
  viewCount?: number;
  lastViewedAt?: string;
  /** ISO 4217 (e.g. USD); defaults from Settings when missing */
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  /** Default ISO 4217 currency for new quotes/contracts */
  documentCurrency: string;
}

export type QuoteCounters = Record<string, number>;

/** Contract party snapshot (can diverge after syncing from CRM/company master) */
export interface ContractPartySnapshot {
  name: string;
  address: string;
  /** Representative / agent */
  agent: string;
  phone: string;
  bankName: string;
  bankAccount: string;
  taxId: string;
}

export interface ContractLine {
  id: string;
  /** Product / line code */
  productCode: string;
  /** Product name */
  name: string;
  /** Model and specs (one column, matching contract layout) */
  modelSpec: string;
  unit: string;
  qty: number;
  price: number;
  amount: number;
  remark: string;
}

export interface Contract {
  id: string;
  contractNo: string;
  /** Signing date YYYY-MM-DD */
  signingDate: string;
  signingPlace: string;
  companyId: string;
  customerId: string;
  lines: ContractLine[];
  /** Contract clauses (numbered or free-form) */
  clauses: string[];
  buyer: ContractPartySnapshot;
  seller: ContractPartySnapshot;
  /** If true, tax = line subtotal × rate and included in total */
  taxIncluded?: boolean;
  /** Tax rate % (e.g. 13 means 13%) */
  taxRate?: number;
  /** Extra fees; total = lines + tax + fees */
  extraFees?: QuoteExtraFee[];
  /** Source quote id when generated from a quote */
  sourceQuoteId?: string;
  /** ISO 4217; defaults from Settings or source quote when missing */
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContractCounters = Record<string, number>;
