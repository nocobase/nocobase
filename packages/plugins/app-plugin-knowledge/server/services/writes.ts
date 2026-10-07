/**
 * The writes every version goes through, inside the caller's transaction: a space made when its first entry is, an
 * entry's first version (a folder has none), the next version under an optimistic lock, and the entry's chunks
 * rewritten with each version, so search always reads the current one. A file's version starts without text: its
 * chunks are written once the text is extracted (`files.ts`), which this asks for once the transaction commits.
 */
import { createHash } from 'node:crypto';

import type { DatabaseConnection } from '@nocobase/db';

import {
  KNOWLEDGE_MAX_DEPTH,
  type KnowledgeEntryKind,
  type KnowledgeParseStatus,
  type KnowledgeSource,
  type SpaceRef,
} from '../../shared/knowledge.js';
import { conflict, invalid } from '../errors.js';
import { chunkMarkdown } from './chunks.js';
import { chunkingFor } from './tuning.js';
import type { KnowledgeContext, KnowledgeTx } from './context.js';
import { aclKeysOf, keyedNodes } from './permissions.js';
import {
  accessRepo,
  chunksRepo,
  docsRepo,
  findDoc,
  findDocBySlug,
  findSpace,
  num,
  spacesRepo,
  versionsRepo,
  type DocRecord,
  type SpaceRecord,
} from './store.js';
import { slugCandidate } from './validate.js';

export function hashOf(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/** Who wrote a version (a person, `user`, or an actor of the application's kind), and what it came from. */
export interface VersionAuthor {
  readonly kind: string;
  readonly id: string | null;
  readonly source?: KnowledgeSource | null;
  readonly runId?: string | null;
  readonly proposalId?: string | null;
  readonly approvedById?: string | null;
  readonly note?: string | null;
}

/** A file's version: the stored file, the hash of its bytes, and where its text stands. */
export interface VersionFile {
  readonly fileId: string;
  readonly sha256: string;
  readonly parseStatus: KnowledgeParseStatus;
  readonly parseError?: string | null;
}

export interface VersionContent {
  readonly title: string;
  readonly summary: string;
  /** An article's Markdown; a file's extracted text (empty while it is parsed). */
  readonly content: string;
  readonly file?: VersionFile;
}

type WriteContext = Pick<KnowledgeContext, 'newId' | 'parse' | 'settings'>;

/** What a version's hash is: an article's content, or a file's bytes. */
const versionHash = (next: VersionContent) =>
  next.file ? next.file.sha256 : hashOf(next.content);

export async function ensureSpace(
  context: Pick<KnowledgeContext, 'newId'>,
  conn: DatabaseConnection,
  ref: SpaceRef,
  now: string,
): Promise<SpaceRecord> {
  const existing = await findSpace(conn, ref);
  if (existing) return existing;
  const id = context.newId();
  await spacesRepo(conn).createOne({
    values: {
      id,
      scope: ref.scope,
      scopeId: ref.scopeId,
      settings: {},
      createdAt: now,
      updatedAt: now,
    },
  });
  return (await findSpace(conn, ref))!;
}

/** How deep a document is: a root document is 1. */
export async function depthOf(
  conn: DatabaseConnection,
  doc: Pick<DocRecord, 'parentId'>,
): Promise<number> {
  let depth = 1;
  let parentId = doc.parentId;
  for (let guard = 0; parentId && guard < 16; guard += 1) {
    depth += 1;
    parentId = (await findDoc(conn, parentId))?.parentId ?? null;
  }
  return depth;
}

/** The parent a new or moved document may go under: live, in the same space, within the depth limit. */
export async function checkParent(
  conn: DatabaseConnection,
  spaceId: string,
  parentId: string | null | undefined,
  height = 1,
): Promise<DocRecord | null> {
  if (!parentId) return null;
  const parent = await findDoc(conn, parentId);
  if (!parent || parent.spaceId !== spaceId)
    throw invalid(
      'INVALID_PARENT',
      'The parent must be a document in the same space.',
    );
  if (parent.kind === 'file')
    throw invalid('INVALID_PARENT', 'Nothing goes under a file.');
  if (parent.archivedAt)
    throw conflict(
      'KNOWLEDGE_ARCHIVED',
      'A document cannot go under an archived one.',
    );
  if ((await depthOf(conn, parent)) + height > KNOWLEDGE_MAX_DEPTH)
    throw invalid(
      'KNOWLEDGE_DEPTH_EXCEEDED',
      `Documents nest at most ${KNOWLEDGE_MAX_DEPTH} levels deep.`,
    );
  return parent;
}

/** The first free slug from `base` in the space. */
export async function freeSlug(
  conn: DatabaseConnection,
  spaceId: string,
  base: string,
): Promise<string> {
  for (let attempt = 1; attempt <= 200; attempt += 1) {
    const candidate = slugCandidate(base, attempt);
    if (!(await findDocBySlug(conn, spaceId, candidate))) return candidate;
  }
  throw conflict('KNOWLEDGE_SLUG_TAKEN', 'No free slug for this title.');
}

/** The next position among a parent's children. */
export async function nextSortOrder(
  conn: DatabaseConnection,
  spaceId: string,
  parentId: string | null,
): Promise<number> {
  const siblings = await docsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('spaceId').eq(spaceId),
        parentId
          ? f.string('parentId').eq(parentId)
          : f.string('parentId').empty(),
      ]),
  });
  return siblings.reduce(
    (max, sibling) => Math.max(max, num(sibling.sortOrder) + 1),
    0,
  );
}

