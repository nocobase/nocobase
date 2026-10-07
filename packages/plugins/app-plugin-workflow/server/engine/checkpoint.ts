import type { WorkflowId } from './types.js';

/**
 * A Processor's checkpoint could not be committed.
 *
 * Nothing the segment did is visible: the checkpoint is one transaction, so a
 * failure leaves the database at the previous checkpoint and the work is
 * retried from there.
 */
export class CheckpointCommitError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'CheckpointCommitError';
  }
}

/**
 * The checkpoint's preconditions no longer hold: the run ended, or another
 * worker owns it now. The segment's results are discarded rather than written
 * over whatever happened in the meantime.
 */
export class CheckpointConflictError extends CheckpointCommitError {
  constructor(
    readonly runId: WorkflowId,
    reason: string,
  ) {
    super(
      `Execution "${String(runId)}" checkpoint was not committed: ${reason}`,
    );
    this.name = 'CheckpointConflictError';
  }
}

/** The run is leased by another worker, so this task cannot execute now. */
export class WorkflowBusyError extends Error {
  constructor(readonly runId: WorkflowId) {
    super(`Execution "${String(runId)}" is being processed by another worker`);
    this.name = 'WorkflowBusyError';
  }
}
