"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TextButton } from "@/components/TextButton";
import { collectLocalDataBackup } from "@/lib/dataBackup";
import { isEntitlementActive } from "@/lib/subscriptionAccess";
import { formatDateUS } from "@/lib/format";
import { describePlan } from "@/lib/subscriptionPlanDisplay";

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

  // Export lives under Data backup to avoid duplicate entry points.

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
      setMsg(j.error || "Sign in failed");
      return;
    }
    setPassword("");
    setMsg("Signed in.");
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
        setMsg(j.error || "Redeem failed");
        return;
      }
      setActivationCode("");
      setMsg("Redeemed. Subscription updated.");
      await refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setRedeeming(false);
    }
  }

  if (loading) {
    return (
      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Account</h2>
        <p className="text-sm text-slate-500">Loading…</p>
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
      <h2 className="mb-1 text-base font-semibold text-slate-900">Account</h2>
      <p className="mb-4 text-xs leading-relaxed text-slate-600">
        {cloudEnabled ? (
          <>
            Account and subscription live in the <strong>server database</strong>. Quotes and contracts are edited and
            cached in this browser. Subscribe or redeem a code to unlock Quotes & Contracts.
          </>
        ) : (
          <>Cloud auth is off — only local browser data; no server account.</>
        )}
      </p>

      {!cloudEnabled ? (
        <p className="text-sm leading-relaxed text-slate-600">
          To enable cloud login, set <code className="rounded bg-slate-100 px-1 font-mono text-xs">DATABASE_URL</code>{" "}
          and <code className="rounded bg-slate-100 px-1 font-mono text-xs">JWT_SECRET</code>, run migrations, then sign
          in here.
        </p>
      ) : null}

      {cloudEnabled && loggedIn && me.loggedIn ? (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-slate-500">Email</p>
            <p className="mt-0.5 text-sm font-medium text-slate-900">{me.user.email}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 sm:px-4">
            <p className="text-xs font-medium text-slate-500">Subscription</p>
            {sub && planMeta ? (
              <>
                <p className="mt-2 text-lg font-semibold text-slate-900">{planMeta.displayName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Includes:
                  {planMeta.quote ? " Quotes" : ""}
                  {planMeta.quote && planMeta.contract ? " ·" : ""}
                  {planMeta.contract ? " Contracts" : ""}
                  {!planMeta.quote && !planMeta.contract ? " —" : ""}
                </p>
                {active ? (
                  <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-800">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="text-slate-600">Start</span>
                      <span className="font-medium tabular-nums">{formatDateUS(periodStartIso)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap justify-between gap-2 border-t border-slate-200/80 pt-1">
                      <span className="text-slate-600">End</span>
                      <span className="font-medium tabular-nums">
                        {sub.plan === "lifetime"
                          ? "Lifetime"
                          : sub.validUntil
                            ? formatDateUS(sub.validUntil)
                            : "—"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Inactive or expired. Redeem a code or subscribe to see dates.
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Plan id: <span className="font-mono">{sub.plan}</span>
                  {" · "}
                  Status:{" "}
                  <span className={active ? "text-emerald-700" : "text-amber-800"}>
                    {active ? "Active" : "Inactive"}
                  </span>
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-amber-800">No subscription yet — redeem a code or subscribe.</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 sm:px-4">
            <p className="text-xs font-medium text-slate-500">Stats (this browser)</p>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <button
                type="button"
                className="flex flex-col items-start rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-left hover:border-slate-200 hover:bg-slate-100"
                onClick={() => router.push("/products")}
              >
                <span className="text-xs text-slate-500">Products</span>
                <span className="mt-0.5 text-base font-semibold tabular-nums text-slate-900">
                  {stats.products}
                </span>
              </button>
              <button
                type="button"
                className="flex flex-col items-start rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-left hover:border-slate-200 hover:bg-slate-100"
                onClick={() => router.push("/customers")}
              >
                <span className="text-xs text-slate-500">Customers</span>
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
                <span className="text-xs text-slate-500">Quote #’s used</span>
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
                <span className="text-xs text-slate-500">Contract #’s used</span>
                <span className="mt-0.5 text-base font-semibold tabular-nums">
                  {stats.contractTimes}
                </span>
              </button>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-600">
              Last sign-in: {formatDateUS(lastLoginAt)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">Activation code (legacy)</label>
            <p className="mt-0.5 text-[11px] text-slate-500">
              If you have a legacy code from ops, paste it here. Plan id must match server config (e.g.{" "}
              <span className="font-mono">quote_monthly</span>, <span className="font-mono">full</span>).
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-slate-500 sm:max-w-md"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder="Activation code"
                autoComplete="off"
              />
              <TextButton variant="primary" disabled={redeeming} onClick={() => void redeem()}>
                {redeeming ? "Applying…" : "Redeem"}
              </TextButton>
            </div>
          </div>

        </div>
      ) : null}

      {cloudEnabled && !loggedIn ? (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-500">Email</label>
              <input
                type="email"
                autoComplete="email"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Password</label>
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
              Sign in
            </TextButton>
            <Link
              href="/register"
              className="inline-flex items-center rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Sign up
            </Link>
          </div>
        </div>
      ) : null}

      {msg ? <p className="mt-3 text-sm text-slate-700">{msg}</p> : null}
    </section>
  );
}
