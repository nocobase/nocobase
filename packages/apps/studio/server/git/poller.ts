/**
 * Reading GitHub on a schedule, beside the webhooks (`webhooks.ts`). Every tick (at most every 15 seconds):
 *
 * - the repositories working directories link, given a row reached through their connection (`StudioGit.syncRepos`);
 * - the merge checks that are due (`StudioGit.runMergeChecks`): pull requests whose mergeability GitHub works out after
 *   a push, which no webhook reports;
 * - each watched repository whose turn it is (`StudioGit.pollRepo`): its pull request list with the last validator,
 *   then each linked open pull request and its checks with theirs. A repository is read every `intervalSeconds` (60 by
 *   default, `studio.git.pollIntervalSeconds`), and only every `fallbackSeconds` (600, `studio.git.webhookPollSeconds`)
 *   while its webhook works (a secret is set and the last delivery was verified): then polling is only the safety net
 *   for a lost delivery. An unchanged repository costs only 304 answers, which GitHub does not count against the rate
 *   limit.
 *
 * A tick never overlaps the previous one; a failing repository records its error and the others go on. When GitHub's
 * rate limit refuses a read, every repository read with the same credential (its connection, or no credential on that
 * host) waits until the limit lifts, even when every repository is asked for.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { StudioGit } from './service.js';
import { reposToPoll, webhookHealthy, type RepoRow } from './store.js';

export const DEFAULT_POLL_SECONDS = 60;
export const DEFAULT_WEBHOOK_POLL_SECONDS = 600;
const TICK_MAX_SECONDS = 15;

export interface GitPoller {
  start(): void;
  stop(): void;
  /** One scheduled tick now: the due merge checks and the repositories whose turn it is (or joins the run). */
  tick(): Promise<void>;
  /** Every repository and the due merge checks now, whoever's turn it is; resolves when done (or joins the run). */
  pollNow(): Promise<void>;
}

export function createGitPoller(deps: {
  readonly git: () => Pick<
    StudioGit,
    'pollRepo' | 'runMergeChecks' | 'syncRepos'
  >;
  readonly conn: () => DatabaseConnection;
  readonly intervalSeconds?: number;
  readonly fallbackSeconds?: number;
  readonly now?: () => Date;
  readonly onError: (message: string, error: unknown) => void;
}): GitPoller {
  const interval =
    Math.max(5, deps.intervalSeconds ?? DEFAULT_POLL_SECONDS) * 1000;
  const fallback = Math.max(
    interval,
    (deps.fallbackSeconds ?? DEFAULT_WEBHOOK_POLL_SECONDS) * 1000,
  );
  const tick = Math.min(interval, TICK_MAX_SECONDS * 1000);
  const now = deps.now ?? (() => new Date());
  let timer: ReturnType<typeof setInterval> | undefined;
  let running: Promise<void> | undefined;
  /** By credential (`credentialOf`): when its rate limit lifts. */
  const limited = new Map<string, number>();
  const credentialOf = (repo: RepoRow) =>
    repo.connectionId ?? `anonymous:${repo.apiBaseUrl}`;
  function paused(repo: RepoRow, at: number): boolean {
    const until = limited.get(credentialOf(repo));
    if (until === undefined) return false;
    if (until > at) return true;
    limited.delete(credentialOf(repo));
    return false;
  }

  /** Its turn: never read, or read longer ago than its interval, less half a tick so a late tick misses no turn. */
  function due(repo: RepoRow, at: number): boolean {
    if (!repo.polledAt) return true;
    const every = webhookHealthy(repo) ? fallback : interval;
    return at - new Date(repo.polledAt).getTime() >= every - tick / 2;
  }

  async function cycle(force: boolean): Promise<void> {
    const at = now();
    await deps.git().runMergeChecks(at);
    // A working directory linked since the last tick: its repository is watched from now on.
    await deps.git().syncRepos();
    for (const repo of await reposToPoll(deps.conn())) {
      if (paused(repo, now().getTime())) continue;
      if (!force && !due(repo, at.getTime())) continue;
      const { retryAt } = await deps.git().pollRepo(repo);
      if (retryAt) limited.set(credentialOf(repo), new Date(retryAt).getTime());
    }
  }

  function run(force: boolean): Promise<void> {
    running ??= cycle(force)
      .catch((error: unknown) =>
        deps.onError('Studio could not poll GitHub.', error),
      )
      .finally(() => {
        running = undefined;
      });
    return running;
  }

  return {
    start() {
      if (timer) return;
      timer = setInterval(() => void run(false), tick);
      timer.unref?.();
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = undefined;
    },
    tick: () => run(false),
    pollNow: () => run(true),
  };
}
