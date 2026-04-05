"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TextButton } from "@/components/TextButton";
import { collectLocalDataBackup, downloadDataBackupJson } from "@/lib/dataBackup";
import { isSubscriptionActive } from "@/lib/subscriptionLogic";

type MeJson =
  | { ok: true; loggedIn: false; cloud?: boolean }
  | {
      ok: true;
      loggedIn: true;
      cloud: true;
      user: { id: string; email: string };
      subscription: {
        plan: string;
        status: string;
        validUntil: string | null;
      } | null;
    };

export function PersonalInfoSection() {
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [trialDays, setTrialDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeJson | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const refresh = useCallback(async () => {
    const cfg = await fetch("/api/auth/config").then(
      (r) => r.json() as Promise<{ cloudAuthEnabled?: boolean; trialDays?: number }>
    );
    setCloudEnabled(!!cfg.cloudAuthEnabled);
    setTrialDays(typeof cfg.trialDays === "number" ? cfg.trialDays : 14);
    const m = await fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json() as Promise<MeJson>);
    setMe(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function quickExport() {
    const payload = collectLocalDataBackup(false);
    downloadDataBackupJson(payload);
  }

  async function login() {
    setMsg("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const j = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !j.ok) {
      setMsg(j.error || "登录失败");
      return;
    }
    setPassword("");
    setMsg("已登录。");
    await refresh();
  }

  async function logout() {
    setMsg("");
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setMsg("已退出。");
    await refresh();
  }

  async function redeem() {
    setMsg("");
    setRedeeming(true);
    try {
      const res = await fetch("/api/subscription/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: activationCode.trim() }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.error || "兑换失败");
        return;
      }
      setActivationCode("");
      setMsg("兑换成功，订阅已更新。");
      await refresh();
    } catch {
      setMsg("网络错误");
    } finally {
      setRedeeming(false);
    }
  }

  if (loading) {
    return (
      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-base font-semibold text-slate-900">个人信息</h2>
        <p className="text-sm text-slate-500">加载中…</p>
      </section>
    );
  }

  const loggedIn = me && "loggedIn" in me && me.loggedIn && me.cloud;
  const sub = loggedIn && me.loggedIn ? me.subscription : null;
  const active =
    sub &&
    isSubscriptionActive(
      sub.validUntil ? new Date(sub.validUntil) : null,
      sub.plan
    );

  return (
    <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-slate-900">个人信息</h2>
      <p className="mb-4 text-xs leading-relaxed text-slate-600">
        云端账号用于订阅与激活；报价、合同等业务数据默认仍保存在本机浏览器。注册默认试用 {trialDays} 天。
      </p>

      <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
        <p className="text-xs font-medium text-slate-600">一键导出本地数据</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          导出当前浏览器中的商品、客户、报价、合同等为 JSON（不含 WPS 密钥）。完整选项见下方「数据导出与恢复」。
        </p>
        <TextButton variant="secondary" className="mt-2" onClick={quickExport}>
          一键导出
        </TextButton>
      </div>

      {!cloudEnabled ? (
        <p className="text-sm leading-relaxed text-slate-600">
          当前部署未启用云端账号。配置{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs">DATABASE_URL</code>、
          <code className="rounded bg-slate-100 px-1 font-mono text-xs">JWT_SECRET</code>{" "}
          并执行数据库迁移后，此处可登录、查看到期日与兑换激活码。
        </p>
      ) : null}

      {cloudEnabled && loggedIn && me.loggedIn ? (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-slate-500">登录邮箱</p>
            <p className="mt-0.5 text-sm font-medium text-slate-900">{me.user.email}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 sm:px-4">
            <p className="text-xs font-medium text-slate-500">订阅到期</p>
            {sub ? (
              <>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">
                  {sub.plan === "lifetime" || !sub.validUntil
                    ? "永久有效"
                    : sub.validUntil.slice(0, 10)}
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  套餐：<span className="font-mono">{sub.plan}</span>
                  {" · "}
                  状态：
                  <span className={active ? "text-emerald-700" : "text-amber-800"}>
                    {active ? "有效" : "已过期或未生效"}
                  </span>
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-amber-800">暂无订阅记录，请兑换激活码或联系管理员。</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">激活码</label>
            <p className="mt-0.5 text-[11px] text-slate-500">在淘宝店铺购买后，将卡密粘贴于此兑换（以店铺说明为准）。</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-slate-500 sm:max-w-md"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder="请输入激活码"
                autoComplete="off"
              />
              <TextButton variant="primary" disabled={redeeming} onClick={() => void redeem()}>
                {redeeming ? "兑换中…" : "兑换"}
              </TextButton>
            </div>
          </div>

          <TextButton variant="secondary" onClick={() => void logout()}>
            退出登录
          </TextButton>
        </div>
      ) : null}

      {cloudEnabled && !loggedIn ? (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-500">邮箱</label>
              <input
                type="email"
                autoComplete="email"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500">密码</label>
              <input
                type="password"
                autoComplete="current-password"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TextButton variant="primary" onClick={() => void login()}>
              登录
            </TextButton>
            <Link
              href="/register"
              className="inline-flex items-center rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              注册（邮箱验证）
            </Link>
          </div>
        </div>
      ) : null}

      {msg ? <p className="mt-3 text-sm text-slate-700">{msg}</p> : null}
    </section>
  );
}
