/**
 * The issues a plan is about, as data: the issue it was opened from first, then the plan's source issue, then, row by
 * row, those its rows change, comment on or link and the parents and blockers of the issues it creates; once executed,
 * also the issues it created. `plan-issue-links.tsx` draws them.
 */
import type {
  Plan,
  PlanObjectRef,
  PlanRowOp,
} from '@nocobase/app-plugin-projects/shared/plans';
import type { To } from 'react-router';

/** An issue a plan is about. */
export interface PlanIssueRef {
  /** The issue's id, or the id or key a row named it by while it is not known. */
  readonly id: string;
  readonly identifier: string | null;
  readonly title: string | null;
}

/** Where an issue's link goes; the plugin's issue page by default. */
export type PlanIssueHref = (issue: {
  readonly id: string;
  readonly identifier: string;
}) => To;

export const defaultPlanIssueHref: PlanIssueHref = (issue) =>
  `/issues/${encodeURIComponent(issue.identifier)}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** The ids and keys a row's params name as existing issues, as the server records what a plan touches. */
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

/** The issues `plan` is about, each once, `firstIssueId` (an id or a key) first. */
export function planIssues(
  plan: Plan,
  firstIssueId: string | null = null,
): PlanIssueRef[] {
  const known = new Map<string, PlanIssueRef>();
  const idOfKey = new Map<string, string>();
  const refs = (row: Plan['rows'][number]): (PlanObjectRef | null)[] => [
    row.check?.target ?? null,
    row.result?.target ?? null,
    row.result?.created ?? null,
  ];
  const rows = [...plan.rows].sort((a, b) => a.position - b.position);
  for (const ref of rows.flatMap(refs)) {
    if (ref?.type !== 'issue' || !ref.id) continue;
    const seen = known.get(ref.id);
    known.set(ref.id, {
      id: ref.id,
      identifier: ref.identifier ?? seen?.identifier ?? null,
      title: ref.title ?? seen?.title ?? null,
    });
    if (ref.identifier) idOfKey.set(ref.identifier, ref.id);
  }
  const names = [
    ...(firstIssueId ? [firstIssueId] : []),
    ...(plan.source.issueId ? [plan.source.issueId] : []),
    ...rows.flatMap((row) => [
      ...namedIssues(row.op, row.params),
      ...refs(row).flatMap((ref) =>
        ref?.type === 'issue' && ref.id ? [ref.id] : [],
      ),
    ]),
  ];
  const issues = new Map<string, PlanIssueRef>();
  for (const name of names) {
    const id = idOfKey.get(name) ?? name;
    if (!issues.has(id))
      issues.set(id, known.get(id) ?? { id, identifier: null, title: null });
  }
  return [...issues.values()];
}
