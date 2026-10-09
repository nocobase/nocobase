// Prepares a run's working directories before the agent starts.
//
// A `directory` entry is a directory that already exists on this machine: it is used in place (no checkout, no branch,
// no push guard of the runner's) and locked so one run at a time works in it.
//
// Each repository URL has one bare cache, `~/.nocobase-runner/repos/<sha1(url)>.git`, fetched into
// `refs/remotes/origin/*`. Each subject of each application has one long-lived work directory,
// `<work root>/<app>/<subjectKey>/`, and every new repository is a reference clone at `<workDir>/<repo.path>` on the
// run's branch (`agent/<key>`). Git metadata stays inside that directory; only existing objects are borrowed from the
// cache, whose automatic GC is disabled. A later run finds the clone (or a legacy worktree) and keeps working; nothing is
// reset. Every checkout gets the push guard (push-guard.ts): it may push only that branch, to that repository. A run
// never works on the default branch, except the one run that makes an empty repository's first commit
// (`RepoDir.initial`): its checkout starts on the default branch with no parent, and that branch is the one it pushes.
//
// Locks are directories created with mkdir, which is atomic, holding the owner's pid: one for each subject, one for
// each cache. A lock whose owner is dead is taken over.
//
// GC removes a subject's work directory 7 days after a run that ended with every branch pushed, and any work directory
// not used for 30 days.
//
// A repository the run carries a credential for (`workspace.git.credentials`, a short-lived token) is fetched with it,
// and the agent's git pushes with it through a credential helper (env.ts); it is never written to disk. Without one,
// the host's own git credentials are used.
//
// A repository with a `.gitmodules` has its submodules initialized here, before the agent starts and outside any
// sandbox of its tool. New checkouts keep their Git metadata (including submodule `modules/`) in their own `.git`;
// legacy worktrees keep it under `<cache>/worktrees/<name>/`. They are fetched with the repository's credential, sent
// only to the repository's own host. A new checkout initializes every submodule, recursively; an existing one only those not
// initialized yet, so a submodule the agent moved keeps its state. A failure fails the preparation, and what it was
// initializing is recorded in the protected cache, keyed by the checkout's Git directory, until an update succeeds: a
// later preparation of the same checkout finishes it, nested submodules included, even though the top-level ones
// already look initialized. The agent never ran in between, so there is no state of its to keep.
//
// Cloning, fetching and the submodules' update are retried where they fail for a passing cause, and abort a stalled
// transfer instead of hanging (git-retry.ts). One that outlasts every retry fails with a `GitNetworkError`.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

import { delay } from '../lib/http.ts';
import {
  readJson,
  safeName,
  writeJsonAtomic,
  type RunnerPaths,
} from '../lib/home.ts';
import type {
  RepoCredential,
  RepoDir,
  RepoReport,
  WorkspaceDir,
} from '../protocol/index.ts';
import { isInside } from './command-policy.ts';
import {
  GIT_LOW_SPEED_CONFIG,
  GitNetworkError,
  retryGit,
  type GitRetryOptions,
} from './git-retry.ts';
import { allowPush, installGitHooks } from './push-guard.ts';
import { isAlive } from './supervisor.ts';
import { CheckoutError, git, gitAuthEnv, gitOk, type GitAuth } from './git.ts';
import {
  taskGit,
  taskGitDir,
  taskGitOk,
  type TaskGitContext,
} from './task-git.ts';

export { CheckoutError, git, gitAuthEnv, gitOk, type GitAuth } from './git.ts';

// ---------------------------------------------------------------------------------------------------------------
// Locks

export interface Lock {
  release(): Promise<void>;
}

