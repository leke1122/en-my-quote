import { CONTRACT_INTRO } from "@/lib/contractDefaults";
import type { ContractSharePayload } from "@/lib/contractSharePayload";
import {
  contractExtraFeesTotal,
  contractGrandTotalFromState,
  contractLinesSubtotal,
  contractTaxFromSubtotal,
} from "@/lib/contractTotals";
import { formatDateUSFromIso, formatMoney, normalizeDocumentCurrency } from "@/lib/format";

function clausesHasContent(clauses: string[]): boolean {
  return clauses.some((t) => t.trim().length > 0);
}

function PartyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1 text-sm leading-normal text-slate-900">
      <span className="shrink-0">{label}:</span>
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{value.trim() ? value : "—"}</span>
    </div>
  );
}

export function ContractShareReadonlyPrint({ data }: { data: ContractSharePayload }) {
  const lines = data.lines ?? [];
  const clauses = data.clauses ?? [];
  const extraFees = data.extraFees ?? [];
  const taxIncluded = !!data.taxIncluded;
  const taxRate = typeof data.taxRate === "number" ? data.taxRate : Number(data.taxRate) || 0;
  const docCurrency = normalizeDocumentCurrency(data.currency);

  const subtotal = contractLinesSubtotal(lines);
  const taxAmt = contractTaxFromSubtotal(subtotal, taxIncluded, taxRate);
  const extraFeesSum = contractExtraFeesTotal(extraFees);
  const grandTotal = contractGrandTotalFromState(lines, taxIncluded, taxRate, extraFees);

  const hasClauses = clausesHasContent(clauses);
  const buyer = data.buyer;
  const seller = data.seller;

  return (
    <div
      id="contract-print"
      className="quote-document mx-auto max-w-[210mm] rounded-lg border border-slate-300 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="mb-6 text-center text-2xl font-bold tracking-widest text-slate-900">Contract</h2>

      <div className="contract-print-header-grid mb-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="shrink-0 font-medium text-slate-700">Buyer:</span>
            <span className="text-slate-900">{buyer.name || "—"}</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="shrink-0 font-medium text-slate-700">Seller:</span>
            <span className="text-slate-900">{seller.name || "—"}</span>
          </div>
        </div>
        <div className="contract-print-header-right space-y-2 text-sm sm:text-right">
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="text-slate-600">Contract No.</span>
            <span className="min-w-[10rem] rounded border border-slate-200 bg-slate-50/80 px-2 py-1 text-left sm:text-right">
              {data.contractNo || "—"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="text-slate-600">Date</span>
            <span className="rounded border border-slate-200 bg-slate-50/80 px-2 py-1">
              {data.signingDate ? formatDateUSFromIso(data.signingDate) : "—"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="text-slate-600">Place</span>
            <span className="min-w-[10rem] rounded border border-slate-200 bg-slate-50/80 px-2 py-1 text-left sm:text-right">
              {data.signingPlace?.trim() ? data.signingPlace : "—"}
            </span>
          </div>
        </div>
      </div>

      <p className="contract-print-intro mb-6 text-sm leading-loose text-slate-800 indent-8">{CONTRACT_INTRO}</p>

      <p className="mb-2 text-sm font-semibold text-slate-900">1. Line items</p>

      <div className="quote-print-lines-desktop quote-print-lines-wrap hidden md:block overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse border border-slate-800 text-center text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-800 px-1 py-2 font-medium">Item code</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">Item</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">Model / Spec</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">Unit</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">Qty</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">Unit price</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">Amount</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
                <tr key={l.id}>
                <td className="border border-slate-800 px-1 py-1 align-top text-center">{l.productCode || "—"}</td>
                <td className="border border-slate-800 px-1 py-1 align-top text-center whitespace-pre-wrap break-words">
                  {l.name || "—"}
                </td>
                <td className="border border-slate-800 px-1 py-1 align-top text-center whitespace-pre-wrap break-words">
                  {l.modelSpec || "—"}
                </td>
                <td className="border border-slate-800 px-1 py-1 align-top text-center">{l.unit || "—"}</td>
                <td className="border border-slate-800 px-1 py-1 align-top text-center">{l.qty}</td>
                <td className="border border-slate-800 px-1 py-1 align-top text-center">{l.price}</td>
                <td className="whitespace-nowrap border border-slate-800 px-1 py-1 align-top text-center">
                  {formatMoney(l.amount, docCurrency)}
                </td>
                <td className="border border-slate-800 px-1 py-1 align-top text-center whitespace-pre-wrap break-words">
                  {l.remark?.trim() ? l.remark : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="quote-print-lines-mobile space-y-3 md:hidden">
        {lines.map((l) => (
          <div key={l.id} className="rounded border border-slate-300 p-3 text-sm">
            <div className="font-medium">{l.name}</div>
            <div className="mt-1 text-xs text-slate-600">
              {l.productCode} · {l.modelSpec}
            </div>
            <div className="mt-2 text-xs">Qty {l.qty} · Unit price {l.price}</div>
            <div className="mt-1 font-medium">Amount {formatMoney(l.amount, docCurrency)}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-800 pt-4 text-sm">
        <div className="flex flex-wrap items-center gap-3 text-slate-800">
          <span>Tax included: {taxIncluded ? "Yes" : "No"}</span>
          {taxIncluded ? <span>Tax rate (%): {taxRate}</span> : null}
        </div>
        {extraFees.length > 0 ? (
          <div className="mt-3 space-y-2">
            <div className="text-slate-800">Additional fees</div>
            {extraFees.map((f) => (
              <div key={f.id} className="flex flex-wrap gap-2 text-sm">
                <span>{f.name || "—"}</span>
                <span>{formatMoney(f.amount, docCurrency)}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-4 space-y-2 border-t border-slate-800 pt-3">
          <div className="flex flex-wrap justify-between gap-2 text-slate-800">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal, docCurrency)}</span>
          </div>
          {taxIncluded ? (
            <div className="flex flex-wrap justify-between gap-2 text-slate-800">
              <span>Tax ({taxRate}%)</span>
              <span>{formatMoney(taxAmt, docCurrency)}</span>
            </div>
          ) : null}
          <div className="flex flex-wrap justify-between gap-2 text-slate-800">
            <span>Additional fees</span>
            <span>{formatMoney(extraFeesSum, docCurrency)}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-2 font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatMoney(grandTotal, docCurrency)}</span>
          </div>
        </div>
      </div>

      {hasClauses ? (
        <div id="contract-clauses-section" className="mt-8 border-t border-slate-200 pt-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Terms & Conditions</h3>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-800">
            {clauses
              .filter((t) => t.trim().length > 0)
              .map((t, i) => (
                <li key={i} className="pl-1 whitespace-pre-wrap break-words">
                  {t}
                </li>
              ))}
          </ol>
        </div>
      ) : null}

      <div className="mt-10 border-t-2 border-slate-800 pt-6">
        <p className="mb-4 text-center text-sm font-semibold text-slate-900">Party details</p>
        <div className="contract-print-parties-grid grid gap-6 sm:grid-cols-2">
          <div className="rounded border border-slate-300 p-4">
            <p className="mb-3 text-sm font-bold text-slate-900">Buyer</p>
            <div className="grid gap-2">
              <PartyRow label="Name" value={buyer.name} />
              <PartyRow label="Address" value={buyer.address} />
              <PartyRow label="Agent" value={buyer.agent} />
              <PartyRow label="Phone" value={buyer.phone} />
              <PartyRow label="Bank" value={buyer.bankName} />
              <PartyRow label="Account" value={buyer.bankAccount} />
              <PartyRow label="Tax ID" value={buyer.taxId} />
            </div>
          </div>
          <div className="relative rounded border border-slate-300 p-4 pb-20 sm:pb-[4.5rem]">
            <p className="mb-3 text-sm font-bold text-slate-900">Seller</p>
            <div className="grid gap-2">
              <PartyRow label="Name" value={seller.name} />
              <PartyRow label="Address" value={seller.address} />
              <PartyRow label="Agent" value={seller.agent} />
              <PartyRow label="Phone" value={seller.phone} />
              <PartyRow label="Bank" value={seller.bankName} />
              <PartyRow label="Account" value={seller.bankAccount} />
              <PartyRow label="Tax ID" value={seller.taxId} />
            </div>
            {data.sellerSealImage ? (
              <div className="contract-print-seal-wrap pointer-events-none absolute bottom-3 right-3 flex max-w-[58%] items-end justify-end sm:max-w-[55%]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.sellerSealImage}
                  alt="Digital Company Seal"
                  className="contract-print-seal h-auto max-h-[44mm] w-auto max-w-[44mm] object-contain opacity-[0.92] sm:max-h-[52mm] sm:max-w-[52mm]"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
