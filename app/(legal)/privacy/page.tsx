import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "2026-04-09";

export default function PrivacyPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Privacy Policy</h1>
      <p>
        This Privacy Policy explains how QuoteFlow collects and uses information when you use our Service. If you do not
        agree, do not use the Service.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account information</strong>: email address and login identifiers (e.g., Google sign‑in).
        </li>
        <li>
          <strong>Content you provide</strong>: company/customer info, quotes, contracts, and uploaded images you store
          in the Service.
        </li>
        <li>
          <strong>Usage data</strong>: basic diagnostics and security logs needed to operate the Service.
        </li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>Provide, maintain, and secure the Service.</li>
        <li>Sync and restore your data when cloud mode is enabled.</li>
        <li>Communicate with you about important account or security matters.</li>
      </ul>
      <p>
        Depending on your location, our legal bases may include performing our contract with you, legitimate interests
        (for security and service reliability), legal obligations, and consent where required.
      </p>

      <h2>3. Cookies</h2>
      <p>
        We use essential cookies for authentication (session cookies). Without these cookies, sign‑in and cloud sync may
        not work.
      </p>

      <h2>4. Sharing</h2>
      <p>
        We do not sell your personal information. We may share information with service providers (e.g., hosting, email,
        payment providers/merchant‑of‑record) only as needed to run the Service.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We retain account and synced data as long as needed to provide the Service, comply with legal obligations, or
        resolve disputes. You can export your data via Settings.
      </p>
      <p>
        If you request account deletion, we will delete or de-identify personal data within a reasonable period unless we
        must retain certain records for legal, tax, fraud-prevention, or dispute-resolution purposes.
      </p>

      <h2>6. Security</h2>
      <p>
        We use reasonable safeguards to protect your data. No system is 100% secure; you are responsible for keeping
        your login credentials safe.
      </p>

      <h2>7. International users</h2>
      <p>
        If you access the Service from outside the region where our servers operate, your information may be processed
        in other jurisdictions.
      </p>

      <h2>8. Your rights and choices</h2>
      <p>
        Subject to applicable law, you may request access, correction, deletion, export, or restriction of your personal
        data, and you may object to certain processing. You may also withdraw consent where processing is based on
        consent.
      </p>
      <p>
        To submit a privacy request, contact us via the Contact page and include the email used for your account. We
        typically respond within 30 days.
      </p>

      <h2>9. Contact</h2>
      <p>If you have questions, privacy requests, or complaints, please contact us via the Contact page.</p>

      <p>
        <strong>Last updated:</strong> {LAST_UPDATED}
      </p>
    </article>
  );
}

