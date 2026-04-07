import { applyLocalDataBackup, collectLocalDataBackup, parseBackupFile } from "@/lib/dataBackup";

type CloudPullResult = { ok: true } | { ok: false; error: string };

export async function pullProjectDataFromCloud(): Promise<CloudPullResult> {
  try {
    const res = await fetch("/api/project-data", { credentials: "include" });
    const json = (await res.json()) as { ok?: boolean; payload?: unknown; error?: string };
    if (!res.ok || !json.ok || !json.payload) {
      return { ok: false, error: json.error || `拉取失败（${res.status}）` };
    }
    const parsed = parseBackupFile(JSON.stringify(json.payload));
    if (!parsed.ok) {
      return { ok: false, error: `云端数据格式异常：${parsed.error}` };
    }
    applyLocalDataBackup(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "网络异常，无法拉取云端数据" };
  }
}

export async function pushProjectDataToCloud(includeSecrets = false): Promise<CloudPullResult> {
  try {
    const payload = collectLocalDataBackup(includeSecrets);
    const res = await fetch("/api/project-data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ payload }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.error || `同步失败（${res.status}）` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "网络异常，无法同步到云端" };
  }
}

