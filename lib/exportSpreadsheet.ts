/** 明细表导出：CSV（UTF-8 BOM，Excel 可正确打开中文）与 HTML 表格式 .xls（Excel 兼容） */

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function buildCsvUtf8BomBlob(headers: string[], rows: (string | number)[][]): Blob {
  const lines = [
    headers.map((h) => csvCell(h)).join(","),
    ...rows.map((r) => r.map((c) => csvCell(String(c))).join(",")),
  ];
  return new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 单 HTML 表格，扩展名 .xls，Excel / WPS 表格可直接打开 */
export function buildExcelHtmlTableBlob(headers: string[], rows: (string | number)[][]): Blob {
  let html =
    '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="UTF-8" /></head><body><table border="1" cellspacing="0" cellpadding="4">';
  html += "<tr>";
  for (const h of headers) {
    html += `<th>${htmlEscape(h)}</th>`;
  }
  html += "</tr>";
  for (const r of rows) {
    html += "<tr>";
    for (const c of r) {
      html += `<td>${htmlEscape(String(c))}</td>`;
    }
    html += "</tr>";
  }
  html += "</table></body></html>";
  return new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
}

export function triggerDownloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportFilename(prefix: string, ext: "csv" | "xls"): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${prefix}_${y}-${m}-${day}.${ext}`;
}
