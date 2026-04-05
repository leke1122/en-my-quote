"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { TextButton } from "@/components/TextButton";
import { formatCurrency } from "@/lib/format";
import { getCustomers, getQuotes, getSettings } from "@/lib/storage";
import type { Customer, Quote } from "@/lib/types";
import {
  fetchAllWpsDetailRows,
  filterDetailRows,
  localQuotesToDetailRows,
  type QuoteDetailRow,
} from "@/lib/wpsRecords";

function quoteTotal(q: Quote): number {
  const sub = q.lines.reduce((s, l) => s + l.amount, 0);
  const tax = q.taxIncluded ? sub * (q.taxRate / 100) : 0;
  const extra = q.extraFees.reduce((s, f) => s + f.amount, 0);
  return sub + tax + extra;
}

export default function QuoteListPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [wpsRows, setWpsRows] = useState<QuoteDetailRow[]>([]);
  const [wpsLoading, setWpsLoading] = useState(false);
  const [wpsError, setWpsError] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerQ, setCustomerQ] = useState("");
  const [productQ, setProductQ] = useState("");
  const [modelQ, setModelQ] = useState("");
  const [specQ, setSpecQ] = useState("");
  const [source, setSource] = useState<"all" | "local" | "wps">("all");

  const [selectedQuoteId, setSelectedQuoteId] = useState("");

  const refreshLocal = useCallback(() => {
    setQuotes(getQuotes().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setCustomers(getCustomers());
  }, []);

  useEffect(() => {
    refreshLocal();
  }, [refreshLocal]);

  const customerMap = useMemo(() => {
    const m = new Map<string, Customer>();
    customers.forEach((c) => m.set(c.id, c));
    return m;
  }, [customers]);

  const localDetailRows = useMemo(
    () => localQuotesToDetailRows(quotes, customerMap),
    [quotes, customerMap]
  );

  const mergedRows = useMemo(
    () => [...localDetailRows, ...wpsRows],
    [localDetailRows, wpsRows]
  );

  const filteredRows = useMemo(
    () =>
      filterDetailRows(mergedRows, {
        dateFrom,
        dateTo,
        customer: customerQ,
        productName: productQ,
        model: modelQ,
        spec: specQ,
        source,
      }),
    [mergedRows, dateFrom, dateTo, customerQ, productQ, modelQ, specQ, source]
  );

  const localQuotesForSelect = useMemo(() => {
    const ids = new Set<string>();
    filteredRows.forEach((r) => {
      if (r.source === "local" && r.quoteId) ids.add(r.quoteId);
    });
    return quotes.filter((q) => ids.has(q.id));
  }, [filteredRows, quotes]);

  async function pullWps() {
    const s = getSettings();
    setWpsError("");
    setWpsLoading(true);
    try {
      const rows = await fetchAllWpsDetailRows(s);
      setWpsRows(rows);
      if (rows.length === 0) {
        setWpsError("未解析到有效行：请检查多维表字段是否与设置中的列名一致，或表格是否为空。");
      }
    } catch (e) {
      setWpsError(e instanceof Error ? e.message : "拉取失败");
      setWpsRows([]);
    } finally {
      setWpsLoading(false);
    }
  }

  function clearWps() {
    setWpsRows([]);
    setWpsError("");
  }

  function loadSelectedQuote() {
    const id = selectedQuoteId || localQuotesForSelect[0]?.id;
    if (!id) {
      alert("当前筛选结果中没有可打开的本地报价，请调整条件或先在本地保存报价。");
      return;
    }
    router.push(`/quote/new?id=${encodeURIComponent(id)}`);
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <PageHeader
        title="查询历史报价"
        actions={
          <div className="flex flex-wrap gap-2">
            <TextButton variant="secondary" onClick={refreshLocal}>
              刷新本地
            </TextButton>
            <Link href="/quote/new">
              <TextButton variant="primary">新建报价</TextButton>
            </Link>
          </div>
        }
      />

      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <p className="mb-2 font-medium text-slate-800">数据来源</p>
        <p>
          <strong>本地</strong>：本机浏览器中已保存的报价，支持打开编辑。
          <strong className="ml-1">WPS 多维表格</strong>
          ：在「设置」中配置 Token、file_id、sheet_id 后，点击下方按钮从 WPS
          开放平台拉取记录（每行一条明细）。字段名留空时将按常见中文列名自动匹配。
        </p>
        <p className="mt-2 text-xs text-slate-500">
          接口说明见 WPS 开放平台文档「多维表格 - 列举记录」。若鉴权方式与 Bearer Token
          不一致，请在开放平台核对请求头格式后联系管理员扩展代理接口。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <TextButton variant="primary" disabled={wpsLoading} onClick={() => void pullWps()}>
            {wpsLoading ? "正在拉取…" : "从 WPS 多维表拉取"}
          </TextButton>
          <TextButton variant="secondary" disabled={wpsRows.length === 0} onClick={clearWps}>
            清空已拉取的 WPS 数据
          </TextButton>
          <Link href="/settings">
            <TextButton variant="secondary">WPS 与字段配置</TextButton>
          </Link>
        </div>
        {wpsError ? <p className="mt-2 text-sm text-amber-800">{wpsError}</p> : null}
        {wpsRows.length > 0 ? (
          <p className="mt-2 text-xs text-slate-500">已载入 WPS 明细 {wpsRows.length} 条。</p>
        ) : null}
      </section>

      <section className="mb-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">组合筛选</h2>
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
            <label className="block text-xs text-slate-600">数据来源</label>
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={source}
              onChange={(e) => setSource(e.target.value as "all" | "local" | "wps")}
            >
              <option value="all">全部</option>
              <option value="local">仅本地</option>
              <option value="wps">仅 WPS</option>
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
            value={selectedQuoteId}
            onChange={(e) => setSelectedQuoteId(e.target.value)}
          >
            <option value="">请选择报价单</option>
            {localQuotesForSelect.map((q) => (
              <option key={q.id} value={q.id}>
                {q.quoteNo} · {q.date} · {customerMap.get(q.customerId)?.name ?? "—"} ·{" "}
                {formatCurrency(quoteTotal(q))}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <TextButton variant="secondary" onClick={loadSelectedQuote}>
            加载到报价页
          </TextButton>
          <TextButton
            variant="secondary"
            onClick={() => {
              const id = selectedQuoteId || localQuotesForSelect[0]?.id;
              if (!id) {
                alert("当前筛选结果中没有可使用的本地报价。");
                return;
              }
              router.push(`/contract/new?fromQuote=${encodeURIComponent(id)}`);
            }}
          >
            生成合同
          </TextButton>
        </div>
      </section>

      <div className="hidden lg:block overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-2 font-medium">来源</th>
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
              <tr key={`${r.source}-${r.quoteNo}-${r.wpsRecordId ?? r.quoteId}-${idx}`} className="border-t border-slate-100">
                <td className="px-2 py-2">{r.source === "local" ? "本地" : "WPS"}</td>
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
                  {r.source === "local" && r.quoteId ? (
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
                        onClick={() =>
                          router.push(`/contract/new?fromQuote=${encodeURIComponent(r.quoteId!)}`)
                        }
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
          <p className="px-3 py-8 text-center text-sm text-slate-500">无明细记录，请调整筛选或拉取 WPS 数据</p>
        ) : null}
      </div>

      <div className="space-y-2 lg:hidden">
        {filteredRows.map((r, idx) => (
          <div
            key={`${r.source}-${r.quoteNo}-${r.wpsRecordId ?? r.quoteId}-${idx}`}
            className="rounded border border-slate-200 bg-white p-3 text-sm shadow-sm"
          >
            <div className="flex justify-between text-slate-500">
              <span>{r.source === "local" ? "本地" : "WPS"}</span>
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
            {r.source === "local" && r.quoteId ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <TextButton
                  variant="secondary"
                  onClick={() => router.push(`/quote/new?id=${encodeURIComponent(r.quoteId!)}`)}
                >
                  打开报价
                </TextButton>
                <TextButton
                  variant="secondary"
                  onClick={() =>
                    router.push(`/contract/new?fromQuote=${encodeURIComponent(r.quoteId!)}`)
                  }
                >
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
    </div>
  );
}
