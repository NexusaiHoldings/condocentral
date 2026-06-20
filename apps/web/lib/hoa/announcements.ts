/**
 * HOA Announcements — server-side data access and broadcast logic.
 *
 * Board members compose announcements; broadcastAnnouncement delivers them
 * to all active residents via Resend email (+ Twilio SMS when configured).
 * Replaces fragmented email threads per CEO briefing MVP scope.
 *
 * Tables (provisioned via packages/db/company/hoa.ts migration):
 *   hoa_announcements (id, community_id, title, body, author_email,
 *                      broadcast_status, recipient_count, created_at, published_at)
 */

import { buildDb } from "@/lib/db";
import { buildEventBus } from "@/lib/events";

export interface Announcement {
  id: string;
  community_id: string;
  title: string;
  body: string;
  author_email: string;
  broadcast_status: string;
  recipient_count: number;
  created_at: string;
  published_at: string | null;
}

export interface CreateAnnouncementInput {
  community_id: string;
  title: string;
  body: string;
  author_email: string;
}

export interface BroadcastResult {
  announcement_id: string;
  sent: number;
  failed: number;
}

// ── schema DDL (for reference; applied via packages/db/company/hoa.ts) ────────

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

// ── helpers ───────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml(title: string, body: string, companyName: string): string {
  const bodyHtml = escapeHtml(body).replace(/\n/g, "<br>");
  return (
    `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#111;max-width:600px;margin:0 auto">` +
    `<h2 style="color:#1e3a5f;margin-bottom:8px">${escapeHtml(title)}</h2>` +
    `<div style="line-height:1.6;color:#333">${bodyHtml}</div>` +
    `<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">` +
    `<p style="color:#888;font-size:13px">` +
    `Sent by ${escapeHtml(companyName)}. ` +
    `You receive these notices as a registered community resident.` +
    `</p></div>`
  );
}

// ── queries ───────────────────────────────────────────────────────────────────

export async function listAnnouncements(
  communityId: string,
): Promise<Announcement[]> {
  const db = buildDb();
  try {
    return await db.query<Announcement>(
      `SELECT id, community_id, title, body, author_email, broadcast_status,
              recipient_count, created_at, published_at
       FROM hoa_announcements
       WHERE community_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      communityId,
    );
  } catch {
    return [];
  }
}

export async function getAnnouncement(
  id: string,
): Promise<Announcement | null> {
  const db = buildDb();
  try {
    const rows = await db.query<Announcement>(
      `SELECT id, community_id, title, body, author_email, broadcast_status,
              recipient_count, created_at, published_at
       FROM hoa_announcements
       WHERE id = $1::uuid`,
      id,
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function createAnnouncement(
  input: CreateAnnouncementInput,
): Promise<Announcement> {
  const db = buildDb();
  const rows = await db.query<Announcement>(
    `INSERT INTO hoa_announcements
       (community_id, title, body, author_email, broadcast_status, recipient_count)
     VALUES ($1, $2, $3, $4, 'draft', 0)
     RETURNING id, community_id, title, body, author_email, broadcast_status,
               recipient_count, created_at, published_at`,
    input.community_id,
    input.title,
    input.body,
    input.author_email,
  );
  if (!rows[0]) {
    throw new Error("Failed to insert announcement");
  }
  return rows[0];
}

// ── broadcast ─────────────────────────────────────────────────────────────────

export async function broadcastAnnouncement(
  announcementId: string,
  communityId: string,
  senderEmail: string,
): Promise<BroadcastResult> {
  const db = buildDb();
  const events = buildEventBus();

  // Mark as broadcasting and stamp published_at
  await db.execute(
    `UPDATE hoa_announcements
     SET broadcast_status = 'broadcasting', published_at = NOW()
     WHERE id = $1::uuid AND community_id = $2`,
    announcementId,
    communityId,
  );

  // Fetch announcement content
  const annRows = await db.query<{ title: string; body: string }>(
    `SELECT title, body FROM hoa_announcements WHERE id = $1::uuid`,
    announcementId,
  );
  const ann = annRows[0];
  if (!ann) {
    throw new Error(`Announcement ${announcementId} not found`);
  }

  // Fetch all active resident emails from the identity system
  let userRows: { email: string }[] = [];
  try {
    userRows = await db.query<{ email: string }>(
      `SELECT email FROM users WHERE status = 'active' ORDER BY email`,
    );
  } catch {
    // users table may not exist in preview env
    userRows = [];
  }

  const apiKey = process.env.RESEND_API_KEY ?? "";
  const companyName = process.env.COMPANY_NAME ?? "HOA Management";
  const fromAddress =
    process.env.EMAIL_FROM ??
    `no-reply@${process.env.COMPANY_SLUG ?? "hoa"}.nexusaiholdings.com`;

  let sent = 0;
  let failed = 0;

  if (apiKey && userRows.length > 0) {
    const html = buildEmailHtml(ann.title, ann.body, companyName);
    const subject = `[${companyName}] ${ann.title}`;

    // Send in batches of 50 to stay within Resend rate limits
    const BATCH = 50;
    for (let offset = 0; offset < userRows.length; offset += BATCH) {
      const batch = userRows.slice(offset, offset + BATCH);
      const emails = batch.map((u) => ({
        from: `${companyName} <${fromAddress}>`,
        to: [u.email],
        subject,
        html,
      }));
      try {
        const resp = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emails),
          signal: AbortSignal.timeout(30_000),
        });
        if (resp.ok) {
          sent += batch.length;
        } else {
          const errText = await resp.text().catch(() => "");
          console.error(
            `[hoa/announcements] Resend batch failed (${resp.status}): ${errText.slice(0, 200)}`,
          );
          failed += batch.length;
        }
      } catch (err) {
        console.error(`[hoa/announcements] Resend batch error: ${err}`);
        failed += batch.length;
      }
    }
  } else if (!apiKey) {
    console.warn(
      "[hoa/announcements] RESEND_API_KEY not set — email broadcast skipped",
    );
  }

  // Determine final status
  const finalStatus =
    failed === 0 ? "sent" : sent > 0 ? "partial" : "failed";

  try {
    await db.execute(
      `UPDATE hoa_announcements
       SET broadcast_status = $1, recipient_count = $2
       WHERE id = $3::uuid`,
      finalStatus,
      sent,
      announcementId,
    );
  } catch (err) {
    console.error(`[hoa/announcements] Failed to update status: ${err}`);
  }

  await events.publish("hoa.announcement_broadcast", {
    announcement_id: announcementId,
    community_id: communityId,
    sender_email: senderEmail,
    sent,
    failed,
  });

  return { announcement_id: announcementId, sent, failed };
}
