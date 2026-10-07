import type { ApprovalRequest } from './approvals.js';
import type { Attachment } from './attachments.js';
import type { IssueChecklist } from './checklists.js';
import type { CommentThread } from './comments.js';
import type { Color, Page, Priority, UserRef } from './common.js';
import type { Label } from './labels.js';
import type { ActivityVia } from './plans.js';
import type { IssueSubscriber } from './subscriptions.js';
import type { Blocker, IssueDependency, SubtaskSummary } from './subtasks.js';
import type { RuleMessage } from './workflows.js';

/** Every status belongs to one category; rules and reports read the category, never the status key. */
export type StatusCategory = 'unstarted' | 'started' | 'done' | 'closed';

export interface StatusDefinition {
  readonly key: string;
  readonly name: string;
  readonly category: StatusCategory;
  readonly color: Color;
}

/**
 * Who works on an issue: a principal of a kind that may execute issues (`shared/kinds.ts`), a member (`user`) unless
 * another plugin registered more. The owner is always a member.
 */
export interface Executor {
  /** A kind's key. */
  readonly type: string;
  readonly id: string;
}

export interface Issue {
  readonly id: string;
  readonly number: number;
  /** `PREFIX-number`, fixed when the issue is created. */
  readonly identifier: string;
  readonly title: string;
  /** Markdown. */
  readonly description: string;
  readonly statusKey: string;
  readonly priority: Priority;
  /** The accountable person; never empty. */
  readonly ownerUserId: string;
  /** Nobody works on it yet when null. */
  readonly executor: Executor | null;
  readonly parentIssueId: string | null;
  /**
   * The batch among its siblings (0 to 1000): a sub-issue waits until every sibling of a lower stage is finished.
   * Only sub-issues have one; null takes no part in the ordering.
   */
  readonly stage: number | null;
  readonly projectId: string | null;
  readonly startDate: string | null;
  readonly dueDate: string | null;
  /** Increases with every change; a write must name the revision it read. */
  readonly revision: number;
  readonly createdById: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastActivityAt: string;
  /** Set when an administrator deleted the issue; such issues appear only in the deleted list. */
  readonly deletedAt: string | null;
}

export interface IssueRef {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
}

export interface IssueProject {
  readonly id: string;
  readonly name: string;
  readonly leadUserId: string | null;
}

export interface IssueListItem extends Issue {
  readonly owner: UserRef | null;
  /** The executor's display name. */
  readonly executorName: string | null;
  /** With its lead, who may close the issue and change its owner. */
  readonly project: IssueProject | null;
  readonly labels: readonly Label[];
  /** Live sub-issues. */
  readonly subtaskCount: number;
  /** Unfinished issues it waits for, those the viewer cannot see included. */
  readonly blockedCount: number;
}

export interface Activity {
  readonly id: string;
  /** A kind's key (`shared/kinds.ts`). */
  readonly actorType: string;
  readonly actorId: string | null;
  readonly actorName: string | null;
  readonly action: string;
  readonly details: Readonly<Record<string, unknown>>;
  /** How the person made the change when not by hand in the browser: an agent, a plan, the CLI or an API key. */
  readonly via: ActivityVia | null;
  readonly createdAt: string;
}

export interface IssueDetail extends IssueListItem {
  readonly parent: IssueRef | null;
  /** The statuses of the issue's workflow, in order. */
  readonly statuses: readonly StatusDefinition[];
  /** The newest activities, oldest first; `activitiesNextCursor` is the `pageToken` of older ones. */
  readonly activities: readonly Activity[];
  readonly activitiesNextCursor: string | null;
  /** The newest threads, oldest first; `threadsNextCursor` is the `pageToken` of older ones. */
  readonly threads: readonly CommentThread[];
  readonly threadsNextCursor: string | null;
  /** Who follows the issue, in the order they started. */
  readonly subscribers: readonly IssueSubscriber[];
  /** The issue's own files, oldest first (its comments carry theirs). */
  readonly attachments: readonly Attachment[];
  /** The checklist of the current status, if it has one. */
  readonly checklist: IssueChecklist | null;
  /** The status change waiting for approval, if any (one at a time). */
  readonly pendingApproval: ApprovalRequest | null;
  /** The last `RECENT_DECIDED_APPROVALS` decided requests, the most recently decided first. */
  readonly recentApprovals: readonly ApprovalRequest[];
  /** Live sub-issues, by number. */
  readonly subtasks: readonly SubtaskSummary[];
  /** What it waits for, what waits for it, and what is only linked to it; issues the viewer cannot see are left out. */
  readonly blockedBy: readonly IssueDependency[];
  readonly blocks: readonly IssueDependency[];
  readonly relatedTo: readonly IssueDependency[];
  /** What holds it now, dependencies first, then earlier stages; only issues the viewer can see. */
  readonly blockers: readonly Blocker[];
  /** Blockers the viewer cannot see. */
  readonly hiddenBlockerCount: number;
}

