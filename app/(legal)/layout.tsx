import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm font-semibold text-slate-900 underline-offset-2 hover:underline">
          QuoteFlow
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
          <Link href="/terms" className="hover:text-slate-900 hover:underline hover:underline-offset-2">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-slate-900 hover:underline hover:underline-offset-2">
            Privacy
          </Link>
          <Link href="/refund" className="hover:text-slate-900 hover:underline hover:underline-offset-2">
            Refunds
          </Link>
          <Link href="/contact" className="hover:text-slate-900 hover:underline hover:underline-offset-2">
            Contact
          </Link>
        </nav>
      </header>
      <main className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">{children}</main>
      <footer className="mt-8 text-xs text-slate-500">
        <p>
          This website is a software service. Nothing here is legal, tax, or financial advice. Consult qualified
          professionals for your situation.
        </p>
      </footer>
    </div>
  );
}

