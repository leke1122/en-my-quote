import { NextResponse } from "next/server";

/**
 * Stripe（或其它支付）Webhook 占位：校验签名后根据 event 更新 Subscription 表。
 * 部署时在 Stripe Dashboard 填写此 URL，并设置 STRIPE_WEBHOOK_SECRET。
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "未配置 STRIPE_WEBHOOK_SECRET" }, { status: 501 });
  }

  await request.text();
  return NextResponse.json({
    ok: false,
    error: "尚未实现：请在此使用 stripe SDK 校验 Stripe-Signature 并更新数据库中的 Subscription",
  });
}
