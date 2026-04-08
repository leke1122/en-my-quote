import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { COOKIE_NAME, verifySessionToken } from "@/lib/sessionJwt";
import { getSkuInfo } from "@/lib/paymentSkus";
import { getWechatPayClient } from "@/lib/wechatPayClient";

export const runtime = "nodejs";

function randomOutTradeNo(): string {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `ZXQD${Date.now()}${rand}`;
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ ok: false, error: "未配置数据库" }, { status: 503 });

  const rawCookie = cookies().get(COOKIE_NAME)?.value;
  const session = rawCookie ? await verifySessionToken(rawCookie) : null;
  if (!session) return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });

  let body: { sku?: string };
  try {
    body = (await request.json()) as { sku?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "请求体无效" }, { status: 400 });
  }

  const sku = String(body.sku ?? "").trim();
  const info = getSkuInfo(sku);
  if (!info) return NextResponse.json({ ok: false, error: "SKU 无效" }, { status: 400 });

  const wx = getWechatPayClient();
  if (!wx.ok) return NextResponse.json({ ok: false, error: wx.error }, { status: 503 });

  const outTradeNo = randomOutTradeNo();

  await prisma.paymentOrder.create({
    data: {
      userId: session.userId,
      provider: "wechat",
      outTradeNo,
      sku: info.sku,
      description: info.title,
      amountFen: info.amountFen,
      currency: "CNY",
      status: "pending",
    },
  });

  try {
    const result = await wx.pay.transactions_native({
      appid: wx.appid,
      mchid: wx.mchid,
      description: info.title,
      out_trade_no: outTradeNo,
      notify_url: wx.notifyUrl,
      amount: { total: info.amountFen, currency: "CNY" },
    });

    const codeUrl = (result as { code_url?: string; prepay_id?: string }).code_url || "";
    const prepayId = (result as { code_url?: string; prepay_id?: string }).prepay_id || null;

    if (!codeUrl) {
      await prisma.paymentOrder.update({
        where: { outTradeNo },
        data: { status: "failed" },
      });
      return NextResponse.json({ ok: false, error: "微信下单失败：未返回 code_url" }, { status: 502 });
    }

    await prisma.paymentOrder.update({
      where: { outTradeNo },
      data: { wechatCodeUrl: codeUrl, wechatPrepayId: prepayId },
    });

    return NextResponse.json({
      ok: true,
      outTradeNo,
      sku: info.sku,
      title: info.title,
      amountFen: info.amountFen,
      codeUrl,
    });
  } catch (e) {
    await prisma.paymentOrder.update({
      where: { outTradeNo },
      data: { status: "failed" },
    });
    return NextResponse.json(
      { ok: false, error: `微信下单失败：${e instanceof Error ? e.message : "unknown"}` },
      { status: 502 }
    );
  }
}

