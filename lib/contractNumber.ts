import { getContractCounters, setContractCounters } from "./storage";

/** 合同编号：HT-yyyyMMdd-序号（与常见销售合同编号风格一致） */
export function peekNextContractNo(yyyymmdd: string): string {
  const counters = getContractCounters();
  const n = (counters[yyyymmdd] ?? 0) + 1;
  return `HT-${yyyymmdd}-${String(n).padStart(3, "0")}`;
}

export function commitNextContractNo(yyyymmdd: string): string {
  const counters = getContractCounters();
  const n = (counters[yyyymmdd] ?? 0) + 1;
  counters[yyyymmdd] = n;
  setContractCounters(counters);
  return `HT-${yyyymmdd}-${String(n).padStart(3, "0")}`;
}
