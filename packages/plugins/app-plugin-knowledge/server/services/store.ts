/**
 * The knowledge tables (`202610030010_kb_create_tables`) as records, and the reads every part of the knowledge
 * base shares. Every function takes the connection to read through: a caller inside a transaction (a claim, a
 * decision) passes its own.
 */
import type { DatabaseConnection, Repository } from '@nocobase/db';

import type {
  KnowledgeAccessMode,
  KnowledgeEntryKind,
  KnowledgeGrantLevel,
  KnowledgeParseStatus,
  KnowledgeProposalKind,
  KnowledgeProposalStatus,
  KnowledgeScope,
  SpaceRef,
} from '../../shared/knowledge.js';

export const TABLES = {
  spaces: 'kbSpaces',
  docs: 'kbDocs',
  versions: 'kbDocVersions',
  chunks: 'kbChunks',
  access: 'kbDocAccess',
  proposals: 'kbProposals',
  snapshots: 'kbSnapshots',
  files: 'kbFiles',
  tickets: 'kbUploadTickets',
} as const;

export interface SpaceRecord {
  readonly id: string;
  readonly scope: KnowledgeScope;
  readonly scopeId: string;
  readonly settings: unknown;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DocRecord {
  readonly id: string;
  readonly kind: KnowledgeEntryKind;
  readonly spaceId: string;
  readonly parentId: string | null;
  readonly sortOrder: number;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly currentVersion: number;
  readonly contentHash: string;
  readonly verifiedAt: string | null;
  readonly verifiedById: string | null;
  readonly archivedAt: string | null;
  readonly createdById: string | null;
  readonly createdAt: string;
  readonly updatedByKind: string;
  readonly updatedById: string | null;
  readonly updatedAt: string;
  readonly accessMode: KnowledgeAccessMode;
  readonly aclKey: string | null;
}

/** One permission entry of an entry (`kbDocAccess`). */
export interface AccessEntryRecord {
  readonly id: string;
  readonly docId: string;
  readonly spaceId: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly level: KnowledgeGrantLevel;
  readonly createdById: string | null;
  readonly createdAt: string;
}

export interface VersionRecord {
  readonly id: string;
  readonly docId: string;
  readonly version: number;
  readonly title: string;
  readonly summary: string;
  readonly content: string;
  readonly contentHash: string;
  readonly fileId: string | null;
  readonly parseStatus: KnowledgeParseStatus | null;
  readonly parseError: string | null;
  readonly authorKind: string;
  readonly authorId: string | null;
  readonly sourceKind: string | null;
  readonly sourceId: string | null;
  readonly sourceTitle: string | null;
  readonly runId: string | null;
  readonly proposalId: string | null;
  readonly approvedById: string | null;
  readonly note: string | null;
  readonly createdAt: string;
}

export interface ChunkRecord {
  readonly id: string;
  readonly docId: string;
  readonly spaceId: string;
  readonly version: number;
  readonly ordinal: number;
  readonly headingPath: unknown;
  readonly anchor: string | null;
  readonly lineStart: number;
  readonly lineEnd: number;
  readonly text: string;
  readonly charCount: number;
  readonly hash: string;
  readonly aclKey: string | null;
}

export interface ProposalRecord {
  readonly id: string;
  readonly spaceId: string;
  readonly docId: string | null;
  readonly kind: KnowledgeProposalKind;
  readonly parentId: string | null;
  readonly slug: string | null;
  readonly title: string | null;
  readonly summary: string | null;
  readonly content: string | null;
  readonly contentHash: string | null;
  readonly fileId: string | null;
  readonly baseVersion: number | null;
  readonly reason: string;
  readonly proposerKind: string;
  readonly proposerId: string;
  readonly authorizedById: string;
  readonly sourceKind: string | null;
  readonly sourceId: string | null;
  readonly sourceTitle: string | null;
  readonly sourceUrl: string | null;
  readonly runId: string | null;
  readonly status: KnowledgeProposalStatus;
  readonly decidedById: string | null;
  readonly decidedAt: string | null;
  readonly comment: string | null;
  readonly appliedVersion: number | null;
  /** The proposal sent back that this one replaces. */
  readonly replacesId: string | null;
  /** `document` for a document's version sent back for changes; null for a proposal. */
  readonly origin: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SnapshotDoc {
  readonly docId: string;
  readonly kind: KnowledgeEntryKind;
  readonly version: number;
  /** Inside the snapshot's directory, `/`-separated; empty for a folder, or a document listed but not written. */
  readonly path: string;
  /** SHA-256 of the file's bytes as written. */
  readonly hash: string;
  readonly slug: string;
  readonly title: string;
  readonly scope: KnowledgeScope;
}

export interface SnapshotRecord {
  readonly id: string;
  readonly snapshotKey: string;
  readonly seriesKey: string;
  readonly hash: string;
  readonly docs: unknown;
  readonly omitted: number;
  readonly createdAt: string;
}

/** A stored file: the file plugin's columns, its uploader and the hash of its bytes. */
export interface FileRecord {
  readonly id: string;
  readonly disk: string;
  readonly key: string;
  readonly filename: string;
  readonly ext: string;
  readonly mimeType: string;
  readonly size: number;
  readonly uploaderKind: string;
  readonly uploaderId: string;
  readonly sha256: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TicketRecord {
  readonly id: string;
  readonly tokenHash: string;
  readonly userId: string;
  readonly actorKind: string | null;
  readonly actorId: string | null;
  readonly runId: string | null;
  readonly request: unknown;
  readonly expiresAt: string;
  readonly usedAt: string | null;
  readonly createdAt: string;
}

export const spacesRepo = (conn: DatabaseConnection): Repository<SpaceRecord> =>
  conn.repository<SpaceRecord>(TABLES.spaces);
export const docsRepo = (conn: DatabaseConnection): Repository<DocRecord> =>
  conn.repository<DocRecord>(TABLES.docs);
export const versionsRepo = (
  conn: DatabaseConnection,
): Repository<VersionRecord> => conn.repository<VersionRecord>(TABLES.versions);
export const chunksRepo = (conn: DatabaseConnection): Repository<ChunkRecord> =>
  conn.repository<ChunkRecord>(TABLES.chunks);
export const accessRepo = (
  conn: DatabaseConnection,
): Repository<AccessEntryRecord> =>
  conn.repository<AccessEntryRecord>(TABLES.access);
export const proposalsRepo = (
  conn: DatabaseConnection,
): Repository<ProposalRecord> =>
  conn.repository<ProposalRecord>(TABLES.proposals);
export const snapshotsRepo = (
  conn: DatabaseConnection,
): Repository<SnapshotRecord> =>
  conn.repository<SnapshotRecord>(TABLES.snapshots);

export const filesRepo = (conn: DatabaseConnection): Repository<FileRecord> =>
  conn.repository<FileRecord>(TABLES.files);
export const ticketsRepo = (
  conn: DatabaseConnection,
): Repository<TicketRecord> => conn.repository<TicketRecord>(TABLES.tickets);

export async function findFile(
  conn: DatabaseConnection,
  id: string,
): Promise<FileRecord | null> {
  return (await filesRepo(conn).findOne({ filter: { id } })) ?? null;
}

/** The stored files of `ids`, by id. */
export async function filesOf(
  conn: DatabaseConnection,
  ids: readonly (string | null)[],
): Promise<Map<string, FileRecord>> {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (wanted.length === 0) return new Map();
  const rows = await filesRepo(conn).findMany({
    filter: (f) => f.or(wanted.map((id) => f.string('id').eq(id))),
  });
  return new Map(rows.map((row) => [row.id, row]));
}

/** What the proposals of `ids` replaced (the proposal or the version sent back), by the replacing proposal's id. */
export async function replacedOf(
  conn: DatabaseConnection,
  ids: readonly (string | null)[],
): Promise<Map<string, ProposalRecord>> {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (wanted.length === 0) return new Map();
  const revisions = (
    await proposalsRepo(conn).findMany({
      filter: (f) => f.or(wanted.map((id) => f.string('id').eq(id))),
    })
  ).filter((row) => row.replacesId);
  if (revisions.length === 0) return new Map();
  const replaced = new Map(
    (
      await proposalsRepo(conn).findMany({
        filter: (f) =>
          f.or(revisions.map((row) => f.string('id').eq(row.replacesId))),
      })
    ).map((row) => [row.id, row]),
  );
  const found = new Map<string, ProposalRecord>();
  for (const row of revisions) {
    const before = replaced.get(row.replacesId!);
    if (before) found.set(row.id, before);
  }
  return found;
}

/** The current versions of `docs` (files only, or any), by document id. */
export async function currentVersionsOf(
  conn: DatabaseConnection,
  docs: readonly Pick<DocRecord, 'id' | 'currentVersion'>[],
): Promise<Map<string, VersionRecord>> {
  const found = new Map<string, VersionRecord>();
  // In batches: a filter of thousands of terms is too deep for some databases.
  for (let at = 0; at < docs.length; at += 100) {
    const batch = docs.slice(at, at + 100);
    const rows = await versionsRepo(conn).findMany({
      filter: (f) =>
        f.or(
          batch.map((doc) =>
            f.and([
              f.string('docId').eq(doc.id),
              f.number('version').eq(num(doc.currentVersion)),
            ]),
          ),
        ),
    });
    for (const row of rows) found.set(row.docId, row);
  }
  return found;
}

/** A stored time as ISO 8601; dialects hand back strings or dates. */
export function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  return String(value);
}

export function isoOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : iso(value);
}

/** A stored JSON value; some dialects hand back its text. */
export function json<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string')
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  return value as T;
}

