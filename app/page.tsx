import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { HomeGatedNav } from "@/components/home/HomeGatedNav";
import { HomePricingAndShop } from "@/components/home/HomePricingAndShop";
import { HomeAuthLinks } from "@/components/HomeAuthLinks";
import { createTranslator } from "@/lib/i18n";
import { GUIDES } from "@/lib/guides";

const row1 = [
  { href: "/products", title: "Products", emoji: "📦" },
  { href: "/customers", title: "Customers", emoji: "👥" },
  { href: "/company", title: "Company", emoji: "🏢" },
] as const;

/**
 * Width layout (row total W, e.g. 12cm):
 * - Row 1: three equal columns → W/3 each.
 * - Rows 2–3: two equal columns → W/2 each.
 * Each pill span matches two cells above so edges align.
 */
const gridRow1 = "grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 sm:items-stretch";

const cardClass =
  "surface-card flex min-h-[3.25rem] items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:min-h-[3.5rem] sm:gap-4 sm:p-5";

const navPill =
  "shrink-0 rounded-lg border border-slate-200/90 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-white";

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
  const t = createTranslator("en-US");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://app.zxaigc.online";
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:py-10">
      <Script
        id="ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "QuoteFlow",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: siteUrl,
            description:
              "Mobile-first quoting and contracting for SMBs. Create quotes & contracts, share links, get e-sign acceptance, and get paid.",
            offers: [
              { "@type": "Offer", name: "Starter", price: 9, priceCurrency: "USD", category: "subscription" },
              { "@type": "Offer", name: "Pro", price: 19, priceCurrency: "USD", category: "subscription" },
              { "@type": "Offer", name: "Business", price: 39, priceCurrency: "USD", category: "subscription" },
            ],
          }),
        }}
      />
      <header className="mb-6 flex items-center gap-2 sm:mb-8 sm:gap-4">
        <Link
          href="/"
          className="shrink-0 rounded-xl ring-slate-200/80 transition hover:ring-2"
          aria-label={t("marketing.productName")}
        >
          <Image
            src="/site-logo.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 rounded-xl object-cover shadow-sm sm:h-10 sm:w-10"
            priority
          />
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1.5">
          <Link href="/pricing" className={navPill} title={t("marketing.navPricing")}>
            $
          </Link>
          <Link href="/faq" className={navPill} title={t("marketing.navFaq")}>
            ?
          </Link>
          <Link href="/help" className={navPill} title={t("marketing.navHelp")}>
            i
          </Link>
          <Link href="/release-notes" className={navPill} title={t("marketing.navReleaseNotes")}>
            v
          </Link>
          <Link href="/word-vs-quote-generator" className={navPill} title="Word/Excel vs generator">
            vs
          </Link>
          <HomeAuthLinks compact />
        </div>
      </header>

      <section className="surface-card relative mb-8 overflow-hidden p-5 sm:mb-10 sm:p-8">
        <div className="pointer-events-none absolute -right-14 -top-10 h-36 w-36 rounded-full bg-sky-200/45 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-indigo-200/35 blur-2xl" />
        <div className="relative max-w-xl">
          <p className="mb-2 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
            {t("marketing.tagline")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {t("marketing.heroTitle")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            {t("marketing.heroBody")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/quote/new"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-sky-600 hover:to-indigo-700"
            >
              {t("marketing.ctaPrimary")}
            </Link>
            <Link
              href="/help"
              className="inline-flex min-h-[44px] items-center justify-center surface-card rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
            >
              {t("marketing.ctaSecondary")}
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50"
            >
              View pricing
            </Link>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
              <div className="text-xs font-semibold text-slate-900">Built for SMB speed</div>
              <div className="mt-1 text-xs leading-relaxed text-slate-600">
                Replace Word/Excel with a fast, consistent document workflow.
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
              <div className="text-xs font-semibold text-slate-900">Share links & export</div>
              <div className="mt-1 text-xs leading-relaxed text-slate-600">
                Export PDF in one tap and send a read-only link to customers.
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
              <div className="text-xs font-semibold text-slate-900">E‑sign acceptance</div>
              <div className="mt-1 text-xs leading-relaxed text-slate-600">
                Collect acceptance and keep a clean document history.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card mb-8 p-5 sm:mb-10 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">New here? Start in 3 steps</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Set up once, then quote on mobile in minutes.
            </p>
          </div>
          <Link href="/help" className="text-sm font-semibold text-slate-800 underline-offset-2 hover:underline">
            Full guide
          </Link>
        </div>
        <ol className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <li className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">STEP 1</p>
            <p className="mt-1 font-semibold text-slate-900">Create your company profile</p>
            <p className="mt-1 text-slate-600">Add legal name, address, and banking details once.</p>
            <Link href="/company" className="mt-3 inline-block text-sm font-semibold text-slate-900 underline-offset-2 hover:underline">
              Open company
            </Link>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">STEP 2</p>
            <p className="mt-1 font-semibold text-slate-900">Add customers and products</p>
            <p className="mt-1 text-slate-600">Reuse records to avoid retyping on every quote.</p>
            <div className="mt-3 flex gap-3">
              <Link href="/customers" className="text-sm font-semibold text-slate-900 underline-offset-2 hover:underline">
                Customers
              </Link>
              <Link href="/products" className="text-sm font-semibold text-slate-900 underline-offset-2 hover:underline">
                Products
              </Link>
            </div>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">STEP 3</p>
            <p className="mt-1 font-semibold text-slate-900">Create and send your first quote</p>
            <p className="mt-1 text-slate-600">Use payment terms, share link, and track status.</p>
            <Link href="/quote/new" className="mt-3 inline-block text-sm font-semibold text-slate-900 underline-offset-2 hover:underline">
              New quote
            </Link>
          </li>
        </ol>
      </section>

      <HomePricingAndShop />

      <section className="surface-card mt-8 p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">How it works</h2>
        <ol className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
          <li className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-900">1) Build</p>
            <p className="mt-1 leading-relaxed text-slate-600">Set up your company, customers, and products.</p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-900">2) Send</p>
            <p className="mt-1 leading-relaxed text-slate-600">Generate a quote or contract, export PDF, and share a link.</p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-900">3) Close</p>
            <p className="mt-1 leading-relaxed text-slate-600">Collect acceptance and convert quotes to contracts.</p>
          </li>
        </ol>
      </section>

      <section className="surface-card mt-8 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Popular guides</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Practical reading that ranks well on Google and helps SMBs close deals faster.
            </p>
          </div>
          <Link
            href="/guides"
            className="text-sm font-semibold text-slate-800 underline-offset-2 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[...GUIDES]
            .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
            .slice(0, 3)
            .map((p) => (
              <article key={p.slug} className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  <Link
                    href={`/guides/${encodeURIComponent(p.slug)}`}
                    className="hover:underline hover:underline-offset-2"
                  >
                    {p.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.description}</p>
              </article>
            ))}
        </div>
      </section>

      <section className="surface-card mt-8 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Open the app</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Manage your catalog and contacts, then create quotes and contracts. If you’re in cloud mode, sign in to
              unlock subscribed features.
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>

        <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">
            Quick links (products, customers, quotes, contracts)
          </summary>
          <div className="mt-4 space-y-3 sm:space-y-4">
            <nav className={gridRow1} aria-label="Workspace">
              {row1.map((c) => (
                <NavCard key={c.href} href={c.href} title={c.title} emoji={c.emoji} />
              ))}
            </nav>
            <HomeGatedNav />
          </div>
        </details>
      </section>

      <section className="surface-card mt-8 grid gap-3 p-4 text-sm text-slate-700 sm:grid-cols-3 sm:p-5">
        <div>
          <h2 className="font-semibold text-slate-900">Use cases</h2>
          <p className="mt-1 leading-relaxed">
            Sales teams, trades, services and distributors who need fast, professional quotes on the go.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">What you get</h2>
          <p className="mt-1 leading-relaxed">
            Contacts & products, quotation to contract workflow, PDF export, share links, and e‑sign acceptance.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">Learn more</h2>
          <p className="mt-1 leading-relaxed">
            Read <Link href="/templates" className="underline-offset-2 hover:underline">templates</Link>,{" "}
            <Link href="/faq" className="underline-offset-2 hover:underline">
              FAQ
            </Link>{" "}
            and{" "}
            <Link href="/release-notes" className="underline-offset-2 hover:underline">
              release notes
            </Link>
            .
          </p>
          <p className="mt-2 leading-relaxed">
            Explore{" "}
            <Link href="/quote-generator" className="underline-offset-2 hover:underline">
              quote generator
            </Link>{" "}
            and{" "}
            <Link href="/contract-generator" className="underline-offset-2 hover:underline">
              contract generator
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
