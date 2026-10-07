/**
 * Stored files as the API shows them (`KnowledgeFileInfo`): their facts, where their text stands, and the addresses of
 * their bytes, which are the knowledge base's own routes (`routes/api.ts`) under the application's public base path.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { KnowledgeFileInfo } from '../../shared/knowledge.js';
import {
  currentVersionsOf,
  filesOf,
  num,
  type DocRecord,
  type FileRecord,
  type VersionRecord,
} from './store.js';

/** The addresses of stored files' bytes. */
export interface FileUrls {
  /** A version's file (the current one without `version`). */
  doc(docId: string, version?: number): string;
  /** A proposal's file. */
  proposal(proposalId: string): string;
}

export function fileUrls(basePath: () => string): FileUrls {
  const root = () => `${basePath().replace(/\/+$/u, '')}/api/knowledge`;
  return {
    doc: (docId, version) =>
      `${root()}/docs/${encodeURIComponent(docId)}/file${version ? `?version=${version}` : ''}`,
    proposal: (proposalId) =>
      `${root()}/proposals/${encodeURIComponent(proposalId)}/file`,
  };
}

const withDownload = (url: string) =>
  `${url}${url.includes('?') ? '&' : '?'}download=true`;

export function fileInfo(
  file: FileRecord,
  version: Pick<VersionRecord, 'parseStatus' | 'parseError'> | null,
  url: string,
): KnowledgeFileInfo {
  return {
    id: file.id,
    filename: file.filename,
    ext: file.ext,
    mimeType: file.mimeType,
    size: num(file.size),
    parseStatus: version?.parseStatus ?? null,
    parseError: version?.parseError ?? null,
    contentUrl: url,
    downloadUrl: withDownload(url),
  };
}

/** A version's file, or null for an article's version. */
export async function versionFileInfo(
  conn: DatabaseConnection,
  urls: FileUrls,
  version: VersionRecord,
  current: boolean,
): Promise<KnowledgeFileInfo | null> {
  if (!version.fileId) return null;
  const file = (await filesOf(conn, [version.fileId])).get(version.fileId);
  return file
    ? fileInfo(
        file,
        version,
        urls.doc(version.docId, current ? undefined : num(version.version)),
      )
    : null;
}

/** The current file of each file entry among `docs`, by document id. */
export async function currentFiles(
  conn: DatabaseConnection,
  urls: FileUrls,
  docs: readonly DocRecord[],
): Promise<Map<string, KnowledgeFileInfo>> {
  const files = docs.filter((doc) => doc.kind === 'file');
  const infos = new Map<string, KnowledgeFileInfo>();
  if (files.length === 0) return infos;
  const versions = await currentVersionsOf(conn, files);
  const stored = await filesOf(
    conn,
    [...versions.values()].map((version) => version.fileId),
  );
  for (const doc of files) {
    const version = versions.get(doc.id);
    const file = version?.fileId ? stored.get(version.fileId) : undefined;
    if (version && file)
      infos.set(doc.id, fileInfo(file, version, urls.doc(doc.id)));
  }
  return infos;
}
