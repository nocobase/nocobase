/**
 * How access to folders and articles is evaluated (`docs/permissions.md`), as pure functions over a space's nodes and
 * entries: a node in `inherit` mode takes its parent's level (the space's at the root) plus its own entries, the highest
 * winning; a node in `custom` mode takes its own entries alone. Whoever manages the space manages every node. An actor
 * acting for a person is evaluated with its own subjects and with the person's, and gets the lower of the two, capped
 * at `propose`.
 *
 * Retrieval filters by access keys: a node's `aclKey` is its nearest ancestor-or-self with entries or in `custom` mode
 * (null: the space's access decides), and the gate of a section is `space:<spaceId>` or `node:<aclKey>`.
 */
import type { FilterBuilder, FilterNode } from '@nocobase/db';

import type {
  KnowledgeAccessMode,
  KnowledgeGrantLevel,
  KnowledgeLevel,
} from '../../shared/knowledge.js';
import { levelRank } from '../../shared/knowledge.js';
import { subjectKey } from './subjects.js';

/** A node as evaluation needs it. */
export interface AclNode {
  readonly id: string;
  readonly parentId: string | null;
  readonly accessMode: KnowledgeAccessMode;
}

/** An entry as evaluation needs it. */
export interface AclEntry {
  readonly docId: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly level: KnowledgeGrantLevel;
}

/** Where a level comes from, before the subject and the node are labelled. */
export type AclSource =
  | { readonly kind: 'none' }
  | { readonly kind: 'space' }
  | { readonly kind: 'manager' }
  | {
      readonly kind: 'entry';
      readonly docId: string;
      readonly subjectType: string;
      readonly subjectId: string;
    };

export interface NodeAccess {
  readonly level: KnowledgeLevel;
  readonly source: AclSource;
}

export interface EvaluateInput {
  readonly nodes: readonly AclNode[];
  readonly entries: readonly AclEntry[];
  /** The space's default level for the reader. */
  readonly space: KnowledgeLevel;
  /** The subject keys (`type:id`) of each party: the person, and the actor acting for them when there is one. */
  readonly parties: readonly ReadonlySet<string>[];
  /** An actor (not a person): capped at `propose`, and never a manager. */
  readonly actor: boolean;
}

const NONE: NodeAccess = { level: 'none', source: { kind: 'none' } };

const higher = (a: NodeAccess, b: NodeAccess): NodeAccess =>
  levelRank(b.level) > levelRank(a.level) ? b : a;

const lower = (a: NodeAccess, b: NodeAccess): NodeAccess =>
  levelRank(b.level) < levelRank(a.level) ? b : a;

/** The lower of two levels. */
export function minLevel(a: KnowledgeLevel, b: KnowledgeLevel): KnowledgeLevel {
  return levelRank(a) <= levelRank(b) ? a : b;
}

/** Each node's level for the reader, and where it comes from. */
export function evaluateNodes(input: EvaluateInput): Map<string, NodeAccess> {
  const result = new Map<string, NodeAccess>();
  if (!input.actor && input.space === 'manage') {
    for (const node of input.nodes)
      result.set(node.id, { level: 'manage', source: { kind: 'manager' } });
    return result;
  }
  const byId = new Map(input.nodes.map((node) => [node.id, node]));
  const own = new Map<string, AclEntry[]>();
  for (const entry of input.entries) {
    const list = own.get(entry.docId) ?? [];
    list.push(entry);
    own.set(entry.docId, list);
  }
  const root: NodeAccess =
    input.space === 'none'
      ? NONE
      : { level: input.space, source: { kind: 'space' } };

  const evaluate = (subjects: ReadonlySet<string>) => {
    const memo = new Map<string, NodeAccess>();
    const at = (id: string, seen: Set<string>): NodeAccess => {
      const known = memo.get(id);
      if (known) return known;
      const node = byId.get(id);
      if (!node) return root;
      let found: NodeAccess;
      if (seen.has(id)) found = root;
      else {
        seen.add(id);
        const inherited =
          node.accessMode === 'custom'
            ? NONE
            : node.parentId && byId.has(node.parentId)
              ? at(node.parentId, seen)
              : root;
        found = inherited;
        for (const entry of own.get(id) ?? [])
          if (
            subjects.has(
              subjectKey({ type: entry.subjectType, id: entry.subjectId }),
            )
          )
            found = higher(found, {
              level: entry.level,
              source: {
                kind: 'entry',
                docId: id,
                subjectType: entry.subjectType,
                subjectId: entry.subjectId,
              },
            });
      }
      memo.set(id, found);
      return found;
    };
    return (id: string) => at(id, new Set());
  };

  const parties: readonly ReadonlySet<string>[] =
    input.parties.length > 0 ? input.parties : [new Set<string>()];
  const evaluators = parties.map(evaluate);
  for (const node of input.nodes) {
    let access = evaluators
      .map((of) => of(node.id))
      .reduce((a, b) => lower(a, b));
    if (input.actor && levelRank(access.level) > levelRank('propose'))
      access = { ...access, level: 'propose' };
    result.set(node.id, access);
  }
  return result;
}

