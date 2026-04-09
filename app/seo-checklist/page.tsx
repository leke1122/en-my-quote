import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SEO launch checklist",
  description:
    "Practical SEO launch checklist for QuoteFlow: Search Console, sitemap, indexing, keywords, and content publishing rhythm.",
  alternates: { canonical: "/seo-checklist" },
  openGraph: {
    title: "SEO launch checklist | QuoteFlow",
    description: "A practical SEO checklist for getting early organic traffic.",
    url: "/seo-checklist",
    type: "article",
  },
};

const steps = [
  "Connect app.zxaigc.online to Google Search Console (Domain or URL prefix property).",
  "Submit sitemap.xml and verify discovered URLs are indexing.",
  "Set NEXT_PUBLIC_SITE_URL=https://app.zxaigc.online in production.",
  "Publish at least 1 new guide per week for the first 8 weeks.",
  "Track target keywords: quote generator, contract generator, quote template.",
  "Check mobile usability and Core Web Vitals in Search Console.",
  "Add internal links from home/pricing to all high-intent landing pages.",
  "Review top queries monthly and expand guides based on search terms.",
] as const;

export default function SeoChecklistPage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <header className="mb-6">
        <p className="text-xs text-slate-500">
          <Link href="/" className="hover:underline hover:underline-offset-2">
            QuoteFlow
          </Link>{" "}
          <span aria-hidden>·</span> Growth
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">SEO launch checklist</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Use this checklist to move from zero traffic to consistent Google visibility in your first months.
        </p>
      </header>

      <section className="surface-card p-5 sm:p-6">
        <ol className="space-y-3 text-sm text-slate-700">
          {steps.map((s, idx) => (
            <li key={idx} className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="font-semibold text-slate-900">{idx + 1}.</span> {s}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 surface-card p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Related pages</h2>
        <p className="mt-2 text-sm text-slate-700">
          <Link href="/guides" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
            Guides
          </Link>{" "}
          ·{" "}
          <Link href="/quote-generator" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
            Quote generator
          </Link>{" "}
          ·{" "}
          <Link href="/contract-generator" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
            Contract generator
          </Link>
        </p>
      </section>
    </div>
  );
}

