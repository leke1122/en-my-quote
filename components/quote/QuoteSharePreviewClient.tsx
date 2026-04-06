"use client";

import html2canvas from "html2canvas";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { canvasGrayscaleForExport } from "@/lib/canvasGrayscale";
import { parseQuoteSharePayload, type QuoteSharePayload } from "@/lib/quoteSharePayload";
import { quoteHtml2canvasOnClone } from "@/lib/quotePrintHtml2Canvas";
import { decodeSharePayload } from "@/lib/share";
import type { QuoteExtraFee } from "@/lib/types";
import { QuoteShareReadonlyPrint } from "./QuoteShareReadonlyPrint";

function termsHasContent(terms: string[]): boolean {
  return terms.some((t) => t.trim().length > 0);
}

function quoteHasExtraFees(fees: QuoteExtraFee[]): boolean {
  return fees.length > 0;
}

export function QuoteSharePreviewClient() {
  const sp = useSearchParams();
  const enc = sp.get("share");
  const [data, setData] = useState<QuoteSharePayload | null | undefined>(undefined);
  const [decodeErr, setDecodeErr] = useState("");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [capErr, setCapErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!enc) {
        setData(null);
        return;
      }
      let raw = enc;
      try {
        raw = decodeURIComponent(enc);
      } catch {
        /* 保持原样 */
      }
      const parsed = await decodeSharePayload(raw);
      if (cancelled) return;
      const q = parseQuoteSharePayload(parsed);
      if (!q) {
        setData(null);
        setDecodeErr("无效或无法识别的分享数据。");
        return;
      }
      setDecodeErr("");
      setData(q);
    })();
    return () => {
      cancelled = true;
    };
  }, [enc]);

  useEffect(() => {
    if (!data) return;
    setImgUrl(null);
    setCapErr("");
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const el = document.getElementById("quote-print");
      if (!el || cancelled) return;
      try {
        let canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1280,
          windowHeight: Math.max(el.scrollHeight, 1600),
          onclone: (clonedDoc) =>
            quoteHtml2canvasOnClone(clonedDoc, {
              hasTermsContent: termsHasContent(data.terms ?? []),
              hasExtraFees: quoteHasExtraFees(data.extraFees ?? []),
            }),
        });
        canvas = canvasGrayscaleForExport(canvas);
        if (!cancelled) {
          setImgUrl(canvas.toDataURL("image/png", 1.0));
          setCapErr("");
        }
      } catch {
        if (!cancelled) setCapErr("生成预览图失败，请稍后重试。");
      }
    }, 100);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [data]);

  if (data === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-600">加载中…</div>
    );
  }

  if (!enc || data === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-red-600">
        {decodeErr || "缺少分享参数或链接无效。"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="mb-4 text-center text-sm text-slate-600">以下为报价预览（只读，与默认导出图片样式一致）</p>
      {capErr ? <p className="mb-4 text-center text-sm text-red-600">{capErr}</p> : null}
      {!imgUrl && !capErr ? (
        <p className="mb-6 text-center text-sm text-slate-500">正在生成预览图…</p>
      ) : null}
      {imgUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgUrl}
          alt="报价预览"
          className="mx-auto block max-w-full rounded border border-slate-200 bg-white shadow-sm"
        />
      ) : null}

      <div
        className="fixed left-0 top-0 -z-10 opacity-0"
        style={{ pointerEvents: "none", width: 1280 }}
        aria-hidden
      >
        <QuoteShareReadonlyPrint data={data} />
      </div>
    </div>
  );
}
