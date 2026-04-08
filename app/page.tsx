import Link from "next/link";
import { HomeGatedNav } from "@/components/home/HomeGatedNav";
import { HomePricingAndShop } from "@/components/home/HomePricingAndShop";
import { HomeAuthLinks } from "@/components/HomeAuthLinks";

const row1 = [
  { href: "/products", title: "商品信息", emoji: "📦" },
  { href: "/customers", title: "客户信息", emoji: "👥" },
  { href: "/company", title: "我司信息", emoji: "🏢" },
] as const;

/**
 * 宽度原理（设整行总宽为 W，例如 12cm）：
 * - 第一行：3 列等分 → 每格 W/3（例如各 4cm），合计 W。
 * - 第二、三行：2 列等分 → 每格 W/2（例如各 6cm），合计 W。
 * 因此下面每个标签的宽度 = 上面两个标签宽度之和，左右与整行对齐。
 */
const gridRow1 = "grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 sm:items-stretch";

const cardClass =
  "flex min-h-[3.25rem] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:min-h-[3.5rem] sm:gap-4 sm:p-5";

function NavCard({ href, title, emoji }: { href: string; title: string; emoji: string }) {
  return (
    <Link href={href} className={cardClass}>
      <span className="text-2xl sm:text-3xl" aria-hidden>
        {emoji}
      </span>
      <span className="text-sm font-medium text-slate-800 sm:text-base">{title}</span>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex items-start justify-end gap-3 sm:mb-8">
        <Link
          href="/pricing"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          价格说明
        </Link>
        <Link
          href="/faq"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          常见问题
        </Link>
        <Link
          href="/help"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          使用说明
        </Link>
        <Link
          href="/release-notes"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          版本说明
        </Link>
        <HomeAuthLinks />
      </header>

      <div className="mb-8 text-center sm:mb-10">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          智序商业报价合同生成系统
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          面向中小团队的报价单与销售合同生成工具，支持手机端操作、历史记录查询、图片/PDF 导出与数据备份。
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <nav className={gridRow1} aria-label="基础资料">
          {row1.map((c) => (
            <NavCard key={c.href} href={c.href} title={c.title} emoji={c.emoji} />
          ))}
        </nav>
        <HomeGatedNav />
      </div>

      <HomePricingAndShop />

      <section className="mt-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm sm:grid-cols-3">
        <div>
          <h2 className="font-semibold text-slate-900">适用场景</h2>
          <p className="mt-1 leading-relaxed">设备销售、工程项目、贸易分销等需要快速出具报价和合同的业务。</p>
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">核心能力</h2>
          <p className="mt-1 leading-relaxed">资料管理、报价合同一体化、移动端导出、只读分享、本地数据备份。</p>
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">了解更多</h2>
          <p className="mt-1 leading-relaxed">
            查看 <Link href="/templates" className="underline-offset-2 hover:underline">模板说明</Link>、
            <Link href="/faq" className="ml-1 underline-offset-2 hover:underline">常见问题</Link> 与
            <Link href="/release-notes" className="ml-1 underline-offset-2 hover:underline">版本说明</Link>。
          </p>
        </div>
      </section>
    </div>
  );
}