/** The space's default level for a party, capped for an actor. */
export function spaceLevelFor(
  level: KnowledgeLevel,
  actor: boolean,
): KnowledgeLevel {
  return actor ? minLevel(level, 'propose') : level;
}

/** The ids of nodes that carry access of their own: entries, or `custom` mode. */
export function keyedNodes(
  nodes: readonly AclNode[],
  entries: readonly Pick<AclEntry, 'docId'>[],
): Set<string> {
  const keyed = new Set(entries.map((entry) => entry.docId));
  for (const node of nodes)
    if (node.accessMode === 'custom') keyed.add(node.id);
  return keyed;
}

/** Each node's access key: its nearest ancestor-or-self in `keyed`, or null. */
export function aclKeysOf(
  nodes: readonly AclNode[],
  keyed: ReadonlySet<string>,
): Map<string, string | null> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const keys = new Map<string, string | null>();
  const keyOf = (id: string, depth: number): string | null => {
    if (keys.has(id)) return keys.get(id)!;
    const node = byId.get(id);
    let key: string | null = null;
    if (node && depth < 64)
      key = keyed.has(id)
        ? id
        : node.parentId
          ? keyOf(node.parentId, depth + 1)
          : null;
    keys.set(id, key);
    return key;
  };
  for (const node of nodes) keyOf(node.id, 0);
  return keys;
}

/** The gate a section is filtered by: its space when it has no access key, else its key. */
export function accessGate(spaceId: string, aclKey: string | null): string {
  return aclKey ? `node:${aclKey}` : `space:${spaceId}`;
}

/** What a reader reads of one space: everything the space's access decides, and the access keys that let them read. */
export interface SpaceGates {
  readonly spaceId: string;
  /** Whether the space's own access lets them read (what has no access key). */
  readonly space: boolean;
  /** The access keys whose node lets them read. */
  readonly nodes: readonly string[];
}

/** The gates of `spaces` as one list, what an index filters its sections by. */
export function gatesOf(spaces: readonly SpaceGates[]): string[] {
  return spaces.flatMap((space) => [
    ...(space.space ? [accessGate(space.spaceId, null)] : []),
    ...space.nodes.map((key) => accessGate(space.spaceId, key)),
  ]);
}

/**
 * The filter of rows (`kbDocs`, `kbChunks`) a reader's gates let through, for the query itself: rows of a space whose
 * own access lets them read and without an access key, or rows under an access key whose node does. Spaces with
 * nothing readable are left out; with none at all, nothing passes.
 */
export function gateFilter(
  f: FilterBuilder,
  gates: readonly SpaceGates[],
): FilterNode {
  const parts: FilterNode[] = [];
  for (const space of gates) {
    if (space.space)
      parts.push(
        f.and([
          f.string('spaceId').eq(space.spaceId),
          f.string('aclKey').empty(),
        ]),
      );
    if (space.nodes.length > 0)
      parts.push(
        f.and([
          f.string('spaceId').eq(space.spaceId),
          f.or(space.nodes.map((key) => f.string('aclKey').eq(key))),
        ]),
      );
  }
  return parts.length > 0 ? f.or(parts) : f.string('id').eq('');
}

/** Whether a node or a section passes a reader's gates. */
export function passes(
  gates: SpaceGates,
  item: { readonly spaceId: string; readonly aclKey: string | null },
): boolean {
  if (item.spaceId !== gates.spaceId) return false;
  return item.aclKey ? gates.nodes.includes(item.aclKey) : gates.space;
}

/**
 * The visible nodes of a list, each placed under its nearest visible ancestor (or at the top): a reader never learns of
 * a folder they may not read, nor loses what they may read under it.
 */
export function visibleTree<
  T extends { readonly id: string; readonly parentId: string | null },
>(all: readonly T[], visible: (node: T) => boolean): T[] {
  const byId = new Map(all.map((node) => [node.id, node]));
  const shown = new Set(all.filter(visible).map((node) => node.id));
  return all
    .filter((node) => shown.has(node.id))
    .map((node) => {
      let parentId = node.parentId;
      for (
        let guard = 0;
        parentId && !shown.has(parentId) && guard < 64;
        guard += 1
      )
        parentId = byId.get(parentId)?.parentId ?? null;
      return parentId === node.parentId ? node : { ...node, parentId };
    });
}
