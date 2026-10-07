/**
 * Work for executors of other kinds: what a change, a comment or a release starts, as the kind that executes it decides
 * (`PrincipalKind.work`). The plugin never knows what "work" is; it tells the kind's handler, in the transaction of the
 * change, and the handler answers what it started and what it did not start and why (`RunAttempt[]`).
 *
 * `kindTriggers` is the default of the triggers (`domains/issues/ports.ts`): it hands each change to the work handler of
 * every kind concerned (the issue's executor before and after, the kinds a comment mentions or answers), and turns the
 * attempts that started into the `triggered` mentions a comment returns. A plugin that binds `projectsTriggersToken`
 * replaces it.
 *
 * `collectRunAttempts` runs a service call and collects every attempt its triggers reported, for a preview or a test,
 * without changing what the call returns.
 *
 * A handler may announce something to run after the change commits (`work.announced`): it is delivered on the plugin's
 * event bus like any other event, and only the plugin that owns `kind` reads its `payload`.
 *
 * What a handler did not start because the issue is held (`blocked`) or waits where nothing starts (`dormant`), and the
 * queued work it withdrew when the issue became held (`onBlocked`), is recorded on the issue's activity, as the
 * principal's: `work_skipped { reason, trigger, blockers | status }` and `work_withdrawn { reason, runId, blockers }`.
 * Whether an issue is held is the plugin's to say (`SubtaskService.blockersOf`); the handler asks it and answers
 * `skipped: 'blocked'`.
 *
 * Collect only: a plan's rehearsal (`Tx.rehearsal`, `kernel/tx.ts`) runs the same triggers in a transaction that
 * always rolls back and drops every event. A handler then answers the attempts it would make (`started: true` for work
 * it would start, `skipped` with the reason otherwise) and queues, cancels or announces nothing; the rehearsal turns the
 * attempts into the plan row's `wakes`.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

import type { DatabaseConnection } from '@nocobase/db';

import type { MentionRef } from '../../shared/comments.js';
import type { Issue } from '../../shared/issues.js';
import type { Blocker } from '../../shared/subtasks.js';
import type {
  CommentChange,
  IssueChange,
  IssueTriggers,
} from '../domains/issues/ports.js';
import type { ActivityRecorder } from './activity.js';
import type { KindRegistry } from './kinds.js';
import type { Tx } from './tx.js';

declare module './events.js' {
  interface DomainEventMap {
    /** Something a kind's work handler did in the transaction, for that kind's plugin to hear after commit. */
    'work.announced': { readonly kind: string; readonly payload: unknown };
  }
}

/**
 * Why a handler started nothing for a principal: `deferred`, the person asked not to start now; `blocked`, the issue
 * waits for unfinished issues; `dormant`, the issue is where work does not start (`BACKLOG_STATUS`).
 */
export type RunAttemptSkip =
  | 'deferred'
  | 'denied'
  | 'blocked'
  | 'dormant'
  | 'duplicate'
  | 'archived'
  | 'noRunner'
  | 'unavailable';

/** One principal a change concerned, and whether work started for it. */
export interface RunAttempt {
  /** The kind of the principal (`agent`). */
  readonly kind: string;
  readonly principalId: string;
  readonly subjectId: string;
  /** What caused it: `assigned`, `comment`, `mention`, `statusChange`, `unblocked`… */
  readonly triggerType: string;
  readonly started: boolean;
  readonly skipped?: RunAttemptSkip;
  /** The kind's own reference to the work, such as a run id. */
  readonly runId?: string;
}

/** Queued work a handler withdrew because of a change. */
export interface WorkWithdrawal {
  readonly kind: string;
  readonly principalId: string;
  readonly subjectId: string;
  /** The kind's own reference to the work, such as a run id. */
  readonly runId: string;
  /** `blocked`: the issue waits for unfinished issues now. */
  readonly reason: 'blocked';
}

/**
 * A kind's answer to changes of the issues it executes or is named in. Each call joins the change's transaction; when
 * that transaction is a rehearsal (`tx.rehearsal`), it only answers what it would start.
 */
export interface IssueWorkHandler {
  /** A new issue, or an update (including a status moved by a workflow event or an approval). */
  onIssueChanged(tx: Tx, change: IssueChange): Promise<readonly RunAttempt[]>;
  /**
   * A person's comment that is not a note, on an issue the kind executes or in which it is mentioned or answered. The
   * attempts that started become the comment's `triggered` mentions. Throwing refuses the comment.
   */
  onCommentCreated?(
    tx: Tx,
    change: CommentChange,
  ): Promise<readonly RunAttempt[]>;
  /** The issue's owner changed while the kind executes it: queued work woken by the previous owner is withdrawn. */
  onOwnerChanged?(
    tx: Tx,
    input: {
      readonly issue: Issue;
      readonly from: string;
      readonly to: string;
    },
  ): Promise<readonly RunAttempt[]>;
  /**
   * A `blockedBy` was added and the issue is held now: work not yet taken up should wait. Answers what it withdrew.
   */
  onBlocked?(
    tx: Tx,
    input: { readonly issue: Issue; readonly blockers: readonly Blocker[] },
  ): Promise<readonly WorkWithdrawal[]>;
  /** Nothing holds the issue any more. */
  onUnblocked?(
    tx: Tx,
    input: { readonly issue: Issue; readonly releasedBy: Issue },
  ): Promise<readonly RunAttempt[]>;
  /** Every sub-issue (`stage` null), or every sub-issue of one stage, of an issue the kind executes is finished. */
  onSubtasksFinished?(
    tx: Tx,
    input: {
      readonly parent: Issue;
      readonly stage: number | null;
      readonly childIssueIds: readonly string[];
    },
  ): Promise<readonly RunAttempt[]>;
}

