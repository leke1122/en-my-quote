import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Contract generator (sales agreement) for SMBs",
  description:
    "Create simple, professional sales contracts: line items, clauses, signature blocks, PDF export, and share links — mobile-first.",
  alternates: { canonical: "/contract-generator" },
  openGraph: {
    title: "Contract generator for small business | QuoteFlow",
    description:
      "Mobile-first contract generator: build sales agreements, export PDF, share links, and collect acceptance.",
    url: "/contract-generator",
    type: "website",
  },
};

const contractFaq = [
  {
    q: "Can I generate a contract from a quote?",
    a: "Yes. You can convert a quote into a contract and then adjust clauses, taxes, and totals.",
  },
  {
    q: "Can I use this contract generator on mobile?",
    a: "Yes. The workflow is mobile-first and supports creating, exporting, and sharing contracts from phone.",
  },
  {
    q: "Does it support e-sign acceptance and sharing?",
    a: "Yes. You can export PDF and send read-only links; acceptance workflows can be tracked in your process.",
  },
  {
    q: "Is it suitable for small business sales contracts?",
    a: "Yes. It is designed for practical SMB needs: line items, clauses, taxes, and clear contract numbering.",
  },
];

export default function ContractGeneratorLanding() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 pb-24 pt-10 sm:pb-10">
      <Script
        id="contract-generator-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Contract generator", item: "/contract-generator" },
            ],
          }),
        }}
      />
      <Script
        id="contract-generator-faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: contractFaq.map((f) => ({
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
          <span aria-hidden>·</span> Contract generator
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Contract generator for SMBs (mobile-first)
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Turn accepted quotes into a clean contract — reduce disputes and speed up approvals.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/contract/new"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Create a contract
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
          <li>Create contracts with line items, tax, and extra fees</li>
          <li>Edit clauses (terms & conditions) and save your defaults</li>
          <li>Export to PDF for signatures and record-keeping</li>
          <li>Share a read-only link for mobile viewing</li>
          <li>Use consistent contract numbering for auditability</li>
        </ul>
      </section>

      <section className="mt-6 surface-card p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Recommended workflow</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Create a quote and share it with the customer</li>
          <li>When accepted, convert to a contract</li>
          <li>Send PDF + link, collect acceptance, then get paid</li>
        </ol>
        <p className="mt-4 text-sm text-slate-600">
          Also see:{" "}
          <Link href="/quote-generator" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
            quote generator
          </Link>
          .
        </p>
      </section>

      <section className="mt-6 surface-card p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">FAQ</h2>
        <div className="mt-3 space-y-3">
          {contractFaq.map((item) => (
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
            href="/contract/new"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Create contract
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

