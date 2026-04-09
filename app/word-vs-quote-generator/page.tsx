import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Word/Excel vs quote generator: which is better for SMBs?",
  description:
    "Compare Word/Excel quoting vs a mobile quote generator. Learn where SMB teams save time and reduce version errors.",
  alternates: { canonical: "/word-vs-quote-generator" },
  openGraph: {
    title: "Word/Excel vs quote generator | QuoteFlow",
    description:
      "A practical comparison for SMBs: speed, consistency, mobile workflow, and converting quotes to contracts.",
    url: "/word-vs-quote-generator",
    type: "article",
  },
};

const comparisonFaq = [
  {
    q: "Is a quote generator better than Excel for SMB teams?",
    a: "Usually yes for repeat quoting. A generator reduces manual copy/paste, keeps templates consistent, and speeds up mobile workflows.",
  },
  {
    q: "Can I still export PDF for customers?",
    a: "Yes. You can export a professional PDF and also send a read-only share link for mobile viewing.",
  },
  {
    q: "When should a business switch from Word/Excel?",
    a: "A practical threshold is when your team sends 10+ quotes per month or often duplicates data across files.",
  },
  {
    q: "Will this help quote-to-contract conversion?",
    a: "Yes. You can generate contracts from accepted quotes, which shortens admin time and reduces scope errors.",
  },
];

export default function WordVsQuoteGeneratorPage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <Script
        id="word-vs-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Word vs quote generator", item: "/word-vs-quote-generator" },
            ],
          }),
        }}
      />
      <Script
        id="word-vs-faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: comparisonFaq.map((f) => ({
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
          <span aria-hidden>·</span> Comparison
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Word/Excel vs quote generator: what works better for SMBs?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Spreadsheets are flexible, but they break down when teams need speed, consistency, and mobile execution.
        </p>
      </header>

      <section className="surface-card p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Quick comparison</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Category</th>
                <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Word/Excel</th>
                <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Quote generator</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr>
                <td className="border border-slate-200 px-3 py-2">Speed</td>
                <td className="border border-slate-200 px-3 py-2">Manual copy/paste</td>
                <td className="border border-slate-200 px-3 py-2">Reusable product/customer data</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2">Version control</td>
                <td className="border border-slate-200 px-3 py-2">Many files in chat/email</td>
                <td className="border border-slate-200 px-3 py-2">Single share link + history</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2">Mobile workflow</td>
                <td className="border border-slate-200 px-3 py-2">Mostly viewing/edit pain</td>
                <td className="border border-slate-200 px-3 py-2">Create, export, share on phone</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2">Quote to contract</td>
                <td className="border border-slate-200 px-3 py-2">Rebuild manually</td>
                <td className="border border-slate-200 px-3 py-2">Generate contract from quote</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 surface-card p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">When to switch</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>You send more than 10–20 quotes per month.</li>
          <li>You repeatedly retype customer and product details.</li>
          <li>You lose deals because approvals and document edits are too slow.</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/quote-generator"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Try quote workflow
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            View pricing
          </Link>
        </div>
      </section>

      <section className="mt-6 surface-card p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">FAQ</h2>
        <div className="mt-3 space-y-3">
          {comparisonFaq.map((item) => (
            <article key={item.q} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

