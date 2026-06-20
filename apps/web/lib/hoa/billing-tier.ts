/**
 * HOA per-unit billing tier logic.
 *
 * Pricing: $1.25/unit (1–100 units), $1.00/unit (101–200 units),
 * $0.75/unit (201+ units). $49/month community minimum on all tiers.
 *
 * Per CFO direction (ceo_briefing): unit count is the billing dimension —
 * revenue scales automatically as communities grow from 50 to 400 units.
 */

import type { Db } from "@nexus/identity-and-access/api/_lib/db";

export interface UnitPricing {
  unitCount: number;
  pricePerUnit: number;
  monthlyAmount: number;
  tierLabel: string;
}

export interface CommunitySubscription {
  communityId: string;
  communityName: string;
  ownerUserId: string;
  unitCount: number;
  subscriptionId: string;
}

const MIN_MONTHLY_CENTS = 4900; // $49.00

/**
 * Compute the monthly billing amount for a given unit count.
 * Applies the tier ladder and enforces the $49 community minimum.
 */
export function computeMonthlyAmount(unitCount: number): UnitPricing {
  const count = Math.max(0, Math.floor(unitCount));

  let pricePerUnit: number;
  let tierLabel: string;

  if (count <= 100) {
    pricePerUnit = 1.25;
    tierLabel = "Starter (1–100 units)";
  } else if (count <= 200) {
    pricePerUnit = 1.0;
    tierLabel = "Growth (101–200 units)";
  } else {
    pricePerUnit = 0.75;
    tierLabel = "Scale (201+ units)";
  }

  const rawCents = count * pricePerUnit * 100;
  const billedCents = Math.max(rawCents, MIN_MONTHLY_CENTS);

  return {
    unitCount: count,
    pricePerUnit,
    monthlyAmount: billedCents / 100,
    tierLabel,
  };
}

/**
 * Fetch the unit count for a single HOA community.
 * Returns 0 when the community is not found.
 */
export async function getCommunityUnitCount(
  db: Db,
  communityId: string,
): Promise<number> {
  const rows = await db.query<{ unit_count: number }>(
    "SELECT unit_count FROM hoa_communities WHERE id = $1::uuid",
    communityId,
  );
  return rows.length > 0 ? (rows[0].unit_count ?? 0) : 0;
}

/**
 * Fetch the HOA community (and its unit count) owned by the given user.
 * Returns null when the user has no community.
 */
export async function getCommunityForUser(
  db: Db,
  userId: string,
): Promise<{ id: string; name: string; unitCount: number } | null> {
  const rows = await db.query<{ id: string; name: string; unit_count: number }>(
    "SELECT id, name, unit_count FROM hoa_communities WHERE owner_user_id = $1::uuid LIMIT 1",
    userId,
  );
  if (rows.length === 0) return null;
  return {
    id: rows[0].id,
    name: rows[0].name,
    unitCount: rows[0].unit_count ?? 0,
  };
}

/**
 * List all HOA communities that have an active or trialing Stripe subscription.
 * Used by the monthly usage-rollup cron to report unit counts to Stripe.
 */
export async function listActiveCommunitiesWithSubscriptions(
  db: Db,
): Promise<CommunitySubscription[]> {
  const rows = await db.query<{
    community_id: string;
    community_name: string;
    owner_user_id: string;
    unit_count: number;
    subscription_id: string;
  }>(
    `SELECT
       c.id            AS community_id,
       c.name          AS community_name,
       c.owner_user_id AS owner_user_id,
       c.unit_count    AS unit_count,
       s.id            AS subscription_id
     FROM hoa_communities c
     JOIN billing_customers bc ON bc.user_id = c.owner_user_id
     JOIN billing_subscriptions s ON s.customer_id = bc.id
     WHERE s.status IN ('active', 'trialing')
     ORDER BY c.id`,
  );

  return rows.map((r) => ({
    communityId: r.community_id,
    communityName: r.community_name,
    ownerUserId: r.owner_user_id,
    unitCount: r.unit_count ?? 0,
    subscriptionId: r.subscription_id,
  }));
}