async function writeVersion(
  context: WriteContext,
  tx: KnowledgeTx,
  docId: string,
  version: number,
  next: VersionContent,
  author: VersionAuthor,
  now: string,
): Promise<void> {
  const id = context.newId();
  await versionsRepo(tx.conn).createOne({
    values: {
      id,
      docId,
      version,
      title: next.title,
      summary: next.summary,
      content: next.content,
      contentHash: versionHash(next),
      fileId: next.file?.fileId ?? null,
      parseStatus: next.file?.parseStatus ?? null,
      parseError: next.file?.parseError?.slice(0, 500) ?? null,
      authorKind: author.kind,
      authorId: author.id,
      sourceKind: author.source?.kind ?? null,
      sourceId: author.source?.id ?? null,
      sourceTitle: author.source?.title?.slice(0, 255) ?? null,
      runId: author.runId ?? null,
      proposalId: author.proposalId ?? null,
      approvedById: author.approvedById ?? null,
      note: author.note ?? null,
      createdAt: now,
    },
  });
  if (next.file?.parseStatus === 'parsing')
    tx.afterCommit(() => context.parse(id));
}

/** Replaces the entry's chunks with the chunks of `content` at `version`, and says so. */
export async function writeChunks(
  context: Pick<KnowledgeContext, 'newId'>,
  tx: KnowledgeTx,
  doc: Pick<DocRecord, 'id' | 'spaceId' | 'aclKey'>,
  space: SpaceRef,
  version: number,
  content: string,
): Promise<void> {
  const conn = tx.conn;
  await chunksRepo(conn).deleteMany({ filter: { docId: doc.id } });
  const options = await chunkingFor(tx, doc.spaceId);
  for (const chunk of content.trim() ? chunkMarkdown(content, options) : [])
    await chunksRepo(conn).createOne({
      values: {
        id: context.newId(),
        docId: doc.id,
        spaceId: doc.spaceId,
        version,
        ordinal: chunk.ordinal,
        headingPath: [...chunk.headingPath],
        anchor: chunk.anchor?.slice(0, 200) ?? null,
        lineStart: chunk.lineStart,
        lineEnd: chunk.lineEnd,
        text: chunk.text,
        charCount: chunk.text.length,
        hash: chunk.hash,
        aclKey: doc.aclKey ?? null,
      },
    });
  tx.emit({
    type: 'chunks.changed',
    docId: doc.id,
    version,
    spaceId: doc.spaceId,
    space,
  });
}

/** The text a version is searched by: an article's content, a file's once extracted. */
const searchedText = (next: VersionContent) =>
  !next.file || next.file.parseStatus === 'ready' ? next.content : '';

