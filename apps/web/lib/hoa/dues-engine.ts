/**
 * Dues invoicing + delinquency engine for HOA.
 *
 * Generates recurring invoices (monthly/quarterly/annual) per unit,
 * tracks 30/60/90-day aging buckets, and records Stripe payment events.
 *
 * Uses the same require("pg") singleton pattern as apps/web/lib/db.ts
 * so pg is resolved from node_modules at runtime (not bundled by webpack).
 */

export type DuesInvoiceStatus = "pending" | "paid" | "overdue" | "cancelled";
export type BillingCycle = "monthly" | "quarterly" | "annual";
export type AgingBucket = "current" | "1-30" | "31-60" | "61-90" | "90+";

export interface DuesSchedule {
  id: string;
  community_id: string;
  billing_cycle: BillingCycle;
  amount_cents: number;
  next_invoice_date: string;
  is_active: boolean;
  created_at: string;
}

export interface DuesInvoice {
  id: string;
  community_id: string;
  unit_id: string;
  unit_number: string;
  homeowner_name: string;
  homeowner_email: string;
  amount_cents: number;
  due_date: string;
  paid_at: string | null;
  status: DuesInvoiceStatus;
  stripe_payment_intent_id: string | null;
  stripe_payment_url: string | null;
  period_start: string;
  period_end: string;
  days_overdue: number;
  aging_bucket: AgingBucket;
  created_at: string;
}

export interface DelinquencySummary {
  current_count: number;
  bucket_30_count: number;
  bucket_60_count: number;
  bucket_90_count: number;
  bucket_over_90_count: number;
  total_overdue_cents: number;
  total_outstanding_invoices: number;
}

// pg Pool singleton — same pattern as apps/web/lib/db.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pool: any = null;

function getPool(): {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
} {
  if (_pool) return _pool;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool } = require("pg") as {
    Pool: new (cfg: Record<string, unknown>) => typeof _pool;
  };
  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
  return _pool;
}

