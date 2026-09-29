import type { WorkflowRunOptions } from '@nocobase/app-plugin-workflow';
import type { FlowContext } from '../workflow.js';

const WAIT_MS = 5_000;

export async function run(
  _context: FlowContext,
  runtime: WorkflowRunOptions,
): Promise<{ waitedMs: number; completedAt: string }> {
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

  const completedAt = new Date().toISOString();
  runtime.logger.info('Scheduled test workflow completed after waiting', {
    waitedMs: WAIT_MS,
    completedAt,
  });
  return { waitedMs: WAIT_MS, completedAt };
}