export async function acquireLock(
  lockDir: string,
  options: { timeoutMs?: number; pollMs?: number } = {},
): Promise<Lock> {
  const deadline = Date.now() + (options.timeoutMs ?? 30_000);
  await mkdir(path.dirname(lockDir), { recursive: true, mode: 0o700 });
  for (;;) {
    try {
      await mkdir(lockDir, { mode: 0o700 });
      await writeFile(path.join(lockDir, 'owner'), String(process.pid));
      return { release: () => rm(lockDir, { recursive: true, force: true }) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    const owner = Number(
      await readFile(path.join(lockDir, 'owner'), 'utf8').catch(() => ''),
    );
    const age =
      Date.now() -
      (await stat(lockDir).catch(() => ({ mtimeMs: Date.now() }))).mtimeMs;
    // An owner file not written yet is only a race for a moment; an old lock without one was left by a crash.
    if ((owner > 0 && !isAlive(owner)) || (!(owner > 0) && age > 5_000)) {
      await rm(lockDir, { recursive: true, force: true });
      continue;
    }
    if (Date.now() >= deadline)
      throw new CheckoutError(
        `${lockDir} is held by process ${owner || 'unknown'}`,
      );
    await delay(options.pollMs ?? 200);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Caches and checkouts

export function cachePath(paths: RunnerPaths, url: string): string {
  return path.join(
    paths.reposDir,
    `${createHash('sha1').update(url).digest('hex')}.git`,
  );
}

export function subjectWorkDir(
  paths: RunnerPaths,
  appKey: string,
  subjectKey: string,
): string {
  return path.join(paths.workRoot, safeName(appKey), safeName(subjectKey));
}

/** The runner's own files in a working directory: the agent's home, tmp, the CLI shim and the workspace record. */
export const RUNNER_DIR = '.nocobase-runner';

/** Locks a repository's cache (fetching, creating reference clones, or removing legacy worktrees). */
export function lockCache(cache: string): Promise<Lock> {
  return acquireLock(`${cache}.lock`, { timeoutMs: 120_000 });
}

/**
 * Creates the repository's bare cache or fetches every branch into it, with the host's git credentials or `auth`.
 * `extra` refspecs are fetched in the same call, such as a tag a job names. Both are retried as `retry` says.
 */
export async function updateCache(
  paths: RunnerPaths,
  url: string,
  options: {
    auth?: GitAuth;
    extra?: readonly string[];
    retry?: GitRetryOptions;
  } = {},
): Promise<string> {
  const cache = cachePath(paths, url);
  const env = gitAuthEnv(options.auth);
  const lock = await lockCache(cache);
  try {
    if (!existsSync(cache)) {
      await mkdir(paths.reposDir, { recursive: true, mode: 0o700 });
      await retryGit(
        `git clone ${url}`,
        async () => {
          // A clone cut off may leave a partial cache behind.
          await rm(cache, { recursive: true, force: true });
          await git(
            [...GIT_LOW_SPEED_CONFIG, 'clone', '--bare', '--quiet', url, cache],
            paths.reposDir,
            env,
          );
        },
        options.retry,
      );
    }
    // Reference clones borrow objects even after their refs disappear from the cache. Never prune those objects.
    await git(['config', 'gc.auto', '0'], cache);
    await git(['config', 'gc.pruneExpire', 'never'], cache);
    await git(['config', 'maintenance.auto', 'false'], cache);
    await installGitHooks(path.join(cache, 'hooks'), paths.pushAllowDir);
    await retryGit(
      `git fetch ${url}`,
      () =>
        git(
          [
            ...GIT_LOW_SPEED_CONFIG,
            'fetch',
            '--prune',
            '--quiet',
            'origin',
            '+refs/heads/*:refs/remotes/origin/*',
            ...(options.extra ?? []),
          ],
          cache,
          env,
        ),
      options.retry,
    );
    return cache;
  } finally {
    await lock.release();
  }
}

export interface CheckedOutRepo {
  url: string;
  branch: string;
  defaultBranch: string;
  primary: boolean;
  /** Absolute. */
  dir: string;
  cache: string;
  /** The clone's `.git`, or a legacy worktree's own directory under the cache. */
  gitDir: string;
}

/** A working directory as the run uses it. */
export interface PreparedDir {
  kind: WorkspaceDir['kind'];
  /** Absolute. */
  dir: string;
  primary: boolean;
  /**
   * Prepared for this subject by this run: a checkout just created, or a directory no run has finished in yet. It
   * stays fresh, and its initialization prompt is given again, until `markDirsPrepared` records a run that finished.
   */
  fresh: boolean;
  /** How the workspace record names it (`repo:<path>` or `directory:<path>`). */
  key: string;
  name?: string;
  initPrompt?: string;
  /** For a repository. */
  repo?: CheckedOutRepo;
}

export interface Checkout {
  workDir: string;
  /** Every working directory, in the run's order; the first is the primary one. */
  dirs: PreparedDir[];
  /** The repositories among them. */
  repos: CheckedOutRepo[];
  release(): Promise<void>;
}

export interface WorkspaceMeta {
  appKey?: string;
  subjectKey: string;
  repos: { url: string; path: string; cache: string; branch: string }[];
  /**
   * Working directories a run of the subject finished in (`repo:<path>` or `directory:<abs path>`); `clean` empties
   * it.
   */
  prepared?: string[];
  lastUsedAt: string;
  /** Set when a run ends; cleared when the next one starts. */
  endedAt?: string;
  /** Every branch was pushed when the last run ended. */
  pushed?: boolean;
}

export function metaPath(workDir: string): string {
  return path.join(workDir, RUNNER_DIR, 'workspace.json');
}

async function addClone(
  cache: string,
  dir: string,
  repo: RepoDir,
): Promise<void> {
  const context = { cache, dir, url: repo.url };
  await git(
    [
      'clone',
      '--quiet',
      '--shared',
      '--reference',
      cache,
      '--no-checkout',
      cache,
      dir,
    ],
    cache,
  );
  // The cache fetches into remote-tracking refs, rather than updating its original local branches.
  await taskGit(context, [
    'fetch',
    '--quiet',
    '--prune',
    cache,
    '+refs/remotes/origin/*:refs/remotes/origin/*',
  ]);
  await taskGit(context, ['remote', 'set-url', 'origin', repo.url]);
  const remote = await taskGitOk(context, [
    'show-ref',
    '--verify',
    '--quiet',
    `refs/remotes/origin/${repo.branch}`,
  ]);
  const base = remote
    ? `origin/${repo.branch}`
    : `origin/${repo.defaultBranch}`;
  if (
    !(await taskGitOk(context, [
      'rev-parse',
      '--verify',
      '--quiet',
      `${base}^{commit}`,
    ]))
  ) {
    // An empty repository whose first commit this run makes: the default branch starts with no parent.
    if (repo.initial === true) {
      await taskGit(context, [
        'symbolic-ref',
        'HEAD',
        `refs/heads/${repo.branch}`,
      ]);
      return;
    }
    throw new CheckoutError(`${repo.url} has no branch ${repo.defaultBranch}`);
  }
  await taskGit(context, [
    'checkout',
    '--quiet',
    '--no-track',
    '-B',
    repo.branch,
    base,
  ]);
  // A clone initially imports the cache's HEAD branch, which the cache does not update on subsequent fetches.
  // Keep only the task branch locally; upstream bases are available as the refreshed origin/* tracking refs.
  for (const branch of (
    await taskGit(context, [
      'for-each-ref',
      '--format=%(refname:short)',
      'refs/heads/',
    ])
  ).split('\n')) {
    if (branch !== '' && branch !== repo.branch)
      await taskGit(context, ['branch', '-D', '--', branch]);
  }
}

/** Creates a reference clone, or resumes the existing clone/worktree without resetting its work. */
async function ensureCheckout(
  cache: string,
  dir: string,
  repo: RepoDir,
): Promise<boolean> {
  const context = { cache, dir, url: repo.url };
  if (
    existsSync(dir) &&
    existsSync(path.join(dir, '.git')) &&
    (await taskGitOk(context, ['rev-parse', '--is-inside-work-tree']))
  ) {
    // Refresh the clone's tracking refs without moving its branch or touching uncommitted work. Legacy worktrees
    // share these refs with the cache, which updateCache already refreshed.
    if ((await stat(path.join(dir, '.git'))).isDirectory()) {
      const lock = await lockCache(cache);
      try {
        await taskGit(context, [
          'fetch',
          '--quiet',
          '--prune',
          cache,
          '+refs/remotes/origin/*:refs/remotes/origin/*',
        ]);
      } finally {
        await lock.release();
      }
    }
    const current = await taskGit(context, [
      'symbolic-ref',
      '--quiet',
      '--short',
      'HEAD',
    ]).catch(() => '');
    if (current !== repo.branch) {
      const exists = await taskGitOk(context, [
        'show-ref',
        '--verify',
        '--quiet',
        `refs/heads/${repo.branch}`,
      ]);
      await taskGit(
        context,
        exists
          ? ['checkout', '--quiet', repo.branch]
          : ['checkout', '--quiet', '-b', repo.branch],
      );
    }
    return false;
  }
  if (existsSync(dir)) {
    const entries = await readdir(dir);
    if (entries.length > 0)
      throw new CheckoutError(`${dir} exists and is not a worktree`);
    await rm(dir, { recursive: true, force: true });
  }
  await mkdir(path.dirname(dir), { recursive: true });
  const lock = await lockCache(cache);
  try {
    await addClone(cache, dir, repo);
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  } finally {
    await lock.release();
  }
  return true;
}

/** The host part of an HTTP(S) URL (`https://github.com/`), the only place a submodule fetch sends the credential. */
function httpOrigin(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? `${parsed.origin}/`
      : undefined;
  } catch {
    return undefined;
  }
}

/** The filename of a pending submodule preparation record. */
export const SUBMODULES_PENDING = 'nocobase-runner-submodules.json';

interface PendingSubmodules {
  /** Every submodule, recursively. */
  readonly all: boolean;
  /** Otherwise these top-level ones, with theirs. */
  readonly paths: readonly string[];
}

async function readPending(
  file: string,
): Promise<PendingSubmodules | undefined> {
  try {
    const value = JSON.parse(
      await readFile(file, 'utf8'),
    ) as Partial<PendingSubmodules>;
    return {
      all: value.all === true,
      paths: Array.isArray(value.paths)
        ? value.paths.filter(
            (entry): entry is string => typeof entry === 'string',
          )
        : [],
    };
  } catch {
    return undefined;
  }
}

/**
 * Initializes the worktree's submodules as its `.gitmodules` lists them: every one, recursively, when `all`; otherwise
 * only the top-level ones not initialized yet (with theirs), and those an earlier update left unfinished
 * (`SUBMODULES_PENDING`). Returns the paths it initialized. The update is retried as `retry` says; one that keeps
 * failing on the network is a `GitNetworkError`.
 */
export async function initSubmodules(
  dir: string,
  options: {
    all: boolean;
    url: string;
    cache: string;
    auth?: GitAuth;
    retry?: GitRetryOptions;
  },
): Promise<string[]> {
  const context: TaskGitContext = {
    dir,
    cache: options.cache,
    url: options.url,
  };
  if (!existsSync(path.join(dir, '.gitmodules'))) return [];
  if (
    (await taskGit(context, [
      'config',
      '--local',
      '--get',
      'remote.origin.url',
    ])) !== options.url
  )
    throw new CheckoutError(
      `${options.url}: submodules require the original origin URL; restore it before resuming`,
    );
  const failed = (step: string, error: unknown): CheckoutError =>
    new CheckoutError(
      `${options.url}: ${step} its submodules failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  let status: string;
  let pendingFile: string;
  try {
    status = await taskGit(context, ['submodule', 'status']);
    const gitDir = await taskGitDir(context);
    const pendingDir = path.join(options.cache, 'submodule-preparations');
    await mkdir(pendingDir, { recursive: true, mode: 0o700 });
    pendingFile = path.join(
      pendingDir,
      `${createHash('sha256').update(gitDir).digest('hex')}-${SUBMODULES_PENDING}`,
    );
    // Task Git metadata is writable; never read or overwrite a pending record supplied by an agent there.
  } catch (error) {
    throw failed('reading', error);
  }
  const pending = await readPending(pendingFile);
  const all = options.all || pending?.all === true;
  // `-<sha> <path>` is a submodule not initialized; ` `, `+` and `U` are initialized ones.
  const listed = status
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => ({
      missing: line.startsWith('-'),
      path: line.slice(1).trim().split(/\s+/)[1] ?? '',
    }))
    .filter((entry) => entry.path !== '');
  const unfinished = new Set(pending?.paths ?? []);
  const selected = listed
    .filter((entry) => all || entry.missing || unfinished.has(entry.path))
    .map((entry) => entry.path);
  if (selected.length === 0) {
    await rm(pendingFile, { force: true });
    return [];
  }
  await writeFile(
    pendingFile,
    JSON.stringify({ all, paths: selected } satisfies PendingSubmodules),
  );
  const origin = httpOrigin(options.url);
  try {
    // `-c` reaches the clones and fetches the update runs (GIT_CONFIG_PARAMETERS), so a stalled one gives up too.
    await retryGit(
      `git submodule update in ${options.url}`,
      () =>
        taskGit(
          context,
          [
            'submodule',
            'update',
            '--init',
            '--recursive',
            '--checkout',
            ...(all ? [] : ['--', ...selected]),
          ],
          origin === undefined ? {} : gitAuthEnv(options.auth, origin),
        ),
      options.retry,
    );
  } catch (error) {
    if (error instanceof GitNetworkError) throw error;
    throw failed('initializing', error);
  }
  await rm(pendingFile, { force: true });
  return selected;
}

/** The subject's working directory, locked for one run. */
export interface WorkspaceLock {
  workDir: string;
  release(): Promise<void>;
}

/** Locks the subject's work directory and creates it with the runner's own directory inside. */
export async function lockWorkspace(options: {
  paths: RunnerPaths;
  appKey: string;
  subjectKey: string;
  timeoutMs?: number;
}): Promise<WorkspaceLock> {
  const workDir = subjectWorkDir(
    options.paths,
    options.appKey,
    options.subjectKey,
  );
  const lock = await acquireLock(`${workDir}.lock`, {
    timeoutMs: options.timeoutMs ?? 60_000,
  });
  try {
    await mkdir(path.join(workDir, RUNNER_DIR), {
      recursive: true,
      mode: 0o700,
    });
  } catch (error) {
    await lock.release();
    throw error;
  }
  return { workDir, release: () => lock.release() };
}

/**
 * Starts the subject over (`workspace.clean`): removes its worktrees and everything the runner keeps in its work
 * directory, including the record of prepared directories. The caller holds the workspace lock. A directory used in
 * place is never inside a work directory (`prepareDirs` refuses that), so its contents are never touched.
 */
export async function cleanWorkspace(workDir: string): Promise<void> {
  const meta = await readJson<WorkspaceMeta>(metaPath(workDir)).catch(
    () => undefined,
  );
  for (const repo of meta?.repos ?? []) {
    if (!existsSync(repo.cache)) continue;
    await gitOk(
      ['worktree', 'remove', '--force', path.join(workDir, repo.path)],
      repo.cache,
    );
  }
  await rm(workDir, { recursive: true, force: true });
  for (const repo of meta?.repos ?? [])
    if (existsSync(repo.cache)) await gitOk(['worktree', 'prune'], repo.cache);
  await mkdir(path.join(workDir, RUNNER_DIR), { recursive: true, mode: 0o700 });
}

/** The lock that keeps a directory used in place to one run at a time on this runner. */
export function directoryLockPath(paths: RunnerPaths, dir: string): string {
  return path.join(
    paths.locksDir,
    `${createHash('sha1').update(dir).digest('hex')}.lock`,
  );
}

const preparedKey = (entry: WorkspaceDir): string =>
  entry.kind === 'repo' ? `repo:${entry.path}` : `directory:${entry.path}`;

export interface PrepareDirsOptions {
  paths: RunnerPaths;
  appKey: string;
  subjectKey: string;
  /** Locked by the caller. */
  workDir: string;
  dirs: readonly WorkspaceDir[];
  /** Short-lived credentials by repository URL (`workspace.git.credentials`). */
  credentials?: readonly RepoCredential[];
  lockTimeoutMs?: number;
  log?: (message: string) => void;
  /** How cloning, fetching and the submodules' update are retried. */
  retry?: GitRetryOptions;
}

/**
 * Prepares every working directory: a repository is checked out (a bare cache and a long-lived clone on its branch,
 * with the push guard); a directory used in place must exist, is locked for the run, and is not checked out or
 * branched. A directory counts as fresh until a run of the subject finishes in it (`markDirsPrepared`), so a run that
 * dies before doing what the initialization prompt asks leaves it for the next attempt. The result's `release` gives
 * the directory locks back.
 */
export async function prepareDirs(
  options: PrepareDirsOptions,
): Promise<{ dirs: PreparedDir[]; release(): Promise<void> }> {
  const { paths, workDir } = options;
  const meta = await readJson<WorkspaceMeta>(metaPath(workDir)).catch(
    () => undefined,
  );
  const prepared = new Set(meta?.prepared ?? []);
  const locks: Lock[] = [];
  const release = async (): Promise<void> => {
    for (const lock of locks.splice(0)) await lock.release();
  };
  try {
    const dirs: PreparedDir[] = [];
    for (const [index, entry] of options.dirs.entries()) {
      const primary = index === 0;
      const common = {
        primary,
        ...(entry.name === undefined ? {} : { name: entry.name }),
        ...(entry.initPrompt === undefined || entry.initPrompt.trim() === ''
          ? {}
          : { initPrompt: entry.initPrompt }),
      };
      if (entry.kind === 'directory') {
        const dir = path.resolve(entry.path);
        if (
          isInside(paths.workRoot, dir) ||
          isInside(paths.home, dir) ||
          isInside(dir, paths.home)
        )
          throw new CheckoutError(
            `${dir} is the runner's own directory and cannot be a working directory`,
          );
        const info = await stat(dir).catch(() => undefined);
        if (info === undefined || !info.isDirectory())
          throw new CheckoutError(`${dir} does not exist on this runner`);
        options.log?.(`directory: ${dir}`);
        locks.push(
          await acquireLock(directoryLockPath(paths, dir), {
            timeoutMs: options.lockTimeoutMs ?? 60_000,
          }),
        );
        const key = preparedKey(entry);
        dirs.push({
          kind: 'directory',
          dir,
          fresh: !prepared.has(key),
          key,
          ...common,
        });
        continue;
      }
      // Only the run that makes an empty repository's first commit works on, and pushes, its default branch.
      if (entry.branch === entry.defaultBranch && entry.initial !== true)
        throw new CheckoutError(
          `${entry.url}: a run may not work on the default branch ${entry.defaultBranch}`,
        );
      const dir = path.resolve(workDir, entry.path);
      if (
        dir === workDir ||
        !isInside(workDir, dir) ||
        isInside(path.join(workDir, RUNNER_DIR), dir)
      ) {
        throw new CheckoutError(
          `Repository path ${entry.path} is outside the work directory`,
        );
      }
      options.log?.(
        `checkout: ${entry.url} -> ${entry.path} (${entry.branch})`,
      );
      const credential = options.credentials?.find(
        (item) => item.url === entry.url,
      );
      const auth: GitAuth | undefined =
        credential === undefined
          ? undefined
          : { username: credential.username, token: credential.password };
      const cache = await updateCache(paths, entry.url, {
        ...(auth === undefined ? {} : { auth }),
        ...(options.retry === undefined ? {} : { retry: options.retry }),
      });
      const created = await ensureCheckout(cache, dir, entry);
      const gitDir = await taskGitDir({ dir, cache, url: entry.url });
      // Refresh hooks on resumed clones too, so their local hook never keeps an obsolete registry or Node path.
      if (isInside(dir, gitDir))
        await installGitHooks(path.join(gitDir, 'hooks'), paths.pushAllowDir);
      await allowPush(gitDir, entry.url, entry.branch, paths.pushAllowDir);
      const submodules = await initSubmodules(dir, {
        all: created,
        url: entry.url,
        cache,
        ...(auth === undefined ? {} : { auth }),
        ...(options.retry === undefined ? {} : { retry: options.retry }),
      });
      if (submodules.length > 0)
        options.log?.(`submodules: ${entry.path}: ${submodules.join(', ')}`);
      const repo: CheckedOutRepo = {
        url: entry.url,
        branch: entry.branch,
        defaultBranch: entry.defaultBranch,
        primary,
        dir,
        cache,
        gitDir,
      };
      const key = preparedKey(entry);
      // A checkout created again (removed by GC, say) needs its initialization again.
      if (created) prepared.delete(key);
      dirs.push({
        kind: 'repo',
        dir,
        fresh: !prepared.has(key),
        key,
        repo,
        ...common,
      });
    }
    const repos = dirs.flatMap((entry) =>
      entry.repo === undefined ? [] : [entry.repo],
    );
    await writeJsonAtomic(metaPath(workDir), {
      appKey: options.appKey,
      subjectKey: options.subjectKey,
      repos: repos.map((repo) => ({
        url: repo.url,
        path: path.relative(workDir, repo.dir),
        cache: repo.cache,
        branch: repo.branch,
      })),
      prepared: [...prepared],
      lastUsedAt: new Date().toISOString(),
    } satisfies WorkspaceMeta);
    return { dirs, release };
  } catch (error) {
    await release();
    throw error;
  }
}

