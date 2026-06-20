/**
 * HOA community + unit registry — server-side data access (F1-002).
 *
 * Uses the substrate pg pool via buildDb(). All queries use parameterized
 * placeholders ($1, $2, …) — never string interpolation.
 */
import { buildDb } from "@/lib/db";

export interface Community {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  total_units: number;
  fiscal_year_start_month: number;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  community_id: string;
  unit_number: string;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Homeowner {
  id: string;
  community_id: string;
  unit_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  move_in_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCommunityInput {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  total_units: number;
  fiscal_year_start_month?: number;
  contact_email?: string;
  contact_phone?: string;
}

export interface CreateUnitInput {
  community_id: string;
  unit_number: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  status?: string;
}

export interface CreateHomeownerInput {
  community_id: string;
  unit_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
  move_in_date?: string;
}

export async function listCommunities(): Promise<Community[]> {
  const db = buildDb();
  return db.query<Community>(
    `SELECT id, name, address, city, state, zip, total_units,
            fiscal_year_start_month, contact_email, contact_phone,
            created_at, updated_at
       FROM communities
      ORDER BY name ASC`,
  );
}

export async function getCommunity(id: string): Promise<Community | null> {
  const db = buildDb();
  const rows = await db.query<Community>(
    `SELECT id, name, address, city, state, zip, total_units,
            fiscal_year_start_month, contact_email, contact_phone,
            created_at, updated_at
       FROM communities
      WHERE id = $1`,
    id,
  );
  return rows[0] ?? null;
}

export async function createCommunity(input: CreateCommunityInput): Promise<Community> {
  const db = buildDb();
  const rows = await db.query<Community>(
    `INSERT INTO communities
       (name, address, city, state, zip, total_units,
        fiscal_year_start_month, contact_email, contact_phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, name, address, city, state, zip, total_units,
               fiscal_year_start_month, contact_email, contact_phone,
               created_at, updated_at`,
    input.name,
    input.address,
    input.city,
    input.state,
    input.zip,
    input.total_units,
    input.fiscal_year_start_month ?? 1,
    input.contact_email ?? null,
    input.contact_phone ?? null,
  );
  if (!rows[0]) throw new Error("Failed to create community");
  return rows[0];
}

export async function updateCommunity(
  id: string,
  input: Partial<CreateCommunityInput>,
): Promise<Community | null> {
  const db = buildDb();
  const rows = await db.query<Community>(
    `UPDATE communities
        SET name                    = COALESCE($2, name),
            address                 = COALESCE($3, address),
            city                    = COALESCE($4, city),
            state                   = COALESCE($5, state),
            zip                     = COALESCE($6, zip),
            total_units             = COALESCE($7, total_units),
            fiscal_year_start_month = COALESCE($8, fiscal_year_start_month),
            contact_email           = COALESCE($9, contact_email),
            contact_phone           = COALESCE($10, contact_phone),
            updated_at              = now()
      WHERE id = $1
      RETURNING id, name, address, city, state, zip, total_units,
                fiscal_year_start_month, contact_email, contact_phone,
                created_at, updated_at`,
    id,
    input.name ?? null,
    input.address ?? null,
    input.city ?? null,
    input.state ?? null,
    input.zip ?? null,
    input.total_units ?? null,
    input.fiscal_year_start_month ?? null,
    input.contact_email ?? null,
    input.contact_phone ?? null,
  );
  return rows[0] ?? null;
}

export async function listUnits(communityId: string): Promise<Unit[]> {
  const db = buildDb();
  return db.query<Unit>(
    `SELECT id, community_id, unit_number, address, bedrooms, bathrooms,
            square_feet, status, created_at, updated_at
       FROM units
      WHERE community_id = $1
      ORDER BY unit_number ASC`,
    communityId,
  );
}

export async function createUnit(input: CreateUnitInput): Promise<Unit> {
  const db = buildDb();
  const rows = await db.query<Unit>(
    `INSERT INTO units
       (community_id, unit_number, address, bedrooms, bathrooms, square_feet, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, community_id, unit_number, address, bedrooms, bathrooms,
               square_feet, status, created_at, updated_at`,
    input.community_id,
    input.unit_number,
    input.address ?? null,
    input.bedrooms ?? null,
    input.bathrooms ?? null,
    input.square_feet ?? null,
    input.status ?? "occupied",
  );
  if (!rows[0]) throw new Error("Failed to create unit");
  return rows[0];
}

export async function listHomeowners(communityId: string): Promise<Homeowner[]> {
  const db = buildDb();
  return db.query<Homeowner>(
    `SELECT id, community_id, unit_id, first_name, last_name, email, phone,
            is_primary, move_in_date, created_at, updated_at
       FROM homeowners
      WHERE community_id = $1
      ORDER BY last_name ASC, first_name ASC`,
    communityId,
  );
}

export async function createHomeowner(input: CreateHomeownerInput): Promise<Homeowner> {
  const db = buildDb();
  const rows = await db.query<Homeowner>(
    `INSERT INTO homeowners
       (community_id, unit_id, first_name, last_name, email, phone,
        is_primary, move_in_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, community_id, unit_id, first_name, last_name, email, phone,
               is_primary, move_in_date, created_at, updated_at`,
    input.community_id,
    input.unit_id,
    input.first_name,
    input.last_name,
    input.email ?? null,
    input.phone ?? null,
    input.is_primary ?? true,
    input.move_in_date ?? null,
  );
  if (!rows[0]) throw new Error("Failed to create homeowner");
  return rows[0];
}
