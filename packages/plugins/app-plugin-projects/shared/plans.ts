/**
 * Operation plans: the contract between the plan engine (this plugin, `server/domains/plans/`) and whoever proposes,
 * shows or decides plans: the New issue dialog's AI draft tab and the plan card (this plugin's client), and the
 * application that proposes them for its agents (for example, an agent in a conversation, the change behind a status rule's
 * suggested executor) and the CLI commands it contributes. Everything here is plain JSON; nothing in it depends on the agents plugin.
 *
 * ## What a plan is
 *
 * A plan is a short list of changes (1 to `PLAN_ROWS_MAX` rows) that one person, the **decider**, reviews and then
 * executes as a whole. Each row is one operation (`PlanOp`) with its `params`; a row may carry a `ref`, a name later
 * rows use to point at what it created (`{ "ref": "api" }` wherever an issue or a project is expected), so a plan can
 * create a project, issues in it and sub-issues under them in one go. A row may only refer to an earlier row.
 *
 * A plan also says where it comes from (`source`, opaque to this plugin except `kind`, `key` and `issueId`) and, when
 * an agent proposed it, which agent (`proposer`), so the timeline can say "via ‹Agent›'s plan".
 *
 * ## Lifecycle
 *
 * ```text
 *              create (rehearsed; refused whole with per-row errors when a row fails)
 *                 │
 *                 ▼
 *   ┌──────── pending ◄──────────── edit (params / remove rows; re-rehearsed)
 *   │   │        │   ▲
 *   │   │        │   └──────────── retry (re-rehearsed with fresh baselines) ◄───┐
 *   │   │        ▼                                                                │
 *   │   │    executing ── a target changed since the rehearsal ──► stale ─────────┤
 *   │   │        │      ── a row failed ─────────────────────────► failed ────────┘
 *   │   │        ▼
 *   │   │    executed ── undo (within PLAN_UNDO_HOURS, previewed, then applied at once) ──► undone
 *   │   ▼
 *   │  voided  (by the decider; or `superseded`: a newer plan with the same `source.key`)
 *   ▼
 *  expired   (PLAN_TTL_HOURS after the last rehearsal, from pending, stale or failed)
 * ```
 *
 * - **Rehearsal.** Creating, editing and retrying a plan rehearse it: every row runs for real, in one transaction, one
 *   savepoint per row, as the decider (with the permissions of whoever submitted it: a person in the browser, or an
 *   agent's narrowed view of its asker), through the same services the browser uses, and the transaction is always
 *   rolled back. Nothing is announced, notified or queued: the triggers only report whom the row would wake
 *   (`PlanWake`). Each row gets a `PlanRowCheck`: whether it passes, whom it would wake, its risk flags, and the values
 *   its target has now (`baseline`). A plan with a failing row is never stored: `POST /plans` answers 400
 *   `PLAN_INVALID` with every row's check in `details.rows`, so the proposer can fix it.
 * - **Execution.** `pending → executing` is a conditional update that succeeds once. Then every row runs in one
 *   transaction as the person who clicked (their own permissions, not the proposer's), and the timeline marks each
 *   change "via ‹Agent›'s plan". Before each row its target is compared with the baseline: a change made meanwhile
 *   rolls back the whole plan and leaves it `stale`; a row the services refuse leaves it `failed` (`failure` names the
 *   row). Either way nothing of it is applied, and `retry` rehearses it again. Events go out only after the commit.
 * - **Undo.** Within `PLAN_UNDO_HOURS` of its execution, the person who executed it may undo it in one step. The
 *   reverse rows (`PlanUndoOp`) are built newest first and rehearsed: `POST /plans/{planId}/undo` with `{ dryRun: true }`
 *   answers that preview (`PlanUndoPreview`: what will be reverted and what is left alone, with why), and without it
 *   applies the same rows at once, in one transaction, as the person, traced to the plan. Issues and projects the plan
 *   created are removed (issues soft-deleted, an empty project deleted), changed fields get their baseline back,
 *   comments are deleted and dependencies reversed. A row whose target was changed by anyone since the execution is
 *   left alone and listed in `skipped`. The plan becomes `undone`; nothing else is stored, so there is never a
 *   separate plan to execute.
 * - **Deciding.** Executing, failing, going stale, being voided by a person and being undone are decisions; the
 *   server tells the plugin bound to `projectsPlanHooksToken` (`PlanDecided`) in the transaction that records the
 *   outcome, so an agent can be woken to report back. Expiry and supersession are not decisions.
 *
 * ## Who may see and act
 *
 * The decider sees the plan and acts on it (edit, execute, retry, void). A plan from a status rule
 * (`source.kind === 'statusRule'` with `source.issueId`) is also visible to, and decidable by, the issue's owner and
 * anyone who may edit that issue. Undo is for the person who executed the plan. Everybody else gets 404.
 *
 * ## HTTP API (`/api/projects/plans`, signed in)
 *
 * | Method and path                   | Body / query                    | Answer                                          |
 * | --------------------------------- | ------------------------------- | ----------------------------------------------- |
 * | `POST /plans/rehearse`            | `CreatePlanRequest`             | 200 `{ data: PlanRehearsal }`; nothing stored   |
 * | `POST /plans`                     | `CreatePlanRequest`             | 201 `{ data: Plan }`; 400 `PLAN_INVALID`        |
 * | `GET /plans`                      | `status`, `sourceKind`, `sourceKey`, `issueId`, `pageSize`, `pageToken` | 200 `{ data: Plan[], meta: { nextPageToken? } }`, newest first |
 * | `GET /plans/{planId}`             |                                 | 200 `{ data: Plan }`                            |
 * | `PATCH /plans/{planId}`           | `EditPlanRequest`               | 200 `{ data: Plan }`; 400 `PLAN_INVALID`        |
 * | `POST /plans/{planId}/execute`    | `PlanActionRequest`             | 200 `{ data: Plan }` (executed, stale, failed)  |
 * | `POST /plans/{planId}/retry`      | `PlanActionRequest`             | 200 `{ data: Plan }`; 400 `PLAN_INVALID`        |
 * | `POST /plans/{planId}/void`       | `PlanActionRequest`             | 200 `{ data: Plan }`                            |
 * | `POST /plans/{planId}/undo`       | `PlanUndoRequest`               | 200 `{ data: PlanUndoPreview }` (dry run), or   |
 * |                                   |                                 | 200 `{ data: Plan }`, undone                    |
 *
 * Errors are the standard error body with domain `projects`: 400 `PLAN_INVALID` (`metadata.rows`: one `PlanRowCheck`
 * per row, in order; or `metadata.errors` for a malformed request), 404 `PLAN_NOT_FOUND`, 409 `ABORTED`
 * `REVISION_CONFLICT` (an edit or action based on an older `revision`) and `UNDO_STALE` (something changed between
 * the preview and applying it: preview again), and 400 `FAILED_PRECONDITION` `PLAN_NOT_OPEN` (the plan is not in a
 * state that allows it), `PLAN_EXPIRED`, `UNDO_EXPIRED` and `NOTHING_TO_UNDO` (every row was changed since).
 */
