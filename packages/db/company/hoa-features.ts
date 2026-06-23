/**
 * HOA feature tables (F1) — dues, announcements, maintenance, document vault,
 * and the per-unit billing community.
 *
 * These tables were referenced by apps/web/lib/hoa/* features but had NO
 * build-time DDL: dues-engine/document-vault created them lazily at runtime
 * (initDuesTables / ensureDocumentsTable), and announcements/maintenance
 * exported DDL constants that were never wired into packages/db/. As a result
 * a fresh deploy shipped without these tables (the same class as the
 * /violations 500). Defining them here means packages/db/migrate.ts creates
 * them at build time. Constants end in _DDL so migrate picks them up.
 *
 * Idempotent (CREATE TABLE/INDEX IF NOT EXISTS) — safe on the live DB where
 * some of these already exist via the old lazy-create path.
 */

// dues invoicing + delinquency (lifted verbatim from lib/hoa/dues-engine.ts
// initDuesTables, which the build never called).
export const HOA_DUES_DDL = `
CREATE TABLE IF NOT EXISTS dues_schedules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id      UUID NOT NULL,
  billing_cycle     TEXT NOT NULL,
  amount_cents      INTEGER NOT NULL,
  next_invoice_date DATE NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dues_schedules_community_idx
  ON dues_schedules (community_id);

CREATE TABLE IF NOT EXISTS dues_units (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    UUID NOT NULL,
  unit_number     TEXT NOT NULL,
  homeowner_name  TEXT NOT NULL,
  homeowner_email TEXT NOT NULL,
  schedule_id     UUID,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS dues_units_community_unit_uidx
  ON dues_units (community_id, unit_number);

CREATE TABLE IF NOT EXISTS dues_invoices (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id             UUID NOT NULL,
  unit_id                  UUID NOT NULL,
  amount_cents             INTEGER NOT NULL,
  due_date                 DATE NOT NULL,
  paid_at                  TIMESTAMPTZ,
  status                   TEXT NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_payment_url       TEXT,
  period_start             DATE NOT NULL,
  period_end               DATE NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS dues_invoices_unit_period_uidx
  ON dues_invoices (unit_id, period_start);
CREATE INDEX IF NOT EXISTS dues_invoices_community_status_idx
  ON dues_invoices (community_id, status);
`;

// announcements (lifted from lib/hoa/announcements.ts HOA_ANNOUNCEMENTS_DDL,
// whose comment said "applied via packages/db/company/hoa.ts" — it never was).
export const HOA_ANNOUNCEMENTS_DDL = `
CREATE TABLE IF NOT EXISTS hoa_announcements (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id     text        NOT NULL,
  title            text        NOT NULL,
  body             text        NOT NULL,
  author_email     text        NOT NULL DEFAULT '',
  broadcast_status text        NOT NULL DEFAULT 'draft',
  recipient_count  integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  published_at     timestamptz
);
CREATE INDEX IF NOT EXISTS idx_hoa_announcements_community
  ON hoa_announcements (community_id, created_at DESC);
`;

// maintenance requests (lifted from lib/hoa/maintenance.ts HOA_MAINTENANCE_DDL).
export const HOA_MAINTENANCE_DDL = `
CREATE TABLE IF NOT EXISTS hoa_maintenance_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id   text        NOT NULL,
  unit_number    text        NOT NULL,
  resident_name  text        NOT NULL,
  resident_email text        NOT NULL,
  category       text        NOT NULL,
  description    text        NOT NULL,
  priority       text        NOT NULL DEFAULT 'normal',
  status         text        NOT NULL DEFAULT 'open',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hoa_maintenance_community
  ON hoa_maintenance_requests (community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hoa_maintenance_resident
  ON hoa_maintenance_requests (community_id, resident_email, created_at DESC);
`;

// document vault (lifted from lib/hoa/document-vault.ts ensureDocumentsTable,
// which created it lazily on first read).
export const HOA_DOCUMENTS_DDL = `
CREATE TABLE IF NOT EXISTS hoa_documents (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id      TEXT        NOT NULL,
  file_id           TEXT,
  doc_type          TEXT        NOT NULL,
  statute_category  TEXT        NOT NULL,
  title             TEXT        NOT NULL,
  description       TEXT,
  effective_date    DATE,
  uploaded_by       TEXT        NOT NULL,
  uploaded_by_email TEXT        NOT NULL,
  filename          TEXT        NOT NULL,
  mime_type         TEXT        NOT NULL DEFAULT 'application/octet-stream',
  size_bytes        BIGINT      NOT NULL DEFAULT 0,
  status            TEXT        NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hoa_documents_community
  ON hoa_documents (community_id, doc_type, created_at DESC);
`;

// per-unit billing community (referenced by lib/hoa/billing-tier.ts). NOTE: this
// is a SEPARATE shape from the MVP `communities` table (it carries owner_user_id
// + unit_count for the Stripe usage rollup); billing-tier queried it but no DDL
// ever created it. Created here so the rollup cron + billing reads don't throw.
export const HOA_BILLING_COMMUNITY_DDL = `
CREATE TABLE IF NOT EXISTS hoa_communities (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL DEFAULT '',
  owner_user_id uuid,
  unit_count    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hoa_communities_owner
  ON hoa_communities (owner_user_id);
`;
