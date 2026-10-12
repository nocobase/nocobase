/**
 * Firing a status event (`event-types.ts`) for a batch of issues: the plugin that registered the event says it
 * happened, and each issue in one of the event's `from` statuses moves to its `to` status. This plugin never knows what
 * the event means.
 *
 * - The move is the system's: nobody approves it, and the issue's triggers and notices see the system. The activity
 *   names `actor`, the person (or principal) whose action the event reports, with `note` and `details`.
 * - Everything runs in one transaction: the caller's `tx` when given (so its own writes commit with the moves), else
 *   a new one.
 * - Only a registered event may be fired; an event nobody registered is a programming error (`TypeError`).
 */
import type { Actor } from '../../kernel/actor.js';
import { invalid } from '../../kernel/errors.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import type {
  EventMove,
  EventTarget,
  IssueService,
} from '../issues/issue.service.js';
import type { StatusEventTypes } from './event-types.js';

export const EVENT_NOTE_MAX = 200;
export const EVENT_BATCH_MAX = 500;

export interface StatusEventFiring {
  /** A registered event's key. */
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

export type StatusEventMove = EventMove;
export type StatusEventTarget = EventTarget;

export interface StatusEventService {
  /** Where other plugins register their events (`projectsStatusEventsToken`). */
  readonly types: StatusEventTypes;
  /** One result per issue, in the order given. 400 `INVALID_EVENT_FIRING` for a bad batch or note. */
  fire(firing: StatusEventFiring, tx?: Tx): Promise<StatusEventMove[]>;
  /**
   * Where firing the event would take one issue (by id or identifier), without moving it: for a confirmation that
   * says what an action will do. Read on `conn` when given, else outside any transaction.
   */
  target(
    event: string,
    issueId: string,
    conn?: Tx['conn'],
  ): Promise<StatusEventTarget>;
}

export function createStatusEventService(deps: {
  readonly tx: TxRunner;
  readonly types: StatusEventTypes;
  readonly issues: () => Pick<IssueService, 'fireEvent' | 'eventTarget'>;
}): StatusEventService {
  function registered(event: string): void {
    if (!deps.types.get(event))
      throw new TypeError(`No plugin registered the status event ${event}.`);
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
        const moves: StatusEventMove[] = [];
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
