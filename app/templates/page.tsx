import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "报价与合同模板说明",
  description:
    "了解系统内置报价单与销售合同模板结构，包含明细字段、条款、导出格式与常见使用建议。",
  alternates: { canonical: "/templates" },
};

export default function TemplatesPage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/brand-logo.svg" alt="" width={34} height={34} className="h-8 w-8 rounded-md border border-slate-200" />
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">报价与合同模板说明</h1>
        </div>
        <Link href="/" className="text-sm text-slate-700 underline-offset-2 hover:underline">
          返回首页
        </Link>
      </header>

      <section className="surface-card p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">报价模板</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          包含商品名称、型号、规格、单位、单价、数量、金额、备注等字段。支持是否显示商品图片，支持导出为图片和 PDF。
        </p>

        <h2 className="mt-6 text-base font-semibold text-slate-900">合同模板</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          支持合同标的明细、税率、额外费用、金额大小写、条款与双方签章信息。可从报价快速生成并二次调整。
        </p>

        <h2 className="mt-6 text-base font-semibold text-slate-900">使用建议</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>先维护高频商品与客户资料，再进行报价/合同操作更高效。</li>
          <li>导出前检查关键字段（单价、数量、总额、条款）以避免误发。</li>
          <li>对外发送建议使用导出图片/PDF或只读分享链接。</li>
        </ul>
      </section>
    </div>
  );
}

