"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { SubscriptionFeatureGate } from "@/components/subscription/SubscriptionFeatureGate";
import { useSubscriptionAccess } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";
import { pullProjectDataFromCloud } from "@/lib/cloudProjectData";
import {
  buildCsvUtf8BomBlob,
  buildExcelHtmlTableBlob,
  exportFilename,
  triggerDownloadBlob,
} from "@/lib/exportSpreadsheet";
import { filterContractDetailRows, localContractsToDetailRows } from "@/lib/contractRecords";
import { formatCurrency } from "@/lib/format";
import { getCompanies, getContracts, getCustomers } from "@/lib/storage";
import type { Contract, Customer } from "@/lib/types";

function ContractListContent() {
  const router = useRouter();
  const subCtx = useSubscriptionAccess();
  const cloudDataMode = subCtx.cloudAuthEnabled;
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState(getCompanies());

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerQ, setCustomerQ] = useState("");
  const [productQ, setProductQ] = useState("");
  const [modelQ, setModelQ] = useState("");
  const [specQ, setSpecQ] = useState("");

  const refreshList = useCallback(async () => {
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      await pullProjectDataFromCloud();
    }
    setContracts(getContracts().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setCustomers(getCustomers());
    setCompanies(getCompanies());
  }, [subCtx.cloudAuthEnabled, subCtx.loggedIn]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

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
        source: "all",
      }),
    [localDetailRows, dateFrom, dateTo, customerQ, productQ, modelQ, specQ]
  );

  function contractRowsForExport(): (string | number)[][] {
    return filteredRows.map((r) => [
      r.contractNo,
      r.date,
      r.customerName,
      r.supplierName,
      r.productName,
      r.model,
      r.spec,
      r.unit,
      r.qty,
      r.price,
      r.amount,
    ]);
  }

  function exportContractCsv() {
    if (filteredRows.length === 0) {
      alert("当前没有可导出的明细，请调整筛选条件。");
      return;
    }
    const headers = [
      "合同编号",
      "签订日期",
      "客户",
      "供方",
      "商品名称",
      "型号",
      "规格",
      "单位",
      "数量",
      "单价",
      "金额",
    ];
    triggerDownloadBlob(
      buildCsvUtf8BomBlob(headers, contractRowsForExport()),
      exportFilename("合同明细", "csv")
    );
  }

  function exportContractXls() {
    if (filteredRows.length === 0) {
      alert("当前没有可导出的明细，请调整筛选条件。");
      return;
    }
    const headers = [
      "合同编号",
      "签订日期",
      "客户",
      "供方",
      "商品名称",
      "型号",
      "规格",
      "单位",
      "数量",
      "单价",
      "金额",
    ];
    triggerDownloadBlob(
      buildExcelHtmlTableBlob(headers, contractRowsForExport()),
      exportFilename("合同明细", "xls")
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <PageHeader
        title="查询合同"
        actions={
          <div className="flex flex-wrap gap-2">
            <TextButton variant="secondary" onClick={refreshList}>
              {cloudDataMode ? "刷新列表" : "刷新本地"}
            </TextButton>
            <Link href="/contract/new">
              <TextButton variant="primary">新建合同</TextButton>
            </Link>
          </div>
        }
      />

      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <p className="mb-2 font-medium text-slate-800">数据与安全说明</p>
        {cloudDataMode ? (
          <p className="leading-relaxed">
            已启用服务端数据库，用于账号、订阅及业务数据的持久化。本页明细来自<strong>当前浏览器中已载入</strong>的合同标的行；在编辑器保存或通过云端同步更新后，请点击上方「刷新列表」查看最新数据。请始终通过{" "}
            <strong>HTTPS</strong> 访问。可在「设置」导出 JSON 备份。
          </p>
        ) : (
          <p className="leading-relaxed">
            <strong>合同明细保存在本机浏览器</strong>。请通过 HTTPS 访问；建议定期在「设置」导出 JSON 备份。
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          下方为<strong>当前筛选条件下</strong>的标的明细（同一合同多商品为多行），可导出 CSV 或 Excel（.xls）。在表格「操作」中可打开整单编辑。
        </p>
      </section>

      <section className="mb-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-800">组合筛选</h2>
          <div className="flex flex-wrap gap-2">
            <TextButton variant="secondary" onClick={exportContractCsv}>
              导出 CSV（当前明细）
            </TextButton>
            <TextButton variant="secondary" onClick={exportContractXls}>
              导出 Excel .xls（当前明细）
            </TextButton>
          </div>
        </div>
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

      <div className="hidden overflow-x-auto rounded border border-slate-200 bg-white lg:block">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
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
            无明细记录，请调整筛选或点击「{cloudDataMode ? "刷新列表" : "刷新本地"}」
          </p>
        ) : null}
      </div>

      <div className="space-y-2 lg:hidden">
        {filteredRows.map((r, idx) => (
          <div
            key={`${r.contractNo}-${r.contractId}-${idx}`}
            className="rounded border border-slate-200 bg-white p-3 text-sm shadow-sm"
          >
            <div className="flex justify-end text-slate-500">
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

export default function ContractListPage() {
  return (
    <SubscriptionFeatureGate feature="contract">
      <ContractListContent />
    </SubscriptionFeatureGate>
  );
}
