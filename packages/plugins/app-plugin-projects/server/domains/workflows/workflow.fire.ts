/**
 * Firing a contributed workflow event (`event-types.ts`) for a batch of issues: the plugin that registered the event
 * says it happened, and each issue moves along its workflow's transition on it, if there is one. This plugin never
 * knows what the event means.
 *
 * - The move is the system's: the transition is `on` the event with `actors: ['system']`, nobody approves it, and the
 *   issue's triggers and notices see the system. The activity names `actor`, the person (or principal) whose action
 *   the event reports, with `note` and `details`.
 * - Entry conditions still apply (built-in and contributed `canEnter`, a checklist left incomplete): a refusal leaves
 *   that issue where it is, records `auto_move_skipped` with the code, and comes back as `refused`; the other issues
 *   still move.
 * - Everything runs in one transaction: the caller's `tx` when given (so its own writes commit with the moves), else
 *   a new one. An error that is not a refusal rolls the whole batch back.
 * - Only a registered, contributed event may be fired: the built-in `subtasks.done` is this plugin's own, and an event
 *   nobody registered is a programming error (`TypeError`).
 */
import { isBuiltInEvent } from '../../../shared/workflows.js';
import type { Actor } from '../../kernel/actor.js';
import { invalid } from '../../kernel/errors.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import type { EventMove, EventTarget, IssueService } from '../issues/index.js';
import type { WorkflowEventTypes } from './event-types.js';

export const EVENT_NOTE_MAX = 200;
export const EVENT_BATCH_MAX = 500;

export interface WorkflowEventFiring {
  /** A registered, contributed event's key. */
  readonly event: string;
  /** The issues it happened to, by id or identifier, each once; at most `EVENT_BATCH_MAX`. */
  readonly issueIds: readonly string[];
  /** Whose action the event reports (the person who merged, say), named by the activity; the system when left out. */
  readonly actor?: Actor;
  /** A short phrase shown with the move, as it is, at most `EVENT_NOTE_MAX` characters. */
  readonly note?: string;
  /** Kept with each activity, opaque to this plugin. */
  readonly details?: Readonly<Record<string, unknown>>;
}

export type WorkflowEventMove = EventMove;
export type WorkflowEventTarget = EventTarget;

export interface WorkflowEventService {
  /** Where other plugins register their events (`projectsWorkflowEventsToken`). */
  readonly types: WorkflowEventTypes;
  /** One result per issue, in the order given. 400 `INVALID_EVENT_FIRING` for a bad batch or note. */
  fire(firing: WorkflowEventFiring, tx?: Tx): Promise<WorkflowEventMove[]>;
  /**
   * Where firing the event would take one issue (by id or identifier), without moving it: for a confirmation that
   * says what an action will do. Read on `conn` when given, else outside any transaction. Entry conditions are not
   * checked.
   */
  target(
    event: string,
    issueId: string,
    conn?: Tx['conn'],
  ): Promise<WorkflowEventTarget>;
}

export function createWorkflowEventService(deps: {
  readonly tx: TxRunner;
  readonly types: WorkflowEventTypes;
  readonly issues: () => Pick<IssueService, 'fireEvent' | 'eventTarget'>;
}): WorkflowEventService {
  function registered(event: string): void {
    if (isBuiltInEvent(event))
      throw new TypeError(
        `${event} is a built-in workflow event; only its own plugin fires it.`,
      );
    if (!deps.types.get(event))
      throw new TypeError(`No plugin registered the workflow event ${event}.`);
  }

  return {
    types: deps.types,
    target(event, issueId, conn) {
      registered(event);
      return deps.issues().eventTarget(conn ?? deps.tx.read(), issueId, event);
    },
    async fire(firing, outer) {
      registered(firing.event);
      const ids = [...new Set(firing.issueIds)];
      if (ids.length > EVENT_BATCH_MAX)
        throw invalid(
          'INVALID_EVENT_FIRING',
          `At most ${EVENT_BATCH_MAX} issues at once.`,
        );
      const note = firing.note?.trim();
      if (note && note.length > EVENT_NOTE_MAX)
        throw invalid(
          'INVALID_EVENT_FIRING',
          `A note is at most ${EVENT_NOTE_MAX} characters.`,
        );
      if (ids.length === 0) return [];
      return deps.tx.run(async (tx) => {
        const moves: WorkflowEventMove[] = [];
        for (const id of ids)
          moves.push(
            await deps.issues().fireEvent(tx, id, firing.event, {
              ...(firing.actor ? { actor: firing.actor } : {}),
              ...(note ? { note } : {}),
              ...(firing.details ? { details: firing.details } : {}),
            }),
          );
        return moves;
      }, outer);
    },
  };
}
