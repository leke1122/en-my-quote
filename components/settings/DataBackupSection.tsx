"use client";

import { useState } from "react";
import { TextButton } from "@/components/TextButton";
import { collectLocalDataBackup, downloadDataBackupJson } from "@/lib/dataBackup";

export function DataBackupSection() {
  const [includeSecrets, setIncludeSecrets] = useState(false);

  function exportJson() {
    const payload = collectLocalDataBackup(includeSecrets);
    downloadDataBackupJson(payload);
  }

  return (
    <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-base font-semibold text-slate-900">Data export</h2>
      <p className="mb-3 text-xs leading-relaxed text-slate-600">
        With cloud mode, <strong>account and subscription</strong> are on the server. <strong>Products, customers,
        quotes, and contracts</strong> stay in this browser for speed. Export everything as JSON for your own backup.
        Keep exports private.
      </p>
      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={includeSecrets}
          onChange={(e) => setIncludeSecrets(e.target.checked)}
        />
        Include integration secrets in export (off by default — safer)
      </label>
      <TextButton variant="secondary" onClick={exportJson}>
        Export all data (JSON)
      </TextButton>
    </section>
  );
}
