import type { WorkflowStore } from '../collections/store.js';
import type {
  WorkflowId,
  WorkflowLogger,
  WorkflowTerminalEvent,
  WorkflowTerminalObserver,
} from './types.js';
import { asIdFilter, nowInstant, serializeJson } from './utils.js';

export interface WriteWorkflowRunTerminalOptions {
  readonly store: WorkflowStore;
  readonly runId: WorkflowId;
  readonly expectedStatus: number | null;
  /** When set, the write only applies while this worker still holds the run's lease. */
  readonly leaseToken?: string;
  readonly status: number;
  readonly reason: string | null;
  readonly output: unknown;
  readonly finishedAt?: string;
}

export interface FinalizeWorkflowRunOptions extends WriteWorkflowRunTerminalOptions {
  readonly observer?: WorkflowTerminalObserver;
  readonly logger?: WorkflowLogger;
}

/**
 * Writes a run's terminal state, without telling anyone.
 *
 * A caller that does this inside a transaction has to publish the event itself
 * once the transaction has committed, because an observer must never see a
 * state that can still be rolled back.
 */
export async function writeWorkflowRunTerminal(
  options: WriteWorkflowRunTerminalOptions,
): Promise<WorkflowTerminalEvent | null> {
  const finishedAt = options.finishedAt ?? nowInstant();
  const result = await options.store.runs.updateMany({
    filter: {
      id: asIdFilter(options.runId),
      status: options.expectedStatus,
      ...(options.leaseToken === undefined
        ? {}
        : { leaseToken: options.leaseToken }),
    },
    values: {
      status: options.status,
      output: serializeJson(options.output),
      reason: options.reason,
      finishedAt,
    },
  });
  if (result.updatedCount === 0) return null;
  const row = await options.store.runs.findOne({
    filter: { id: asIdFilter(options.runId) },
    select: (select) => select.fields('sourceType', 'sourceId'),
  });
  return {
    runId: options.runId,
    status: options.status,
    reason: options.reason,
    output: options.output,
    finishedAt,
    sourceType: typeof row?.sourceType === 'string' ? row.sourceType : null,
    sourceId: typeof row?.sourceId === 'string' ? row.sourceId : null,
  };
}

export async function publishWorkflowTerminal(
  event: WorkflowTerminalEvent,
  observer: WorkflowTerminalObserver | undefined,
  logger: WorkflowLogger | undefined,
): Promise<void> {
  if (event.status === 0) return;
  try {
    await observer?.(event);
  } catch (error) {
    // The authoritative Workflow terminal state must survive an optional
    // projection observer being temporarily unavailable. Scheduler repairs
    // a missed fast-path notification through its persisted observer.
    logger?.error('Workflow terminal observer failed', {
      runId: event.runId,
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      error,
    });
  }
}

export async function finalizeWorkflowRun(
  options: FinalizeWorkflowRunOptions,
): Promise<WorkflowTerminalEvent | null> {
  const event = await writeWorkflowRunTerminal(options);
  if (!event) return null;
  await publishWorkflowTerminal(event, options.observer, options.logger);
  return event;
}
