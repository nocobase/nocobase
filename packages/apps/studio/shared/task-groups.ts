/**
 * The grouped task reads behind the issue lists' split view and table (`GET /api/taskGroups`,
 * `server/issues/task-group-routes.ts`). Both views group the same way:
 *
 * 1. `follow`: the tasks the viewer follows (`/api/followUps`), in the order they chose, at most `FOLLOW_UPS_MAX`;
 * 2. `wait`: tasks something waits on the viewer for (`WaitReason`), the longest waiting first;
 * 3. one group per status (`doing`, `review`, `blocked`, `backlog`, `done`), the latest update first. Done lists only
 *    the last `DONE_WINDOW_DAYS` days and cancelled is left out, unless the status filter names it.
 *
 * The split view (`mode=split`) lists the top-level tasks in the scope, plus the sub-tasks that wait for the viewer and
 * those whose parent is outside the scope, each once. The table (`mode=table`) lists task trees: each entry is a tree's
 * root, a whole tree going into `wait` when any task in it waits for the viewer, and children are read per parent from
 * `GET /api/taskGroups/children`. A tree's tasks outside the scope show as context and count nowhere.
 *
 * Every response carries a `generation` bound to the query and the data it was assembled from; a continuation (`cursor`,
 * children) names it, and `409 TASK_GROUPS_CHANGED` means the data changed in between: read the whole query again.
 */
import type {
  IssueListItem,
  IssueListQuery,
} from '@nocobase/app-plugin-projects/shared/issues';

export const TASK_GROUP_IDS = [
  'follow',
  'wait',
  'doing',
  'review',
  'blocked',
  'backlog',
  'done',
  'cancelled',
] as const;
export type TaskGroupId = (typeof TASK_GROUP_IDS)[number];

/** The groups that are a status, with the status each holds. */
export const STATUS_GROUPS: Readonly<
  Record<Exclude<TaskGroupId, 'follow' | 'wait'>, string>
> = {
  doing: 'in_progress',
  review: 'in_review',
  blocked: 'blocked',
  backlog: 'backlog',
  done: 'done',
  cancelled: 'cancelled',
};

/**
 * What a task waits on the viewer for: accepting its delivery, answering its question, confirming a plan about it,
 * taking it over from its executor, or deciding what to do after its run failed for good.
 */
export const WAIT_REASONS = [
  'failed',
  'takeOver',
  'answer',
  'plan',
  'accept',
] as const;
export type WaitReason = (typeof WAIT_REASONS)[number];

/** How many days of finished tasks the done group lists. */
export const DONE_WINDOW_DAYS = 7;

export type TaskGroupMode = 'split' | 'table';

export interface TaskGroupItem {
  readonly issue: IssueListItem;
  /** The visible parent, when the task has one; the split view says "in PM-238" with it. */
  readonly parent: { readonly id: string; readonly identifier: string } | null;
  /** What it waits on the viewer for, the most pressing first; empty when it does not wait for them. */
  readonly waits: readonly WaitReason[];
  /** Since when it waits for the viewer. */
  readonly waitingSince: string | null;
  readonly followed: boolean;
  /** Changes by others since the viewer last looked, for a followed task; 0 otherwise. */
  readonly unread: number;
  /** Its readable direct sub-tasks, finished (done or cancelled) over all. */
  readonly progress: { readonly finished: number; readonly total: number };
  /** The table: it has readable children to expand. */
  readonly hasChildren: boolean;
  /** The table: outside the scope, shown only to place the tasks under or beside it. */
  readonly context: boolean;
  /** The table, on a root: the tasks to expand so every task in it that waits for the viewer shows. */
  readonly expand: readonly string[];
}

export interface TaskGroupPage {
  readonly group: TaskGroupId;
  /** The split view: the tasks listed. The table: the tasks waiting for the viewer in `wait`, else the tasks in scope. */
  readonly count: number;
  readonly data: readonly TaskGroupItem[];
  readonly nextCursor: string | null;
}

export interface TaskGroups {
  readonly generation: string;
  readonly mode: TaskGroupMode;
  /** The groups in order; a status group with nothing in it is left out, `follow` never. */
  readonly groups: readonly TaskGroupPage[];
  /** The ids the viewer follows, in order, whether or not the scope holds them. */
  readonly following: readonly string[];
  /** Tasks in the scope waiting for the viewer, plus the followed ones waiting for them that it does not hold. */
  readonly waiting: number;
}

export interface TaskChildrenPage {
  readonly generation: string;
  readonly data: readonly TaskGroupItem[];
  readonly nextCursor: string | null;
}

export interface TaskGroupQuery extends Omit<
  IssueListQuery,
  'deleted' | 'cursor' | 'limit' | 'parentIssueId'
> {
  readonly mode?: TaskGroupMode;
  /** `all`: the follow group holds every followed task the search matches, beyond the other filters (My tasks). */
  readonly follow?: 'all' | 'scope';
  /** A continuation of one group. */
  readonly group?: TaskGroupId;
  readonly cursor?: string;
  readonly generation?: string;
  readonly limit?: number;
}

/** The two halves of "My tasks" and their counts, for its tabs, and what waits for the viewer, for its menu entry. */
export interface TaskGroupSummary {
  readonly owned: TaskRoleCount;
  readonly executing: TaskRoleCount;
  /** Every unfinished task the viewer may see that waits for them, each once, whoever owns or executes it. */
  readonly waiting: number;
}

export interface TaskRoleCount {
  /** Unfinished tasks in the role. */
  readonly open: number;
  /** Tasks in the role waiting for the viewer, plus the followed ones waiting for them outside it. */
  readonly waiting: number;
}
