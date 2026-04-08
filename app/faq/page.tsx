import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "常见问题",
  description:
    "报价、合同导出、账号登录、邮箱验证码、数据备份等常见问题解答，便于快速上手使用。",
  alternates: { canonical: "/faq" },
};

const faqs = [
  {
    q: "支持手机直接出报价和合同吗？",
    a: "支持。手机端可新建报价、合同并导出图片或 PDF，适合外出沟通场景。",
  },
  {
    q: "数据会不会丢失？",
    a: "业务数据默认保存在当前浏览器。建议定期在设置页执行数据导出备份；启用云端账号时可同步项目数据。",
  },
  {
    q: "邮箱验证码收不到怎么办？",
    a: "请先检查垃圾邮件箱，再确认发件域名认证、发信地址和模板变量配置是否正确。",
  },
  {
    q: "可以从报价快速生成合同吗？",
    a: "可以。在合同新建页选择“从报价生成”，可带入明细和基础信息后再编辑。",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/brand-logo.svg" alt="" width={34} height={34} className="h-8 w-8 rounded-md border border-slate-200" />
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">常见问题</h1>
        </div>
        <Link href="/" className="text-sm text-slate-700 underline-offset-2 hover:underline">
          返回首页
        </Link>
      </header>

      <section className="space-y-3">
        {faqs.map((item) => (
          <article key={item.q} className="surface-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-900 sm:text-base">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.a}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

