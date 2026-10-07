// Prepares a run's working directories before the agent starts.
//
// A `directory` entry is a directory that already exists on this machine: it is used in place (no checkout, no branch,
// no push guard of the runner's) and locked so one run at a time works in it.
//
// Each repository URL has one bare cache, `~/.nocobase-runner/repos/<sha1(url)>.git`, fetched into
// `refs/remotes/origin/*`. Each subject of each application has one long-lived work directory,
// `<work root>/<app>/<subjectKey>/`, and every repository is a worktree of its cache at `<workDir>/<repo.path>` on the
// run's branch (`agent/<key>`). A later run of the same subject finds the worktree and keeps working in it; nothing is
// reset. Every worktree gets the push guard (push-guard.ts): it may push only that branch, to that repository. A run
// never works on the default branch, except the one run that makes an empty repository's first commit
// (`RepoDir.initial`): its worktree starts on the default branch with no parent, and that branch is the one it pushes.
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
import { execFile } from 'node:child_process';
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
import { promisify } from 'node:util';

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
import { allowPush, installGitHooks } from './push-guard.ts';
import { isAlive } from './supervisor.ts';

const run = promisify(execFile);

export class CheckoutError extends Error {
  override name = 'CheckoutError';
}

/** An HTTPS token git fetches with, for one invocation (a job's `repo.auth`). */
export interface GitAuth {
  readonly username?: string;
  readonly token: string;
}

/**
 * The environment that gives one git invocation an `Authorization` header, through `GIT_CONFIG_*` so the token is in
 * neither the command line nor any configuration file.
 */
export function gitAuthEnv(auth: GitAuth | undefined): Record<string, string> {
  if (auth === undefined) return {};
  const basic = Buffer.from(
    `${auth.username ?? 'x-access-token'}:${auth.token}`,
  ).toString('base64');
  return {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'http.extraHeader',
    GIT_CONFIG_VALUE_0: `Authorization: Basic ${basic}`,
  };
}

export async function git(
  args: string[],
  cwd?: string,
  env: Record<string, string> = {},
): Promise<string> {
  try {
    const { stdout } = await run('git', args, {
      cwd,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0',
        GIT_ASKPASS: 'echo',
        ...env,
      },
      maxBuffer: 16 * 1024 * 1024,
    });
    return stdout.trim();
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new CheckoutError(
      `git ${args.join(' ')} failed${stderr ? `: ${stderr}` : ''}`,
    );
  }
}

export async function gitOk(
  args: string[],
  cwd?: string,
  env: Record<string, string> = {},
): Promise<boolean> {
  try {
    await git(args, cwd, env);
    return true;
  } catch {
    return false;
  }
}

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
// Caches and worktrees

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

/** Locks a repository's cache (fetching into it, adding or removing its worktrees). */
export function lockCache(cache: string): Promise<Lock> {
  return acquireLock(`${cache}.lock`, { timeoutMs: 120_000 });
}

/**
 * Creates the repository's bare cache or fetches every branch into it, with the host's git credentials or `auth`.
 * `extra` refspecs are fetched in the same call, such as a tag a job names.
 */
