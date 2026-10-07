/**
 * The issues a plan touches, which `GET /plans?issueId=` lists it on besides its source issue: the existing issues its
 * rows change, comment on or link, and the parent or blockers a new issue is put under; once executed, also the issues
 * it created. Rows naming an earlier row's `ref` touch only what that row created, known after execution.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { PlanRowOp, PlanRowResult } from '../../../shared/plans.js';
import { findIssue } from '../issues/index.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** The ids and identifiers a row's params name as existing issues. */
function namedIssues(op: PlanRowOp, params: unknown): string[] {
  if (!isRecord(params)) return [];
  const named = (value: unknown): string[] =>
    typeof value === 'string' && value ? [value] : [];
  switch (op) {
    case 'issue.update':
      return [
        ...named(params.issue),
        ...(isRecord(params.set) ? named(params.set.parentIssueId) : []),
      ];
    case 'comment.create':
      return named(params.issue);
    case 'dependency':
      return [...named(params.issue), ...named(params.dependsOn)];
    case 'issue.create':
      return [
        ...named(params.parentIssueId),
        ...(Array.isArray(params.blockedBy)
          ? params.blockedBy.flatMap(named)
          : []),
      ];
    default:
      return [];
  }
}

/** The ids of the existing issues `rows` name, each once. */
export async function issuesNamedBy(
  conn: DatabaseConnection,
  rows: readonly { readonly op: PlanRowOp; readonly params: unknown }[],
): Promise<string[]> {
  const ids = new Set<string>();
  for (const name of new Set(
    rows.flatMap((row) => namedIssues(row.op, row.params)),
  )) {
    const issue = await findIssue(conn, name);
    if (issue) ids.add(issue.id);
  }
  return [...ids];
}

/** The issues executed rows created or acted on. */
export function issuesOfResults(
  results: readonly (PlanRowResult | null | undefined)[],
): string[] {
  return results.flatMap((result) =>
    [result?.created, result?.target].flatMap((ref) =>
      ref?.type === 'issue' && ref.id ? [ref.id] : [],
    ),
  );
}
