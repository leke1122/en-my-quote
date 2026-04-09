import type { Metadata } from "next";
import Link from "next/link";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { SubscriptionProvider } from "@/components/subscription/SubscriptionProvider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://app.zxaigc.online";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "QuoteFlow",
    template: "%s | QuoteFlow",
  },
  description:
    "Mobile-first quoting and contracting for SMBs. Create quotes & contracts, share links, get e-sign acceptance, and get paid.",
  keywords: ["quotation", "proposal", "quote generator", "contract", "e-sign", "mobile"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "QuoteFlow",
    description:
      "Create quotes & contracts, export PDF, share links, collect e-sign acceptance — mobile first.",
    url: siteUrl,
    siteName: "QuoteFlow",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <I18nProvider>
          <SubscriptionProvider>
            <div className="min-h-screen">
              {children}
              <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <p className="leading-relaxed">
                    © {new Date().getFullYear()} QuoteFlow. Built for US & EU SMB workflows.
                  </p>
                  <nav className="flex flex-wrap gap-x-4 gap-y-2">
                    <Link href="/guides" className="hover:text-slate-900 hover:underline hover:underline-offset-2">
                      Guides
                    </Link>
                    <Link
                      href="/quote-generator"
                      className="hover:text-slate-900 hover:underline hover:underline-offset-2"
                    >
                      Quote generator
                    </Link>
                    <Link
                      href="/contract-generator"
                      className="hover:text-slate-900 hover:underline hover:underline-offset-2"
                    >
                      Contract generator
                    </Link>
                    <Link
                      href="/word-vs-quote-generator"
                      className="hover:text-slate-900 hover:underline hover:underline-offset-2"
                    >
                      Word vs generator
                    </Link>
                    <Link
                      href="/seo-checklist"
                      className="hover:text-slate-900 hover:underline hover:underline-offset-2"
                    >
                      SEO checklist
                    </Link>
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
                </div>
              </footer>
            </div>
          </SubscriptionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
