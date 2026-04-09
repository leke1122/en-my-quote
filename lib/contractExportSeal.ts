/** 合同导出：克隆内测量公章位置；整页灰度后再叠回原色公章（或强制重绘以保证原色） */

export type ContractSealRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

let lastSealRects: ContractSealRect[] = [];
/** 与 html2canvas scale 相乘前，克隆根在 CSS 布局下的宽度（px） */
export let lastContractExportRootWidth = 1;

const MIN_LAYOUT_PX = 16;
/** A4 上公章最大边（mm），略大于实物常见直径便于辨认 */
const SEAL_MAX_SIDE_MM = 52;

function mmToCssPx(mm: number): number {
  return (mm / 25.4) * 96;
}

export function resetContractExportCaptureMeta(): void {
  lastSealRects = [];
  lastContractExportRootWidth = 1;
}

function measureSealInClone(img: HTMLImageElement, root: HTMLElement): ContractSealRect {
  void root.offsetWidth;
  void root.offsetHeight;
  const rr = root.getBoundingClientRect();
  const maxPx = mmToCssPx(SEAL_MAX_SIDE_MM);
  const nw = img.naturalWidth || 256;
  const nh = img.naturalHeight || 256;
  const fit = Math.min(maxPx / nw, maxPx / nh);
  const targetW = nw * fit;
  const targetH = nh * fit;

  const wrap = img.closest(".contract-print-seal-wrap") as HTMLElement | null;
  if (wrap) {
    void wrap.offsetWidth;
    const wr = wrap.getBoundingClientRect();
    const pad = 8;
    const boxW = Math.max(wr.width - pad, 28);
    const boxH = Math.max(wr.height - pad, 28);
    let w = Math.min(targetW, boxW);
    let h = (w * nh) / nw;
    if (h > boxH) {
      h = boxH;
      w = (h * nw) / nh;
    }
    const x = wr.left - rr.left + Math.max(0, wr.width - w - pad / 2);
    const y = wr.top - rr.top + Math.max(0, wr.height - h - pad / 2);
    return { x, y, w, h };
  }

  const ir = img.getBoundingClientRect();
  let x = ir.left - rr.left;
  let y = ir.top - rr.top;
  let w = ir.width;
  let h = ir.height;
  if (w < MIN_LAYOUT_PX || h < MIN_LAYOUT_PX || !Number.isFinite(w)) {
    w = targetW;
    h = targetH;
    x = Math.max(0, rr.width - w - 16);
    y = Math.max(0, rr.height - h - 24);
  }
  return { x, y, w, h };
}

/**
 * 在 onclone 末尾调用：克隆已套用导出样式并完成 DOM 调整后测量。
 */
export function finalizeContractExportLayoutFromClone(clonedDoc: Document): void {
  const root = clonedDoc.getElementById("contract-print");
  if (!root) return;
  lastContractExportRootWidth = Math.max(
    Math.round(root.getBoundingClientRect().width) || 0,
    root.offsetWidth,
    root.scrollWidth,
    1
  );
  lastSealRects = [];
  root.querySelectorAll("img.contract-print-seal").forEach((node) => {
    lastSealRects.push(measureSealInClone(node as HTMLImageElement, root as HTMLElement));
  });
}

/** 报价单导出：与合同相同测量逻辑，根节点为 `#quote-print` */
export function finalizeQuoteExportLayoutFromClone(clonedDoc: Document): void {
  const root = clonedDoc.getElementById("quote-print");
  if (!root) return;
  lastContractExportRootWidth = Math.max(
    Math.round(root.getBoundingClientRect().width) || 0,
    root.offsetWidth,
    root.scrollWidth,
    1
  );
  lastSealRects = [];
  root.querySelectorAll("img.contract-print-seal").forEach((node) => {
    lastSealRects.push(measureSealInClone(node as HTMLImageElement, root as HTMLElement));
  });
}

function loadImageFromSrc(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im.naturalWidth > 0 ? im : null);
    im.onerror = () => resolve(null);
    im.src = src;
  });
}

function exportCanvasLayoutScale(
  canvas: HTMLCanvasElement,
  liveRoot: HTMLElement | null | undefined
): number {
  let base = Math.max(lastContractExportRootWidth, 1);
  if (base < 200 && liveRoot) {
    base = Math.max(
      base,
      Math.round(liveRoot.getBoundingClientRect().width) || 0,
      liveRoot.offsetWidth,
      liveRoot.scrollWidth,
      400
    );
  }
  return canvas.width / base;
}

/**
 * 用解码后的位图叠到 canvas 上，保证公章为上传原色（不受整页灰度影响）。
 * 彩色导出也会执行一次，避免部分 WebView 把章渲成灰阶。
 */
export async function compositeSealsInColorOnCanvasAsync(
  canvas: HTMLCanvasElement,
  sealImages: HTMLImageElement[],
  liveRoot?: HTMLElement | null
): Promise<void> {
  if (lastSealRects.length === 0 || sealImages.length === 0) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const layoutScale = exportCanvasLayoutScale(canvas, liveRoot ?? null);
  const n = Math.min(lastSealRects.length, sealImages.length);

  for (let i = 0; i < n; i++) {
    const src = sealImages[i].currentSrc || sealImages[i].src;
    if (!src) continue;
    const loaded = await loadImageFromSrc(src);
    if (!loaded || loaded.naturalWidth === 0) continue;
    const r = lastSealRects[i];
    const x = r.x * layoutScale;
    const y = r.y * layoutScale;
    const w = r.w * layoutScale;
    const h = r.h * layoutScale;
    try {
      ctx.drawImage(loaded, x, y, w, h);
    } catch {
      /* 跨域等 */
    }
  }
}
