/**
 * Who may do what in a space, and on each folder and article in it. The plugin keeps no roles and knows no spaces of its
 * own: the application binds a `KnowledgeAccessResolver` (`knowledgeAccessToken`) that names its spaces, what each
 * inherits, and what a reader may do in each; below that, entries narrow or widen it node by node
 * (`permissions.ts`, `docs/permissions.md`), naming subjects the application's providers resolve (`subjects.ts`).
 * Every read, search and export takes a reader and asks first; nothing is read without one.
 *
 * Whatever the application answers, an actor that is not a person (an agent acting for someone) never edits, manages
 * or decides: it reads and proposes within what the person it acts for may.
 */
import type { DatabaseConnection } from '@nocobase/db';

import {
  accessOf,
  levelOf,
  levelRank,
  type KnowledgeAccess,
  type KnowledgeLevel,
  type SpaceRef,
} from '../../shared/knowledge.js';
import {
  docNotFound,
  forbidden,
  notFound,
  type KnowledgeError,
} from '../errors.js';
import {
  evaluateNodes,
  keyedNodes,
  spaceLevelFor,
  type AclEntry,
  type NodeAccess,
  type SpaceGates,
} from './permissions.js';
import {
  accessRepo,
  docsRepo,
  findSpace,
  findSpaceById,
  type DocRecord,
} from './store.js';
import type { KnowledgeSubjects } from './subjects.js';

const spaceNotFound = () => notFound('Knowledge space', 'SPACE_NOT_FOUND');

/** Who is asking: a person, or an actor (an application-defined kind, such as an agent) acting for one. */
export interface KnowledgeReader {
  readonly userId: string;
  readonly actor?: {
    readonly kind: string;
    readonly id: string;
    /** The run it works in: a run proposes at most `KNOWLEDGE_PROPOSALS_PER_RUN` times. */
    readonly runId?: string;
  };
}

/** What the application answers for one reader during one request. */
export interface KnowledgeReaderAccess {
  /** What the reader may do in `space`. */
  access(space: SpaceRef): Promise<KnowledgeAccess>;
}

/** The application's spaces and their access, bound to `knowledgeAccessToken`. */
export interface KnowledgeAccessResolver {
  /** `space` in its normal form when the application has such a space; null otherwise (400 `INVALID_SCOPE`). */
  space(space: SpaceRef): SpaceRef | null;
  /** The spaces `space` inherits, nearest first, without itself. */
  inherits(space: SpaceRef): readonly SpaceRef[];
  /** Answers for one reader; it may cache what it reads for as long as the request lasts. */
  forReader(reader: KnowledgeReader): KnowledgeReaderAccess;
  /** A space's title whoever asks (a project's name); null without one. */
  title(space: SpaceRef): Promise<string | null>;
  /** Display names of people (`user`) and actors (by their kind), keyed `kind:id`; unknown ones are left out. */
  names(
    refs: readonly { readonly kind: string; readonly id: string }[],
  ): Promise<ReadonlyMap<string, string>>;
}

const NONE: KnowledgeAccess = {
  read: false,
  propose: false,
  edit: false,
  manage: false,
};

/** No spaces and no access: what the plugin answers until the application binds its resolver. */
export const NO_ACCESS: KnowledgeAccessResolver = {
  space: () => null,
  inherits: () => [],
  forReader: () => ({ access: () => Promise.resolve(NONE) }),
  title: () => Promise.resolve(null),
  names: () => Promise.resolve(new Map()),
};

/** The spaces a space's view shows: itself, then what it inherits. */
export function chainOf(
  resolver: Pick<KnowledgeAccessResolver, 'inherits'>,
  space: SpaceRef,
): SpaceRef[] {
  return [space, ...resolver.inherits(space)];
}

/** What an access check reads through. */
export interface AccessContext {
  readonly access: KnowledgeAccessResolver;
  readonly subjects: KnowledgeSubjects;
  read(): DatabaseConnection;
}

