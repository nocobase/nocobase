import { fork } from 'node:child_process';
import { deploymentSignal } from './deployment-control.js';

const WORKER_TIMEOUT_MS = 120_000;
const KILL_GRACE_MS = 1_000;

export interface ArtifactWorkerOptions {
  signal?: AbortSignal;
  /** Execution deadline, excluding time waiting for another archive worker. */
  timeoutMs?: number;
}

/** Wait for close before callers clean staging files, including on errors. */
function runArtifactWorker(
  mode: 'hash' | 'extract',
  archive: string,
  destination: string | undefined,
  signal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<string> {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const worker = new URL(
      import.meta.url.endsWith('.ts')
        ? './artifact-worker.ts'
        : './artifact-worker.js',
      import.meta.url,
    );
    const child = fork(
      worker,
      [mode, archive, ...(destination ? [destination] : [])],
      {
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
        execArgv: [],
      },
    );
    let result: string | undefined;
    let failure: Error | undefined;
    let killTimer: ReturnType<typeof setTimeout> | undefined;
    const terminate = (error: Error): void => {
      if (killTimer) return;
      failure = error;
      child.kill('SIGTERM');
      killTimer = setTimeout(() => child.kill('SIGKILL'), KILL_GRACE_MS);
    };
    const abort = (): void => terminate(signal!.reason as Error);
    const timer = setTimeout(
      () =>
        terminate(
          new Error(`Artifact worker ${mode} timed out after ${timeoutMs} ms`),
        ),
      timeoutMs,
    );
    signal?.addEventListener('abort', abort, { once: true });
    // Cover cancellation during process creation/listener registration.
    if (signal?.aborted) abort();
    child.on('message', (message: { result?: string; error?: string }) => {
      if (killTimer) return;
      if (message.error) terminate(new Error(message.error));
      else result = message.result;
    });
    child.on('error', (error) => {
      terminate(error);
    });
    child.on('close', (code, exitSignal) => {
      clearTimeout(timer);
      clearTimeout(killTimer);
      signal?.removeEventListener('abort', abort);
      if (failure) reject(failure);
      else if (code !== 0 || result === undefined)
        reject(
          new Error(
            `Artifact worker exited without a result (code ${code}, signal ${exitSignal})`,
          ),
        );
      else resolve(result);
    });
  });
}

let workers: Promise<unknown> = Promise.resolve();
/** A Host runs at most one archive worker, including on-demand materializations. */
export function artifactWorker(
  mode: 'hash' | 'extract',
  archive: string,
  destination?: string,
  options: ArtifactWorkerOptions = {},
): Promise<string> {
  const signal = options.signal ?? deploymentSignal();
  const timeoutMs = options.timeoutMs ?? WORKER_TIMEOUT_MS;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0)
    return Promise.reject(
      new Error('Artifact worker timeout must be a positive integer'),
    );
  let started = false;
  return new Promise((resolve, reject) => {
    // Queued cancellation returns immediately; the queue entry later skips the fork.
    // Running cancellation must wait for close before releasing either caller or queue.
    const abortQueued = (): void => {
      if (!started) reject(signal!.reason as Error);
    };
    signal?.addEventListener('abort', abortQueued, { once: true });
    if (signal?.aborted) abortQueued();
    const work = workers
      .catch(() => undefined)
      .then(() => {
        started = true;
        return runArtifactWorker(mode, archive, destination, signal, timeoutMs);
      });
    workers = work;
    void work.then(resolve, reject).finally(() => {
      signal?.removeEventListener('abort', abortQueued);
    });
  });
}
