import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about quotes, contracts, exports, sign-in, email verification, and data backup for small businesses.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ | QuoteFlow",
    description: "Answers about mobile quoting, contracts, exports, sign-in, and backups.",
    url: "/faq",
    type: "website",
  },
};

const faqs = [
  {
    q: "Can I create quotes and contracts on my phone?",
    a: "Yes. You can create quotes and contracts on mobile and export to image or PDF for field conversations.",
  },
  {
    q: "Could I lose my data?",
    a: "Business data is stored in this browser by default. Export backups regularly from Settings. With a cloud account, project data can sync to the server.",
  },
  {
    q: "I'm not receiving the email verification code.",
    a: "Check spam, then confirm your sender domain (SPF/DKIM), from-address, and template configuration with your email provider.",
  },
  {
    q: "Can I turn a quote into a contract?",
    a: "Yes. On the new contract page, choose generate from a quote to pull line items and basic fields, then edit as needed.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: f.a,
              },
            })),
          }),
        }}
      />
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/brand-logo.svg" alt="" width={34} height={34} className="h-8 w-8 rounded-md border border-slate-200" />
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">FAQ</h1>
        </div>
        <Link href="/" className="text-sm text-slate-700 underline-offset-2 hover:underline">
          Back to home
        </Link>
      </header>

      <section className="space-y-3">
        {faqs.map((item) => (
          <article key={item.q} className="surface-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-900 sm:text-base">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.a}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
