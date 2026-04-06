"use client";

import { useEffect, useState } from "react";

const priceRows = [
  { label: "1 个月", key: "m" as const },
  { label: "一个季度", key: "q" as const },
  { label: "半年", key: "h" as const },
  { label: "一年", key: "y" as const },
];

const quotePrices = { m: "19.8", q: "39.8", h: "59.8", y: "98.8" };
const contractPrices = { m: "19.8", q: "39.8", h: "59.8", y: "98.8" };
const fullPrices = { m: "29.8", q: "49.8", h: "88.8", y: "118.8" };

function PriceList({
  prices,
  permanent,
}: {
  prices: Record<"m" | "q" | "h" | "y", string>;
  permanent?: { label: string; amount: string };
}) {
  return (
    <ul className="mt-3 space-y-2 text-[13px] leading-snug text-slate-600">
      {priceRows.map((row) => (
        <li key={row.key} className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-2">
          <span className="text-slate-500">{row.label}</span>
          <span className="tabular-nums text-sm font-semibold text-slate-900">¥{prices[row.key]}</span>
        </li>
      ))}
      {permanent ? (
        <li className="flex items-baseline justify-between gap-2 border-t border-slate-200 pt-3">
          <span className="font-medium text-slate-800">{permanent.label}</span>
          <span className="tabular-nums text-base font-bold text-slate-900">¥{permanent.amount}</span>
        </li>
      ) : null}
    </ul>
  );
}

export function HomePricingAndShop() {
  const [shopUrl, setShopUrl] = useState("https://hcwnn1122.taobao.com");

  useEffect(() => {
    void fetch("/api/auth/config")
      .then((r) => r.json() as Promise<{ purchaseShopUrl?: string }>)
      .then((j) => {
        if (typeof j.purchaseShopUrl === "string" && j.purchaseShopUrl.trim()) {
          setShopUrl(j.purchaseShopUrl.trim());
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section
      className="mt-10 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 via-white to-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:mt-12 sm:p-7"
      aria-labelledby="home-pricing-title"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 id="home-pricing-title" className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          参考价格
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:text-sm">
          以下为参考标价，实际以淘宝店铺商品页为准；购买后请在「设置 → 个人信息」兑换激活码。
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {/* 体验 */}
        <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-orange-50/50 p-5 shadow-sm ring-1 ring-amber-100/80 transition hover:shadow-md hover:ring-amber-200/90">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-200/30 blur-2xl" aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800/90">体验</p>
          <h3 className="mt-1 text-base font-bold text-amber-950">3 天全功能</h3>
          <p className="mt-auto pt-6">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-amber-900">¥8.8</span>
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-amber-900/70">快速体验报价与合同全流程</p>
        </article>

        {/* 报价版 */}
        <article className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:border-sky-200/80 hover:shadow-md hover:ring-sky-100/80">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-600/90">套餐</p>
          <h3 className="mt-1 text-base font-bold text-slate-900">报价版</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">仅报价相关功能</p>
          <PriceList prices={quotePrices} permanent={{ label: "永久使用版", amount: "168.8" }} />
        </article>

        {/* 合同版 */}
        <article className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:border-violet-200/80 hover:shadow-md hover:ring-violet-100/80">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-600/90">套餐</p>
          <h3 className="mt-1 text-base font-bold text-slate-900">合同版</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">仅合同相关功能</p>
          <PriceList prices={contractPrices} permanent={{ label: "永久使用版", amount: "168.8" }} />
        </article>

        {/* 全功能 */}
        <article className="relative flex flex-col overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 p-5 shadow-md ring-1 ring-emerald-200/60 transition hover:shadow-lg hover:ring-emerald-300/70">
          <div className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            推荐
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/90">套餐</p>
          <h3 className="mt-1 pr-14 text-base font-bold text-slate-900">报价 + 合同</h3>
          <p className="mt-0.5 text-[11px] text-slate-600">全功能版</p>
          <PriceList prices={fullPrices} permanent={{ label: "永久使用版", amount: "198.8" }} />
        </article>
      </div>

      <div className="mx-auto mt-10 max-w-lg border-t border-slate-200/80 pt-8 text-center">
        <p className="text-sm text-slate-600">购买激活码、续费与套餐以淘宝店铺为准</p>
        <a
          href={shopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-[2.75rem] w-full max-w-sm items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 text-sm font-bold text-white shadow-md shadow-amber-500/25 transition hover:from-amber-600 hover:to-orange-600 hover:shadow-lg sm:w-auto sm:min-w-[16rem]"
        >
          打开淘宝店铺购买激活码
        </a>
        <p className="mt-3 break-all font-mono text-[11px] text-slate-400">{shopUrl}</p>
      </div>
    </section>
  );
}
