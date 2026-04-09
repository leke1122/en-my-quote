import { getContractCounters, setContractCounters } from "./storage";

/** Contract no. pattern AGR-yyyyMMdd-seq */
export function peekNextContractNo(yyyymmdd: string): string {
  const counters = getContractCounters();
  const n = (counters[yyyymmdd] ?? 0) + 1;
  return `AGR-${yyyymmdd}-${String(n).padStart(3, "0")}`;
}

export function commitNextContractNo(yyyymmdd: string): string {
  const counters = getContractCounters();
  const n = (counters[yyyymmdd] ?? 0) + 1;
  counters[yyyymmdd] = n;
  setContractCounters(counters);
  return `AGR-${yyyymmdd}-${String(n).padStart(3, "0")}`;
}
