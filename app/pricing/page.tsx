import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "价格与开通说明",
  description:
    "查看智序签单的开通方式、功能范围与适用场景。实际价格以店铺页面为准。",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">价格与开通说明</h1>
        <Link href="/" className="text-sm text-slate-700 underline-offset-2 hover:underline">
          返回首页
        </Link>
      </header>

      <section className="surface-card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Image src="/brand-logo.svg" alt="" width={36} height={36} className="h-9 w-9 rounded-lg border border-slate-200" />
          <p className="text-sm font-semibold text-slate-900">智序签单订阅方案</p>
        </div>
        <p className="text-sm leading-relaxed text-slate-700">
          当前采用激活码方式开通。具体价格、优惠活动、售后政策请以店铺页面展示为准。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h2 className="text-sm font-semibold text-slate-900">报价版</h2>
            <p className="mt-1 text-sm text-slate-700">适合仅需报价管理、导出和分享的团队。</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h2 className="text-sm font-semibold text-slate-900">报价+合同版</h2>
            <p className="mt-1 text-sm text-slate-700">适合从报价到合同全流程管理的团队。</p>
          </article>
        </div>
        <p className="mt-4 text-sm text-slate-600">支持手机端操作，现场可直接导出报价/合同图片或 PDF。</p>
      </section>
    </div>
  );
}