export async function updateCache(
  paths: RunnerPaths,
  url: string,
  options: { auth?: GitAuth; extra?: readonly string[] } = {},
): Promise<string> {
  const cache = cachePath(paths, url);
  const env = gitAuthEnv(options.auth);
  const lock = await lockCache(cache);
  try {
    if (!existsSync(cache)) {
      await mkdir(paths.reposDir, { recursive: true, mode: 0o700 });
      await git(['clone', '--bare', '--quiet', url, cache], undefined, env);
    }
    await installGitHooks(path.join(cache, 'hooks'));
    await git(
      [
        'fetch',
        '--prune',
        '--quiet',
        'origin',
        '+refs/heads/*:refs/remotes/origin/*',
        ...(options.extra ?? []),
      ],
      cache,
      env,
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
}

/** A working directory as the run uses it. */
export interface PreparedDir {
  kind: WorkspaceDir['kind'];
  /** Absolute. */
  dir: string;
  primary: boolean;
  /**
   * Prepared for this subject by this run: a worktree just created, or a directory no run has finished in yet. It
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

async function addWorktree(
  cache: string,
  dir: string,
  repo: RepoDir,
): Promise<void> {
  await git(['worktree', 'prune'], cache);
  const local = await gitOk(
    ['show-ref', '--verify', '--quiet', `refs/heads/${repo.branch}`],
    cache,
  );
  if (local) {
    await git(['worktree', 'add', '--quiet', dir, repo.branch], cache);
    return;
  }
  const remote = await gitOk(
    ['show-ref', '--verify', '--quiet', `refs/remotes/origin/${repo.branch}`],
    cache,
  );
  const base = remote
    ? `origin/${repo.branch}`
    : `origin/${repo.defaultBranch}`;
  if (
    !(await gitOk(
      ['rev-parse', '--verify', '--quiet', `${base}^{commit}`],
      cache,
    ))
  ) {
    // An empty repository whose first commit this run makes: the default branch starts with no parent.
    if (repo.initial === true) {
      await git(
        ['worktree', 'add', '--quiet', '--orphan', '-b', repo.branch, dir],
        cache,
      );
      return;
    }
    throw new CheckoutError(`${repo.url} has no branch ${repo.defaultBranch}`);
  }
  await git(
    ['worktree', 'add', '--quiet', '--no-track', '-b', repo.branch, dir, base],
    cache,
  );
}

/** Makes `dir` a worktree of `cache` on the repository's branch; true when it had to be created. */
async function ensureWorktree(
  cache: string,
  dir: string,
  repo: RepoDir,
): Promise<boolean> {
  if (
    existsSync(dir) &&
    (await gitOk(['rev-parse', '--is-inside-work-tree'], dir))
  ) {
    const current = await git(
      ['symbolic-ref', '--quiet', '--short', 'HEAD'],
      dir,
    ).catch(() => '');
    if (current !== repo.branch) {
      const exists = await gitOk(
        ['show-ref', '--verify', '--quiet', `refs/heads/${repo.branch}`],
        dir,
      );
      await git(
        exists
          ? ['checkout', '--quiet', repo.branch]
          : ['checkout', '--quiet', '-b', repo.branch],
        dir,
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
  await addWorktree(cache, dir, repo);
  return true;
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
}

/**
 * Prepares every working directory: a repository is checked out (a bare cache and a long-lived worktree on its branch,
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
      const cache = await updateCache(
        paths,
        entry.url,
        credential
          ? {
              auth: {
                username: credential.username,
                token: credential.password,
              },
            }
          : {},
      );
      const created = await ensureWorktree(cache, dir, entry);
      await allowPush(
        await git(['rev-parse', '--absolute-git-dir'], dir),
        entry.url,
        entry.branch,
      );
      const repo: CheckedOutRepo = {
        url: entry.url,
        branch: entry.branch,
        defaultBranch: entry.defaultBranch,
        primary,
        dir,
        cache,
      };
      const key = preparedKey(entry);
      // A worktree created again (removed by GC, say) needs its initialization again.
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
  options: { push: boolean; log?: (message: string) => void },
): Promise<RepoReport[]> {
  const reports: RepoReport[] = [];
  for (const repo of repos) {
    const headSha = await git(['rev-parse', 'HEAD'], repo.dir).catch(() => '');
    const remoteSha = async (): Promise<string> =>
      (
        await git(
          ['ls-remote', 'origin', `refs/heads/${repo.branch}`],
          repo.dir,
        ).catch(() => '')
      ).split(/\s+/)[0] ?? '';
    const remote = await remoteSha();
    let pushed = headSha !== '' && remote === headSha;
    // Work to push: commits on top of the default branch, or a branch the remote already has and HEAD moved past.
    const base = await git(
      ['rev-parse', `origin/${repo.defaultBranch}`],
      repo.dir,
    ).catch(() => '');
    const hasWork = headSha !== '' && (headSha !== base || remote !== '');
    if (options.push && !pushed && hasWork) {
      try {
        await git(
          ['push', '--quiet', 'origin', `HEAD:refs/heads/${repo.branch}`],
          repo.dir,
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
