import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy",
  alternates: { canonical: "/refund" },
};

const LAST_UPDATED = "2026-04-09";

export default function RefundPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Refund Policy</h1>
      <p>
        This policy explains how refunds work for QuoteFlow subscriptions. If your payment is processed by a third‑party
        payment provider or a merchant‑of‑record (MoR), their terms may also apply.
      </p>

      <h2>1. Subscriptions</h2>
      <ul>
        <li>Subscriptions renew automatically until cancelled.</li>
        <li>You can cancel at any time to stop future renewals.</li>
      </ul>

      <h2>2. Refunds</h2>
      <p>
        You may request a refund within <strong>14 calendar days</strong> of the initial charge. Refunds are reviewed
        case-by-case and are generally approved for duplicate charges, clear billing errors, unauthorized transactions,
        or major service outages that prevented normal use.
      </p>
      <p>
        Subscription renewals are typically non-refundable once billed, unless required by law or where a verified
        billing error exists.
      </p>
      <p>
        If your payment is processed by a merchant‑of‑record, the charge may appear on your statement using their
        descriptor (for example, Paddle or an equivalent descriptor), and their payment terms may also apply.
      </p>

      <h2>3. Chargebacks</h2>
      <p>
        If you initiate a chargeback, we may suspend the related account while we investigate. Please contact us first
        so we can help resolve the issue quickly.
      </p>

      <h2>4. How to request a refund</h2>
      <p>
        Contact us with your account email, invoice/receipt number (if available), and a brief explanation. See{" "}
        <Link href="/contact">Contact</Link>.
      </p>
      <p>Approved refunds are usually processed within 5–10 business days to the original payment method.</p>

      <p>
        <strong>Last updated:</strong> {LAST_UPDATED}
      </p>
    </article>
  );
}

