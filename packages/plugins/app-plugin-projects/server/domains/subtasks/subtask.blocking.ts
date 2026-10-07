/**
 * What holds an issue back: the unfinished issues it is `blockedBy`, and the unfinished siblings of an earlier stage.
 * "Finished" is read from each issue's own workflow (a blocker may be in another project); deleted issues hold nothing.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { Issue, StatusDefinition } from '../../../shared/issues.js';
import type { Blocker } from '../../../shared/subtasks.js';
import {
  findIssues,
  isTerminal,
  liveChildren,
  type StatusCatalog,
  type StatusCatalogs,
} from '../issues/index.js';
import { outgoing } from './subtask.store.js';

/** The workflows of the projects one call meets, each read once. */
export interface Catalogs {
  of(issue: Pick<Issue, 'projectId'>): Promise<StatusCatalog>;
  terminal(issue: Pick<Issue, 'projectId' | 'statusKey'>): Promise<boolean>;
  status(
    issue: Pick<Issue, 'projectId' | 'statusKey'>,
  ): Promise<StatusDefinition>;
}

export function catalogsFor(
  statuses: StatusCatalogs,
  conn: DatabaseConnection,
): Catalogs {
  const cache = new Map<string | null, Promise<StatusCatalog>>();
  const of = (issue: Pick<Issue, 'projectId'>) => {
    let catalog = cache.get(issue.projectId);
    if (!catalog) {
      catalog = statuses.forProject(conn, issue.projectId);
      cache.set(issue.projectId, catalog);
    }
    return catalog;
  };
  return {
    of,
    terminal: async (issue) => isTerminal(await of(issue), issue.statusKey),
    async status(issue) {
      const found = (await of(issue)).statuses.find(
        (status) => status.key === issue.statusKey,
      );
      return (
        found ?? {
          key: issue.statusKey,
          name: issue.statusKey,
          category: 'unstarted',
          color: 'gray',
        }
      );
    },
  };
}

const byNumber = (a: Pick<Issue, 'number'>, b: Pick<Issue, 'number'>) =>
  a.number - b.number;

/** Live siblings of a staged issue in an earlier stage. */
function earlierSiblings(issue: Issue, siblings: readonly Issue[]): Issue[] {
  const own = issue.stage;
  if (own === null || !issue.parentIssueId) return [];
  return siblings.filter(
    (sibling) =>
      sibling.id !== issue.id &&
      sibling.parentIssueId === issue.parentIssueId &&
      sibling.stage !== null &&
      sibling.stage < own,
  );
}

/** What holds `issue` now: dependencies first (by number), then earlier stages (by stage, then number). */
export async function blockersOf(
  conn: DatabaseConnection,
  catalogs: Catalogs,
  issue: Issue,
): Promise<Blocker[]> {
  return (await blockersOfMany(conn, catalogs, [issue])).get(issue.id) ?? [];
}

/** What holds each of `issues` now, in the order `blockersOf` gives, in a fixed number of queries per call. */
export async function blockersOfMany(
  conn: DatabaseConnection,
  catalogs: Catalogs,
  issues: readonly Issue[],
): Promise<Map<string, Blocker[]>> {
  const result = new Map<string, Blocker[]>(
    issues.map((issue) => [issue.id, []]),
  );
  if (issues.length === 0) return result;
  const blocker = async (
    target: Issue,
    reason: Blocker['reason'],
  ): Promise<Blocker> => ({
    issueId: target.id,
    identifier: target.identifier,
    title: target.title,
    status: await catalogs.status(target),
    reason,
  });
  const edges = await outgoing(
    conn,
    issues.map((issue) => issue.id),
    'blockedBy',
  );
  const targets = new Map(
    (
      await findIssues(
        conn,
        edges.map((edge) => edge.dependsOnIssueId),
      )
    ).map((target) => [target.id, target]),
  );
  for (const issue of issues) {
    const own = edges
      .filter((edge) => edge.issueId === issue.id)
      .flatMap((edge) => {
        const target = targets.get(edge.dependsOnIssueId);
        return target && !target.deletedAt && target.id !== issue.id
          ? [target]
          : [];
      })
      .sort(byNumber);
    for (const target of own)
      if (!(await catalogs.terminal(target)))
        result.get(issue.id)!.push(await blocker(target, 'dependency'));
  }
  const staged = issues.filter(
    (issue) => issue.parentIssueId && issue.stage !== null,
  );
  if (staged.length > 0) {
    const siblings = await liveChildren(conn, [
      ...new Set(staged.map((issue) => issue.parentIssueId as string)),
    ]);
    for (const issue of staged)
      for (const sibling of earlierSiblings(issue, siblings).sort(
        (a, b) => (a.stage ?? 0) - (b.stage ?? 0) || a.number - b.number,
      ))
        if (!(await catalogs.terminal(sibling)))
          result.get(issue.id)!.push(await blocker(sibling, 'stage'));
  }
  return result;
}

/** How many unfinished issues each of `issues` waits for, in a fixed number of queries per call. */
export async function blockedCounts(
  conn: DatabaseConnection,
  catalogs: Catalogs,
  issues: readonly Issue[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>(issues.map((issue) => [issue.id, 0]));
  if (issues.length === 0) return counts;
  const edges = await outgoing(
    conn,
    issues.map((issue) => issue.id),
    'blockedBy',
  );
  const targets = new Map(
    (
      await findIssues(
        conn,
        edges.map((edge) => edge.dependsOnIssueId),
      )
    ).map((target) => [target.id, target]),
  );
  const open = new Map<string, boolean>();
  const isOpen = async (issue: Issue) => {
    let value = open.get(issue.id);
    if (value === undefined) {
      value = !issue.deletedAt && !(await catalogs.terminal(issue));
      open.set(issue.id, value);
    }
    return value;
  };
  for (const edge of edges) {
    const target = targets.get(edge.dependsOnIssueId);
    if (target && target.id !== edge.issueId && (await isOpen(target)))
      counts.set(edge.issueId, (counts.get(edge.issueId) ?? 0) + 1);
  }
  const staged = issues.filter(
    (issue) => issue.parentIssueId && issue.stage !== null,
  );
  if (staged.length > 0) {
    const siblings = await liveChildren(
      conn,
      staged.map((issue) => issue.parentIssueId as string),
    );
    for (const issue of staged)
      for (const sibling of earlierSiblings(issue, siblings))
        if (await isOpen(sibling))
          counts.set(issue.id, (counts.get(issue.id) ?? 0) + 1);
  }
  return counts;
}
