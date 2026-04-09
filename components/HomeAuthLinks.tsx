"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDateUS } from "@/lib/format";

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

type HomeAuthLinksProps = {
  /** Home top bar: tight single row, icon/initials only */
  compact?: boolean;
};

export function HomeAuthLinks({ compact = false }: HomeAuthLinksProps) {
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
      <div
        className={`flex shrink-0 items-center text-sm text-slate-400 ${compact ? "h-8" : "h-9 gap-2"}`}
        aria-hidden
      >
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
    let expiryLabel = "Inactive";
    if (sub?.plan === "lifetime") {
      expiryLabel = "Lifetime";
    } else if (sub?.validUntil) {
      expiryLabel = `Until ${formatDateUS(sub.validUntil)}`;
    }

    return (
      <Link
        href="/settings"
        title={`${email} · ${expiryLabel}`}
        className={`flex shrink-0 items-center rounded-lg border-2 border-slate-800 bg-slate-900 font-semibold text-white shadow-md transition hover:bg-slate-800 ${
          compact ? "h-8 w-8 justify-center p-0" : "gap-2 px-3 py-2 text-sm"
        }`}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/12 text-xs font-bold ring-1 ring-white/20">
          {avatarText}
        </span>
        {compact ? null : <span className="hidden text-xs text-slate-200 sm:inline">{expiryLabel}</span>}
      </Link>
    );
  }

  return (
    <div className={`flex shrink-0 items-center justify-end ${compact ? "gap-1" : "flex-wrap gap-2"}`}>
      <Link
        href="/register"
        className={`rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 ${
          compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        Sign up
      </Link>
      <Link
        href="/login"
        className={`rounded-lg bg-slate-900 font-semibold text-white shadow-md transition hover:bg-slate-800 ${
          compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        Sign in
      </Link>
    </div>
  );
}
