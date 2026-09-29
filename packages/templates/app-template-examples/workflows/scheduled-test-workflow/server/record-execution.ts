/**
 * Compatibility module for workflow artifacts generated before the node was
 * renamed to `wait-five-seconds`. Existing applications may still have that
 * artifact materialized until the next workflow synchronization.
 */
import type {
  WorkflowRunFunction,
  WorkflowRunJsonValue,
} from '@nocobase/app-plugin-workflow';

const WAIT_MS = 5_000;

export const run: WorkflowRunFunction = async (
  _rawArgs: unknown,
  runtime,
): Promise<WorkflowRunJsonValue> => {
  runtime.signal.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      runtime.signal.removeEventListener('abort', onAbort);
      const reason: unknown = runtime.signal.reason;
      reject(
        reason instanceof Error ? reason : new Error('Workflow run aborted.'),
      );
    };
    const timer = setTimeout(() => {
      runtime.signal.removeEventListener('abort', onAbort);
      resolve();
    }, WAIT_MS);
    runtime.signal.addEventListener('abort', onAbort, { once: true });
  });
  runtime.signal.throwIfAborted();

  const executedAt = new Date().toISOString();
  runtime.logger.info('Scheduled test workflow completed after waiting', {
    waitedMs: WAIT_MS,
    executedAt,
  });
  return { executedAt };
};
