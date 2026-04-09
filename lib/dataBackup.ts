import type {
  AppSettings,
  Company,
  Contract,
  Customer,
  Product,
  Quote,
  QuoteCounters,
  ContractCounters,
} from "./types";
import {
  coerceAppSettings,
  getCompanies,
  getContracts,
  getCustomers,
  getProducts,
  getQuoteCounters,
  getQuotes,
  getSettings,
  getContractCounters,
  setCompanies,
  setContracts,
  setCustomers,
  setProducts,
  setQuoteCounters,
  setQuotes,
  setSettings,
  setContractCounters,
} from "./storage";

export const DATA_BACKUP_VERSION = 2;

export interface DataBackupPayload {
  version: number;
  exportedAt: string;
  app: "my-quote";
  companies: Company[];
  customers: Customer[];
  products: Product[];
  quotes: Quote[];
  quoteCounter: QuoteCounters;
  /** v2: sales contracts */
  contracts: Contract[];
  contractCounter: ContractCounters;
  settings: AppSettings;
}

function redactSettings(s: AppSettings): AppSettings {
  return { ...s };
}

/** Collect backup from current localStorage (client only) */
export function collectLocalDataBackup(includeSecrets: boolean): DataBackupPayload {
  const settings = getSettings();
  return {
    version: DATA_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: "my-quote",
    companies: getCompanies(),
    customers: getCustomers(),
    products: getProducts(),
    quotes: getQuotes(),
    quoteCounter: getQuoteCounters(),
    contracts: getContracts(),
    contractCounter: getContractCounters(),
    settings: includeSecrets ? settings : redactSettings(settings),
  };
}

export function downloadDataBackupJson(payload: DataBackupPayload, filenameBase = "quote-backup"): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}-${payload.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function parseBackupFile(text: string): { ok: true; data: DataBackupPayload } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: "Not valid JSON" };
  }
  if (!isRecord(raw)) return { ok: false, error: "Root must be an object" };
  if (raw.app !== "my-quote") return { ok: false, error: "Not a backup from this app (expected app: my-quote)" };
  if (typeof raw.version !== "number" || raw.version < 1) {
    return { ok: false, error: "Unsupported backup version" };
  }
  const needArrays = ["companies", "customers", "products", "quotes"] as const;
  for (const k of needArrays) {
    if (!Array.isArray(raw[k])) return { ok: false, error: `Missing or invalid: ${k}` };
  }
  if (!isRecord(raw.quoteCounter) && raw.quoteCounter !== null) {
    return { ok: false, error: "quoteCounter must be an object" };
  }
  if (!isRecord(raw.settings)) return { ok: false, error: "settings must be an object" };

  const contracts = Array.isArray(raw.contracts) ? (raw.contracts as Contract[]) : [];
  const contractCounter =
    raw.contractCounter && isRecord(raw.contractCounter)
      ? (raw.contractCounter as ContractCounters)
      : {};

  const data: DataBackupPayload = {
    version: raw.version,
    exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : new Date().toISOString(),
    app: "my-quote",
    companies: raw.companies as Company[],
    customers: raw.customers as Customer[],
    products: raw.products as Product[],
    quotes: raw.quotes as Quote[],
    quoteCounter: (raw.quoteCounter as QuoteCounters) ?? {},
    contracts: raw.version >= 2 ? contracts : [],
    contractCounter: raw.version >= 2 ? contractCounter : {},
    settings: coerceAppSettings(raw.settings),
  };
  return { ok: true, data };
}

/** Write backup into localStorage (overwrites current data) */
export function applyLocalDataBackup(data: DataBackupPayload): void {
  setCompanies(data.companies);
  setCustomers(data.customers);
  setProducts(data.products);
  setQuotes(data.quotes);
  setQuoteCounters(data.quoteCounter);
  setContracts(data.contracts ?? []);
  setContractCounters(data.contractCounter ?? {});
  setSettings(data.settings);
}
