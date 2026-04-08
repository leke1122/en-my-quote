import Image from "next/image";
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
  "surface-card flex min-h-[3.25rem] items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:min-h-[3.5rem] sm:gap-4 sm:p-5";

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
      <header className="mb-6 flex flex-wrap items-start justify-end gap-2 sm:mb-8 sm:gap-3">
        <Link
          href="/pricing"
          className="surface-card rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white"
        >
          价格说明
        </Link>
        <Link
          href="/faq"
          className="surface-card rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white"
        >
          常见问题
        </Link>
        <Link
          href="/help"
          className="surface-card rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white"
        >
          使用说明
        </Link>
        <Link
          href="/release-notes"
          className="surface-card rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white"
        >
          版本说明
        </Link>
        <HomeAuthLinks />
      </header>

      <section className="surface-card relative mb-8 overflow-hidden p-5 sm:mb-10 sm:p-8">
        <div className="pointer-events-none absolute -right-14 -top-10 h-36 w-36 rounded-full bg-sky-200/45 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-indigo-200/35 blur-2xl" />
        <div className="relative grid gap-6 sm:grid-cols-[1.15fr_0.85fr] sm:items-center">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              智序签单 · 商业效率工具
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              智序签单
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              聚焦报价与合同流程，帮助中小团队在手机与电脑上快速完成资料维护、单据生成、导出分享与历史追溯。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/quote/new"
                className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-sky-600 hover:to-indigo-700"
              >
                开始报价
              </Link>
              <Link
                href="/help"
                className="surface-card rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
              >
                查看演示
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[220px] sm:max-w-[280px]">
            <Image
              src="/brand-logo.svg"
              alt="智序签单 Logo"
              width={512}
              height={512}
              className="h-auto w-full rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-sm"
              priority
            />
          </div>
        </div>
      </section>

      <div className="space-y-3 sm:space-y-4">
        <nav className={gridRow1} aria-label="基础资料">
          {row1.map((c) => (
            <NavCard key={c.href} href={c.href} title={c.title} emoji={c.emoji} />
          ))}
        </nav>
        <HomeGatedNav />
      </div>

      <HomePricingAndShop />

      <section className="surface-card mt-8 grid gap-3 p-4 text-sm text-slate-700 sm:grid-cols-3 sm:p-5">
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
