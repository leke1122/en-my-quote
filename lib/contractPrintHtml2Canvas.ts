import {
  finalizeContractExportLayoutFromClone,
  resetContractExportCaptureMeta,
} from "@/lib/contractExportSeal";
import { formatSigningDateChinese } from "@/lib/signingDate";

export interface ContractHtml2CanvasCloneOpts {
  hasClausesContent: boolean;
}

function tuneContractTableLayout(root: HTMLElement) {
  const table = root.querySelector(".quote-print-lines-desktop table");
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
  if (rows.length >= 12 || longest >= 24) {
    table.classList.add("contract-export-compact");
  }
  if (rows.length >= 20 || longest >= 42) {
    table.classList.add("contract-export-ultra");
  }
  // 列宽优先给「名称/规格/备注」，压缩单位/数量/单价/金额等短字段列。
  if (rows.length >= 20 || longest >= 42) {
    ensureColgroup([10, 20, 24, 6, 7, 9, 10, 14]);
  } else if (rows.length >= 12 || longest >= 24) {
    ensureColgroup([11, 19, 22, 6, 7, 10, 11, 14]);
  } else {
    ensureColgroup([12, 18, 20, 7, 8, 11, 12, 12]);
  }
}

function normalizeContractTableCells(root: HTMLElement) {
  root.querySelectorAll(".quote-print-lines-desktop table thead th, .quote-print-lines-desktop table tbody td").forEach((cell) => {
    const el = cell as HTMLElement;
    if (el.querySelector(":scope > .contract-export-cell-box")) return;
    const box = root.ownerDocument.createElement("div");
    box.className = "contract-export-cell-box";
    while (el.firstChild) box.appendChild(el.firstChild);
    el.appendChild(box);
  });
}

