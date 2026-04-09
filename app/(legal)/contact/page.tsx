import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Contact</h1>
      <p>For support, billing, or legal inquiries, contact us using the details below.</p>

      <h2>Support email</h2>
      <p>
        <a href="mailto:hcwnn122@gmail.com">hcwnn122@gmail.com</a>
      </p>

      <h2>Support response time</h2>
      <p>We aim to respond within 24 hours (business days).</p>

      <h2>Company</h2>
      <p>
        <strong>Legal entity name:</strong> Dalian Economic and Technological Development Zone Yunzhishang Internet
        Information Service Center
      </p>
      <p>
        <strong>Entity type:</strong> Sole proprietorship (individual business)
      </p>
      <p>
        <strong>Country/Region:</strong> China
      </p>
      <p>
        <strong>Registered business address:</strong> No. 26 Chifeng Street, Dalian Economic and Technological
        Development Zone, Dalian, Liaoning, China
      </p>
      <p>
        <strong>Billing & refund email:</strong> <a href="mailto:hcwnn122@gmail.com">hcwnn122@gmail.com</a>
      </p>
    </article>
  );
}