/** A reader's access to one space and every node in it, read once per request. */
export interface SpaceAcl {
  readonly ref: SpaceRef;
  /** Null when the space has no entries yet. */
  readonly spaceId: string | null;
  /** The space's own level for the reader. */
  readonly level: KnowledgeLevel;
  /** A node's level and where it comes from; a node not in the space gets the space's. */
  node(docId: string): NodeAccess;
  /** What the reader reads here; null when the space has no entries yet. */
  readonly gates: SpaceGates | null;
  /** Whether the reader reads anything here: the space, or a node in it. */
  readonly sees: boolean;
  /** Whether the reader manages anything here: the space, or a node in it. */
  readonly manages: boolean;
}

export type DocNeed = 'read' | 'propose' | 'edit' | 'manage';

/** Answers access questions for one reader, asking the application once per space. */
export interface AccessCheck {
  readonly reader: KnowledgeReader;
  /** What the reader may do in the space itself. */
  access(space: SpaceRef): Promise<KnowledgeAccess>;
  /** The reader's access to the space and its nodes. */
  acl(space: SpaceRef): Promise<SpaceAcl>;
  /**
   * `hidden()` unless the reader reads something in the space (the space, or a node of it): `SPACE_NOT_FOUND` by
   * default, or what the caller looked up through the space, so a hidden one answers the same as a missing one.
   */
  requireRead(
    space: SpaceRef,
    hidden?: () => KnowledgeError,
  ): Promise<KnowledgeAccess>;
  /** 403 unless the reader may edit the space itself (`hidden()` unless they read something in it). */
  requireEdit(
    space: SpaceRef,
    hidden?: () => KnowledgeError,
  ): Promise<KnowledgeAccess>;
  /** What the reader may do with a node, and where it comes from. */
  doc(doc: DocRecord): Promise<{
    readonly access: KnowledgeAccess;
    readonly node: NodeAccess;
    readonly space: SpaceRef;
  }>;
  /** `hidden()` (404 by default) unless the reader reads the node; 403 unless they hold `need` on it. */
  requireDoc(
    doc: DocRecord,
    need: DocNeed,
    hidden?: () => KnowledgeError,
  ): Promise<KnowledgeAccess>;
  /**
   * What adding under `parent` takes: `need` on the parent, or on the space itself at the top. 403 without it (404 for
   * a parent the reader does not read).
   */
  requireUnder(
    space: SpaceRef,
    parent: DocRecord | null,
    need: 'propose' | 'edit',
  ): Promise<KnowledgeAccess>;
}

const keyOf = (space: SpaceRef) => `${space.scope}:${space.scopeId}`;

const refusal = (reader: KnowledgeReader, need: DocNeed) =>
  forbidden(
    reader.actor && (need === 'edit' || need === 'manage')
      ? 'Agents do not edit knowledge; propose the change instead.'
      : need === 'manage'
        ? 'You may not change who may access this.'
        : need === 'propose'
          ? 'You may not propose knowledge changes here.'
          : 'You may not change the knowledge here.',
  );

