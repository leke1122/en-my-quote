import {
  finalizeQuoteExportLayoutFromClone,
  resetContractExportCaptureMeta,
} from "@/lib/contractExportSeal";

/** Matches QuoteEditor export image onclone behavior */

export interface QuoteHtml2CanvasCloneOpts {
  hasTermsContent: boolean;
  hasExtraFees: boolean;
}

function tuneQuoteTableLayout(root: HTMLElement) {
  const table = root.querySelector(".quote-table");
  if (!table) return;
  const ensureColgroup = (widths: number[]) => {
    table.querySelector("colgroup")?.remove();
    const colgroup = root.ownerDocument.createElement("colgroup");
    widths.forEach((w) => {
      const col = root.ownerDocument.createElement("col");
      col.style.width = `${w}%`;
      colgroup.appendChild(col);
    });
    table.prepend(colgroup);
  };
  const rows = table.querySelectorAll("tbody tr");
  let longest = 0;
  rows.forEach((row) => {
    row.querySelectorAll("td").forEach((cell) => {
      const text = (cell.textContent || "").replace(/\s+/g, "");
      if (text.length > longest) longest = text.length;
    });
  });
  if (rows.length >= 10 || longest >= 24) {
    table.classList.add("quote-export-compact");
  }
  if (rows.length >= 18 || longest >= 42) {
    table.classList.add("quote-export-ultra");
  }

  const normalizeCellText = (s: string) => s.replace(/\s+/g, "").trim();
  const isMeaningful = (s: string) => {
    const t = normalizeCellText(s);
    if (!t) return false;
    if (t === "—") return false;
    return true;
  };
  const colIsEmpty = (idx: number) => {
    for (const row of Array.from(rows)) {
      const cells = row.querySelectorAll("td");
      const cell = cells.item(idx);
      if (!cell) continue;
      if (isMeaningful(cell.textContent || "")) return false;
    }
    return true;
  };
  const adjustForEmptyColumns = (base: number[]) => {
    if (base.length < 2) return base;
    const emptyFlags = base.map((_, i) => colIsEmpty(i));
    // Keep image column (if any) and main name/model/spec/remark columns; shrink only fully empty columns.
    const protect = new Set<number>();
    if (base.length === 9) protect.add(0); // image col
    // No image: 0 name 1 model 2 spec ... 7 remark; with image: 1 name 2 model 3 spec ... 8 remark
    const nameIdx = base.length === 9 ? 1 : 0;
    const modelIdx = base.length === 9 ? 2 : 1;
    const specIdx = base.length === 9 ? 3 : 2;
    const remarkIdx = base.length === 9 ? 8 : 7;
    [nameIdx, modelIdx, specIdx, remarkIdx].forEach((i) => protect.add(i));

    const out = [...base];
    let freed = 0;
    for (let i = 0; i < out.length; i++) {
      if (protect.has(i)) continue;
      if (emptyFlags[i]) {
        const minW = i === 0 && base.length === 9 ? 6 : 4; // image col min 6%, other empty cols 4%
        if (out[i] > minW) {
          freed += out[i] - minW;
          out[i] = minW;
        }
      }
    }
    if (freed <= 0) return out;
    // Give freed width mostly to name/spec/remark
    const boost = [
      { i: nameIdx, w: 0.42 },
      { i: specIdx, w: 0.28 },
      { i: remarkIdx, w: 0.2 },
      { i: modelIdx, w: 0.1 },
    ];
    for (const b of boost) {
      out[b.i] += Math.round(freed * b.w * 10) / 10;
    }
    // Normalize sum to 100 (float correction)
    const sum = out.reduce((a, b) => a + b, 0);
    if (sum !== 100) out[nameIdx] += 100 - sum;
    return out;
  };

  const colCount = table.querySelectorAll("thead th").length;
  // No-image: more width for name/model/spec/remark; with image: reserve thumbnail column.
  if (colCount === 8) {
    const base =
      rows.length >= 18 || longest >= 42
        ? [20, 15, 20, 6, 9, 7, 10, 13]
        : rows.length >= 10 || longest >= 24
          ? [19, 14, 19, 7, 10, 7, 11, 13]
          : [18, 13, 18, 7, 11, 8, 12, 13];
    ensureColgroup(adjustForEmptyColumns(base));
  } else if (colCount === 9) {
    const base =
      rows.length >= 18 || longest >= 42
        ? [8, 18, 14, 19, 6, 9, 7, 9, 10]
        : rows.length >= 10 || longest >= 24
          ? [8, 17, 13, 18, 6, 10, 7, 10, 11]
          : [8, 16, 12, 17, 7, 10, 8, 11, 11];
    ensureColgroup(adjustForEmptyColumns(base));
  }
}