/** A new article or file at version 1, or a folder (no version). */
export async function insertDoc(
  context: WriteContext,
  tx: KnowledgeTx,
  input: {
    readonly kind?: KnowledgeEntryKind;
    readonly space: SpaceRecord;
    readonly parentId: string | null;
    readonly slug: string;
    readonly sortOrder: number;
    readonly next: VersionContent;
    readonly author: VersionAuthor;
    readonly createdById: string | null;
    readonly now: string;
  },
): Promise<DocRecord> {
  const id = context.newId();
  const kind = input.kind ?? (input.next.file ? 'file' : 'article');
  const folder = kind === 'folder';
  const spaceRef = { scope: input.space.scope, scopeId: input.space.scopeId };
  // A new entry inherits, with no entries of its own: its parent's access key.
  const parent = input.parentId ? await findDoc(tx.conn, input.parentId) : null;
  await docsRepo(tx.conn).createOne({
    values: {
      id,
      kind,
      spaceId: input.space.id,
      parentId: input.parentId,
      sortOrder: input.sortOrder,
      slug: input.slug,
      title: input.next.title,
      summary: folder ? '' : input.next.summary,
      currentVersion: folder ? 0 : 1,
      contentHash: folder ? '' : versionHash(input.next),
      verifiedAt: null,
      verifiedById: null,
      archivedAt: null,
      createdById: input.createdById,
      createdAt: input.now,
      updatedByKind: input.author.kind,
      updatedById: input.author.id,
      updatedAt: input.now,
      accessMode: 'inherit',
      aclKey: parent?.aclKey ?? null,
    },
  });
  const doc = (await findDoc(tx.conn, id))!;
  if (folder) {
    tx.emit({ type: 'doc.changed', docId: id });
    return doc;
  }
  await writeVersion(context, tx, id, 1, input.next, input.author, input.now);
  await writeChunks(context, tx, doc, spaceRef, 1, searchedText(input.next));
  tx.emit({ type: 'doc.versioned', docId: id, version: 1, space: spaceRef });
  return doc;
}

/**
 * The next version of `doc`, only if it is still at `expected` (409 `KNOWLEDGE_VERSION_CONFLICT` otherwise). Nothing
 * changes, and no version is written, when the title, summary and content are what they are. Answers the version the
 * document is at afterwards.
 */
export async function appendVersion(
  context: WriteContext,
  tx: KnowledgeTx,
  doc: DocRecord,
  space: SpaceRef,
  expected: number,
  next: VersionContent,
  author: VersionAuthor,
  now: string,
): Promise<number> {
  const current = num(doc.currentVersion);
  if (current !== expected)
    throw conflict(
      'KNOWLEDGE_VERSION_CONFLICT',
      `The document is at version ${current}; you edited version ${expected}.`,
      { currentVersion: current, expectedVersion: expected },
    );
  const contentHash = versionHash(next);
  if (
    !next.file &&
    next.title === doc.title &&
    next.summary === doc.summary &&
    contentHash === doc.contentHash
  )
    return current;
  const version = current + 1;
  const taken = await docsRepo(tx.conn).updateMany({
    filter: (f) =>
      f.and([
        f.string('id').eq(doc.id),
        f.number('currentVersion').eq(expected),
      ]),
    values: {
      currentVersion: version,
      title: next.title,
      summary: next.summary,
      contentHash,
      updatedByKind: author.kind,
      updatedById: author.id,
      updatedAt: now,
    },
  });
  if (taken.updatedCount !== 1) {
    const latest = (await findDoc(tx.conn, doc.id))?.currentVersion;
    throw conflict(
      'KNOWLEDGE_VERSION_CONFLICT',
      'The document changed while you edited it.',
      { currentVersion: num(latest), expectedVersion: expected },
    );
  }
  await writeVersion(context, tx, doc.id, version, next, author, now);
  await writeChunks(context, tx, doc, space, version, searchedText(next));
  tx.emit({ type: 'doc.versioned', docId: doc.id, version, space });
  return version;
}

/**
 * Recomputes the access keys of a space's entries and their chunks after permissions changed or an entry moved, and
 * announces `chunks.changed` for each entry whose key changed, so an index updates its sections' gates.
 */
export async function refreshAclKeys(
  tx: KnowledgeTx,
  spaceId: string,
  space: SpaceRef,
): Promise<void> {
  const conn = tx.conn;
  const nodes = await docsRepo(conn).findMany({ filter: { spaceId } });
  const entries = await accessRepo(conn).findMany({
    filter: { spaceId },
    select: (select) => select.fields('docId'),
  });
  const keys = aclKeysOf(nodes, keyedNodes(nodes, entries));
  for (const node of nodes) {
    const key = keys.get(node.id) ?? null;
    if ((node.aclKey ?? null) === key) continue;
    await docsRepo(conn).updateMany({
      filter: { id: node.id },
      values: { aclKey: key },
    });
    await chunksRepo(conn).updateMany({
      filter: { docId: node.id },
      values: { aclKey: key },
    });
    if (node.kind !== 'folder')
      tx.emit({
        type: 'chunks.changed',
        docId: node.id,
        version: num(node.currentVersion),
        spaceId,
        space,
      });
  }
}
