import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://app.zxaigc.online";

export const metadata: Metadata = {
  title: "Quote generator (mobile-first) for small business",
  description:
    "Create professional quotes on mobile: line items, taxes, totals, PDF export, share links, and e-sign acceptance.",
  alternates: { canonical: "/quote-generator" },
  openGraph: {
    title: "Quote generator for small business | QuoteFlow",
    description:
      "Mobile-first quote generator: build quotes fast, export PDF, share links, and collect acceptance.",
    url: "/quote-generator",
    type: "website",
  },
};

const quoteFaq = [
  {
    q: "Can I create a quote on mobile and send it immediately?",
    a: "Yes. You can create a quote on phone, export PDF/image, or share a read-only link in minutes.",
  },
  {
    q: "Does the quote generator support sales tax or VAT?",
    a: "Yes. You can set tax included/not included, tax rate (%), and the system calculates totals.",
  },
  {
    q: "Can I turn a quote into a contract?",
    a: "Yes. You can generate a contract from an existing quote, then edit clauses and details.",
  },
  {
    q: "Is this suitable for US and EU SMB workflows?",
    a: "Yes. The app is optimized for mobile-first SMB usage and supports common quote/contract structures for US/EU teams.",
  },
];

export default function QuoteGeneratorLanding() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 pb-24 pt-10 sm:pb-10">
      <Script
        id="quote-generator-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              {
                "@type": "ListItem",
                position: 2,
                name: "Quote generator",
                item: `${SITE_URL}/quote-generator`,
              },
            ],
          }),
        }}
      />
      <Script
        id="quote-generator-faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: quoteFaq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <header className="mb-6">
        <p className="text-xs text-slate-500">
          <Link href="/" className="hover:underline hover:underline-offset-2">
            QuoteFlow
          </Link>{" "}
          <span aria-hidden>·</span> Quote generator
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Quote generator for small business (mobile-first)
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Stop rebuilding quotes in Word/Excel. Create consistent, professional quotes in minutes — on your phone or
          desktop.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/quote/new"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Create a quote
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            View pricing
          </Link>
          <Link
            href="/guides"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Read guides
          </Link>
        </div>
      </header>

      <section className="surface-card p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">What you can do</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Build quotes with line items, quantities, unit prices, and totals</li>
          <li>Show tax as sales tax / VAT (rate + amount) and control whether it’s included</li>
          <li>Export to PDF (or image) for fast customer sharing</li>
          <li>Create a read-only share link for mobile viewing</li>
          <li>Convert quotes into contracts when the customer accepts</li>
        </ul>
      </section>

      <section className="mt-6 surface-card p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Common use cases</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Contractors, services, distributors, and small sales teams that need fast quoting on the go.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Next:{" "}
          <Link href="/contract-generator" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
            contract generator
          </Link>{" "}
          and{" "}
          <Link href="/guides" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
            guides
          </Link>
          .
        </p>
      </section>

      <section className="mt-6 surface-card p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">FAQ</h2>
        <div className="mt-3 space-y-3">
          {quoteFaq.map((item) => (
            <article key={item.q} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-4xl gap-2">
          <Link
            href="/quote/new"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Create quote
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}

