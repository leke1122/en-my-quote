"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildCsvUtf8BomBlob,
  buildExcelHtmlTableBlob,
  exportFilename,
  triggerDownloadBlob,
} from "@/lib/exportSpreadsheet";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { SubscriptionFeatureGate } from "@/components/subscription/SubscriptionFeatureGate";
import { useSubscriptionAccess } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";
import { formatCurrency } from "@/lib/format";
import { getCustomers, getQuotes } from "@/lib/storage";
import type { Customer, Quote } from "@/lib/types";
import { filterDetailRows, localQuotesToDetailRows } from "@/lib/wpsRecords";

function QuoteListContent() {
  const router = useRouter();
  const subCtx = useSubscriptionAccess();
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerQ, setCustomerQ] = useState("");
  const [productQ, setProductQ] = useState("");
  const [modelQ, setModelQ] = useState("");
  const [specQ, setSpecQ] = useState("");

  const refreshList = useCallback(() => {
    setQuotes(getQuotes().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setCustomers(getCustomers());
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const cloudDataMode = subCtx.cloudAuthEnabled;

  const customerMap = useMemo(() => {
    const m = new Map<string, Customer>();
    customers.forEach((c) => m.set(c.id, c));
    return m;
  }, [customers]);

  const localDetailRows = useMemo(
    () => localQuotesToDetailRows(quotes, customerMap),
    [quotes, customerMap]
  );

  const filteredRows = useMemo(
    () =>
      filterDetailRows(localDetailRows, {
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

  function quoteRowsForExport(): (string | number)[][] {
    return filteredRows.map((r) => [
      r.quoteNo,
      r.date,
      r.customerName,
      r.productName,
      r.model,
      r.spec,
      r.unit,
      r.qty,
      r.price,
      r.amount,
    ]);
  }

  function exportQuoteCsv() {
    if (filteredRows.length === 0) {
      alert("当前没有可导出的明细，请调整筛选条件。");
      return;
    }
    const headers = [
      "报价单号",
      "日期",
      "客户",
      "商品名称",
      "型号",
      "规格",
      "单位",
      "数量",
      "单价",
      "金额",
    ];
    triggerDownloadBlob(buildCsvUtf8BomBlob(headers, quoteRowsForExport()), exportFilename("报价明细", "csv"));
  }

  function exportQuoteXls() {
    if (filteredRows.length === 0) {
      alert("当前没有可导出的明细，请调整筛选条件。");
      return;
    }
    const headers = [
      "报价单号",
      "日期",
      "客户",
      "商品名称",
      "型号",
      "规格",
      "单位",
      "数量",
      "单价",
      "金额",
    ];
    triggerDownloadBlob(buildExcelHtmlTableBlob(headers, quoteRowsForExport()), exportFilename("报价明细", "xls"));
  }

  function goContractFromQuote(quoteId: string) {
    if (subCtx.cloudAuthEnabled && !subCtx.canQuoteToContract) {
      setUpgradeModal(true);
      return;
    }
    router.push(`/contract/new?fromQuote=${encodeURIComponent(quoteId)}`);
  }

  function openShop() {
    window.open(subCtx.purchaseShopUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <PageHeader
        title="查询历史报价"
        actions={
          <div className="flex flex-wrap gap-2">
            <TextButton variant="secondary" onClick={refreshList}>
              {cloudDataMode ? "刷新列表" : "刷新本地"}
            </TextButton>
            <Link href="/quote/new">
              <TextButton variant="primary">新建报价</TextButton>
            </Link>
          </div>
        }
      />

      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <p className="mb-2 font-medium text-slate-800">数据与安全说明</p>
        {cloudDataMode ? (
          <p className="leading-relaxed">
            已启用服务端数据库，用于账号、订阅及业务数据的持久化。本页明细来自<strong>当前浏览器中已载入</strong>的报价；在编辑器保存或通过云端同步更新后，请点击上方「刷新列表」查看最新数据。请始终通过{" "}
            <strong>HTTPS</strong> 访问。可在「设置」导出 JSON 备份。
          </p>
        ) : (
          <p className="leading-relaxed">
            <strong>报价明细保存在本机浏览器</strong>。请通过 HTTPS 访问；建议定期在「设置」导出 JSON 备份。
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          下方为<strong>当前筛选条件下</strong>的明细，可导出 CSV 或 Excel（.xls）。在表格「操作」中可打开整单编辑或生成合同。
        </p>
      </section>

      <section className="mb-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-800">组合筛选</h2>
          <div className="flex flex-wrap gap-2">
            <TextButton variant="secondary" onClick={exportQuoteCsv}>
              导出 CSV（当前明细）
            </TextButton>
            <TextButton variant="secondary" onClick={exportQuoteXls}>
              导出 Excel .xls（当前明细）
            </TextButton>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs text-slate-600">报价日期起</label>
            <input
              type="date"
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">报价日期止</label>
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

      <div className="hidden lg:block overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-2 font-medium">报价单号</th>
              <th className="px-2 py-2 font-medium">日期</th>
              <th className="px-2 py-2 font-medium">客户</th>
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
              <tr key={`${r.quoteId ?? r.quoteNo}-${idx}`} className="border-t border-slate-100">
                <td className="px-2 py-2">{r.quoteNo}</td>
                <td className="px-2 py-2">{r.date}</td>
                <td className="px-2 py-2">{r.customerName}</td>
                <td className="px-2 py-2">{r.productName}</td>
                <td className="px-2 py-2">{r.model}</td>
                <td className="px-2 py-2">{r.spec}</td>
                <td className="px-2 py-2">{r.unit}</td>
                <td className="px-2 py-2">{r.qty}</td>
                <td className="px-2 py-2">{formatCurrency(r.price)}</td>
                <td className="px-2 py-2">{formatCurrency(r.amount)}</td>
                <td className="px-2 py-2">
                  {r.quoteId ? (
                    <span className="flex flex-wrap gap-2">
                      <TextButton
                        variant="ghost"
                        className="!px-0"
                        onClick={() => router.push(`/quote/new?id=${encodeURIComponent(r.quoteId!)}`)}
                      >
                        打开
                      </TextButton>
                      <TextButton
                        variant="ghost"
                        className="!px-0"
                        onClick={() => goContractFromQuote(r.quoteId!)}
                      >
                        生成合同
                      </TextButton>
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
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
            key={`${r.quoteId ?? r.quoteNo}-${idx}`}
            className="rounded border border-slate-200 bg-white p-3 text-sm shadow-sm"
          >
            <div className="flex justify-end text-slate-500">
              <span>{r.date}</span>
            </div>
            <div className="font-medium text-slate-900">{r.quoteNo}</div>
            <div className="text-slate-700">{r.customerName}</div>
            <div className="mt-1 text-slate-800">{r.productName}</div>
            <div className="text-slate-600">
              {r.model} · {r.spec}
            </div>
            <div className="mt-1 text-slate-700">
              {r.unit} × {r.qty} @ {formatCurrency(r.price)} = {formatCurrency(r.amount)}
            </div>
            {r.quoteId ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <TextButton
                  variant="secondary"
                  onClick={() => router.push(`/quote/new?id=${encodeURIComponent(r.quoteId!)}`)}
                >
                  打开报价
                </TextButton>
                <TextButton variant="secondary" onClick={() => goContractFromQuote(r.quoteId!)}>
                  生成合同
                </TextButton>
              </div>
            ) : null}
          </div>
        ))}
        {filteredRows.length === 0 ? (
          <p className="text-center text-sm text-slate-500">无明细记录</p>
        ) : null}
      </div>

      <Modal
        open={upgradeModal}
        title="需升级套餐"
        onClose={() => setUpgradeModal(false)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setUpgradeModal(false)}>
              关闭
            </TextButton>
            <TextButton variant="primary" onClick={openShop}>
              前往淘宝店铺升级
            </TextButton>
            <TextButton variant="secondary" onClick={() => router.push("/settings")}>
              查看订阅
            </TextButton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-700">
          「从报价生成合同」需要同时具备<strong>报价</strong>与<strong>合同</strong>权益。请购买「报价+合同版」或包含双模块的套餐，并在设置中兑换激活码。
        </p>
      </Modal>
    </div>
  );
}

export default function QuoteListPage() {
  return (
    <SubscriptionFeatureGate feature="quote">
      <QuoteListContent />
    </SubscriptionFeatureGate>
  );
}
