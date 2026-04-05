"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MeJson =
  | { ok: true; loggedIn: false; cloud?: boolean }
  | { ok: true; loggedIn: true; cloud: true; user: { email: string } };

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
    return (
      <Link
        href="/settings"
        className="flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-800 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        设置
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
