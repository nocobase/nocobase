import { createHash } from 'node:crypto';

import { PRIORITIES } from '@nocobase/app-plugin-projects/shared/common';
import type {
  Issue,
  IssueSort,
} from '@nocobase/app-plugin-projects/shared/issues';

/** Tree precedence only; workflow and decision evaluation belongs to the shared task attention service. */
export const TASK_TREE_GROUPS = [
  'input',
  'review',
  'decision',
  'routine',
] as const;
export type TaskTreeGroup = (typeof TASK_TREE_GROUPS)[number];

/** Minimal adapter input from the shared evaluator; never resolve workflow or inbox reasons here. */
export interface TreeAttention {
  readonly group: Exclude<TaskTreeGroup, 'routine'>;
  readonly waitingForViewer: boolean;
}

export type TreeIssue = Pick<
  Issue,
  | 'id'
  | 'parentIssueId'
  | 'number'
  | 'priority'
  | 'createdAt'
  | 'updatedAt'
  | 'revision'
>;

/** Every input row must already be independently authorized and live. This is not a page of list results. */
export interface TreeModelInput {
  readonly issues: readonly TreeIssue[];
  readonly matchingIds: ReadonlySet<string>;
  readonly attention: ReadonlyMap<string, TreeAttention>;
  /** Terminal status categories are evaluated by the owning Projects service. */
  readonly finishedIds: ReadonlySet<string>;
  /** Canonical identity of viewer, permission scope, Mine/All scope and filters, excluding page selectors. */
  readonly queryIdentity: string;
  readonly sort?: IssueSort;
  readonly direction?: 'asc' | 'desc';
}

export interface TreeTotals {
  readonly tasks: number;
  readonly trees: number;
  readonly needsHumanAction: number;
  readonly waitingForViewer: number;
}

/** Safe display metadata. Raw issue parent IDs must not be copied into the response at a visibility boundary. */
export interface TreeNode {
  readonly id: string;
  readonly parentId: string | null;
  readonly rootId: string;
  readonly matchesFilter: boolean;
  readonly hasChildren: boolean;
  readonly progress: { readonly finished: number; readonly total: number };
}

export interface TreeRoot extends TreeNode {
  readonly group: TaskTreeGroup;
  /** Matching task explaining the group's precedence, even when its row is collapsed. */
  readonly attentionTaskId: string | null;
  readonly totals: Omit<TreeTotals, 'trees'>;
}

export interface TreeModelPage<T> {
  readonly generation: string;
  readonly data: readonly T[];
  readonly nextCursor: string | null;
}

/** Routes must translate this to a query refresh, rather than append a page with inconsistent counts. */
export class TreeCursorError extends Error {
  constructor() {
    super('The task tree cursor does not belong to the current query result.');
  }
}

