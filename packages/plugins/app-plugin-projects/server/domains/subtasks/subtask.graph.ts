/**
 * Issues waiting for each other must not form a cycle. An issue waits for the issues it is `blockedBy`, for its
 * siblings of an earlier stage, and for its own sub-issues (a parent waits for its children). Any new cycle passes
 * through the issue just changed, so after writing the change one search answers whether that issue can reach
 * itself: write first, then verify, and roll back on a cycle.
 *
 * The search reads one layer at a time (three batched queries per layer) and stops at `DEPENDENCY_DEPTH_MAX` layers or
 * `DEPENDENCY_NODES_MAX` issues.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { Issue } from '../../../shared/issues.js';
import {
  DEPENDENCY_DEPTH_MAX,
  DEPENDENCY_NODES_MAX,
} from '../../../shared/subtasks.js';
import { invalid } from '../../kernel/errors.js';
import { findIssue, findIssues, liveChildren } from '../issues/index.js';
import { outgoing } from './subtask.store.js';

/** For each issue of the layer, the live issues it waits for. */
async function waitsFor(
  conn: DatabaseConnection,
  layer: readonly Issue[],
): Promise<Map<string, Issue[]>> {
  const ids = layer.map((issue) => issue.id);
  const result = new Map<string, Issue[]>(ids.map((id) => [id, []]));
  const edges = await outgoing(conn, ids, 'blockedBy');
  const targets = new Map(
    (
      await findIssues(
        conn,
        edges.map((edge) => edge.dependsOnIssueId),
      )
    )
      .filter((issue) => !issue.deletedAt)
      .map((issue) => [issue.id, issue]),
  );
  for (const edge of edges) {
    const target = targets.get(edge.dependsOnIssueId);
    if (target) result.get(edge.issueId)?.push(target);
  }
  for (const child of await liveChildren(conn, ids))
    result.get(child.parentIssueId as string)?.push(child);
  const staged = layer.filter(
    (issue) => issue.parentIssueId && issue.stage !== null,
  );
  if (staged.length > 0) {
    const siblings = await liveChildren(
      conn,
      staged.map((issue) => issue.parentIssueId as string),
    );
    for (const issue of staged)
      for (const sibling of siblings)
        if (
          sibling.id !== issue.id &&
          sibling.parentIssueId === issue.parentIssueId &&
          sibling.stage !== null &&
          sibling.stage < (issue.stage as number)
        )
          result.get(issue.id)?.push(sibling);
  }
  return result;
}

/** 400 `DEPENDENCY_CYCLE` (with the identifiers along the cycle) when the issue now waits for itself. */
export async function assertNoCycleThrough(
  conn: DatabaseConnection,
  issueId: string,
): Promise<void> {
  const start = await findIssue(conn, issueId);
  if (!start || start.deletedAt) return;
  const previous = new Map<string, Issue>();
  const seen = new Set<string>([start.id]);
  let layer: Issue[] = [start];
  for (let depth = 0; layer.length > 0; depth += 1) {
    if (depth >= DEPENDENCY_DEPTH_MAX || seen.size >= DEPENDENCY_NODES_MAX)
      throw invalid(
        'DEPENDENCY_TOO_DEEP',
        'Too many issues wait for each other here to check this change.',
      );
    const next: Issue[] = [];
    for (const [fromId, targets] of await waitsFor(conn, layer)) {
      const from = layer.find((issue) => issue.id === fromId) as Issue;
      for (const target of targets) {
        if (target.id === start.id) {
          const path = [start.identifier];
          for (
            let cursor: Issue | undefined = from;
            cursor && cursor.id !== start.id;
            cursor = previous.get(cursor.id)
          )
            path.unshift(cursor.identifier);
          path.unshift(start.identifier);
          throw invalid(
            'DEPENDENCY_CYCLE',
            `These issues would wait for each other: ${path.join(' → ')}.`,
            { via: path },
          );
        }
        if (seen.has(target.id)) continue;
        seen.add(target.id);
        previous.set(target.id, from);
        next.push(target);
      }
    }
    layer = next;
  }
}
