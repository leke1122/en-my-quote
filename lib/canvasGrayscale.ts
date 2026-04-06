/** html2canvas 不绘制 DOM 的 CSS filter，需在得到位图后再做灰度处理（与导出图片一致） */
export function canvasGrayscaleForExport(src: HTMLCanvasElement): HTMLCanvasElement {
  const w = src.width;
  const h = src.height;
  const dest = document.createElement("canvas");
  dest.width = w;
  dest.height = h;
  const ctx = dest.getContext("2d", { willReadFrequently: true });
  if (!ctx) return src;
  ctx.drawImage(src, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const adj = Math.min(255, Math.max(0, (lum - 128) * 1.08 + 128));
    const u = Math.round(adj);
    data[i] = u;
    data[i + 1] = u;
    data[i + 2] = u;
  }
  ctx.putImageData(imageData, 0, 0);
  return dest;
}