import type { ApiErrorBody, Priority } from './common.js';
import type { Executor } from './issues.js';
import type { ProjectVisibility } from './projects.js';
import type { DependencyType } from './subtasks.js';

export const PLAN_TITLE_MAX = 200;
export const PLAN_DESCRIPTION_MAX = 2000;
export const PLAN_ROWS_MAX = 50;
/** A plan not executed within this many hours of its last rehearsal expires. */
export const PLAN_TTL_HOURS = 24;
/** An executed plan can be undone for this many hours. */
export const PLAN_UNDO_HOURS = 24;
/** A row's `ref`: a letter, then letters, digits, `_` or `-`; unique within its plan. */
export const PLAN_REF_PATTERN: RegExp = /^[A-Za-z][A-Za-z0-9_-]{0,39}$/u;
/** At most this many plans per page of `GET /plans`. */
export const PLAN_PAGE_LIMIT = { default: 20, max: 50 } as const;

// ---------------------------------------------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------------------------------------------

/** What a proposer may put in a plan. Approval decisions, deletions, permissions and settings never go in a plan. */
export const PLAN_OPS = [
  'issue.create',
  'issue.update',
  'comment.create',
  'dependency',
  'project.create',
] as const;
export type PlanOp = (typeof PLAN_OPS)[number];

/** Rows only the server writes, to undo an executed plan. `POST /plans` refuses them. */
export const PLAN_UNDO_OPS = [
  'issue.retract',
  'comment.retract',
  'project.retract',
] as const;
export type PlanUndoOp = (typeof PLAN_UNDO_OPS)[number];

export type PlanRowOp = PlanOp | PlanUndoOp;

/** What an earlier row created, by its `ref`. */
export interface RowRef {
  readonly ref: string;
}

