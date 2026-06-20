import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import {
  initDuesTables,
  getDuesInvoice,
  formatCurrency,
} from "@/lib/hoa/dues-engine";
import type { DuesInvoice } from "@/lib/hoa/dues-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireSession(): Promise<void> {
  const jar = await cookies();
  if (!jar.get("session-token")) {
    redirect("/auth/login");
  }
}

interface PageProps {
  params: Promise<{ invoiceId: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  await requireSession();
  await initDuesTables();

  const { invoiceId } = await params;
  const invoice: DuesInvoice | null = await getDuesInvoice(invoiceId);
  if (!invoice) notFound();

  return (
    <main>
      <p>
        <a href="/finances/dues" className="muted">
          ← Back to Dues &amp; Invoicing
        </a>
      </p>

      <h1>Invoice Detail</h1>
      <p>
        Review payment status, due date, and aging for this dues invoice.
      </p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>
          Unit {invoice.unit_number} — {formatCurrency(invoice.amount_cents)}
        </h2>

        <dl style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.4rem 1rem" }}>
          <dt className="muted">Status</dt>
          <dd>
            <StatusBadge status={invoice.status} />
          </dd>

          <dt className="muted">Homeowner</dt>
          <dd>{invoice.homeowner_name}</dd>

          <dt className="muted">Email</dt>
          <dd>{invoice.homeowner_email}</dd>

          <dt className="muted">Billing Period</dt>
          <dd>
            {invoice.period_start} – {invoice.period_end}
          </dd>

          <dt className="muted">Due Date</dt>
          <dd>{invoice.due_date}</dd>

          <dt className="muted">Amount</dt>
          <dd>{formatCurrency(invoice.amount_cents)}</dd>

          {invoice.paid_at && (
            <>
              <dt className="muted">Paid At</dt>
              <dd>{new Date(invoice.paid_at).toLocaleString()}</dd>
            </>
          )}

          {invoice.stripe_payment_intent_id && (
            <>
              <dt className="muted">Stripe Payment Intent</dt>
              <dd>
                <code style={{ fontSize: "0.85em" }}>
                  {invoice.stripe_payment_intent_id}
                </code>
              </dd>
            </>
          )}

          <dt className="muted">Aging</dt>
          <dd>
            <AgingDetail
              bucket={invoice.aging_bucket}
              days={invoice.days_overdue}
            />
          </dd>

          <dt className="muted">Invoice ID</dt>
          <dd>
            <code style={{ fontSize: "0.85em" }}>{invoice.id}</code>
          </dd>

          <dt className="muted">Created</dt>
          <dd>{new Date(invoice.created_at).toLocaleString()}</dd>
        </dl>
      </div>

      {invoice.status !== "paid" && invoice.status !== "cancelled" && (
        <div
          className="card"
          style={{ marginTop: "1.5rem", borderColor: "#d97706" }}
        >
          <h3 style={{ marginTop: 0 }}>Outstanding Balance</h3>
          {invoice.stripe_payment_url ? (
            <>
              <p>
                A payment link has been generated for this invoice. Share it
                with the homeowner to collect payment online via ACH or card.
              </p>
              <a
                href={invoice.stripe_payment_url}
                className="btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Payment Link
              </a>
            </>
          ) : (
            <p className="muted">
              No payment link has been generated yet. Payment can be collected
              offline or via the billing portal.
            </p>
          )}
        </div>
      )}

      {invoice.status === "paid" && (
        <div
          className="card"
          style={{ marginTop: "1.5rem", borderColor: "#16a34a" }}
        >
          <h3 style={{ marginTop: 0, color: "#16a34a" }}>Payment Received</h3>
          <p>
            This invoice was paid on{" "}
            {invoice.paid_at
              ? new Date(invoice.paid_at).toLocaleDateString()
              : "record"}
            . Thank you!
          </p>
        </div>
      )}
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
        fontWeight: 700,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

function AgingDetail({
  bucket,
  days,
}: {
  bucket: string;
  days: number;
}) {
  if (bucket === "current") {
    return <span className="muted">Current (not overdue)</span>;
  }
  const dangerColors: Record<string, string> = {
    "1-30": "#d97706",
    "31-60": "#ea580c",
    "61-90": "#dc2626",
    "90+": "#7f1d1d",
  };
  return (
    <span style={{ color: dangerColors[bucket] ?? "#dc2626", fontWeight: 600 }}>
      {days} days overdue (bucket: {bucket})
    </span>
  );
}
