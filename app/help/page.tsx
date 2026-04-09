import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "User guide",
  description:
    "Learn how to create quotes and contracts on mobile, export PDF/images, share links, and back up your data.",
  alternates: { canonical: "/help" },
};

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm leading-relaxed text-slate-600">{subtitle}</p> : null}
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Back to home
        </Link>
      </div>
      {children}
    </section>
  );
}

function Shot({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      title="Open full image in a new tab"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-auto max-w-full rounded-xl border border-slate-200 bg-white shadow-sm transition group-hover:shadow-md"
      />
      <div className="mt-2 text-center text-xs text-slate-500">Tap or click to open the full image</div>
    </a>
  );
}

export default function HelpPage() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">User guide</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            No login required to read this page. Create quotes and contracts on mobile or desktop, export to image or PDF,
            and send read-only share links for customers.
          </p>
        </div>
        <Link
          href="/settings"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Settings & backup
        </Link>
      </header>

      <div className="space-y-6 sm:space-y-8">
        <Section
          title="1. What this app does"
          subtitle="A lightweight flow: products & customers → quotes & contracts → export and share."
        >
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">Common pain points</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Changing price or clauses on the go is awkward without a proper template.</li>
                <li>Multiple quote versions in chat threads make it easy to send the wrong file.</li>
                <li>Turning a quote into a contract by copy-paste is slow and error-prone.</li>
              </ul>
              <p className="mt-4 font-medium text-slate-900">What you get here</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Products, customers, and company profiles; quotes and contracts in one tool.</li>
                <li>One-click export to image or PDF (works well on phones).</li>
                <li>Read-only share links so recipients cannot edit your document.</li>
                <li>Data stays in this browser by default; export JSON backups from Settings.</li>
              </ul>
            </div>
            <Shot src="/help/1.png" alt="Home and feature shortcuts" />
          </div>
        </Section>

        <Section title="2. Products" subtitle="Capture catalog items first so quoting and contracts stay fast.">
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">What you can do</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Add or edit products: code, name, model, specs, unit, unit price.</li>
                <li>Optional image per product; the quote layout can show or hide the image column.</li>
              </ul>
              <p className="text-slate-600">Start with 10–30 items you quote often for smoother field work.</p>
            </div>
            <Shot src="/help/2.png" alt="Product list and new product form" />
          </div>
        </Section>

        <Section title="3. Customers" subtitle="Keep name, contact, phone, address, and billing fields ready.">
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">What you can do</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Add or edit customers: code, contact, phone, address, primary business, tax/bank fields.</li>
                <li>Search and pick a customer on new quote/contract pages, or create one inline.</li>
              </ul>
            </div>
            <Shot src="/help/3.png" alt="Customer list and new customer form" />
          </div>
        </Section>

        <Section
          title="4. Quote list"
          subtitle="Filter past quotes by date, customer, product, and export CSV or Excel."
        >
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">Typical use</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Open a recent quote, keep editing, and save as a new version when needed.</li>
                <li>Export filtered rows for internal tracking or spreadsheets.</li>
              </ul>
              <p className="text-slate-600">Use HTTPS and export backups from Settings on a schedule.</p>
            </div>
            <Shot src="/help/4.png" alt="Quote list, filters, and export" />
          </div>
        </Section>

        <Section
          title="5. Creating a quote (desktop or phone)"
          subtitle="Pick your company and customer, add lines, set terms, then export or share."
        >
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">Steps</p>
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>Open New quote and choose supplier (your company) and customer.</li>
                <li>Add products with unit price and quantity; add fees and terms as needed.</li>
                <li>Use Generate image or Generate PDF to save and send from your phone.</li>
                <li>Share quote creates a read-only preview link or QR code for the customer.</li>
              </ol>
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-900">
                <p className="font-semibold">Mobile-first</p>
                <p className="mt-1 leading-relaxed">
                  No laptop required—create the quote on site, export, and send by email or chat.
                </p>
              </div>
            </div>
            <Shot src="/help/5.png" alt="New quote: export image, PDF, and share" />
          </div>
        </Section>

        <Section
          title="6. Contract list"
          subtitle="Filter by signed date, customer, product, and export CSV or Excel."
        >
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">Typical use</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Find a customer&apos;s contracts to review clauses and amounts.</li>
                <li>Export the list for filing and internal records.</li>
              </ul>
            </div>
            <Shot src="/help/6.png" alt="Contract list, filters, and export" />
          </div>
        </Section>

        <Section
          title="7. Creating a contract"
          subtitle="Start blank or generate from a saved quote, then adjust before export."
        >
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">Options</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>New contract: enter number, date, place, line items, and clauses.</li>
                <li>
                  From quote: use Create from quote on the contract screen to pull lines and default terms from a saved
                  quote.
                </li>
                <li>On mobile you can still generate image, PDF, or a read-only share link.</li>
              </ul>
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-900">
                <p className="font-semibold">Mobile-first</p>
                <p className="mt-1 leading-relaxed">
                  Generate and export contracts on the phone so customers can review a clear PDF or image immediately.
                </p>
              </div>
            </div>
            <Shot src="/help/7.png" alt="New contract, generate from quote, export and share" />
          </div>
        </Section>

        <Section
          title="8. Mobile screenshots"
          subtitle="Examples of the UI on a phone; tap any image to view full size."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Shot src="/help/mobile-home.png" alt="Mobile home" />
            <Shot src="/help/mobile-products.png" alt="Mobile products" />
            <Shot src="/help/mobile-customers.png" alt="Mobile customers" />
            <Shot src="/help/mobile-company.png" alt="Mobile company profiles" />
            <Shot src="/help/mobile-quotes-list.png" alt="Mobile quote list" />
            <Shot src="/help/mobile-quote-new.png" alt="Mobile new quote and export" />
            <Shot src="/help/mobile-contract-new.png" alt="Mobile new contract from quote" />
            <Shot src="/help/mobile-quote-preview.png" alt="Quote export preview" />
            <Shot src="/help/mobile-contract-preview.png" alt="Contract export preview" />
          </div>
        </Section>

        <section className="rounded-2xl border-2 border-amber-500/90 bg-gradient-to-br from-amber-50 to-orange-50/80 p-6 shadow-md">
          <h2 className="text-lg font-bold tracking-tight text-amber-950">Subscribe</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
            A paid plan unlocks full quote and contract features. See plans on the pricing page; manage billing and your
            account under Settings.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/pricing"
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 text-sm font-bold text-white shadow-md shadow-amber-500/25 transition hover:from-amber-600 hover:to-orange-600 hover:shadow-lg"
            >
              View pricing
            </Link>
            <Link
              href="/settings"
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-amber-300 bg-white px-6 text-sm font-bold text-amber-900 shadow-sm hover:bg-amber-50"
            >
              Open settings
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
