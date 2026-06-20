/**
 * GET /api/cron/usage-rollup — monthly unit-count rollup for Stripe usage metering.
 *
 * Runs on the first of each month (vercel.json crons). Queries every active HOA
 * community, reads its unit_count, and reports it to Stripe via the
 * @nexus/billing-and-subscriptions usage-metering handler so Stripe can
 * calculate the per-unit invoice for that period.
 *
 * Idempotency: each event carries a key of the form
 * `unit-rollup-YYYY-MM-<community_id>` so duplicate cron firings within the
 * same calendar month are a no-op at the DB level.
 *
 * Auth: when CRON_SECRET is set, Vercel sends `Authorization: Bearer <secret>`;
 * we validate it. Unset → unguarded (local/dev only).
 */

import { NextResponse } from "next/server";
import { buildDb } from "@/lib/db";
import { buildEventBus } from "@/lib/events";
import { handleRecordUsage } from "@nexus/billing-and-subscriptions";
import { listActiveCommunitiesWithSubscriptions } from "@/lib/hoa/billing-tier";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

function rollupMonth(now: Date): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronAuthorized(request)) {
    return new NextResponse("forbidden", { status: 403 });
  }

  const db = buildDb();
  const events = buildEventBus();
  const now = new Date();
  const month = rollupMonth(now);

  let communities;
  try {
    communities = await listActiveCommunitiesWithSubscriptions(db);
  } catch (err) {
    console.error("[cron/usage-rollup] failed to list communities:", err);
    return NextResponse.json(
      { error: String((err as Error).message) },
      { status: 500 },
    );
  }

  const ctx = { db, events };
  const results: Array<{
    communityId: string;
    communityName: string;
    unitCount: number;
    outcome: string;
    detail?: string;
  }> = [];

  for (const community of communities) {
    const idempotencyKey = `unit-rollup-${month}-${community.communityId}`;
    try {
      const result = await handleRecordUsage({
        userId: community.ownerUserId,
        body: {
          meter_name: "units",
          quantity: community.unitCount,
          idempotency_key: idempotencyKey,
          metadata: {
            community_id: community.communityId,
            rollup_month: month,
          },
        },
        ctx,
      });

      if (result.status >= 400) {
        const detail =
          typeof result.body === "string"
            ? result.body
            : JSON.stringify(result.body);
        results.push({
          communityId: community.communityId,
          communityName: community.communityName,
          unitCount: community.unitCount,
          outcome: "failed",
          detail,
        });
      } else {
        results.push({
          communityId: community.communityId,
          communityName: community.communityName,
          unitCount: community.unitCount,
          outcome: "recorded",
        });
      }
    } catch (err) {
      const detail = String((err as Error).message).slice(0, 200);
      console.error(
        `[cron/usage-rollup] error for community ${community.communityId}:`,
        detail,
      );
      results.push({
        communityId: community.communityId,
        communityName: community.communityName,
        unitCount: community.unitCount,
        outcome: "error",
        detail,
      });
    }
  }

  const recorded = results.filter((r) => r.outcome === "recorded").length;
  const failed = results.filter((r) => r.outcome !== "recorded").length;

  console.log(
    `[cron/usage-rollup] month=${month} processed=${results.length} recorded=${recorded} failed=${failed}`,
  );

  return NextResponse.json({
    rollup_month: month,
    processed: results.length,
    recorded,
    failed,
    results,
  });
}
