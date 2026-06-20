import Link from "next/link";
import { notFound } from "next/navigation";
import { getStatuteById, STATE_NAMES, CATEGORY_LABELS } from "@/lib/hoa/statute-rules-engine";

interface PageProps {
  params: { ruleId: string };
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  notice_period: "Defines the minimum advance notice required before taking an action or holding a meeting.",
  disclosure: "Specifies information that must be proactively disclosed to members, purchasers, or the public.",
  meeting_frequency: "Establishes how often meetings must be held and quorum requirements.",
  record_keeping: "Sets timelines and conditions for member access to association records.",
  financial: "Governs financial planning, reporting, reserve funding, and budget processes.",
  election: "Defines election procedures, notice periods, and inspector requirements.",
  enforcement: "Outlines required procedures before imposing fines, liens, or other enforcement actions.",
};

export default function RuleDetailPage({ params }: PageProps) {
  const ruleId = decodeURIComponent(params.ruleId);
  const rule = getStatuteById(ruleId);

  if (!rule) {
    notFound();
  }

  const categoryDescription = CATEGORY_DESCRIPTIONS[rule.category] ?? "";

  return (
    <main>
      <p>
        <Link href="/compliance">← Back to Compliance Dashboard</Link>
        {" · "}
        <Link href={`/compliance?state=${rule.state}`}>{STATE_NAMES[rule.state]} Requirements</Link>
      </p>

      <h1>{rule.title}</h1>
      <p>
        {CATEGORY_LABELS[rule.category]} requirement under {STATE_NAMES[rule.state]} law — {rule.code}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Statutory Citation</h3>
          <p style={{ fontFamily: "monospace", fontWeight: 600 }}>{rule.code}</p>
          <p className="muted" style={{ fontSize: 13 }}>
            Effective {rule.effectiveDate} · {STATE_NAMES[rule.state]}
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Category</h3>
          <p style={{ fontWeight: 600 }}>{CATEGORY_LABELS[rule.category]}</p>
          <p className="muted" style={{ fontSize: 13 }}>
            {categoryDescription}
          </p>
        </div>

        {rule.noticePeriodDays !== undefined && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Required Notice Period</h3>
            <p style={{ fontSize: 28, fontWeight: 700, margin: "0.25rem 0" }}>
              {rule.noticePeriodDays} days
            </p>
            <p className="muted" style={{ fontSize: 13 }}>
              Minimum advance notice required by statute
            </p>
          </div>
        )}

        {rule.meetingFrequencyPerYear !== undefined && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Meeting Frequency</h3>
            <p style={{ fontSize: 28, fontWeight: 700, margin: "0.25rem 0" }}>
              {rule.meetingFrequencyPerYear}× per year
            </p>
            <p className="muted" style={{ fontSize: 13 }}>
              Minimum annual meeting requirement
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>What this statute requires</h2>
        <p>{rule.description}</p>
        <p>
          <strong>Specific requirement:</strong> {rule.requirement}
        </p>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Penalty for Non-Compliance</h2>
        <p style={{ color: "#991b1b" }}>{rule.penaltyForNonCompliance}</p>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>How to Verify Compliance</h2>
        <ul>
          <li>Review your CC&amp;Rs and bylaws for a provision explicitly addressing this requirement.</li>
          {rule.noticePeriodDays !== undefined && (
            <li>
              Confirm the governing documents specify a notice period of at least{" "}
              <strong>{rule.noticePeriodDays} days</strong> (not fewer).
            </li>
          )}
          {rule.meetingFrequencyPerYear !== undefined && (
            <li>
              Confirm the governing documents require at least{" "}
              <strong>{rule.meetingFrequencyPerYear} meeting{rule.meetingFrequencyPerYear > 1 ? "s" : ""} per year</strong>.
            </li>
          )}
          <li>
            Upload your governing documents on the{" "}
            <Link href={`/compliance/upload?state=${rule.state}`}>documents page</Link> to get an
            automated gap analysis against all {STATE_NAMES[rule.state]} requirements.
          </li>
        </ul>
      </div>

      <p style={{ marginTop: "2rem" }}>
        <Link href={`/compliance?state=${rule.state}`} className="btn secondary">
          View All {STATE_NAMES[rule.state]} Requirements
        </Link>
      </p>
    </main>
  );
}
