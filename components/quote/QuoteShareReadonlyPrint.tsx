import { formatCurrency } from "@/lib/format";
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

  const subtotal = quoteSubtotal(lines);
  const taxAmt = quoteTax(subtotal, data.taxIncluded, data.taxRate);
  const grand = quoteGrandTotal(lines, data.taxIncluded, data.taxRate, extraFees);

  const hasTerms = termsHasContent(terms);
  const hasExtra = quoteHasExtraFees(extraFees);

  return (
    <div
      id="quote-print"
      className="quote-document mx-auto max-w-[210mm] rounded-lg border border-slate-300 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-16 shrink-0 sm:w-24" aria-hidden />
          <h2 className="min-w-0 flex-1 pt-1 text-center text-xl font-semibold tracking-wide text-slate-900">
            报价单
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
            <div className="text-xs text-slate-500">报价单号</div>
            <div className="mt-1 min-h-11 rounded border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-medium leading-normal text-slate-900">
              {data.quoteNo || "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">报价日期</div>
            <div className="mt-1 min-h-11 rounded border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm leading-normal">
              {data.date || "—"}
            </div>
          </div>
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
              <div className="text-xs font-medium text-slate-600">供方名称</div>
              <div className="mt-2 text-base font-medium text-slate-900">{company?.name || "—"}</div>
              <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm leading-relaxed text-slate-700">
                <div>
                  <span className="text-slate-500">联系人：</span>
                  {company?.contact || "—"}
                </div>
                <div>
                  <span className="text-slate-500">联系电话：</span>
                  {company?.phone || "—"}
                </div>
                <div className="break-words">
                  <span className="text-slate-500">地址：</span>
                  {company?.address || "—"}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
              <div className="text-xs font-medium text-slate-600">客户名称</div>
              <div className="mt-2 text-base font-semibold text-slate-900">{customer?.name || "—"}</div>
              <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm leading-relaxed text-slate-800">
                <div>
                  <span className="text-slate-500">联系人：</span>
                  {customer?.contact || "—"}
                </div>
                <div>
                  <span className="text-slate-500">联系电话：</span>
                  {customer?.phone || "—"}
                </div>
                <div className="break-words">
                  <span className="text-slate-500">地址：</span>
                  {customer?.address || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-5">
        <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-900">【报价明细】</h3>

        <div className="quote-print-lines-desktop quote-print-lines-wrap hidden md:block overflow-x-auto">
          <table className="quote-table w-full min-w-[960px] border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                {showLineImages ? (
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">图</th>
                ) : null}
                <th className="border border-slate-200 px-2 py-2.5 font-medium">名称</th>
                <th className="border border-slate-200 px-2 py-2.5 font-medium">型号</th>
                <th className="border border-slate-200 px-2 py-2.5 font-medium">规格</th>
                <th className="border border-slate-200 px-2 py-2.5 font-medium">单位</th>
                <th className="border border-slate-200 px-2 py-2.5 font-medium">单价</th>
                <th className="border border-slate-200 px-2 py-2.5 font-medium">数量</th>
                <th className="border border-slate-200 px-2 py-2.5 font-medium">金额</th>
                <th className="min-w-[8rem] border border-slate-200 px-2 py-2.5 font-medium">备注</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="align-top">
                  {showLineImages ? (
                    <td className="border border-slate-200 px-2 py-2">
                      {l.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.image} alt="" className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  ) : null}
                  <td className="max-w-[10rem] whitespace-normal break-words border border-slate-200 px-2 py-2 align-top leading-relaxed">
                    {l.name}
                  </td>
                  <td className="max-w-[8rem] whitespace-normal break-words border border-slate-200 px-2 py-2 align-top leading-relaxed">
                    {l.model}
                  </td>
                  <td className="max-w-[10rem] whitespace-normal break-words border border-slate-200 px-2 py-2 align-top leading-relaxed">
                    {l.spec}
                  </td>
                  <td className="whitespace-normal border border-slate-200 px-2 py-2 align-top">{l.unit}</td>
                  <td className="border border-slate-200 px-2 py-2 align-top">{l.price}</td>
                  <td className="border border-slate-200 px-2 py-2 align-top">{l.qty}</td>
                  <td className="whitespace-nowrap border border-slate-200 px-2 py-2 align-top">
                    {formatCurrency(l.amount)}
                  </td>
                  <td className="border border-slate-200 px-2 py-2 align-top text-sm leading-relaxed">
                    {l.remark?.trim() ? l.remark : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lines.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">暂无明细</p>
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
                    单价 {l.price}　数量 {l.qty}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">备注 {l.remark?.trim() || "—"}</div>
                  <div className="mt-1 font-medium">金额 {formatCurrency(l.amount)}</div>
                </div>
              </div>
            </div>
          ))}
          {lines.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">暂无明细</p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-800">
          <span>含税：{data.taxIncluded ? "是" : "否"}</span>
          {data.taxIncluded ? <span>税率（%）：{data.taxRate}</span> : null}
        </div>

        {hasExtra ? (
          <div id="quote-export-extra-fees-fields" className="mt-3 space-y-2">
            <div className="text-sm text-slate-600">其他费用</div>
            {extraFees.map((f) => (
              <div key={f.id} className="flex flex-wrap gap-2 text-sm">
                <span className="min-w-[6rem]">{f.name || "—"}</span>
                <span>{formatCurrency(f.amount)}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
          <div className="flex justify-between text-slate-700">
            <span>商品合计</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {data.taxIncluded ? (
            <div className="flex justify-between text-slate-700">
              <span>税额</span>
              <span>{formatCurrency(taxAmt)}</span>
            </div>
          ) : null}
          {hasExtra ? (
            <div
              id="quote-export-extra-fees-total-row"
              className="flex justify-between text-slate-700"
            >
              <span>其他费用合计</span>
              <span>{formatCurrency(extraFees.reduce((s, f) => s + f.amount, 0))}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-slate-300 pt-3 text-base font-semibold text-slate-900">
            <span>总价</span>
            <span>{formatCurrency(grand)}</span>
          </div>
        </div>
      </div>

      {hasTerms ? (
        <div id="quote-terms-section" className="mt-8 border-t border-slate-200 pt-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">报价条款</h3>
          <ol className="list-decimal space-y-3 pl-5 text-sm text-slate-800">
            {terms
              .filter((t) => t.trim().length > 0)
              .map((t, i) => (
                <li key={i} className="pl-1 whitespace-pre-wrap break-words leading-relaxed">
                  {t}
                </li>
              ))}
          </ol>
        </div>
      ) : null}

      {company && (company.taxId || company.bankName) ? (
        <div className="mt-10 border-t-2 border-slate-300 pt-6 text-sm leading-relaxed text-slate-700">
          <div className="mb-2 text-xs font-medium text-slate-500">供方账户信息</div>
          {company.taxId ? (
            <div className="whitespace-pre-wrap break-words">税号：{company.taxId}</div>
          ) : null}
          {company.bankName ? (
            <div className="whitespace-pre-wrap break-words">
              开户行：{company.bankName}
              {company.bankCode ? `　银行卡号：${company.bankCode}` : ""}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
