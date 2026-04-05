"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TextButton } from "@/components/TextButton";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [devHint, setDevHint] = useState("");

  async function sendCode() {
    setMsg("");
    setDevHint("");
    setSending(true);
    try {
      const res = await fetch("/api/auth/email/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        debugCode?: string;
      };
      if (!res.ok || !j.ok) {
        setMsg(j.error || "发送失败");
        return;
      }
      setMsg(j.message || "已发送");
      if (j.debugCode) setDevHint(`（开发环境）验证码：${j.debugCode}`);
    } catch {
      setMsg("网络错误");
    } finally {
      setSending(false);
    }
  }

  async function submit() {
    setMsg("");
    setDevHint("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
        credentials: "include",
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.error || "注册失败");
        return;
      }
      alert("注册成功，已自动登录");
      router.push("/");
      router.refresh();
    } catch {
      setMsg("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      <h1 className="text-center text-xl font-semibold text-slate-900">邮箱注册</h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        需要服务端已配置数据库与邮件（或本地开发自动打印验证码）。激活码与套餐以店铺说明为准。
      </p>

      <div className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
        <TextButton variant="secondary" disabled={sending} onClick={() => void sendCode()}>
          {sending ? "发送中…" : "发送验证码"}
        </TextButton>
        <div>
          <label className="text-xs text-slate-600">6 位验证码</label>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600">密码（至少 8 位）</label>
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <TextButton variant="primary" disabled={submitting} onClick={() => void submit()}>
          {submitting ? "提交中…" : "完成注册"}
        </TextButton>
        {msg ? <p className="text-sm text-slate-700">{msg}</p> : null}
        {devHint ? <p className="font-mono text-xs text-amber-800">{devHint}</p> : null}
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
