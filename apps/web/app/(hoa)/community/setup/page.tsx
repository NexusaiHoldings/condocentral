/**
 * Community setup wizard — create HOA entity and unit roster (F1-002).
 *
 * Board members land here to initialize their community. Once a community
 * exists the page switches to roster management (unit list + add-unit form).
 * Server component; forms submit via server actions.
 */
import type { JSX } from "react";
import { redirect } from "next/navigation";
import {
  listCommunities,
  listUnits,
  createCommunity,
  createUnit,
  type Community,
  type Unit,
} from "@/lib/hoa/community";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

async function handleCreateCommunity(formData: FormData): Promise<void> {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  const totalUnits = parseInt(String(formData.get("total_units") ?? "0"), 10);
  const fiscalMonth = parseInt(String(formData.get("fiscal_year_start_month") ?? "1"), 10);
  const contactEmail = String(formData.get("contact_email") ?? "").trim() || undefined;
  const contactPhone = String(formData.get("contact_phone") ?? "").trim() || undefined;

  if (!name || !address || !city || !state || !zip || totalUnits < 1) {
    throw new Error("All required fields must be filled in.");
  }

  await createCommunity({
    name,
    address,
    city,
    state: state.toUpperCase().slice(0, 2),
    zip,
    total_units: totalUnits,
    fiscal_year_start_month: fiscalMonth >= 1 && fiscalMonth <= 12 ? fiscalMonth : 1,
    contact_email: contactEmail,
    contact_phone: contactPhone,
  });

  redirect("/community/setup");
}

