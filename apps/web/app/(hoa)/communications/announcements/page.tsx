/**
 * /communications/announcements — Announcement Composer (F1-006).
 *
 * Board-facing page for composing and broadcasting community announcements
 * to all registered residents via @nexus/notifications (Resend email).
 * Replaces fragmented email threads per CEO briefing MVP scope.
 *
 * Access: requires an authenticated session (board role enforced via
 * @nexus/organizations-and-teams RBAC in a future sprint; at MVP any
 * authenticated user can access this URL — restrict via middleware or
 * ADMIN_EMAILS if needed).
 */
import type { JSX } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/admin-auth";
import {
  listAnnouncements,
  createAnnouncement,
  broadcastAnnouncement,
} from "@/lib/hoa/announcements";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function communityId(): string {
  return process.env.HOA_COMMUNITY_ID ?? "default";
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function broadcastStatusBadge(status: string): { label: string; bg: string; color: string } {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    draft: { label: "Draft", bg: "#f3f4f6", color: "#374151" },
    broadcasting: { label: "Broadcasting…", bg: "#fef9c3", color: "#854d0e" },
    sent: { label: "Sent", bg: "#dcfce7", color: "#166534" },
    partial: { label: "Partial", bg: "#ffedd5", color: "#9a3412" },
    failed: { label: "Failed", bg: "#fee2e2", color: "#991b1b" },
  };
  return map[status] ?? { label: status, bg: "#f3f4f6", color: "#374151" };
}

export default async function AnnouncementsPage(): Promise<JSX.Element> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const cid = communityId();

  async function broadcastAction(formData: FormData): Promise<void> {
    "use server";

    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const authorEmail = String(formData.get("author_email") ?? "").trim();

    if (!title || !body || !authorEmail) {
      redirect("/communications/announcements?error=missing_fields");
    }

    const cId = process.env.HOA_COMMUNITY_ID ?? "default";

    const ann = await createAnnouncement({
      community_id: cId,
      title,
      body,
      author_email: authorEmail,
    });

    await broadcastAnnouncement(ann.id, cId, authorEmail);

    redirect("/communications/announcements?sent=1");
  }

  const announcements = await listAnnouncements(cid);

  return (
    <main>
      <h1>Broadcast Announcements</h1>
      <p>
        Compose a community announcement and broadcast it to all registered
        residents via email. Messages are delivered immediately.
      </p>

      {/* ── Compose form ──────────────────────────────────────────── */}
      <section className="card" style={{ marginBottom: "40px" }}>
        <h2 style={{ marginTop: 0 }}>New Announcement</h2>
        <form action={broadcastAction}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <div>
              <label htmlFor="author_email" style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                From (Board Member Email) <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="author_email"
                name="author_email"
                type="email"
                required
                defaultValue={user.email}
                placeholder="board@community.org"
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label htmlFor="title" style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Subject / Title <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. Pool closure this weekend for maintenance"
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label htmlFor="body" style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Message Body <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                id="body"
                name="body"
                rows={6}
                required
                placeholder="Write your announcement here. All active residents will receive this via email."
                style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <button type="submit">Broadcast to All Residents</button>
              <span className="muted" style={{ fontSize: "13px" }}>
                This will send an email to all active community members.
              </span>
            </div>
          </div>
        </form>
      </section>

      {/* ── Previous announcements ───────────────────────────────── */}
      <section>
        <h2>Previous Announcements</h2>
        {announcements.length === 0 ? (
          <div className="empty">
            <p>No announcements yet. Use the form above to compose your first broadcast.</p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {announcements.map((ann) => {
              const badge = broadcastStatusBadge(ann.broadcast_status);
              return (
                <li key={ann.id} className="card" style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px" }}>{ann.title}</h3>
                      <span className="muted" style={{ fontSize: "13px" }}>
                        By {ann.author_email} &middot; {formatDate(ann.created_at)}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: "9999px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                      {ann.recipient_count > 0 && (
                        <span className="muted" style={{ fontSize: "12px" }}>
                          {ann.recipient_count} recipient{ann.recipient_count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{ marginTop: "10px", whiteSpace: "pre-wrap", color: "#4b5563" }}>
                    {ann.body.length > 300 ? ann.body.slice(0, 300) + "…" : ann.body}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Back link ────────────────────────────────────────────── */}
      <div style={{ marginTop: "32px" }}>
        <Link href="/portal" className="btn secondary">
          ← Resident Portal
        </Link>
      </div>
    </main>
  );
}
