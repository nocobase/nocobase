/**
 * Moving an issue to another status: the fixed statuses' machine and rules (`domains/statuses`, `server/lifecycle`),
 * run in the caller's transaction. The lifecycle's refusals become this plugin's errors: an unknown status is 400
 * `INVALID_STATUS` and a move nobody allowed 400 `TRANSITION_NOT_ALLOWED`.
 *
 * Entry actions (telling the owner) run each in a savepoint, with their events kept only when they succeed; one that
 * fails is recorded as `stage_action_failed` and the move stands.
 */
import type { Issue } from '../../../shared/issues.js';
import type { ActivityRecorder } from '../../kernel/activity.js';
import type { Actor } from '../../kernel/actor.js';
import { conflict, invalid } from '../../kernel/errors.js';
import type { DomainEvent } from '../../kernel/events.js';
import type { Tx } from '../../kernel/tx.js';
import {
  LifecycleError,
  move,
  type MoveResult,
} from '../../lifecycle/index.js';
import type { StatusCatalog } from './ports.js';

export interface IssueMove {
  readonly issue: Issue;
  readonly catalog: StatusCatalog;
  readonly to: string;
  readonly actor: Actor;
  readonly sourceActor?: Actor;
  /** The status event the move answers: only that event's transitions are taken. */
  readonly event?: string;
  /** Writes the change; runs only when the move may happen now. */
  readonly write: () => Promise<void>;
}

/** A savepoint around one entry action: its events reach the transaction only when it succeeds. */
function isolate(tx: Tx) {
  return async <T>(run: (context: Tx) => Promise<T>): Promise<T> => {
    const events: DomainEvent[] = [];
    const result = await tx.conn.transaction((conn) =>
      run({
        conn,
        emit: (event) => events.push(event),
        ...(tx.rehearsal ? { rehearsal: true } : {}),
      }),
    );
    for (const event of events) tx.emit(event);
    return result;
  };
}

export async function moveIssue(
  deps: { readonly activity: ActivityRecorder },
  tx: Tx,
  input: IssueMove,
): Promise<MoveResult> {
  const { issue, catalog, to, actor } = input;
  let result: MoveResult;
  try {
    result = await move(
      catalog.machine,
      catalog.rules,
      {
        from: issue.statusKey,
        to,
        actor,
        sourceActor: input.sourceActor ?? actor,
        subject: issue,
        context: tx,
        // The fixed statuses never wait for an approval.
        approved: true,
        ...(input.event === undefined ? {} : { event: input.event }),
        isolate: isolate(tx),
      },
      input.write,
    );
  } catch (error) {
    if (!(error instanceof LifecycleError)) throw error;
    if (error.code === 'GUARD_FAILED' && error.failure)
      throw conflict(error.failure.code, error.failure.message, {
        ...error.failure.details,
        rule: error.failure.rule,
      });
    throw invalid(
      error.code === 'UNKNOWN_STATE' ? 'INVALID_STATUS' : error.code,
      error.message,
    );
  }
  if (result.outcome === 'moved')
    for (const report of result.entry)
      if (report.status === 'failed')
        await deps.activity.record(tx.conn, {
          issueId: issue.id,
          actor: input.sourceActor ?? actor,
          action: 'stage_action_failed',
          details: {
            statusKey: to,
            rule: report.rule,
            message:
              report.error instanceof Error
                ? report.error.message
                : String(report.error),
          },
        });
  return result;
}