function normalizeQuoteTableCells(root: HTMLElement) {
  root.querySelectorAll(".quote-table thead th, .quote-table tbody td").forEach((cell) => {
    const el = cell as HTMLElement;
    if (el.querySelector(":scope > .quote-export-cell-box")) return;
    const box = root.ownerDocument.createElement("div");
    box.className = "quote-export-cell-box";
    while (el.firstChild) box.appendChild(el.firstChild);
    el.appendChild(box);
  });
}

export function quoteHtml2canvasOnClone(clonedDoc: Document, opts: QuoteHtml2CanvasCloneOpts) {
  resetContractExportCaptureMeta();
  const root = clonedDoc.getElementById("quote-print");
  if (!root) return;
  const el = root as HTMLElement;
  el.classList.add("quote-export-capture");
  const exportFix = clonedDoc.createElement("style");
  exportFix.textContent = `
#quote-print.quote-export-capture {
  max-width: 210mm !important;
  width: 210mm !important;
  min-width: 210mm !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  box-sizing: border-box !important;
}
#quote-print.quote-export-capture .quote-print-lines-wrap {
  overflow: visible !important;
  max-height: none !important;
  width: 100% !important;
  display: block !important;
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
#quote-print.quote-export-capture .quote-table th,
#quote-print.quote-export-capture .quote-table td {
  text-align: center !important;
  vertical-align: middle !important;
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  line-height: 1.4 !important;
}
#quote-print.quote-export-capture .quote-table {
  width: 100% !important;
  min-width: 0 !important;
  max-width: none !important;
  table-layout: fixed !important;
}
#quote-print.quote-export-capture .quote-table td input,
#quote-print.quote-export-capture .quote-table td textarea {
  text-align: center !important;
}
#quote-print.quote-export-capture .quote-table th,
#quote-print.quote-export-capture .quote-table td {
  padding: 0 !important;
}
#quote-print.quote-export-capture .quote-table.quote-export-compact th,
#quote-print.quote-export-capture .quote-table.quote-export-compact td {
  font-size: 11px !important;
  line-height: 1.26 !important;
  padding-top: 0.2rem !important;
  padding-bottom: 0.2rem !important;
}
#quote-print.quote-export-capture .quote-table.quote-export-ultra th,
#quote-print.quote-export-capture .quote-table.quote-export-ultra td {
  font-size: 10px !important;
  line-height: 1.2 !important;
  padding-top: 0.14rem !important;
  padding-bottom: 0.14rem !important;
}
#quote-print.quote-export-capture .quote-export-cell-box {
  min-height: 2.2em !important;
  padding: 0.44rem 0.38rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  line-height: 1.42 !important;
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  box-sizing: border-box !important;
}
#quote-print.quote-export-capture .quote-table.quote-export-compact .quote-export-cell-box {
  min-height: 2.05em !important;
  padding: 0.34rem 0.28rem !important;
}
#quote-print.quote-export-capture .quote-table.quote-export-ultra .quote-export-cell-box {
  min-height: 1.9em !important;
  padding: 0.28rem 0.22rem !important;
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
    wrap.className = "quote-export-cell-text whitespace-pre-wrap break-words leading-normal";
    if (input.type === "date") {
      wrap.textContent = input.value || "—";
    } else if (input.type === "checkbox") {
      wrap.textContent = input.checked ? "Yes" : "No";
    } else {
      wrap.textContent = input.value || "—";
    }
    input.replaceWith(wrap);
  });
  root.querySelectorAll("select").forEach((sel) => {
    const select = sel as HTMLSelectElement;
    const span = clonedDoc.createElement("span");
    span.className = "quote-export-cell-text whitespace-pre-wrap break-words leading-normal";
    const opt = select.options[select.selectedIndex];
    span.textContent = opt ? opt.text : "—";
    select.replaceWith(span);
  });
  root.querySelectorAll("textarea").forEach((ta) => {
    const tx = ta as HTMLTextAreaElement;
    const div = clonedDoc.createElement("div");
    div.className = "quote-export-cell-text whitespace-pre-wrap break-words text-sm leading-relaxed";
    div.textContent = tx.value || "—";
    tx.replaceWith(div);
  });
  tuneQuoteTableLayout(root as HTMLElement);
  normalizeQuoteTableCells(root as HTMLElement);
  finalizeQuoteExportLayoutFromClone(clonedDoc);
}
