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

/** 与 localStorage 键一致，供备份/恢复使用 */
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
    window.alert("保存失败：本地存储空间不足。请先到“设置”导出备份，删除部分大图片后重试。");
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

export function getQuoteCounters(): QuoteCounters {
  return loadJson<QuoteCounters>(KEYS.quoteCounter, {});
}

export function setQuoteCounters(c: QuoteCounters): void {
  saveJson(KEYS.quoteCounter, c);
}

const defaultSettings: AppSettings = {
  wpsAppId: "",
  wpsAppSecret: "",
  wpsToken: "",
  wpsDbsheetFileId: "",
  wpsDbsheetSheetId: "",
  wpsFieldQuoteNo: "",
  wpsFieldDate: "",
  wpsFieldCustomer: "",
  wpsFieldProductName: "",
  wpsFieldModel: "",
  wpsFieldSpec: "",
  wpsFieldUnit: "",
  wpsFieldQty: "",
  wpsFieldPrice: "",
  wpsFieldAmount: "",
  feishuKbUrl: "https://www.feishu.cn/",
};

export function getSettings(): AppSettings {
  return { ...defaultSettings, ...loadJson<Partial<AppSettings>>(KEYS.settings, {}) };
}

export function setSettings(s: AppSettings): void {
  saveJson(KEYS.settings, s);
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
