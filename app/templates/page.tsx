import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quote & contract templates",
  description:
    "How built-in quote and sales contract layouts work: line items, terms, exports, and practical tips.",
  alternates: { canonical: "/templates" },
  openGraph: {
    title: "Templates | QuoteFlow",
    description: "How quote and contract templates work: line items, terms, exports, and tips.",
    url: "/templates",
    type: "website",
  },
};

export default function TemplatesPage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/brand-logo.svg" alt="" width={34} height={34} className="h-8 w-8 rounded-md border border-slate-200" />
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Quote & contract templates</h1>
        </div>
        <Link href="/" className="text-sm text-slate-700 underline-offset-2 hover:underline">
          Back to home
        </Link>
      </header>

      <section className="surface-card p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Quote template</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Line items include name, model, specs, unit, unit price, quantity, amount, and notes. Optional product images.
          Export to image or PDF.
        </p>

        <h2 className="mt-6 text-base font-semibold text-slate-900">Contract template</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Supports line items, tax, extra fees, clauses, and signature blocks for both parties. Start from a quote and
          refine.
        </p>

        <h2 className="mt-6 text-base font-semibold text-slate-900">Tips</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Maintain products and customers you use often so quoting and contracting stay fast.</li>
          <li>Before sending, double-check unit price, quantity, totals, and key terms.</li>
          <li>For customers, prefer exported PDF/image or a read-only share link.</li>
        </ul>
      </section>
    </div>
  );
}
