import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { COOKIE_NAME, verifySessionToken } from "@/lib/sessionJwt";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ ok: false, error: "未配置数据库" }, { status: 503 });

  const rawCookie = cookies().get(COOKIE_NAME)?.value;
  const session = rawCookie ? await verifySessionToken(rawCookie) : null;
  if (!session) return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });

  const url = new URL(request.url);
  const outTradeNo = String(url.searchParams.get("outTradeNo") ?? "").trim();
  if (!outTradeNo) return NextResponse.json({ ok: false, error: "缺少 outTradeNo" }, { status: 400 });

  const order = await prisma.paymentOrder.findUnique({ where: { outTradeNo } });
  if (!order || order.userId !== session.userId) {
    return NextResponse.json({ ok: false, error: "订单不存在" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    order: {
      outTradeNo: order.outTradeNo,
      sku: order.sku,
      title: order.description,
      amountFen: order.amountFen,
      status: order.status,
      paidAt: order.paidAt?.toISOString() ?? null,
    },
  });
}

