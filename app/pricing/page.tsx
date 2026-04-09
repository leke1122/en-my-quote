import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple subscription plans for US/EU SMBs. Secure checkout.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | QuoteFlow",
    description: "Starter, Pro, and Business plans. Mobile-first quotes & contracts for SMBs.",
    url: "/pricing",
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Pricing</h1>
        <Link href="/" className="text-sm text-slate-700 underline-offset-2 hover:underline">
          Back to home
        </Link>
      </header>

      <section className="surface-card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Image src="/brand-logo.svg" alt="" width={36} height={36} className="h-9 w-9 rounded-lg border border-slate-200" />
          <p className="text-sm font-semibold text-slate-900">QuoteFlow plans</p>
        </div>
        <p className="text-sm leading-relaxed text-slate-700">
          Built for US/EU SMB workflows: create quotes and contracts on mobile, share a link, get acceptance, and get paid.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900">Starter</h2>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                Promo: first month $5
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold">$9/month</span> or <span className="font-semibold">$99/year</span>
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>10 documents / month</li>
              <li>Full mobile web workflow</li>
              <li>Basic e‑sign acceptance</li>
              <li>1 user</li>
            </ul>
          </article>

          <article className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm ring-1 ring-emerald-200/60">
            <div className="absolute right-4 top-4 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
              Most recommended
            </div>
            <h2 className="text-base font-bold text-slate-900">Pro</h2>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold">$19/month</span> or <span className="font-semibold">$199/year</span>{" "}
              <span className="text-slate-500">(2 months free)</span>
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>Unlimited documents</li>
              <li>Team: up to 3 users</li>
              <li>Payment links (via merchant‑of‑record)</li>
              <li>Document tracking</li>
              <li>AI templates (draft assist)</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <h2 className="text-base font-bold text-slate-900">Business</h2>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold">$39/month</span> or <span className="font-semibold">$399/year</span>{" "}
              <span className="text-slate-500">(2 months free)</span>
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>Unlimited documents + unlimited users</li>
              <li>Approval workflows</li>
              <li>Multi‑currency</li>
              <li>Priority support</li>
              <li>API access</li>
            </ul>
          </article>
        </div>
        <p className="mt-5 text-sm text-slate-600">
          Yearly billing includes <strong>2 months free</strong>. Taxes may be calculated and collected by our
          payment provider / merchant‑of‑record where applicable.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-relaxed text-slate-700">
          <p>
            <strong>Billing terms:</strong> Subscriptions auto-renew by default (monthly or yearly) until cancelled.
            You can cancel anytime to stop future renewals. Access remains active until the end of the current billing
            period.
          </p>
          <p className="mt-2">
            <strong>Statement descriptor:</strong> Charges may appear under our payment provider / merchant-of-record
            descriptor (for example, Paddle or an equivalent descriptor).
          </p>
          <p className="mt-2">
            <strong>Refund terms:</strong> Initial purchases may be requested for refund within 14 calendar days.
            Subscription renewals are typically non-refundable once billed, unless required by law or where a verified
            billing error exists. Approved refunds are processed to the original payment method.
          </p>
          <p className="mt-2">
            <strong>Need help?</strong> Contact{" "}
            <a href="mailto:hcwnn122@gmail.com" className="font-semibold underline underline-offset-2">
              hcwnn122@gmail.com
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

