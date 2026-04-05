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
  /** v2：销售合同 */
  contracts: Contract[];
  contractCounter: ContractCounters;
  settings: AppSettings;
}

function redactSettings(s: AppSettings): AppSettings {
  return {
    ...s,
    wpsAppSecret: "",
    wpsToken: "",
  };
}

/** 从当前 localStorage 汇总备份（仅客户端） */
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
    return { ok: false, error: "不是有效的 JSON 文件" };
  }
  if (!isRecord(raw)) return { ok: false, error: "根节点必须是对象" };
  if (raw.app !== "my-quote") return { ok: false, error: "不是本应用导出的备份（缺少 app: my-quote）" };
  if (typeof raw.version !== "number" || raw.version < 1) {
    return { ok: false, error: "不支持的备份版本" };
  }
  const needArrays = ["companies", "customers", "products", "quotes"] as const;
  for (const k of needArrays) {
    if (!Array.isArray(raw[k])) return { ok: false, error: `缺少或格式错误: ${k}` };
  }
  if (!isRecord(raw.quoteCounter) && raw.quoteCounter !== null) {
    return { ok: false, error: "quoteCounter 必须是对象" };
  }
  if (!isRecord(raw.settings)) return { ok: false, error: "settings 必须是对象" };

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
    settings: { ...getSettings(), ...(raw.settings as Partial<AppSettings>) },
  };
  return { ok: true, data };
}

/** 将备份写入 localStorage（覆盖当前数据） */
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
