/**
 * Entries as people work on them: a space's tree with the spaces it inherits, one entry, its versions, creating an
 * article or a folder (files are uploaded, `files.ts`), editing under an optimistic lock (`expectedVersion`), moving (no
 * new version), archiving and restoring, marking verified, and search (`search.ts`: the registered providers' rankings
 * fused). A folder has no versions: editing one renames it. A file's new version here keeps its file (a new title or
 * summary). Access is decided before each transaction (`access.ts`), entry by entry: a reader sees, and search finds,
 * only the entries they read, and acts on each by what it lets them do (`docs/permissions.md`).
 */
import type { DatabaseConnection } from '@nocobase/db';

import {
  accessOf as accessOfLevel,
  type CreateKnowledgeDocRequest,
  type KnowledgeAccess,
  type KnowledgeDoc,
  type KnowledgeSearchHit,
  type KnowledgeTree,
  type KnowledgeVersion,
  type MoveKnowledgeDocRequest,
  type SpaceRef,
  type UpdateKnowledgeDocRequest,
} from '../../shared/knowledge.js';
import { conflict, docNotFound, invalid, notFound } from '../errors.js';
import {
  chainOf,
  createAccessCheck,
  type AccessCheck,
  type KnowledgeReader,
} from './access.js';
import { passes, type SpaceGates } from './permissions.js';
import { readableDocs } from './readable.js';
import type { KnowledgeContext, KnowledgeTx } from './context.js';
import { currentFiles, versionFileInfo } from './file-info.js';
import {
  chunksById,
  excerptOf,
  fusedMax,
  fuseRankings,
  isCurrent,
  isoTime,
  liveDocs,
  termsOf,
  titleHolds,
  providerRanks,
  rerank,
  RRF_K,
  type KnowledgeSearchProvider,
  type KnowledgeSearchRank,
  type KnowledgeSearchReranker,
} from './search.js';
import {
  ancestorsOf,
  docsOf,
  docsRepo,
  entryCounts,
  findDoc,
  findDocBySlug,
  findSpaceById,
  filesOf,
  findVersion,
  json,
  num,
  pendingCounts,
  spaceKey,
  spacesOf,
  versionsRepo,
  type DocRecord,
  type SpaceRecord,
} from './store.js';
import { recallOf } from './tuning.js';
import * as check from './validate.js';
import {
  docSummary,
  docView,
  namesFor,
  versionView,
  type PersonRef,
} from './views.js';
import {
  appendVersion,
  checkParent,
  ensureSpace,
  freeSlug,
  insertDoc,
  nextSortOrder,
  refreshAclKeys,
} from './writes.js';

export interface DocumentService {
  tree(
    viewer: KnowledgeReader,
    space: SpaceRef,
    options?: { readonly archived?: boolean },
  ): Promise<KnowledgeTree>;
  get(viewer: KnowledgeReader, docId: string): Promise<KnowledgeDoc>;
  /** By id, or by slug in the nearest space of `space`'s view that has it. */
  resolve(
    viewer: KnowledgeReader,
    space: SpaceRef,
    ref: string,
  ): Promise<KnowledgeDoc>;
  versions(viewer: KnowledgeReader, docId: string): Promise<KnowledgeVersion[]>;
  version(
    viewer: KnowledgeReader,
    docId: string,
    version: number,
  ): Promise<KnowledgeVersion>;
  create(viewer: KnowledgeReader, input: unknown): Promise<KnowledgeDoc>;
  update(
    viewer: KnowledgeReader,
    docId: string,
    input: unknown,
  ): Promise<KnowledgeDoc>;
  move(
    viewer: KnowledgeReader,
    docId: string,
    input: unknown,
  ): Promise<KnowledgeDoc>;
  archive(viewer: KnowledgeReader, docId: string): Promise<KnowledgeDoc>;
  restore(viewer: KnowledgeReader, docId: string): Promise<KnowledgeDoc>;
  verify(viewer: KnowledgeReader, docId: string): Promise<KnowledgeDoc>;
  search(
    viewer: KnowledgeReader,
    space: SpaceRef,
    query: string,
    options?: {
      /** How many hits at most; the recall settings' `limit` by default. */
      readonly limit?: number;
      /** Adds how each hit was ranked, for someone who manages the space or the search settings. */
      readonly explain?: boolean;
    },
  ): Promise<KnowledgeSearchHit[]>;
}

