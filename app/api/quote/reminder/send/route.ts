import { NextResponse } from "next/server";
import { sendQuoteReminderEmail } from "@/lib/sendQuoteReminderEmail";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: {
    to?: string;
    quoteNo?: string;
    customerName?: string;
    validUntil?: string;
    paymentLink?: string;
    customMessage?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }
  const to = String(body.to ?? "").trim().toLowerCase();
  const quoteNo = String(body.quoteNo ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 });
  }
  if (!quoteNo) {
    return NextResponse.json({ ok: false, error: "Missing quote number." }, { status: 400 });
  }
  const sent = await sendQuoteReminderEmail({
    to,
    quoteNo,
    customerName: body.customerName,
    validUntil: body.validUntil,
    paymentLink: body.paymentLink,
    customMessage: body.customMessage,
  });
  if (!sent.ok) {
    return NextResponse.json({ ok: false, error: sent.error }, { status: 503 });
  }
  return NextResponse.json({ ok: true, via: sent.via });
}
