"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
          aria-label={visible ? "隐藏密码" : "显示密码"}
          title={visible ? "隐藏密码" : "显示密码"}
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
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");
    if (password.length < 8) {
      setMsg("密码至少 8 位");
      return;
    }
    if (password !== passwordConfirm) {
      setMsg("两次输入的密码不一致");
      return;
    }
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
          <label htmlFor="reg-email" className="text-xs text-slate-600">
            邮箱
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
        <PasswordField
          id="reg-password"
          label="密码（至少 8 位）"
          value={password}
          onChange={setPassword}
          visible={showPw}
          onToggleVisible={() => setShowPw((v) => !v)}
          autoComplete="new-password"
        />
        <PasswordField
          id="reg-password-confirm"
          label="确认密码"
          value={passwordConfirm}
          onChange={setPasswordConfirm}
          visible={showPw2}
          onToggleVisible={() => setShowPw2((v) => !v)}
          autoComplete="new-password"
        />
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
