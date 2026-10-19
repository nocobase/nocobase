/**
 * What issues depend on but other domains provide:
 *
 * - `StatusService`: the fixed statuses and the machine every move goes through, provided by `domains/statuses`.
 * - `IssueTriggers`: what a change or a comment starts, such as work for an executor of a registered kind. Bound by
 *   another plugin through `projectsTriggersToken`; default: nothing.
 * - `IssueRelations`: sub-issues and dependencies, provided by `domains/subtasks`. Default: none.
 *
 * Who may execute an issue, and how executors and actors are named, comes from the kinds (`kernel/kinds.ts`).
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { Attachment } from '../../../shared/attachments.js';
import type {
  IssueComment,
  MentionRef,
  ThreadPage,
} from '../../../shared/comments.js';
import type {
  Issue,
  IssueDetail,
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
import type { Tx } from '../../kernel/tx.js';

/** The rules the fixed statuses name, run in the transaction of the move. */
export type IssueRules = LifecycleRegistry<Issue, Tx>;

/** The fixed statuses as one machine: who may move an issue where, and what entering a status does. */
export interface StatusCatalog {
  readonly statuses: readonly StatusDefinition[];
  category(key: string): StatusCategory | null;
  /** Every status change goes through `move` with it and `rules`. */
  readonly machine: LifecycleMachine;
  readonly rules: IssueRules;
}

/** The fixed statuses (`shared/statuses.ts`), and where principals of each kind may move an issue. */
export interface StatusService {
  list(): readonly StatusDefinition[];
  category(key: string): StatusCategory | null;
  /** The statuses a principal of `kind` may move an issue in `from` to, in order; `mayMove` is not asked. */
  allowedMoves(kind: string, from: string): string[];
  /** The machine as the kinds and status events registered now make it. */
  catalog(): StatusCatalog;
}

export interface IssueChange {
  /** The already authorized caller for a service write; absent for automatic status events. */
  readonly viewer?: Viewer;
  /** A person explicitly assigned the issue to themselves, including an unchanged owner field. */
  readonly ownerClaimed?: boolean;
  /** Null for a new issue. */
  readonly before: Issue | null;
  readonly after: Issue;
  readonly actor: Actor;
}

/** The attachments domain, as a new issue takes the files added to it before it existed (`domains/attachments`). */
export interface IssueAttachments {
  /** Attaches the uploader's uploads to the issue; 400 when one is not theirs or already attached, attaching nothing. */
  attach(
    tx: Tx,
    uploader: { readonly type: string; readonly id: string },
    target: { readonly issueId: string; readonly commentId: null },
    ids: unknown,
  ): Promise<readonly { readonly id: string; readonly filename: string }[]>;
}

/**
 * What the issue page and the list show beside the issue: sub-issues and dependencies, the newest threads, its files
 * and who follows it.
 */
export interface IssueExtras {
  threads(
    conn: DatabaseConnection,
    issue: Issue,
    viewer?: Viewer,
  ): Promise<ThreadPage>;
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
    readableIds?: ReadonlySet<string>,
  ): Promise<
    Map<
      string,
      { readonly subtaskCount: number; readonly blockedCount: number }
    >
  >;
  /**
   * Of `issues`, those waiting for at least one unfinished issue, whoever may read it, in a fixed number of queries
   * whatever their count.
   */
  blockedIds(
    conn: DatabaseConnection,
    issues: readonly Issue[],
  ): Promise<Set<string>>;
}

/** A comment someone wrote, as the triggers see it. */
export interface CommentChange {
  readonly comment: IssueComment;
  readonly issue: Issue;
  /** The comment it answers, if it is a reply. */
  readonly parent: IssueComment | null;
  readonly actor: Actor;
  /**
   * The person the comment was written for: its writer, or for an agent's the person its run acts for. Null when it
   * was written through `CommentWriter`, which names no person.
   */
  readonly userId: string | null;
  /** Every principal the comment mentions, of any kind. */
  readonly mentions: readonly MentionRef[];
}

/**
 * Sub-issues and dependencies (`domains/subtasks`), told about the writes that concern them. Every call joins the
 * caller's transaction.
 */
export interface IssueRelations {
  /** Before issue/counter writes; held until the outer transaction ends. Pass false when adding no waits. */
  lock(tx: Tx, advance?: boolean): Promise<void>;
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
  lock: () => Promise.resolve(),
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
    input: {
      readonly issue: Issue;
      readonly releasedBy: Issue;
      readonly actor?: Actor;
    },
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
      readonly actor?: Actor;
    },
  ): Promise<void>;
}

export const noTriggers: IssueTriggers = {
  onIssueChanged: () => Promise.resolve(),
};

export function isTerminal(
  catalog: Pick<StatusCatalog, 'category'>,
  key: string,
): boolean {
  const category = catalog.category(key);
  return category === 'done' || category === 'closed';
}
