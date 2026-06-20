/**
 * HOA Maintenance Requests — server-side data access.
 *
 * Residents submit requests through the portal; status transitions
 * (open → in_progress → resolved → closed) are tracked here.
 *
 * Tables (provisioned via packages/db/company/hoa.ts migration):
 *   hoa_maintenance_requests (id, community_id, unit_number, resident_name,
 *     resident_email, category, description, priority, status,
 *     created_at, updated_at)
 */

import { buildDb } from "@/lib/db";
import { buildEventBus } from "@/lib/events";

export type MaintenanceStatus = "open" | "in_progress" | "resolved" | "closed";
export type MaintenancePriority = "low" | "normal" | "high" | "urgent";
export type MaintenanceCategory =
  | "plumbing"
  | "electrical"
  | "hvac"
  | "landscaping"
  | "structural"
  | "appliance"
  | "other";

export interface MaintenanceRequest {
  id: string;
  community_id: string;
  unit_number: string;
  resident_name: string;
  resident_email: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMaintenanceInput {
  community_id: string;
  unit_number: string;
  resident_name: string;
  resident_email: string;
  category: MaintenanceCategory;
  description: string;
  priority?: MaintenancePriority;
}

// ── schema DDL (for reference; applied via packages/db/company/hoa.ts) ────────

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

// ── queries ───────────────────────────────────────────────────────────────────

export async function listMaintenanceRequests(
  communityId: string,
  residentEmail?: string,
): Promise<MaintenanceRequest[]> {
  const db = buildDb();
  try {
    if (residentEmail) {
      return await db.query<MaintenanceRequest>(
        `SELECT id, community_id, unit_number, resident_name, resident_email,
                category, description, priority, status, created_at, updated_at
         FROM hoa_maintenance_requests
         WHERE community_id = $1 AND resident_email = $2
         ORDER BY created_at DESC
         LIMIT 50`,
        communityId,
        residentEmail,
      );
    }
    return await db.query<MaintenanceRequest>(
      `SELECT id, community_id, unit_number, resident_name, resident_email,
              category, description, priority, status, created_at, updated_at
       FROM hoa_maintenance_requests
       WHERE community_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      communityId,
    );
  } catch {
    return [];
  }
}

export async function getMaintenanceRequest(
  id: string,
): Promise<MaintenanceRequest | null> {
  const db = buildDb();
  try {
    const rows = await db.query<MaintenanceRequest>(
      `SELECT id, community_id, unit_number, resident_name, resident_email,
              category, description, priority, status, created_at, updated_at
       FROM hoa_maintenance_requests
       WHERE id = $1::uuid`,
      id,
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function createMaintenanceRequest(
  input: CreateMaintenanceInput,
): Promise<MaintenanceRequest> {
  const db = buildDb();
  const events = buildEventBus();
  const priority: MaintenancePriority = input.priority ?? "normal";

  const rows = await db.query<MaintenanceRequest>(
    `INSERT INTO hoa_maintenance_requests
       (community_id, unit_number, resident_name, resident_email,
        category, description, priority, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
     RETURNING id, community_id, unit_number, resident_name, resident_email,
               category, description, priority, status, created_at, updated_at`,
    input.community_id,
    input.unit_number,
    input.resident_name,
    input.resident_email,
    input.category,
    input.description,
    priority,
  );

  if (!rows[0]) {
    throw new Error("Failed to insert maintenance request");
  }

  await events.publish("hoa.maintenance_request_created", {
    request_id: rows[0].id,
    community_id: input.community_id,
    unit_number: input.unit_number,
    category: input.category,
    priority,
    resident_email: input.resident_email,
  });

  return rows[0];
}

export async function updateMaintenanceStatus(
  requestId: string,
  status: MaintenanceStatus,
): Promise<void> {
  const db = buildDb();
  const events = buildEventBus();

  await db.execute(
    `UPDATE hoa_maintenance_requests
     SET status = $1, updated_at = NOW()
     WHERE id = $2::uuid`,
    status,
    requestId,
  );

  await events.publish("hoa.maintenance_status_updated", {
    request_id: requestId,
    new_status: status,
  });
}

// ── display helpers ───────────────────────────────────────────────────────────

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };
  return labels[status] ?? status;
}

export function priorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: "Low",
    normal: "Normal",
    high: "High",
    urgent: "Urgent",
  };
  return labels[priority] ?? priority;
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    plumbing: "Plumbing",
    electrical: "Electrical",
    hvac: "HVAC / Heating & Cooling",
    landscaping: "Landscaping",
    structural: "Structural",
    appliance: "Appliance",
    other: "Other",
  };
  return labels[category] ?? category;
}
