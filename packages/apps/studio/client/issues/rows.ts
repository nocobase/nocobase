/**
 * The projects plugin's issues as the installed UI Library items take them: a row of `IssueTable`, a card of the
 * kanban. Kept apart from the components so it can be tested.
 */
import type {
  IssueListItem,
  StatusDefinition,
} from '@nocobase/app-plugin-projects/shared/issues';
import type { PmTone } from '@nocobase/app-plugin-projects/client/issues';

import type {
  IssueTableColor,
  IssueTableRow,
} from '../components/issue-table.js';

/** The projects plugin's tones as the items' colours. */
const TONE_COLOR: Readonly<Record<PmTone, IssueTableColor>> = {
  grey: 'gray',
  slate: 'gray',
  blue: 'blue',
  violet: 'purple',
  amber: 'yellow',
  green: 'green',
  red: 'red',
  orange: 'orange',
};

/** A projects plugin tone as the items' colour. */
export function toneColor(tone: PmTone): IssueTableColor {
  return TONE_COLOR[tone];
}

export interface RowWording {
  /** A status's name in the interface language (`useStatusName`). */
  readonly statusName: (
    statuses: readonly StatusDefinition[] | undefined,
    key: string,
  ) => string;
  /** A status's tone (`statusTone`). */
  readonly statusTone: (
    statuses: readonly StatusDefinition[] | undefined,
    key: string,
  ) => PmTone;
}

/** An issue as a row of the issue table; `statuses` are its workflow's, for the status name and colour. */
export function issueTableRow(
  issue: IssueListItem,
  statuses: readonly StatusDefinition[] | undefined,
  wording: RowWording,
): IssueTableRow {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    labels: issue.labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
    })),
    status: {
      name: wording.statusName(statuses, issue.statusKey),
      color: toneColor(wording.statusTone(statuses, issue.statusKey)),
    },
    priority: issue.priority,
    owner: issue.owner ? { name: issue.owner.name } : null,
    executor: issue.executor
      ? {
          name: issue.executorName ?? issue.executor.id,
          kind: issue.executor.type,
        }
      : null,
    updatedAt: issue.updatedAt,
  };
}

/** Organize only loaded results: missing parents stay visible without changing filter semantics. */
export function organizeIssueHierarchy<
  T extends { readonly id: string; readonly parentIssueId?: string | null },
>(issues: readonly T[]): { issue: T; depth: number }[] {
  const byId = new Map<string, T>();
  for (const issue of issues)
    if (!byId.has(issue.id)) byId.set(issue.id, issue);
  const children = new Map<string, T[]>();
  const roots: T[] = [];
  for (const issue of byId.values()) {
    const parent = issue.parentIssueId;
    if (!parent || parent === issue.id || !byId.has(parent)) roots.push(issue);
    else {
      const siblings = children.get(parent) ?? [];
      siblings.push(issue);
      children.set(parent, siblings);
    }
  }
  const result: { issue: T; depth: number }[] = [];
  const visited = new Set<string>();
  function visit(root: T): void {
    // An explicit stack also handles malformed or extremely deep trees without overflowing the call stack.
    const stack = [{ issue: root, depth: 0 }];
    while (stack.length) {
      const row = stack.pop()!;
      if (visited.has(row.issue.id)) continue;
      visited.add(row.issue.id);
      result.push(row);
      const descendants = children.get(row.issue.id) ?? [];
      for (let index = descendants.length - 1; index >= 0; index--) {
        stack.push({ issue: descendants[index], depth: row.depth + 1 });
      }
    }
  }
  for (const root of roots) visit(root);
  // Cycles have no root. Start each remaining component in its original server order.
  for (const issue of byId.values()) if (!visited.has(issue.id)) visit(issue);
  return result;
}
