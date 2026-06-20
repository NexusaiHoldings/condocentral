/**
 * /portal — Resident Portal (F1-006).
 *
 * Mobile-optimized homeowner-facing dashboard showing community announcements
 * and the resident's maintenance request history. Board members access the
 * announcement composer at /communications/announcements.
 */
import type { JSX, CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/admin-auth";
import { listAnnouncements } from "@/lib/hoa/announcements";
import {
  listMaintenanceRequests,
  statusLabel,
  priorityLabel,
  categoryLabel,
} from "@/lib/hoa/maintenance";

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
    });
  } catch {
    return dateStr;
  }
}

function statusBadgeStyle(status: string): CSSProperties {
  const map: Record<string, CSSProperties> = {
    open: { background: "#dbeafe", color: "#1e40af" },
    in_progress: { background: "#fef9c3", color: "#854d0e" },
    resolved: { background: "#dcfce7", color: "#166534" },
    closed: { background: "#f3f4f6", color: "#4b5563" },
  };
  return map[status] ?? { background: "#f3f4f6", color: "#374151" };
}

export default async function PortalPage(): Promise<JSX.Element> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const cid = communityId();

  const [announcements, myRequests] = await Promise.all([
    listAnnouncements(cid),
    listMaintenanceRequests(cid, user.email),
  ]);

  return (
    <main>
      <h1>Resident Portal</h1>
      <p>
        Welcome, <strong>{user.email}</strong>. View community announcements
        and track your maintenance requests below.
      </p>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", margin: "16px 0" }}>
        <Link href="/portal/maintenance" className="btn">
          + Submit Maintenance Request
        </Link>
      </div>

      {/* ── Announcements ─────────────────────────────────────────── */}
      <section style={{ marginTop: "32px" }}>
        <h2>Community Announcements</h2>
        {announcements.length === 0 ? (
          <div className="empty">
            <p>No announcements yet. Check back soon for updates from your HOA board.</p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {announcements.map((ann) => (
              <li key={ann.id} className="card" style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                  <h3 style={{ margin: 0 }}>{ann.title}</h3>
                  <span className="muted" style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                    {ann.published_at
                      ? formatDate(ann.published_at)
                      : formatDate(ann.created_at)}
                  </span>
                </div>
                <p style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>{ann.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Maintenance Requests ──────────────────────────────────── */}
      <section style={{ marginTop: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <h2 style={{ margin: 0 }}>My Maintenance Requests</h2>
          <Link href="/portal/maintenance" className="btn secondary">
            New Request
          </Link>
        </div>

        {myRequests.length === 0 ? (
          <div className="empty" style={{ marginTop: "16px" }}>
            <p>
              No maintenance requests on file.{" "}
              <Link href="/portal/maintenance">Submit your first request</Link>{" "}
              if you need a repair.
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "8px 4px" }}>Category</th>
                <th style={{ padding: "8px 4px" }}>Priority</th>
                <th style={{ padding: "8px 4px" }}>Status</th>
                <th style={{ padding: "8px 4px" }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.map((req) => (
                <tr key={req.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 4px" }}>
                    <div style={{ fontWeight: 500 }}>{categoryLabel(req.category)}</div>
                    <div className="muted" style={{ fontSize: "12px", marginTop: "2px" }}>
                      Unit {req.unit_number}
                    </div>
                    <div
                      className="muted"
                      style={{
                        fontSize: "12px",
                        marginTop: "2px",
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {req.description}
                    </div>
                  </td>
                  <td style={{ padding: "10px 4px", fontSize: "12px" }}>
                    {priorityLabel(req.priority)}
                  </td>
                  <td style={{ padding: "10px 4px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        fontSize: "12px",
                        fontWeight: 500,
                        ...statusBadgeStyle(req.status),
                      }}
                    >
                      {statusLabel(req.status)}
                    </span>
                  </td>
                  <td style={{ padding: "10px 4px" }} className="muted">
                    {formatDate(req.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
