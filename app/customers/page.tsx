"use client";

import { SubscriptionFeatureGate } from "@/components/subscription/SubscriptionFeatureGate";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { useSubscriptionAccess } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";
import { pushProjectDataToCloud } from "@/lib/cloudProjectData";
import { getCustomers, setCustomers } from "@/lib/storage";
import type { Customer } from "@/lib/types";

function newCustomerCode(existing: Customer[]): string {
  const n = existing.length + 1;
  return `C${String(n).padStart(5, "0")}`;
}

const emptyForm: Omit<Customer, "id"> = {
  code: "",
  name: "",
  contact: "",
  phone: "",
  address: "",
  mainBusiness: "",
  taxId: "",
  bankName: "",
  bankAccount: "",
};

export default function CustomersPage() {
  return (
    <SubscriptionFeatureGate feature="base">
      <CustomersPageInner />
    </SubscriptionFeatureGate>
  );
}

function CustomersPageInner() {
  const subCtx = useSubscriptionAccess();
  const [list, setList] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<Omit<Customer, "id">>(emptyForm);

  const refresh = useCallback(() => {
    setList(getCustomers());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [list, search]);

  function openCreate() {
    const rows = getCustomers();
    setEditing(null);
    setForm({ ...emptyForm, code: newCustomerCode(rows) });
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      code: c.code,
      name: c.name,
      contact: c.contact,
      phone: c.phone,
      address: c.address,
      mainBusiness: c.mainBusiness,
      taxId: c.taxId,
      bankName: c.bankName,
      bankAccount: c.bankAccount,
    });
    setModalOpen(true);
  }

  async function save() {
    const rows = getCustomers();
    if (!form.code.trim() || !form.name.trim()) {
      alert("Please enter customer code and name.");
      return;
    }
    if (editing) {
      setCustomers(rows.map((c) => (c.id === editing.id ? { ...c, ...form } : c)));
    } else {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `cid-${Date.now()}`;
      setCustomers([...rows, { id, ...form }]);
    }
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) alert(`Saved locally, but cloud sync failed: ${sync.error}`);
    }
    setModalOpen(false);
    refresh();
  }

  async function remove(c: Customer) {
    if (!confirm(`Delete "${c.name}"?`)) return;
    setCustomers(getCustomers().filter((x) => x.id !== c.id));
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) alert(`Removed locally, but cloud sync failed: ${sync.error}`);
    }
    refresh();
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <PageHeader
        title="Customers"
        actions={
          <TextButton variant="primary" onClick={openCreate}>
            Add customer
          </TextButton>
        }
      />

      <div className="mb-4">
        <label className="block text-sm text-slate-600">Search</label>
        <input
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 sm:max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Code, name, contact, phone"
        />
      </div>

      <div className="hidden md:block overflow-x-auto rounded border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Contact</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{c.code}</td>
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2">{c.contact}</td>
                <td className="px-3 py-2">{c.phone}</td>
                <td className="px-3 py-2 space-x-2">
                  <TextButton variant="ghost" className="!px-0" onClick={() => openEdit(c)}>
                    Edit
                  </TextButton>
                  <TextButton variant="ghost" className="!px-0 text-red-700" onClick={() => remove(c)}>
                    Delete
                  </TextButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-500">No customers yet</p>
        ) : null}
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((c) => (
          <div key={c.id} className="rounded border border-slate-200 bg-white p-3 text-sm shadow-sm">
            <div className="font-medium text-slate-900">{c.name}</div>
            <div className="mt-1 text-slate-600">Code {c.code}</div>
            <div className="text-slate-600">
              {c.contact} · {c.phone}
            </div>
            <div className="mt-2 flex gap-2">
              <TextButton variant="secondary" onClick={() => openEdit(c)}>
                Edit
              </TextButton>
              <TextButton variant="secondary" className="border-red-200 text-red-700" onClick={() => remove(c)}>
                Delete
              </TextButton>
            </div>
          </div>
        ))}
        {filtered.length === 0 ? <p className="text-center text-sm text-slate-500">No customers yet</p> : null}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "Edit customer" : "New customer"}
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
            <label className="block text-slate-600">Customer code</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.code}
              onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Customer name</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Contact</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.contact}
              onChange={(e) => setForm((s) => ({ ...s, contact: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Phone</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Address</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Primary business</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.mainBusiness}
              onChange={(e) => setForm((s) => ({ ...s, mainBusiness: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Tax ID</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.taxId}
              onChange={(e) => setForm((s) => ({ ...s, taxId: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Bank name</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.bankName}
              onChange={(e) => setForm((s) => ({ ...s, bankName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-slate-600">Bank account number</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.bankAccount}
              onChange={(e) => setForm((s) => ({ ...s, bankAccount: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
