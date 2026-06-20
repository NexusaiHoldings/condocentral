/**
 * /account/billing — HOA per-unit billing overview.
 *
 * Shows the community's current unit count, the derived per-unit price tier,
 * and the monthly amount. Subscription status is pulled from the billing lego's
 * tables. Per-unit pricing per CFO direction: $0.75–$1.25/unit with a $49
 * community minimum.
 */

import type { JSX } from "react";
import { buildDb } from "@/lib/db";
import { getSessionUser } from "@/lib/admin-auth";
import {
  computeMonthlyAmount,
  getCommunityForUser,
} from "@/lib/hoa/billing-tier";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface SubscriptionRow {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  tier_name: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default async function HoaBillingPage(): Promise<JSX.Element> {
  const user = await getSessionUser();

  if (!user) {
    return (
      <main>
        <h1>Billing</h1>
        <p>Please sign in to view your billing information.</p>
      </main>
    );
  }

  const db = buildDb();
  const community = await getCommunityForUser(db, user.id);

  if (!community) {
    return (
      <main>
        <h1>Billing</h1>
        <p>No community is associated with your account.</p>
        <div className="empty">
          <p>Contact support if you believe this is an error.</p>
        </div>
      </main>
    );
  }

  const pricing = computeMonthlyAmount(community.unitCount);

  const subscriptions = await db.query<SubscriptionRow>(
    `SELECT s.id, s.status, s.current_period_start, s.current_period_end, s.tier_name
     FROM billing_subscriptions s
     JOIN billing_customers bc ON bc.id = s.customer_id
     WHERE bc.user_id = $1::uuid
       AND s.status IN ('active', 'trialing')
     ORDER BY s.created_at DESC
     LIMIT 1`,
    user.id,
  );

  const subscription = subscriptions[0] ?? null;

  return (
    <main>
      <h1>Billing</h1>
      <p>
        Your monthly bill scales automatically with your community size — as you
        grow, your per-unit rate decreases.
      </p>

      <div className="card">
        <h2>{community.name}</h2>
        <table>
          <tbody>
            <tr>
              <th>Pricing tier</th>
              <td>{pricing.tierLabel}</td>
            </tr>
            <tr>
              <th>Unit count</th>
              <td>{pricing.unitCount.toLocaleString()} units</td>
            </tr>
            <tr>
              <th>Rate</th>
              <td>{formatCurrency(pricing.pricePerUnit)} / unit / month</td>
            </tr>
            <tr>
              <th>Monthly total</th>
              <td>
                <strong>{formatCurrency(pricing.monthlyAmount)} / month</strong>
                {pricing.unitCount * pricing.pricePerUnit < 49 && (
                  <span className="muted"> (community minimum applied)</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {subscription ? (
        <div className="card">
          <h2>Active subscription</h2>
          <table>
            <tbody>
              <tr>
                <th>Status</th>
                <td style={{ textTransform: "capitalize" }}>{subscription.status}</td>
              </tr>
              <tr>
                <th>Billing period</th>
                <td>
                  {formatDate(subscription.current_period_start)} –{" "}
                  {formatDate(subscription.current_period_end)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <p>No active subscription found. Contact support to set up billing for your community.</p>
        </div>
      )}

      <div className="card">
        <h2>Pricing tiers</h2>
        <p className="muted">
          A $49 / month community minimum applies to all tiers.
        </p>
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Unit range</th>
              <th>Rate</th>
              <th>Example (100 units)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Starter</td>
              <td>1 – 100</td>
              <td>$1.25 / unit / month</td>
              <td>$125.00</td>
            </tr>
            <tr>
              <td>Growth</td>
              <td>101 – 200</td>
              <td>$1.00 / unit / month</td>
              <td>$150.00 (150 units)</td>
            </tr>
            <tr>
              <td>Scale</td>
              <td>201+</td>
              <td>$0.75 / unit / month</td>
              <td>$225.00 (300 units)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
