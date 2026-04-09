"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { markPostLoginSubscriptionCheck } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 15.338 7.244 17.5 12 17.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 2.162 10.065 5.5a11.258 11.258 0 01-1.393 2.696M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m-1.414-1.414L9.88 9.88m-1.414-1.414L6.343 6.343m1.414 1.414L12 12m-4.243-4.243l-1.414-1.414"
      />
    </svg>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs text-slate-600">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className="w-full rounded border border-slate-300 px-3 py-2 pr-10 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [msg, setMsg] = useState("");

  async function sendCode() {
    setMsg("");
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setMsg("Invalid email format");
      return;
    }
    if (cooldown > 0) return;
    setSending(true);
    try {
      const res = await fetch("/api/auth/email/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; message?: string; debugCode?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.error || "Send failed");
        return;
      }
      if (j.debugCode) setCode(String(j.debugCode));
      setCooldown(60);
      setMsg(j.message || "Verification code sent. Check your inbox.");
    } catch {
      setMsg("Network error");
    } finally {
      setSending(false);
    }
  }

  // Countdown (UI only)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function submit() {
    setMsg("");
    if (password.length < 8) {
      setMsg("Password must be at least 8 characters");
      return;
    }
    if (password !== passwordConfirm) {
      setMsg("Passwords do not match");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setMsg("Enter the 6-digit verification code");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code: code.trim() }),
        credentials: "include",
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.error || "Registration failed");
        return;
      }
      alert("You’re signed in. Start a subscription under Settings or Pricing to use Quotes & Contracts.");
      markPostLoginSubscriptionCheck();
      router.push("/settings");
      router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      <h1 className="text-center text-xl font-semibold text-slate-900">Create account</h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        Sign up with email verification. Subscribe to unlock Quotes & Contracts. Same email is used for password recovery.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <a
          href="/api/auth/google/start?redirect=%2Fsettings"
          className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          Continue with Google
        </a>
        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span>or sign up with email</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
      </div>

      <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="reg-email" className="text-xs text-slate-600">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="reg-code" className="text-xs text-slate-600">
            Verification code
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="reg-code"
              inputMode="numeric"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              placeholder="6 digits"
            />
            <TextButton variant="secondary" disabled={sending || submitting || cooldown > 0} onClick={() => void sendCode()}>
              {cooldown > 0 ? `${cooldown}s` : sending ? "Sending…" : "Send code"}
            </TextButton>
          </div>
        </div>
        <PasswordField
          id="reg-password"
          label="Password (min 8 characters)"
          value={password}
          onChange={setPassword}
          visible={showPw}
          onToggleVisible={() => setShowPw((v) => !v)}
          autoComplete="new-password"
        />
        <PasswordField
          id="reg-password-confirm"
          label="Confirm password"
          value={passwordConfirm}
          onChange={setPasswordConfirm}
          visible={showPw2}
          onToggleVisible={() => setShowPw2((v) => !v)}
          autoComplete="new-password"
        />
        <TextButton variant="primary" disabled={submitting} onClick={() => void submit()}>
          {submitting ? "Submitting…" : "Sign up & sign in"}
        </TextButton>
        {msg ? <p className="text-sm text-red-700">{msg}</p> : null}
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-slate-800 underline-offset-2 hover:underline">
          Sign in
        </Link>
        {" · "}
        <Link href="/" className="text-slate-800 underline-offset-2 hover:underline">
          Home
        </Link>
      </p>
    </div>
  );
}
