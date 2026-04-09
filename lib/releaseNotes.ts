import pkg from "@/package.json";

export type ReleaseNoteItem = {
  version: string;
  datetime: string;
  summary: string[];
};

export const APP_VERSION = pkg.version;

/** Max release notes shown on the page (older entries may remain in code). */
export const RELEASE_NOTES_DISPLAY_LIMIT = 8;

/**
 * Release notes (human-readable).
 * Prepend a new item on each release; entries beyond the display limit stay in code but not on the page.
 */
export const RELEASE_NOTES: ReleaseNoteItem[] = [
  {
    version: "0.2.2",
    datetime: "2026-04-08 21:10",
    summary: [
      "WeChat Native QR checkout: generate payment code, verify callback, persist orders, subscriptions extend automatically per rollover rules.",
      "Added PaymentOrder storage and an order status API for polling payment results.",
    ],
  },
  {
    version: "0.2.1",
    datetime: "2026-04-10 19:50",
    summary: [
      "Rebrand with mobile-first home and public pages, unified card styling and gradients.",
      "Brand logo at public/brand-logo.svg on home and public entry points.",
    ],
  },
  {
    version: "0.2.0",
    datetime: "2026-04-10 19:10",
    summary: [
      "SEO basics: robots, sitemap, and richer site metadata (title, description, canonical, Open Graph).",
      "New public pages (pricing, FAQ, templates); clearer home structure and navigation.",
    ],
  },
  {
    version: "0.1.9",
    datetime: "2026-04-10 18:10",
    summary: [
      "Sign-in supports a redirect parameter to return users after login.",
      "Security: server guard on /settings; basic rate limits on login, email-code registration, and password reset.",
    ],
  },
  {
    version: "0.1.8",
    datetime: "2026-04-10 01:30",
    summary: [
      "Email verification codes via Tencent Cloud mail for registration.",
      "Forgot password: reset with email code (10-minute validity; 60-second resend throttle per inbox).",
    ],
  },
  {
    version: "0.1.7",
    datetime: "2026-04-10 00:10",
    summary: [
      "Quote image/PDF export: more cell padding; columns that are entirely empty shrink; priority width for name, specs, and notes.",
    ],
  },
  {
    version: "0.1.6",
    datetime: "2026-04-09 23:10",
    summary: [
      "Quote/contract export tables: vertically centered headers and cells with consistent padding.",
      "Dynamic column widths from row count and text length: tighter unit/qty/price/amount columns, more room for name, specs, and notes.",
    ],
  },
  {
    version: "0.1.5",
    datetime: "2026-04-09 22:30",
    summary: [
      "Fixed dense export overflow: A4-based adaptive compact layout from row count and text length (font and padding).",
      "Centered tables with wrap and word-break to reduce misalignment from long model numbers or notes.",
    ],
  },
  {
    version: "0.1.4",
    datetime: "2026-04-09 18:30",
    summary: [
      "Contract export/share preview: seal scales to A4 and composites in color (independent of “export in color”); fixes tiny or grayscale seals in some mobile WebViews.",
      "Desktop line-item tables use horizontal centering in exports.",
    ],
  },
  {
    version: "0.1.3",
    datetime: "2026-04-09 12:00",
    summary: [
      "Product list shows historical quote and contract unit-price ranges from saved line items (positive prices only; quote rows match by product id then code; contract rows by code).",
    ],
  },
  {
    version: "0.1.2",
    datetime: "2026-04-08 16:45",
    summary: [
      "Share links strip inline product images to keep payloads small and avoid “data too large” errors.",
      "Supplier dropdown no longer shows a “· default” suffix.",
      "Save default clauses for quotes and contracts; new documents inherit the last saved terms.",
      "New contracts no longer preload long boilerplate clauses.",
    ],
  },
  {
    version: "0.1.1",
    datetime: "2026-04-07 23:30",
    summary: [
      "Home links to release notes.",
      "Help page adds mobile screenshots with tap-to-zoom.",
      "Clarified bank labels to “bank account number” where it applied.",
      "Quotes, contracts, products, customers, and company profiles sync to the database when signed in with cloud.",
      "Product images are compressed on upload to reduce save failures from oversized files.",
    ],
  },
];

/** Recent entries for the release notes page. */
export function getRecentReleaseNotes(): ReleaseNoteItem[] {
  return RELEASE_NOTES.slice(0, RELEASE_NOTES_DISPLAY_LIMIT);
}

