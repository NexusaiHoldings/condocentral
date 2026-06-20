import type { JSX } from "react";
import Link from "next/link";
import { listViolations, type ViolationStatus } from "@/lib/hoa/violations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUS_LABELS: Record<ViolationStatus, string> = {
  draft: "Draft",
  board_approved: "Board Approved",
  sent: "Sent",
};

const VALID_STATUSES: ViolationStatus[] = ["draft", "board_approved", "sent"];

interface PageProps {
  searchParams: { status?: string };
}

export default async function ViolationsPage({
  searchParams,
}: PageProps): Promise<JSX.Element> {
  const communityId = process.env.COMMUNITY_ID ?? "";
  const rawStatus = searchParams.status ?? "";
  const statusFilter = VALID_STATUSES.includes(rawStatus as ViolationStatus)
    ? (rawStatus as ViolationStatus)
    : undefined;

  const violations = await listViolations(communityId, statusFilter);

  return (
    <main>
      <h1>Violation Notices</h1>
      <p>
        Board-initiated violation tracking with a mandatory human-approval gate
        before any notice is dispatched to a homeowner.
      </p>

      <Link href="/violations/new" className="btn">
        + Report Violation
      </Link>

      <div className="toolbar">
        <form method="GET" action="/violations">
          <select name="status" defaultValue={statusFilter ?? ""}>
            <option value="">All Statuses</option>
            {VALID_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button type="submit">Filter</button>
          {statusFilter && (
            <a href="/violations" className="btn secondary">
              Clear
            </a>
          )}
        </form>
      </div>

      {violations.length === 0 ? (
        <div className="empty">
          <p>
            {statusFilter
              ? `No violations with status "${STATUS_LABELS[statusFilter]}".`
              : "No violations reported yet."}
          </p>
          <Link href="/violations/new" className="btn">
            Report First Violation
          </Link>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Type</th>
              <th>CC&amp;R Section</th>
              <th>Status</th>
              <th>Fair Housing</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {violations.map((v) => {
              const label = STATUS_LABELS[v.status as ViolationStatus] ?? v.status;
              const fhStatus =
                v.fair_housing_approved === null
                  ? "—"
                  : v.fair_housing_approved
                    ? "✓ Passed"
                    : "✗ Failed";
              return (
                <tr key={v.id}>
                  <td>{v.address}</td>
                  <td>{v.violation_type}</td>
                  <td>{v.ccr_section}</td>
                  <td>
                    <span className="muted">{label}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        color:
                          v.fair_housing_approved === null
                            ? undefined
                            : v.fair_housing_approved
                              ? "#166534"
                              : "#b91c1c",
                      }}
                    >
                      {fhStatus}
                    </span>
                  </td>
                  <td>{new Date(v.created_at).toLocaleDateString()}</td>
                  <td style={{ display: "flex", gap: "0.5rem" }}>
                    <Link href={`/violations/${v.id}`} className="btn secondary">
                      View
                    </Link>
                    {(v.status === "draft" || v.status === "board_approved") && (
                      <Link
                        href={`/violations/${v.id}/review`}
                        className="btn secondary"
                      >
                        Review
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
