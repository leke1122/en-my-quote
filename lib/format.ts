export function formatNumber(n: number, fractionDigits = 2, locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

/**
 * Returns a plain numeric amount string (no currency symbol), e.g. "1,234.56".
 * Default locale is en-US to match overseas SMB expectations.
 */
export function formatCurrency(n: number, locale: string = "en-US"): string {
  return formatNumber(n, 2, locale);
}

/**
 * Returns a localized currency string with symbol, e.g. "$1,234.56".
 */
export function formatMoney(n: number, currency: string = "USD", locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

const DOC_CURRENCY_FALLBACK = "USD";

/** Normalize ISO 4217 code for documents; invalid codes fall back to USD. */
export function normalizeDocumentCurrency(code: string | undefined | null): string {
  const c = (code ?? "").trim().toUpperCase();
  if (c.length !== 3) return DOC_CURRENCY_FALLBACK;
  try {
    Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(0);
    return c;
  } catch {
    return DOC_CURRENCY_FALLBACK;
  }
}

export function formatDateUSFromIso(isoDate: string): string {
  // isoDate is expected as "YYYY-MM-DD"
  const [y, m, d] = isoDate.split("-").map((x) => Number.parseInt(x, 10));
  if (!y || !m || !d) return isoDate;
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${mm}/${dd}/${y}`;
}

/** Calendar date in MM/DD/YYYY (local timezone), for subscription / account UI. */
export function formatDateUS(isoOrDate: string | Date | null | undefined): string {
  if (isoOrDate == null) return "—";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

export function parseAmount(s: string): number {
  const t = s.replace(/,/g, "").trim();
  const v = Number.parseFloat(t);
  return Number.isFinite(v) ? v : 0;
}
