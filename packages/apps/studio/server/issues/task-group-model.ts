/**
 * The grouping behind `GET /api/taskGroups` (`shared/task-groups.ts`), over data already read and authorized: every
 * live issue the viewer may see, which of them the query matches, what waits on the viewer, and what they follow. It
 * reads nothing and decides no permission; `task-groups.ts` gathers its input in one transaction.
 *
 * Parents the viewer cannot see are cut off: a task under one is a root, never linked past it to an ancestor further up.
 */
import { createHash } from 'node:crypto';

import { PRIORITIES } from '@nocobase/app-plugin-projects/shared/common';
import type {
  Issue,
  IssueSort,
} from '@nocobase/app-plugin-projects/shared/issues';

import {
  DONE_WINDOW_DAYS,
  WAIT_REASONS,
  type TaskGroupId,
  type TaskGroupMode,
  type WaitReason,
} from '../../shared/task-groups.js';

export type GroupIssue = Pick<
  Issue,
  | 'id'
  | 'parentIssueId'
  | 'number'
  | 'statusKey'
  | 'priority'
  | 'createdAt'
  | 'updatedAt'
  | 'revision'
>;

export interface TaskWait {
  readonly reasons: readonly WaitReason[];
  readonly since: string;
}

export interface TaskGroupModelInput {
  /** Every live issue the viewer may see. */
  readonly issues: readonly GroupIssue[];
  /** The ids the query's filters match. */
  readonly matchingIds: ReadonlySet<string>;
  /** What waits on the viewer, by issue id. */
  readonly waits: ReadonlyMap<string, TaskWait>;
  /** The follow group's ids, in the viewer's order, already narrowed to what the query shows. */
  readonly followIds: readonly string[];
  readonly mode: TaskGroupMode;
  /** The query names a status: its group is listed whole, cancelled included. */
  readonly statusFilter?: string | undefined;
  /** Every matching task is listed in the split view, sub-tasks included (My tasks' "I execute"). */
  readonly flat?: boolean;
  readonly sort?: IssueSort | undefined;
  readonly direction?: 'asc' | 'desc' | undefined;
  /** The viewer, permissions and filters, so a generation never answers another query. */
  readonly queryIdentity: string;
  readonly now?: number;
}

export interface TaskGroupNode {
  readonly id: string;
  /** The visible parent. */
  readonly parentId: string | null;
  readonly waits: readonly WaitReason[];
  readonly waitingSince: string | null;
  readonly followed: boolean;
  readonly progress: { readonly finished: number; readonly total: number };
  readonly hasChildren: boolean;
  readonly context: boolean;
  readonly expand: readonly string[];
}

export interface TaskGroupModelPage<T> {
  readonly generation: string;
  readonly data: readonly T[];
  readonly nextCursor: string | null;
}

/** A continuation names a generation that is not the current one: read the whole query again. */
export class TaskGroupsChangedError extends Error {
  constructor() {
    super('The tasks changed since this page was read.');
  }
}

const STATUS_GROUP: Readonly<Record<string, TaskGroupId>> = {
  in_progress: 'doing',
  in_review: 'review',
  blocked: 'blocked',
  backlog: 'backlog',
  done: 'done',
  cancelled: 'cancelled',
};

const FINISHED = new Set(['done', 'cancelled']);

const ORDER: readonly TaskGroupId[] = [
  'follow',
  'wait',
  'doing',
  'review',
  'blocked',
  'backlog',
  'done',
  'cancelled',
];

function compareId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The order a group lists its tasks in: the query's sort, by default the latest update first. */
export function compareTasks(
  sort: IssueSort | undefined,
  direction: 'asc' | 'desc' | undefined,
): (a: GroupIssue, b: GroupIssue) => number {
  const by = sort ?? 'updated';
  // Priority's natural order is the most urgent first, as the lists sort it descending.
  const ascending =
    by === 'priority' ? direction !== 'asc' : direction === 'asc';
  const value = (issue: GroupIssue): string | number => {
    switch (by) {
      case 'number':
        return issue.number;
      case 'priority':
        return PRIORITIES.indexOf(issue.priority);
      case 'created':
        return issue.createdAt;
      default:
        return issue.updatedAt;
    }
  };
  return (a, b) => {
    const av = value(a);
    const bv = value(b);
    const compared = av < bv ? -1 : av > bv ? 1 : compareId(a.id, b.id);
    return ascending ? compared : -compared;
  };
}

/** The reasons in `WAIT_REASONS` order, each once. */
export function orderWaits(reasons: Iterable<WaitReason>): WaitReason[] {
  const set = new Set(reasons);
  return WAIT_REASONS.filter((reason) => set.has(reason));
}