async function handleAddUnit(formData: FormData): Promise<void> {
  "use server";
  const communityId = String(formData.get("community_id") ?? "").trim();
  const unitNumber = String(formData.get("unit_number") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || undefined;
  const bedroomsRaw = formData.get("bedrooms");
  const bathroomsRaw = formData.get("bathrooms");
  const sqFtRaw = formData.get("square_feet");
  const status = String(formData.get("status") ?? "occupied");

  if (!communityId || !unitNumber) {
    throw new Error("Community ID and unit number are required.");
  }

  await createUnit({
    community_id: communityId,
    unit_number: unitNumber,
    address,
    bedrooms: bedroomsRaw ? parseInt(String(bedroomsRaw), 10) : undefined,
    bathrooms: bathroomsRaw ? parseFloat(String(bathroomsRaw)) : undefined,
    square_feet: sqFtRaw ? parseInt(String(sqFtRaw), 10) : undefined,
    status,
  });

  redirect("/community/setup");
}

function SetupForm(): JSX.Element {
  return (
    <main>
      <h1>Community Setup</h1>
      <p>Enter your HOA details to create your community registry in CondoCentral.</p>

      <form action={handleCreateCommunity}>
        <div className="card">
          <h2>Community Information</h2>

          <label htmlFor="name">Community Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Sunset Ridge HOA"
            autoComplete="organization"
          />

          <label htmlFor="address">Street Address *</label>
          <input
            id="address"
            name="address"
            type="text"
            required
            placeholder="123 Main St"
            autoComplete="street-address"
          />

          <label htmlFor="city">City *</label>
          <input
            id="city"
            name="city"
            type="text"
            required
            placeholder="Phoenix"
            autoComplete="address-level2"
          />

          <label htmlFor="state">State *</label>
          <input
            id="state"
            name="state"
            type="text"
            required
            placeholder="AZ"
            maxLength={2}
            autoComplete="address-level1"
          />

          <label htmlFor="zip">ZIP Code *</label>
          <input
            id="zip"
            name="zip"
            type="text"
            required
            placeholder="85001"
            autoComplete="postal-code"
          />

          <label htmlFor="total_units">Total Units *</label>
          <input
            id="total_units"
            name="total_units"
            type="number"
            required
            min={1}
            placeholder="50"
          />

          <label htmlFor="fiscal_year_start_month">Fiscal Year Start Month</label>
          <select id="fiscal_year_start_month" name="fiscal_year_start_month" defaultValue="1">
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>

          <label htmlFor="contact_email">Board Contact Email</label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            placeholder="board@sunsetridge.org"
            autoComplete="email"
          />

          <label htmlFor="contact_phone">Board Contact Phone</label>
          <input
            id="contact_phone"
            name="contact_phone"
            type="tel"
            placeholder="(555) 000-0000"
            autoComplete="tel"
          />
        </div>

        <button type="submit">Create Community</button>
      </form>
    </main>
  );
}

function UnitRow({ unit }: { unit: Unit }): JSX.Element {
  return (
    <tr>
      <td>{unit.unit_number}</td>
      <td>{unit.address ?? <span className="muted">—</span>}</td>
      <td>{unit.bedrooms != null ? unit.bedrooms : <span className="muted">—</span>}</td>
      <td>{unit.bathrooms != null ? unit.bathrooms : <span className="muted">—</span>}</td>
      <td>{unit.square_feet != null ? unit.square_feet.toLocaleString() : <span className="muted">—</span>}</td>
      <td>{unit.status}</td>
    </tr>
  );
}

function RosterPage({ community, units }: { community: Community; units: Unit[] }): JSX.Element {
  const occupancyPct =
    community.total_units > 0
      ? Math.round((units.length / community.total_units) * 100)
      : 0;

  return (
    <main>
      <h1>{community.name}</h1>
      <p>Unit roster — {units.length} of {community.total_units} units registered ({occupancyPct}% complete).</p>

      <div className="card">
        <h2>Community Details</h2>
        <table>
          <tbody>
            <tr>
              <th>Address</th>
              <td>{community.address}, {community.city}, {community.state} {community.zip}</td>
            </tr>
            <tr>
              <th>Fiscal Year Start</th>
              <td>{MONTHS[(community.fiscal_year_start_month ?? 1) - 1]}</td>
            </tr>
            {community.contact_email && (
              <tr>
                <th>Contact Email</th>
                <td>{community.contact_email}</td>
              </tr>
            )}
            {community.contact_phone && (
              <tr>
                <th>Contact Phone</th>
                <td>{community.contact_phone}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2>Units</h2>

      {units.length === 0 ? (
        <div className="empty">
          No units added yet. Use the form below to start building your roster.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Unit #</th>
              <th>Address</th>
              <th>Beds</th>
              <th>Baths</th>
              <th>Sq Ft</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <UnitRow key={unit.id} unit={unit} />
            ))}
          </tbody>
        </table>
      )}

      <div className="card">
        <h2>Add Unit</h2>
        <form action={handleAddUnit}>
          <input type="hidden" name="community_id" value={community.id} />

          <label htmlFor="unit_number">Unit Number *</label>
          <input
            id="unit_number"
            name="unit_number"
            type="text"
            required
            placeholder="101"
          />

          <label htmlFor="unit_address">Unit Street Address</label>
          <input
            id="unit_address"
            name="address"
            type="text"
            placeholder="123 Main St, Unit 101"
          />

          <label htmlFor="bedrooms">Bedrooms</label>
          <input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min={0}
            placeholder="2"
          />

          <label htmlFor="bathrooms">Bathrooms</label>
          <input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min={0}
            step="0.5"
            placeholder="1.5"
          />

          <label htmlFor="square_feet">Square Feet</label>
          <input
            id="square_feet"
            name="square_feet"
            type="number"
            min={1}
            placeholder="950"
          />

          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue="occupied">
            <option value="occupied">Occupied</option>
            <option value="vacant">Vacant</option>
            <option value="for_sale">For Sale</option>
            <option value="rental">Rental</option>
          </select>

          <button type="submit">Add Unit</button>
        </form>
      </div>
    </main>
  );
}

export default async function CommunitySetupPage(): Promise<JSX.Element> {
  const communities = await listCommunities();
  const community = communities[0] ?? null;

  if (!community) {
    return <SetupForm />;
  }

  const units = await listUnits(community.id);
  return <RosterPage community={community} units={units} />;
}