/** Numbers as numbers: some dialects hand integers back as text. */
export function num(value: unknown): number {
  return Number(value);
}

export function spaceKey(space: SpaceRef): string {
  return `${space.scope}:${space.scopeId}`;
}

export async function findSpace(
  conn: DatabaseConnection,
  space: SpaceRef,
): Promise<SpaceRecord | null> {
  return (
    (await spacesRepo(conn).findOne({
      filter: { scope: space.scope, scopeId: space.scopeId },
    })) ?? null
  );
}

export async function findSpaceById(
  conn: DatabaseConnection,
  id: string,
): Promise<SpaceRecord | null> {
  return (await spacesRepo(conn).findOne({ filter: { id } })) ?? null;
}

/** The spaces of `refs` that exist, by `spaceKey`. */
export async function spacesOf(
  conn: DatabaseConnection,
  refs: readonly SpaceRef[],
): Promise<Map<string, SpaceRecord>> {
  const found = new Map<string, SpaceRecord>();
  for (const ref of refs) {
    const space = await findSpace(conn, ref);
    if (space) found.set(spaceKey(ref), space);
  }
  return found;
}

export async function findDoc(
  conn: DatabaseConnection,
  id: string,
): Promise<DocRecord | null> {
  return (await docsRepo(conn).findOne({ filter: { id } })) ?? null;
}

