import type { JSX } from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/admin-auth";
import {
  getDocument,
  archiveDocument,
  getCommunityId,
  getDownloadUrl,
  DOC_TYPE_LABELS,
  STATUTE_CATEGORY_LABELS,
} from "@/lib/hoa/document-vault";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function archiveDocumentAction(formData: FormData): Promise<void> {
  "use server";
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const docId = formData.get("doc_id") as string | null;
  if (docId) {
    await archiveDocument(docId, getCommunityId());
  }
  revalidatePath("/documents");
  redirect("/documents");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentDetailPage({
  params,
}: {
  params: { docId: string };
}): Promise<JSX.Element> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const communityId = getCommunityId();
  const doc = await getDocument(params.docId, communityId);
  if (!doc) notFound();

  const isArchived = doc.status === "archived";

  return (
    <main>
      <p className="muted">
        <Link href="/documents">← Governing Document Vault</Link>
      </p>

      <h1>{doc.title}</h1>
      <p>{doc.description ?? <span className="muted">No description provided.</span>}</p>

      <div className="card">
        <table>
          <tbody>
            <tr>
              <th scope="row">Document Type</th>
              <td>{DOC_TYPE_LABELS[doc.doc_type]}</td>
            </tr>
            <tr>
              <th scope="row">Statute Category</th>
              <td>{STATUTE_CATEGORY_LABELS[doc.statute_category]}</td>
            </tr>
            <tr>
              <th scope="row">Filename</th>
              <td>{doc.filename}</td>
            </tr>
            <tr>
              <th scope="row">File Size</th>
              <td>{formatBytes(doc.size_bytes)}</td>
            </tr>
            <tr>
              <th scope="row">MIME Type</th>
              <td>{doc.mime_type}</td>
            </tr>
            {doc.effective_date && (
              <tr>
                <th scope="row">Effective Date</th>
                <td>{doc.effective_date.slice(0, 10)}</td>
              </tr>
            )}
            <tr>
              <th scope="row">Uploaded By</th>
              <td>{doc.uploaded_by_email}</td>
            </tr>
            <tr>
              <th scope="row">Uploaded On</th>
              <td>{new Date(doc.created_at).toLocaleString()}</td>
            </tr>
            <tr>
              <th scope="row">Status</th>
              <td style={{ textTransform: "capitalize" }}>{doc.status}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
        {doc.file_id && (
          <a href={getDownloadUrl(doc.file_id)} className="btn">
            Download Document
          </a>
        )}
        <Link href="/documents" className="btn secondary">
          Back to Vault
        </Link>
        {!isArchived && (
          <form action={archiveDocumentAction} style={{ display: "inline" }}>
            <input type="hidden" name="doc_id" value={doc.id} />
            <button type="submit" className="btn secondary">
              Archive Document
            </button>
          </form>
        )}
      </div>

      {isArchived && (
        <p className="muted" style={{ marginTop: "1rem" }}>
          This document has been archived and is no longer active. It is retained for
          record-keeping purposes.
        </p>
      )}
    </main>
  );
}
