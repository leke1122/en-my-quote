"use client";

import { useRef, useState } from "react";
import { TextButton } from "@/components/TextButton";
import {
  applyLocalDataBackup,
  collectLocalDataBackup,
  downloadDataBackupJson,
  parseBackupFile,
} from "@/lib/dataBackup";

export function DataBackupSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [includeSecrets, setIncludeSecrets] = useState(false);
  const [importError, setImportError] = useState("");

  function exportJson() {
    const payload = collectLocalDataBackup(includeSecrets);
    downloadDataBackupJson(payload);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError("");
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const parsed = parseBackupFile(text);
      if (!parsed.ok) {
        setImportError(parsed.error);
        return;
      }
      if (!window.confirm("将用文件中的数据覆盖当前浏览器里的报价数据，确定继续？")) return;
      try {
        applyLocalDataBackup(parsed.data);
        alert("已恢复，请刷新页面以加载最新数据。");
        window.location.reload();
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "恢复失败");
      }
    };
    reader.readAsText(f, "utf-8");
  }

  return (
    <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-base font-semibold text-slate-900">数据导出与恢复</h2>
      <p className="mb-3 text-xs leading-relaxed text-slate-600">
        所有业务数据保存在本机浏览器。你可随时导出 JSON 备份，自行保管；需要时可从备份恢复，避免被质疑「数据绑架」。导出的文件请妥善保存，勿泄露给他人。
      </p>
      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={includeSecrets}
          onChange={(e) => setIncludeSecrets(e.target.checked)}
        />
        导出时包含 WPS Token / AppSecret（默认会清空这两项，更安全）
      </label>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onPickFile}
      />
      <div className="flex flex-wrap gap-2">
        <TextButton variant="secondary" onClick={exportJson}>
          导出全部数据（JSON）
        </TextButton>
        <TextButton variant="secondary" onClick={() => fileRef.current?.click()}>
          从 JSON 恢复…
        </TextButton>
      </div>
      {importError ? <p className="mt-2 text-sm text-red-700">{importError}</p> : null}
    </section>
  );
}
