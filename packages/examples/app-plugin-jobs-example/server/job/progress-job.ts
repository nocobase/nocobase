import { Job, type JobExecutionContext } from '@nocobase/jobs';

/** Nothing to carry: every task does the same ten steps. */
export type ProgressPayload = Record<string, never>;

export const PROGRESS_STEPS: number = 10;
/** How long one of the ten steps takes. */
export const PROGRESS_STEP_MS: number = 1000;

/**
 * A payload-only job that works for ten seconds and reports 10% after each
 * second. It lives outside `server/jobs/`, which belongs to the separate
 * `@nocobase/queue` contract and is discovered automatically.
 */
export class ProgressJob extends Job<ProgressPayload> {
  // The handler identity stored with every task: keep it stable.
  public static readonly jobName: string = 'progress';

  public async execute({
    reportProgress,
    signal,
  }: JobExecutionContext): Promise<void> {
    for (let step = 1; step <= PROGRESS_STEPS; step += 1) {
      await wait(PROGRESS_STEP_MS, signal);
      await reportProgress((step / PROGRESS_STEPS) * 100);
    }
  }
}

/**
 * Stands in for real work. When shutdown aborts the signal before a step
 * finishes, it rejects with the signal's own reason: the executor treats that
 * as an interruption, so the task goes back to waiting instead of spending a
 * failure attempt, and the next start runs it from the beginning.
 */
function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason as Error);
      return;
    }
    const abort = (): void => {
      clearTimeout(timer);
      reject(signal.reason as Error);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal.addEventListener('abort', abort, { once: true });
  });
}