/** An issue: its id, its identifier (`PM-12`), or the issue an earlier `issue.create` row created. */
export type IssueTarget = string | RowRef;

/** A project: its id, or the project an earlier `project.create` row created. */
export type ProjectTarget = string | RowRef;

/**
 * `issue.create`: a new issue, as `POST /api/projects/issues` takes it (`CreateIssueRequest`), with targets where it names
 * other issues or a project. `start: false` sets an agent executor without starting its work now.
 */
export interface IssueCreateParams {
  readonly title: string;
  readonly description?: string;
  readonly projectId?: ProjectTarget | null;
  readonly parentIssueId?: IssueTarget | null;
  readonly stage?: number | null;
  readonly statusKey?: string;
  readonly priority?: Priority;
  readonly ownerUserId?: string;
  readonly executor?: Executor | null;
  readonly labelIds?: readonly string[];
  readonly startDate?: string | null;
  readonly dueDate?: string | null;
  readonly blockedBy?: readonly IssueTarget[];
  readonly start?: boolean;
}

/** The fields `issue.update` may change; at least one. Changing `statusKey` moves the issue through its workflow. */
export interface IssueFieldChanges {
  readonly title?: string;
  readonly description?: string;
  readonly statusKey?: string;
  readonly priority?: Priority;
  readonly ownerUserId?: string;
  readonly executor?: Executor | null;
  readonly parentIssueId?: IssueTarget | null;
  readonly stage?: number | null;
  readonly projectId?: ProjectTarget | null;
  readonly startDate?: string | null;
  readonly dueDate?: string | null;
  /** Replaces the whole set. */
  readonly labelIds?: readonly string[];
}

/**
 * `issue.update`. No revision: the rehearsal records the fields' current values (`PlanBaseline`) and execution refuses
 * the plan (`stale`) when one of them changed meanwhile. A status change that needs an approval fails the row
 * (`APPROVAL_REQUIRED`): plans never raise approval requests.
 */
export interface IssueUpdateParams {
  readonly issue: IssueTarget;
  readonly set: IssueFieldChanges;
  readonly start?: boolean;
}

/** `comment.create`: a comment or a reply. Mentions wake agents as any person's comment does; `/note` wakes none. */
export interface CommentCreateParams {
  readonly issue: IssueTarget;
  /** Markdown, with mentions as `[@Name](mention://<kind>/<id>)`. */
  readonly content: string;
  /** The comment it answers. */
  readonly parentId?: string | null;
  /** Uploads of the decider's attached to nothing, sent with the comment (`shared/attachments.ts`). */
  readonly attachmentIds?: readonly string[];
}

/** `dependency`: adds or removes the link that makes `issue` wait for (or relate to) `dependsOn`. */
export interface DependencyParams {
  readonly action: 'add' | 'remove';
  readonly issue: IssueTarget;
  readonly dependsOn: IssueTarget;
  /** `blockedBy` when left out. */
  readonly type?: DependencyType;
}

/** `project.create`: as `POST /api/projects` takes it. The decider becomes a member and, by default, its lead. */
export interface ProjectCreateParams {
  readonly name: string;
  readonly description?: string | null;
  readonly visibility?: ProjectVisibility;
  readonly priority?: Priority;
  readonly leadUserId?: string | null;
  readonly startDate?: string | null;
  readonly dueDate?: string | null;
  /** The workflow of its issues; null or left out for the default workflow. */
  readonly workflowId?: string | null;
}

/** An undo row: the issue, comment or project the plan created. */
export interface RetractParams {
  readonly id: string;
}

export interface PlanOpParams {
  readonly 'issue.create': IssueCreateParams;
  readonly 'issue.update': IssueUpdateParams;
  readonly 'comment.create': CommentCreateParams;
  readonly dependency: DependencyParams;
  readonly 'project.create': ProjectCreateParams;
  readonly 'issue.retract': RetractParams;
  readonly 'comment.retract': RetractParams;
  readonly 'project.retract': RetractParams;
}

/** One row as a proposer writes it. */
export type PlanRowInput = {
  readonly [O in PlanOp]: {
    readonly op: O;
    readonly params: PlanOpParams[O];
    /** The name later rows use for what this row creates (`issue.create`, `project.create`). */
    readonly ref?: string;
  };
}[PlanOp];

// ---------------------------------------------------------------------------------------------------------------
// Source and proposer
// ---------------------------------------------------------------------------------------------------------------

