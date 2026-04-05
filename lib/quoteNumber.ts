import { getQuoteCounters, setQuoteCounters } from "./storage";

export function dateToYmdCompact(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

export function peekNextQuoteNo(abbr: string, yyyymmdd: string): string {
  const key = `${abbr}-${yyyymmdd}`;
  const counters = getQuoteCounters();
  const n = (counters[key] ?? 0) + 1;
  return `${abbr}-${yyyymmdd}-${String(n).padStart(3, "0")}`;
}

export function commitNextQuoteNo(abbr: string, yyyymmdd: string): string {
  const key = `${abbr}-${yyyymmdd}`;
  const counters = getQuoteCounters();
  const n = (counters[key] ?? 0) + 1;
  counters[key] = n;
  setQuoteCounters(counters);
  return `${abbr}-${yyyymmdd}-${String(n).padStart(3, "0")}`;
}
