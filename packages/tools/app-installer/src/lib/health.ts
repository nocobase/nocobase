import { interruptError, takeInterrupt } from './interrupt.ts';
import type { Pm2 } from './pm2.ts';
import type { FetchLike } from './registry.ts';

export interface HealthOptions {
  timeoutMs: number;
  intervalMs?: number;
  fetchImpl?: FetchLike;
  /** Checked between requests; returning true gives up before the timeout, such as for a process that crashed. */
  failed?: () => Promise<boolean>;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

/** One request to the application's health route; true only for a response whose body says `ok: true`. */
export async function checkHealth(
  url: string,
  fetchImpl: FetchLike = fetch,
): Promise<boolean> {
  try {
    const response = await fetchImpl(url, {
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return false;
    const body = (await response.json()) as { ok?: unknown };
    return body.ok === true;
  } catch {
    return false;
  }
}

/**
 * Polls the health route until it answers, the timeout passes, or `failed` says there is no point waiting. The server
 * listens only once startup, migrations included, has finished, so a healthy answer means the application is ready.
 */
export async function waitForHealthy(
  url: string,
  options: HealthOptions,
): Promise<boolean> {
  const now = options.now ?? Date.now;
  const sleep =
    options.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const deadline = now() + options.timeoutMs;
  for (;;) {
    if (takeInterrupt()) throw interruptError();
    if (await checkHealth(url, options.fetchImpl)) return true;
    if (now() >= deadline) return false;
    if (options.failed && (await options.failed())) return false;
    await sleep(options.intervalMs ?? 1_000);
  }
}

/**
 * Restarts pm2 has made before the application answered, beyond which a start counts as failed.
 * `NOCOBASE_STRICT_STARTUP` makes a failed start exit, so a crash during startup is a real failure rather than a slow
 * start.
 */
const MAX_STARTUP_RESTARTS = 2;

/** A `failed` probe for `waitForHealthy`: the pm2 process has crashed repeatedly, or pm2 has given up on it. */
export function pm2StartFailed(pm2: Pm2, name: string): () => Promise<boolean> {
  return async () => {
    const process = await pm2.describe(name).catch(() => undefined);
    if (!process) return false;
    return (
      process.status === 'errored' ||
      process.status === 'stopped' ||
      process.restarts > MAX_STARTUP_RESTARTS
    );
  };
}
