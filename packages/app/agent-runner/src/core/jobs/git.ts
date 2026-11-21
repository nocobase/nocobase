// Git for jobs: fetching into the runner's bare cache (shared with agent checkouts), finding a commit, and a
// detached worktree of it for one job, kept apart from every agent's worktrees.
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

import {
  git,
  gitAuthEnv,
  gitOk,
  lockCache,
  updateCache,
  type GitAuth,
} from '../checkout.ts';
import type { RunnerPaths } from '../../lib/home.ts';
import { GIT_LOW_SPEED_CONFIG } from '../git-retry.ts';
import { gitSshFailureOf, type GitInvocationOptions } from '../git.ts';
import { JobFailure } from './types.ts';

const failed = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** A commit hash, full or abbreviated. */
const COMMIT_PATTERN = /^[0-9a-f]{7,64}$/u;

/** Whether `rev` names a commit in `cache`. */
export function hasCommit(cache: string, rev: string): Promise<boolean> {
  return gitOk(['cat-file', '-e', `${rev}^{commit}`], cache);
}

/** The commit `rev` names in `cache`, or undefined. */
export async function resolveCommit(
  cache: string,
  rev: string,
): Promise<string | undefined> {
  try {
    return await git(
      ['rev-parse', '--verify', '--quiet', `${rev}^{commit}`],
      cache,
    );
  } catch {
    return undefined;
  }
}

/** Fetches into the cache with the cache locked; false when git refused. */
async function fetchInto(
  cache: string,
  refspecs: readonly string[],
  repo: FetchRepository,
): Promise<boolean> {
  const lock = await lockCache(cache);
  try {
    const args = [
      ...GIT_LOW_SPEED_CONFIG,
      'fetch',
      '--quiet',
      repo.ssh ? repo.url : 'origin',
      ...refspecs,
    ];
    const env = { ...gitAuthEnv(repo.auth), ...repo.ssh };
    if (!repo.ssh) return await gitOk(args, cache, env);
    try {
      await git(args, cache, env, repo.retry);
      return true;
    } catch (error) {
      if (gitSshFailureOf(error) !== undefined) throw error;
      return false;
    }
  } finally {
    await lock.release();
  }
}

interface FetchRepository {
  readonly url: string;
  readonly auth?: GitAuth;
  readonly ssh?: Readonly<Record<string, string>>;
  readonly retry?: GitInvocationOptions;
}

/**
 * Fetches every branch of the repository into its cache and returns the cache. Commits in `wanted` the branches do
 * not reach are asked for by name, which most hosts allow for reachable commits.
 */
export async function fetchRepo(
  paths: RunnerPaths,
  repo: FetchRepository,
  wanted: readonly string[] = [],
): Promise<string> {
  let cache: string;
  try {
    cache = await updateCache(paths, repo.url, {
      ...(repo.auth ? { auth: repo.auth } : {}),
      ...(repo.ssh ? { ssh: repo.ssh } : {}),
      ...(repo.retry ? { retry: repo.retry } : {}),
    });
  } catch (error) {
    throw new JobFailure(
      'checkoutFailed',
      `Could not fetch ${repo.url}: ${failed(error)}`,
      { cause: error },
    );
  }
  const missing: string[] = [];
  for (const sha of wanted)
    if (!(await hasCommit(cache, sha))) missing.push(sha);
  if (missing.length > 0) await fetchInto(cache, missing, repo);
  return cache;
}

/** The commit a job builds: `sha` when given (it must exist), else the head of the branch or tag `ref`. */
export async function targetCommit(
  cache: string,
  repo: FetchRepository & {
    readonly ref?: string;
    readonly sha?: string;
  },
): Promise<string> {
  if (repo.sha !== undefined) {
    const found = await resolveCommit(cache, repo.sha);
    if (found === undefined)
      throw new JobFailure(
        'checkoutFailed',
        `${repo.url} has no commit ${repo.sha}.`,
      );
    return found;
  }
  const ref = repo.ref ?? '';
  // A commit named as the ref is taken as it is.
  if (COMMIT_PATTERN.test(ref)) {
    const commit = await resolveCommit(cache, ref);
    if (commit !== undefined) return commit;
  }
  const name = ref.replace(/^refs\/(heads|tags)\//u, '');
  const branch = await resolveCommit(cache, `refs/remotes/origin/${name}`);
  if (branch !== undefined && !ref.startsWith('refs/tags/')) return branch;
  if (await fetchInto(cache, [`+refs/tags/${name}:refs/tags/${name}`], repo)) {
    const tag = await resolveCommit(cache, `refs/tags/${name}`);
    if (tag !== undefined) return tag;
  }
  throw new JobFailure('checkoutFailed', `${repo.url} has no ref ${ref}.`);
}

/** A detached worktree of `sha` at `dir`, for one job. */
export async function addJobWorktree(
  cache: string,
  dir: string,
  sha: string,
): Promise<void> {
  await mkdir(path.dirname(dir), { recursive: true, mode: 0o700 });
  const lock = await lockCache(cache);
  try {
    await gitOk(['worktree', 'prune'], cache);
    await git(['worktree', 'add', '--quiet', '--detach', dir, sha], cache);
  } catch (error) {
    throw new JobFailure(
      'checkoutFailed',
      `Could not check out ${sha}: ${failed(error)}`,
    );
  } finally {
    await lock.release();
  }
}

/** Removes a job's worktree and its directory; never fails. */
export async function removeJobWorktree(
  cache: string | undefined,
  dir: string,
): Promise<void> {
  if (cache !== undefined) {
    const lock = await lockCache(cache).catch(() => undefined);
    try {
      await gitOk(['worktree', 'remove', '--force', dir], cache);
      await rm(dir, { recursive: true, force: true });
      await gitOk(['worktree', 'prune'], cache);
    } finally {
      await lock?.release();
    }
  }
  await rm(dir, { recursive: true, force: true }).catch(() => undefined);
}