/**
 * `PATCH /api/projects/issues/{issueId}` answers `{ data: UpdateIssueResult }`: with 200, the issue after the change
 * and no `pendingApproval`; with 202, the issue unchanged and the request that holds the status change for approval
 * (nothing else in the request is applied then).
 */
export interface UpdateIssueResult {
  readonly issue: Issue;
  readonly pendingApproval: ApprovalRequest | null;
}

export interface BoardColumn {
  readonly status: StatusDefinition;
  readonly issues: readonly IssueListItem[];
  readonly nextCursor: string | null;
}

export interface IssueBoard {
  readonly columns: readonly BoardColumn[];
}

export type IssuePage = Page<IssueListItem>;
export type ActivityPage = Page<Activity>;

export const ISSUE_SORTS = [
  'updated',
  'created',
  'number',
  'priority',
] as const;
export type IssueSort = (typeof ISSUE_SORTS)[number];

/**
 * The issues a service lists. `GET /api/projects/issues` takes the same filters, `deleted=true`, `orderBy` (such as
 * `updatedAt desc`; see `server/routes/schemas.ts`) for `sort` and `direction`, and `pageSize` and `pageToken` for
 * `limit` and `cursor`. `GET /api/projects/issues/board` takes the filters and `pageSize` per column.
 */
export interface IssueListQuery {
  readonly statusKey?: string;
  readonly projectId?: string;
  readonly ownerUserId?: string;
  readonly executorId?: string;
  readonly labelId?: string;
  /** An issue id, or `none` for top-level issues only. */
  readonly parentIssueId?: string;
  /** Matches the title or the identifier. */
  readonly q?: string;
  /** Deleted issues instead of live ones (those who may delete issues only). */
  readonly deleted?: boolean;
  /** What the list is ordered by; `updated` by default. */
  readonly sort?: IssueSort;
  /** `desc` by default: the newest, the highest number, or the most urgent first. */
  readonly direction?: 'asc' | 'desc';
  readonly cursor?: string;
  readonly limit?: number;
}

/**
 * One way to start a new issue (`GET /api/projects/issues/starts`): a status of the workflow, with the label and hint of its
 * `startOption` rule, or none for the workflow's initial status when no rule offers it.
 */
export interface IssueStartOption {
  readonly status: StatusDefinition;
  readonly label: RuleMessage | null;
  readonly hint: RuleMessage | null;
}

/**
 * The ways a new issue may start in a project's workflow: empty while the workflow offers none (the issue starts in
 * `initialStatus`); otherwise the initial status first, then every status carrying a `startOption` rule, in order.
 */
export interface IssueStarts {
  readonly initialStatus: string;
  readonly options: readonly IssueStartOption[];
}

export interface CreateIssueRequest {
  readonly title: string;
  readonly description?: string;
  /** Defaults to `todo`; a done or closed status is refused. */
  readonly statusKey?: string;
  readonly priority?: Priority;
  /** Defaults to the creator. */
  readonly ownerUserId?: string;
  readonly executor?: Executor | null;
  readonly parentIssueId?: string | null;
  /** Only with a parent. */
  readonly stage?: number | null;
  /** Issues it waits for, by id or identifier (at most `BLOCKED_BY_ON_CREATE_MAX`). */
  readonly blockedBy?: readonly string[];
  /** Defaults to the parent's project. */
  readonly projectId?: string | null;
  readonly startDate?: string | null;
  readonly dueDate?: string | null;
  readonly labelIds?: readonly string[];
  /** False: an executor of another kind (an agent) is set, but asked not to start work now. */
  readonly start?: boolean;
  /**
   * True: the issue sets its project up (`Project.setupIssueId`), so every issue created in the project after it waits
   * for it until it is finished. Only in a project the creator manages that has no unfinished setup issue.
   */
  readonly projectSetup?: boolean;
}

export interface UpdateIssueRequest {
  /** The revision the change is based on. */
  readonly revision: number;
  readonly title?: string;
  readonly description?: string;
  readonly statusKey?: string;
  readonly priority?: Priority;
  readonly ownerUserId?: string;
  readonly executor?: Executor | null;
  /** Removing the parent clears the stage too. */
  readonly parentIssueId?: string | null;
  /** Only for a sub-issue. */
  readonly stage?: number | null;
  /** A status the new project's workflow lacks must be replaced in the same request. */
  readonly projectId?: string | null;
  readonly startDate?: string | null;
  readonly dueDate?: string | null;
  /** Replaces the whole set. */
  readonly labelIds?: readonly string[];
  /** False: a new executor of another kind (an agent) is set, but asked not to start work now. */
  readonly start?: boolean;
}

export const ISSUE_TITLE_MAX = 500;
export const ISSUE_DESCRIPTION_MAX = 200_000;
export const ISSUE_PAGE_LIMIT = { default: 50, max: 100 } as const;
export const ACTIVITY_PAGE_LIMIT = { default: 50, max: 200 } as const;
