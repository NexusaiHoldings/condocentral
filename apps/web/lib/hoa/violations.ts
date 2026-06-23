/**
 * Violation notice workflow — server-side logic.
 *
 * State machine: draft → board_approved → sent (no bypass).
 * Per ceo_briefing / liability_assessor: all enforcement mutations are
 * human-review gated.  approveViolation() enforces fair_housing_approved = true
 * as a hard precondition; sendViolationNotice() enforces status = board_approved.
 *
 * AI draft generation calls Anthropic (claude-sonnet-4-6) directly via fetch —
 * no openai SDK (banned).  Output is run through runFairHousingFilter before
 * being written back to the DB; the filter result is stored alongside the letter
 * so the review UI can surface it to the board without recomputing.
 */

import { buildDb } from "@/lib/db";
import {
  runFairHousingFilter,
  type FairHousingFilterResult,
} from "./fair-housing-filter";

export type ViolationStatus = "draft" | "board_approved" | "sent";

/**
 * Resolve the active community id, consistent with the rest of the HOA app
 * (finances/dues, portal, announcements). Prefers HOA_COMMUNITY_ID; falls back
 * to the legacy COMMUNITY_ID, then the default-community uuid. Always returns a
 * valid uuid so `community_id = $1` never throws on an empty/invalid value.
 */
export function resolveCommunityId(): string {
  return (
    process.env.HOA_COMMUNITY_ID ||
    process.env.COMMUNITY_ID ||
    "00000000-0000-0000-0000-000000000001"
  );
}

