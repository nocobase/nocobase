import { parseMessage } from './message.js';
import type { Channel, ConsumeHandler, UnregisterHandler } from './types.js';

/** A job handed to the handlers, independent of the implementation that stored it. */
export interface DispatchedJob {
  readonly id: string;
  readonly channel: Channel;
  /** The message as JSON text; each handler receives its own parsed copy. */
  readonly text: string;
}

/**
 * How a dispatch ended, for the implementation to record:
 * - `completed`: every handler succeeded
 * - `failed`: a handler failed; retried within `attempts`
 * - `cancelled`: cancelled by the manager; fails without retrying
 * - `requeue`: not run to completion because no handler was registered or
 *   the service is shutting down; returns to waiting without spending an attempt
 */
export type DispatchOutcome =
  | { readonly kind: 'completed' }
  | { readonly kind: 'failed'; readonly error: unknown }
  | { readonly kind: 'cancelled'; readonly reason: string }
  | { readonly kind: 'requeue' };

export interface QueueDispatcherEvents {
  /** The first handler was registered, or one was registered after the last left. */
  readonly onActive: () => void;
  /** The last handler was unregistered. */
  readonly onIdle: () => void;
}

interface HandlerEntry {
  readonly handler: ConsumeHandler<unknown>;
  readonly running: Set<Promise<unknown>>;
}

const DEFAULT_CANCEL_REASON = 'The queue job was cancelled.';

/**
 * Keeps the handlers of one queue on this instance and runs every job
 * through all of them. Both implementations dispatch through it, so
 * snapshots, result aggregation, unregistration and cancellation behave the
 * same whatever stores the job.
 */
export class QueueDispatcher {
  private readonly handlers = new Map<symbol, HandlerEntry>();
  private readonly active = new Map<string, AbortController>();
  private readonly interruption = new AbortController();

  public constructor(private readonly events: QueueDispatcherEvents) {}

  public get hasHandlers(): boolean {
    return this.handlers.size > 0;
  }

  public get activeCount(): number {
    return this.active.size;
  }

  public register(handler: ConsumeHandler<unknown>): UnregisterHandler {
    if (typeof handler !== 'function') {
      throw new TypeError('A queue handler must be a function.');
    }
    const key = Symbol('queue-handler');
    const entry: HandlerEntry = { handler, running: new Set() };
    this.handlers.set(key, entry);
    if (this.handlers.size === 1) this.events.onActive();
    let unregistering: Promise<void> | undefined;
    return () => {
      unregistering ??= (async () => {
        if (this.handlers.delete(key) && this.handlers.size === 0) {
          this.events.onIdle();
        }
        // Calls already in a snapshot finish; no new snapshot includes it.
        await Promise.allSettled([...entry.running]);
      })();
      return unregistering;
    };
  }

  /**
   * Runs the job through a snapshot of the handlers and waits for all of
   * them. `signal` is the implementation's own signal, such as BullMQ's.
   */
  public async dispatch(
    job: DispatchedJob,
    signal?: AbortSignal,
  ): Promise<DispatchOutcome> {
    const snapshot = [...this.handlers.values()];
    if (snapshot.length === 0 || this.interruption.signal.aborted) {
      return { kind: 'requeue' };
    }
    // Parsed up front: invalid text fails the job before any handler runs.
    const first = parseMessage(job.text);
    const cancellation = new AbortController();
    this.active.set(job.id, cancellation);
    const combined = AbortSignal.any([
      cancellation.signal,
      this.interruption.signal,
      ...(signal ? [signal] : []),
    ]);
    try {
      const results = await Promise.allSettled(
        snapshot.map((entry, index) => {
          const message = index === 0 ? first : parseMessage(job.text);
          const call = Promise.resolve().then(() =>
            entry.handler(job.channel, message, combined),
          );
          entry.running.add(call);
          void call
            .catch(() => undefined)
            .finally(() => entry.running.delete(call));
          return call;
        }),
      );
      // A handler that ignored the signal and returned must not complete the job.
      if (cancellation.signal.aborted) {
        return { kind: 'cancelled', reason: cancelReason(cancellation.signal) };
      }
      const errors = results.flatMap((result) =>
        result.status === 'rejected' ? [result.reason as unknown] : [],
      );
      if (errors.length === 0) return { kind: 'completed' };
      if (this.interruption.signal.aborted) return { kind: 'requeue' };
      return {
        kind: 'failed',
        error:
          errors.length === 1
            ? errors[0]
            : new AggregateError(
                errors,
                `${errors.length} handlers of queue job ${job.id} failed.`,
              ),
      };
    } finally {
      this.active.delete(job.id);
    }
  }

  public cancelJob(jobId: string, reason?: string): boolean {
    const cancellation = this.active.get(jobId);
    if (!cancellation) return false;
    cancellation.abort(new Error(reason ?? DEFAULT_CANCEL_REASON));
    return true;
  }

  public cancelAllJobs(reason?: string): void {
    for (const jobId of [...this.active.keys()]) this.cancelJob(jobId, reason);
  }

  /** Sends the shutdown signal, which is not a cancellation, to every current and later job. */
  public interrupt(): void {
    if (!this.interruption.signal.aborted) {
      this.interruption.abort(new Error('The queue service is shutting down.'));
    }
  }
}

function cancelReason(signal: AbortSignal): string {
  const reason: unknown = signal.reason;
  return reason instanceof Error ? reason.message : DEFAULT_CANCEL_REASON;
}

/**
 * Runs `handler` only for jobs published on one of `channels`, and returns
 * without doing anything for the rest. An empty list matches nothing.
 */
export function withChannel<T = unknown>(
  channels: Channel | readonly Channel[],
  handler: ConsumeHandler<T>,
): ConsumeHandler<T> {
  const accepted = new Set<Channel>(
    typeof channels === 'string' ? [channels] : channels,
  );
  return async (channel, message, signal): Promise<void> => {
    if (!accepted.has(channel)) return;
    await handler(channel, message, signal);
  };
}
