/**
 * HOA schema — communities, units, homeowners (F1-002).
 *
 * Multi-tenant by community_id partition key. All IDs are UUID.
 * Picked up by packages/db/migrate.ts via the *_DDL constant convention.
 * No CHECK constraints on free-form text columns per spec.
 */
export const HOA_DDL = `
CREATE TABLE IF NOT EXISTS communities (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text        NOT NULL,
  address                 text        NOT NULL,
  city                    text        NOT NULL,
  state                   text        NOT NULL,
  zip                     text        NOT NULL,
  total_units             integer     NOT NULL DEFAULT 0,
  fiscal_year_start_month integer     NOT NULL DEFAULT 1,
  contact_email           text,
  contact_phone           text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS units (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  unit_number  text        NOT NULL,
  address      text,
  bedrooms     integer,
  bathrooms    numeric(3,1),
  square_feet  integer,
  status       text        NOT NULL DEFAULT 'occupied',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, unit_number)
);

CREATE INDEX IF NOT EXISTS idx_units_community_id ON units (community_id);

CREATE TABLE IF NOT EXISTS homeowners (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  unit_id      uuid        NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  first_name   text        NOT NULL,
  last_name    text        NOT NULL,
  email        text,
  phone        text,
  is_primary   boolean     NOT NULL DEFAULT true,
  move_in_date date,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_homeowners_community_id ON homeowners (community_id);
CREATE INDEX IF NOT EXISTS idx_homeowners_unit_id      ON homeowners (unit_id);
`;

/**
 * Violation notices (F1) — the table the /violations workflow reads + writes.
 *
 * This was MISSING: apps/web/lib/hoa/violations.ts queries `hoa_violations`
 * but no DDL ever created it, so /violations 500'd with "relation
 * hoa_violations does not exist". Columns mirror the Violation interface +
 * the INSERT/UPDATE statements in violations.ts. No FK on community_id /
 * homeowner_id so the feature works before parent rows are fully seeded; no
 * CHECK on the free-form status column per spec.
 */
export const HOA_VIOLATIONS_DDL = `
CREATE TABLE IF NOT EXISTS hoa_violations (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id           uuid        NOT NULL,
  homeowner_id           uuid        NOT NULL,
  address                text        NOT NULL,
  violation_type         text        NOT NULL,
  description            text        NOT NULL,
  ccr_section            text        NOT NULL,
  reported_by            text        NOT NULL,
  status                 text        NOT NULL DEFAULT 'draft',
  drafted_letter         text,
  fair_housing_approved  boolean,
  fair_housing_flags     text[],
  fair_housing_risk      text,
  fair_housing_reasoning text,
  board_approver_id      uuid,
  approved_at            timestamptz,
  sent_at                timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hoa_violations_community
  ON hoa_violations (community_id, status, created_at DESC);
`;
