"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { PAYMENT_SKUS, type PaymentSku } from "@/lib/paymentSkus";
import { PageHeader } from "@/components/PageHeader";
import { TextButton } from "@/components/TextButton";

type CreateResp =
  | { ok: true; outTradeNo: string; sku: string; title: string; amountFen: number; codeUrl: string }
  | { ok: false; error: string };

type OrderResp =
  | { ok: true; order: { outTradeNo: string; status: string; paidAt: string | null } }
  | { ok: false; error: string };

function yuan(amountFen: number): string {
  return (amountFen / 100).toFixed(2);
}

export default function WechatPayPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const preset = (sp.get("sku") || "").trim().toUpperCase();

  const [sku, setSku] = useState<PaymentSku | "">("");
  const [creating, setCreating] = useState(false);
  const [outTradeNo, setOutTradeNo] = useState<string | null>(null);
  const [codeUrl, setCodeUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const skuOptions = useMemo(() => PAYMENT_SKUS, []);

  useEffect(() => {
    if (!preset) return;
    const hit = skuOptions.find((x) => x.sku === preset);
    if (hit) setSku(hit.sku);
  }, [preset, skuOptions]);

  async function createOrder() {
    setError(null);
    setStatus(null);
    setOutTradeNo(null);
    setCodeUrl(null);
    setQrDataUrl(null);

    if (!sku) {
      setError("Please select a plan.");
      return;
    }

    setCreating(true);
    try {
      const resp = await fetch("/api/payment/wechat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sku }),
      });
      const data = (await resp.json()) as CreateResp;
      if (!data.ok) {
        setError(data.error);
        return;
      }
      setOutTradeNo(data.outTradeNo);
      setCodeUrl(data.codeUrl);
      const url = await QRCode.toDataURL(data.codeUrl, { margin: 1, scale: 8 });
      setQrDataUrl(url);
      setStatus("pending");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create order.");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    if (!outTradeNo) return;
    let disposed = false;
    const timer = window.setInterval(async () => {
      try {
        const resp = await fetch(`/api/payment/wechat/order?outTradeNo=${encodeURIComponent(outTradeNo)}`, {
          method: "GET",
          credentials: "include",
        });
        const data = (await resp.json()) as OrderResp;
        if (!data.ok) return;
        if (disposed) return;
        setStatus(data.order.status);
        if (data.order.status === "paid") {
          window.clearInterval(timer);
        }
      } catch {
        // ignore polling errors
      }
    }, 1800);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [outTradeNo]);

  const selected = sku ? skuOptions.find((x) => x.sku === sku) ?? null : null;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <PageHeader
        title="WeChat Pay (QR)"
        actions={
          <TextButton variant="secondary" onClick={() => router.push("/settings")}>
            Back to settings
          </TextButton>
        }
      />

      <section className="surface-card mb-6 p-4">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Choose a plan</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {skuOptions.map((x) => (
            <button
              key={x.sku}
              className={[
                "rounded-xl border px-3 py-3 text-left transition",
                sku === x.sku
                  ? "border-sky-300 bg-sky-50 text-slate-900"
                  : "border-slate-200 bg-white/70 text-slate-800 hover:bg-white",
              ].join(" ")}
              onClick={() => setSku(x.sku)}
              type="button"
            >
              <div className="text-sm font-medium">{x.title}</div>
              <div className="mt-1 text-sm text-slate-600">￥{yuan(x.amountFen)}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <TextButton variant="primary" disabled={creating} onClick={() => void createOrder()}>
            {creating ? "Creating order…" : "Generate payment QR"}
          </TextButton>
          {selected ? (
            <span className="text-sm text-slate-600">
              Selected: <span className="font-medium text-slate-900">{selected.title}</span>
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-sm text-slate-600">
          Billing: subscriptions <span className="font-medium text-slate-900">extend from your current end date</span>{" "}
          when you renew while still active.
        </p>
      </section>

      <section className="surface-card p-4">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Scan to pay</h2>

        {error ? <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        {qrDataUrl ? (
          <div className="flex flex-col items-center gap-3">
            <img src={qrDataUrl} alt="WeChat Pay QR code" className="h-auto w-[220px] rounded-xl border border-slate-200 bg-white p-2" />
            <div className="text-center text-sm text-slate-700">
              {status === "paid" ? (
                <div className="font-medium text-emerald-700">Payment received—subscription extended</div>
              ) : (
                <div>Scan with WeChat to pay. This page updates when payment completes.</div>
              )}
            </div>
            {outTradeNo ? (
              <div className="text-xs text-slate-500">
                Order no.: <span className="font-mono">{outTradeNo}</span>
              </div>
            ) : null}
            {codeUrl ? (
              <div className="text-xs text-slate-500 break-all">
                code_url：<span className="font-mono">{codeUrl}</span>
              </div>
            ) : null}

            {status === "paid" ? (
              <TextButton variant="primary" onClick={() => router.push("/settings")}>
                Back to settings
              </TextButton>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-600">After you tap Generate payment QR, the code appears here.</p>
        )}
      </section>
    </div>
  );
}

