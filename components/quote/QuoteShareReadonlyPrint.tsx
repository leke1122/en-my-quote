import { formatDateUSFromIso, formatMoney, normalizeDocumentCurrency } from "@/lib/format";
import { quoteDisplayStatus } from "@/lib/quoteStatus";
import type { QuoteSharePayload } from "@/lib/quoteSharePayload";
import { quoteGrandTotal, quoteSubtotal, quoteTax } from "@/lib/quoteTotals";

function termsHasContent(terms: string[]): boolean {
  return terms.some((t) => t.trim().length > 0);
}

function quoteHasExtraFees(fees: { amount: number }[]): boolean {
  return fees.length > 0;
}

export function QuoteShareReadonlyPrint({ data }: { data: QuoteSharePayload }) {
  const company = data.companySnapshot;
  const customer = data.customerSnapshot;
  const lines = data.lines ?? [];
  const extraFees = data.extraFees ?? [];
  const terms = data.terms ?? [];
  const showLineImages = lines.some((l) => !!l.image);
  const docCurrency = normalizeDocumentCurrency(data.currency);

  const subtotal = quoteSubtotal(lines);
  const taxAmt = quoteTax(subtotal, data.taxIncluded, data.taxRate);
  const grand = quoteGrandTotal(lines, data.taxIncluded, data.taxRate, extraFees);

  const hasTerms = termsHasContent(terms);
  const hasExtra = quoteHasExtraFees(extraFees);
  const quoteStatus = quoteDisplayStatus(data.status, data.validUntil);

  return (
    <div
      id="quote-print"
      className="quote-document mx-auto max-w-[210mm] rounded-lg border border-slate-300 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-16 shrink-0 sm:w-24" aria-hidden />
          <h2 className="min-w-0 flex-1 pt-1 text-center text-xl font-semibold tracking-wide text-slate-900">
            Quotation
          </h2>
          <div className="quote-print-logo-cell flex h-16 w-20 shrink-0 items-start justify-end sm:h-20 sm:w-28">
            {company?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logo}
                alt=""
                className="quote-print-logo max-h-16 max-w-full object-contain object-top sm:max-h-20"
              />
            ) : null}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs text-slate-500">Quote No.</div>
            <div className="mt-1 min-h-11 rounded border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-medium leading-normal text-slate-900">
              {data.quoteNo || "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Quote date</div>
            <div className="mt-1 min-h-11 rounded border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm leading-normal">
              {data.date ? formatDateUSFromIso(data.date) : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Valid until</div>
            <div className="mt-1 min-h-11 rounded border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm leading-normal">
              {data.validUntil ? formatDateUSFromIso(data.validUntil) : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Payment terms</div>
            <div className="mt-1 min-h-11 rounded border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm leading-normal">
              {data.paymentTerms || "Net 30"}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Status</div>
            <div className="mt-1 min-h-11 rounded border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-medium uppercase leading-normal">
              {quoteStatus}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-slate-500">Payment link</div>
            <div className="mt-1 min-h-11 rounded border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm leading-normal break-all">
              {data.paymentLink ? (
                <a
                  href={data.paymentLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 underline"
                >
                  {data.paymentLink}
                </a>
              ) : (
                "—"
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
              <div className="text-xs font-medium text-slate-600">Seller</div>
              <div className="mt-2 text-base font-medium text-slate-900">{company?.name || "—"}</div>
              <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm leading-relaxed text-slate-700">
                <div>
                  <span className="text-slate-500">Contact:</span>
                  {company?.contact || "—"}
                </div>
                <div>
                  <span className="text-slate-500">Phone:</span>
                  {company?.phone || "—"}
                </div>
                <div className="break-words">
                  <span className="text-slate-500">Address:</span>
                  {company?.address || "—"}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
              <div className="text-xs font-medium text-slate-600">Customer</div>
              <div className="mt-2 text-base font-semibold text-slate-900">{customer?.name || "—"}</div>
              <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm leading-relaxed text-slate-800">
                <div>
                  <span className="text-slate-500">Contact:</span>
                  {customer?.contact || "—"}
                </div>
                <div>
                  <span className="text-slate-500">Phone:</span>
                  {customer?.phone || "—"}
                </div>
                <div className="break-words">
                  <span className="text-slate-500">Address:</span>
                  {customer?.address || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-5">
        <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-900">Line items</h3>

        <div className="quote-print-lines-desktop quote-print-lines-wrap hidden md:block overflow-x-auto">
          <table className="quote-table w-full min-w-[960px] border-collapse text-center text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                {showLineImages ? (
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">Image</th>
                ) : null}
                <th className="border border-slate-200 px-2 py-2.5 font-medium">Item</th>
                <th className="border border-slate-200 px-2 py-2.5 font-medium">Model</th>
                <th className="border border-slate-200 px-2 py-2.5 font-medium">Spec</th>
                <th className="border border-slate-200 px-2 py-2.5 font-medium">Unit</th>
                <th className="border border-slate-200 px-2 py-2.5 font-medium">Unit price</th>
                <th className="border border-slate-200 px-2 py-2.5 font-medium">Qty</th>
                <th className="border border-slate-200 px-2 py-2.5 font-medium">Amount</th>
                <th className="min-w-[8rem] border border-slate-200 px-2 py-2.5 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="align-top">
                  {showLineImages ? (
                    <td className="border border-slate-200 px-2 py-2 text-center">
                      {l.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.image} alt="" className="mx-auto h-12 w-12 rounded object-cover" />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  ) : null}
                  <td className="max-w-[10rem] whitespace-normal break-words border border-slate-200 px-2 py-2 align-top text-center leading-relaxed">
                    {l.name}
                  </td>
                  <td className="max-w-[8rem] whitespace-normal break-words border border-slate-200 px-2 py-2 align-top text-center leading-relaxed">
                    {l.model}
                  </td>
                  <td className="max-w-[10rem] whitespace-normal break-words border border-slate-200 px-2 py-2 align-top text-center leading-relaxed">
                    {l.spec}
                  </td>
                  <td className="whitespace-normal border border-slate-200 px-2 py-2 align-top text-center">{l.unit}</td>
                  <td className="border border-slate-200 px-2 py-2 align-top text-center">{l.price}</td>
                  <td className="border border-slate-200 px-2 py-2 align-top text-center">{l.qty}</td>
                  <td className="whitespace-nowrap border border-slate-200 px-2 py-2 align-top text-center">
                    {formatMoney(l.amount, docCurrency)}
                  </td>
                  <td className="border border-slate-200 px-2 py-2 align-top text-center text-sm leading-relaxed">
                    {l.remark?.trim() ? l.remark : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lines.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">No line items</p>
          ) : null}
        </div>

        <div className="quote-print-lines-mobile space-y-3 md:hidden">
          {lines.map((l) => (
            <div key={l.id} className="rounded border border-slate-200 p-3 text-sm">
              <div className="flex gap-2">
                {showLineImages && l.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.image} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{l.name}</div>
                  <div className="break-words text-slate-600">
                    {l.model} / {l.spec}
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Unit price {l.price} · Qty {l.qty}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">Notes {l.remark?.trim() || "—"}</div>
                  <div className="mt-1 font-medium">Amount {formatMoney(l.amount, docCurrency)}</div>
                </div>
              </div>
            </div>
          ))}
          {lines.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">No line items</p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-800">
          <span>Tax included: {data.taxIncluded ? "Yes" : "No"}</span>
          {data.taxIncluded ? <span>Tax rate (%): {data.taxRate}</span> : null}
        </div>

        {hasExtra ? (
          <div id="quote-export-extra-fees-fields" className="mt-3 space-y-2">
            <div className="text-sm text-slate-600">Additional fees</div>
            {extraFees.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-[6rem]">{f.name || "—"}</span>
                <span>{formatMoney(f.amount, docCurrency)}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
          <div className="flex justify-between text-slate-700">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal, docCurrency)}</span>
          </div>
          {data.taxIncluded ? (
            <div className="flex justify-between text-slate-700">
              <span>Tax</span>
              <span>{formatMoney(taxAmt, docCurrency)}</span>
            </div>
          ) : null}
          {hasExtra ? (
            <div
              id="quote-export-extra-fees-total-row"
              className="flex justify-between text-slate-700"
            >
              <span>Additional fees</span>
              <span>{formatMoney(extraFees.reduce((s, f) => s + f.amount, 0), docCurrency)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-slate-300 pt-3 text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatMoney(grand, docCurrency)}</span>
          </div>
        </div>
      </div>

      {data.showSeal && company?.sealImage ? (
        <div className="quote-print-seal-block relative mt-6 flex justify-end">
          <div className="contract-print-seal-wrap pointer-events-none flex max-w-[58%] items-end justify-end sm:max-w-[55%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={company.sealImage}
              alt="Digital Company Seal"
              className="contract-print-seal h-auto max-h-[44mm] w-auto max-w-[44mm] object-contain opacity-[0.92] sm:max-h-[52mm] sm:max-w-[52mm]"
            />
          </div>
        </div>
      ) : null}

      {hasTerms ? (
        <div id="quote-terms-section" className="mt-8 border-t border-slate-200 pt-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Terms & Conditions</h3>
          <div className="space-y-3 text-sm text-slate-800">
            {terms
              .filter((t) => t.trim().length > 0)
              .map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-7 text-right font-medium">{i + 1}.</div>
                  <div className="flex-1 whitespace-pre-wrap break-words leading-relaxed">{t}</div>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      {company && (company.taxId || company.bankName) ? (
        <div className="mt-10 border-t-2 border-slate-300 pt-6 text-sm leading-relaxed text-slate-700">
          <div className="mb-2 text-xs font-medium text-slate-500">Seller payment details</div>
          {company.taxId ? (
            <div className="whitespace-pre-wrap break-words">Tax ID: {company.taxId}</div>
          ) : null}
          {company.bankName ? (
            <div className="whitespace-pre-wrap break-words">
              Bank: {company.bankName}
              {company.bankCode ? `  Account: ${company.bankCode}` : ""}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