export function createAccessCheck(
  context: AccessContext,
  reader: KnowledgeReader,
): AccessCheck {
  const answers = context.access.forReader(reader);
  const actor = Boolean(reader.actor);
  const known = new Map<string, Promise<KnowledgeAccess>>();
  const acls = new Map<string, Promise<SpaceAcl>>();
  const refs = new Map<string, Promise<SpaceRef | null>>();

  const access = (space: SpaceRef): Promise<KnowledgeAccess> => {
    const key = keyOf(space);
    let found = known.get(key);
    if (!found) {
      found = answers
        .access(space)
        .then((answer) =>
          accessOf(spaceLevelFor(levelOf({ ...NONE, ...answer }), actor)),
        );
      known.set(key, found);
    }
    return found;
  };

  async function load(space: SpaceRef): Promise<SpaceAcl> {
    const level = levelOf(await access(space));
    const conn = context.read();
    const record = await findSpace(conn, space);
    const flat = (spaceId: string | null): SpaceAcl => ({
      ref: space,
      spaceId,
      level,
      node: () =>
        level === 'none'
          ? { level, source: { kind: 'none' } }
          : { level, source: { kind: 'space' } },
      gates: spaceId
        ? { spaceId, space: levelRank(level) >= 1, nodes: [] }
        : null,
      sees: levelRank(level) >= 1,
      manages: level === 'manage',
    });
    if (!record) return flat(null);
    const entries: AclEntry[] = await accessRepo(conn).findMany({
      filter: { spaceId: record.id },
    });
    const custom = await docsRepo(conn).findMany({
      filter: { spaceId: record.id, accessMode: 'custom' },
      select: (select) => select.fields('id'),
      limit: 1,
    });
    if (entries.length === 0 && custom.length === 0) return flat(record.id);
    const nodes = await docsRepo(conn).findMany({
      filter: { spaceId: record.id },
      select: (select) => select.fields('id', 'parentId', 'accessMode'),
    });
    const parties = [
      await context.subjects.keysOf({ kind: 'user', id: reader.userId }, space),
      ...(reader.actor
        ? [
            await context.subjects.keysOf(
              { kind: reader.actor.kind, id: reader.actor.id },
              space,
            ),
          ]
        : []),
    ];
    const evaluated = evaluateNodes({
      nodes,
      entries,
      space: level,
      parties,
      actor,
    });
    const keyed = keyedNodes(nodes, entries);
    const readable = [...keyed].filter(
      (id) => levelRank(evaluated.get(id)?.level ?? 'none') >= 1,
    );
    const fallback: NodeAccess =
      level === 'none'
        ? { level, source: { kind: 'none' } }
        : { level, source: { kind: 'space' } };
    return {
      ref: space,
      spaceId: record.id,
      level,
      node: (docId) => evaluated.get(docId) ?? fallback,
      gates: {
        spaceId: record.id,
        space: levelRank(level) >= 1,
        nodes: readable,
      },
      sees: levelRank(level) >= 1 || readable.length > 0,
      manages:
        level === 'manage' ||
        [...evaluated.values()].some((node) => node.level === 'manage'),
    };
  }

  const acl = (space: SpaceRef): Promise<SpaceAcl> => {
    const key = keyOf(space);
    let found = acls.get(key);
    if (!found) {
      found = load(space);
      acls.set(key, found);
    }
    return found;
  };

  const refOfSpaceId = (spaceId: string): Promise<SpaceRef | null> => {
    let found = refs.get(spaceId);
    if (!found) {
      found = findSpaceById(context.read(), spaceId).then((record) =>
        record ? { scope: record.scope, scopeId: record.scopeId ?? '' } : null,
      );
      refs.set(spaceId, found);
    }
    return found;
  };

  const check: AccessCheck = {
    reader,
    access,
    acl,
    async requireRead(space, hidden = spaceNotFound) {
      const found = await acl(space);
      if (!found.sees) throw hidden();
      return access(space);
    },
    async requireEdit(space, hidden) {
      const rights = await check.requireRead(space, hidden);
      if (!rights.edit) throw refusal(reader, 'edit');
      return rights;
    },
    async doc(doc) {
      const space = await refOfSpaceId(doc.spaceId);
      if (!space) throw docNotFound();
      const node = (await acl(space)).node(doc.id);
      return { access: accessOf(node.level), node, space };
    },
    async requireDoc(doc, need, hidden = docNotFound) {
      const { access: rights } = await check.doc(doc);
      if (!rights.read) throw hidden();
      if (!rights[need]) throw refusal(reader, need);
      return rights;
    },
    async requireUnder(space, parent, need) {
      if (parent) return check.requireDoc(parent, need);
      const rights = await check.requireRead(space);
      if (!rights[need]) throw refusal(reader, need);
      return rights;
    },
  };
  return check;
}