export interface Violation {
  id: string;
  community_id: string;
  homeowner_id: string;
  address: string;
  violation_type: string;
  description: string;
  ccr_section: string;
  reported_by: string;
  status: ViolationStatus;
  drafted_letter: string | null;
  fair_housing_approved: boolean | null;
  fair_housing_flags: string[] | null;
  fair_housing_risk: string | null;
  fair_housing_reasoning: string | null;
  board_approver_id: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateViolationInput {
  community_id: string;
  homeowner_id: string;
  address: string;
  violation_type: string;
  description: string;
  ccr_section: string;
  reported_by: string;
}

export interface ViolationDraftResult {
  violation: Violation;
  filterResult: FairHousingFilterResult;
}

async function callAnthropicForDraft(opts: {
  address: string;
  violationType: string;
  description: string;
  ccrSection: string;
  communityName: string;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not configured");
  }

  const prompt = `You are a property management assistant helping an HOA board draft a formal, legally compliant violation notice letter.

Community: ${opts.communityName}
Property Address: ${opts.address}
Violation Type: ${opts.violationType}
CC&R Section Violated: ${opts.ccrSection}
Description: ${opts.description}

Requirements for this letter:
- Reference ONLY the specific CC&R provision cited above (section ${opts.ccrSection})
- Focus exclusively on the property condition or behavior that violates the CC&Rs
- Do NOT reference any personal characteristics of the homeowner (race, color, national origin, religion, sex, familial status, disability, or any other characteristic)
- Use a professional, neutral, factual tone throughout
- Include a 14-day compliance deadline from the date of notice
- State that failure to comply may result in the board arranging correction at the owner's expense plus administrative fees
- Include a contact line for questions (HOA management office)
- Keep the letter to 3–4 paragraphs

Return ONLY the letter text. Do not add commentary or formatting instructions.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API returned ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const textBlock = data.content.find((block) => block.type === "text");
  if (!textBlock?.text) {
    throw new Error("Anthropic API response contained no text content");
  }

  return textBlock.text;
}

export async function listViolations(
  communityId: string,
  status?: ViolationStatus,
): Promise<Violation[]> {
  if (!communityId) return [];
  const db = buildDb();
  if (status) {
    return db.query<Violation>(
      `SELECT * FROM hoa_violations
       WHERE community_id = $1 AND status = $2
       ORDER BY created_at DESC`,
      communityId,
      status,
    );
  }
  return db.query<Violation>(
    `SELECT * FROM hoa_violations
     WHERE community_id = $1
     ORDER BY created_at DESC`,
    communityId,
  );
}

export async function getViolation(
  violationId: string,
  communityId: string,
): Promise<Violation | null> {
  const db = buildDb();
  const rows = await db.query<Violation>(
    `SELECT * FROM hoa_violations
     WHERE id = $1 AND community_id = $2`,
    violationId,
    communityId,
  );
  return rows[0] ?? null;
}

export async function createViolation(
  input: CreateViolationInput,
): Promise<Violation> {
  const db = buildDb();
  const rows = await db.query<Violation>(
    `INSERT INTO hoa_violations (
       id, community_id, homeowner_id, address, violation_type,
       description, ccr_section, reported_by, status,
       created_at, updated_at
     ) VALUES (
       gen_random_uuid(), $1, $2, $3, $4,
       $5, $6, $7, 'draft',
       NOW(), NOW()
     ) RETURNING *`,
    input.community_id,
    input.homeowner_id,
    input.address,
    input.violation_type,
    input.description,
    input.ccr_section,
    input.reported_by,
  );
  const row = rows[0];
  if (!row) throw new Error("Failed to create violation record");
  return row;
}

export async function generateViolationDraft(
  violationId: string,
  communityId: string,
): Promise<ViolationDraftResult> {
  const violation = await getViolation(violationId, communityId);
  if (!violation) {
    throw new Error(`Violation ${violationId} not found in community ${communityId}`);
  }
  if (violation.status !== "draft") {
    throw new Error(
      `Cannot regenerate draft for violation with status "${violation.status}" — only draft violations can be regenerated`,
    );
  }

  const communityName =
    process.env.COMMUNITY_NAME ?? process.env.COMPANY_NAME ?? "Homeowners Association";

  const letter = await callAnthropicForDraft({
    address: violation.address,
    violationType: violation.violation_type,
    description: violation.description,
    ccrSection: violation.ccr_section,
    communityName,
  });

  const filterResult = runFairHousingFilter(letter);

  const db = buildDb();
  const rows = await db.query<Violation>(
    `UPDATE hoa_violations SET
       drafted_letter         = $1,
       fair_housing_approved  = $2,
       fair_housing_flags     = $3,
       fair_housing_risk      = $4,
       fair_housing_reasoning = $5,
       updated_at             = NOW()
     WHERE id = $6 AND community_id = $7
     RETURNING *`,
    letter,
    filterResult.approved,
    filterResult.flaggedTerms,
    filterResult.riskLevel,
    filterResult.reasoning,
    violationId,
    communityId,
  );

  const updated = rows[0];
  if (!updated) throw new Error("Failed to persist drafted letter to database");
  return { violation: updated, filterResult };
}

export async function approveViolation(
  violationId: string,
  boardApproverId: string,
  communityId: string,
): Promise<Violation> {
  const violation = await getViolation(violationId, communityId);
  if (!violation) throw new Error(`Violation ${violationId} not found`);

  if (violation.status !== "draft") {
    throw new Error(
      `Cannot approve violation in "${violation.status}" state — violation must be in draft state`,
    );
  }
  if (!violation.drafted_letter) {
    throw new Error("Cannot approve violation: no drafted letter exists yet");
  }
  if (!violation.fair_housing_approved) {
    throw new Error(
      "Cannot approve violation: the drafted letter failed the fair housing compliance check — resolve flagged language and regenerate before approving",
    );
  }

  const db = buildDb();
  const rows = await db.query<Violation>(
    `UPDATE hoa_violations SET
       status            = 'board_approved',
       board_approver_id = $1,
       approved_at       = NOW(),
       updated_at        = NOW()
     WHERE id = $2 AND community_id = $3 AND status = 'draft'
     RETURNING *`,
    boardApproverId,
    violationId,
    communityId,
  );

  const updated = rows[0];
  if (!updated) {
    throw new Error(
      "Violation was not updated — it may have been modified concurrently",
    );
  }
  return updated;
}

export async function sendViolationNotice(
  violationId: string,
  communityId: string,
): Promise<Violation> {
  const violation = await getViolation(violationId, communityId);
  if (!violation) throw new Error(`Violation ${violationId} not found`);

  if (violation.status !== "board_approved") {
    throw new Error(
      `Cannot send notice in "${violation.status}" state — violation must be board_approved before it can be dispatched`,
    );
  }

  const db = buildDb();
  const rows = await db.query<Violation>(
    `UPDATE hoa_violations SET
       status     = 'sent',
       sent_at    = NOW(),
       updated_at = NOW()
     WHERE id = $1 AND community_id = $2 AND status = 'board_approved'
     RETURNING *`,
    violationId,
    communityId,
  );

  const updated = rows[0];
  if (!updated) {
    throw new Error(
      "Violation was not updated — it may have been modified concurrently",
    );
  }
  return updated;
}
