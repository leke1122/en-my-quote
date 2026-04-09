import { normalizeDocumentCurrency } from "./format";
import type {
  AppSettings,
  Company,
  Contract,
  ContractCounters,
  Customer,
  Product,
  Quote,
  QuoteCounters,
} from "./types";

const KEYS = {
  products: "products",
  customers: "customers",
  companies: "companies",
  quotes: "quotes",
  quoteCounter: "quoteCounter",
  settings: "settings",
  contracts: "contracts",
  contractCounters: "contractCounters",
} as const;

/** Keys mirror localStorage for backup/restore */
export const STORAGE_KEYS = KEYS;

export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    window.alert(
      "Save failed: browser storage is full. Export a backup in Settings, remove large images, and try again."
    );
  }
}

export function getProducts(): Product[] {
  return loadJson<Product[]>(KEYS.products, []);
}

export function setProducts(list: Product[]): void {
  saveJson(KEYS.products, list);
}

export function getCustomers(): Customer[] {
  return loadJson<Customer[]>(KEYS.customers, []);
}

export function setCustomers(list: Customer[]): void {
  saveJson(KEYS.customers, list);
}

export function getCompanies(): Company[] {
  return loadJson<Company[]>(KEYS.companies, []);
}

export function setCompanies(list: Company[]): void {
  saveJson(KEYS.companies, list);
}

export function getQuotes(): Quote[] {
  return loadJson<Quote[]>(KEYS.quotes, []);
}

export function setQuotes(list: Quote[]): void {
  saveJson(KEYS.quotes, list);
}

export function markQuoteStatusById(
  quoteId: string,
  status: Quote["status"],
  patch?: Partial<Pick<Quote, "paidAt">>
): void {
  const all = getQuotes();
  const next = all.map((q) =>
    q.id === quoteId
      ? {
          ...q,
          status,
          paidAt: patch?.paidAt !== undefined ? patch.paidAt : q.paidAt,
          updatedAt: new Date().toISOString(),
        }
      : q
  );
  setQuotes(next);
}

export function markQuoteViewedByQuoteNo(quoteNo: string): void {
  const all = getQuotes();
  let changed = false;
  const nowIso = new Date().toISOString();
  const next = all.map((q) => {
    if (q.quoteNo !== quoteNo) return q;
    if (q.status === "accepted" || q.status === "paid") return q;
    changed = true;
    return {
      ...q,
      status: "viewed" as const,
      viewCount: (q.viewCount ?? 0) + 1,
      lastViewedAt: nowIso,
      updatedAt: nowIso,
    };
  });
  if (changed) setQuotes(next);
}

export function markQuoteReminderSent(quoteId: string, to: string): void {
  const all = getQuotes();
  const nowIso = new Date().toISOString();
  const email = to.trim().toLowerCase();
  const next = all.map((q) =>
    q.id === quoteId
      ? {
          ...q,
          reminderCount: (q.reminderCount ?? 0) + 1,
          lastReminderAt: nowIso,
          lastReminderTo: email,
          updatedAt: nowIso,
        }
      : q
  );
  setQuotes(next);
}

export function getQuoteCounters(): QuoteCounters {
  return loadJson<QuoteCounters>(KEYS.quoteCounter, {});
}

export function setQuoteCounters(c: QuoteCounters): void {
  saveJson(KEYS.quoteCounter, c);
}

const defaultSettings: AppSettings = {
  documentCurrency: "USD",
};

/** Used when reading localStorage, API payloads, and backups (ignores legacy keys). */
export function coerceAppSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") {
    return { ...defaultSettings };
  }
  const o = raw as Record<string, unknown>;
  const cur =
    typeof o.documentCurrency === "string" ? o.documentCurrency : defaultSettings.documentCurrency;
  return { documentCurrency: normalizeDocumentCurrency(cur) };
}

export function getSettings(): AppSettings {
  const loaded = loadJson<unknown>(KEYS.settings, {});
  return coerceAppSettings(loaded);
}

export function setSettings(s: AppSettings): void {
  saveJson(KEYS.settings, coerceAppSettings(s));
}

export function getContracts(): Contract[] {
  return loadJson<Contract[]>(KEYS.contracts, []);
}

export function setContracts(list: Contract[]): void {
  saveJson(KEYS.contracts, list);
}

export function getContractCounters(): ContractCounters {
  return loadJson<ContractCounters>(KEYS.contractCounters, {});
}

export function setContractCounters(c: ContractCounters): void {
  saveJson(KEYS.contractCounters, c);
}
