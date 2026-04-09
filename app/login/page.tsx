"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { markPostLoginSubscriptionCheck } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";

function GoogleGIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.9-6.9C35.86 2.38 30.3 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.06 6.26C12.52 13.02 17.78 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.7-.15-3.33-.44-4.9H24v9.3h12.6c-.54 2.9-2.18 5.35-4.66 7.02l7.2 5.6C43.52 38.42 46.5 31.95 46.5 24.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.62 28.48c-.48-1.42-.76-2.94-.76-4.48s.28-3.06.76-4.48l-8.06-6.26C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.74l8.06-6.26z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.3 0 11.86-2.08 15.8-5.64l-7.2-5.6c-2 1.35-4.56 2.14-8.6 2.14-6.22 0-11.48-3.52-13.38-8.52l-8.06 6.26C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const oauthError = useMemo(() => {
    if (typeof window === "undefined") return null;
    const sp = new URLSearchParams(window.location.search);
    const code = sp.get("error");
    const detail = sp.get("error_detail");
    if (!code) return null;
    if (code === "google_oauth_not_configured") {
      return detail
        ? `Google sign-in is not available yet. ${detail}`
        : "Google sign-in is not available yet. Please use email and password.";
    }
    if (code === "auth_not_configured") {
      return detail
        ? `Sign-in is not available yet. ${detail}`
        : "Sign-in is not available yet. Please contact support or try again later.";
    }
    if (code === "google_redirect_uri_mismatch") {
      return "Google sign-in setup error: redirect URI mismatch. Please contact support.";
    }
    if (code === "google_token_exchange_failed") {
      return detail
        ? `Google sign-in failed. ${detail}`
        : "Google sign-in failed. Please try again.";
    }
    if (code === "google_signin_failed") {
      return "Google sign-in failed. Please try again.";
    }
    return code;
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
          <span className="mr-2 inline-flex">
            <GoogleGIcon />
          </span>
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
