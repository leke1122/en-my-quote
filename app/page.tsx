import Link from "next/link";
import { HomeAuthLinks } from "@/components/HomeAuthLinks";

const row1 = [
  { href: "/products", title: "商品信息", emoji: "📦" },
  { href: "/customers", title: "客户信息", emoji: "👥" },
  { href: "/company", title: "我司信息", emoji: "🏢" },
] as const;

const row2 = [
  { href: "/quote/new", title: "新建报价", emoji: "📝" },
  { href: "/quote", title: "查询历史报价", emoji: "📋" },
] as const;

const row3 = [
  { href: "/contract/new", title: "新建合同", emoji: "📄" },
  { href: "/contract", title: "查询合同", emoji: "📑" },
] as const;

/**
 * 宽度原理（设整行总宽为 W，例如 12cm）：
 * - 第一行：3 列等分 → 每格 W/3（例如各 4cm），合计 W。
 * - 第二、三行：2 列等分 → 每格 W/2（例如各 6cm），合计 W。
 * 因此下面每个标签的宽度 = 上面两个标签宽度之和，左右与整行对齐。
 */
const gridRow1 = "grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 sm:items-stretch";
const gridRow23 = "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 sm:items-stretch";

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
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex items-start justify-end gap-3 sm:mb-8">
        <HomeAuthLinks />
      </header>

      <div className="mb-8 text-center sm:mb-10">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          智序商业报价合同生成系统
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          简洁高效 移动端优化 随时报价随时合同 数据安全支持导出
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <nav className={gridRow1} aria-label="基础资料">
          {row1.map((c) => (
            <NavCard key={c.href} href={c.href} title={c.title} emoji={c.emoji} />
          ))}
        </nav>
        <nav className={gridRow23} aria-label="报价">
          {row2.map((c) => (
            <NavCard key={c.href} href={c.href} title={c.title} emoji={c.emoji} />
          ))}
        </nav>
        <nav className={gridRow23} aria-label="合同">
          {row3.map((c) => (
            <NavCard key={c.href} href={c.href} title={c.title} emoji={c.emoji} />
          ))}
        </nav>
      </div>
    </div>
  );
}
