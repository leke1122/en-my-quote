"use client";

import { SubscriptionFeatureGate } from "@/components/subscription/SubscriptionFeatureGate";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { useSubscriptionAccess } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";
import { pushProjectDataToCloud } from "@/lib/cloudProjectData";
import { getCompanies, setCompanies } from "@/lib/storage";
import type { Company } from "@/lib/types";

const emptyForm: Omit<Company, "id"> = {
  name: "",
  contact: "",
  phone: "",
  address: "",
  taxId: "",
  bankName: "",
  bankCode: "",
  logo: "",
  sealImage: "",
  abbr: "",
  isDefault: false,
};

export default function CompanyPage() {
  return (
    <SubscriptionFeatureGate feature="base">
      <CompanyPageInner />
    </SubscriptionFeatureGate>
  );
}

function CompanyPageInner() {
  const subCtx = useSubscriptionAccess();
  const [list, setList] = useState<Company[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<Omit<Company, "id">>(emptyForm);

  const refresh = useCallback(() => {
    setList(getCompanies());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, isDefault: list.length === 0 });
    setModalOpen(true);
  }

  function openEdit(c: Company) {
    setEditing(c);
    setForm({
      name: c.name,
      contact: c.contact,
      phone: c.phone,
      address: c.address,
      taxId: c.taxId,
      bankName: c.bankName,
      bankCode: c.bankCode,
      logo: c.logo ?? "",
      sealImage: c.sealImage ?? "",
      abbr: c.abbr,
      isDefault: c.isDefault,
    });
    setModalOpen(true);
  }

  function applyDefault(next: Company[]): Company[] {
    const has = next.some((c) => c.isDefault);
    if (!has && next.length > 0) {
      return next.map((c, i) => (i === 0 ? { ...c, isDefault: true } : { ...c, isDefault: false }));
    }
    return next;
  }

  async function save() {
    const rows = getCompanies();
    if (!form.name.trim() || !form.abbr.trim()) {
      alert("请填写公司名称与英文简写");
      return;
    }
    const abbr = form.abbr.trim().toUpperCase();
    const id =
      editing?.id ??
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `cmp-${Date.now()}`);
    let next: Company[];
    if (editing) {
      next = rows.map((c) =>
        c.id === id ? { ...c, ...form, abbr, id, isDefault: !!form.isDefault } : c
      );
    } else {
      next = [...rows, { id, ...form, abbr, isDefault: !!form.isDefault }];
    }
    if (form.isDefault) {
      next = next.map((c) => ({ ...c, isDefault: c.id === id }));
    }
    next = applyDefault(next);
    setCompanies(next);
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) alert(`已保存到本地，但同步云端失败：${sync.error}`);
    }
    setModalOpen(false);
    refresh();
  }

  async function remove(c: Company) {
    if (!confirm(`确定删除「${c.name}」？`)) return;
    let next = getCompanies().filter((x) => x.id !== c.id);
    next = applyDefault(next);
    setCompanies(next);
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) alert(`已删除本地数据，但同步云端失败：${sync.error}`);
    }
    refresh();
  }

  async function setDefault(c: Company) {
    const next = getCompanies().map((x) => ({ ...x, isDefault: x.id === c.id }));
    setCompanies(next);
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) alert(`已保存默认主体到本地，但同步云端失败：${sync.error}`);
    }
    refresh();
  }

  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") setForm((s) => ({ ...s, logo: r }));
    };
    reader.readAsDataURL(f);
  }

  function onSealFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "image/png") {
      alert("请上传 PNG 格式公章（透明底）");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") setForm((s) => ({ ...s, sealImage: r }));
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <PageHeader
        title="我司信息"
        actions={
          <TextButton variant="primary" onClick={openCreate}>
            新增主体
          </TextButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-base font-semibold text-slate-900">{c.name}</div>
                {c.isDefault ? (
                  <span className="mt-1 inline-block rounded bg-slate-800 px-2 py-0.5 text-xs text-white">
                    默认
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                {c.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logo} alt="" className="h-12 w-12 rounded object-contain" title="Logo" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-slate-200 text-xs text-slate-400">
                    Logo
                  </div>
                )}
                {c.sealImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.sealImage}
                    alt=""
                    className="h-12 w-12 rounded object-contain bg-slate-50"
                    title="公章"
                  />
                ) : null}
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <div>英文简写：{c.abbr}</div>
              <div>
                联系人：{c.contact} · {c.phone}
              </div>
              <div>地址：{c.address || "—"}</div>
              <div>税号：{c.taxId || "—"}</div>
              <div>开户行：{c.bankName || "—"}</div>
              <div>银行卡号：{c.bankCode || "—"}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!c.isDefault ? (
                <TextButton variant="secondary" onClick={() => setDefault(c)}>
                  设为默认
                </TextButton>
              ) : null}
              <TextButton variant="secondary" onClick={() => openEdit(c)}>
                编辑
              </TextButton>
              <TextButton variant="secondary" className="border-red-200 text-red-700" onClick={() => remove(c)}>
                删除
              </TextButton>
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="mt-6 text-center text-sm text-slate-500">请新增公司主体，用于报价抬头与单号前缀。</p>
      ) : null}

      <Modal
        open={modalOpen}
        title={editing ? "编辑公司" : "新增公司"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </TextButton>
            <TextButton variant="primary" onClick={save}>
              保存
            </TextButton>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-slate-600">公司名称</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">英文简写（单号前缀）</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.abbr}
              onChange={(e) => setForm((s) => ({ ...s, abbr: e.target.value.toUpperCase() }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">联系人</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.contact}
              onChange={(e) => setForm((s) => ({ ...s, contact: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">电话</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">地址</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">税号</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.taxId}
              onChange={(e) => setForm((s) => ({ ...s, taxId: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">开户行</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.bankName}
              onChange={(e) => setForm((s) => ({ ...s, bankName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">银行卡号</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.bankCode}
              onChange={(e) => setForm((s) => ({ ...s, bankCode: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Logo 上传</label>
            <input type="file" accept="image/*" className="mt-1 w-full text-sm" onChange={onLogoFile} />
            {form.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logo} alt="" className="mt-2 max-h-24 rounded border border-slate-200" />
            ) : null}
          </div>
          <div>
            <label className="block text-slate-600">公章（透明 PNG）</label>
            <p className="mt-0.5 text-xs text-slate-500">用于合同乙方落款处叠放，建议透明底 PNG。</p>
            <input
              type="file"
              accept="image/png,.png"
              className="mt-1 w-full text-sm"
              onChange={onSealFile}
            />
            {form.sealImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.sealImage}
                alt=""
                className="mt-2 max-h-28 rounded border border-slate-200 bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#fff_0%_50%)_50%_50%_8px_8px] bg-[length:16px_16px]"
              />
            ) : null}
          </div>
          <label className="flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((s) => ({ ...s, isDefault: e.target.checked }))}
            />
            设为默认报价主体
          </label>
        </div>
      </Modal>
    </div>
  );
}
