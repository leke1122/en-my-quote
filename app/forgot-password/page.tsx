"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TextButton } from "@/components/TextButton";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function sendCode() {
    setMsg("");
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setMsg("邮箱格式不正确");
      return;
    }
    if (cooldown > 0) return;
    setSending(true);
    try {
      const res = await fetch("/api/auth/email/send-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; message?: string; debugCode?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.error || "发送失败");
        return;
      }
      if (j.debugCode) setCode(String(j.debugCode));
      setCooldown(60);
      setMsg(j.message || "验证码已发送，请查收邮箱（含垃圾邮件箱）");
    } catch {
      setMsg("网络错误");
    } finally {
      setSending(false);
    }
  }

  async function resetPassword() {
    setMsg("");
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setMsg("邮箱格式不正确");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setMsg("请输入 6 位数字验证码");
      return;
    }
    if (pw.length < 8) {
      setMsg("新密码至少 8 位");
      return;
    }
    if (pw !== pw2) {
      setMsg("两次输入的新密码不一致");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, code: code.trim(), newPassword: pw }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.error || "重置失败");
        return;
      }
      alert(j.message || "密码已重置，请使用新密码登录");
      router.push("/login");
      router.refresh();
    } catch {
      setMsg("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      <h1 className="text-center text-xl font-semibold text-slate-900">找回密码</h1>
      <p className="mt-2 text-center text-sm text-slate-600">输入注册邮箱，获取验证码后重置密码。</p>

      <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="text-xs text-slate-600">邮箱</label>
          <input
            type="email"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600">验证码</label>
          <div className="mt-1 flex gap-2">
            <input
              inputMode="numeric"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              placeholder="6 位数字"
            />
            <TextButton variant="secondary" disabled={sending || submitting || cooldown > 0} onClick={() => void sendCode()}>
              {cooldown > 0 ? `${cooldown}s` : sending ? "发送中…" : "发送验证码"}
            </TextButton>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-600">新密码（至少 8 位）</label>
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600">确认新密码</label>
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <TextButton variant="primary" disabled={submitting} onClick={() => void resetPassword()}>
          {submitting ? "提交中…" : "重置密码"}
        </TextButton>
        {msg ? <p className="text-sm text-slate-700">{msg}</p> : null}
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-slate-800 underline-offset-2 hover:underline">
          返回登录
        </Link>
        {" · "}
        <Link href="/" className="text-slate-800 underline-offset-2 hover:underline">
          首页
        </Link>
      </p>
    </div>
  );
}

