import type { JSX } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { handleRegisterFile } from "@nexus/files-and-media";
import { getSessionUser } from "@/lib/admin-auth";
import { buildDb } from "@/lib/db";
import { buildEventBus } from "@/lib/events";
import {
  listDocuments,
  createDocument,
  getCommunityId,
  DOC_TYPES,
  DOC_TYPE_LABELS,
  STATUTE_CATEGORIES,
  STATUTE_CATEGORY_LABELS,
  getDownloadUrl,
  type DocType,
  type StatuteCategory,
} from "@/lib/hoa/document-vault";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function uploadDocumentAction(formData: FormData): Promise<void> {
  "use server";
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const file = formData.get("document") as File | null;
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const docType = formData.get("doc_type") as DocType | null;
  const statuteCategory = formData.get("statute_category") as StatuteCategory | null;
  const description = (formData.get("description") as string | null)?.trim() || null;
  const effectiveDate = (formData.get("effective_date") as string | null) || null;

  if (!file || file.size === 0 || !title || !docType || !statuteCategory) {
    redirect("/documents?error=missing_fields");
  }

  const db = buildDb();
  const events = buildEventBus();

  await db.query(
    `CREATE TABLE IF NOT EXISTS file_blobs (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      data       BYTEA       NOT NULL,
      filename   TEXT        NOT NULL,
      mime_type  TEXT        NOT NULL DEFAULT 'application/octet-stream',
      size_bytes BIGINT      NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  );

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mimeType = file.type || "application/octet-stream";

  const blobRows = await db.query<{ id: string }>(
    `INSERT INTO file_blobs (data, filename, mime_type, size_bytes) VALUES ($1, $2, $3, $4) RETURNING id`,
    buffer,
    file.name,
    mimeType,
    file.size,
  );
  const storageKey = blobRows[0].id;

  const fileResult = await handleRegisterFile(
    { db, events },
    {
      user_id: user.id,
      filename: file.name,
      mime_type: mimeType,
      size_bytes: file.size,
      storage_key: storageKey,
    },
  );

  const fileId =
    fileResult.status === 201 &&
    typeof fileResult.body === "object" &&
    fileResult.body !== null &&
    "file_id" in fileResult.body
      ? (fileResult.body as { file_id: string }).file_id
      : null;

  const docId = await createDocument({
    communityId: getCommunityId(),
    fileId,
    docType,
    statuteCategory,
    title,
    description,
    effectiveDate,
    uploadedBy: user.id,
    uploadedByEmail: user.email,
    filename: file.name,
    mimeType,
    sizeBytes: file.size,
  });

  redirect(`/documents/${docId}`);
}

async function archiveDocumentAction(formData: FormData): Promise<void> {
  "use server";
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { archiveDocument } = await import("@/lib/hoa/document-vault");
  const docId = formData.get("doc_id") as string | null;
  if (docId) {
    await archiveDocument(docId, getCommunityId());
  }
  revalidatePath("/documents");
}

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<JSX.Element> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const communityId = getCommunityId();
  const filterType = searchParams.doc_type as string | undefined;
  const filterCategory = searchParams.statute_category as string | undefined;
  const hasError = searchParams.error === "missing_fields";

  const docs = await listDocuments(communityId, filterType, filterCategory);

  return (
    <main>
      <h1>Governing Document Vault</h1>
      <p>
        Legally required HOA records — CC&amp;Rs, bylaws, meeting minutes, budget
        disclosures, and reserve fund summaries — stored securely and always accessible
        to board members and homeowners.
      </p>

      <details>
        <summary className="btn secondary" style={{ display: "inline-block", marginBottom: "1rem", cursor: "pointer" }}>
          + Upload Document
        </summary>
        <div className="card" style={{ marginTop: "0.5rem" }}>
          {hasError && (
            <p style={{ color: "var(--color-error, #c00)", marginBottom: "1rem" }}>
              Please fill in all required fields and select a file before uploading.
            </p>
          )}
          <form action={uploadDocumentAction} encType="multipart/form-data">
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <label>
                <span>Title *</span>
                <input type="text" name="title" required placeholder="e.g. Amended CC&Rs 2024" />
              </label>
              <label>
                <span>Document File *</span>
                <input type="file" name="document" required accept=".pdf,.doc,.docx,.txt" />
              </label>
              <label>
                <span>Document Type *</span>
                <select name="doc_type" required>
                  <option value="">— Select type —</option>
                  {DOC_TYPES.map((dt) => (
                    <option key={dt} value={dt}>
                      {DOC_TYPE_LABELS[dt]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>State Statute Category *</span>
                <select name="statute_category" required>
                  <option value="">— Select category —</option>
                  {STATUTE_CATEGORIES.map((sc) => (
                    <option key={sc} value={sc}>
                      {STATUTE_CATEGORY_LABELS[sc]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Effective Date</span>
                <input type="date" name="effective_date" />
              </label>
              <label>
                <span>Description</span>
                <textarea name="description" rows={3} placeholder="Optional notes about this document" />
              </label>
              <button type="submit">Upload Document</button>
            </div>
          </form>
        </div>
      </details>

      <div className="toolbar">
        <form method="GET" action="/documents">
          <select name="doc_type" defaultValue={filterType ?? ""}>
            <option value="">All Types</option>
            {DOC_TYPES.map((dt) => (
              <option key={dt} value={dt}>
                {DOC_TYPE_LABELS[dt]}
              </option>
            ))}
          </select>
          <select name="statute_category" defaultValue={filterCategory ?? ""}>
            <option value="">All Statute Categories</option>
            {STATUTE_CATEGORIES.map((sc) => (
              <option key={sc} value={sc}>
                {STATUTE_CATEGORY_LABELS[sc]}
              </option>
            ))}
          </select>
          <button type="submit">Filter</button>
          {(filterType || filterCategory) && (
            <a href="/documents" className="btn secondary">
              Clear
            </a>
          )}
        </form>
      </div>

      {docs.length === 0 ? (
        <div className="empty">
          <p>No governing documents found.</p>
          <p className="muted">Upload your first document using the form above.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Statute Category</th>
              <th>Effective Date</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <Link href={`/documents/${doc.id}`}>{doc.title}</Link>
                </td>
                <td>{DOC_TYPE_LABELS[doc.doc_type]}</td>
                <td>{STATUTE_CATEGORY_LABELS[doc.statute_category]}</td>
                <td>{doc.effective_date ? doc.effective_date.slice(0, 10) : <span className="muted">—</span>}</td>
                <td>
                  <span className="muted">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td>
                  {doc.file_id && (
                    <a href={getDownloadUrl(doc.file_id)} className="btn secondary">
                      Download
                    </a>
                  )}
                  {" "}
                  <form action={archiveDocumentAction} style={{ display: "inline" }}>
                    <input type="hidden" name="doc_id" value={doc.id} />
                    <button
                      type="submit"
                      className="btn secondary"
                      style={{ fontSize: "0.85em" }}
                    >
                      Archive
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
