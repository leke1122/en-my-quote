"use client";

const FEATURES = [
  "Mobile-first quotation & proposal builder",
  "Export to PDF and share a link",
  "Basic e‑sign acceptance on mobile",
] as const;

function FeatureList() {
  return (
    <ul className="mt-3 space-y-2 text-[13px] leading-snug text-slate-600">
      {FEATURES.map((t) => (
        <li key={t} className="flex gap-2">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
          <span className="min-w-0 flex-1">{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function HomePricingAndShop() {
  return (
    <section
      className="mt-10 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 via-white to-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:mt-12 sm:p-7"
      aria-labelledby="home-pricing-title"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 id="home-pricing-title" className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          Pricing
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:text-sm">
          Simple plans for US/EU SMBs. Pay monthly or yearly (2 months free).
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        <article className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:border-slate-300 hover:shadow-md">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600/90">Starter</p>
          <h3 className="mt-1 text-base font-bold text-slate-900">$9 / month</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">$99 / year · 10 docs/month · 1 user</p>
          <FeatureList />
        </article>

        <article className="relative flex flex-col overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 p-5 shadow-md ring-1 ring-emerald-200/60 transition hover:shadow-lg hover:ring-emerald-300/70">
          <div className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            Most popular
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/90">Pro</p>
          <h3 className="mt-1 pr-20 text-base font-bold text-slate-900">$19 / month</h3>
          <p className="mt-0.5 text-[11px] text-slate-600">$199 / year · unlimited docs · team up to 3 users</p>
          <FeatureList />
        </article>

        <article className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:border-slate-300 hover:shadow-md">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600/90">Business</p>
          <h3 className="mt-1 text-base font-bold text-slate-900">$39 / month</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">$399 / year · unlimited users · approvals + API</p>
          <FeatureList />
        </article>
      </div>

      <div className="mx-auto mt-10 max-w-lg border-t border-slate-200/80 pt-8 text-center">
        <p className="text-sm text-slate-600">Start a subscription to unlock Quotes & Contracts.</p>
        <a
          href="/pricing"
          className="mt-4 inline-flex min-h-[2.75rem] w-full max-w-sm items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:from-sky-600 hover:to-indigo-700 hover:shadow-lg sm:w-auto sm:min-w-[16rem]"
        >
          View pricing
        </a>
      </div>
    </section>
  );
}
