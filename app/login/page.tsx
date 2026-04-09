"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { markPostLoginSubscriptionCheck } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const oauthError = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("error");
  }, []);

  function redirectTarget(): string {
    if (typeof window === "undefined") return "/settings";
    const raw = new URLSearchParams(window.location.search).get("redirect") || "";
    if (!raw.startsWith("/")) return "/settings";
    if (raw.startsWith("//")) return "/settings";
    if (raw.startsWith("/api/")) return "/settings";
    return raw;
  }

  async function login() {
    setMsg("");
    setLoading(true);
    try {
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
      markPostLoginSubscriptionCheck();
      router.push(redirectTarget());
      router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      <h1 className="text-center text-xl font-semibold text-slate-900">Sign in</h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        Sign in with your email and password (cloud mode requires a configured database).
      </p>

      <div className="mt-4 flex justify-center">
        <Link
          href="/"
          className="inline-flex w-full max-w-xs items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto"
        >
          Back to home
        </Link>
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <a
          href={`/api/auth/google/start?redirect=${encodeURIComponent(redirectTarget())}`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          Continue with Google
        </a>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span>or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div>
          <label className="text-xs text-slate-600">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <TextButton variant="primary" disabled={loading} onClick={() => void login()}>
          {loading ? "Signing in…" : "Sign in"}
        </TextButton>
        {oauthError ? <p className="text-sm text-red-700">{oauthError}</p> : null}
        {msg ? <p className="text-sm text-red-700">{msg}</p> : null}
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/register" className="text-slate-800 underline-offset-2 hover:underline">
          Create account
        </Link>
        {" · "}
        <Link href="/forgot-password" className="text-slate-800 underline-offset-2 hover:underline">
          Forgot password
        </Link>
        {" · "}
        <Link href="/" className="text-slate-800 underline-offset-2 hover:underline">
          Home
        </Link>
      </p>
    </div>
  );
}
