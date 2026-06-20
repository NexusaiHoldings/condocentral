/**
 * GET /api/cron/dues-invoice-cycle
 *
 * Vercel Cron handler that runs the dues billing cycle:
 *  1. Marks any pending invoices whose due_date has passed as 'overdue'
 *  2. Generates new invoices for all active dues_schedules whose
 *     next_invoice_date is today or in the past
 *
 * Schedule: daily (configured in vercel.json).
 * Auth: Bearer token via CRON_SECRET env var (open in dev when unset).
 */

import { NextResponse } from "next/server";
import {
  initDuesTables,
  generateRecurringInvoices,
  updateOverdueStatus,
} from "@/lib/hoa/dues-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization") ?? "";
  return header === "Bearer " + secret;
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!cronAuthorized(request)) {
    return new NextResponse("forbidden", { status: 403 });
  }

  try {
    await initDuesTables();
  } catch (initErr) {
    return NextResponse.json(
      { error: "table init failed", detail: String((initErr as Error).message) },
      { status: 500 }
    );
  }

  const communityId = process.env.HOA_COMMUNITY_ID ?? undefined;

  let overdueCount = 0;
  try {
    overdueCount = await updateOverdueStatus(communityId);
  } catch (overdueErr) {
    return NextResponse.json(
      { error: "overdue sweep failed", detail: String((overdueErr as Error).message) },
      { status: 500 }
    );
  }

  let invoicesCreated = 0;
  try {
    invoicesCreated = await generateRecurringInvoices(communityId);
  } catch (genErr) {
    return NextResponse.json(
      {
        error: "invoice generation failed",
        detail: String((genErr as Error).message),
        overdue_marked: overdueCount,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    overdue_marked: overdueCount,
    invoices_created: invoicesCreated,
    ran_at: new Date().toISOString(),
  });
}