/** Where plans come from; other plugins may use their own kinds. */
export type PlanSourceKind =
  'conversation' | 'intake' | 'statusRule' | (string & {});

/**
 * Where a plan comes from. This plugin reads only `kind` (a status rule's plan is visible to the issue's owner and
 * editors), `key` (a new plan voids the open plans with the same key: `conversation:<id>`, `statusRule:<issueId>`)
 * and `issueId`; `data` is stored and returned untouched (`{ conversationId, runId }`, an intake's file ids, …).
 */
export interface PlanSource {
  readonly kind: PlanSourceKind;
  /** At most 200 characters. */
  readonly key?: string | null;
  /** The issue the plan is about, for a status rule's plan. */
  readonly issueId?: string | null;
  /** Opaque JSON, at most 10 000 characters serialized. */
  readonly data?: unknown;
}

/**
 * The agent that proposed the plan. This plugin only shows its name (through the kinds registry, kind `agent`) and
 * records it with every change the plan makes; the ids are the agents plugin's.
 */
export interface PlanProposer {
  readonly agentId: string;
  readonly runId?: string | null;
  readonly conversationId?: string | null;
}

// ---------------------------------------------------------------------------------------------------------------
// Rehearsal
// ---------------------------------------------------------------------------------------------------------------

/**
 * What a row is risky for; the plan card asks again before executing such a row, and the agents plugin makes them go
 * through a plan instead of a direct write.
 *
 * - `startsRun`: it would wake an agent (`wakes` has a started attempt).
 * - `finalStatus`: it moves an issue to a done or closed status.
 * - `ownerChange`: it changes an issue's owner, or creates one owned by someone else.
 * - `createsProject`: it creates a project.
 * - `agentExecutor`: it makes a principal other than a person (an agent) an issue's executor.
 */
export const PLAN_RISK_FLAGS = [
  'startsRun',
  'finalStatus',
  'ownerChange',
  'createsProject',
  'agentExecutor',
] as const;
export type PlanRiskFlag = (typeof PLAN_RISK_FLAGS)[number];

/**
 * Whom a row wakes, as the triggers answered (the server's `RunAttempt`, with a display name). In a rehearsal nothing
 * is queued: `started` says whether it would start, `skipped` why not.
 */
export interface PlanWake {
  /** The principal's kind (`agent`). */
  readonly kind: string;
  readonly principalId: string;
  readonly name: string | null;
  /** The issue it would work on. */
  readonly subjectId: string;
  /** `assigned`, `comment`, `mention`, `statusChange`, … */
  readonly triggerType: string;
  readonly started: boolean;
  /** `deferred`, `denied`, `blocked`, `dormant`, `duplicate`, `archived`, `noRunner`, `unavailable`. */
  readonly skipped?: string;
  /** After execution: the kind's reference to the work it queued. */
  readonly runId?: string;
}

/** What a row is about, named for the card. */
export interface PlanObjectRef {
  readonly type: 'issue' | 'project' | 'comment' | 'dependency';
  /** Null for something a rehearsal created (rolled back) or that does not exist yet. */
  readonly id: string | null;
  /** Issues: `PM-12`. */
  readonly identifier?: string | null;
  /** Issues: the title; projects: the name. */
  readonly title?: string | null;
}

/**
 * What a row's target looked like when the plan was rehearsed. Execution compares the same fields first; any
 * difference makes the plan `stale`. Undo restores `fields`.
 *
 * - `issue.update`: `target` is the issue, `fields` the current value of each field the row sets (`executor` as
 *   `{ type, id }` or null, `labelIds` sorted).
 * - `dependency` remove: `target` is the dependency, `fields` `{ exists: true }`; add: `{ exists: false }`.
 * - Rows on what an earlier row creates, and creations, have none.
 */
export interface PlanBaseline {
  readonly target: PlanObjectRef;
  readonly fields: Readonly<Record<string, unknown>>;
}

export interface PlanRowCheck {
  readonly ok: boolean;
  /** Why it fails: the service's own error (`INVALID_STATUS`, `FORBIDDEN`, …) or `INVALID_PARAMS`, `INVALID_REF`. */
  readonly error: ApiErrorBody | null;
  readonly target: PlanObjectRef | null;
  readonly wakes: readonly PlanWake[];
  readonly flags: readonly PlanRiskFlag[];
  readonly baseline: PlanBaseline | null;
}

