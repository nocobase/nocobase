/**
 * What issues depend on but other domains provide. Until those domains exist, the defaults below stand in:
 *
 * - `StatusCatalogs`: the workflow of a project, provided by `domains/workflows`.
 * - `IssueTriggers`: what a change or a comment starts, such as work for an executor of a registered kind. Bound by
 *   another plugin through `projectsTriggersToken`; default: nothing.
 * - `IssueRelations`: sub-issues and dependencies, provided by `domains/subtasks`. Default: none.
 *
 * Who may execute an issue, and how executors and actors are named, comes from the kinds (`kernel/kinds.ts`).
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { ApprovalRequest } from '../../../shared/approvals.js';
import type { Attachment } from '../../../shared/attachments.js';
import type { IssueChecklist } from '../../../shared/checklists.js';
import type {
  IssueComment,
  MentionRef,
  ThreadPage,
} from '../../../shared/comments.js';
import type {
  Issue,
  IssueDetail,
  IssueStartOption,
  StatusCategory,
  StatusDefinition,
} from '../../../shared/issues.js';
import type { IssueSubscriber } from '../../../shared/subscriptions.js';
import type { Blocker } from '../../../shared/subtasks.js';
import type { Viewer } from '../../access/viewer.js';
import type { Actor } from '../../kernel/actor.js';
import type {
  LifecycleMachine,
  LifecycleRegistry,
} from '../../lifecycle/index.js';
import { invalid } from '../../kernel/errors.js';
import type { Tx } from '../../kernel/tx.js';

/** The rules a workflow may name, run in the transaction of the move. */
export type IssueRules = LifecycleRegistry<Issue, Tx>;

export interface StatusCatalog {
  readonly statuses: readonly StatusDefinition[];
  /** Where a new issue starts. */
  readonly initialStatus: string;
  /** The ways a new issue may start, for the New issue form (`IssueStarts`). */
  readonly starts: readonly IssueStartOption[];
  category(key: string): StatusCategory | null;
  /** Who may move an issue where; every status change goes through `move` with it and `rules`. */
  readonly machine: LifecycleMachine;
  readonly rules: IssueRules;
}

export interface StatusCatalogs {
  /** The workflow of a project; `null` is the workflow of issues without one. */
  forProject(
    conn: DatabaseConnection,
    projectId: string | null,
  ): Promise<StatusCatalog>;
}

export interface IssueChange {
  /** Null for a new issue. */
  readonly before: Issue | null;
  readonly after: Issue;
  readonly actor: Actor;
  /** False when the person asked not to start work now. */
  readonly start: boolean;
}

/** Status changes held for approval (`domains/approvals`). */
export interface IssueApprovals {
  /** Holds the change; answers the pending request. */
  request(
    tx: Tx,
    input: {
      readonly issue: Issue;
      readonly toStatus: string;
      readonly actor: Actor;
      readonly approvers: readonly string[];
      readonly approverIds: readonly string[];
    },
  ): Promise<ApprovalRequest>;
  /** The issue is in `statusKey` now: requests to leave another status are stale, except the one being applied. */
  supersede(
    tx: Tx,
    issueId: string,
    statusKey: string,
    except?: string,
  ): Promise<void>;
}

export const noApprovals: IssueApprovals = {
  request: () =>
    Promise.reject(
      invalid('APPROVAL_UNAVAILABLE', 'Approvals are not available.'),
    ),
  supersede: () => Promise.resolve(),
};

/**
 * What the issue page and the list show beside the issue: the current checklist, a status change waiting for approval,
 * sub-issues and dependencies, the newest threads and who follows it.
 */
