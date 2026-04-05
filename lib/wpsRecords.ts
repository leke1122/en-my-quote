import type { AppSettings, Customer, Quote } from "./types";

export interface WpsFieldMap {
  quoteNo: string;
  date: string;
  customer: string;
  productName: string;
  model: string;
  spec: string;
  unit: string;
  qty: string;
  price: string;
  amount: string;
}

export interface QuoteDetailRow {
  source: "local" | "wps";
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
  /** 本地报价 id，可跳转编辑 */
  quoteId?: string;
  wpsRecordId?: string;
}

const FALLBACKS: Record<keyof WpsFieldMap, string[]> = {
  quoteNo: ["报价单号", "单号", "quote_no", "quoteNo", "编号"],
  date: ["报价日期", "日期", "date", "quote_date"],
  customer: ["客户名称", "客户", "customer", "客户名"],
  productName: ["商品名称", "名称", "品名", "product", "product_name", "商品"],
  model: ["型号", "model"],
  spec: ["规格", "spec", "规格说明"],
  unit: ["单位", "unit"],
  qty: ["数量", "qty", "quantity"],
  price: ["单价", "price", "unit_price"],
  amount: ["金额", "amount", "小计", "行金额"],
};

export function wpsValueToString(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
    return String(val);
  }
  if (Array.isArray(val)) {
    return val.map(wpsValueToString).filter(Boolean).join(" ");
  }
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    if (typeof o.text === "string" || typeof o.text === "number") return String(o.text);
    if (Array.isArray(o.text)) return o.text.map(wpsValueToString).filter(Boolean).join(" ");
    if (typeof o.name === "string") return o.name;
  }
  return "";
}

export function wpsValueToNumber(val: unknown): number {
  const s = wpsValueToString(val).replace(/,/g, "").trim();
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function pickField(
  fields: Record<string, unknown>,
  configured: string,
  fallbacks: string[]
): string {
  const keys = Object.keys(fields);
  if (configured.trim()) {
    const k = keys.find((x) => x === configured.trim());
    if (k) return wpsValueToString(fields[k]);
  }
  for (const fb of fallbacks) {
    const hit = keys.find((k) => k === fb || k.includes(fb) || fb.includes(k));
    if (hit) return wpsValueToString(fields[hit]);
  }
  return "";
}

function pickNumber(
  fields: Record<string, unknown>,
  configured: string,
  fallbacks: string[]
): number {
  const keys = Object.keys(fields);
  if (configured.trim()) {
    const k = keys.find((x) => x === configured.trim());
    if (k) return wpsValueToNumber(fields[k]);
  }
  for (const fb of fallbacks) {
    const hit = keys.find((k) => k === fb || k.includes(fb) || fb.includes(k));
    if (hit) return wpsValueToNumber(fields[hit]);
  }
  return 0;
}

export function mapWpsRecordToRow(
  rec: { id?: string; fields?: Record<string, unknown> },
  settings: AppSettings
): QuoteDetailRow | null {
  const fields = rec.fields;
  if (!fields || typeof fields !== "object") return null;

  const map: WpsFieldMap = {
    quoteNo: settings.wpsFieldQuoteNo,
    date: settings.wpsFieldDate,
    customer: settings.wpsFieldCustomer,
    productName: settings.wpsFieldProductName,
    model: settings.wpsFieldModel,
    spec: settings.wpsFieldSpec,
    unit: settings.wpsFieldUnit,
    qty: settings.wpsFieldQty,
    price: settings.wpsFieldPrice,
    amount: settings.wpsFieldAmount,
  };

  const quoteNo = pickField(fields, map.quoteNo, FALLBACKS.quoteNo);
  const dateRaw = pickField(fields, map.date, FALLBACKS.date);
  const customerName = pickField(fields, map.customer, FALLBACKS.customer);
  const productName = pickField(fields, map.productName, FALLBACKS.productName);
  const model = pickField(fields, map.model, FALLBACKS.model);
  const spec = pickField(fields, map.spec, FALLBACKS.spec);
  const unit = pickField(fields, map.unit, FALLBACKS.unit);
  const qty = pickNumber(fields, map.qty, FALLBACKS.qty);
  const price = pickNumber(fields, map.price, FALLBACKS.price);
  let amount = pickNumber(fields, map.amount, FALLBACKS.amount);
  if (amount === 0 && qty !== 0 && price !== 0) {
    amount = Math.round(qty * price * 100) / 100;
  }

  if (!quoteNo && !productName && !customerName) {
    return null;
  }

  return {
    source: "wps",
    quoteNo: quoteNo || "—",
    date: normalizeWpsDate(dateRaw),
    customerName: customerName || "—",
    productName: productName || "—",
    model,
    spec,
    unit,
    qty,
    price,
    amount,
    wpsRecordId: rec.id,
  };
}

/** 尽量规范为 YYYY-MM-DD 便于区间比较 */
function normalizeWpsDate(s: string): string {
  const t = s.trim();
  const m = t.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    const y = m[1];
    const mo = m[2].padStart(2, "0");
    const d = m[3].padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }
  const digits = t.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  return t;
}