/** `POST /plans/rehearse`: every row's check, in order; `ok` when all pass. */
export interface PlanRehearsal {
  readonly ok: boolean;
  readonly rows: readonly PlanRowCheck[];
}

// ---------------------------------------------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------------------------------------------

export const PLAN_STATUSES = [
  'pending',
  'executing',
  'executed',
  'failed',
  'stale',
  'voided',
  'expired',
  'undone',
] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

/** States a plan can still be executed from (after `retry` for `failed` and `stale`). */
export const PLAN_OPEN_STATUSES: readonly PlanStatus[] = [
  'pending',
  'failed',
  'stale',
];

/** What an executed row did; kept for the card and for undo. */
export interface PlanRowResult {
  /** What it acted on (the issue, the dependency, …). */
  readonly target: PlanObjectRef | null;
  /** What it created, if anything. */
  readonly created: PlanObjectRef | null;
  /** The fields it set, as the whole plan left them (undo skips the row when they changed since). */
  readonly after: Readonly<Record<string, unknown>> | null;
  /** The revision the whole plan left the row's issue at, for rows that created or changed an issue. */
  readonly revision: number | null;
  readonly wakes: readonly PlanWake[];
}

export interface PlanRow {
  readonly id: string;
  /** 0-based order of execution. */
  readonly position: number;
  readonly op: PlanRowOp;
  readonly ref: string | null;
  /** As the proposer wrote it (or the decider edited it). */
  readonly params: unknown;
  /** The latest rehearsal of the row. */
  readonly check: PlanRowCheck | null;
  /** Once executed. */
  readonly result: PlanRowResult | null;
}

/** Why execution did not happen (`stale`, `failed`). */
export interface PlanFailure {
  /** `PLAN_STALE`, or the failing row's error code. */
  readonly code: string;
  readonly message: string;
  readonly rowId: string | null;
  readonly details?: Readonly<Record<string, unknown>>;
}

/** A row of an executed plan that undoing it leaves alone. */
export interface PlanUndoSkip {
  readonly rowId: string;
  readonly position: number;
  /** `changed`: someone changed it since; `gone`: it no longer exists; `notReversible`. */
  readonly reason: 'changed' | 'gone' | 'notReversible';
  readonly message: string;
}