export interface IssueExtras {
  threads(conn: DatabaseConnection, issue: Issue): Promise<ThreadPage>;
  /** The issue's own files, as the viewer sees them (who may remove which). */
  attachments(
    conn: DatabaseConnection,
    viewer: Viewer | null,
    issue: Issue,
  ): Promise<Attachment[]>;
  subscribers(
    conn: DatabaseConnection,
    issue: Issue,
  ): Promise<IssueSubscriber[]>;
  checklist(
    conn: DatabaseConnection,
    issue: Issue,
  ): Promise<IssueChecklist | null>;
  pendingApproval(
    conn: DatabaseConnection,
    issue: Issue,
  ): Promise<ApprovalRequest | null>;
  recentApprovals(
    conn: DatabaseConnection,
    issue: Issue,
  ): Promise<ApprovalRequest[]>;
  relations(
    conn: DatabaseConnection,
    viewer: Viewer,
    issue: Issue,
  ): Promise<
    Pick<
      IssueDetail,
      | 'subtasks'
      | 'blockedBy'
      | 'blocks'
      | 'relatedTo'
      | 'blockers'
      | 'hiddenBlockerCount'
    >
  >;
  /** Per issue id: its live sub-issues and the unfinished issues it waits for. */
  listCounts(
    conn: DatabaseConnection,
    issues: readonly Issue[],
  ): Promise<
    Map<
      string,
      { readonly subtaskCount: number; readonly blockedCount: number }
    >
  >;
}

/** A comment someone wrote, as the triggers see it. */
export interface CommentChange {
  readonly comment: IssueComment;
  readonly issue: Issue;
  /** The comment it answers, if it is a reply. */
  readonly parent: IssueComment | null;
  readonly actor: Actor;
  /** Every principal the comment mentions, of any kind. */
  readonly mentions: readonly MentionRef[];
}

/**
 * Sub-issues and dependencies (`domains/subtasks`), told about the writes that concern them. Every call joins the
 * caller's transaction.
 */
export interface IssueRelations {
  /** A new issue: 400 unless every `blockedBy` is an issue the viewer sees; inserts them, then checks for a cycle. */
  created(
    tx: Tx,
    issue: Issue,
    blockedBy: readonly string[],
    viewer: Viewer,
  ): Promise<void>;
  /** After the issue's parent or stage was written: 400 `DEPENDENCY_CYCLE` when issues now wait for each other. */
  placed(tx: Tx, issue: Issue): Promise<void>;
  /** After a write: entering a finished status releases the issues waiting for it, and may finish its parent's batch. */
  changed(
    tx: Tx,
    change: {
      readonly before: Issue;
      readonly after: Issue;
      readonly actor: Actor;
    },
  ): Promise<void>;
  /** After a delete: the issue holds nothing back any more, and may have been its parent's last open sub-issue. */
  removed(tx: Tx, issue: Issue, actor: Actor): Promise<void>;
}

export const noRelations: IssueRelations = {
  created: () => Promise.resolve(),
  placed: () => Promise.resolve(),
  changed: () => Promise.resolve(),
  removed: () => Promise.resolve(),
};

/**
 * What a change starts, for the plugins that put executors to work. The optional hooks run in the transaction of the
 * change that caused them; they never decide who is notified.
 */
export interface IssueTriggers {
  /** Runs in the transaction of the change. */
  onIssueChanged(tx: Tx, change: IssueChange): Promise<void>;
  /**
   * A person's comment that is not a note (`/note`), in the transaction that writes it; answers whom it started work
   * for. Only people start work: comments of other kinds never reach this. Throwing refuses the comment.
   */
  onCommentCreated?(
    tx: Tx,
    change: CommentChange,
  ): Promise<readonly MentionRef[]>;
  /** Nothing holds the issue any more (another issue finished or was deleted, or a `blockedBy` was removed). */
  onUnblocked?(
    tx: Tx,
    input: { readonly issue: Issue; readonly releasedBy: Issue },
  ): Promise<void>;
  /** A `blockedBy` was added and the issue is held now. */
  onBlocked?(
    tx: Tx,
    input: { readonly issue: Issue; readonly blockers: readonly Blocker[] },
  ): Promise<void>;
  /** Every sub-issue (`stage` null), or every sub-issue of one stage, is finished. */
  onSubtasksFinished?(
    tx: Tx,
    input: {
      readonly parent: Issue;
      readonly stage: number | null;
      readonly childIssueIds: readonly string[];
    },
  ): Promise<void>;
}

export const noTriggers: IssueTriggers = {
  onIssueChanged: () => Promise.resolve(),
};

export function isTerminal(catalog: StatusCatalog, key: string): boolean {
  const category = catalog.category(key);
  return category === 'done' || category === 'closed';
}
