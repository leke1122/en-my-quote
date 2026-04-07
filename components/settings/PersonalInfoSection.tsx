"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TextButton } from "@/components/TextButton";
import { collectLocalDataBackup, downloadDataBackupJson } from "@/lib/dataBackup";
import { isEntitlementActive } from "@/lib/subscriptionAccess";
import { describePlan, formatDateYmdCn } from "@/lib/subscriptionPlanDisplay";

type MeJson =
  | { ok: true; loggedIn: false; cloud?: boolean }
  | {
      ok: true;
      loggedIn: true;
      cloud: true;
      user: { id: string; email: string };
      lastLoginAt?: string | null;
      subscription: {
        plan: string;
        status: string;
        validFrom: string | null;
        validUntil: string | null;
        createdAt?: string;
      } | null;
    };

export function PersonalInfoSection() {
  const router = useRouter();
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeJson | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [stats, setStats] = useState<{
    customers: number;
    products: number;
    quotes: number;
    contracts: number;
    quoteTimes: number;
    contractTimes: number;
  }>({
    customers: 0,
    products: 0,
    quotes: 0,
    contracts: 0,
    quoteTimes: 0,
    contractTimes: 0,
  });

  const refresh = useCallback(async () => {
    const cfg = await fetch("/api/auth/config").then(
      (r) => r.json() as Promise<{ cloudAuthEnabled?: boolean; trialDays?: number }>
    );
    setCloudEnabled(!!cfg.cloudAuthEnabled);
    const m = await fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json() as Promise<MeJson>);
    setMe(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload = collectLocalDataBackup(false);
      const quoteTimes = Object.values(payload.quoteCounter ?? {}).reduce(
        (sum, v) => sum + (typeof v === "number" ? v : 0),
        0
      );
      const contractTimes = Object.values(payload.contractCounter ?? {}).reduce(
        (sum, v) => sum + (typeof v === "number" ? v : 0),
        0
      );
      setStats({
        customers: payload.customers.length,
        products: payload.products.length,
        quotes: payload.quotes.length,
        contracts: payload.contracts.length,
        quoteTimes,
        contractTimes,
      });
    } catch {
      // ignore stats errors
    }
  }, []);

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
  const active = Boolean(sub && isEntitlementActive(sub));
  const planMeta = sub ? describePlan(sub.plan) : null;
  const periodStartIso = sub ? sub.validFrom ?? sub.createdAt ?? null : null;
  const lastLoginAt = loggedIn && me.loggedIn ? me.lastLoginAt ?? null : null;

  return (
    <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-slate-900">个人信息</h2>
      <p className="mb-4 text-xs leading-relaxed text-slate-600">
        {cloudEnabled ? (
          <>
            云端账号与订阅信息保存在<strong>服务端数据库</strong>；报价、合同等业务数据在当前浏览器中编辑与缓存。新用户注册后默认未激活，需要在此兑换激活码后方可使用报价与合同功能。
          </>
        ) : (
          <>当前部署未启用服务端数据库时，无云端账号与订阅；业务数据仅保存在本机浏览器。</>
        )}
      </p>

      <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
        <p className="text-xs font-medium text-slate-600">一键导出业务数据</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          将当前浏览器中的商品、客户、报价、合同等打包为 JSON 下载，便于备份与归档。更多选项（如是否包含敏感配置字段）见下方「数据导出」。
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
            <p className="text-xs font-medium text-slate-500">订阅与套餐</p>
            {sub && planMeta ? (
              <>
                <p className="mt-2 text-lg font-semibold text-slate-900">{planMeta.displayName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  包含功能：
                  {planMeta.quote ? " 报价" : ""}
                  {planMeta.quote && planMeta.contract ? " ·" : ""}
                  {planMeta.contract ? " 合同" : ""}
                  {!planMeta.quote && !planMeta.contract ? " —" : ""}
                </p>
                <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-slate-600">开始日期</span>
                    <span className="font-medium tabular-nums">{formatDateYmdCn(periodStartIso)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap justify-between gap-2 border-t border-slate-200/80 pt-1">
                    <span className="text-slate-600">结束日期</span>
                    <span className="font-medium tabular-nums">
                      {sub.plan === "lifetime" || !sub.validUntil
                        ? "永久"
                        : formatDateYmdCn(sub.validUntil)}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  内部标识：<span className="font-mono">{sub.plan}</span>
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

          <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 sm:px-4">
            <p className="text-xs font-medium text-slate-500">账户统计（当前浏览器）</p>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <button
                type="button"
                className="flex flex-col items-start rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-left hover:border-slate-200 hover:bg-slate-100"
                onClick={() => router.push("/products")}
              >
                <span className="text-xs text-slate-500">商品数量</span>
                <span className="mt-0.5 text-base font-semibold tabular-nums text-slate-900">
                  {stats.products}
                </span>
              </button>
              <button
                type="button"
                className="flex flex-col items-start rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-left hover:border-slate-200 hover:bg-slate-100"
                onClick={() => router.push("/customers")}
              >
                <span className="text-xs text-slate-500">客户数量</span>
                <span className="mt-0.5 text-base font-semibold tabular-nums text-slate-900">
                  {stats.customers}
                </span>
              </button>
              <button
                type="button"
                disabled={!active || !planMeta?.quote}
                className="flex flex-col items-start rounded-md border border-slate-100 px-3 py-2 text-left disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 hover:border-slate-200 hover:bg-slate-100"
                onClick={() => {
                  if (!active || !planMeta?.quote) return;
                  router.push("/quote/new");
                }}
              >
                <span className="text-xs text-slate-500">累计报价次数</span>
                <span className="mt-0.5 text-base font-semibold tabular-nums">
                  {stats.quoteTimes}
                </span>
              </button>
              <button
                type="button"
                disabled={!active || !planMeta?.contract}
                className="flex flex-col items-start rounded-md border border-slate-100 px-3 py-2 text-left disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 hover:border-slate-200 hover:bg-slate-100"
                onClick={() => {
                  if (!active || !planMeta?.contract) return;
                  router.push("/contract/new");
                }}
              >
                <span className="text-xs text-slate-500">累计合同次数</span>
                <span className="mt-0.5 text-base font-semibold tabular-nums">
                  {stats.contractTimes}
                </span>
              </button>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-600">
              最近一次登录：{formatDateYmdCn(lastLoginAt)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">激活码</label>
            <p className="mt-0.5 text-[11px] text-slate-500">
              在淘宝购买激活码后粘贴于此。环境与淘宝商品中约定的套餐标识需一致（如{" "}
              <span className="font-mono">quote_monthly</span> 报价月卡、
              <span className="font-mono">quote_contract_monthly</span> 报价+合同月卡）。
            </p>
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
