import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "2026-04-09";

export default function TermsPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Terms of Service</h1>
      <p>
        These Terms of Service (the “Terms”) govern your access to and use of QuoteFlow (the “Service”). By using the
        Service, you agree to these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        QuoteFlow helps you create, export, share, and manage business documents such as quotations and contracts. You
        are responsible for the content you create and share using the Service.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must provide accurate information and keep your account secure.</li>
        <li>You are responsible for all activity under your account.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to misuse the Service, including:</p>
      <ul>
        <li>attempting unauthorized access to the Service or related systems;</li>
        <li>uploading malware or interfering with normal operation;</li>
        <li>using the Service for unlawful, infringing, or abusive purposes.</li>
      </ul>

      <h2>4. Payments and subscriptions</h2>
      <p>
        Paid plans may be offered on a subscription basis. Pricing, plan limits, and included features are described on
        the pricing page and may change over time. Where available, payment processing and tax handling may be provided
        by third‑party payment providers or a merchant‑of‑record.
      </p>
      <ul>
        <li>Subscriptions renew automatically until cancelled.</li>
        <li>Cancellation stops future renewals and takes effect at the end of the current billing period.</li>
        <li>
          Your bank/card statement may show a descriptor from our payment provider or merchant‑of‑record (for example,
          Paddle or an equivalent descriptor).
        </li>
      </ul>

      <h2>5. E‑sign and seals</h2>
      <p>
        The Service may include e‑sign acceptance and digital seal features. You are responsible for ensuring your use
        complies with applicable laws (including e‑signature laws) and for obtaining any required consents.
      </p>

      <h2>6. Data and privacy</h2>
      <p>
        Our privacy practices are described in the Privacy Policy. You retain ownership of your content. You grant us a
        limited license to host, process, and display your content solely to operate the Service.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        The Service is provided “as is” and “as available”. We do not provide legal or tax advice. You should review all
        documents and terms before sending them to customers or signing.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, QuoteFlow will not be liable for indirect, incidental, special,
        consequential, or punitive damages, or for any loss of profits, revenue, data, or goodwill.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate access if you violate these Terms or if
        required by law.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Service after changes become effective means
        you accept the updated Terms.
      </p>

      <h2>11. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of the People&apos;s Republic of China, without regard to conflict-of-law
        principles. Before filing a formal claim, both parties agree to first attempt to resolve disputes in good faith.
        If no resolution is reached, either party may submit the dispute to a court with lawful jurisdiction at our
        registered place of business, unless mandatory consumer law in your country provides otherwise.
      </p>

      <h2>12. Contact</h2>
      <p>If you have questions about these Terms, please contact us via the Contact page.</p>

      <p>
        <strong>Last updated:</strong> {LAST_UPDATED}
      </p>
    </article>
  );
}

