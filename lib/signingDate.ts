/** 签订日期 ISO → 「YYYY年M月D日」展示（与导出图片 onclone 一致） */
export function formatSigningDateChinese(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[1]}年${Number(m[2])}月${Number(m[3])}日`;
}
