"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildCsvUtf8BomBlob,
  buildExcelHtmlTableBlob,
  exportFilename,
  triggerDownloadBlob,
} from "@/lib/exportSpreadsheet";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { SubscriptionFeatureGate } from "@/components/subscription/SubscriptionFeatureGate";
import { useSubscriptionAccess } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";
import { pullProjectDataFromCloud } from "@/lib/cloudProjectData";
import { formatMoney } from "@/lib/format";
import { filterDetailRows, localQuotesToDetailRows } from "@/lib/quoteDetailRows";
import { quoteDisplayStatus, shouldShowExpiryReminder } from "@/lib/quoteStatus";
import { getCustomers, getQuotes, markQuoteReminderSent } from "@/lib/storage";
import type { Customer, Quote } from "@/lib/types";

function QuoteListContent() {
  const router = useRouter();
  const subCtx = useSubscriptionAccess();
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerQ, setCustomerQ] = useState("");
  const [productQ, setProductQ] = useState("");
  const [modelQ, setModelQ] = useState("");
  const [specQ, setSpecQ] = useState("");
  const [statusQ, setStatusQ] = useState<
    "all" | "draft" | "sent" | "viewed" | "accepted" | "expired" | "paid"
  >("all");
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderQuoteId, setReminderQuoteId] = useState("");
  const [reminderTo, setReminderTo] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderSending, setReminderSending] = useState(false);

  const refreshList = useCallback(async () => {
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      await pullProjectDataFromCloud();
    }
    setQuotes(getQuotes().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setCustomers(getCustomers());
  }, [subCtx.cloudAuthEnabled, subCtx.loggedIn]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const cloudDataMode = subCtx.cloudAuthEnabled;

  const customerMap = useMemo(() => {
    const m = new Map<string, Customer>();
    customers.forEach((c) => m.set(c.id, c));
    return m;
  }, [customers]);

  const localDetailRows = useMemo(
    () => localQuotesToDetailRows(quotes, customerMap),
    [quotes, customerMap]
  );

  const filteredRows = useMemo(
    () =>
      filterDetailRows(localDetailRows, {
        dateFrom,
        dateTo,
        customer: customerQ,
        productName: productQ,
        model: modelQ,
        spec: specQ,
        status: statusQ,
        source: "all",
      }),
    [localDetailRows, dateFrom, dateTo, customerQ, productQ, modelQ, specQ, statusQ]
  );

  const expiryReminders = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const plus3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return quotes
      .filter((q) => shouldShowExpiryReminder(q.status, q.validUntil))
      .filter((q) => {
        if (!q.validUntil) return false;
        const s = quoteDisplayStatus(q.status, q.validUntil);
        return s === "expired" || (q.validUntil >= today && q.validUntil <= plus3);
      })
      .sort((a, b) => (a.validUntil ?? "").localeCompare(b.validUntil ?? ""))
      .slice(0, 8);
  }, [quotes]);

  function quoteRowsForExport(): (string | number)[][] {
    return filteredRows.map((r) => [
      r.quoteNo,
      r.date,
      r.currency,
      r.status,
      r.validUntil,
      r.paymentTerms,
      r.paymentLink,
      r.customerName,
      r.productName,
      r.model,
      r.spec,
      r.unit,
      r.qty,
      r.price,
      r.amount,
    ]);
  }

  function exportQuoteCsv() {
    if (filteredRows.length === 0) {
      alert("Nothing to export with the current filters.");
      return;
    }
    const headers = [
      "Quote No.",
      "Date",
      "Currency",
      "Status",
      "Valid until",
      "Payment terms",
      "Payment link",
      "Customer",
      "Item",
      "Model",
      "Spec",
      "Unit",
      "Qty",
      "Unit price",
      "Amount",
    ];
    triggerDownloadBlob(buildCsvUtf8BomBlob(headers, quoteRowsForExport()), exportFilename("quote-lines", "csv"));
  }

  function exportQuoteXls() {
    if (filteredRows.length === 0) {
      alert("Nothing to export with the current filters.");
      return;
    }
    const headers = [
      "Quote No.",
      "Date",
      "Currency",
      "Status",
      "Valid until",
      "Payment terms",
      "Payment link",
      "Customer",
      "Item",
      "Model",
      "Spec",
      "Unit",
      "Qty",
      "Unit price",
      "Amount",
    ];
    triggerDownloadBlob(buildExcelHtmlTableBlob(headers, quoteRowsForExport()), exportFilename("quote-lines", "xls"));
  }

  function goContractFromQuote(quoteId: string) {
    if (subCtx.cloudAuthEnabled && !subCtx.canQuoteToContract) {
      setUpgradeModal(true);
      return;
    }
    router.push(`/contract/new?fromQuote=${encodeURIComponent(quoteId)}`);
  }

  function openReminderModal(quoteId: string) {
    setReminderQuoteId(quoteId);
    setReminderTo("");
    setReminderMessage("Friendly reminder: please review and complete payment if you would like us to start.");
    setReminderOpen(true);
  }

  async function submitReminderEmail() {
    const q = quotes.find((x) => x.id === reminderQuoteId);
    if (!q) return;
    if (!reminderTo.trim()) {
      alert("Please enter recipient email.");
      return;
    }
    const customerName = customers.find((c) => c.id === q.customerId)?.name ?? "";
    setReminderSending(true);
    const res = await fetch("/api/quote/reminder/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: reminderTo.trim(),
        quoteNo: q.quoteNo,
        customerName,
        validUntil: q.validUntil,
        paymentLink: q.paymentLink,
        customMessage: reminderMessage.trim(),
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setReminderSending(false);
    if (!res.ok || !data.ok) {
      alert(data.error || "Could not send reminder email.");
      return;
    }
    markQuoteReminderSent(q.id, reminderTo.trim());
    setQuotes(getQuotes().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setReminderOpen(false);
    alert("Reminder email sent.");
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <PageHeader
        title="My quotations"
        actions={
          <div className="flex flex-wrap gap-2">
            <TextButton variant="secondary" onClick={refreshList}>
              {cloudDataMode ? "Refresh" : "Refresh local"}
            </TextButton>
            <Link href="/quote/new">
              <TextButton variant="primary">New quotation</TextButton>
            </Link>
          </div>
        }
      />

      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <p className="mb-2 font-medium text-slate-800">Data & security</p>
        {cloudDataMode ? (
          <p className="leading-relaxed">
            Cloud mode uses a server database for account, subscription, and synced data. This list shows quotes
            <strong> loaded in this browser</strong>. After saving in the editor or syncing, tap <strong>Refresh</strong>
            . Always use <strong>HTTPS</strong>. You can export a JSON backup in Settings.
          </p>
        ) : (
          <p className="leading-relaxed">
            <strong>Quotation data is stored in this browser only</strong>. Use HTTPS; export JSON backups regularly from
            Settings.
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          The table below reflects <strong>current filters</strong>. Export CSV or Excel. Use <strong>Actions</strong> to
          edit the full quote or create a contract.
        </p>
      </section>

      {expiryReminders.length > 0 ? (
        <section className="mb-4 rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-slate-700">
          <p className="mb-2 font-medium text-amber-900">Expiry reminders (next 3 days + expired)</p>
          <div className="space-y-1.5">
            {expiryReminders.map((q) => (
              <div key={q.id} className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{q.quoteNo}</span>
                <span>· {customerMap.get(q.customerId)?.name ?? "—"}</span>
                <span>· valid until {q.validUntil || "—"}</span>
                <span className="rounded bg-white px-2 py-0.5 text-xs uppercase">
                  {quoteDisplayStatus(q.status, q.validUntil)}
                </span>
                <TextButton
                  variant="ghost"
                  className="!px-0"
                  onClick={() => router.push(`/quote/new?id=${encodeURIComponent(q.id)}`)}
                >
                  Open
                </TextButton>
                <TextButton
                  variant="ghost"
                  className="!px-0"
                  onClick={() => openReminderModal(q.id)}
                >
                  Send email
                </TextButton>
                <span className="text-xs text-slate-500">
                  sent {q.reminderCount ?? 0} · last {q.lastReminderAt ? new Date(q.lastReminderAt).toLocaleString() : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Filters</h2>
          <div className="flex flex-wrap gap-2">
            <TextButton variant="secondary" onClick={exportQuoteCsv}>
              Export CSV
            </TextButton>
            <TextButton variant="secondary" onClick={exportQuoteXls}>
              Export Excel (.xls)
            </TextButton>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs text-slate-600">Quote date from</label>
            <input
              type="date"
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Quote date to</label>
            <input
              type="date"
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Customer (contains)</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={customerQ}
              onChange={(e) => setCustomerQ(e.target.value)}
              placeholder="Partial match"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Item name (contains)</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={productQ}
              onChange={(e) => setProductQ(e.target.value)}
              placeholder="Partial match"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Model (contains)</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={modelQ}
              onChange={(e) => setModelQ(e.target.value)}
              placeholder="Partial match"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs text-slate-600">Spec (contains)</label>
            <input
              className="mt-1 w-full max-w-xl rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={specQ}
              onChange={(e) => setSpecQ(e.target.value)}
              placeholder="Partial match"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Status</label>
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={statusQ}
              onChange={(e) =>
                setStatusQ(
                  (e.target.value as "all" | "draft" | "sent" | "viewed" | "accepted" | "expired" | "paid") ||
                    "all"
                )
              }
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="accepted">Accepted</option>
              <option value="expired">Expired</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </section>

      <div className="hidden lg:block overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-2 font-medium">Quote No.</th>
              <th className="px-2 py-2 font-medium">Date</th>
              <th className="px-2 py-2 font-medium">Currency</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-2 py-2 font-medium">Valid until</th>
              <th className="px-2 py-2 font-medium">Payment terms</th>
              <th className="px-2 py-2 font-medium">Payment</th>
              <th className="px-2 py-2 font-medium">Customer</th>
              <th className="px-2 py-2 font-medium">Item</th>
              <th className="px-2 py-2 font-medium">Model</th>
              <th className="px-2 py-2 font-medium">Spec</th>
              <th className="px-2 py-2 font-medium">Unit</th>
              <th className="px-2 py-2 font-medium">Qty</th>
              <th className="px-2 py-2 font-medium">Unit price</th>
              <th className="px-2 py-2 font-medium">Amount</th>
              <th className="px-2 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r, idx) => (
              <tr key={`${r.quoteId ?? r.quoteNo}-${idx}`} className="border-t border-slate-100">
                <td className="px-2 py-2">{r.quoteNo}</td>
                <td className="px-2 py-2">{r.date}</td>
                <td className="px-2 py-2">{r.currency}</td>
                <td className="px-2 py-2">{r.status}</td>
                <td className="px-2 py-2">{r.validUntil || "—"}</td>
                <td className="px-2 py-2">{r.paymentTerms || "—"}</td>
                <td className="px-2 py-2">
                  {r.paymentLink ? (
                    <a href={r.paymentLink} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                      Link
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-2 py-2">{r.customerName}</td>
                <td className="px-2 py-2">{r.productName}</td>
                <td className="px-2 py-2">{r.model}</td>
                <td className="px-2 py-2">{r.spec}</td>
                <td className="px-2 py-2">{r.unit}</td>
                <td className="px-2 py-2">{r.qty}</td>
                <td className="px-2 py-2">{formatMoney(r.price, r.currency)}</td>
                <td className="px-2 py-2">{formatMoney(r.amount, r.currency)}</td>
                <td className="px-2 py-2">
                  {r.quoteId ? (
                    <span className="flex flex-wrap gap-2">
                      <TextButton
                        variant="ghost"
                        className="!px-0"
                        onClick={() => router.push(`/quote/new?id=${encodeURIComponent(r.quoteId!)}`)}
                      >
                        Open
                      </TextButton>
                      <TextButton
                        variant="ghost"
                        className="!px-0"
                        onClick={() => goContractFromQuote(r.quoteId!)}
                      >
                        To contract
                      </TextButton>
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRows.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-500">
            No rows — adjust filters or tap {cloudDataMode ? "Refresh" : "Refresh local"}
          </p>
        ) : null}
      </div>

      <div className="space-y-2 lg:hidden">
        {filteredRows.map((r, idx) => (
          <div
            key={`${r.quoteId ?? r.quoteNo}-${idx}`}
            className="rounded border border-slate-200 bg-white p-3 text-sm shadow-sm"
          >
            <div className="flex justify-end text-slate-500">
              <span>{r.date}</span>
            </div>
            <div className="font-medium text-slate-900">{r.quoteNo}</div>
            <div className="text-slate-600">Currency: {r.currency}</div>
            <div className="text-slate-600">Status: {r.status}</div>
            <div className="text-slate-600">Valid until: {r.validUntil || "—"}</div>
            <div className="text-slate-600">Payment terms: {r.paymentTerms || "—"}</div>
            <div className="text-slate-600">
              Payment:{" "}
              {r.paymentLink ? (
                <a href={r.paymentLink} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                  Open link
                </a>
              ) : (
                "—"
              )}
            </div>
            <div className="text-slate-700">{r.customerName}</div>
            <div className="mt-1 text-slate-800">{r.productName}</div>
            <div className="text-slate-600">
              {r.model} · {r.spec}
            </div>
            <div className="mt-1 text-slate-700">
              {r.unit} × {r.qty} @ {formatMoney(r.price, r.currency)} = {formatMoney(r.amount, r.currency)}
            </div>
            {r.quoteId ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <TextButton
                  variant="secondary"
                  onClick={() => router.push(`/quote/new?id=${encodeURIComponent(r.quoteId!)}`)}
                >
                  Open quote
                </TextButton>
                <TextButton variant="secondary" onClick={() => goContractFromQuote(r.quoteId!)}>
                  To contract
                </TextButton>
              </div>
            ) : null}
          </div>
        ))}
        {filteredRows.length === 0 ? (
          <p className="text-center text-sm text-slate-500">No rows</p>
        ) : null}
      </div>

      <Modal
        open={reminderOpen}
        title="Send reminder email"
        onClose={() => setReminderOpen(false)}
        panelClassName="max-w-xl"
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setReminderOpen(false)}>
              Cancel
            </TextButton>
            <TextButton variant="primary" onClick={() => void submitReminderEmail()} disabled={reminderSending}>
              {reminderSending ? "Sending..." : "Send reminder"}
            </TextButton>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-xs text-slate-600">Recipient email</label>
            <input
              type="email"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
              placeholder="customer@example.com"
              value={reminderTo}
              onChange={(e) => setReminderTo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Message (optional)</label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-2"
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={upgradeModal}
        title="Upgrade required"
        onClose={() => setUpgradeModal(false)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setUpgradeModal(false)}>
              Close
            </TextButton>
            <TextButton variant="primary" onClick={() => router.push("/pricing")}>
              View pricing
            </TextButton>
            <TextButton variant="secondary" onClick={() => router.push("/settings")}>
              Settings
            </TextButton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-700">
          Creating a contract from a quote requires a plan that includes both <strong>Quotes</strong> and{" "}
          <strong>Contracts</strong>. Upgrade your subscription.
        </p>
      </Modal>
    </div>
  );
}

export default function QuoteListPage() {
  return (
    <SubscriptionFeatureGate feature="quote">
      <QuoteListContent />
    </SubscriptionFeatureGate>
  );
}