export interface CheckoutOptions {
  paths: RunnerPaths;
  appKey: string;
  subjectKey: string;
  dirs: readonly WorkspaceDir[];
  /** Start over first (`cleanWorkspace`). */
  clean?: boolean;
  lockTimeoutMs?: number;
  log?: (message: string) => void;
  retry?: GitRetryOptions;
}

/** Locks the subject's work directory and prepares every working directory. The caller releases it. */
export async function checkout(options: CheckoutOptions): Promise<Checkout> {
  const lock = await lockWorkspace({
    paths: options.paths,
    appKey: options.appKey,
    subjectKey: options.subjectKey,
    ...(options.lockTimeoutMs === undefined
      ? {}
      : { timeoutMs: options.lockTimeoutMs }),
  });
  try {
    if (options.clean === true) await cleanWorkspace(lock.workDir);
    const prepared = await prepareDirs({ ...options, workDir: lock.workDir });
    return {
      workDir: lock.workDir,
      dirs: prepared.dirs,
      repos: prepared.dirs.flatMap((entry) =>
        entry.repo === undefined ? [] : [entry.repo],
      ),
      release: async () => {
        await prepared.release();
        await lock.release();
      },
    };
  } catch (error) {
    await lock.release();
    throw error;
  }
}

/** Pushes each branch that has commits the remote lacks and reports where every repository stands. */
export async function reportRepos(
  repos: readonly CheckedOutRepo[],
  options: {
    push: boolean;
    credentials?: readonly RepoCredential[];
    log?: (message: string) => void;
  },
): Promise<RepoReport[]> {
  const reports: RepoReport[] = [];
  for (const repo of repos) {
    const credential = options.credentials?.find(
      (item) => item.url === repo.url,
    );
    const env = gitAuthEnv(
      credential === undefined
        ? undefined
        : {
            username: credential.username,
            token: credential.password,
          },
      httpOrigin(repo.url),
    );
    let headSha: string;
    try {
      headSha = await taskGit(repo, ['rev-parse', 'HEAD']);
    } catch (error) {
      options.log?.(
        `report: ${repo.url}: ${error instanceof Error ? error.message : String(error)}`,
      );
      reports.push({
        url: repo.url,
        branch: repo.branch,
        pushed: false,
        headSha: '',
      });
      continue;
    }
    const remoteSha = async (): Promise<string> =>
      (
        await taskGit(
          repo,
          ['ls-remote', '--', repo.url, `refs/heads/${repo.branch}`],
          env,
        ).catch(() => '')
      ).split(/\s+/)[0] ?? '';
    const remote = await remoteSha();
    let pushed = headSha !== '' && remote === headSha;
    // Work to push: commits on top of the default branch, or a branch the remote already has and HEAD moved past.
    const base = await taskGit(repo, [
      'rev-parse',
      `origin/${repo.defaultBranch}`,
    ]).catch(() => '');
    const hasWork = headSha !== '' && (headSha !== base || remote !== '');
    if (options.push && !pushed && hasWork) {
      try {
        await taskGit(
          repo,
          ['push', '--quiet', '--', repo.url, `HEAD:refs/heads/${repo.branch}`],
          env,
        );
        pushed = (await remoteSha()) === headSha;
      } catch (error) {
        options.log?.(
          `push: ${repo.url} ${repo.branch}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    reports.push({ url: repo.url, branch: repo.branch, pushed, headSha });
  }
  return reports;
}

/** Records that a run finished in `dirs`: they are no longer fresh for the subject. */
export async function markDirsPrepared(
  workDir: string,
  dirs: readonly Pick<PreparedDir, 'key'>[],
): Promise<void> {
  const meta = await readJson<WorkspaceMeta>(metaPath(workDir));
  if (meta === undefined) return;
  const prepared = new Set(meta.prepared ?? []);
  for (const dir of dirs) prepared.add(dir.key);
  await writeJsonAtomic(metaPath(workDir), {
    ...meta,
    prepared: [...prepared],
  });
}

export async function markWorkspaceEnded(
  workDir: string,
  pushed: boolean,
): Promise<void> {
  const meta = await readJson<WorkspaceMeta>(metaPath(workDir));
  if (meta === undefined) return;
  const now = new Date().toISOString();
  await writeJsonAtomic(metaPath(workDir), {
    ...meta,
    lastUsedAt: now,
    endedAt: now,
    pushed,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// GC

export interface GcOptions {
  paths: RunnerPaths;
  now?: number;
  keepPushedMs?: number;
  idleMs?: number;
  log?: (message: string) => void;
}

const DAY = 24 * 60 * 60 * 1000;

/** Removes the work directories the retention rules let go. Returns the removed directories. */
export async function gcWorkspaces(options: GcOptions): Promise<string[]> {
  const { paths } = options;
  const now = options.now ?? Date.now();
  const keepPushed = options.keepPushedMs ?? 7 * DAY;
  const idle = options.idleMs ?? 30 * DAY;
  const removed: string[] = [];
  const workDirs: string[] = [];
  const apps = await readdir(paths.workRoot, { withFileTypes: true }).catch(
    () => [],
  );
  for (const app of apps) {
    if (!app.isDirectory()) continue;
    const appDir = path.join(paths.workRoot, app.name);
    for (const entry of await readdir(appDir, { withFileTypes: true }).catch(
      () => [],
    ))
      if (entry.isDirectory()) workDirs.push(path.join(appDir, entry.name));
  }
  for (const workDir of workDirs) {
    const meta = await readJson<WorkspaceMeta>(metaPath(workDir)).catch(
      () => undefined,
    );
    if (meta === undefined) continue;
    const lastUsed = Date.parse(meta.lastUsedAt);
    const ended =
      meta.endedAt === undefined ? Number.NaN : Date.parse(meta.endedAt);
    const expired =
      (meta.pushed === true &&
        Number.isFinite(ended) &&
        now - ended > keepPushed) ||
      (Number.isFinite(lastUsed) && now - lastUsed > idle);
    if (!expired) continue;
    let lock: Lock;
    try {
      lock = await acquireLock(`${workDir}.lock`, { timeoutMs: 0 });
    } catch {
      continue;
    }
    try {
      for (const repo of meta.repos) {
        const dir = path.join(workDir, repo.path);
        if (existsSync(repo.cache))
          await gitOk(['worktree', 'remove', '--force', dir], repo.cache);
      }
      await rm(workDir, { recursive: true, force: true });
      for (const repo of meta.repos)
        if (existsSync(repo.cache))
          await gitOk(['worktree', 'prune'], repo.cache);
      removed.push(workDir);
      options.log?.(`gc: removed ${workDir}`);
    } finally {
      await lock.release();
    }
  }
  return removed;
}
