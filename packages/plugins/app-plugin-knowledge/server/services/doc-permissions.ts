/**
 * A node's permissions as people manage them (`docs/permissions.md`): its mode and entries with what it inherits from
 * where, for whoever manages it; replacing them, which recomputes the space's access keys in the same transaction; the
 * viewer's own access to a node and where it comes from; and the subjects to grant, from the application's providers.
 */
import {
  KNOWLEDGE_GRANT_LEVELS,
  levelRank,
  accessOf,
  type KnowledgeAccessMode,
  type KnowledgeAccessSource,
  type KnowledgeEffectiveAccess,
  type KnowledgeGrantLevel,
  type KnowledgeInheritedGrant,
  type KnowledgePermissionEntry,
  type KnowledgePermissions,
  type KnowledgeSubject,
  type KnowledgeSubjectType,
  type SpaceRef,
} from '../../shared/knowledge.js';
import { docNotFound, forbidden, invalid } from '../errors.js';
import { createAccessCheck, type KnowledgeReader } from './access.js';
import type { KnowledgeContext } from './context.js';
import { spaceOfDoc } from './documents.js';
import {
  accessRepo,
  ancestorsOf,
  docsRepo,
  findDoc,
  type AccessEntryRecord,
  type DocRecord,
} from './store.js';
import { subjectKey } from './subjects.js';
import * as check from './validate.js';
import { refreshAclKeys } from './writes.js';

/** At most this many entries on one node. */
export const KNOWLEDGE_ENTRIES_MAX = 200;
/** At most this many subjects a search answers. */
const SUBJECTS_MAX = 50;

export interface PermissionService {
  /** 404 unless the viewer reads the node, 403 unless they manage it: what a change is checked against first. */
  authorize(viewer: KnowledgeReader, docId: string): Promise<void>;
  /** A node's mode, entries and what it inherits from where; for whoever manages it. */
  get(viewer: KnowledgeReader, docId: string): Promise<KnowledgePermissions>;
  /** Replaces a node's mode and entries (`ReplaceKnowledgePermissionsRequest`); for whoever manages it. */
  replace(
    viewer: KnowledgeReader,
    docId: string,
    input: unknown,
  ): Promise<KnowledgePermissions>;
  /** The viewer's access to a node they read, and where it comes from. */
  effective(
    viewer: KnowledgeReader,
    docId: string,
  ): Promise<KnowledgeEffectiveAccess>;
  /** Subjects to grant in a space, for someone who manages something in it. */
  subjects(
    viewer: KnowledgeReader,
    space: SpaceRef,
    q: string,
    options?: { readonly type?: string; readonly limit?: number },
  ): Promise<{
    readonly subjects: KnowledgeSubject[];
    readonly types: KnowledgeSubjectType[];
  }>;
}

const byLevel = (a: KnowledgePermissionEntry, b: KnowledgePermissionEntry) =>
  levelRank(b.level) - levelRank(a.level);

