import {
  type CollisionDetection,
  closestCorners,
  pointerWithin,
} from '@dnd-kit/core';

import type {
  IssueListItem,
  StatusDefinition,
} from '../../../../shared/issues.js';
import { canCloseIssue, type Viewer } from '../../../lib/permissions.js';
import { isClosing } from '../../../lib/status.js';
import type { BoardGroup } from '../use-issue-pages.js';

export interface BoardColumn {
  readonly status: StatusDefinition;
  readonly issues: readonly IssueListItem[];
}

/**
 * The board's columns, one per status in the workflow's order. Moves still waiting for the server (`overrides`, issue
 * id → target status) show in their target column, so a card does not jump back while its request is in flight.
 */
export function buildBoardColumns(
  groups: readonly BoardGroup[],
  overrides: ReadonlyMap<string, string> = new Map(),
): BoardColumn[] {
  const columns = new Map<string, IssueListItem[]>(
    groups.map((group) => [group.status.key, []]),
  );
  for (const group of groups)
    for (const issue of group.issues) {
      const statusKey = overrides.get(issue.id) ?? issue.statusKey;
      const moved =
        statusKey === issue.statusKey ? issue : { ...issue, statusKey };
      columns.get(statusKey)?.push(moved);
    }
  return groups.map((group) => ({
    status: group.status,
    issues: columns.get(group.status.key) ?? [],
  }));
}

export type BoardMovePlan =
  | { readonly kind: 'none' }
  | { readonly kind: 'denied' }
  | { readonly kind: 'patch'; readonly statusKey: string };

/**
 * What dropping `issue` on a column does: nothing (same column), nothing but a notice (a done or closed status the
 * viewer may not close into), or a status change.
 */
export function planBoardMove(
  issue: IssueListItem,
  to: StatusDefinition | undefined,
  viewer: Viewer | undefined,
): BoardMovePlan {
  if (!to || to.key === issue.statusKey) return { kind: 'none' };
  if (isClosing(to.category) && !canCloseIssue(viewer, issue))
    return { kind: 'denied' };
  return { kind: 'patch', statusKey: to.key };
}

/**
 * Where a drop lands. The column under the pointer wins, so a card can be dropped into an empty column: with
 * `closestCorners` alone a tall empty column loses to the nearest card of the column the drag started in.
 */
export const boardCollisionDetection: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  return within.length > 0 ? within : closestCorners(args);
};

/**
 * The column a drag ended over. dnd-kit reports either a column (its droppable id is `column:<statusKey>`) or a card
 * inside one (its sortable id is the issue id), so a card is resolved to the column it sits in.
 */
export function resolveDropStatus(
  overId: string | null | undefined,
  columns: readonly BoardColumn[],
): StatusDefinition | undefined {
  if (!overId) return undefined;
  if (overId.startsWith('column:')) {
    const key = overId.slice('column:'.length);
    return columns.find((column) => column.status.key === key)?.status;
  }
  return columns.find((column) =>
    column.issues.some((issue) => issue.id === overId),
  )?.status;
}

/** The error reasons that mean "this move is not allowed" rather than a failed request. */
export function isRejectedTransition(
  status: number | undefined,
  reason: string | undefined,
): boolean {
  return (
    reason === 'TRANSITION_NOT_ALLOWED' ||
    reason === 'REVISION_CONFLICT' ||
    status === 403
  );
}