function compareId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareIssues(input: TreeModelInput) {
  const sort = input.sort ?? 'updated';
  const ascending =
    sort === 'priority' ? input.direction !== 'asc' : input.direction === 'asc';
  const value = (issue: TreeIssue): string | number => {
    switch (sort) {
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
  return (a: TreeIssue, b: TreeIssue): number => {
    const av = value(a);
    const bv = value(b);
    const compared = av < bv ? -1 : av > bv ? 1 : compareId(a.id, b.id);
    return ascending ? compared : -compared;
  };
}

/**
 * Builds a forest across the complete authorized input before paging roots or children. Only matching tasks
 * establish membership, group rank and action totals. Readable nonmatches remain expandable context; progress
 * counts all readable direct children. Callers supply complete reads and hydrate only IDs returned by a page.
 */
export function createTaskTreeModel(input: TreeModelInput) {
  const issues = new Map(input.issues.map((issue) => [issue.id, issue]));
  if (issues.size !== input.issues.length)
    throw new Error('Task tree input contains duplicate IDs.');
  const parents = new Map<string, string | null>();
  const children = new Map<string, TreeIssue[]>();
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
  const order = compareIssues(input);
  for (const siblings of children.values()) siblings.sort(order);

  // Iterative path compression keeps deep trees out of the call stack and makes root lookup linear.
  const rootIds = new Map<string, string>();
  for (const id of issues.keys()) {
    const path: string[] = [];
    const seen = new Set<string>();
    let current = id;
    while (!rootIds.has(current)) {
      if (seen.has(current))
        throw new Error('Task tree input contains a parent cycle.');
      seen.add(current);
      path.push(current);
      const parent = parents.get(current);
      if (!parent) break;
      current = parent;
    }
    const root = rootIds.get(current) ?? current;
    for (const ancestor of path) rootIds.set(ancestor, root);
  }

  const aggregates = new Map<
    string,
    {
      tasks: number;
      needsHumanAction: number;
      waitingForViewer: number;
      group: TaskTreeGroup;
      attentionTaskId: string | null;
    }
  >();
  for (const id of input.matchingIds) {
    const root = rootIds.get(id);
    // Missing IDs may have become inaccessible. They never enter totals or explain a group.
    if (!root) continue;
    const aggregate = aggregates.get(root) ?? {
      tasks: 0,
      needsHumanAction: 0,
      waitingForViewer: 0,
      group: 'routine' as TaskTreeGroup,
      attentionTaskId: null,
    };
    aggregate.tasks++;
    const attention = input.attention.get(id);
    if (attention) {
      aggregate.needsHumanAction++;
      if (attention.waitingForViewer) aggregate.waitingForViewer++;
      const rank = TASK_TREE_GROUPS.indexOf(attention.group);
      const currentRank = TASK_TREE_GROUPS.indexOf(aggregate.group);
      if (
        rank < currentRank ||
        (rank === currentRank &&
          (!aggregate.attentionTaskId ||
            compareId(id, aggregate.attentionTaskId) < 0))
      ) {
        aggregate.group = attention.group;
        aggregate.attentionTaskId = id;
      }
    }
    aggregates.set(root, aggregate);
  }

  function node(id: string): TreeNode {
    const direct = children.get(id) ?? [];
    return {
      id,
      parentId: parents.get(id) ?? null,
      rootId: rootIds.get(id)!,
      matchesFilter: input.matchingIds.has(id),
      hasChildren: direct.length > 0,
      progress: {
        finished: direct.filter((child) => input.finishedIds.has(child.id))
          .length,
        total: direct.length,
      },
    };
  }
  const roots = [...aggregates.keys()]
    .map((id): TreeRoot => {
      const { group, attentionTaskId, ...totals } = aggregates.get(id)!;
      return { ...node(id), group, attentionTaskId, totals };
    })
    .sort((a, b) => order(issues.get(a.id)!, issues.get(b.id)!));
  const groups = TASK_TREE_GROUPS.map((group) => {
    const groupRoots = roots.filter((root) => root.group === group);
    const totals: TreeTotals = groupRoots.reduce(
      (sum, root) => ({
        tasks: sum.tasks + root.totals.tasks,
        trees: sum.trees + 1,
        needsHumanAction: sum.needsHumanAction + root.totals.needsHumanAction,
        waitingForViewer: sum.waitingForViewer + root.totals.waitingForViewer,
      }),
      { tasks: 0, trees: 0, needsHumanAction: 0, waitingForViewer: 0 },
    );
    return { group, totals };
  });

  // Transient, query-bound metadata only. Revisions, membership, visibility and evaluator changes invalidate pages.
  const generation = createHash('sha256')
    .update(
      JSON.stringify([
        input.queryIdentity,
        input.sort ?? 'updated',
        input.direction ?? 'desc',
        [...issues.values()]
          .sort((a, b) => compareId(a.id, b.id))
          .map((issue) => [
            issue,
            input.matchingIds.has(issue.id),
            input.finishedIds.has(issue.id),
            input.attention.get(issue.id)?.group ?? null,
            input.attention.get(issue.id)?.waitingForViewer ?? false,
          ]),
      ]),
    )
    .digest('base64url');

  function page<T>(
    data: readonly T[],
    selector: string,
    limit: number,
    cursor?: string,
  ): TreeModelPage<T> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new Error('Task tree page size must be between 1 and 100.');
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
          parsed[2] < 0 ||
          parsed[2] >= data.length
        )
          throw new TreeCursorError();
        offset = parsed[2] as number;
      } catch {
        throw new TreeCursorError();
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

  return {
    generation,
    groups,
    roots(
      group: TaskTreeGroup,
      limit = 50,
      cursor?: string,
    ): TreeModelPage<TreeRoot> {
      return page(
        roots.filter((root) => root.group === group),
        `group:${group}`,
        limit,
        cursor,
      );
    },
    children(
      parentId: string,
      limit = 50,
      cursor?: string,
    ): TreeModelPage<TreeNode> {
      const root = rootIds.get(parentId);
      // Restrict expansion to trees represented in the filtered result.
      if (!root || !aggregates.has(root))
        return page([], `parent:${parentId}`, limit, cursor);
      return page(
        (children.get(parentId) ?? []).map((child) => node(child.id)),
        `parent:${parentId}`,
        limit,
        cursor,
      );
    },
  };
}