export async function findDocBySlug(
  conn: DatabaseConnection,
  spaceId: string,
  slug: string,
): Promise<DocRecord | null> {
  return (await docsRepo(conn).findOne({ filter: { spaceId, slug } })) ?? null;
}

/** The documents of the spaces, archived ones only when asked for. */
export async function docsOf(
  conn: DatabaseConnection,
  spaceIds: readonly string[],
  options: { readonly archived?: boolean } = {},
): Promise<DocRecord[]> {
  if (spaceIds.length === 0) return [];
  return docsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.or(spaceIds.map((id) => f.string('spaceId').eq(id))),
        ...(options.archived ? [] : [f.date('archivedAt').empty()]),
      ]),
    sort: (sort) => [
      sort.field('sortOrder').asc(),
      sort.field('title').asc(),
      sort.field('id').asc(),
    ],
  });
}

export async function findVersion(
  conn: DatabaseConnection,
  docId: string,
  version: number,
): Promise<VersionRecord | null> {
  return (
    (await versionsRepo(conn).findOne({ filter: { docId, version } })) ?? null
  );
}

/** The number of pending proposals per document. */
export async function pendingCounts(
  conn: DatabaseConnection,
  docIds: readonly string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (docIds.length === 0) return counts;
  const rows = await proposalsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('status').eq('pending'),
        f.or(docIds.map((id) => f.string('docId').eq(id))),
      ]),
  });
  for (const row of rows)
    if (row.docId) counts.set(row.docId, (counts.get(row.docId) ?? 0) + 1);
  return counts;
}

/** The number of permission entries per document. */
export async function entryCounts(
  conn: DatabaseConnection,
  docIds: readonly string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (let at = 0; at < docIds.length; at += 100) {
    const batch = docIds.slice(at, at + 100);
    const rows = await accessRepo(conn).findMany({
      filter: (f) => f.or(batch.map((id) => f.string('docId').eq(id))),
      select: (select) => select.fields('docId'),
    });
    for (const row of rows)
      counts.set(row.docId, (counts.get(row.docId) ?? 0) + 1);
  }
  return counts;
}

/** A document's ancestors, root first. */
export async function ancestorsOf(
  conn: DatabaseConnection,
  doc: Pick<DocRecord, 'parentId'>,
): Promise<DocRecord[]> {
  const chain: DocRecord[] = [];
  let parentId = doc.parentId;
  for (let guard = 0; parentId && guard < 16; guard += 1) {
    const parent = await findDoc(conn, parentId);
    if (!parent) break;
    chain.unshift(parent);
    parentId = parent.parentId;
  }
  return chain;
}