const collector = new AsyncLocalStorage<RunAttempt[]>();

/** Reports attempts to the innermost `collectRunAttempts` around the caller, if any. */
export function recordRunAttempts(attempts: readonly RunAttempt[]): void {
  collector.getStore()?.push(...attempts);
}

/** Runs `fn` and collects the attempts the triggers reported while it ran. */
export async function collectRunAttempts<T>(
  fn: () => Promise<T>,
): Promise<{ readonly value: T; readonly attempts: readonly RunAttempt[] }> {
  const attempts: RunAttempt[] = [];
  const value = await collector.run(attempts, fn);
  return { value, attempts };
}

function handlerOf(
  kinds: KindRegistry,
  key: string | null | undefined,
): IssueWorkHandler | undefined {
  return key ? kinds.get(key)?.work : undefined;
}

/** The distinct kinds with a work handler among `keys`, in order. */
function handlersOf(
  kinds: KindRegistry,
  keys: Iterable<string | null | undefined>,
): (readonly [string, IssueWorkHandler])[] {
  const seen = new Map<string, IssueWorkHandler>();
  for (const key of keys) {
    const work = handlerOf(kinds, key);
    if (key && work && !seen.has(key)) seen.set(key, work);
  }
  return [...seen];
}

export interface KindTriggersDeps {
  /** Writes the skips and withdrawals on the issue's activity; without it they are only reported. */
  readonly activity?: ActivityRecorder;
  /** What holds an issue now, for the activity's words (`SubtaskService.blockersOf`). */
  readonly blockers?: (
    conn: DatabaseConnection,
    issue: Issue,
  ) => Promise<readonly Blocker[]>;
}

const blockerRefs = (blockers: readonly Blocker[]) =>
  blockers.map((blocker) => ({
    issueId: blocker.issueId,
    identifier: blocker.identifier,
  }));

/** The default triggers: each change to the work handlers of the kinds it concerns. */
export function kindTriggers(
  kinds: KindRegistry,
  deps: KindTriggersDeps = {},
): IssueTriggers {
  /** Reports the attempts, and records on `issue` the ones held back or dormant. */
  async function report(
    tx: Tx,
    issue: Issue,
    attempts: Promise<readonly RunAttempt[]> | undefined,
  ): Promise<readonly RunAttempt[]> {
    const result = (await attempts) ?? [];
    recordRunAttempts(result);
    if (tx.rehearsal || !deps.activity) return result;
    let blockers: readonly Blocker[] | undefined;
    for (const attempt of result) {
      if (attempt.skipped !== 'blocked' && attempt.skipped !== 'dormant')
        continue;
      let details: Record<string, unknown>;
      if (attempt.skipped === 'blocked') {
        blockers ??= (await deps.blockers?.(tx.conn, issue)) ?? [];
        details = { blockers: blockerRefs(blockers) };
      } else details = { status: issue.statusKey };
      await deps.activity.record(tx.conn, {
        issueId: issue.id,
        actor: { type: attempt.kind, id: attempt.principalId },
        action: 'work_skipped',
        details: {
          reason: attempt.skipped,
          trigger: attempt.triggerType,
          ...details,
        },
      });
      tx.emit({ type: 'issue.changed', issueId: issue.id });
    }
    return result;
  }

  return {
    async onIssueChanged(tx, change) {
      const { before, after } = change;
      for (const [, work] of handlersOf(kinds, [
        before?.executor?.type,
        after.executor?.type,
      ]))
        await report(tx, after, work.onIssueChanged(tx, change));
      if (before && before.ownerUserId !== after.ownerUserId) {
        const work = handlerOf(kinds, after.executor?.type);
        await report(
          tx,
          after,
          work?.onOwnerChanged?.(tx, {
            issue: after,
            from: before.ownerUserId,
            to: after.ownerUserId,
          }),
        );
      }
    },

    async onCommentCreated(tx, change) {
      const concerned = handlersOf(kinds, [
        change.issue.executor?.type,
        change.parent?.authorType,
        ...change.mentions.map((ref) => ref.kind),
      ]);
      const triggered: MentionRef[] = [];
      for (const [, work] of concerned)
        for (const attempt of await report(
          tx,
          change.issue,
          work.onCommentCreated?.(tx, change),
        ))
          if (
            attempt.started &&
            !triggered.some(
              (ref) =>
                ref.kind === attempt.kind && ref.id === attempt.principalId,
            )
          )
            triggered.push({ kind: attempt.kind, id: attempt.principalId });
      return triggered;
    },

    async onBlocked(tx, input) {
      const { issue, blockers } = input;
      // Every kind: queued work may be for a principal a comment woke, not only for the executor.
      const concerned = handlersOf(
        kinds,
        kinds.list().map((kind) => kind.key),
      );
      for (const [, work] of concerned) {
        if (!work.onBlocked) continue;
        const withdrawn = await work.onBlocked(tx, input);
        if (tx.rehearsal || !deps.activity) continue;
        for (const item of withdrawn) {
          await deps.activity.record(tx.conn, {
            issueId: issue.id,
            actor: { type: item.kind, id: item.principalId },
            action: 'work_withdrawn',
            details: {
              reason: item.reason,
              runId: item.runId,
              blockers: blockerRefs(blockers),
            },
          });
          tx.emit({ type: 'issue.changed', issueId: issue.id });
        }
      }
    },

    async onUnblocked(tx, input) {
      await report(
        tx,
        input.issue,
        handlerOf(kinds, input.issue.executor?.type)?.onUnblocked?.(tx, input),
      );
    },

    async onSubtasksFinished(tx, input) {
      await report(
        tx,
        input.parent,
        handlerOf(kinds, input.parent.executor?.type)?.onSubtasksFinished?.(
          tx,
          input,
        ),
      );
    },
  };
}
