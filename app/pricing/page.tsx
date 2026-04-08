import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "价格与开通说明",
  description:
    "查看智序商业报价合同生成系统的开通方式、功能范围与适用场景。实际价格以店铺页面为准。",
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

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-relaxed text-slate-700">
          当前采用激活码方式开通。具体价格、优惠活动、售后政策请以店铺页面展示为准。
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>报价版：适合仅需报价管理与导出的团队。</li>
          <li>报价+合同版：适合需要从报价延伸到合同管理的团队。</li>
          <li>支持手机端操作，现场可直接导出报价/合同图片或 PDF。</li>
        </ul>
      </section>
    </div>
  );
}

