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
