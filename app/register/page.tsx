"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { markPostLoginSubscriptionCheck } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.error || "注册失败");
        return;
      }
      alert("注册成功，已自动登录。请前往「设置 → 个人信息」兑换激活码后使用报价与合同功能。");
      markPostLoginSubscriptionCheck();
      router.push("/settings");
      router.refresh();
    } catch {
      setMsg("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      <h1 className="text-center text-xl font-semibold text-slate-900">注册账号</h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        使用邮箱与密码注册，无需邮件验证码。注册后需兑换激活码方可使用功能；邮箱可用于后续找回密码（待开通）。
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
          {submitting ? "提交中…" : "注册并登录"}
        </TextButton>
        {msg ? <p className="text-sm text-red-700">{msg}</p> : null}
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
