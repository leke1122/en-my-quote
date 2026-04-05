"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { TextButton } from "@/components/TextButton";
import { contractStoredGrandTotal } from "@/lib/contractTotals";
import { filterContractDetailRows, localContractsToDetailRows } from "@/lib/contractRecords";
import { formatCurrency } from "@/lib/format";
import { getCompanies, getContracts, getCustomers } from "@/lib/storage";
import type { Contract, Customer } from "@/lib/types";

export default function ContractListPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState(getCompanies());

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerQ, setCustomerQ] = useState("");
  const [productQ, setProductQ] = useState("");
  const [modelQ, setModelQ] = useState("");
  const [specQ, setSpecQ] = useState("");
  const [source, setSource] = useState<"all" | "local">("all");

  const [selectedContractId, setSelectedContractId] = useState("");

  const refreshLocal = useCallback(() => {
    setContracts(getContracts().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setCustomers(getCustomers());
    setCompanies(getCompanies());
  }, []);

  useEffect(() => {
    refreshLocal();
  }, [refreshLocal]);

  const customerMap = useMemo(() => {
    const m = new Map<string, Customer>();
    customers.forEach((c) => m.set(c.id, c));
    return m;
  }, [customers]);

  const companyMap = useMemo(() => {
    const m = new Map<string, (typeof companies)[0]>();
    companies.forEach((c) => m.set(c.id, c));
    return m;
  }, [companies]);

  const localDetailRows = useMemo(
    () => localContractsToDetailRows(contracts, customerMap, companyMap),
    [contracts, customerMap, companyMap]
  );

  const filteredRows = useMemo(
    () =>
      filterContractDetailRows(localDetailRows, {
        dateFrom,
        dateTo,
        customer: customerQ,
        productName: productQ,
        model: modelQ,
        spec: specQ,
        source: source === "all" ? "all" : "local",
      }),
    [localDetailRows, dateFrom, dateTo, customerQ, productQ, modelQ, specQ, source]
  );

  const localContractsForSelect = useMemo(() => {
    const ids = new Set<string>();
    filteredRows.forEach((r) => ids.add(r.contractId));
    return contracts.filter((c) => ids.has(c.id));
  }, [filteredRows, contracts]);

  function loadSelectedContract() {
    const id = selectedContractId || localContractsForSelect[0]?.id;
    if (!id) {
      alert("当前筛选结果中没有可打开的合同，请调整条件或先在本地保存合同。");
      return;
    }
    router.push(`/contract/new?id=${encodeURIComponent(id)}`);
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <PageHeader
        title="查询合同"
        actions={
          <div className="flex flex-wrap gap-2">
            <TextButton variant="secondary" onClick={refreshLocal}>
              刷新本地
            </TextButton>
            <Link href="/contract/new">
              <TextButton variant="primary">新建合同</TextButton>
            </Link>
          </div>
        }
      />

      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <p className="mb-2 font-medium text-slate-800">数据来源</p>
        <p>
          <strong>本地</strong>
          ：本机浏览器中已保存的销售合同，支持按明细筛选与整单打开编辑。合同数据不上传服务器（除非您另行使用云端账号功能）。
        </p>
        <p className="mt-2 text-xs text-slate-500">
          与「查询历史报价」一致：下列为<strong>标的明细行</strong>列表；同一合同的多条商品会显示为多行。
        </p>
      </section>

      <section className="mb-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">组合筛选</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs text-slate-600">签订日期起</label>
            <input
              type="date"
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">签订日期止</label>
            <input
              type="date"
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">数据来源</label>
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={source}
              onChange={(e) => setSource(e.target.value as "all" | "local")}
            >
              <option value="all">全部（本地）</option>
              <option value="local">仅本地</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600">客户名称（包含）</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={customerQ}
              onChange={(e) => setCustomerQ(e.target.value)}
              placeholder="模糊匹配"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">商品名称（包含）</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={productQ}
              onChange={(e) => setProductQ(e.target.value)}
              placeholder="模糊匹配"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">型号（包含）</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={modelQ}
              onChange={(e) => setModelQ(e.target.value)}
              placeholder="模糊匹配"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs text-slate-600">规格（包含）</label>
            <input
              className="mt-1 w-full max-w-xl rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={specQ}
              onChange={(e) => setSpecQ(e.target.value)}
              placeholder="模糊匹配"
            />
          </div>
        </div>
      </section>

      <section className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-sm text-slate-600">按本地整单打开（当前筛选结果内）</label>
          <select
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 sm:max-w-xl"
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
          >
            <option value="">请选择合同</option>
            {localContractsForSelect.map((c) => (
              <option key={c.id} value={c.id}>
                {c.contractNo} · {c.signingDate} · {customerMap.get(c.customerId)?.name ?? c.buyer.name} ·{" "}
                {formatCurrency(contractStoredGrandTotal(c))}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <TextButton variant="secondary" onClick={loadSelectedContract}>
            加载到合同页
          </TextButton>
        </div>
      </section>

      <div className="hidden overflow-x-auto rounded border border-slate-200 bg-white lg:block">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-2 font-medium">来源</th>
              <th className="px-2 py-2 font-medium">合同编号</th>
              <th className="px-2 py-2 font-medium">签订日期</th>
              <th className="px-2 py-2 font-medium">需方</th>
              <th className="px-2 py-2 font-medium">供方</th>
              <th className="px-2 py-2 font-medium">商品名称</th>
              <th className="px-2 py-2 font-medium">型号</th>
              <th className="px-2 py-2 font-medium">规格</th>
              <th className="px-2 py-2 font-medium">单位</th>
              <th className="px-2 py-2 font-medium">数量</th>
              <th className="px-2 py-2 font-medium">单价</th>
              <th className="px-2 py-2 font-medium">金额</th>
              <th className="px-2 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r, idx) => (
              <tr
                key={`${r.contractNo}-${r.contractId}-${idx}`}
                className="border-t border-slate-100"
              >
                <td className="px-2 py-2">本地</td>
                <td className="px-2 py-2">{r.contractNo}</td>
                <td className="px-2 py-2">{r.date}</td>
                <td className="px-2 py-2">{r.customerName}</td>
                <td className="px-2 py-2 text-slate-700">{r.supplierName}</td>
                <td className="px-2 py-2">{r.productName}</td>
                <td className="px-2 py-2">{r.model}</td>
                <td className="px-2 py-2">{r.spec}</td>
                <td className="px-2 py-2">{r.unit}</td>
                <td className="px-2 py-2">{r.qty}</td>
                <td className="px-2 py-2">{formatCurrency(r.price)}</td>
                <td className="px-2 py-2">{formatCurrency(r.amount)}</td>
                <td className="px-2 py-2">
                  <TextButton
                    variant="ghost"
                    className="!px-0"
                    onClick={() =>
                      router.push(`/contract/new?id=${encodeURIComponent(r.contractId)}`)
                    }
                  >
                    打开
                  </TextButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRows.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-500">
            无明细记录，请调整筛选或先在本地保存合同
          </p>
        ) : null}
      </div>

      <div className="space-y-2 lg:hidden">
        {filteredRows.map((r, idx) => (
          <div
            key={`${r.contractNo}-${r.contractId}-${idx}`}
            className="rounded border border-slate-200 bg-white p-3 text-sm shadow-sm"
          >
            <div className="flex justify-between text-slate-500">
              <span>本地</span>
              <span>{r.date}</span>
            </div>
            <div className="font-medium text-slate-900">{r.contractNo}</div>
            <div className="text-slate-700">需方：{r.customerName}</div>
            <div className="text-slate-600">供方：{r.supplierName}</div>
            <div className="mt-1 text-slate-800">{r.productName}</div>
            <div className="text-slate-600">
              {r.model} · {r.spec}
            </div>
            <div className="mt-1 text-slate-700">
              {r.unit} × {r.qty} @ {formatCurrency(r.price)} = {formatCurrency(r.amount)}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <TextButton
                variant="secondary"
                onClick={() =>
                  router.push(`/contract/new?id=${encodeURIComponent(r.contractId)}`)
                }
              >
                打开合同
              </TextButton>
            </div>
          </div>
        ))}
        {filteredRows.length === 0 ? (
          <p className="text-center text-sm text-slate-500">无明细记录</p>
        ) : null}
      </div>
    </div>
  );
}
