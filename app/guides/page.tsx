import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Practical guides for SMBs: quote templates, contracts, and getting paid faster with a mobile-first workflow.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndexPage() {
  const posts = [...GUIDES].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  type Topic = "Quotes" | "Contracts" | "Payments" | "Taxes" | "Process";
  const topicId: Record<Topic, string> = {
    Quotes: "quotes",
    Contracts: "contracts",
    Payments: "payments",
    Taxes: "taxes",
    Process: "process",
  };

  const topicOf = (p: (typeof posts)[0]): Topic => {
    const slug = p.slug.toLowerCase();
    const keys = p.keywords.join(" ").toLowerCase();
    const text = `${slug} ${keys} ${p.title.toLowerCase()}`;
    if (text.includes("vat") || text.includes("gst") || text.includes("sales tax") || text.includes("tax")) return "Taxes";
    if (text.includes("payment") || text.includes("get paid") || text.includes("paid")) return "Payments";
    if (text.includes("contract") || text.includes("agreement")) return "Contracts";
    if (text.includes("quote") || text.includes("quotation")) return "Quotes";
    return "Process";
  };

  const grouped: Record<Topic, typeof posts> = {
    Quotes: [],
    Contracts: [],
    Payments: [],
    Taxes: [],
    Process: [],
  };
  posts.forEach((p) => grouped[topicOf(p)].push(p));

  const topics: Topic[] = ["Quotes", "Contracts", "Payments", "Taxes", "Process"];
  return (
    <div id="top" className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Guides</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Short, practical reading for US/EU SMB workflows: quoting, contracting, and getting paid.
          </p>
        </div>
        <Link href="/" className="text-sm text-slate-700 underline-offset-2 hover:underline">
          Back to home
        </Link>
      </header>

      <section className="surface-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900">Topics</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {topics.map((t) => (
            <a
              key={t}
              href={`#${topicId[t]}`}
              className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              {t}
            </a>
          ))}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Tip: start with <strong>Quotes</strong> and <strong>Payments</strong> if you want to reduce sales cycle time.
        </p>
      </section>

      <div className="mt-6 space-y-6">
        {topics.map((t) => (
          <section key={t} id={topicId[t]} className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">{t}</h2>
              <a href="#top" className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline">
                Back to top
              </a>
            </div>
            {grouped[t].map((p) => (
              <article key={p.slug} className="surface-card p-5 sm:p-6">
                <h3 className="text-base font-semibold text-slate-900">
                  <Link
                    href={`/guides/${encodeURIComponent(p.slug)}`}
                    className="hover:underline hover:underline-offset-2"
                  >
                    {p.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{p.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{p.publishedAt}</span>
                  <span className="text-slate-300" aria-hidden>
                    ·
                  </span>
                  <span className="truncate">{p.keywords.slice(0, 4).join(", ")}</span>
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