/** Says an entry's searched sections changed (not a folder's, which has none). */
function emitChunks(tx: KnowledgeTx, doc: DocRecord, space: SpaceRef): void {
  if (doc.kind === 'folder') return;
  tx.emit({
    type: 'chunks.changed',
    docId: doc.id,
    version: num(doc.currentVersion),
    spaceId: doc.spaceId,
    space,
  });
}

/** The space a document is in, as a reference. */
export async function spaceOfDoc(
  context: KnowledgeContext,
  doc: DocRecord,
  conn: DatabaseConnection = context.read(),
): Promise<{ record: SpaceRecord; ref: SpaceRef }> {
  const record = await findSpaceById(conn, doc.spaceId);
  if (!record) throw docNotFound();
  return {
    record,
    ref: { scope: record.scope, scopeId: record.scopeId ?? '' },
  };
}

/** A document the viewer reads, with its space and what they may do with it; 404 otherwise. */
export async function readableDoc(
  context: KnowledgeContext,
  access: AccessCheck,
  docId: string,
): Promise<{ doc: DocRecord; space: SpaceRef; rights: KnowledgeAccess }> {
  const doc = await findDoc(context.read(), docId);
  if (!doc) throw docNotFound();
  const { ref } = await spaceOfDoc(context, doc);
  const rights = await access.requireDoc(doc, 'read');
  // Agents never see archived documents.
  if (doc.archivedAt && access.reader.actor) throw docNotFound();
  return { doc, space: ref, rights };
}

/** The ancestors of `doc` the reader reads, root first. */
export async function readableAncestors(
  access: AccessCheck,
  conn: DatabaseConnection,
  doc: DocRecord,
): Promise<DocRecord[]> {
  const shown: DocRecord[] = [];
  for (const parent of await ancestorsOf(conn, doc))
    if ((await access.doc(parent)).access.read) shown.push(parent);
  return shown;
}

