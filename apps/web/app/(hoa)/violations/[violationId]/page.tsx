import type { JSX } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getViolation, generateViolationDraft, resolveCommunityId } from "@/lib/hoa/violations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PageProps {
  params: { violationId: string };
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  board_approved: "Board Approved",
  sent: "Sent",
};

export default async function ViolationDetailPage({
  params,
}: PageProps): Promise<JSX.Element> {
  const communityId = resolveCommunityId();
  const violation = await getViolation(params.violationId, communityId);

  if (!violation) {
    notFound();
  }

  async function handleGenerateDraft(): Promise<void> {
    "use server";
    await generateViolationDraft(
      params.violationId,
      resolveCommunityId(),
    );
    redirect(`/violations/${params.violationId}`);
  }

  const statusLabel = STATUS_LABELS[violation.status] ?? violation.status;
  const fhApproved = violation.fair_housing_approved;
  const hasDraft = Boolean(violation.drafted_letter);
  const canReview = violation.status === "draft" && hasDraft && fhApproved;

  return (
    <main>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/violations" className="btn secondary">
          ← Violations
        </Link>
        <h1 style={{ margin: 0 }}>Violation: {violation.address}</h1>
        <span className="muted">{statusLabel}</span>
      </div>

      <p>
        Violation notice details and AI-drafted enforcement letter. The board
        must approve the draft before it can be dispatched to the homeowner.
      </p>

      <div className="card">
        <h2>Violation Details</h2>
        <table>
          <tbody>
            <tr>
              <th>Address</th>
              <td>{violation.address}</td>
            </tr>
            <tr>
              <th>Type</th>
              <td>{violation.violation_type}</td>
            </tr>
            <tr>
              <th>CC&amp;R Section</th>
              <td>{violation.ccr_section}</td>
            </tr>
            <tr>
              <th>Description</th>
              <td>{violation.description}</td>
            </tr>
            <tr>
              <th>Status</th>
              <td>{statusLabel}</td>
            </tr>
            {violation.approved_at && (
              <tr>
                <th>Board Approved</th>
                <td>{new Date(violation.approved_at).toLocaleString()}</td>
              </tr>
            )}
            {violation.sent_at && (
              <tr>
                <th>Sent</th>
                <td>{new Date(violation.sent_at).toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>AI-Drafted Notice Letter</h2>

        {hasDraft ? (
          <>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "Georgia, serif",
                fontSize: 14,
                lineHeight: 1.6,
                background: "rgba(0,0,0,0.025)",
                padding: "1rem",
                borderRadius: 6,
                marginBottom: "1rem",
              }}
            >
              {violation.drafted_letter}
            </pre>

            {fhApproved !== null && (
              <div
                className="card"
                style={{
                  borderColor: fhApproved ? "#22c55e" : "#ef4444",
                  marginBottom: "1rem",
                }}
              >
                <h3>Fair Housing Compliance</h3>
                <p>
                  <strong>
                    {fhApproved ? "✓ Passed" : "✗ Issues Detected"}
                  </strong>
                  {" · Risk level: "}
                  <strong>{violation.fair_housing_risk ?? "unknown"}</strong>
                </p>
                <p className="muted">{violation.fair_housing_reasoning}</p>
                {violation.fair_housing_flags &&
                  violation.fair_housing_flags.length > 0 && (
                    <ul>
                      {violation.fair_housing_flags.map((flag, idx) => (
                        <li key={idx} style={{ color: "#b91c1c" }}>
                          {flag}
                        </li>
                      ))}
                    </ul>
                  )}
                {!fhApproved && (
                  <p style={{ color: "#b91c1c" }}>
                    Regenerate the draft to remove flagged language before
                    submitting for board approval.
                  </p>
                )}
              </div>
            )}

            {violation.status === "draft" && (
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <form action={handleGenerateDraft}>
                  <button type="submit" className="btn secondary">
                    Regenerate Draft
                  </button>
                </form>
                {canReview && (
                  <Link
                    href={`/violations/${violation.id}/review`}
                    className="btn"
                  >
                    Submit for Board Review →
                  </Link>
                )}
              </div>
            )}
          </>
        ) : violation.status === "draft" ? (
          <div className="empty">
            <p>
              No draft letter generated yet. Click below to generate an
              AI-drafted notice grounded in the cited CC&amp;R provision. The
              draft will be screened through the Fair Housing compliance filter
              before surfacing to the board.
            </p>
            <form action={handleGenerateDraft}>
              <button type="submit" className="btn">
                Generate AI Draft
              </button>
            </form>
          </div>
        ) : (
          <p className="muted">No letter draft on record.</p>
        )}

        {violation.status !== "draft" && hasDraft && (
          <div style={{ marginTop: "1rem" }}>
            <Link
              href={`/violations/${violation.id}/review`}
              className="btn secondary"
            >
              View Board Review →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
