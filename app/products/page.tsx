"use client";

import { SubscriptionFeatureGate } from "@/components/subscription/SubscriptionFeatureGate";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { useSubscriptionAccess } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";
import { pushProjectDataToCloud } from "@/lib/cloudProjectData";
import { formatMoney, normalizeDocumentCurrency } from "@/lib/format";
import { readImageCompressedDataUrl } from "@/lib/imageUpload";
import { buildProductPriceHistoryMap } from "@/lib/productPriceHistory";
import { getContracts, getProducts, getQuotes, getSettings, setProducts } from "@/lib/storage";
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
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [quotesSnap, setQuotesSnap] = useState<ReturnType<typeof getQuotes>>([]);
  const [contractsSnap, setContractsSnap] = useState<ReturnType<typeof getContracts>>([]);

  const reloadPriceSources = useCallback(() => {
    setQuotesSnap(getQuotes());
    setContractsSnap(getContracts());
  }, []);

  const refresh = useCallback(() => {
    setList(getProducts());
    reloadPriceSources();
  }, [reloadPriceSources]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const bump = () => reloadPriceSources();
    window.addEventListener("focus", bump);
    return () => window.removeEventListener("focus", bump);
  }, [reloadPriceSources]);

  const priceHistoryById = useMemo(() => {
    return buildProductPriceHistoryMap(list, quotesSnap, contractsSnap);
  }, [list, quotesSnap, contractsSnap]);

  const docCurrency = normalizeDocumentCurrency(getSettings().documentCurrency);

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
      alert("Please enter product code and name.");
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
      if (!sync.ok) alert(`Saved locally, but cloud sync failed: ${sync.error}`);
    }
    setModalOpen(false);
    refresh();
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    setProducts(getProducts().filter((x) => x.id !== p.id));
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) alert(`Removed locally, but cloud sync failed: ${sync.error}`);
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
      alert("Could not process the image. Try another file.");
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <PageHeader
        title="Products"
        actions={
          <TextButton variant="primary" onClick={openCreate}>
            Add product
          </TextButton>
        }
      />

      <div className="mb-4">
        <label className="block text-sm text-slate-600">Search</label>
        <input
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 sm:max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Code, name, model, specs"
        />
      </div>

      <div className="hidden md:block overflow-x-auto rounded border border-slate-200">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Model</th>
              <th className="px-3 py-2 font-medium">Specs</th>
              <th className="px-3 py-2 font-medium">Unit</th>
              <th className="px-3 py-2 font-medium">Unit price</th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">Quote price range</th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">Contract price range</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const h = priceHistoryById.get(p.id);
              const quoteRange =
                h?.quoteMin != null && h?.quoteMax != null
                  ? `${formatMoney(h.quoteMin, docCurrency)} – ${formatMoney(h.quoteMax, docCurrency)}`
                  : "—";
              const contractRange =
                h?.contractMin != null && h?.contractMax != null
                  ? `${formatMoney(h.contractMin, docCurrency)} – ${formatMoney(h.contractMax, docCurrency)}`
                  : "—";
              return (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{p.code}</td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{p.model}</td>
                <td className="px-3 py-2">{p.spec}</td>
                <td className="px-3 py-2">{p.unit}</td>
                <td className="px-3 py-2">{formatMoney(p.price, docCurrency)}</td>
                <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{quoteRange}</td>
                <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{contractRange}</td>
                <td className="px-3 py-2 space-x-2">
                  <TextButton variant="ghost" className="!px-0" onClick={() => openEdit(p)}>
                    Edit
                  </TextButton>
                  <TextButton variant="ghost" className="!px-0 text-red-700" onClick={() => remove(p)}>
                    Delete
                  </TextButton>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-500">No products yet</p>
        ) : null}
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((p) => {
          const h = priceHistoryById.get(p.id);
          const quoteRange =
            h?.quoteMin != null && h?.quoteMax != null
              ? `${formatMoney(h.quoteMin, docCurrency)} – ${formatMoney(h.quoteMax, docCurrency)}`
              : "—";
          const contractRange =
            h?.contractMin != null && h?.contractMax != null
              ? `${formatMoney(h.contractMin, docCurrency)} – ${formatMoney(h.contractMax, docCurrency)}`
              : "—";
          return (
          <div key={p.id} className="rounded border border-slate-200 bg-white p-3 text-sm shadow-sm">
            <div className="font-medium text-slate-900">{p.name}</div>
            <div className="mt-1 text-slate-600">Code {p.code}</div>
            <div className="text-slate-600">
              {p.model} / {p.spec}
            </div>
            <div className="text-slate-600">
              Unit {p.unit} · Price {formatMoney(p.price, docCurrency)}
            </div>
            <div className="mt-1 text-slate-600">Quote prices {quoteRange}</div>
            <div className="text-slate-600">Contract prices {contractRange}</div>
            <div className="mt-2 flex gap-2">
              <TextButton variant="secondary" onClick={() => openEdit(p)}>
                Edit
              </TextButton>
              <TextButton variant="secondary" className="border-red-200 text-red-700" onClick={() => remove(p)}>
                Delete
              </TextButton>
            </div>
          </div>
        );
        })}
        {filtered.length === 0 ? <p className="text-center text-sm text-slate-500">No products yet</p> : null}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "Edit product" : "New product"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </TextButton>
            <TextButton variant="primary" onClick={save}>
              Save
            </TextButton>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-slate-600">Product code</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.code}
              onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Product name</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Model</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.model}
              onChange={(e) => setForm((s) => ({ ...s, model: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Specs</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.spec}
              onChange={(e) => setForm((s) => ({ ...s, spec: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Unit</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.unit}
              onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Unit price</label>
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
            <label className="block text-slate-600">Image upload</label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageFile}
              />
              <TextButton variant="secondary" type="button" onClick={() => imageInputRef.current?.click()}>
                Choose image
              </TextButton>
              <span className="text-xs text-slate-500">Optional. JPG/PNG recommended.</span>
            </div>
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
