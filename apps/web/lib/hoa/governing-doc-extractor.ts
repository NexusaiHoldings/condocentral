import type { HoaState, ExtractedDocRule } from "./statute-rules-engine";

export type DocumentType = "ccr" | "bylaws" | "rules_and_regulations" | "unknown";

export interface ExtractionResult {
  documentId: string;
  documentType: DocumentType;
  extractedAt: string;
  hoaName?: string;
  state?: HoaState;
  rules: ExtractedDocRule[];
  extractionConfidence: number;
}

interface AnthropicTextBlock {
  type: "text";
  text: string;
}

interface AnthropicResponse {
  content: AnthropicTextBlock[];
}

interface RawExtractedRule {
  ruleType?: unknown;
  description?: unknown;
  value?: unknown;
  periodDays?: unknown;
  applicableParties?: unknown;
  sourceSection?: unknown;
  confidence?: unknown;
}

interface RawExtractionPayload {
  documentType?: unknown;
  hoaName?: unknown;
  state?: unknown;
  rules?: unknown;
}

const EXTRACTION_SYSTEM_PROMPT = `You are a precise HOA compliance analyst. Extract structured compliance rules from HOA governing documents (CC&Rs, bylaws, rules and regulations).

Return ONLY valid JSON with this exact structure — no prose, no markdown fences:
{
  "documentType": "ccr" | "bylaws" | "rules_and_regulations" | "unknown",
  "hoaName": string | null,
  "state": "FL" | "CA" | "TX" | "NV" | null,
  "rules": [
    {
      "ruleType": "notice_period" | "meeting_frequency" | "record_keeping" | "financial" | "election" | "enforcement" | "disclosure",
      "description": string,
      "value": string | null,
      "periodDays": number | null,
      "applicableParties": string[],
      "sourceSection": string | null,
      "confidence": number
    }
  ]
}

Extract every enforceable rule. Be precise with notice periods and convert weeks or months to days. Set confidence 0.9+ only when the rule is explicitly stated with clear, unambiguous parameters. Set confidence 0.5-0.7 for implied or partially stated rules.`;

async function callAnthropicApi(userPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API returned ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  const textBlock = data.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("Anthropic API response contained no text content block");
  }
  return textBlock.text;
}

function parseExtractionResponse(rawJson: string, fallbackDocumentId: string): ExtractionResult {
  // Strip markdown fences if the model wrapped the JSON anyway
  const stripped = rawJson.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();

  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON object found in extraction response: ${rawJson.slice(0, 300)}`);
  }

  let parsed: RawExtractionPayload;
  try {
    parsed = JSON.parse(jsonMatch[0]) as RawExtractionPayload;
  } catch {
    throw new Error(`Failed to parse extraction JSON: ${jsonMatch[0].slice(0, 300)}`);
  }

  const validStates: HoaState[] = ["FL", "CA", "TX", "NV"];
  const detectedState =
    typeof parsed.state === "string" && validStates.includes(parsed.state as HoaState)
      ? (parsed.state as HoaState)
      : undefined;

  const validDocTypes: DocumentType[] = ["ccr", "bylaws", "rules_and_regulations", "unknown"];
  const documentType: DocumentType =
    typeof parsed.documentType === "string" && validDocTypes.includes(parsed.documentType as DocumentType)
      ? (parsed.documentType as DocumentType)
      : "unknown";

  const rawRules = Array.isArray(parsed.rules) ? parsed.rules : [];
  const rules: ExtractedDocRule[] = rawRules
    .filter((r): r is RawExtractedRule => typeof r === "object" && r !== null)
    .map((r) => ({
      ruleType: typeof r.ruleType === "string" ? r.ruleType : "unknown",
      description: typeof r.description === "string" ? r.description : "",
      value: typeof r.value === "string" ? r.value : undefined,
      periodDays: typeof r.periodDays === "number" && isFinite(r.periodDays) ? r.periodDays : undefined,
      applicableParties: Array.isArray(r.applicableParties)
        ? (r.applicableParties as unknown[]).filter((p): p is string => typeof p === "string")
        : [],
      sourceSection: typeof r.sourceSection === "string" ? r.sourceSection : undefined,
      confidence:
        typeof r.confidence === "number" && isFinite(r.confidence)
          ? Math.min(1, Math.max(0, r.confidence))
          : 0.5,
    }));

  const avgConfidence =
    rules.length > 0 ? rules.reduce((sum, r) => sum + r.confidence, 0) / rules.length : 0;

  return {
    documentId: fallbackDocumentId,
    documentType,
    extractedAt: new Date().toISOString(),
    hoaName: typeof parsed.hoaName === "string" && parsed.hoaName.length > 0 ? parsed.hoaName : undefined,
    state: detectedState,
    rules,
    extractionConfidence: avgConfidence,
  };
}

export async function extractRulesFromText(
  text: string,
  documentId: string,
  state?: HoaState,
): Promise<ExtractionResult> {
  if (!text || text.trim().length < 50) {
    throw new Error("Document text is too short to extract meaningful compliance rules");
  }

  const stateContext = state ? ` This document is for an HOA in ${state}.` : "";
  const truncatedText = text.slice(0, 14000); // Stay within Anthropic token budget
  const prompt = `Extract all compliance rules from this HOA governing document.${stateContext}

DOCUMENT TEXT:
${truncatedText}`;

  const rawJson = await callAnthropicApi(prompt);
  return parseExtractionResponse(rawJson, documentId);
}

export async function extractRulesFromFileContent(
  fileId: string,
  fileContent: string,
  mimeType: string,
  state?: HoaState,
): Promise<ExtractionResult> {
  if (fileContent.trim().length < 50) {
    throw new Error(
      `File ${fileId} (${mimeType}) has insufficient text content for compliance extraction`,
    );
  }
  return extractRulesFromText(fileContent, fileId, state);
}

export async function batchExtractRules(
  documents: Array<{
    fileId: string;
    content: string;
    mimeType: string;
    state?: HoaState;
  }>,
): Promise<ExtractionResult[]> {
  const results: ExtractionResult[] = [];
  for (const doc of documents) {
    const result = await extractRulesFromFileContent(doc.fileId, doc.content, doc.mimeType, doc.state);
    results.push(result);
  }
  return results;
}

export function mergeExtractionResults(results: ExtractionResult[]): ExtractionResult {
  if (results.length === 0) {
    throw new Error("Cannot merge empty extraction results array");
  }
  if (results.length === 1) {
    return results[0];
  }

  const primary = results[0];
  const allRules: ExtractedDocRule[] = results.flatMap((r) => r.rules);

  // Deduplicate rules by combining those with identical ruleType and similar description
  const deduped: ExtractedDocRule[] = [];
  for (const rule of allRules) {
    const duplicate = deduped.find(
      (d) =>
        d.ruleType === rule.ruleType &&
        d.description.toLowerCase().slice(0, 60) === rule.description.toLowerCase().slice(0, 60),
    );
    if (!duplicate) {
      deduped.push(rule);
    } else if (rule.confidence > duplicate.confidence) {
      const idx = deduped.indexOf(duplicate);
      deduped[idx] = rule;
    }
  }

  const avgConfidence =
    deduped.length > 0 ? deduped.reduce((sum, r) => sum + r.confidence, 0) / deduped.length : 0;

  return {
    documentId: results.map((r) => r.documentId).join("+"),
    documentType: primary.documentType,
    extractedAt: new Date().toISOString(),
    hoaName: primary.hoaName,
    state: primary.state,
    rules: deduped,
    extractionConfidence: avgConfidence,
  };
}
