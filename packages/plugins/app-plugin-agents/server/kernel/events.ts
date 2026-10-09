/**
 * What happened, announced after the transaction that did it commits. Listeners are realtime pushes and wake-ups;
 * delivery is in-process and best effort, so nothing a listener does may be needed for correctness.
 */
import type { JobStatus, RunStatus } from '@nocobase/agent-protocol';

import type { RunRequest } from '../../shared/runs.js';

/**
 * Something people should hear about, for the application to deliver where its people look (an inbox, say): the
 * plugin decides who and what, the application how. Text is English, for a reader without the application's own
 * wording; `type` and `params` are what the application words it from.
 *
 * - `runner_upgrade_required` (subject `runner`): a runner connected speaking a protocol this application does not
 *   serve, so it gets no work until it is upgraded; to its owner. `params`: `runnerName`, `runnerVersion`,
 *   `protocolVersion` (the runner's), `minProtocolVersion` and `maxProtocolVersion` (the application's),
 *   `latestVersion` (the runner the application serves for its platform, or null).
 */
export interface RunnerNotice {
  /** Stable for the same news: delivering it twice tells people once. */
  readonly key: string;
  readonly type: 'runner_upgrade_required';
  readonly userIds: readonly string[];
  readonly subject: {
    readonly kind: 'runner';
    readonly id: string;
    readonly label: string;
  };
  readonly title: string;
  readonly body: string;
  readonly params: Readonly<Record<string, string | number | null>>;
}

/**
 * - `run_request_expired` (subject `runRequest`): a request passed its deadline or cannot be handed to a usable new
 *   responsible; to the person who asked, who may still run it as themselves
 *   (`POST /api/agents/runRequests/{requestId}/runAsMe`). `params`: `agentName`, `subjectKind`, `subjectId`, `requestId`,
 *   `responsibleUserId`, `reason` (`timeout` or `reassignment`).
 */
export interface RunRequestNotice {
  /** Stable for the same news: delivering it twice tells people once. */
  readonly key: string;
  readonly type: 'run_request_expired';
  readonly userIds: readonly string[];
  readonly subject: {
    readonly kind: 'runRequest';
    readonly id: string;
    readonly label: string;
  };
  readonly title: string;
  readonly body: string;
  readonly params: Readonly<Record<string, string | number | null>>;
}

/** Something people should hear about (see `RunnerNotice` and `RunRequestNotice`). */
export type AgentsNotice = RunnerNotice | RunRequestNotice;

/**
 * A run request (`shared/runs.ts`) was made (`created`, for its responsible to confirm), or settled: `confirmed` (its
 * `runId` the run it went into), `rejected`, `withdrawn` (also when its asker ran it as themselves, `runId` set),
 * `superseded` (handed to a new responsible) or `expired`. For the application's inbox and notifications.
 */
type RunRequestEvent<T extends string> = {
  readonly type: T;
  readonly request: RunRequest;
};

export type AgentsEvent =
  | RunRequestEvent<'runRequest.created'>
  | RunRequestEvent<'runRequest.confirmed'>
  | RunRequestEvent<'runRequest.rejected'>
  | RunRequestEvent<'runRequest.withdrawn'>
  | RunRequestEvent<'runRequest.superseded'>
  | RunRequestEvent<'runRequest.expired'>
  /** A run entered the queue, or a queued run's input changed what a runner would see. */
  | {
      readonly type: 'run.queued';
      readonly runId: string;
      readonly agentId: string;
    }
  | {
      readonly type: 'run.changed';
      readonly runId: string;
      readonly status: RunStatus;
    }
  /** Events were stored; `lastSeq` is the highest one. */
  | {
      readonly type: 'run.events';
      readonly runId: string;
      readonly lastSeq: number;
    }
  | {
      readonly type: 'run.input';
      readonly runId: string;
      readonly inputId: string;
    }
  /** A run went back to the queue; it may be claimed from `availableAt`. */
  | {
      readonly type: 'run.requeued';
      readonly runId: string;
      readonly availableAt: string | null;
    }
  /** A conversation got messages (up to `lastSeq`), or its title, agent, run or state changed. Announced to its owner. */
  | {
      readonly type: 'conversation.changed';
      readonly conversationId: string;
      readonly userId: string;
      readonly lastSeq?: number;
    }
  | { readonly type: 'agent.changed'; readonly agentId: string }
  /**
   * The agent can no longer be given work: it was archived or deleted. Its queued runs were withdrawn in the same
   * transaction; the application lets go of the work it gave the agent (the assembling application clears it as executor of unfinished
   * issues). `byUserId` is who archived or deleted it, `name` its name then.
   */
  | {
      readonly type: 'agent.removed';
      readonly agentId: string;
      readonly name: string;
      readonly reason: 'archived' | 'deleted';
      readonly byUserId: string | null;
    }
  | { readonly type: 'runner.changed'; readonly runnerId: string }
  /** A job entered the queue, or went back to it (`availableAt`: when it may be claimed). */
  | {
      readonly type: 'job.queued';
      readonly jobId: string;
      readonly availableAt: string | null;
    }
  | {
      readonly type: 'job.changed';
      readonly jobId: string;
      readonly status: JobStatus;
    }
  /** Job events were stored; `lastSeq` is the highest one. */
  | {
      readonly type: 'job.events';
      readonly jobId: string;
      readonly lastSeq: number;
    }
  /** People should hear of something (`AgentsNotice`); the application delivers it. */
  | { readonly type: 'notice'; readonly notice: AgentsNotice }
  /**
   * What a notice told no longer holds, so the application settles it where people look: for
   * `runner_upgrade_required`, the runner connected again speaking a protocol the application serves.
   */
  | {
      readonly type: 'notice.cleared';
      readonly notice: Pick<AgentsNotice, 'type' | 'subject'>;
    };

export type AgentsEventType = AgentsEvent['type'];

export type AgentsEventOf<T extends AgentsEventType> = Extract<
  AgentsEvent,
  { readonly type: T }
>;

export interface AgentsEventBus {
  emit(event: AgentsEvent): void;
  /** Returns what stops listening. */
  on<T extends AgentsEventType>(
    type: T,
    listener: (event: AgentsEventOf<T>) => void,
  ): () => void;
  onAny(listener: (event: AgentsEvent) => void): () => void;
}

export function createEventBus(
  onListenerError: (error: unknown) => void = () => undefined,
): AgentsEventBus {
  const listeners = new Set<(event: AgentsEvent) => void>();
  return {
    emit(event) {
      for (const listener of [...listeners]) {
        try {
          listener(event);
        } catch (error) {
          onListenerError(error);
        }
      }
    },
    on(type, listener) {
      const wrapped = (event: AgentsEvent) => {
        if (event.type === type) listener(event as AgentsEventOf<typeof type>);
      };
      listeners.add(wrapped);
      return () => {
        listeners.delete(wrapped);
      };
    },
    onAny(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
