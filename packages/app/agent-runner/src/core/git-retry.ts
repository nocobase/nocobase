// Retrying git's network operations (clone, fetch, the submodules' update) where they fail for a moment.
//
// Only a failure whose message names a passing cause is retried: a TLS handshake cut off, a connection reset, refused
// or timed out, a transfer that stalled (`http.lowSpeedLimit`/`Time`, which every network call sets, so a stalled
// transfer fails rather than hangs), a name that did not resolve, an HTTP 5xx or 429. A repository that does not exist
// or credentials the host refuses fail at once, with a hint of what to fix. Each retry waits longer: 2, 5 and 15
// seconds by default. When every retry fails the same way the error is a `GitNetworkError`, which the run reports as
// `prepareNetwork` so the application queues it again.
import { delay } from '../lib/http.ts';

/** Aborts a transfer slower than 1 KiB/s for a minute, which git otherwise waits out forever. */
export const GIT_LOW_SPEED_CONFIG: readonly string[] = [
  '-c',
  'http.lowSpeedLimit=1024',
  '-c',
  'http.lowSpeedTime=60',
];

/** The waits before each retry, in milliseconds: three retries after the first attempt. */
export const GIT_RETRY_DELAYS_MS: readonly number[] = [2_000, 5_000, 15_000];

/** Failures the host decided: retrying cannot help, the configuration has to change. Checked first. */
const PERMANENT: readonly { pattern: RegExp; hint: string }[] = [
  {
    pattern:
      /repository ['"]?.*['"]? not found|returned error: 404|\bhttp 404\b|does not appear to be a git repository/iu,
    hint: 'Check that the repository URL is right and that the credentials this runner fetches with can see it.',
  },
  {
    pattern:
      /authentication failed|returned error: 40[13]|\bhttp 40[13]\b|permission denied \(publickey|could not read (username|password)|terminal prompts disabled|invalid username or password|access denied/iu,
    hint: 'The host refused the credentials: check the git credentials on this runner (a token or an SSH key), or the repository credential the application issues.',
  },
];

/** Failures that pass on their own. */
const TRANSIENT: readonly RegExp[] = [
  // TLS cut off: gnutls (Debian's git) and OpenSSL.
  /gnutls_handshake\(\) failed|tls connection was non-properly terminated|ssl_error_syscall|ssl_connect|unexpected eof while reading|ssl[_ ]read/iu,
  // Connections reset, refused, dropped or timed out.
  /connection reset|connection timed out|connection refused|operation timed out|timed out after|failed to connect to|couldn't connect to server|connection closed by|broken pipe/iu,
  // Transfers cut off or stalled (the latter is `http.lowSpeedLimit` giving up).
  /operation too slow|early eof|the remote end hung up unexpectedly|unexpected disconnect while reading sideband|transfer closed with outstanding read data|rpc failed|http\/2 stream \d+ was not closed cleanly|curl \d+ /iu,
  // DNS.
  /could not resolve host|could not resolve hostname|temporary failure in name resolution|name or service not known|no address associated with hostname/iu,
  // The host is overloaded or limiting this client.
  /returned error: (5\d\d|429)|\bhttp (5\d\d|429)\b|\b(502 bad gateway|503 service unavailable|504 gateway time-?out|429 too many requests)\b/iu,
];

export type GitFailureKind = 'transient' | 'permanent';

export interface GitFailure {
  readonly kind: GitFailureKind;
  /** What to fix, for a permanent failure the message lets us name. */
  readonly hint?: string;
}

/** Whether a git failure (its message, stderr included) is worth retrying. */
export function classifyGitFailure(message: string): GitFailure {
  for (const { pattern, hint } of PERMANENT)
    if (pattern.test(message)) return { kind: 'permanent', hint };
  if (TRANSIENT.some((pattern) => pattern.test(message)))
    return { kind: 'transient' };
  return { kind: 'permanent' };
}

/** A git network operation that kept failing for a passing cause through every retry. */
export class GitNetworkError extends Error {
  override name = 'GitNetworkError';
  /** How many times it was retried after the first attempt. */
  readonly retries: number;
  /** The last attempt's error. */
  readonly lastError: string;

  constructor(operation: string, retries: number, lastError: string) {
    super(
      `${operation} failed on the network after ${retries} ${retries === 1 ? 'retry' : 'retries'} on this runner; the last error: ${lastError}`,
    );
    this.retries = retries;
    this.lastError = lastError;
  }
}

export interface GitRetryOptions {
  /** The waits before each retry; `GIT_RETRY_DELAYS_MS` by default. */
  readonly delaysMs?: readonly number[];
  /** Waits; `delay` by default, replaced in tests. */
  readonly sleep?: (ms: number) => Promise<void>;
  /** Told before each retry: which one (from 1), how long it waits, and the error that caused it. */
  readonly onRetry?: (retry: {
    operation: string;
    attempt: number;
    delayMs: number;
    error: string;
  }) => void;
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Runs `attempt` until it succeeds, retrying a transient failure after each of `delaysMs`. A permanent failure is
 * rethrown at once, with its hint appended when there is one; a transient one that outlasts every retry becomes a
 * `GitNetworkError`. `operation` names it in messages (`git fetch https://…`).
 */
export async function retryGit<T>(
  operation: string,
  attempt: () => Promise<T>,
  options: GitRetryOptions = {},
): Promise<T> {
  const delays = options.delaysMs ?? GIT_RETRY_DELAYS_MS;
  const sleep = options.sleep ?? delay;
  for (let retries = 0; ; retries += 1) {
    try {
      return await attempt();
    } catch (error) {
      const message = messageOf(error);
      const failure = classifyGitFailure(message);
      if (failure.kind === 'permanent') {
        if (failure.hint === undefined || !(error instanceof Error))
          throw error;
        error.message = `${message}\nHint: ${failure.hint}`;
        throw error;
      }
      const wait = delays[retries];
      if (wait === undefined)
        throw new GitNetworkError(operation, retries, message);
      options.onRetry?.({
        operation,
        attempt: retries + 1,
        delayMs: wait,
        error: message,
      });
      await sleep(wait);
    }
  }
}
