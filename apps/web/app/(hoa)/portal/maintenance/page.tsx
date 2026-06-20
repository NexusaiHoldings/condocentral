/**
 * /portal/maintenance — Submit Maintenance Request (F1-006).
 *
 * Resident-facing form. On submission a server action creates the request,
 * emits hoa.maintenance_request_created, and redirects back to the portal.
 */
import type { JSX } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/admin-auth";
import { createMaintenanceRequest } from "@/lib/hoa/maintenance";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function communityId(): string {
  return process.env.HOA_COMMUNITY_ID ?? "default";
}

export default async function MaintenanceSubmitPage(): Promise<JSX.Element> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  async function submitRequest(formData: FormData): Promise<void> {
    "use server";

    const unitNumber = String(formData.get("unit_number") ?? "").trim();
    const residentName = String(formData.get("resident_name") ?? "").trim();
    const category = String(formData.get("category") ?? "other").trim();
    const description = String(formData.get("description") ?? "").trim();
    const priority = String(formData.get("priority") ?? "normal").trim();
    const email = String(formData.get("resident_email") ?? "").trim();

    if (!unitNumber || !residentName || !description || !email) {
      redirect("/portal/maintenance?error=missing_fields");
    }

    await createMaintenanceRequest({
      community_id: process.env.HOA_COMMUNITY_ID ?? "default",
      unit_number: unitNumber,
      resident_name: residentName,
      resident_email: email,
      category: category as Parameters<typeof createMaintenanceRequest>[0]["category"],
      description,
      priority: priority as Parameters<typeof createMaintenanceRequest>[0]["priority"],
    });

    redirect("/portal?submitted=1");
  }

  return (
    <main>
      <h1>Submit Maintenance Request</h1>
      <p>
        Describe the issue in your unit and our team will schedule a repair.
        You can track the status on your{" "}
        <Link href="/portal">Resident Portal</Link>.
      </p>

      <form action={submitRequest} style={{ maxWidth: "560px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <div>
            <label htmlFor="resident_name" style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
              Full Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="resident_name"
              name="resident_name"
              type="text"
              required
              defaultValue={user.email.split("@")[0]}
              placeholder="Jane Smith"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label htmlFor="resident_email" style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
              Email Address <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="resident_email"
              name="resident_email"
              type="email"
              required
              defaultValue={user.email}
              placeholder="jane@example.com"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label htmlFor="unit_number" style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
              Unit / Address <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="unit_number"
              name="unit_number"
              type="text"
              required
              placeholder="e.g. 4B or 102 Oak Lane"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label htmlFor="category" style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
              Category
            </label>
            <select
              id="category"
              name="category"
              style={{ width: "100%", boxSizing: "border-box" }}
            >
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="hvac">HVAC / Heating &amp; Cooling</option>
              <option value="landscaping">Landscaping</option>
              <option value="structural">Structural</option>
              <option value="appliance">Appliance</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="normal"
              style={{ width: "100%", boxSizing: "border-box" }}
            >
              <option value="low">Low — not urgent</option>
              <option value="normal">Normal</option>
              <option value="high">High — affects daily living</option>
              <option value="urgent">Urgent — safety or flooding risk</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
              Description <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              required
              placeholder="Please describe the issue in detail — location, when it started, any relevant photos you can share…"
              style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <button type="submit">Submit Request</button>
            <Link href="/portal" className="btn secondary">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}
