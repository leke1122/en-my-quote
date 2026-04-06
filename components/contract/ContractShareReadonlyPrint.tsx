import { amountToChineseUppercase } from "@/lib/chineseAmount";
import { CONTRACT_INTRO } from "@/lib/contractDefaults";
import type { ContractSharePayload } from "@/lib/contractSharePayload";
import {
  contractExtraFeesTotal,
  contractGrandTotalFromState,
  contractLinesSubtotal,
  contractTaxFromSubtotal,
} from "@/lib/contractTotals";
import { formatCurrency } from "@/lib/format";
import { formatSigningDateChinese } from "@/lib/signingDate";

function clausesHasContent(clauses: string[]): boolean {
  return clauses.some((t) => t.trim().length > 0);
}

function PartyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1 text-sm leading-normal text-slate-900">
      <span className="shrink-0">{label}：</span>
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{value.trim() ? value : "—"}</span>
    </div>
  );
}

export function ContractShareReadonlyPrint({ data }: { data: ContractSharePayload }) {
  const lines = data.lines ?? [];
  const clauses = data.clauses ?? [];
  const extraFees = data.extraFees ?? [];
  const taxIncluded = !!data.taxIncluded;
  const taxRate = typeof data.taxRate === "number" ? data.taxRate : 13;

  const subtotal = contractLinesSubtotal(lines);
  const taxAmt = contractTaxFromSubtotal(subtotal, taxIncluded, taxRate);
  const extraFeesSum = contractExtraFeesTotal(extraFees);
  const grandTotal = contractGrandTotalFromState(lines, taxIncluded, taxRate, extraFees);
  const amountCn = amountToChineseUppercase(grandTotal);

  const hasClauses = clausesHasContent(clauses);
  const buyer = data.buyer;
  const seller = data.seller;

  return (
    <div
      id="contract-print"
      className="quote-document mx-auto max-w-[210mm] rounded-lg border border-slate-300 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="mb-6 text-center text-2xl font-bold tracking-widest text-slate-900">销售合同</h2>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="shrink-0 font-medium text-slate-700">需方：</span>
            <span className="text-slate-900">{buyer.name || "—"}</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="shrink-0 font-medium text-slate-700">供方：</span>
            <span className="text-slate-900">{seller.name || "—"}</span>
          </div>
        </div>
        <div className="space-y-2 text-sm sm:text-right">
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="text-slate-600">合同编号</span>
            <span className="min-w-[10rem] rounded border border-slate-200 bg-slate-50/80 px-2 py-1 text-left sm:text-right">
              {data.contractNo || "—"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="text-slate-600">签订时间</span>
            <span className="rounded border border-slate-200 bg-slate-50/80 px-2 py-1">
              {data.signingDate ? formatSigningDateChinese(data.signingDate) : "—"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="text-slate-600">签订地点</span>
            <span className="min-w-[10rem] rounded border border-slate-200 bg-slate-50/80 px-2 py-1 text-left sm:text-right">
              {data.signingPlace?.trim() ? data.signingPlace : "—"}
            </span>
          </div>
        </div>
      </div>

      <p className="mb-6 text-sm leading-loose text-slate-800 indent-8">{CONTRACT_INTRO}</p>

      <p className="mb-2 text-sm font-semibold text-slate-900">
        一、合同标的（产品名称、型号（规格）、单位、数量、单价、金额）
      </p>

      <div className="quote-print-lines-desktop quote-print-lines-wrap hidden md:block overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse border border-slate-800 text-left text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-800 px-1 py-2 font-medium">产品编号 NO</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">产品名称</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">型号/规格</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">单位</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">数量</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">单价</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">金额</th>
              <th className="border border-slate-800 px-1 py-2 font-medium">备注</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td className="border border-slate-800 px-1 py-1 align-top">{l.productCode || "—"}</td>
                <td className="border border-slate-800 px-1 py-1 align-top whitespace-pre-wrap break-words">
                  {l.name || "—"}
                </td>
                <td className="border border-slate-800 px-1 py-1 align-top whitespace-pre-wrap break-words">
                  {l.modelSpec || "—"}
                </td>
                <td className="border border-slate-800 px-1 py-1 align-top">{l.unit || "—"}</td>
                <td className="border border-slate-800 px-1 py-1 align-top">{l.qty}</td>
                <td className="border border-slate-800 px-1 py-1 align-top">{l.price}</td>
                <td className="whitespace-nowrap border border-slate-800 px-1 py-1 align-top">
                  {formatCurrency(l.amount)}
                </td>
                <td className="border border-slate-800 px-1 py-1 align-top whitespace-pre-wrap break-words">
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
            <div className="mt-2 text-xs">数量 {l.qty}　单价 {l.price}</div>
            <div className="mt-1 font-medium">金额 {formatCurrency(l.amount)}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-800 pt-4 text-sm">
        <div className="flex flex-wrap items-center gap-3 text-slate-800">
          <span>含税：{taxIncluded ? "是" : "否"}</span>
          {taxIncluded ? <span>税率（%）：{taxRate}</span> : null}
        </div>
        {extraFees.length > 0 ? (
          <div className="mt-3 space-y-2">
            <div className="text-slate-800">其他费用</div>
            {extraFees.map((f) => (
              <div key={f.id} className="flex flex-wrap gap-2 text-sm">
                <span>{f.name || "—"}</span>
                <span>{formatCurrency(f.amount)}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-4 space-y-2 border-t border-slate-800 pt-3">
          <div className="flex flex-wrap justify-between gap-2 text-slate-800">
            <span>商品金额合计</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {taxIncluded ? (
            <div className="flex flex-wrap justify-between gap-2 text-slate-800">
              <span>税额（税率 {taxRate}%）</span>
              <span>{formatCurrency(taxAmt)}</span>
            </div>
          ) : null}
          <div className="flex flex-wrap justify-between gap-2 text-slate-800">
            <span>其他费用合计</span>
            <span>{formatCurrency(extraFeesSum)}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-800 pt-2 font-medium text-slate-900">
            <span>合同总金额（大写）</span>
            <span>{amountCn}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-2 font-semibold text-slate-900">
            <span>合同总金额（小写）</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      {hasClauses ? (
        <div id="contract-clauses-section" className="mt-8 border-t border-slate-200 pt-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">合同条款</h3>
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
        <p className="mb-4 text-center text-sm font-semibold text-slate-900">以下为双方详细信息（签章页）</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded border border-slate-300 p-4">
            <p className="mb-3 text-sm font-bold text-slate-900">甲方（需方）</p>
            <div className="grid gap-2">
              <PartyRow label="名称" value={buyer.name} />
              <PartyRow label="地址" value={buyer.address} />
              <PartyRow label="代理人" value={buyer.agent} />
              <PartyRow label="电话" value={buyer.phone} />
              <PartyRow label="开户行" value={buyer.bankName} />
              <PartyRow label="账号" value={buyer.bankAccount} />
              <PartyRow label="税号" value={buyer.taxId} />
            </div>
          </div>
          <div className="relative rounded border border-slate-300 p-4 pb-20 sm:pb-[4.5rem]">
            <p className="mb-3 text-sm font-bold text-slate-900">乙方（供方）</p>
            <div className="grid gap-2">
              <PartyRow label="名称" value={seller.name} />
              <PartyRow label="地址" value={seller.address} />
              <PartyRow label="代理人" value={seller.agent} />
              <PartyRow label="电话" value={seller.phone} />
              <PartyRow label="开户行" value={seller.bankName} />
              <PartyRow label="账号" value={seller.bankAccount} />
              <PartyRow label="税号" value={seller.taxId} />
            </div>
            {data.sellerSealImage ? (
              <div className="pointer-events-none absolute bottom-3 right-3 flex max-w-[42%] items-end justify-end sm:max-w-[38%]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.sellerSealImage}
                  alt="公章"
                  className="contract-print-seal h-auto max-h-20 w-auto object-contain opacity-[0.92] sm:max-h-24"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
