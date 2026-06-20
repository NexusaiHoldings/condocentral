import Link from "next/link";
import {
  generateComplianceReport,
  VALID_STATES,
  STATE_NAMES,
  CATEGORY_LABELS,
} from "@/lib/hoa/statute-rules-engine";
import type { HoaState, ComplianceStatus } from "@/lib/hoa/statute-rules-engine";

interface PageProps {
  searchParams: { state?: string };
}

function statusLabel(status: ComplianceStatus): string {
  switch (status) {
    case "compliant":
      return "Compliant";
    case "non_compliant":
      return "Non-Compliant";
    case "not_addressed":
      return "Not Addressed";
    case "pending_review":
      return "Pending Review";
  }
}

function statusStyle(status: ComplianceStatus): React.CSSProperties {
  switch (status) {
    case "compliant":
      return { color: "#166534", background: "#dcfce7", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" };
    case "non_compliant":
      return { color: "#991b1b", background: "#fee2e2", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" };
    case "not_addressed":
      return { color: "#92400e", background: "#fef3c7", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" };
    case "pending_review":
      return { color: "#1e40af", background: "#dbeafe", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" };
  }
}

export default function CompliancePage({ searchParams }: PageProps) {
  const selectedState: HoaState = VALID_STATES.includes(searchParams.state as HoaState)
    ? (searchParams.state as HoaState)
    : "FL";

  const report = generateComplianceReport(selectedState);
  const { summary, items } = report;

  const compliancePct =
    summary.total > 0 ? Math.round((summary.compliant / summary.total) * 100) : 0;

  return (
    <main>
      <h1>HOA Compliance Dashboard</h1>
      <p>
        Monitor your community&apos;s compliance with state HOA statutes for{" "}
        <strong>{STATE_NAMES[selectedState]}</strong>. Upload your CC&amp;Rs and bylaws to receive
        a personalized gap analysis against {summary.total} statutory requirements.
      </p>

      <form method="GET" style={{ marginBottom: "1.5rem" }}>
        <div className="toolbar">
          <label htmlFor="state-select">State</label>
          <select id="state-select" name="state" defaultValue={selectedState}>
            {VALID_STATES.map((s) => (
              <option key={s} value={s}>
                {STATE_NAMES[s]}
              </option>
            ))}
          </select>
          <button type="submit">Apply</button>
          <Link href={`/compliance/upload?state=${selectedState}`} className="btn secondary">
            Upload Governing Documents
          </Link>
        </div>
      </form>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{compliancePct}%</div>
          <div className="muted">Overall Compliance</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#166534" }}>{summary.compliant}</div>
          <div className="muted">Compliant</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#991b1b" }}>{summary.nonCompliant}</div>
          <div className="muted">Non-Compliant</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#92400e" }}>{summary.notAddressed}</div>
          <div className="muted">Not Addressed</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{summary.total}</div>
          <div className="muted">Total Requirements</div>
        </div>
      </div>

      {summary.notAddressed === summary.total && (
        <div className="empty">
          <strong>No governing documents analyzed yet.</strong>
          <p>
            Upload your CC&amp;Rs, bylaws, or rules &amp; regulations to generate a compliance
            analysis. The engine will map your document provisions to {summary.total}{" "}
            {STATE_NAMES[selectedState]} statutory requirements and identify gaps.
          </p>
          <Link href={`/compliance/upload?state=${selectedState}`} className="btn">
            Upload Documents
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Statute</th>
              <th>Requirement</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.rule.id}>
                <td>
                  <Link href={`/compliance/${encodeURIComponent(item.rule.id)}`}>
                    <strong>{item.rule.code}</strong>
                  </Link>
                  <br />
                  <span className="muted" style={{ fontSize: 12 }}>
                    {item.rule.title}
                  </span>
                </td>
                <td style={{ maxWidth: 280, fontSize: 13 }}>{item.rule.requirement}</td>
                <td>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {CATEGORY_LABELS[item.rule.category]}
                  </span>
                </td>
                <td>
                  <span style={statusStyle(item.status)}>{statusLabel(item.status)}</span>
                </td>
                <td>
                  <Link
                    href={`/compliance/${encodeURIComponent(item.rule.id)}`}
                    className="btn secondary"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
