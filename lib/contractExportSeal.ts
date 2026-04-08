/** 合同导出：html2canvas 克隆布局上的公章位置与根宽度，用于灰度整页后叠回彩色公章 */

export type ContractSealRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

let lastSealRects: ContractSealRect[] = [];
/** 与 html2canvas scale 相乘前，克隆根在 CSS 布局下的内容宽度（px） */
export let lastContractExportRootWidth = 1;

export function resetContractExportCaptureMeta(): void {
  lastSealRects = [];
  lastContractExportRootWidth = 1;
}

/**
 * 在 onclone 末尾调用：克隆已套用导出样式并完成 DOM 调整后测量。
 */
export function finalizeContractExportLayoutFromClone(clonedDoc: Document): void {
  const root = clonedDoc.getElementById("contract-print");
  if (!root) return;
  lastContractExportRootWidth = Math.max(root.offsetWidth, root.scrollWidth, 1);
  lastSealRects = [];
  const rr = root.getBoundingClientRect();
  root.querySelectorAll("img.contract-print-seal").forEach((node) => {
    const img = node as HTMLImageElement;
    const ir = img.getBoundingClientRect();
    lastSealRects.push({
      x: ir.left - rr.left,
      y: ir.top - rr.top,
      w: ir.width,
      h: ir.height,
    });
  });
}

/**
 * 在整页灰度化之后，用原始 img 以相同位置再绘制一遍，恢复公章颜色。
 */
export function compositeSealsInColorOnCanvas(
  canvas: HTMLCanvasElement,
  sealImages: HTMLImageElement[]
): void {
  if (lastSealRects.length === 0 || sealImages.length === 0) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const scale = canvas.width / Math.max(lastContractExportRootWidth, 1);
  const n = Math.min(lastSealRects.length, sealImages.length);
  for (let i = 0; i < n; i++) {
    const img = sealImages[i];
    const r = lastSealRects[i];
    if (!img.complete || img.naturalWidth === 0) continue;
    const x = r.x * scale;
    const y = r.y * scale;
    const w = r.w * scale;
    const h = r.h * scale;
    try {
      ctx.drawImage(img, x, y, w, h);
    } catch {
      /* 跨域等 */
    }
  }
}
