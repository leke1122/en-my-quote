"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { SubscriptionFeatureGate } from "@/components/subscription/SubscriptionFeatureGate";
import { useSubscriptionAccess } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";
import { pullProjectDataFromCloud } from "@/lib/cloudProjectData";
import {
  buildCsvUtf8BomBlob,
  buildExcelHtmlTableBlob,
  exportFilename,
  triggerDownloadBlob,
} from "@/lib/exportSpreadsheet";
import { filterContractDetailRows, localContractsToDetailRows } from "@/lib/contractRecords";
import { formatMoney } from "@/lib/format";
import { quoteDisplayStatus } from "@/lib/quoteStatus";
import { getCompanies, getContracts, getCustomers, getQuotes } from "@/lib/storage";
import type { Contract, Customer, Quote } from "@/lib/types";

function ContractListContent() {
  const router = useRouter();
  const subCtx = useSubscriptionAccess();
  const cloudDataMode = subCtx.cloudAuthEnabled;
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [companies, setCompanies] = useState(getCompanies());

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerQ, setCustomerQ] = useState("");
  const [productQ, setProductQ] = useState("");
  const [modelQ, setModelQ] = useState("");
  const [specQ, setSpecQ] = useState("");

  const refreshList = useCallback(async () => {
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      await pullProjectDataFromCloud();
    }
    setContracts(getContracts().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setCustomers(getCustomers());
    setQuotes(getQuotes());
    setCompanies(getCompanies());
  }, [subCtx.cloudAuthEnabled, subCtx.loggedIn]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const customerMap = useMemo(() => {
    const m = new Map<string, Customer>();
    customers.forEach((c) => m.set(c.id, c));
    return m;
  }, [customers]);

  const companyMap = useMemo(() => {
    const m = new Map<string, (typeof companies)[0]>();
    companies.forEach((c) => m.set(c.id, c));
    return m;
  }, [companies]);

  const quoteMap = useMemo(() => {
    const m = new Map<string, Quote>();
    quotes.forEach((q) => m.set(q.id, q));
    return m;
  }, [quotes]);

  const contractMap = useMemo(() => {
    const m = new Map<string, Contract>();
    contracts.forEach((c) => m.set(c.id, c));
    return m;
  }, [contracts]);

  const localDetailRows = useMemo(
    () => localContractsToDetailRows(contracts, customerMap, companyMap),
    [contracts, customerMap, companyMap]
  );

  const filteredRows = useMemo(
    () =>
      filterContractDetailRows(localDetailRows, {
        dateFrom,
        dateTo,
        customer: customerQ,
        productName: productQ,
        model: modelQ,
        spec: specQ,
        source: "all",
      }),
    [localDetailRows, dateFrom, dateTo, customerQ, productQ, modelQ, specQ]
  );

  function contractRowsForExport(): (string | number)[][] {
    return filteredRows.map((r) => [
      r.contractNo,
      r.date,
      r.currency,
      r.customerName,
      r.supplierName,
      r.productName,
      r.model,
      r.spec,
      r.unit,
      r.qty,
      r.price,
      r.amount,
    ]);
  }

  function exportContractCsv() {
    if (filteredRows.length === 0) {
      alert("Nothing to export for the current filters.");
      return;
    }
    const headers = [
      "Contract no.",
      "Signed date",
      "Currency",
      "Customer",
      "Supplier",
      "Product",
      "Model",
      "Specs",
      "Unit",
      "Qty",
      "Unit price",
      "Amount",
    ];
    triggerDownloadBlob(
      buildCsvUtf8BomBlob(headers, contractRowsForExport()),
      exportFilename("contract-line-items", "csv")
    );
  }

  function exportContractXls() {
    if (filteredRows.length === 0) {
      alert("Nothing to export for the current filters.");
      return;
    }
    const headers = [
      "Contract no.",
      "Signed date",
      "Currency",
      "Customer",
      "Supplier",
      "Product",
      "Model",
      "Specs",
      "Unit",
      "Qty",
      "Unit price",
      "Amount",
    ];
    triggerDownloadBlob(
      buildExcelHtmlTableBlob(headers, contractRowsForExport()),
      exportFilename("contract-line-items", "xls")
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <PageHeader
        title="Contracts"
        actions={
          <div className="flex flex-wrap gap-2">
            <TextButton variant="secondary" onClick={refreshList}>
              {cloudDataMode ? "Refresh" : "Refresh local"}
            </TextButton>
            <Link href="/contract/new">
              <TextButton variant="primary">New contract</TextButton>
            </Link>
          </div>
        }
      />

      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <p className="mb-2 font-medium text-slate-800">Data & privacy</p>
        {cloudDataMode ? (
          <p className="leading-relaxed">
            The server database stores accounts, subscriptions, and business data. Line items here reflect contracts{" "}
            <strong>currently loaded in this browser</strong>. After saving in the editor or syncing from the cloud,
            click <strong>Refresh</strong> above to reload. Always use <strong>HTTPS</strong>. You can export JSON
            backups from Settings.
          </p>
        ) : (
          <p className="leading-relaxed">
            <strong>Contract line items are stored in this browser.</strong> Use HTTPS; export JSON backups regularly
            from Settings.
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Rows below are line items for the <strong>current filters</strong> (one row per product line; multiple rows per
          contract). Export CSV or Excel (.xls). Use <strong>Open</strong> to edit the full contract.
        </p>
      </section>

      <section className="mb-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Filters</h2>
          <div className="flex flex-wrap gap-2">
            <TextButton variant="secondary" onClick={exportContractCsv}>
              Export CSV (filtered rows)
            </TextButton>
            <TextButton variant="secondary" onClick={exportContractXls}>
              Export Excel .xls (filtered rows)
            </TextButton>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs text-slate-600">Signed from</label>
            <input
              type="date"
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Signed to</label>
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
            <label className="block text-xs text-slate-600">Product name (contains)</label>
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
            <label className="block text-xs text-slate-600">Specs (contains)</label>
            <input
              className="mt-1 w-full max-w-xl rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              value={specQ}
              onChange={(e) => setSpecQ(e.target.value)}
              placeholder="Partial match"
            />
          </div>
        </div>
      </section>

      <div className="hidden overflow-x-auto rounded border border-slate-200 bg-white lg:block">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-2 font-medium">Contract no.</th>
              <th className="px-2 py-2 font-medium">Signed date</th>
              <th className="px-2 py-2 font-medium">Currency</th>
              <th className="px-2 py-2 font-medium">Source quote</th>
              <th className="px-2 py-2 font-medium">Quote status</th>
              <th className="px-2 py-2 font-medium">Quote payment terms</th>
              <th className="px-2 py-2 font-medium">Buyer</th>
              <th className="px-2 py-2 font-medium">Supplier</th>
              <th className="px-2 py-2 font-medium">Product</th>
              <th className="px-2 py-2 font-medium">Model</th>
              <th className="px-2 py-2 font-medium">Specs</th>
              <th className="px-2 py-2 font-medium">Unit</th>
              <th className="px-2 py-2 font-medium">Qty</th>
              <th className="px-2 py-2 font-medium">Unit price</th>
              <th className="px-2 py-2 font-medium">Amount</th>
              <th className="px-2 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r, idx) => (
              (() => {
                const c = contractMap.get(r.contractId);
                const q = c?.sourceQuoteId ? quoteMap.get(c.sourceQuoteId) : undefined;
                return (
              <tr
                key={`${r.contractNo}-${r.contractId}-${idx}`}
                className="border-t border-slate-100"
              >
                <td className="px-2 py-2">{r.contractNo}</td>
                <td className="px-2 py-2">{r.date}</td>
                <td className="px-2 py-2">{r.currency}</td>
                <td className="px-2 py-2">{q?.quoteNo ?? "—"}</td>
                <td className="px-2 py-2">{quoteDisplayStatus(q?.status, q?.validUntil)}</td>
                <td className="px-2 py-2">{q?.paymentTerms ?? "—"}</td>
                <td className="px-2 py-2">{r.customerName}</td>
                <td className="px-2 py-2 text-slate-700">{r.supplierName}</td>
                <td className="px-2 py-2">{r.productName}</td>
                <td className="px-2 py-2">{r.model}</td>
                <td className="px-2 py-2">{r.spec}</td>
                <td className="px-2 py-2">{r.unit}</td>
                <td className="px-2 py-2">{r.qty}</td>
                <td className="px-2 py-2">{formatMoney(r.price, r.currency)}</td>
                <td className="px-2 py-2">{formatMoney(r.amount, r.currency)}</td>
                <td className="px-2 py-2">
                  <TextButton
                    variant="ghost"
                    className="!px-0"
                    onClick={() =>
                      router.push(`/contract/new?id=${encodeURIComponent(r.contractId)}`)
                    }
                  >
                    Open
                  </TextButton>
                </td>
              </tr>
                );
              })()
            ))}
          </tbody>
        </table>
        {filteredRows.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-500">
            No line items. Adjust filters or click “{cloudDataMode ? "Refresh" : "Refresh local"}”.
          </p>
        ) : null}
      </div>

      <div className="space-y-2 lg:hidden">
        {filteredRows.map((r, idx) => (
          (() => {
            const c = contractMap.get(r.contractId);
            const q = c?.sourceQuoteId ? quoteMap.get(c.sourceQuoteId) : undefined;
            return (
          <div
            key={`${r.contractNo}-${r.contractId}-${idx}`}
            className="rounded border border-slate-200 bg-white p-3 text-sm shadow-sm"
          >
            <div className="flex justify-end text-slate-500">
              <span>{r.date}</span>
            </div>
            <div className="font-medium text-slate-900">{r.contractNo}</div>
            <div className="text-slate-600">Currency: {r.currency}</div>
            <div className="text-slate-600">Source quote: {q?.quoteNo ?? "—"}</div>
            <div className="text-slate-600">
              Quote status: {quoteDisplayStatus(q?.status, q?.validUntil)}
            </div>
            <div className="text-slate-600">Quote payment terms: {q?.paymentTerms ?? "—"}</div>
            <div className="text-slate-700">Buyer: {r.customerName}</div>
            <div className="text-slate-600">Supplier: {r.supplierName}</div>
            <div className="mt-1 text-slate-800">{r.productName}</div>
            <div className="text-slate-600">
              {r.model} · {r.spec}
            </div>
            <div className="mt-1 text-slate-700">
              {r.unit} × {r.qty} @ {formatMoney(r.price, r.currency)} = {formatMoney(r.amount, r.currency)}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <TextButton
                variant="secondary"
                onClick={() =>
                  router.push(`/contract/new?id=${encodeURIComponent(r.contractId)}`)
                }
              >
                Open contract
              </TextButton>
            </div>
          </div>
            );
          })()
        ))}
        {filteredRows.length === 0 ? (
          <p className="text-center text-sm text-slate-500">No line items</p>
        ) : null}
      </div>
    </div>
  );
}

export default function ContractListPage() {
  return (
    <SubscriptionFeatureGate feature="contract">
      <ContractListContent />
    </SubscriptionFeatureGate>
  );
}