export function createDocumentService(
  context: KnowledgeContext,
  providers: () => readonly KnowledgeSearchProvider[],
  rerankers: () => readonly KnowledgeSearchReranker[] = () => [],
): DocumentService {
  const resolverFor = (viewer: KnowledgeReader) =>
    createAccessCheck(context, viewer);
  const nowText = () => context.now().toISOString();

  async function view(
    access: AccessCheck,
    docId: string,
  ): Promise<KnowledgeDoc> {
    const { doc, space, rights } = await readableDoc(context, access, docId);
    const conn = context.read();
    const current = await findVersion(conn, doc.id, num(doc.currentVersion));
    const children = (
      await docsRepo(conn).findMany({
        filter: (f) =>
          f.and([
            f.string('parentId').eq(doc.id),
            f.date('archivedAt').empty(),
          ]),
      })
    ).length;
    const pending = (await pendingCounts(conn, [doc.id])).get(doc.id) ?? 0;
    const entries = (await entryCounts(conn, [doc.id])).get(doc.id) ?? 0;
    const names = await namesFor(context.access, [
      { kind: doc.updatedByKind, id: doc.updatedById },
      { kind: 'user', id: doc.verifiedById },
    ]);
    return docView(doc, space, current?.content ?? '', names, {
      children,
      pending,
      entries,
      breadcrumbs: await readableAncestors(access, conn, doc),
      access: rights,
      file: current
        ? await versionFileInfo(conn, context.urls, current, true)
        : null,
    });
  }

  async function editable(viewer: KnowledgeReader, docId: string) {
    const access = resolverFor(viewer);
    const doc = await findDoc(context.read(), docId);
    if (!doc) throw docNotFound();
    const { ref, record } = await spaceOfDoc(context, doc);
    await access.requireDoc(doc, 'edit');
    return { access, space: ref, spaceId: record.id };
  }

  function live(doc: DocRecord): DocRecord {
    if (doc.archivedAt)
      throw conflict(
        'KNOWLEDGE_ARCHIVED',
        'Archived documents are read-only; restore it first.',
      );
    return doc;
  }

  const service: DocumentService = {
    async tree(viewer, ref, options = {}) {
      const access = resolverFor(viewer);
      await access.requireRead(ref);
      const conn = context.read();
      const chain = chainOf(context.access, ref);
      const records = await spacesOf(conn, chain);
      const spaces: KnowledgeTree['spaces'][number][] = [];
      const people: PersonRef[] = [];
      const listed: {
        ref: SpaceRef;
        rights: KnowledgeAccess;
        docs: DocRecord[];
        acl: Awaited<ReturnType<AccessCheck['acl']>>;
      }[] = [];
      for (const space of chain) {
        const acl = await access.acl(space);
        if (!acl.sees) continue;
        const rights = await access.access(space);
        const record = records.get(spaceKey(space));
        const docs = record
          ? readableDocs(
              await docsOf(conn, [record.id], {
                archived: Boolean(options.archived),
              }),
              acl.gates,
            ).filter(
              // Archived entries only for whoever may restore them.
              (doc) =>
                !doc.archivedAt || accessOfLevel(acl.node(doc.id).level).edit,
            )
          : [];
        for (const doc of docs)
          people.push({ kind: doc.updatedByKind, id: doc.updatedById });
        listed.push({ ref: space, rights, docs, acl });
      }
      const all = listed.flatMap((entry) => entry.docs);
      const pending = await pendingCounts(
        conn,
        all.map((doc) => doc.id),
      );
      const entries = await entryCounts(
        conn,
        all.map((doc) => doc.id),
      );
      const children = new Map<string, number>();
      for (const doc of all)
        if (doc.parentId && !doc.archivedAt)
          children.set(doc.parentId, (children.get(doc.parentId) ?? 0) + 1);
      const names = await namesFor(context.access, people);
      const files = await currentFiles(conn, context.urls, all);
      for (const [index, entry] of listed.entries()) {
        const record = records.get(spaceKey(entry.ref));
        const title = await context.access.title(entry.ref);
        spaces.push({
          space: {
            id: record?.id ?? null,
            scope: entry.ref.scope,
            scopeId: entry.ref.scopeId,
            title,
            inherited: index > 0 || entry.ref.scope !== ref.scope,
            access: entry.rights,
          },
          docs: entry.docs.map((doc) =>
            docSummary(
              doc,
              entry.ref,
              names,
              { children, pending, entries },
              files.get(doc.id) ?? null,
              accessOfLevel(entry.acl.node(doc.id).level),
            ),
          ),
        });
      }
      return { spaces };
    },

    get: (viewer, docId) => view(resolverFor(viewer), docId),

    async resolve(viewer, ref, wanted) {
      const access = resolverFor(viewer);
      const key = wanted.trim();
      if (!key) throw invalid('INVALID_DOC', 'Name a document by slug or id.');
      const conn = context.read();
      const records = await spacesOf(conn, chainOf(context.access, ref));
      const chain = chainOf(context.access, ref);
      const byId = await findDoc(conn, key);
      if (
        byId &&
        chain.some((space) => records.get(spaceKey(space))?.id === byId.spaceId)
      )
        return view(access, byId.id);
      for (const space of chain) {
        const record = records.get(spaceKey(space));
        if (!record || !(await access.acl(space)).sees) continue;
        const doc = await findDocBySlug(conn, record.id, key);
        if (
          doc &&
          !(doc.archivedAt && viewer.actor) &&
          (await access.doc(doc)).access.read
        )
          return view(access, doc.id);
      }
      throw docNotFound();
    },

    async versions(viewer, docId) {
      const { doc } = await readableDoc(context, resolverFor(viewer), docId);
      const rows = await versionsRepo(context.read()).findMany({
        filter: { docId: doc.id },
        sort: (sort) => sort.field('version').desc(),
      });
      const names = await namesFor(
        context.access,
        rows.flatMap((row) => [
          { kind: row.authorKind, id: row.authorId },
          { kind: 'user', id: row.approvedById },
        ]),
      );
      const conn = context.read();
      const files = await filesOf(
        conn,
        rows.map((row) => row.fileId),
      );
      const views = [];
      for (const row of rows)
        views.push(
          versionView(
            row,
            names,
            false,
            row.fileId && files.has(row.fileId)
              ? await versionFileInfo(
                  conn,
                  context.urls,
                  row,
                  num(row.version) === num(doc.currentVersion),
                )
              : null,
          ),
        );
      return views;
    },

    async version(viewer, docId, wanted) {
      const number = check.version(wanted);
      const { doc } = await readableDoc(context, resolverFor(viewer), docId);
      const row = await findVersion(context.read(), doc.id, number);
      if (!row) throw notFound('Knowledge version', 'VERSION_NOT_FOUND');
      const names = await namesFor(context.access, [
        { kind: row.authorKind, id: row.authorId },
        { kind: 'user', id: row.approvedById },
      ]);
      return versionView(
        row,
        names,
        true,
        await versionFileInfo(
          context.read(),
          context.urls,
          row,
          number === num(doc.currentVersion),
        ),
      );
    },

    async create(viewer, raw) {
      const input = check.body(raw) as Partial<CreateKnowledgeDocRequest>;
      const ref = check.space(input, (space) => context.access.space(space));
      const access = resolverFor(viewer);
      await requireAddUnder(context, access, ref, input.parentId, 'edit');
      const kind = input.kind ?? 'article';
      if (kind !== 'article' && kind !== 'folder')
        throw invalid(
          'INVALID_KIND',
          'kind is article or folder; files are uploaded.',
        );
      const folder = kind === 'folder';
      const next = {
        title: check.title(input.title),
        summary: folder ? '' : check.summary(input.summary),
        content: folder ? '' : check.content(input.content ?? ''),
      };
      const wantedSlug =
        input.slug === undefined || input.slug === ''
          ? null
          : check.slug(input.slug);
      const id = await context.transaction(async (tx) => {
        const now = nowText();
        const space = await ensureSpace(context, tx.conn, ref, now);
        const parent = await checkParent(tx.conn, space.id, input.parentId);
        if (wantedSlug && (await findDocBySlug(tx.conn, space.id, wantedSlug)))
          throw conflict(
            'KNOWLEDGE_SLUG_TAKEN',
            `A document with slug ${wantedSlug} exists in this space.`,
          );
        const doc = await insertDoc(context, tx, {
          kind,
          space,
          parentId: parent?.id ?? null,
          slug:
            wantedSlug ??
            (await freeSlug(tx.conn, space.id, check.slugify(next.title))),
          sortOrder: await nextSortOrder(tx.conn, space.id, parent?.id ?? null),
          next,
          author: { kind: 'user', id: viewer.userId },
          createdById: viewer.userId,
          now,
        });
        return doc.id;
      });
      return view(access, id);
    },

    async update(viewer, docId, raw) {
      const input = check.body(raw) as Partial<UpdateKnowledgeDocRequest>;
      if (input.expectedVersion === undefined)
        throw invalid(
          'VERSION_REQUIRED',
          'expectedVersion is required: the version you edited.',
        );
      // A folder is at version 0.
      const expected =
        input.expectedVersion === 0
          ? 0
          : check.version(
              input.expectedVersion,
              'VERSION_REQUIRED',
              'expectedVersion',
            );
      const { access, space } = await editable(viewer, docId);
      const note = check.note(input.note);
      await context.transaction(async (tx) => {
        const doc = live((await findDoc(tx.conn, docId))!);
        if (doc.kind === 'folder') {
          // A folder has a name only, and no versions.
          if (input.title === undefined || input.title === doc.title) return;
          await docsRepo(tx.conn).updateMany({
            filter: { id: doc.id },
            values: { title: check.title(input.title), updatedAt: nowText() },
          });
          tx.emit({ type: 'doc.changed', docId: doc.id });
          return;
        }
        const current = await findVersion(
          tx.conn,
          doc.id,
          num(doc.currentVersion),
        );
        if (doc.kind === 'file') {
          if (input.content !== undefined)
            throw invalid(
              'INVALID_CONTENT',
              "A file's text comes from the file: replace the file instead.",
            );
          const title =
            input.title === undefined ? doc.title : check.title(input.title);
          const summary =
            input.summary === undefined
              ? doc.summary
              : check.summary(input.summary);
          if (
            num(doc.currentVersion) === expected &&
            title === doc.title &&
            summary === doc.summary
          )
            return;
          await appendVersion(
            context,
            tx,
            doc,
            space,
            expected,
            {
              title,
              summary,
              content: current?.content ?? '',
              ...(current?.fileId && current.parseStatus
                ? {
                    file: {
                      fileId: current.fileId,
                      sha256: current.contentHash,
                      parseStatus: current.parseStatus,
                      parseError: current.parseError,
                    },
                  }
                : {}),
            },
            { kind: 'user', id: viewer.userId, note },
            nowText(),
          );
          return;
        }
        await appendVersion(
          context,
          tx,
          doc,
          space,
          expected,
          {
            title:
              input.title === undefined ? doc.title : check.title(input.title),
            summary:
              input.summary === undefined
                ? doc.summary
                : check.summary(input.summary),
            content:
              input.content === undefined
                ? (current?.content ?? '')
                : check.content(input.content),
          },
          { kind: 'user', id: viewer.userId, note },
          nowText(),
        );
      });
      return view(access, docId);
    },

    async move(viewer, docId, raw) {
      const input = check.body(raw) as Partial<MoveKnowledgeDocRequest>;
      const { access, space, spaceId } = await editable(viewer, docId);
      // Where it goes, the reader must be able to add to.
      await requireAddUnder(context, access, space, input.parentId, 'edit');
      if (
        input.sortOrder !== undefined &&
        (typeof input.sortOrder !== 'number' ||
          !Number.isInteger(input.sortOrder))
      )
        throw invalid('INVALID_SORT_ORDER', 'sortOrder must be an integer.');
      await context.transaction(async (tx) => {
        const doc = live((await findDoc(tx.conn, docId))!);
        const parentId = input.parentId ?? null;
        // Not under itself or anything below it.
        for (let at = parentId; at;) {
          if (at === doc.id)
            throw conflict(
              'KNOWLEDGE_INVALID_MOVE',
              'A document cannot go under itself or one of its own.',
            );
          at = (await findDoc(tx.conn, at))?.parentId ?? null;
        }
        const height = await subtreeHeight(tx.conn, doc.id);
        const parent = await checkParent(
          tx.conn,
          doc.spaceId,
          parentId,
          height,
        );
        await docsRepo(tx.conn).updateMany({
          filter: { id: doc.id },
          values: {
            parentId: parent?.id ?? null,
            sortOrder:
              input.sortOrder ??
              (doc.parentId === (parent?.id ?? null)
                ? num(doc.sortOrder)
                : await nextSortOrder(
                    tx.conn,
                    doc.spaceId,
                    parent?.id ?? null,
                  )),
          },
        });
        // What it inherits is its new parent's.
        await refreshAclKeys(tx, spaceId, space);
        tx.emit({ type: 'doc.changed', docId: doc.id });
      });
      return view(access, docId);
    },

    async archive(viewer, docId) {
      const { access, space } = await editable(viewer, docId);
      await context.transaction(async (tx) => {
        const doc = (await findDoc(tx.conn, docId))!;
        if (doc.archivedAt) return;
        const children = await docsRepo(tx.conn).findMany({
          filter: (f) =>
            f.and([
              f.string('parentId').eq(doc.id),
              f.date('archivedAt').empty(),
            ]),
          limit: 1,
        });
        if (children.length > 0)
          throw conflict(
            'KNOWLEDGE_HAS_CHILDREN',
            'Archive or move its sub-documents first.',
          );
        await docsRepo(tx.conn).updateMany({
          filter: { id: doc.id },
          values: { archivedAt: nowText() },
        });
        tx.emit({ type: 'doc.changed', docId: doc.id });
        // Its sections leave search: an index of the application's own drops them.
        emitChunks(tx, doc, space);
      });
      return view(access, docId);
    },

    async restore(viewer, docId) {
      const { access, space, spaceId } = await editable(viewer, docId);
      await context.transaction(async (tx) => {
        const doc = (await findDoc(tx.conn, docId))!;
        if (!doc.archivedAt) return;
        const parent = doc.parentId
          ? await findDoc(tx.conn, doc.parentId)
          : null;
        await docsRepo(tx.conn).updateMany({
          filter: { id: doc.id },
          values: {
            archivedAt: null,
            // Under a parent still archived, or gone, it comes back at the root.
            ...(doc.parentId && (!parent || parent.archivedAt)
              ? { parentId: null }
              : {}),
          },
        });
        if (doc.parentId && (!parent || parent.archivedAt))
          await refreshAclKeys(tx, spaceId, space);
        tx.emit({ type: 'doc.changed', docId: doc.id });
        emitChunks(tx, doc, space);
      });
      return view(access, docId);
    },

    async verify(viewer, docId) {
      const { access } = await editable(viewer, docId);
      await context.transaction(async (tx) => {
        const doc = live((await findDoc(tx.conn, docId))!);
        if (doc.kind === 'folder')
          throw invalid('INVALID_KIND', 'A folder is not verified.');
        await docsRepo(tx.conn).updateMany({
          filter: { id: docId },
          values: { verifiedAt: nowText(), verifiedById: viewer.userId },
        });
        tx.emit({ type: 'doc.changed', docId });
      });
      return view(access, docId);
    },

    async search(viewer, ref, query, options = {}) {
      const access = resolverFor(viewer);
      const rights = await access.requireRead(ref);
      const recall = await recallOf(context);
      const explain =
        options.explain === true &&
        ((rights.manage && !viewer.actor) ||
          ((await context.settings().mayExplain?.(viewer)) ?? false));
      const conn = context.read();
      const chain = chainOf(context.access, ref);
      const records = await spacesOf(conn, chain);
      const readable: {
        ref: SpaceRef;
        id: string;
        inherited: boolean;
        gates: SpaceGates;
      }[] = [];
      for (const [index, space] of chain.entries()) {
        const record = records.get(spaceKey(space));
        const acl = await access.acl(space);
        if (record && acl.sees && acl.gates)
          readable.push({
            ref: space,
            id: record.id,
            inherited: index > 0,
            gates: acl.gates,
          });
      }
      const limit = Math.min(Math.max(options.limit ?? recall.limit, 1), 100);
      if (readable.length === 0 || !query.trim()) return [];
      const spaces = readable.map((space) => ({
        id: space.id,
        ref: space.ref,
        gates: space.gates,
      }));
      const rankings = await Promise.all(
        providers().map(async (provider) => {
          try {
            return await provider.search(spaces, query, {
              limit: Math.min(
                Math.max(limit * 2, recall.rerankCandidates),
                200,
              ),
            });
          } catch (error) {
            context.onError(
              `The knowledge search provider ${provider.name} failed.`,
              error,
            );
            return [];
          }
        }),
      );
      // Only sections the reader reads now, of live entries at their current versions, are ranked: whatever a
      // provider's index says, each section's space and access key are checked again against the reader's gates.
      const chunks = await chunksById(conn, [
        ...new Set(rankings.flat().map((rank) => rank.chunkId)),
      ]);
      const docs = await liveDocs(conn, [...chunks.values()]);
      const gatesOf = new Map(spaces.map((space) => [space.id, space.gates]));
      const admitted = (rank: KnowledgeSearchRank) => {
        const chunk = chunks.get(rank.chunkId);
        if (chunk === undefined || !isCurrent(docs, chunk)) return false;
        const doc = docs.get(chunk.docId)!;
        const gates = gatesOf.get(doc.spaceId);
        return (
          gates !== undefined &&
          doc.spaceId === chunk.spaceId &&
          passes(gates, doc) &&
          passes(gates, chunk)
        );
      };
      const terms = termsOf(query);
      const admittedRankings = rankings.map((ranking) =>
        ranking.filter(admitted),
      );
      const names = providers().map((provider) => provider.name);
      const own = providerRanks(names, admittedRankings);
      const weights = names.map((name) => recall.weights[name] ?? 1);
      const max = fusedMax(admittedRankings, RRF_K, weights);
      const normalized = (score: number) => (max > 0 ? score / max : 0);
      let fused: { chunkId: string; score: number; reranked: number | null }[] =
        fuseRankings(admittedRankings, RRF_K, weights)
          .filter((rank) => normalized(rank.score) >= recall.minScore)
          .map((rank) => ({ ...rank, reranked: null }));
      fused = await rerank(
        rerankers(),
        query,
        fused,
        (chunkId) => chunks.get(chunkId)?.text ?? '',
        context.onError,
        recall.rerankCandidates,
      );
      const weightOf = new Map(
        names.map((name, index) => [name, weights[index] ?? 1]),
      );
      return fused.slice(0, limit).map(({ chunkId, score, reranked }) => {
        const chunk = chunks.get(chunkId)!;
        const doc = docs.get(chunk.docId)!;
        const space = readable.find((entry) => entry.id === doc.spaceId)!;
        return {
          docId: doc.id,
          kind: doc.kind,
          slug: doc.slug,
          title: doc.title,
          version: num(doc.currentVersion),
          scope: space.ref.scope,
          scopeId: space.ref.scopeId,
          inherited: space.inherited,
          headingPath: json<string[]>(chunk.headingPath, []),
          anchor: chunk.anchor,
          lines: [num(chunk.lineStart), num(chunk.lineEnd)] as const,
          excerpt: excerptOf(chunk.text, terms),
          titleMatch: titleHolds(doc.title, terms),
          updatedAt: isoTime(doc.updatedAt),
          score,
          providers: own.get(chunkId) ?? [],
          reranked,
          ...(explain
            ? {
                explain: {
                  normalized: normalized(score),
                  providers: (own.get(chunkId) ?? []).map((rank) => ({
                    ...rank,
                    weight: weightOf.get(rank.name) ?? 1,
                  })),
                  reranked,
                },
              }
            : {}),
        };
      });
    },
  };
  return service;
}

