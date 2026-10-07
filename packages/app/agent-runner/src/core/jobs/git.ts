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
  auth: GitAuth | undefined,
): Promise<boolean> {
  const lock = await lockCache(cache);
  try {
    return await gitOk(
      ['fetch', '--quiet', 'origin', ...refspecs],
      cache,
      gitAuthEnv(auth),
    );
  } finally {
    await lock.release();
  }
}

/**
 * Fetches every branch of the repository into its cache and returns the cache. Commits in `wanted` the branches do
 * not reach are asked for by name, which most hosts allow for reachable commits.
 */
export async function fetchRepo(
  paths: RunnerPaths,
  repo: { readonly url: string; readonly auth?: GitAuth },
  wanted: readonly string[] = [],
): Promise<string> {
  let cache: string;
  try {
    cache = await updateCache(
      paths,
      repo.url,
      repo.auth ? { auth: repo.auth } : {},
    );
  } catch (error) {
    throw new JobFailure(
      'checkoutFailed',
      `Could not fetch ${repo.url}: ${failed(error)}`,
    );
  }
  const missing: string[] = [];
  for (const sha of wanted)
    if (!(await hasCommit(cache, sha))) missing.push(sha);
  if (missing.length > 0) await fetchInto(cache, missing, repo.auth);
  return cache;
}

/** The commit a job builds: `sha` when given (it must exist), else the head of the branch or tag `ref`. */
export async function targetCommit(
  cache: string,
  repo: {
    readonly url: string;
    readonly ref?: string;
    readonly sha?: string;
    readonly auth?: GitAuth;
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
  if (
    await fetchInto(cache, [`+refs/tags/${name}:refs/tags/${name}`], repo.auth)
  ) {
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
