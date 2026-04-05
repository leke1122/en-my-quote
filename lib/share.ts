function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  if (typeof window === "undefined") return "";
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecodeToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof window === "undefined") return new Uint8Array();
  const binary = window.atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

/** 去掉明细行中的大图，缩短分享链接（打开后仍可正常填价与保存） */
export function stripImagesForShare<T>(payload: T): T {
  const raw = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  if (Array.isArray(raw.lines)) {
    raw.lines = raw.lines.map((line: Record<string, unknown>) => {
      const rest = { ...line };
      delete rest.image;
      return rest;
    });
  }
  return raw as T;
}

export function encodeQuoteShare(payload: unknown): string {
  const json = JSON.stringify(payload);
  if (typeof window === "undefined") return "";
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return window.btoa(binary);
}

export function decodeQuoteShare<T>(encoded: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const binary = window.atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * 生成可放入 URL 的片段（含 z./p. 前缀），优先 gzip 压缩。
 */
export async function encodeSharePayload(payload: unknown): Promise<string> {
  const lean = stripImagesForShare(payload);
  const json = JSON.stringify(lean);
  if (typeof window === "undefined") return "";

  if (typeof CompressionStream !== "undefined") {
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"));
    const buf = new Uint8Array(await new Response(stream).arrayBuffer());
    return `z.${base64UrlEncode(buf)}`;
  }

  const bytes = new TextEncoder().encode(json);
  return `p.${base64UrlEncode(bytes)}`;
}

export async function decodeSharePayload(encoded: string): Promise<unknown | null> {
  try {
    if (typeof window === "undefined") return null;
    const trimmed = encoded.trim();
    if (trimmed.startsWith("z.")) {
      const raw = base64UrlDecodeToBytes(trimmed.slice(2));
      if (typeof DecompressionStream === "undefined") return null;
      const copy = new Uint8Array(raw);
      const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream("gzip"));
      const text = await new Response(stream).text();
      return JSON.parse(text);
    }
    if (trimmed.startsWith("p.")) {
      const bytes = base64UrlDecodeToBytes(trimmed.slice(2));
      const text = new TextDecoder().decode(bytes);
      return JSON.parse(text);
    }
    return decodeQuoteShare(trimmed);
  } catch {
    return null;
  }
}
