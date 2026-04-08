"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDateYmdCn } from "@/lib/subscriptionPlanDisplay";

type MeJson =
  | { ok: true; loggedIn: false; cloud?: boolean }
  | {
      ok: true;
      loggedIn: true;
      cloud: true;
      user: { email: string };
      subscription?: {
        plan: string;
        status: string;
        validUntil: string | null;
      } | null;
    };

export function HomeAuthLinks() {
  const [me, setMe] = useState<MeJson | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json() as Promise<MeJson>)
      .then(setMe)
      .finally(() => setDone(true));
  }, []);

  if (!done) {
    return (
      <div className="flex h-9 shrink-0 items-center gap-2 text-sm text-slate-400" aria-hidden>
        …
      </div>
    );
  }

  const loggedIn = me && "loggedIn" in me && me.loggedIn && me.cloud;

  if (loggedIn) {
    const email = me.user.email || "";
    const first = email.trim().charAt(0);
    const avatarText = first ? first.toUpperCase() : "U";
    const sub = "subscription" in me ? me.subscription : null;
    let expiryLabel = "未激活";
    if (sub?.plan === "lifetime") {
      expiryLabel = "永久版";
    } else if (sub?.validUntil) {
      expiryLabel = `有效期至 ${formatDateYmdCn(sub.validUntil)}`;
    }

    return (
      <Link
        href="/settings"
        title={email}
        className="flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-800 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/12 text-xs font-bold ring-1 ring-white/20">
          {avatarText}
        </span>
        <span className="hidden text-xs text-slate-200 sm:inline">{expiryLabel}</span>
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <Link
        href="/register"
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
      >
        注册
      </Link>
      <Link
        href="/login"
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
      >
        登录
      </Link>
    </div>
  );
}
