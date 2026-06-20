import { buildDb } from "@/lib/db";

export type DocType =
  | "cc_and_rs"
  | "bylaws"
  | "meeting_minutes"
  | "budget_disclosure"
  | "reserve_fund_summary";

export type StatuteCategory =
  | "davis_stirling"
  | "general_hoa"
  | "financial_reporting"
  | "meeting_records"
  | "governing_documents";

export interface HoaDocument {
  id: string;
  community_id: string;
  file_id: string | null;
  doc_type: DocType;
  statute_category: StatuteCategory;
  title: string;
  description: string | null;
  effective_date: string | null;
  uploaded_by: string;
  uploaded_by_email: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  cc_and_rs: "CC&Rs",
  bylaws: "Bylaws",
  meeting_minutes: "Meeting Minutes",
  budget_disclosure: "Budget Disclosure",
  reserve_fund_summary: "Reserve Fund Summary",
};

export const STATUTE_CATEGORY_LABELS: Record<StatuteCategory, string> = {
  davis_stirling: "Davis-Stirling Act",
  general_hoa: "General HOA Law",
  financial_reporting: "Financial Reporting Requirements",
  meeting_records: "Meeting Records Requirements",
  governing_documents: "Governing Document Requirements",
};

export const DOC_TYPES: DocType[] = [
  "cc_and_rs",
  "bylaws",
  "meeting_minutes",
  "budget_disclosure",
  "reserve_fund_summary",
];

export const STATUTE_CATEGORIES: StatuteCategory[] = [
  "davis_stirling",
  "general_hoa",
  "financial_reporting",
  "meeting_records",
  "governing_documents",
];

export function getCommunityId(): string {
  return process.env.HOA_COMMUNITY_ID ?? process.env.COMPANY_NAME ?? "default";
}

export function getDownloadUrl(fileId: string): string {
  return `/api/files/${encodeURIComponent(fileId)}/download`;
}

export async function ensureDocumentsTable(): Promise<void> {
  const db = buildDb();
  await db.query(
    `CREATE TABLE IF NOT EXISTS hoa_documents (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      community_id     TEXT        NOT NULL,
      file_id          TEXT,
      doc_type         TEXT        NOT NULL,
      statute_category TEXT        NOT NULL,
      title            TEXT        NOT NULL,
      description      TEXT,
      effective_date   DATE,
      uploaded_by      TEXT        NOT NULL,
      uploaded_by_email TEXT       NOT NULL,
      filename         TEXT        NOT NULL,
      mime_type        TEXT        NOT NULL DEFAULT 'application/octet-stream',
      size_bytes       BIGINT      NOT NULL DEFAULT 0,
      status           TEXT        NOT NULL DEFAULT 'active',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  );
}

export async function listDocuments(
  communityId: string,
  docType?: string,
  statuteCategory?: string,
): Promise<HoaDocument[]> {
  await ensureDocumentsTable();
  const db = buildDb();
  const params: unknown[] = [communityId];
  const conditions: string[] = ["community_id = $1", "status <> 'deleted'"];

  if (docType) {
    params.push(docType);
    conditions.push(`doc_type = $${params.length}`);
  }
  if (statuteCategory) {
    params.push(statuteCategory);
    conditions.push(`statute_category = $${params.length}`);
  }

  return db.query<HoaDocument>(
    `SELECT id, community_id, file_id, doc_type, statute_category,
            title, description, effective_date, uploaded_by, uploaded_by_email,
            filename, mime_type, size_bytes, status, created_at, updated_at
     FROM hoa_documents
     WHERE ${conditions.join(" AND ")}
     ORDER BY doc_type, created_at DESC`,
    ...params,
  );
}

export async function getDocument(
  docId: string,
  communityId: string,
): Promise<HoaDocument | null> {
  await ensureDocumentsTable();
  const db = buildDb();
  const rows = await db.query<HoaDocument>(
    `SELECT id, community_id, file_id, doc_type, statute_category,
            title, description, effective_date, uploaded_by, uploaded_by_email,
            filename, mime_type, size_bytes, status, created_at, updated_at
     FROM hoa_documents
     WHERE id = $1 AND community_id = $2 AND status <> 'deleted'`,
    docId,
    communityId,
  );
  return rows[0] ?? null;
}

export async function createDocument(data: {
  communityId: string;
  fileId: string | null;
  docType: DocType;
  statuteCategory: StatuteCategory;
  title: string;
  description: string | null;
  effectiveDate: string | null;
  uploadedBy: string;
  uploadedByEmail: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<string> {
  await ensureDocumentsTable();
  const db = buildDb();
  const rows = await db.query<{ id: string }>(
    `INSERT INTO hoa_documents (
       community_id, file_id, doc_type, statute_category, title, description,
       effective_date, uploaded_by, uploaded_by_email, filename, mime_type, size_bytes
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
    data.communityId,
    data.fileId,
    data.docType,
    data.statuteCategory,
    data.title,
    data.description || null,
    data.effectiveDate || null,
    data.uploadedBy,
    data.uploadedByEmail,
    data.filename,
    data.mimeType,
    data.sizeBytes,
  );
  return rows[0].id;
}

export async function archiveDocument(
  docId: string,
  communityId: string,
): Promise<boolean> {
  const db = buildDb();
  const rows = await db.query<{ id: string }>(
    `UPDATE hoa_documents
     SET status = 'archived', updated_at = NOW()
     WHERE id = $1 AND community_id = $2 AND status = 'active'
     RETURNING id`,
    docId,
    communityId,
  );
  return rows.length > 0;
}
