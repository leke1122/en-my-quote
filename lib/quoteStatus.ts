export type QuoteStatusBase = "draft" | "sent" | "viewed" | "accepted" | "paid";
export type QuoteStatusDisplay = QuoteStatusBase | "expired";

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function toBaseQuoteStatus(status: string | undefined): QuoteStatusBase {
  if (status === "sent" || status === "viewed" || status === "accepted" || status === "paid") {
    return status;
  }
  return "draft";
}

export function quoteDisplayStatus(
  status: string | undefined,
  validUntil: string | undefined
): QuoteStatusDisplay {
  const base = toBaseQuoteStatus(status);
  if (base === "accepted" || base === "paid") return base;
  if (validUntil && validUntil < isoToday()) return "expired";
  return base;
}

export function shouldShowExpiryReminder(
  status: string | undefined,
  validUntil: string | undefined
): boolean {
  const display = quoteDisplayStatus(status, validUntil);
  if (display === "accepted" || display === "paid") return false;
  if (!validUntil) return false;
  return true;
}
