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
      <h2 className="mb-2 text-base font-semibold text-slate-900">数据导出</h2>
      <p className="mb-3 text-xs leading-relaxed text-slate-600">
        已配置服务端数据库时，<strong>账号与订阅</strong>等信息由服务器维护；您在浏览器中录入的<strong>商品、客户、报价、合同</strong>等业务数据，当前仍保存在本机浏览器中以便快速编辑与查询。可随时将完整业务数据导出为
        JSON 自行保管，避免数据只存在单一环境。导出的文件请妥善保存，勿泄露给他人。
      </p>
      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={includeSecrets}
          onChange={(e) => setIncludeSecrets(e.target.checked)}
        />
        导出时包含应用内配置的敏感密钥字段（默认不导出，更安全）
      </label>
      <TextButton variant="secondary" onClick={exportJson}>
        导出全部数据（JSON）
      </TextButton>
    </section>
  );
}