export function createPermissionService(
  context: KnowledgeContext,
): PermissionService {
  const accessFor = (viewer: KnowledgeReader) =>
    createAccessCheck(context, viewer);

  async function entriesOf(
    docIds: readonly string[],
  ): Promise<Map<string, AccessEntryRecord[]>> {
    const found = new Map<string, AccessEntryRecord[]>();
    if (docIds.length === 0) return found;
    const rows = await accessRepo(context.read()).findMany({
      filter: (f) => f.or(docIds.map((id) => f.string('docId').eq(id))),
      sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
    });
    for (const row of rows) {
      const list = found.get(row.docId) ?? [];
      list.push(row);
      found.set(row.docId, list);
    }
    return found;
  }

  /** The node's permissions as `get` answers them, without asking who may see them. */
  async function viewOf(
    doc: DocRecord,
    space: SpaceRef,
  ): Promise<KnowledgePermissions> {
    const conn = context.read();
    const ancestors = (await ancestorsOf(conn, doc)).reverse();
    const own = await entriesOf([doc.id, ...ancestors.map((node) => node.id)]);
    const labels = await context.subjects.describe(
      [...own.values()]
        .flat()
        .map((entry) => ({ type: entry.subjectType, id: entry.subjectId })),
      space,
    );
    const entriesFor = (id: string): KnowledgePermissionEntry[] =>
      (own.get(id) ?? [])
        .map((entry) => ({
          subject: labels.get(
            subjectKey({ type: entry.subjectType, id: entry.subjectId }),
          )!,
          level: entry.level,
        }))
        .sort(byLevel);
    const mode: KnowledgeAccessMode =
      doc.accessMode === 'custom' ? 'custom' : 'inherit';
    const inherited: KnowledgeInheritedGrant[] = [];
    if (mode === 'inherit') {
      let stopped = false;
      for (const ancestor of ancestors) {
        const entries = entriesFor(ancestor.id);
        const custom = ancestor.accessMode === 'custom';
        if (entries.length > 0 || custom)
          inherited.push({
            from: {
              kind: 'doc',
              id: ancestor.id,
              title: ancestor.title,
              mode: custom ? 'custom' : 'inherit',
            },
            entries,
          });
        if (custom) {
          stopped = true;
          break;
        }
      }
      if (!stopped) inherited.push({ from: { kind: 'space' }, entries: [] });
    }
    return {
      docId: doc.id,
      mode,
      entries: entriesFor(doc.id),
      inherited,
      types: context.subjects.types(),
    };
  }

  async function managed(viewer: KnowledgeReader, docId: string) {
    const doc = await findDoc(context.read(), docId);
    if (!doc) throw docNotFound();
    const access = accessFor(viewer);
    await access.requireDoc(doc, 'manage');
    const { record, ref } = await spaceOfDoc(context, doc);
    return { doc, space: ref, spaceId: record.id };
  }

  /** The entries a replacement asks for, checked: known types, valid levels, no subject twice, known subjects. */
  async function entriesFrom(
    raw: unknown,
    space: SpaceRef,
    kept: ReadonlySet<string>,
  ): Promise<{ type: string; id: string; level: KnowledgeGrantLevel }[]> {
    if (!Array.isArray(raw))
      throw invalid('INVALID_ENTRIES', 'entries must be a list.', 'entries');
    if (raw.length > KNOWLEDGE_ENTRIES_MAX)
      throw invalid(
        'INVALID_ENTRIES',
        `A node has at most ${KNOWLEDGE_ENTRIES_MAX} entries.`,
        'entries',
      );
    const seen = new Set<string>();
    const entries: { type: string; id: string; level: KnowledgeGrantLevel }[] =
      [];
    for (const [index, item] of (raw as unknown[]).entries()) {
      const field = `entries.${index}`;
      const entry = (item ?? {}) as {
        subject?: { type?: unknown; id?: unknown };
        level?: unknown;
      };
      const type = entry.subject?.type;
      const id = entry.subject?.id;
      if (typeof type !== 'string' || !context.subjects.get(type))
        throw invalid(
          'INVALID_SUBJECT',
          `Subjects of type ${String(type)} cannot be granted.`,
          `${field}.subject.type`,
        );
      if (typeof id !== 'string' || id.length === 0 || id.length > 128)
        throw invalid(
          'INVALID_SUBJECT',
          'A subject id has 1 to 128 characters.',
          `${field}.subject.id`,
        );
      if (
        typeof entry.level !== 'string' ||
        !KNOWLEDGE_GRANT_LEVELS.includes(entry.level as KnowledgeGrantLevel)
      )
        throw invalid(
          'INVALID_LEVEL',
          'level is read, propose, edit or manage.',
          `${field}.level`,
        );
      const key = subjectKey({ type, id });
      if (seen.has(key))
        throw invalid(
          'DUPLICATE_SUBJECT',
          `${key} is granted twice.`,
          `${field}.subject`,
        );
      seen.add(key);
      entries.push({ type, id, level: entry.level as KnowledgeGrantLevel });
    }
    // A subject the application does not know is refused, unless the node already names it (a person since removed).
    const labels = await context.subjects.describe(entries, space);
    for (const [index, entry] of entries.entries()) {
      const key = subjectKey(entry);
      if (labels.get(key)?.known === false && !kept.has(key))
        throw invalid(
          'INVALID_SUBJECT',
          `${key} is not a subject this application knows.`,
          `entries.${index}.subject.id`,
        );
    }
    return entries;
  }

  return {
    async authorize(viewer, docId) {
      await managed(viewer, docId);
    },

    async get(viewer, docId) {
      const { doc, space } = await managed(viewer, docId);
      return viewOf(doc, space);
    },

    async replace(viewer, docId, raw) {
      const { doc, space, spaceId } = await managed(viewer, docId);
      const input = check.body(raw);
      if (input.mode !== 'inherit' && input.mode !== 'custom')
        throw invalid('INVALID_MODE', 'mode is inherit or custom.', 'mode');
      const mode: KnowledgeAccessMode = input.mode;
      const kept = new Set(
        (await entriesOf([doc.id]))
          .get(doc.id)
          ?.map((entry) =>
            subjectKey({ type: entry.subjectType, id: entry.subjectId }),
          ) ?? [],
      );
      const entries = await entriesFrom(input.entries, space, kept);
      await context.transaction(async (tx) => {
        const now = context.now().toISOString();
        await accessRepo(tx.conn).deleteMany({ filter: { docId: doc.id } });
        for (const entry of entries)
          await accessRepo(tx.conn).createOne({
            values: {
              id: context.newId(),
              docId: doc.id,
              spaceId,
              subjectType: entry.type,
              subjectId: entry.id,
              level: entry.level,
              createdById: viewer.userId,
              createdAt: now,
            },
          });
        await docsRepo(tx.conn).updateMany({
          filter: { id: doc.id },
          values: { accessMode: mode },
        });
        await refreshAclKeys(tx, spaceId, space);
        tx.emit({ type: 'doc.changed', docId: doc.id });
      });
      // Answered whatever the change left the viewer: they may have narrowed their own access.
      return viewOf((await findDoc(context.read(), doc.id))!, space);
    },

    async effective(viewer, docId) {
      const doc = await findDoc(context.read(), docId);
      if (!doc) throw docNotFound();
      const access = accessFor(viewer);
      await access.requireDoc(doc, 'read');
      if (doc.archivedAt && viewer.actor) throw docNotFound();
      const { node, space } = await access.doc(doc);
      const conn = context.read();
      let source: KnowledgeAccessSource;
      if (node.source.kind === 'entry') {
        const { docId: from, subjectType, subjectId } = node.source;
        const labels = await context.subjects.describe(
          [{ type: subjectType, id: subjectId }],
          space,
        );
        source = {
          kind: 'entry',
          docId: from,
          docTitle:
            from === doc.id
              ? doc.title
              : ((await findDoc(conn, from))?.title ?? ''),
          subject: labels.get(
            subjectKey({ type: subjectType, id: subjectId }),
          )!,
        };
      } else source = node.source;
      let restrictedBy: KnowledgeEffectiveAccess['restrictedBy'] = null;
      for (const at of [doc, ...(await ancestorsOf(conn, doc)).reverse()])
        if (at.accessMode === 'custom') {
          restrictedBy = { id: at.id, title: at.title };
          break;
        }
      return {
        docId: doc.id,
        level: node.level,
        access: accessOf(node.level),
        source,
        mode: doc.accessMode === 'custom' ? 'custom' : 'inherit',
        entryCount: (await entriesOf([doc.id])).get(doc.id)?.length ?? 0,
        restrictedBy,
      };
    },

    async subjects(viewer, space, q, options = {}) {
      const access = accessFor(viewer);
      await access.requireRead(space);
      if (!(await access.acl(space)).manages)
        throw forbidden('You may not change who may access anything here.');
      const limit = Math.min(Math.max(options.limit ?? 20, 1), SUBJECTS_MAX);
      const providers = context.subjects
        .list()
        .filter((provider) => !options.type || provider.type === options.type);
      const found: KnowledgeSubject[] = [];
      for (const provider of providers) {
        try {
          for (const subject of await provider.search(q.trim(), {
            space,
            limit,
          }))
            found.push({ ...subject, type: provider.type, known: true });
        } catch (error) {
          context.onError(
            `The knowledge subject provider ${provider.type} failed.`,
            error,
          );
        }
      }
      return { subjects: found, types: context.subjects.types() };
    },
  };
}