export interface Plan {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: PlanStatus;
  /** Set when `voided`: `person` or `superseded`. */
  readonly voidReason: 'person' | 'superseded' | null;
  readonly source: PlanSource;
  readonly proposer: PlanProposer | null;
  /** The proposer's display name. */
  readonly proposerName: string | null;
  readonly deciderUserId: string;
  readonly deciderName: string | null;
  /** Who submitted it: a person, or another kind (`system` for a status rule). */
  readonly createdBy: { readonly type: string; readonly id: string | null };
  /** Increases with every change; actions name the revision they were based on. */
  readonly revision: number;
  readonly rows: readonly PlanRow[];
  readonly failure: PlanFailure | null;
  /** When an open plan expires. */
  readonly expiresAt: string;
  readonly rehearsedAt: string;
  readonly executedAt: string | null;
  readonly executedById: string | null;
  /** Until when it may be undone; null when it cannot be (not executed, or undone). */
  readonly undoableUntil: string | null;
  /** An undone plan: the rows undoing it left alone. */
  readonly skipped: readonly PlanUndoSkip[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ---------------------------------------------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------------------------------------------

/** `POST /plans` and `POST /plans/rehearse`. */
export interface CreatePlanRequest {
  /** 1 to `PLAN_TITLE_MAX` characters. */
  readonly title: string;
  /** Plain text, at most `PLAN_DESCRIPTION_MAX` characters. */
  readonly description?: string;
  readonly source: PlanSource;
  readonly proposer?: PlanProposer | null;
  /**
   * Who decides it; the caller when left out. Over HTTP it can only be the caller; another plugin proposing for
   * someone else (a status rule) uses the server's `PlanService.propose`.
   */
  readonly deciderUserId?: string;
  /** 1 to `PLAN_ROWS_MAX` rows. */
  readonly rows: readonly PlanRowInput[];
}

/** `PATCH /plans/{planId}`: change rows' params or remove rows (never add). The plan is rehearsed again. */
export interface EditPlanRequest {
  readonly revision: number;
  readonly title?: string;
  readonly description?: string;
  readonly rows: readonly {
    readonly id: string;
    /** Replaces the row's params. */
    readonly params?: unknown;
    readonly remove?: boolean;
  }[];
}

/** `execute`, `retry`, `void`: the revision the decider saw. */
export interface PlanActionRequest {
  readonly revision: number;
}

/** `POST /plans/{planId}/undo`. */
export interface PlanUndoRequest {
  /** Only answer what undoing would do (`PlanUndoPreview`); nothing changes. */
  readonly dryRun?: boolean;
}

/** One change undoing a plan would revert. */
export interface PlanUndoRevert {
  /** The row of the plan it reverts. */
  readonly rowId: string;
  readonly position: number;
  /** The reverse operation: `issue.retract`, `issue.update` (fields back), `comment.retract`, … */
  readonly op: PlanRowOp;
  /** What it acts on. */
  readonly target: PlanObjectRef | null;
  /** For `issue.update`: the fields and the values they get back. */
  readonly restore: Readonly<Record<string, unknown>> | null;
}

/** What undoing a plan would do now. */
export interface PlanUndoPreview {
  readonly planId: string;
  readonly revert: readonly PlanUndoRevert[];
  readonly skipped: readonly PlanUndoSkip[];
}

/**
 * The plans a service lists (`GET /plans` takes the same filters, with `pageSize` and `pageToken` for `limit` and
 * `cursor`). Without `issueId`: the plans the caller decides. With it: the plans about that issue they may see, by its
 * source or by the issues the plan's rows touch.
 */
export interface PlanListQuery {
  /** A status, or `open` for the pending, failed and stale ones that have not expired. */
  readonly status?: PlanStatus | 'open';
  readonly sourceKind?: string;
  readonly sourceKey?: string;
  readonly issueId?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

// ---------------------------------------------------------------------------------------------------------------
// Decisions, for the plugin that proposed
// ---------------------------------------------------------------------------------------------------------------

export type PlanDecisionOutcome =
  'executed' | 'failed' | 'stale' | 'voided' | 'undone';

/**
 * A plan was decided (server hook `PlanHooks.onPlanDecided`, bound through `projectsPlanHooksToken`). The agents
 * plugin wakes the source conversation with it; a voided plan should wake nobody, but is reported so the proposer's
 * view stays in step.
 */
export interface PlanDecided {
  readonly planId: string;
  readonly outcome: PlanDecisionOutcome;
  readonly title: string;
  readonly source: PlanSource;
  readonly proposer: PlanProposer | null;
  readonly deciderUserId: string;
  /** Who executed, voided or undid it. */
  readonly decidedById: string;
  readonly failure: PlanFailure | null;
  readonly rows: readonly {
    readonly position: number;
    readonly op: PlanRowOp;
    readonly ok: boolean;
    readonly created: PlanObjectRef | null;
    readonly target: PlanObjectRef | null;
    readonly error: ApiErrorBody | null;
    /** The work the row started or skipped, once executed (`PlanRowResult.wakes`); empty otherwise. */
    readonly wakes: readonly PlanWake[];
  }[];
}

// ---------------------------------------------------------------------------------------------------------------
// How a change was made, as the timeline shows it
// ---------------------------------------------------------------------------------------------------------------

/** Opaque execution facts supplied by the application; projects does not depend on the agents plugin. */
export interface ActivityExecution {
  readonly attempt: number;
  readonly runnerId: string;
  readonly runnerName?: string | null;
  readonly runnerOwnerUserId?: string | null;
  readonly runnerOwnerName?: string | null;
  readonly runnerTrust?: 'team' | 'ownerOnly' | null;
  readonly machineHidden?: boolean;
  readonly tool?: string | null;
  readonly toolVersion?: string | null;
  readonly model?: string | null;
  readonly actualModels?: readonly string[];
  readonly effort?: string | null;
  readonly actualEffort?: string | null;
  readonly actualEffortSource?: string | null;
  readonly actualEffortAt?: string | null;
}

/**
 * Who a person acted through, recorded with each activity (`Activity.via`) and comment (`IssueComment.source`).
 * `agent`: an agent acted for the person or proposed the plan they executed. `plan`: a plan nobody's agent proposed.
 * `cli` and `api_key`: the API without the browser.
 */
export interface ActivityVia {
  readonly type: 'cli' | 'api_key' | 'agent' | 'plan';
  readonly agentId?: string;
  readonly agentName?: string | null;
  readonly runId?: string;
  readonly execution?: ActivityExecution;
  /** Only meaningful to the conversation's owner; the agents plugin checks access. */
  readonly conversationId?: string;
  readonly planId?: string;
}
