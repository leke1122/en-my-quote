"use client";

import { SubscriptionFeatureGate } from "@/components/subscription/SubscriptionFeatureGate";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { useSubscriptionAccess } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";
import { pushProjectDataToCloud } from "@/lib/cloudProjectData";
import { formatCurrency } from "@/lib/format";
import { readImageCompressedDataUrl } from "@/lib/imageUpload";
import { getProducts, setProducts } from "@/lib/storage";
import type { Product } from "@/lib/types";

function newProductCode(existing: Product[]): string {
  const n = existing.length + 1;
  return `P${String(n).padStart(5, "0")}`;
}

const emptyForm: Omit<Product, "id"> = {
  code: "",
  name: "",
  model: "",
  spec: "",
  unit: "",
  price: 0,
  image: "",
};

export default function ProductsPage() {
  return (
    <SubscriptionFeatureGate feature="base">
      <ProductsPageInner />
    </SubscriptionFeatureGate>
  );
}

function ProductsPageInner() {
  const subCtx = useSubscriptionAccess();
  const [list, setList] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyForm);

  const refresh = useCallback(() => {
    setList(getProducts());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.spec.toLowerCase().includes(q)
    );
  }, [list, search]);

  function openCreate() {
    const products = getProducts();
    setEditing(null);
    setForm({ ...emptyForm, code: newProductCode(products) });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      code: p.code,
      name: p.name,
      model: p.model,
      spec: p.spec,
      unit: p.unit,
      price: p.price,
      image: p.image ?? "",
    });
    setModalOpen(true);
  }

  async function save() {
    const products = getProducts();
    if (!form.code.trim() || !form.name.trim()) {
      alert("请填写商品编码与名称");
      return;
    }
    if (editing) {
      const next = products.map((p) =>
        p.id === editing.id
          ? {
              ...p,
              ...form,
              price: Number(form.price) || 0,
              image: form.image || undefined,
            }
          : p
      );
      setProducts(next);
    } else {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `pid-${Date.now()}`;
      setProducts([
        ...products,
        {
          id,
          ...form,
          price: Number(form.price) || 0,
          image: form.image || undefined,
        },
      ]);
    }
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) alert(`已保存到本地，但同步云端失败：${sync.error}`);
    }
    setModalOpen(false);
    refresh();
  }

  async function remove(p: Product) {
    if (!confirm(`确定删除「${p.name}」？`)) return;
    setProducts(getProducts().filter((x) => x.id !== p.id));
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) alert(`已删除本地数据，但同步云端失败：${sync.error}`);
    }
    refresh();
  }

  async function onImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const compressed = await readImageCompressedDataUrl(f, { maxSide: 1200, quality: 0.8 });
      setForm((s) => ({ ...s, image: compressed }));
    } catch {
      alert("图片处理失败，请换一张图片重试");
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <PageHeader
        title="商品管理"
        actions={
          <TextButton variant="primary" onClick={openCreate}>
            新增商品
          </TextButton>
        }
      />

      <div className="mb-4">
        <label className="block text-sm text-slate-600">搜索</label>
        <input
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 sm:max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="编码、名称、型号、规格"
        />
      </div>

      <div className="hidden md:block overflow-x-auto rounded border border-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">编号</th>
              <th className="px-3 py-2 font-medium">名称</th>
              <th className="px-3 py-2 font-medium">型号</th>
              <th className="px-3 py-2 font-medium">规格</th>
              <th className="px-3 py-2 font-medium">单位</th>
              <th className="px-3 py-2 font-medium">单价</th>
              <th className="px-3 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{p.code}</td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{p.model}</td>
                <td className="px-3 py-2">{p.spec}</td>
                <td className="px-3 py-2">{p.unit}</td>
                <td className="px-3 py-2">{formatCurrency(p.price)}</td>
                <td className="px-3 py-2 space-x-2">
                  <TextButton variant="ghost" className="!px-0" onClick={() => openEdit(p)}>
                    修改
                  </TextButton>
                  <TextButton variant="ghost" className="!px-0 text-red-700" onClick={() => remove(p)}>
                    删除
                  </TextButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-500">暂无商品</p>
        ) : null}
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((p) => (
          <div key={p.id} className="rounded border border-slate-200 bg-white p-3 text-sm shadow-sm">
            <div className="font-medium text-slate-900">{p.name}</div>
            <div className="mt-1 text-slate-600">编号 {p.code}</div>
            <div className="text-slate-600">
              {p.model} / {p.spec}
            </div>
            <div className="text-slate-600">
              单位 {p.unit} · 单价 {formatCurrency(p.price)}
            </div>
            <div className="mt-2 flex gap-2">
              <TextButton variant="secondary" onClick={() => openEdit(p)}>
                修改
              </TextButton>
              <TextButton variant="secondary" className="border-red-200 text-red-700" onClick={() => remove(p)}>
                删除
              </TextButton>
            </div>
          </div>
        ))}
        {filtered.length === 0 ? <p className="text-center text-sm text-slate-500">暂无商品</p> : null}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "编辑商品" : "新增商品"}
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
            <label className="block text-slate-600">商品编码</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.code}
              onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">商品名称</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">型号</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.model}
              onChange={(e) => setForm((s) => ({ ...s, model: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">规格</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.spec}
              onChange={(e) => setForm((s) => ({ ...s, spec: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">单位</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.unit}
              onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">单价</label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.price === 0 ? "" : form.price}
              onChange={(e) =>
                setForm((s) => ({ ...s, price: Number.parseFloat(e.target.value) || 0 }))
              }
            />
          </div>
          <div>
            <label className="block text-slate-600">图片上传</label>
            <input type="file" accept="image/*" className="mt-1 w-full text-sm" onChange={onImageFile} />
            {form.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image} alt="" className="mt-2 max-h-32 rounded border border-slate-200" />
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  );
}
