/** 与 QuoteEditor 导出图片时 onclone 逻辑一致 */

export interface QuoteHtml2CanvasCloneOpts {
  hasTermsContent: boolean;
  hasExtraFees: boolean;
}

export function quoteHtml2canvasOnClone(clonedDoc: Document, opts: QuoteHtml2CanvasCloneOpts) {
  const root = clonedDoc.getElementById("quote-print");
  if (!root) return;
  const el = root as HTMLElement;
  el.classList.add("quote-export-capture");
  const exportFix = clonedDoc.createElement("style");
  exportFix.textContent = `
#quote-print.quote-export-capture {
  max-width: none !important;
  width: max-content !important;
}
#quote-print.quote-export-capture .quote-print-lines-wrap {
  overflow: visible !important;
  max-height: none !important;
}
#quote-print.quote-export-capture .quote-print-lines-desktop {
  display: block !important;
}
#quote-print.quote-export-capture .quote-print-lines-mobile {
  display: none !important;
}
#quote-print.quote-export-capture .quote-print-logo-cell {
  height: auto !important;
  max-height: 5.5rem !important;
  width: 7rem !important;
  align-items: flex-start !important;
}
#quote-print.quote-export-capture .quote-print-logo {
  max-height: 5rem !important;
  max-width: 7rem !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
}
`.trim();
  clonedDoc.head.appendChild(exportFix);

  el.style.overflow = "visible";
  el.style.maxHeight = "none";
  el.style.height = "auto";
  root.querySelectorAll(".quote-no-print").forEach((rm) => {
    (rm as HTMLElement).remove();
  });
  if (!opts.hasTermsContent) {
    clonedDoc.getElementById("quote-terms-section")?.remove();
  }
  if (!opts.hasExtraFees) {
    clonedDoc.getElementById("quote-export-extra-fees-fields")?.remove();
    clonedDoc.getElementById("quote-export-extra-fees-total-row")?.remove();
  }
  root.querySelectorAll("input").forEach((inp) => {
    const input = inp as HTMLInputElement;
    if (input.type === "hidden") return;
    const wrap = clonedDoc.createElement("span");
    wrap.className = "inline-block min-h-[1.35em] whitespace-pre-wrap break-words align-middle leading-normal";
    if (input.type === "date") {
      wrap.textContent = input.value || "—";
    } else if (input.type === "checkbox") {
      wrap.textContent = input.checked ? "是" : "否";
    } else {
      wrap.textContent = input.value || "—";
    }
    input.replaceWith(wrap);
  });
  root.querySelectorAll("select").forEach((sel) => {
    const select = sel as HTMLSelectElement;
    const span = clonedDoc.createElement("span");
    span.className = "block min-h-[1.35em] whitespace-pre-wrap break-words leading-normal py-1";
    const opt = select.options[select.selectedIndex];
    span.textContent = opt ? opt.text : "—";
    select.replaceWith(span);
  });
  root.querySelectorAll("textarea").forEach((ta) => {
    const tx = ta as HTMLTextAreaElement;
    const div = clonedDoc.createElement("div");
    div.className = "whitespace-pre-wrap break-words text-sm leading-relaxed";
    div.textContent = tx.value || "—";
    tx.replaceWith(div);
  });
}
