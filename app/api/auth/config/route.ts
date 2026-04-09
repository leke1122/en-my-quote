import { NextResponse } from "next/server";

/** Tells the client whether cloud auth is enabled (requires DATABASE_URL and JWT_SECRET). */
export async function GET() {
  const db = Boolean(process.env.DATABASE_URL?.trim());
  const jwt = Boolean(process.env.JWT_SECRET?.trim() && process.env.JWT_SECRET.length >= 16);
  const rawShop = process.env.PURCHASE_SHOP_URL?.trim() ?? "";
  const shop = rawShop
    ? /^https?:\/\//i.test(rawShop)
      ? rawShop
      : rawShop.startsWith("//")
        ? `https:${rawShop}`
        : `https://${rawShop}`
    : "";

  return NextResponse.json({
    cloudAuthEnabled: db && jwt,
    trialDays: Math.min(Math.max(Number(process.env.SUBSCRIPTION_TRIAL_DAYS) || 14, 1), 365),
    purchaseShopUrl: shop,
  });
}