export function createTaskGroupModel(input: TaskGroupModelInput) {
  const now = input.now ?? Date.now();
  const issues = new Map(input.issues.map((issue) => [issue.id, issue]));
  if (issues.size !== input.issues.length)
    throw new Error('Task group input contains duplicate ids.');
  const parents = new Map<string, string | null>();
  const children = new Map<string, GroupIssue[]>();
  for (const issue of issues.values()) {
    const parent =
      issue.parentIssueId && issues.has(issue.parentIssueId)
        ? issue.parentIssueId
        : null;
    parents.set(issue.id, parent);
    if (parent) {
      const siblings = children.get(parent) ?? [];
      siblings.push(issue);
      children.set(parent, siblings);
    }
  }
  const order = compareTasks(input.sort, input.direction);
  for (const siblings of children.values()) siblings.sort(order);

  // The root of every task, found once per path so deep trees stay linear and off the call stack.
  const rootIds = new Map<string, string>();
  for (const id of issues.keys()) {
    const path: string[] = [];
    const seen = new Set<string>();
    let current = id;
    while (!rootIds.has(current)) {
      if (seen.has(current))
        throw new Error('Task group input contains a parent cycle.');
      seen.add(current);
      path.push(current);
      const parent = parents.get(current);
      if (!parent) break;
      current = parent;
    }
    const root = rootIds.get(current) ?? current;
    for (const step of path) rootIds.set(step, root);
  }

  const followIds = input.followIds.filter((id) => issues.has(id));
  const followed = new Set(followIds);
  const window = DONE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  /** The status group a task is listed in, or null when its status is not listed. */
  function statusGroup(issue: GroupIssue): TaskGroupId | null {
    const group = STATUS_GROUP[issue.statusKey];
    if (!group) return null;
    if (input.statusFilter) return group;
    if (group === 'cancelled') return null;
    if (group === 'done' && now - Date.parse(issue.updatedAt) > window)
      return null;
    return group;
  }

  const waitOf = (id: string): TaskWait | undefined => input.waits.get(id);

  function ancestorsOf(id: string): string[] {
    const path: string[] = [];
    let current = parents.get(id) ?? null;
    while (current) {
      path.push(current);
      current = parents.get(current) ?? null;
    }
    return path;
  }

  function node(id: string, expand: readonly string[] = []): TaskGroupNode {
    const direct = children.get(id) ?? [];
    const wait = waitOf(id);
    return {
      id,
      parentId: parents.get(id) ?? null,
      waits: wait ? orderWaits(wait.reasons) : [],
      waitingSince: wait?.since ?? null,
      followed: followed.has(id),
      progress: {
        finished: direct.filter((child) => FINISHED.has(child.statusKey))
          .length,
        total: direct.length,
      },
      hasChildren: direct.length > 0,
      context: !input.matchingIds.has(id) && !followed.has(id),
      expand,
    };
  }

  const groups = new Map<
    TaskGroupId,
    { ids: string[]; count: number; since: Map<string, string> }
  >();
  const add = (group: TaskGroupId, id: string, count = 1, since?: string) => {
    const entry = groups.get(group) ?? {
      ids: [],
      count: 0,
      since: new Map<string, string>(),
    };
    entry.ids.push(id);
    entry.count += count;
    if (since) entry.since.set(id, since);
    groups.set(group, entry);
  };
  /** The roots of the trees the table lists, to bound what may be expanded. */
  const listedTrees = new Set<string>();
  const expands = new Map<string, string[]>();

  if (input.mode === 'split') {
    for (const id of input.matchingIds) {
      const issue = issues.get(id);
      if (!issue || followed.has(id)) continue;
      const wait = waitOf(id);
      const parent = parents.get(id);
      const listed =
        !parent || !input.matchingIds.has(parent) || !!wait || input.flat;
      if (!listed) continue;
      const group = wait ? 'wait' : statusGroup(issue);
      if (group) add(group, id, 1, wait?.since);
    }
  } else {
    const trees = new Map<
      string,
      { matching: string[]; waiting: string[]; since: string | null }
    >();
    for (const id of input.matchingIds) {
      const root = rootIds.get(id);
      // An id the viewer can no longer see counts nowhere.
      if (!root) continue;
      const tree = trees.get(root) ?? {
        matching: [],
        waiting: [],
        since: null,
      };
      tree.matching.push(id);
      const wait = waitOf(id);
      if (wait) {
        tree.waiting.push(id);
        if (!tree.since || wait.since < tree.since) tree.since = wait.since;
      }
      trees.set(root, tree);
    }
    for (const [root, tree] of trees) {
      // A tree the follow group lists from its root is listed there only.
      if (followed.has(root)) continue;
      let group: TaskGroupId | null = null;
      if (tree.waiting.length > 0) group = 'wait';
      else {
        const rootIssue = issues.get(root)!;
        const candidates = [
          ...(input.matchingIds.has(root) ? [rootIssue] : []),
          ...tree.matching
            .filter((id) => id !== root)
            .map((id) => issues.get(id)!)
            .sort(order),
        ];
        for (const issue of candidates) {
          group = statusGroup(issue);
          if (group) break;
        }
      }
      if (!group) continue;
      listedTrees.add(root);
      const expand = new Set<string>();
      for (const id of tree.waiting)
        for (const ancestor of ancestorsOf(id)) expand.add(ancestor);
      expands.set(root, [...expand]);
      add(
        group,
        root,
        group === 'wait' ? tree.waiting.length : tree.matching.length,
        tree.since ?? undefined,
      );
    }
  }
  for (const id of followIds) listedTrees.add(id);

  const ordered = new Map<TaskGroupId, string[]>();
  for (const [group, entry] of groups) {
    const ids = [...entry.ids];
    if (group === 'wait')
      ids.sort((a, b) => {
        const sa = entry.since.get(a) ?? '';
        const sb = entry.since.get(b) ?? '';
        return sa < sb ? -1 : sa > sb ? 1 : compareId(a, b);
      });
    else ids.sort((a, b) => order(issues.get(a)!, issues.get(b)!));
    ordered.set(group, ids);
  }
  ordered.set('follow', followIds);

  const generation = createHash('sha256')
    .update(
      JSON.stringify([
        input.queryIdentity,
        input.mode,
        input.sort ?? 'updated',
        input.direction ?? 'desc',
        followIds,
        [...issues.values()]
          .sort((a, b) => compareId(a.id, b.id))
          .map((issue) => [
            issue.id,
            issue.revision,
            issue.parentIssueId,
            issue.statusKey,
            input.matchingIds.has(issue.id),
            waitOf(issue.id) ?? null,
          ]),
      ]),
    )
    .digest('base64url');

  function page<T>(
    data: readonly T[],
    selector: string,
    limit: number,
    cursor?: string,
  ): TaskGroupModelPage<T> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new Error('Task group page size must be between 1 and 100.');
    let offset = 0;
    if (cursor) {
      try {
        const parsed: unknown = JSON.parse(
          Buffer.from(cursor, 'base64url').toString('utf8'),
        );
        if (
          !Array.isArray(parsed) ||
          parsed.length !== 3 ||
          parsed[0] !== generation ||
          parsed[1] !== selector ||
          !Number.isSafeInteger(parsed[2]) ||
          (parsed[2] as number) < 0 ||
          (parsed[2] as number) >= data.length
        )
          throw new TaskGroupsChangedError();
        offset = parsed[2] as number;
      } catch {
        throw new TaskGroupsChangedError();
      }
    }
    const end = offset + limit;
    return {
      generation,
      data: data.slice(offset, end),
      nextCursor:
        end < data.length
          ? Buffer.from(JSON.stringify([generation, selector, end])).toString(
              'base64url',
            )
          : null,
    };
  }

  const groupIds = ORDER.filter(
    (group) => group === 'follow' || (groups.get(group)?.count ?? 0) > 0,
  );
  const countOf = (group: TaskGroupId): number =>
    group === 'follow' ? followIds.length : (groups.get(group)?.count ?? 0);
  const followWaiting = followIds.filter((id) => input.waits.has(id)).length;

  return {
    generation,
    groups: groupIds.map((group) => ({ group, count: countOf(group) })),
    /** The tasks waiting for the viewer the tabs count: the wait group and the followed ones. */
    waiting: countOf('wait') + followWaiting,
    following: followIds,
    rootOf: (id: string): string | undefined => rootIds.get(id),
    group(
      group: TaskGroupId,
      limit = 50,
      cursor?: string,
    ): TaskGroupModelPage<TaskGroupNode> {
      const ids = ordered.get(group) ?? [];
      const result = page(ids, `group:${group}`, limit, cursor);
      return {
        ...result,
        data: result.data.map((id) => node(id, expands.get(id) ?? [])),
      };
    },
    children(
      parentId: string,
      limit = 50,
      cursor?: string,
    ): TaskGroupModelPage<TaskGroupNode> {
      const root = rootIds.get(parentId);
      // Only the trees the result lists may be expanded, and a followed task's own subtree.
      const reachable =
        !!root &&
        (listedTrees.has(root) ||
          [parentId, ...ancestorsOf(parentId)].some((id) => followed.has(id)));
      const kids = reachable ? (children.get(parentId) ?? []) : [];
      return page(
        kids.map((child) => node(child.id)),
        `parent:${parentId}`,
        limit,
        cursor,
      );
    },
  };
}

export type TaskGroupModel = ReturnType<typeof createTaskGroupModel>;