function extractRecords(payload: unknown): { records: unknown[]; pageToken: string } {
  if (!payload || typeof payload !== "object") return { records: [], pageToken: "" };
  const root = payload as Record<string, unknown>;
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  const records = (data.records ?? data.record_list ?? data.items ?? []) as unknown[];
  const pageToken = String(data.page_token ?? data.next_page_token ?? data.nextPageToken ?? "");
  return {
    records: Array.isArray(records) ? records : [],
    pageToken,
  };
}

export async function fetchWpsRecordsPage(body: {
  token: string;
  fileId: string;
  sheetId: string;
  pageToken?: string;
  pageSize?: number;
}): Promise<{ ok: boolean; records: unknown[]; pageToken: string; error?: string; httpStatus?: number }> {
  const res = await fetch("/api/wps/dbsheet/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: body.token,
      fileId: body.fileId,
      sheetId: body.sheetId,
      pageToken: body.pageToken ?? "",
      pageSize: body.pageSize ?? 500,
    }),
  });

  const json = (await res.json()) as {
    ok?: boolean;
    httpStatus?: number;
    data?: unknown;
    error?: string;
  };

  if (!res.ok || json.error) {
    return {
      ok: false,
      records: [],
      pageToken: "",
      error: json.error || `请求失败 (${res.status})`,
      httpStatus: json.httpStatus,
    };
  }

  if (!json.ok) {
    return {
      ok: false,
      records: [],
      pageToken: "",
      error: `WPS 接口返回异常（HTTP ${json.httpStatus ?? "?"}），请检查 Token、file_id、sheet_id 及表格权限`,
      httpStatus: json.httpStatus,
    };
  }

  const { records, pageToken } = extractRecords(json.data);
  return { ok: true, records, pageToken };
}

export async function fetchAllWpsDetailRows(settings: AppSettings): Promise<QuoteDetailRow[]> {
  const token = settings.wpsToken.trim();
  const fileId = settings.wpsDbsheetFileId.trim();
  const sheetId = settings.wpsDbsheetSheetId.trim();
  if (!token || !fileId || !sheetId) {
    throw new Error("请先在「设置」中填写 WPS Token、多维表格 file_id 与 sheet_id");
  }

  const rows: QuoteDetailRow[] = [];
  let pageToken = "";
  for (let i = 0; i < 80; i++) {
    const page = await fetchWpsRecordsPage({
      token,
      fileId,
      sheetId,
      pageToken,
      pageSize: 500,
    });
    if (!page.ok) throw new Error(page.error || "拉取失败");

    for (const rec of page.records) {
      if (!rec || typeof rec !== "object") continue;
      const row = mapWpsRecordToRow(rec as { id?: string; fields?: Record<string, unknown> }, settings);
      if (row) rows.push(row);
    }

    if (!page.pageToken || page.records.length === 0) break;
    pageToken = page.pageToken;
  }
  return rows;
}

export function localQuotesToDetailRows(
  quotes: Quote[],
  customerMap: Map<string, Customer>
): QuoteDetailRow[] {
  const rows: QuoteDetailRow[] = [];
  for (const q of quotes) {
    const customerName = customerMap.get(q.customerId)?.name ?? "—";
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
    source: "all" | "local" | "wps";
  }
): QuoteDetailRow[] {
  return rows.filter((r) => {
    if (filters.source !== "all" && r.source !== filters.source) return false;

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
