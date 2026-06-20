import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  initDuesTables,
  listDuesInvoices,
  getDelinquencySummary,
  formatCurrency,
} from "@/lib/hoa/dues-engine";
import type { DuesInvoice, DelinquencySummary } from "@/lib/hoa/dues-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireSession(): Promise<void> {
  const jar = await cookies();
  if (!jar.get("session-token")) {
    redirect("/auth/login");
  }
}

async function getData(
  status?: string
): Promise<{ invoices: DuesInvoice[]; summary: DelinquencySummary }> {
  await initDuesTables();
  const communityId = process.env.HOA_COMMUNITY_ID ?? "00000000-0000-0000-0000-000000000001";
  const [invoices, summary] = await Promise.all([
    listDuesInvoices(communityId, status),
    getDelinquencySummary(communityId),
  ]);
  return { invoices, summary };
}

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function DuesPage({ searchParams }: PageProps) {
  await requireSession();
  const { status } = await searchParams;
  const { invoices, summary } = await getData(status);

  return (
    <main>
      <h1>Dues &amp; Invoicing</h1>
      <p>
        Manage recurring homeowner dues, track payments, and monitor delinquency
        aging across 30, 60, and 90-day buckets.
      </p>

      <section>
        <h2>Delinquency Summary</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div className="card" style={{ minWidth: "160px" }}>
            <p className="muted">Current / Pending</p>
            <strong>{summary.current_count}</strong>
          </div>
          <div className="card" style={{ minWidth: "160px" }}>
            <p className="muted">1–30 Days Overdue</p>
            <strong>{summary.bucket_30_count}</strong>
          </div>
          <div className="card" style={{ minWidth: "160px" }}>
            <p className="muted">31–60 Days Overdue</p>
            <strong>{summary.bucket_60_count}</strong>
          </div>
          <div className="card" style={{ minWidth: "160px" }}>
            <p className="muted">61–90 Days Overdue</p>
            <strong>{summary.bucket_90_count}</strong>
          </div>
          <div className="card" style={{ minWidth: "160px" }}>
            <p className="muted">90+ Days Overdue</p>
            <strong>{summary.bucket_over_90_count}</strong>
          </div>
          <div className="card" style={{ minWidth: "160px" }}>
            <p className="muted">Total Overdue</p>
            <strong>{formatCurrency(summary.total_overdue_cents)}</strong>
          </div>
        </div>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Invoices</h2>
        <form method="GET" className="toolbar">
          <label htmlFor="status-filter">Filter by status</label>
          <select id="status-filter" name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="submit">Search</button>
        </form>

        {invoices.length === 0 ? (
          <div className="empty">
            <p>No invoices found{status ? ` with status "${status}"` : ""}.</p>
            <p className="muted">
              Invoices are generated automatically by the dues cycle cron job.
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Unit</th>
                <th>Homeowner</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Aging</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: DuesInvoice) => (
                <tr key={inv.id}>
                  <td>{inv.unit_number}</td>
                  <td>
                    <div>{inv.homeowner_name}</div>
                    <div className="muted" style={{ fontSize: "0.85em" }}>
                      {inv.homeowner_email}
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: "0.85em" }}>
                    {inv.period_start} – {inv.period_end}
                  </td>
                  <td>{formatCurrency(inv.amount_cents)}</td>
                  <td>{inv.due_date}</td>
                  <td>
                    <StatusBadge status={inv.status} />
                  </td>
                  <td>
                    <AgingLabel bucket={inv.aging_bucket} days={inv.days_overdue} />
                  </td>
                  <td>
                    <a
                      href={`/finances/dues/${inv.id}`}
                      className="btn secondary"
                    >
                      View
                    </a>
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "#d97706",
    overdue: "#dc2626",
    paid: "#16a34a",
    cancelled: "#6b7280",
  };
  return (
    <span
      style={{
        color: colors[status] ?? "#374151",
        fontWeight: 600,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

function AgingLabel({
  bucket,
  days,
}: {
  bucket: string;
  days: number;
}) {
  if (bucket === "current") {
    return <span className="muted">—</span>;
  }
  const dangerColors: Record<string, string> = {
    "1-30": "#d97706",
    "31-60": "#ea580c",
    "61-90": "#dc2626",
    "90+": "#7f1d1d",
  };
  return (
    <span style={{ color: dangerColors[bucket] ?? "#dc2626", fontWeight: 600 }}>
      {days}d ({bucket})
    </span>
  );
}
