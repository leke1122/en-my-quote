"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DataBackupSection } from "@/components/settings/DataBackupSection";
import { PersonalInfoSection } from "@/components/settings/PersonalInfoSection";
import { PageHeader } from "@/components/PageHeader";
import { TextButton } from "@/components/TextButton";
import { formatMoney, normalizeDocumentCurrency } from "@/lib/format";
import { getSettings, setSettings } from "@/lib/storage";
import type { AppSettings } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<AppSettings>(getSettings());

  useEffect(() => {
    setForm(getSettings());
  }, []);

  function save() {
    setSettings(form);
    alert("Saved locally.");
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <PageHeader
        title="Settings"
        actions={
          <TextButton variant="secondary" className="text-red-700" onClick={() => void logout()}>
            Sign out
          </TextButton>
        }
      />

      <PersonalInfoSection />
      <DataBackupSection />

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Regional defaults</h2>
        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          Default ISO 4217 currency for <strong>new</strong> quotes and contracts. Each document can still use its own
          currency. Example preview: {formatMoney(1234.56, normalizeDocumentCurrency(form.documentCurrency))}.
        </p>
        <label className="block max-w-xs text-sm">
          <span className="text-slate-700">Document currency</span>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono uppercase"
            maxLength={3}
            autoComplete="off"
            value={form.documentCurrency}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                documentCurrency: e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3),
              }))
            }
            onBlur={() =>
              setForm((s) => ({
                ...s,
                documentCurrency: normalizeDocumentCurrency(s.documentCurrency),
              }))
            }
          />
        </label>
      </section>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Account & billing</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          With cloud mode enabled, your <strong>account and subscription</strong> are stored on the server. Quotes and
          contracts are cached in this browser while you work — use <strong>Data export</strong> below for backups.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/pricing" className="font-semibold text-sky-700 underline-offset-2 hover:underline">
            View pricing & subscribe (Stripe)
          </Link>
        </p>
      </section>

      <TextButton variant="primary" onClick={save}>
        Save settings
      </TextButton>
    </div>
  );
}
