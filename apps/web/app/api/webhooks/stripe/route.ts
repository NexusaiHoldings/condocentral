/**
 * POST /api/webhooks/stripe
 *
 * Receives Stripe webhook events for HOA dues one-time payments
 * (payment_intent.succeeded / payment_intent.payment_failed).
 *
 * Signature verification uses the same HMAC-SHA256 algorithm as the
 * billing lego's webhook handler (legos/billing-and-subscriptions/api/webhook.ts).
 * Uses STRIPE_HOA_WEBHOOK_SECRET to isolate dues webhooks from the
 * billing lego's subscription webhooks.
 *
 * The payment_intent metadata must contain `dues_invoice_id` set at
 * payment-intent creation time so we can correlate the event to the
 * correct HOA dues invoice record.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  initDuesTables,
  markInvoicePaid,
  markInvoicePaidByStripeId,
} from "@/lib/hoa/dues-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SIGNATURE_TOLERANCE_SECONDS = 300;

function verifyStripeSignature(
  rawBody: string,
  sigHeader: string,
  secret: string
): boolean {
  if (!sigHeader || !secret) return false;
  const parts: Record<string, string> = {};
  for (const chunk of sigHeader.split(",")) {
    const eq = chunk.indexOf("=");
    if (eq > 0) {
      parts[chunk.slice(0, eq).trim()] = chunk.slice(eq + 1).trim();
    }
  }
  const timestamp = parts["t"];
  const sigV1 = parts["v1"];
  if (!timestamp || !sigV1) return false;

  const tsInt = parseInt(timestamp, 10);
  if (!Number.isFinite(tsInt)) return false;
  if (Math.abs(Date.now() / 1000 - tsInt) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const signedPayload = timestamp + "." + rawBody;
  const expected = createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const sigBuf = Buffer.from(sigV1, "hex");
  if (expectedBuf.length !== sigBuf.length) return false;
  return timingSafeEqual(expectedBuf, sigBuf);
}

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const sigHeader = request.headers.get("stripe-signature") ?? "";
  const secret = process.env.STRIPE_HOA_WEBHOOK_SECRET ?? "";

  if (!verifyStripeSignature(rawBody, sigHeader, secret)) {
    return new NextResponse("signature verification failed", { status: 400 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new NextResponse("invalid json", { status: 400 });
  }

  const eventType = (event["type"] as string) ?? "";
  const dataObj = (
    (event["data"] as Record<string, unknown>)?.["object"] as Record<string, unknown>
  ) ?? {};

  try {
    await initDuesTables();
  } catch {
    // Non-fatal: tables may already exist
  }

  if (eventType === "payment_intent.succeeded") {
    const paymentIntentId = (dataObj["id"] as string) ?? "";
    const metadata = (dataObj["metadata"] as Record<string, string>) ?? {};
    const invoiceId = metadata["dues_invoice_id"] ?? "";

    if (paymentIntentId) {
      if (invoiceId) {
        await markInvoicePaid(invoiceId, paymentIntentId);
      } else {
        // Fallback: look up by stripe_payment_intent_id stored on the invoice
        await markInvoicePaidByStripeId(paymentIntentId);
      }
    }

    return NextResponse.json({ received: true, handled: "payment_intent.succeeded" });
  }

  if (eventType === "payment_intent.payment_failed") {
    // Log the failure; the invoice remains overdue — the cron will sweep it.
    const paymentIntentId = (dataObj["id"] as string) ?? "";
    const lastError = (dataObj["last_payment_error"] as Record<string, unknown>) ?? {};
    const errorMessage = (lastError["message"] as string) ?? "unknown error";

    console.error(
      JSON.stringify({
        event: "dues.payment_failed",
        payment_intent_id: paymentIntentId,
        error: errorMessage,
      })
    );

    return NextResponse.json({ received: true, handled: "payment_intent.payment_failed" });
  }

  // Acknowledge unhandled event types — Stripe requires a 2xx response.
  return NextResponse.json({ received: true, handled: null, event_type: eventType });
}
