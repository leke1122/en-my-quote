import { NextResponse } from "next/server";

/**
 * 代理调用 WPS 开放平台「多维表格 - 列举记录」接口，避免浏览器直连 openapi.wps.cn 的跨域限制。
 * 文档：https://open.wps.cn/documents/app-integration-dev/wps365/server/dbsheet/records/list-record
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const token = String(body.token ?? "").trim();
    const fileId = String(body.fileId ?? "").trim();
    const sheetId = String(body.sheetId ?? "").trim();
    const pageToken = String(body.pageToken ?? "");
    const pageSize = Math.min(Math.max(Number(body.pageSize) || 200, 1), 1000);
    const filter = body.filter;

    if (!token || !fileId || !sheetId) {
      return NextResponse.json(
        { ok: false, error: "缺少 token、fileId 或 sheetId" },
        { status: 400 }
      );
    }

    const url = `https://openapi.wps.cn/v7/coop/dbsheet/${encodeURIComponent(fileId)}/sheets/${encodeURIComponent(sheetId)}/records`;

    const payload: Record<string, unknown> = {
      page_size: pageSize,
      page_token: pageToken,
    };
    if (filter != null) payload.filter = filter;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { parse_error: true, raw: text.slice(0, 500) };
    }

    return NextResponse.json(
      {
        ok: res.ok,
        httpStatus: res.status,
        data,
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "代理请求异常",
      },
      { status: 500 }
    );
  }
}
