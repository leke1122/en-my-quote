import { NextResponse } from "next/server";

/**
 * Stripe webhook placeholder: verify signature, then update Subscription from events.
 * Set this URL in the Stripe Dashboard and configure STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "STRIPE_WEBHOOK_SECRET is not set." }, { status: 501 });
  }

  await request.text();
  return NextResponse.json({
    ok: false,
    error:
      "Not implemented yet: verify Stripe-Signature with the Stripe SDK and update Subscription in the database.",
  });
}
