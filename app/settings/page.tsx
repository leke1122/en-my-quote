"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DataBackupSection } from "@/components/settings/DataBackupSection";
import { PersonalInfoSection } from "@/components/settings/PersonalInfoSection";
import { PageHeader } from "@/components/PageHeader";
import { TextButton } from "@/components/TextButton";
import { getSettings, setSettings } from "@/lib/storage";
import type { AppSettings } from "@/lib/types";

export default function SettingsPage() {
  const [form, setForm] = useState<AppSettings>(getSettings());

  useEffect(() => {
    setForm(getSettings());
  }, []);

  function save() {
    setSettings(form);
    alert("已保存到本地");
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <PageHeader title="设置" />

      <section className="mb-8 rounded-xl border-2 border-amber-500/90 bg-gradient-to-br from-amber-50 to-orange-50/80 p-5 shadow-md">
        <h2 className="text-lg font-bold tracking-tight text-amber-950">发卡续费</h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
          购买激活码、套餐续费与功能选配请前往淘宝店铺（以店铺商品说明为准）。
        </p>
        <a
          href="https://hcwnn1122.taobao.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
        >
          打开店铺 hcwnn1122.taobao.com
        </a>
      </section>

      <PersonalInfoSection />
      <DataBackupSection />

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">关于与联系</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          智序商业报价合同生成系统：启用服务端数据库后，<strong>账号与订阅</strong>由服务器维护；您在应用中录入的报价、合同等业务内容在使用时仍缓存在当前浏览器，便于操作，请配合「数据导出」定期备份。
        </p>
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-700">
          <p>
            <span className="text-slate-500">续费店铺：</span>
            <a
              href="https://hcwnn1122.taobao.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-900 underline-offset-2 hover:underline"
            >
              https://hcwnn1122.taobao.com
            </a>
          </p>
          <p>
            <span className="text-slate-500">新用户注册（邮箱验证码）：</span>
            <Link href="/register" className="font-medium text-slate-900 underline-offset-2 hover:underline">
              前往注册页
            </Link>
          </p>
          <p>
            <span className="text-slate-500">开发者微信：</span>
            <span className="font-mono text-slate-900">leshi1122</span>
          </p>
          <p className="text-slate-600">售后与定制开发，欢迎联系。</p>
        </div>
      </section>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">飞书知识库</h2>
        <p className="mb-2 text-sm text-slate-600">常用文档与协作入口（可修改链接并保存）。</p>
        <input
          className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          value={form.feishuKbUrl}
          onChange={(e) => setForm((s) => ({ ...s, feishuKbUrl: e.target.value }))}
          placeholder="https://"
        />
        <a
          href={form.feishuKbUrl || "https://www.feishu.cn/"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-800 underline-offset-2 hover:underline"
        >
          在浏览器中打开飞书知识库链接
        </a>
      </section>

      <TextButton variant="primary" onClick={save}>
        保存设置
      </TextButton>
    </div>
  );
}
