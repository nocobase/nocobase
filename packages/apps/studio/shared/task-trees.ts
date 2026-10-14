import type {
  IssueListItem,
  IssueListQuery,
} from '@nocobase/app-plugin-projects/shared/issues';

export const TASK_GROUPS = ['input', 'review', 'decision', 'routine'] as const;
export type TaskGroup = (typeof TASK_GROUPS)[number];
export type TaskReason = 'question' | 'review' | 'failedRun' | 'ownerHandoff';
export interface TaskAttention {
  readonly reasons: readonly TaskReason[];
  readonly needsHumanAction: boolean;
  readonly waitingForViewer: boolean;
}
export interface TaskTotals {
  readonly tasks: number;
  readonly trees: number;
  readonly needsHumanAction: number;
  readonly waitingForViewer: number;
}
export interface TaskTreeRow {
  readonly issue: IssueListItem;
  readonly parentId: string | null;
  readonly rootId: string;
  readonly matchesFilter: boolean;
  readonly hasChildren: boolean;
  readonly progress: { readonly finished: number; readonly total: number };
  readonly attention: TaskAttention;
  readonly explanation: {
    readonly identifier: string;
    readonly reason: TaskReason;
  } | null;
}
export interface TaskTreePage {
  readonly generation: string;
  readonly data: readonly TaskTreeRow[];
  readonly nextCursor: string | null;
}
export interface TaskTreeGroup extends TaskTreePage {
  readonly group: TaskGroup;
  readonly totals: TaskTotals;
}
export interface TaskTrees {
  readonly generation: string;
  readonly groups: readonly TaskTreeGroup[];
}
export interface TaskTreeQuery extends Omit<IssueListQuery, 'deleted'> {
  readonly group?: TaskGroup;
  readonly parentId?: string;
  readonly generation?: string;
}
