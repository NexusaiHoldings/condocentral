import type { JSX } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getViolation,
  approveViolation,
  sendViolationNotice,
} from "@/lib/hoa/violations";

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

export default async function ViolationReviewPage({
  params,
}: PageProps): Promise<JSX.Element> {
  const communityId = process.env.COMMUNITY_ID ?? "";
  const violation = await getViolation(params.violationId, communityId);

  if (!violation) {
    notFound();
  }

  if (!violation.drafted_letter) {
    redirect(`/violations/${params.violationId}`);
  }

  async function handleApprove(formData: FormData): Promise<void> {
    "use server";
    const boardMemberId =
      (formData.get("board_member_id") as string | null) ||
      process.env.BOARD_MEMBER_ID ||
      "00000000-0000-0000-0000-000000000000";
    await approveViolation(
      params.violationId,
      boardMemberId,
      process.env.COMMUNITY_ID ?? "",
    );
    redirect(`/violations/${params.violationId}/review`);
  }

  async function handleSend(_formData: FormData): Promise<void> {
    "use server";
    await sendViolationNotice(
      params.violationId,
      process.env.COMMUNITY_ID ?? "",
    );
    redirect(`/violations/${params.violationId}/review`);
  }

  const fhApproved = violation.fair_housing_approved;
  const canApprove = violation.status === "draft" && fhApproved === true;
  const canSend = violation.status === "board_approved";
  const statusLabel = STATUS_LABELS[violation.status] ?? violation.status;

  return (
    <main>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link
          href={`/violations/${violation.id}`}
          className="btn secondary"
        >
          ← Back to Violation
        </Link>
        <h1 style={{ margin: 0 }}>Board Review</h1>
        <span className="muted">{statusLabel}</span>
      </div>

      <p>
        The board must approve this notice before it can be dispatched to the
        homeowner. This mandatory gate enforces the{" "}
        <strong>draft → board_approved → sent</strong> state machine with no
        bypass path, per Fair Housing Act liability requirements.
      </p>

      <div className="card">
        <h2>Violation Summary</h2>
        <table>
          <tbody>
            <tr>
              <th>Address</th>
              <td>{violation.address}</td>
            </tr>
            <tr>
              <th>Violation Type</th>
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
              <th>Current Status</th>
              <td>{statusLabel}</td>
            </tr>
            {violation.approved_at && (
              <tr>
                <th>Approved At</th>
                <td>{new Date(violation.approved_at).toLocaleString()}</td>
              </tr>
            )}
            {violation.sent_at && (
              <tr>
                <th>Sent At</th>
                <td>{new Date(violation.sent_at).toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        className="card"
        style={{
          borderColor:
            fhApproved === null
              ? undefined
              : fhApproved
                ? "#22c55e"
                : "#ef4444",
        }}
      >
        <h2>Fair Housing Compliance</h2>
        {fhApproved === null ? (
          <p className="muted">
            Fair housing filter has not been run yet. Generate a draft first.
          </p>
        ) : (
          <>
            <p>
              <strong>{fhApproved ? "✓ Passed" : "✗ Failed"}</strong>
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
            {!fhApproved && violation.status === "draft" && (
              <p style={{ color: "#b91c1c" }}>
                This notice cannot be approved until the flagged language is
                removed.{" "}
                <Link href={`/violations/${violation.id}`}>
                  Return to regenerate the draft.
                </Link>
              </p>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2>Draft Notice Letter</h2>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "Georgia, serif",
            fontSize: 14,
            lineHeight: 1.6,
            background: "rgba(0,0,0,0.025)",
            padding: "1rem",
            borderRadius: 6,
            marginBottom: "1.5rem",
          }}
        >
          {violation.drafted_letter}
        </pre>

        {canApprove && (
          <form action={handleApprove} style={{ marginBottom: "1rem" }}>
            <input type="hidden" name="board_member_id" value="" />
            <p className="muted">
              By approving, you confirm this notice is accurate, warranted by
              the CC&amp;R provision cited, and compliant with the Fair Housing
              Act. The notice will move to <strong>board_approved</strong> state
              and become eligible for dispatch.
            </p>
            <button type="submit" className="btn">
              Approve Notice
            </button>
          </form>
        )}

        {canSend && (
          <form action={handleSend}>
            <p className="muted">
              This notice has been board-approved. Confirming will mark it as{" "}
              <strong>sent</strong> and dispatch it to the homeowner at{" "}
              {violation.address}.
            </p>
            <button type="submit" className="btn">
              Confirm &amp; Send to Homeowner
            </button>
          </form>
        )}

        {violation.status === "sent" && (
          <p style={{ color: "#166534" }}>
            ✓ This notice has been sent to the homeowner at {violation.address}.
          </p>
        )}

        {violation.status === "draft" && fhApproved === false && (
          <p style={{ color: "#b45309" }}>
            ⚠ Approval is blocked: the draft failed the Fair Housing compliance
            check.{" "}
            <Link href={`/violations/${violation.id}`}>
              Regenerate the draft
            </Link>{" "}
            to resolve the flagged language.
          </p>
        )}

        {violation.status === "draft" && fhApproved === null && (
          <p className="muted">
            Generate an AI draft first before submitting for board review.{" "}
            <Link href={`/violations/${violation.id}`}>
              Go to violation detail
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