export function contractHtml2canvasOnClone(clonedDoc: Document, opts: ContractHtml2CanvasCloneOpts) {
  resetContractExportCaptureMeta();
  const root = clonedDoc.getElementById("contract-print");
  if (!root) return;
  const el = root as HTMLElement;
  el.classList.add("quote-export-capture");
  const exportFix = clonedDoc.createElement("style");
  exportFix.textContent = `
/* 固定为 A4 纸宽（210mm），避免 max-content + 移动端视口导致明细表被压窄 */
#contract-print.quote-export-capture {
  max-width: 210mm !important;
  width: 210mm !important;
  min-width: 210mm !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  box-sizing: border-box !important;
}
#contract-print.quote-export-capture .contract-print-header-grid {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 1rem !important;
}
#contract-print.quote-export-capture .contract-print-header-right {
  text-align: right !important;
}
#contract-print.quote-export-capture .contract-print-header-right .flex {
  justify-content: flex-end !important;
}
#contract-print.quote-export-capture .contract-print-intro {
  text-indent: 0 !important;
}
#contract-print.quote-export-capture .contract-print-parties-grid {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 1.5rem !important;
}
#contract-print.quote-export-capture .quote-print-lines-wrap {
  overflow: visible !important;
  max-height: none !important;
  width: 100% !important;
  display: block !important;
}
#contract-print.quote-export-capture .quote-print-lines-desktop {
  display: block !important;
}
#contract-print.quote-export-capture .quote-print-lines-mobile {
  display: none !important;
}
#contract-print.quote-export-capture .quote-print-lines-desktop table {
  width: 100% !important;
  min-width: 0 !important;
  max-width: none !important;
  table-layout: fixed !important;
}
#contract-print.quote-export-capture .quote-print-lines-desktop th,
#contract-print.quote-export-capture .quote-print-lines-desktop td {
  text-align: center !important;
  vertical-align: middle !important;
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  line-height: 1.4 !important;
}
#contract-print.quote-export-capture .quote-print-lines-desktop td input,
#contract-print.quote-export-capture .quote-print-lines-desktop td textarea {
  text-align: center !important;
}
#contract-print.quote-export-capture .quote-print-lines-desktop td > .contract-export-cell-text {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-height: 1.55em !important;
}
#contract-print.quote-export-capture .quote-print-lines-desktop th,
#contract-print.quote-export-capture .quote-print-lines-desktop td {
  padding: 0 !important;
}
#contract-print.quote-export-capture .quote-print-lines-desktop table.contract-export-compact th,
#contract-print.quote-export-capture .quote-print-lines-desktop table.contract-export-compact td {
  font-size: 11px !important;
  line-height: 1.26 !important;
  padding-top: 0.2rem !important;
  padding-bottom: 0.2rem !important;
}
#contract-print.quote-export-capture .quote-print-lines-desktop table.contract-export-ultra th,
#contract-print.quote-export-capture .quote-print-lines-desktop table.contract-export-ultra td {
  font-size: 10px !important;
  line-height: 1.2 !important;
  padding-top: 0.14rem !important;
  padding-bottom: 0.14rem !important;
}
#contract-print.quote-export-capture .quote-print-logo-cell {
  height: auto !important;
  max-height: 5.5rem !important;
  width: 7rem !important;
  align-items: flex-start !important;
}
#contract-print.quote-export-capture .quote-print-logo {
  max-height: 5rem !important;
  max-width: 7rem !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
}
/* 公章：最大边约 52mm（与 measureSealInClone 一致），保留上传图宽高比 */
#contract-print.quote-export-capture .contract-print-seal-wrap {
  max-width: 58% !important;
}
#contract-print.quote-export-capture .contract-print-seal {
  max-height: 52mm !important;
  max-width: 52mm !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
  opacity: 1 !important;
}
#contract-print.quote-export-capture .contract-export-cell-box {
  min-height: 2.2em !important;
  padding: 0.36rem 0.32rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  line-height: 1.38 !important;
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  box-sizing: border-box !important;
}
#contract-print.quote-export-capture .quote-print-lines-desktop table.contract-export-compact .contract-export-cell-box {
  min-height: 2.05em !important;
  padding: 0.3rem 0.24rem !important;
}
#contract-print.quote-export-capture .quote-print-lines-desktop table.contract-export-ultra .contract-export-cell-box {
  min-height: 1.9em !important;
  padding: 0.24rem 0.2rem !important;
}
`.trim();
  clonedDoc.head.appendChild(exportFix);

  el.style.overflow = "visible";
  el.style.maxHeight = "none";
  el.style.height = "auto";
  root.querySelectorAll(".quote-no-print").forEach((rm) => {
    (rm as HTMLElement).remove();
  });
  if (!opts.hasClausesContent) {
    clonedDoc.getElementById("contract-clauses-section")?.remove();
  }
  root.querySelectorAll("input").forEach((inp) => {
    const input = inp as HTMLInputElement;
    if (input.type === "hidden") return;
    const wrap = clonedDoc.createElement("span");
    wrap.className = "contract-export-cell-text whitespace-pre-wrap break-words leading-normal";
    if (input.type === "date") {
      wrap.textContent = input.value ? formatSigningDateChinese(input.value) : "—";
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
    span.className = "contract-export-cell-text whitespace-pre-wrap break-words leading-normal";
    const opt = select.options[select.selectedIndex];
    span.textContent = opt ? opt.text : "—";
    select.replaceWith(span);
  });
  root.querySelectorAll("textarea").forEach((ta) => {
    const tx = ta as HTMLTextAreaElement;
    const div = clonedDoc.createElement("div");
    div.className = "contract-export-cell-text whitespace-pre-wrap break-words text-sm leading-relaxed";
    div.textContent = tx.value || "—";
    tx.replaceWith(div);
  });

  tuneContractTableLayout(root as HTMLElement);
  normalizeContractTableCells(root as HTMLElement);
  finalizeContractExportLayoutFromClone(clonedDoc);
}
