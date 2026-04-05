"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TextButton } from "@/components/TextButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

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
        setMsg(j.error || "登录失败");
        return;
      }
      router.push("/settings");
      router.refresh();
    } catch {
      setMsg("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      <h1 className="text-center text-xl font-semibold text-slate-900">登录</h1>
      <p className="mt-2 text-center text-sm text-slate-600">使用已注册的邮箱与密码登录云端账号（需配置数据库）。</p>

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
          <label className="text-xs text-slate-600">密码</label>
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <TextButton variant="primary" disabled={loading} onClick={() => void login()}>
          {loading ? "登录中…" : "登录"}
        </TextButton>
        {msg ? <p className="text-sm text-red-700">{msg}</p> : null}
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/register" className="text-slate-800 underline-offset-2 hover:underline">
          没有账号？去注册
        </Link>
        {" · "}
        <Link href="/" className="text-slate-800 underline-offset-2 hover:underline">
          首页
        </Link>
      </p>
    </div>
  );
}
