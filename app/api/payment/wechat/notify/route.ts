import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getWechatPayClient } from "@/lib/wechatPayClient";
import { getSkuInfo } from "@/lib/paymentSkus";
import { applySubscriptionExtension } from "@/lib/subscriptionApply";

export const runtime = "nodejs";

type NotifyBody = {
  id?: string;
  create_time?: string;
  event_type?: string;
  resource_type?: string;
  summary?: string;
  resource?: {
    algorithm?: string;
    ciphertext?: string;
    associated_data?: string;
    nonce?: string;
    original_type?: string;
  };
};

function okResp() {
  return NextResponse.json({ code: "SUCCESS", message: "成功" }, { status: 200 });
}

function failResp(message: string, status = 400) {
  return NextResponse.json({ code: "FAIL", message }, { status });
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  if (!prisma) return okResp(); // 避免重复回调压垮；但这代表未配置 DB 时无法自动激活

  const wx = getWechatPayClient();
  if (!wx.ok) return okResp();

  const raw = await request.text();
  let body: NotifyBody | null = null;
  try {
    body = JSON.parse(raw) as NotifyBody;
  } catch {
    return failResp("invalid json");
  }

  const signature = request.headers.get("wechatpay-signature") || "";
  const serial = request.headers.get("wechatpay-serial") || "";
  const nonce = request.headers.get("wechatpay-nonce") || "";
  const timestamp = request.headers.get("wechatpay-timestamp") || "";

  const verified = await wx.pay.verifySign({
    body: raw,
    signature,
    serial,
    nonce,
    timestamp,
    apiSecret: wx.apiV3Key,
  });
  if (!verified) return failResp("bad signature", 401);

  const r = body?.resource;
  if (!r?.ciphertext || !r.nonce) return failResp("missing resource");
  const deciphered = wx.pay.decipher_gcm(r.ciphertext, r.associated_data || "", r.nonce, wx.apiV3Key) as
    | Record<string, unknown>
    | null;
  if (!deciphered) return failResp("decrypt failed");

  const outTradeNo = String(deciphered.out_trade_no ?? "");
  const tradeState = String(deciphered.trade_state ?? "");
  const transactionId = String(deciphered.transaction_id ?? "");

  if (!outTradeNo) return failResp("missing out_trade_no");

  // 仅处理成功状态；其它状态可按需补充（CLOSED/REVOKED/REFUND 等）
  if (tradeState !== "SUCCESS") return okResp();

  const order = await prisma.paymentOrder.findUnique({ where: { outTradeNo } });
  if (!order) return okResp();
  if (order.status === "paid") return okResp();

  const skuInfo = getSkuInfo(order.sku);
  if (!skuInfo) {
    await prisma.paymentOrder.update({
      where: { outTradeNo },
      data: { status: "paid", wechatTransId: transactionId || order.wechatTransId, paidAt: new Date() },
    });
    return okResp();
  }

  await prisma.$transaction(async (tx) => {
    await tx.paymentOrder.update({
      where: { outTradeNo },
      data: { status: "paid", wechatTransId: transactionId || order.wechatTransId, paidAt: new Date() },
    });

    await applySubscriptionExtension(tx, order.userId, {
      plan: skuInfo.plan,
      lifetime: skuInfo.lifetime,
      addDays: skuInfo.addDays,
      provider: "wechat",
      externalId: transactionId || outTradeNo,
    });
  });

  return okResp();
}