export async function initDuesTables(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dues_schedules (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      community_id    UUID NOT NULL,
      billing_cycle   TEXT NOT NULL,
      amount_cents    INTEGER NOT NULL,
      next_invoice_date DATE NOT NULL,
      is_active       BOOLEAN NOT NULL DEFAULT true,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS dues_schedules_community_idx
    ON dues_schedules (community_id)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dues_units (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      community_id    UUID NOT NULL,
      unit_number     TEXT NOT NULL,
      homeowner_name  TEXT NOT NULL,
      homeowner_email TEXT NOT NULL,
      schedule_id     UUID,
      is_active       BOOLEAN NOT NULL DEFAULT true,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS dues_units_community_unit_uidx
    ON dues_units (community_id, unit_number)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dues_invoices (
      id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      community_id              UUID NOT NULL,
      unit_id                   UUID NOT NULL,
      amount_cents              INTEGER NOT NULL,
      due_date                  DATE NOT NULL,
      paid_at                   TIMESTAMPTZ,
      status                    TEXT NOT NULL DEFAULT 'pending',
      stripe_payment_intent_id  TEXT,
      stripe_payment_url        TEXT,
      period_start              DATE NOT NULL,
      period_end                DATE NOT NULL,
      created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS dues_invoices_unit_period_uidx
    ON dues_invoices (unit_id, period_start)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS dues_invoices_community_status_idx
    ON dues_invoices (community_id, status)
  `);
}

function computeAgingBucket(
  daysOverdue: number,
  status: DuesInvoiceStatus
): AgingBucket {
  if (status === "paid" || status === "cancelled" || daysOverdue <= 0) {
    return "current";
  }
  if (daysOverdue <= 30) return "1-30";
  if (daysOverdue <= 60) return "31-60";
  if (daysOverdue <= 90) return "61-90";
  return "90+";
}

const INVOICE_SELECT = `
  SELECT
    di.id,
    di.community_id,
    di.unit_id,
    du.unit_number,
    du.homeowner_name,
    du.homeowner_email,
    di.amount_cents,
    di.due_date::text         AS due_date,
    di.paid_at::text          AS paid_at,
    di.status,
    di.stripe_payment_intent_id,
    di.stripe_payment_url,
    di.period_start::text     AS period_start,
    di.period_end::text       AS period_end,
    di.created_at::text       AS created_at,
    GREATEST(0, EXTRACT(DAY FROM now() - di.due_date))::int AS days_overdue
  FROM dues_invoices di
  JOIN dues_units du ON du.id = di.unit_id
`;

function rowToInvoice(row: Record<string, unknown>): DuesInvoice {
  const daysOverdue = Number(row.days_overdue ?? 0);
  return {
    id: String(row.id),
    community_id: String(row.community_id),
    unit_id: String(row.unit_id),
    unit_number: String(row.unit_number),
    homeowner_name: String(row.homeowner_name),
    homeowner_email: String(row.homeowner_email),
    amount_cents: Number(row.amount_cents),
    due_date: String(row.due_date),
    paid_at: row.paid_at != null ? String(row.paid_at) : null,
    status: row.status as DuesInvoiceStatus,
    stripe_payment_intent_id:
      row.stripe_payment_intent_id != null
        ? String(row.stripe_payment_intent_id)
        : null,
    stripe_payment_url:
      row.stripe_payment_url != null ? String(row.stripe_payment_url) : null,
    period_start: String(row.period_start),
    period_end: String(row.period_end),
    days_overdue: daysOverdue,
    aging_bucket: computeAgingBucket(daysOverdue, row.status as DuesInvoiceStatus),
    created_at: String(row.created_at),
  };
}

export async function listDuesInvoices(
  communityId: string,
  status?: string
): Promise<DuesInvoice[]> {
  const pool = getPool();
  const params: unknown[] = [communityId];
  let filter = "";
  if (status) {
    params.push(status);
    filter = `AND di.status = $${params.length}`;
  }
  const result = await pool.query(
    `${INVOICE_SELECT}
     WHERE di.community_id = $1 ${filter}
     ORDER BY di.due_date DESC, di.created_at DESC`,
    params
  );
  return result.rows.map(rowToInvoice);
}

export async function getDuesInvoice(
  invoiceId: string
): Promise<DuesInvoice | null> {
  const pool = getPool();
  const result = await pool.query(
    `${INVOICE_SELECT} WHERE di.id = $1`,
    [invoiceId]
  );
  if (result.rows.length === 0) return null;
  return rowToInvoice(result.rows[0]);
}

export async function getDuesInvoiceByStripeId(
  stripePaymentIntentId: string
): Promise<DuesInvoice | null> {
  const pool = getPool();
  const result = await pool.query(
    `${INVOICE_SELECT} WHERE di.stripe_payment_intent_id = $1`,
    [stripePaymentIntentId]
  );
  if (result.rows.length === 0) return null;
  return rowToInvoice(result.rows[0]);
}

export async function getDelinquencySummary(
  communityId: string
): Promise<DelinquencySummary> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (
         WHERE status IN ('pending','overdue') AND due_date >= CURRENT_DATE
       )::int AS current_count,
       COUNT(*) FILTER (
         WHERE status = 'overdue'
           AND EXTRACT(DAY FROM now() - due_date) BETWEEN 1 AND 30
       )::int AS bucket_30_count,
       COUNT(*) FILTER (
         WHERE status = 'overdue'
           AND EXTRACT(DAY FROM now() - due_date) BETWEEN 31 AND 60
       )::int AS bucket_60_count,
       COUNT(*) FILTER (
         WHERE status = 'overdue'
           AND EXTRACT(DAY FROM now() - due_date) BETWEEN 61 AND 90
       )::int AS bucket_90_count,
       COUNT(*) FILTER (
         WHERE status = 'overdue'
           AND EXTRACT(DAY FROM now() - due_date) > 90
       )::int AS bucket_over_90_count,
       COALESCE(SUM(amount_cents) FILTER (WHERE status = 'overdue'), 0)::int AS total_overdue_cents,
       COUNT(*) FILTER (
         WHERE status IN ('pending','overdue')
       )::int AS total_outstanding_invoices
     FROM dues_invoices
     WHERE community_id = $1`,
    [communityId]
  );
  const row = result.rows[0] ?? {};
  return {
    current_count: Number(row.current_count ?? 0),
    bucket_30_count: Number(row.bucket_30_count ?? 0),
    bucket_60_count: Number(row.bucket_60_count ?? 0),
    bucket_90_count: Number(row.bucket_90_count ?? 0),
    bucket_over_90_count: Number(row.bucket_over_90_count ?? 0),
    total_overdue_cents: Number(row.total_overdue_cents ?? 0),
    total_outstanding_invoices: Number(row.total_outstanding_invoices ?? 0),
  };
}

function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function periodEndDate(cycle: BillingCycle, periodStart: Date): Date {
  let end: Date;
  if (cycle === "monthly") {
    end = addCalendarMonths(periodStart, 1);
  } else if (cycle === "quarterly") {
    end = addCalendarMonths(periodStart, 3);
  } else {
    const y = new Date(periodStart);
    y.setFullYear(y.getFullYear() + 1);
    end = y;
  }
  end.setDate(end.getDate() - 1);
  return end;
}

function nextCycleDate(cycle: BillingCycle, fromDate: Date): Date {
  if (cycle === "monthly") return addCalendarMonths(fromDate, 1);
  if (cycle === "quarterly") return addCalendarMonths(fromDate, 3);
  const yr = new Date(fromDate);
  yr.setFullYear(yr.getFullYear() + 1);
  return yr;
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function generateRecurringInvoices(
  communityId?: string
): Promise<number> {
  const pool = getPool();
  const params: unknown[] = [];
  let filter = "";
  if (communityId) {
    params.push(communityId);
    filter = `AND ds.community_id = $${params.length}`;
  }

  const schedules = await pool.query(
    `SELECT
       ds.id              AS schedule_id,
       ds.community_id,
       ds.billing_cycle,
       ds.amount_cents,
       ds.next_invoice_date::text AS next_invoice_date,
       du.id              AS unit_id
     FROM dues_schedules ds
     JOIN dues_units du
       ON du.schedule_id = ds.id AND du.is_active = true
     WHERE ds.is_active = true
       AND ds.next_invoice_date <= CURRENT_DATE
       ${filter}`,
    params
  );

  let created = 0;
  for (const rawRow of schedules.rows) {
    const row = rawRow as {
      schedule_id: string;
      community_id: string;
      billing_cycle: BillingCycle;
      amount_cents: number;
      next_invoice_date: string;
      unit_id: string;
    };

    const periodStart = new Date(row.next_invoice_date);
    const pEnd = periodEndDate(row.billing_cycle, periodStart);

    // Due date = period start + 15-day grace period
    const dueDate = new Date(periodStart);
    dueDate.setDate(dueDate.getDate() + 15);

    const ins = await pool.query(
      `INSERT INTO dues_invoices
         (community_id, unit_id, amount_cents, due_date, status, period_start, period_end)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6)
       ON CONFLICT (unit_id, period_start) DO NOTHING`,
      [
        row.community_id,
        row.unit_id,
        row.amount_cents,
        toDateStr(dueDate),
        toDateStr(periodStart),
        toDateStr(pEnd),
      ]
    );

    if ((ins.rowCount ?? 0) > 0) created++;

    // Advance the schedule's next_invoice_date
    await pool.query(
      `UPDATE dues_schedules SET next_invoice_date = $1 WHERE id = $2`,
      [toDateStr(nextCycleDate(row.billing_cycle, periodStart)), row.schedule_id]
    );
  }

  return created;
}

export async function updateOverdueStatus(
  communityId?: string
): Promise<number> {
  const pool = getPool();
  const params: unknown[] = [];
  let filter = "";
  if (communityId) {
    params.push(communityId);
    filter = `AND community_id = $${params.length}`;
  }
  const result = await pool.query(
    `UPDATE dues_invoices
     SET status = 'overdue'
     WHERE status = 'pending'
       AND due_date < CURRENT_DATE
       ${filter}`,
    params
  );
  return result.rowCount ?? 0;
}

export async function markInvoicePaid(
  invoiceId: string,
  stripePaymentIntentId: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE dues_invoices
     SET status = 'paid', paid_at = now(), stripe_payment_intent_id = $2
     WHERE id = $1 AND status != 'paid'`,
    [invoiceId, stripePaymentIntentId]
  );
}

export async function markInvoicePaidByStripeId(
  stripePaymentIntentId: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE dues_invoices
     SET status = 'paid', paid_at = now()
     WHERE stripe_payment_intent_id = $1 AND status != 'paid'`,
    [stripePaymentIntentId]
  );
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
