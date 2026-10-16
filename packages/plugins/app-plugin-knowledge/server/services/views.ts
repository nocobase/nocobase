/** Records as the API answers them, with the names of the people and actors they mention. */
import type {
  KnowledgeAccess,
  KnowledgeAuthor,
  KnowledgeDoc,
  KnowledgeDocSummary,
  KnowledgeFileInfo,
  KnowledgeRevisionRequest,
  KnowledgeSource,
  KnowledgeVersion,
  SpaceRef,
} from '../../shared/knowledge.js';
import type { KnowledgeAccessResolver } from './access.js';
import {
  isoOrNull,
  iso,
  num,
  type DocRecord,
  type ProposalRecord,
  type VersionRecord,
} from './store.js';

export interface PersonRef {
  readonly kind: string;
  readonly id: string | null;
}

/** Names for the people and actors of `refs`, by `kind:id`, from the application. */
export async function namesFor(
  resolver: Pick<KnowledgeAccessResolver, 'names'>,
  refs: readonly PersonRef[],
): Promise<ReadonlyMap<string, string>> {
  const wanted = new Map<string, { kind: string; id: string }>();
  for (const ref of refs)
    if (ref.id && ref.kind && ref.kind !== 'system')
      wanted.set(`${ref.kind}:${ref.id}`, { kind: ref.kind, id: ref.id });
  if (wanted.size === 0) return new Map();
  return resolver.names([...wanted.values()]);
}

export function authorOf(
  names: ReadonlyMap<string, string>,
  kind: string | null,
  id: string | null,
): KnowledgeAuthor {
  const known = kind || 'system';
  return {
    kind: known,
    id,
    name: id ? (names.get(`${known}:${id}`) ?? null) : null,
  };
}

export function sourceOf(record: {
  readonly sourceKind: string | null;
  readonly sourceId: string | null;
  readonly sourceTitle: string | null;
  readonly sourceUrl?: string | null;
}): KnowledgeSource | null {
  if (!record.sourceKind || !record.sourceId) return null;
  return {
    kind: record.sourceKind,
    id: record.sourceId,
    title: record.sourceTitle,
    ...(record.sourceUrl ? { url: record.sourceUrl } : {}),
  };
}

export function docSummary(
  doc: DocRecord,
  space: SpaceRef,
  names: ReadonlyMap<string, string>,
  counts: {
    readonly children: ReadonlyMap<string, number>;
    readonly pending: ReadonlyMap<string, number>;
    /** Each entry's own permission entries. */
    readonly entries: ReadonlyMap<string, number>;
  },
  file: KnowledgeFileInfo | null,
  access: KnowledgeAccess,
): KnowledgeDocSummary {
  return {
    id: doc.id,
    kind: doc.kind,
    spaceId: doc.spaceId,
    scope: space.scope,
    scopeId: space.scopeId,
    parentId: doc.parentId,
    sortOrder: num(doc.sortOrder),
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    version: num(doc.currentVersion),
    file,
    verifiedAt: isoOrNull(doc.verifiedAt),
    archivedAt: isoOrNull(doc.archivedAt),
    updatedAt: iso(doc.updatedAt),
    updatedBy: authorOf(names, doc.updatedByKind, doc.updatedById),
    childCount: counts.children.get(doc.id) ?? 0,
    pendingProposals: counts.pending.get(doc.id) ?? 0,
    access,
    accessMode: doc.accessMode === 'custom' ? 'custom' : 'inherit',
    accessEntries: counts.entries.get(doc.id) ?? 0,
  };
}

export function docView(
  doc: DocRecord,
  space: SpaceRef,
  content: string,
  names: ReadonlyMap<string, string>,
  extra: {
    readonly children: number;
    readonly pending: number;
    readonly entries: number;
    readonly breadcrumbs: readonly DocRecord[];
    readonly access: KnowledgeAccess;
    readonly file: KnowledgeFileInfo | null;
  },
): KnowledgeDoc {
  return {
    ...docSummary(
      doc,
      space,
      names,
      {
        children: new Map([[doc.id, extra.children]]),
        pending: new Map([[doc.id, extra.pending]]),
        entries: new Map([[doc.id, extra.entries]]),
      },
      extra.file,
      extra.access,
    ),
    content,
    contentHash: doc.contentHash,
    verifiedBy: doc.verifiedById
      ? authorOf(names, 'user', doc.verifiedById)
      : null,
    breadcrumbs: extra.breadcrumbs.map((parent) => ({
      id: parent.id,
      slug: parent.slug,
      title: parent.title,
    })),
  };
}

/** What a proposal sent back (or the record standing for a version sent back) says of it. */
export function revisionRequestOf(
  record: ProposalRecord,
  names: ReadonlyMap<string, string>,
): KnowledgeRevisionRequest {
  return {
    proposalId: record.id,
    origin: record.origin === 'document' ? 'document' : 'proposal',
    comment: record.comment,
    requestedBy: record.decidedById
      ? authorOf(names, 'user', record.decidedById)
      : null,
    requestedAt: isoOrNull(record.decidedAt),
  };
}

export function versionView(
  record: VersionRecord,
  names: ReadonlyMap<string, string>,
  withContent: boolean,
  file: KnowledgeFileInfo | null = null,
  /** What the proposal it applied replaced, when that was a revision. */
  replaced: ProposalRecord | null = null,
): KnowledgeVersion {
  return {
    docId: record.docId,
    version: num(record.version),
    title: record.title,
    summary: record.summary,
    ...(withContent ? { content: record.content } : {}),
    contentHash: record.contentHash,
    file,
    author: authorOf(names, record.authorKind, record.authorId),
    source: sourceOf(record),
    runId: record.runId,
    proposalId: record.proposalId,
    approvedBy: record.approvedById
      ? authorOf(names, 'user', record.approvedById)
      : null,
    note: record.note,
    revision: replaced ? revisionRequestOf(replaced, names) : null,
    createdAt: iso(record.createdAt),
  };
}