/** How many levels a document and the documents below it take: 1 for a leaf. */
async function subtreeHeight(
  conn: ReturnType<KnowledgeContext['read']>,
  docId: string,
): Promise<number> {
  const children = await docsRepo(conn).findMany({
    filter: { parentId: docId },
  });
  let height = 0;
  for (const child of children)
    height = Math.max(height, await subtreeHeight(conn, child.id));
  return height + 1;
}

/**
 * What adding under `parentId` in `space` takes: `need` on the parent (a reader who does not read it learns only that
 * the parent is not valid), or on the space itself at the top.
 */
export async function requireAddUnder(
  context: KnowledgeContext,
  access: AccessCheck,
  space: SpaceRef,
  parentId: string | null | undefined,
  need: 'propose' | 'edit',
): Promise<KnowledgeAccess> {
  await access.requireRead(space);
  const parent = parentId ? await findDoc(context.read(), parentId) : null;
  if (!parent) return access.requireUnder(space, null, need);
  const found = await access.doc(parent);
  const same =
    found.space.scope === space.scope && found.space.scopeId === space.scopeId;
  // A parent in another space is refused where the parent is checked; one the reader may not see, as missing.
  if (!same) return access.requireUnder(space, null, need);
  if (!found.access.read)
    throw invalid(
      'INVALID_PARENT',
      'The parent must be a document in the same space.',
      'parentId',
    );
  return access.requireUnder(space, parent, need);
}
