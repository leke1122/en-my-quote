"use client";

import html2canvas from "html2canvas";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ContractShareReadonlyPrint } from "@/components/contract/ContractShareReadonlyPrint";
import { canvasGrayscaleForExport } from "@/lib/canvasGrayscale";
import { compositeSealsInColorOnCanvasAsync } from "@/lib/contractExportSeal";
import { contractHtml2canvasOnClone } from "@/lib/contractPrintHtml2Canvas";
import { parseContractSharePayload, type ContractSharePayload } from "@/lib/contractSharePayload";
import { decodeSharePayload } from "@/lib/share";

function clausesHasContent(clauses: string[]): boolean {
  return clauses.some((t) => t.trim().length > 0);
}

export function ContractSharePreviewClient() {
  const sp = useSearchParams();
  const enc = sp.get("share");
  const [data, setData] = useState<ContractSharePayload | null | undefined>(undefined);
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
        /* leave raw */
      }
      const parsed = await decodeSharePayload(raw);
      if (cancelled) return;
      const c = parseContractSharePayload(parsed);
      if (!c) {
        setData(null);
        setDecodeErr("Invalid or unrecognized share data.");
        return;
      }
      setDecodeErr("");
      setData(c);
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
      const el = document.getElementById("contract-print");
      if (!el || cancelled) return;
      try {
        const sealImages = Array.from(el.querySelectorAll("img.contract-print-seal")) as HTMLImageElement[];
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
            contractHtml2canvasOnClone(clonedDoc, {
              hasClausesContent: clausesHasContent(data.clauses ?? []),
            }),
        });
        canvas = canvasGrayscaleForExport(canvas);
        await compositeSealsInColorOnCanvasAsync(canvas, sealImages, el);
        if (!cancelled) {
          setImgUrl(canvas.toDataURL("image/png", 1.0));
          setCapErr("");
        }
      } catch {
        if (!cancelled) setCapErr("Could not generate preview. Try again.");
      }
    }, 100);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [data]);

  if (data === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-600">Loading…</div>
    );
  }

  if (!enc || data === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-red-600">
        {decodeErr || "Missing share parameter or invalid link."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="mb-4 text-center text-sm text-slate-600">
        Read-only contract preview (matches default export image styling).
      </p>
      {capErr ? <p className="mb-4 text-center text-sm text-red-600">{capErr}</p> : null}
      {!imgUrl && !capErr ? (
        <p className="mb-6 text-center text-sm text-slate-500">Generating preview…</p>
      ) : null}
      {imgUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgUrl}
          alt="Contract preview"
          className="mx-auto block max-w-full rounded border border-slate-200 bg-white shadow-sm"
        />
      ) : null}

      <div
        className="fixed left-0 top-0 -z-10 opacity-0"
        style={{ pointerEvents: "none", width: 1280 }}
        aria-hidden
      >
        <ContractShareReadonlyPrint data={data} />
      </div>
    </div>
  );
}
