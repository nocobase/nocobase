// Fixed task workspaces reuse code, dependency installations and Git state across every run.
// Host Git fetches remote references without switching branches or rewriting the worktree.
// Nonexclusive usage registrations protect cleanup; agents coordinate concurrent edits and installations.
// Credentials and other run-owned files live in private attempt directories outside shared code.
// Legacy continuation/worktree cleanup remains until deployed machines have cleared historical state.
import {
  clearContinuations,
  continuationKey,
  taskSessionRoot,
  deletePublishedRunBranch,
  runBranch,
  updateContinuationState,
} from './run-worktrees.ts';

import { createHash, randomUUID } from 'node:crypto';
import {
  registerWorkspaceUse,
  workspaceInUse,
  waitForWorkspaceCleanup,
} from './workspace-use.ts';
import {
  confirmPreparation,
  preparationCurrent,
  preparationHash,
  invalidatePreparation,
} from './preparation.ts';
import { existsSync } from 'node:fs';
import {
  mkdir,
  open,
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
  RepoDir,
  RepoPushFailure,
  RepoReport,
  WorkspaceDir,
} from '../protocol/index.ts';
import { isInside } from '../lib/paths.ts';
import {
  GIT_LOW_SPEED_CONFIG,
  retryGit,
  type GitRetryOptions,
} from './git-retry.ts';
import { installGitHooks } from './git-hooks.ts';
import { isAlive } from './supervisor.ts';
import { CheckoutError, git, gitAuthEnv, gitOk, type GitAuth } from './git.ts';
import { cacheGit, taskGit, taskGitDir, taskGitOk } from './task-git.ts';

export { CheckoutError, git, gitAuthEnv, gitOk, type GitAuth } from './git.ts';

/** Why a repository's credential could not be had (agent/git-credentials.ts). */
export class RepoAccessFailure extends Error {
  override name = 'RepoAccessFailure';
  /** `unavailable`: try again later; `denied`: the application will not issue one; `leaseLost`: the run is over here. */
  readonly kind: 'unavailable' | 'denied' | 'leaseLost';

  constructor(kind: 'unavailable' | 'denied' | 'leaseLost', message: string) {
    super(message);
    this.kind = kind;
  }
}

/** Where the runner's own git gets a repository's credential from. */
export interface RepoAuthSource {
  /** Whether it answers for `url`; for such a URL nothing else is used, not even the host's credentials. */
  covers(url: string): boolean;
  /** Throws `RepoAccessFailure`. `refresh` asks for a new credential rather than the one held. */
  get(url: string, options?: { refresh?: boolean }): Promise<GitAuth>;
  /** The remote refused `auth`; true when it was the credential held, which is now forgotten. */
  erase(url: string, auth: GitAuth): boolean;
}

/** Whether git failed because the remote refused its credential. */
export function isAuthFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Authentication failed|Invalid username or (?:password|token)|could not read Username|could not read Password|The requested URL returned error: 40[13]|HTTP Basic: Access denied|terminal prompts disabled/iu.test(
    message,
  );
}

/**
 * Runs `operation` with `url`'s credential from `source`, and once more with a fresh one when the remote refused the
 * first. Without a source that answers for `url`, runs it without one (the host's credentials).
 */
export async function withRepoAuth<T>(
  source: RepoAuthSource | undefined,
  url: string,
  operation: (auth: GitAuth | undefined) => Promise<T>,
): Promise<T> {
  if (source === undefined || !source.covers(url)) return operation(undefined);
  const auth = await source.get(url);
  try {
    return await operation(auth);
  } catch (error) {
    if (!isAuthFailure(error) || !source.erase(url, auth)) throw error;
    return operation(await source.get(url, { refresh: true }));
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Locks

export interface Lock {
  release(): Promise<void>;
}

/** A live process still holds a working directory; another attempt may take it later. */
export class WorkspaceBusyError extends CheckoutError {
  override name = 'WorkspaceBusyError';
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
      throw new WorkspaceBusyError(
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

/** A new stable namespace keeps historical attempt/clone directories available without importing their work. */
export function taskWorkDir(
  paths: RunnerPaths,
  appKey: string,
  subjectKey: string,
): string {
  return subjectWorkDir(paths, appKey, `${subjectKey}.task`);
}

/** The runner's own files in a working directory: tmp, Codex's home, the CLI shim and the workspace record. */
export const RUNNER_DIR = '.nocobase-runner';

/** Locks a repository's cache (fetching, creating reference clones, or removing legacy worktrees). */
export async function lockCache(cache: string): Promise<Lock> {
  try {
    return await acquireLock(`${cache}.lock`, { timeoutMs: 120_000 });
  } catch (error) {
    throw new CheckoutError(
      `Cache preparation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
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
  {
    if (!existsSync(cache)) {
      await mkdir(paths.reposDir, { recursive: true, mode: 0o700 });
      await retryGit(
        `git clone ${url}`,
        async () => {
          // A clone cut off may leave a partial cache behind.
          await git(
            [...GIT_LOW_SPEED_CONFIG, 'clone', '--bare', '--quiet', url, cache],
            paths.reposDir,
            env,
            options.retry,
          );
        },
        options.retry,
      );
      // Reference clones borrow objects even after their refs disappear from the cache. Never prune those objects.
      await cacheGit(cache, url, ['config', 'gc.auto', '0']);
      await cacheGit(cache, url, ['config', 'core.fsync', 'objects,reference']);
      await cacheGit(cache, url, ['config', 'core.fsyncMethod', 'fsync']);
      await cacheGit(cache, url, ['config', 'gc.pruneExpire', 'never']);
      await cacheGit(cache, url, ['config', 'maintenance.auto', 'false']);
      await installGitHooks(path.join(cache, 'hooks'));
    }
    await retryGit(
      `git fetch ${url}`,
      () =>
        cacheGit(
          cache,
          url,
          [
            ...GIT_LOW_SPEED_CONFIG,
            'fetch',
            '--prune',
            '--quiet',
            url,
            '+refs/heads/*:refs/remotes/origin/*',
            ...(options.extra ?? []),
          ],
          env,
          options.retry,
        ),
      options.retry,
    );
    return cache;
  }
}

export interface CheckedOutRepo {
  url: string;
  branch: string;
  defaultBranch: string;
  localBranch?: string;
  continuation?: string;
  warnings?: string[];
  /** This attempt's starting commit; independent of the shared default branch. */
  startSha?: string;
  /** Last confirmed delivery, or the original continuation's starting commit. */
  deliveryBaseSha?: string;
  /** Only a successful remote query can establish absence for local cleanup. */
  remoteMissing?: boolean;
  primary: boolean;
  /** Absolute. */
  dir: string;
  cache: string;
  /** The clone's `.git`, or a legacy worktree's own directory under the cache. */
  gitDir: string;
  /** The submodules checked out in `dir`, nested ones included, as absolute paths. */
  submodules: string[];
  /** This run may create, but never update, the empty remote's default branch. */
  initializing?: true;
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
  preparationHash?: string;
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

/** A repository checked out in a work directory, as the runner recorded it. */
export interface WorkspaceRepo {
  url: string;
  /** Relative to the work directory, and inside it. */
  path: string;
  /** Always `cachePath(paths, url)`. */
  cache: string;
  branch: string;
  localBranch?: string;
  continuation?: string;
  /** Starting commit (empty for an unborn checkout); continuation records retain the original starting point. */
  startSha?: string;
  /** What the runner last saw the remote task branch hold after it pushed (or found it already pushed). */
  pushedSha?: string;
  /** Saved and being removed: a later pass only finishes the removal, never commits what is half deleted. */
  removing?: boolean;
}

/**
 * The runner's record of a subject's work directory. It lives in the runner's own directory
 * (`workspaces/<sha256(workDir)>.json`), which no agent can write, because removing a directory, and deciding whether
 * it holds unpushed work, rest on it. Records kept before that in the work directory itself
 * (`.nocobase-runner/workspace.json`, `legacyMetaPath`) are still read, as written by the agent's side: their caches
 * and paths are derived and checked again, and what they say was pushed is ignored (`legacy`).
 */
export interface WorkspaceMeta {
  appKey?: string;
  runAttempt?: boolean;
  continuationOnly?: boolean;
  activeWorkDirs?: string[];
  sessionKeys?: string[];
  runWorktrees?: boolean;
  readOnly?: boolean;
  recoveryRequired?: boolean;
  recoveryReason?: string;
  subjectKey: string;
  repos: WorkspaceRepo[];
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
  /** The last run that worked here, which the application is asked about (core/workspaces.ts). */
  lastRunId?: string;
  /** Whether the directory held unpushed work when last checked (`measuredAt`). */
  unpushed?: boolean;
  measuredAt?: string;
  /** When regenerable build artifacts were last removed from it (core/artifacts.ts). */
  artifactsCleanedAt?: string;
  /**
   * Read from a record in the work directory, kept before the runner kept its own, or measured from one since: only
   * its layout is believed. A run preparing the directory again writes a record of the runner's own.
   */
  legacy?: true;
}

/** Where the runner keeps its record of a work directory. */
export function workspaceRecordPath(
  paths: RunnerPaths,
  workDir: string,
): string {
  return path.join(
    paths.workspacesDir,
    `${createHash('sha256').update(path.resolve(workDir)).digest('hex')}.json`,
  );
}

/** Where earlier runners kept the record, inside the work directory (and so within the agent's reach). */
export function legacyMetaPath(workDir: string): string {
  return path.join(workDir, RUNNER_DIR, 'workspace.json');
}

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value !== '';
const SHA = /^[0-9a-f]{40,64}$/u;

/**
 * A record as far as it can be believed: every repository's cache derived from its URL, and every path inside the
 * work directory (not the runner's own part of it); entries that are neither are dropped.
 */
function believable(
  paths: RunnerPaths,
  workDir: string,
  raw: Record<string, unknown>,
  fromWorkDir: boolean,
): WorkspaceMeta | undefined {
  if (!isText(raw.subjectKey) || !isText(raw.lastUsedAt)) return undefined;
  // A legacy record stays one when the runner measures it into its own directory, until a run prepares it again.
  const legacy = fromWorkDir || raw.legacy === true;
  const root = path.resolve(workDir);
  const repos = (
    Array.isArray(raw.repos) ? (raw.repos as unknown[]) : []
  ).flatMap((item): WorkspaceRepo[] => {
    const repo = (item ?? {}) as Record<string, unknown>;
    if (!isText(repo.url) || !isText(repo.path) || !isText(repo.branch))
      return [];
    const dir = path.resolve(root, repo.path);
    if (
      dir === root ||
      !isInside(root, dir) ||
      isInside(path.join(root, RUNNER_DIR), dir)
    )
      return [];
    return [
      {
        url: repo.url,
        path: path.relative(root, dir),
        cache: cachePath(paths, repo.url),
        branch: repo.branch,
        ...(!legacy && isText(repo.localBranch)
          ? { localBranch: repo.localBranch }
          : {}),
        ...(!legacy && isText(repo.continuation)
          ? { continuation: repo.continuation }
          : {}),
        ...(!legacy &&
        typeof repo.startSha === 'string' &&
        (repo.startSha === '' || SHA.test(repo.startSha))
          ? { startSha: repo.startSha }
          : {}),
        ...(!legacy && isText(repo.pushedSha) && SHA.test(repo.pushedSha)
          ? { pushedSha: repo.pushedSha }
          : {}),
        ...(!legacy && repo.removing === true ? { removing: true } : {}),
      },
    ];
  });
  const text = (key: string) => (isText(raw[key]) ? { [key]: raw[key] } : {});
  return {
    ...text('appKey'),
    ...(!legacy && raw.runAttempt === true ? { runAttempt: true } : {}),
    ...(!legacy && raw.continuationOnly === true
      ? { continuationOnly: true }
      : {}),
    ...(!legacy && Array.isArray(raw.activeWorkDirs)
      ? {
          activeWorkDirs: raw.activeWorkDirs.filter(
            (dir): dir is string =>
              isText(dir) && isInside(paths.workRoot, dir),
          ),
        }
      : {}),
    ...(!legacy && Array.isArray(raw.sessionKeys)
      ? {
          sessionKeys: raw.sessionKeys.filter(
            (key): key is string => isText(key) && /^[a-f0-9]{64}$/u.test(key),
          ),
        }
      : {}),
    ...(!legacy && raw.runWorktrees === true ? { runWorktrees: true } : {}),
    ...(!legacy && raw.readOnly === true ? { readOnly: true } : {}),
    ...(!fromWorkDir && raw.recoveryRequired === true
      ? { recoveryRequired: true }
      : {}),
    ...text('recoveryReason'),
    subjectKey: raw.subjectKey,
    repos,
    ...(Array.isArray(raw.prepared)
      ? { prepared: (raw.prepared as unknown[]).filter(isText) }
      : {}),
    lastUsedAt: raw.lastUsedAt,
    ...text('endedAt'),
    ...text('lastRunId'),
    ...text('measuredAt'),
    ...text('artifactsCleanedAt'),
    ...(typeof raw.unpushed === 'boolean' ? { unpushed: raw.unpushed } : {}),
    ...(legacy
      ? { legacy: true as const }
      : typeof raw.pushed === 'boolean'
        ? { pushed: raw.pushed }
        : {}),
  };
}

/** The runner's record of `workDir`, else an earlier runner's record kept inside it; undefined when there is neither. */
export async function readWorkspaceMeta(
  paths: RunnerPaths,
  workDir: string,
): Promise<WorkspaceMeta | undefined> {
  const own = await readJson<Record<string, unknown>>(
    workspaceRecordPath(paths, workDir),
  ).catch(() => undefined);
  if (own !== undefined) return believable(paths, workDir, own, false);
  const legacy = await readJson<Record<string, unknown>>(
    legacyMetaPath(workDir),
  ).catch(() => undefined);
  return legacy === undefined
    ? undefined
    : believable(paths, workDir, legacy, true);
}

export async function writeWorkspaceMeta(
  paths: RunnerPaths,
  workDir: string,
  meta: WorkspaceMeta,
): Promise<void> {
  const file = workspaceRecordPath(paths, workDir);
  await writeJsonAtomic(file, meta);
  const handle = await open(file, 'r');
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
  if (process.platform !== 'win32') {
    const directory = await open(path.dirname(file), 'r');
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  }
}

/**
 * Whether the directory holds work that is not on the remote: changes not committed (untracked files included) in any
 * of its repositories, or a HEAD that is neither where the runner started the checkout nor contained in what it last
 * saw the remote task branch hold. A record from an earlier runner, which recorded neither, is judged by the task
 * branch's remote-tracking ref instead. A checkout that cannot be read counts as unpushed, so it is kept.
 */
export interface WorkspaceGitCheck {
  readonly reason: import('../protocol/index.ts').WorkspaceCleanupReason;
  readonly discardsUntracked: boolean;
}

/** Reads local objects only, never the network: what the runner last saw the remote hold. */
export async function checkWorkspaceGit(
  workDir: string,
  meta: WorkspaceMeta,
  log?: (message: string) => void,
): Promise<WorkspaceGitCheck> {
  let discardsUntracked = false;
  if (meta.continuationOnly === true)
    return { reason: 'missingEvidence', discardsUntracked: false };
  if (meta.runWorktrees === true)
    return { reason: 'missingEvidence', discardsUntracked: false };
  const result = (reason: WorkspaceGitCheck['reason']): WorkspaceGitCheck => ({
    reason,
    discardsUntracked,
  });
  for (const repo of meta.repos) {
    const dir = path.join(workDir, repo.path);
    const context = { dir, cache: repo.cache, url: repo.url };
    try {
      if (!existsSync(dir)) return result('gitFailed');
      const status = await taskGit(context, [
        'status',
        '--porcelain',
        '--untracked-files=normal',
        '--ignore-submodules=untracked',
      ]);
      const lines = status.split('\n').filter(Boolean);
      discardsUntracked ||= lines.some((line) => line.startsWith('??'));
      if (lines.some((line) => !line.startsWith('??')))
        return result('trackedChanges');
      if (discardsUntracked) return result('unpushed');
      // Parent status checks gitlink changes, but a committed gitlink does not prove the submodule commit was pushed.
      // taskGit validates every initialized submodule's config and metadata pointer before entering it with -C.
      const submodules = await taskGit(context, [
        'submodule',
        'foreach',
        '--quiet',
        '--recursive',
        'printf "%s\\0" "./$displaypath"',
      ]);
      for (const relative of submodules.split('\0').filter(Boolean)) {
        const child = path.resolve(dir, relative);
        if (!isInside(dir, child) || child === dir) return result('gitFailed');
        const childArgs = ['-C', child];
        const childStatus = await taskGit(context, [
          ...childArgs,
          'status',
          '--porcelain',
          '--untracked-files=normal',
          '--ignore-submodules=untracked',
        ]);
        const childLines = childStatus.split('\n').filter(Boolean);
        discardsUntracked ||= childLines.some((line) => line.startsWith('??'));
        if (childLines.some((line) => !line.startsWith('??')))
          return result('trackedChanges');
        if (discardsUntracked) return result('unpushed');
        const childHead = await taskGit(context, [
          ...childArgs,
          'rev-parse',
          '--verify',
          'HEAD',
        ]);
        const refs = await taskGit(context, [
          ...childArgs,
          'for-each-ref',
          '--format=%(objectname)',
          'refs/remotes/origin/',
        ]);
        const childCandidates = refs
          .split('\n')
          .filter((sha) => /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(sha));
        let childProven = false;
        for (const candidate of childCandidates) {
          if (
            childHead === candidate ||
            (await taskGitOk(context, [
              ...childArgs,
              'merge-base',
              '--is-ancestor',
              childHead,
              candidate,
            ]))
          ) {
            childProven = true;
            break;
          }
        }
        if (!childProven) return result('unpushed');
      }
      const head = await taskGit(context, [
        'rev-parse',
        '--verify',
        '-q',
        'HEAD',
      ]);
      if (
        meta.legacy !== true &&
        (head === repo.startSha || head === repo.pushedSha)
      )
        continue;
      const candidates: string[] = [];
      const pushed =
        meta.legacy === true
          ? `refs/remotes/origin/${repo.branch}`
          : repo.pushedSha;
      if (pushed !== undefined) candidates.push(pushed);
      let proven = false;
      let hasObjects = false;
      for (const candidate of candidates) {
        if (
          !(await taskGitOk(context, [
            'rev-parse',
            '--verify',
            '-q',
            `${candidate}^{commit}`,
          ]))
        )
          continue;
        hasObjects = true;
        if (
          head === candidate ||
          (await taskGitOk(context, [
            'merge-base',
            '--is-ancestor',
            head,
            candidate,
          ]))
        ) {
          proven = true;
          break;
        }
      }
      if (!proven) return result(hasObjects ? 'unpushed' : 'missingEvidence');
    } catch (error) {
      log?.(
        `workspaces: ${dir}: kept after Git check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return result('gitFailed');
    }
  }
  return result('allowed');
}

export async function hasUnpushedWork(
  workDir: string,
  meta: WorkspaceMeta,
  log?: (message: string) => void,
): Promise<boolean> {
  return (await checkWorkspaceGit(workDir, meta, log)).reason !== 'allowed';
}

/** Reuses the existing workspace verbatim, or creates a stable linked worktree. */
async function ensureCheckout(
  cache: string,
  dir: string,
  repo: RepoDir,
): Promise<boolean> {
  const context = { cache, dir, url: repo.url };
  const cacheOk = async (args: string[]): Promise<boolean> => {
    try {
      await cacheGit(cache, repo.url, args);
      return true;
    } catch (error) {
      if (
        error instanceof CheckoutError &&
        error.message.includes('unsafe or unsupported')
      )
        throw error;
      return false;
    }
  };
  if (existsSync(path.join(dir, '.git'))) {
    await taskGit(context, ['status', '--porcelain']);
    // Older fixed reference clones have independent tracking refs.
    if ((await stat(path.join(dir, '.git'))).isDirectory())
      await taskGit(context, [
        'fetch',
        '--quiet',
        '--prune',
        cache,
        '+refs/remotes/origin/*:refs/remotes/origin/*',
      ]);
    return false;
  }
  if (existsSync(dir) && (await readdir(dir)).length > 0)
    throw new CheckoutError(
      `${dir} exists and is not a worktree; retry after the other creator finishes`,
    );
  await mkdir(path.dirname(dir), { recursive: true });
  const branch = `refs/heads/${repo.branch}`;
  const remote = `refs/remotes/origin/${repo.branch}`;
  const fallback = `refs/remotes/origin/${repo.defaultBranch}`;
  const localExists = await cacheOk([
    'show-ref',
    '--verify',
    '--quiet',
    branch,
  ]);
  const remoteExists = await cacheOk([
    'show-ref',
    '--verify',
    '--quiet',
    remote,
  ]);
  const fallbackExists = await cacheOk([
    'show-ref',
    '--verify',
    '--quiet',
    fallback,
  ]);
  await cacheGit(cache, repo.url, [
    'config',
    'extensions.worktreeConfig',
    'true',
  ]);
  await cacheGit(cache, repo.url, [
    'config',
    '--worktree',
    'core.bare',
    'true',
  ]);
  if (await cacheOk(['config', '--get', '--local', 'core.bare']))
    await cacheGit(cache, repo.url, [
      'config',
      '--local',
      '--unset',
      'core.bare',
    ]);
  if (localExists)
    await cacheGit(cache, repo.url, [
      'worktree',
      'add',
      '--quiet',
      dir,
      repo.branch,
    ]);
  else if (remoteExists || fallbackExists)
    await cacheGit(cache, repo.url, [
      'worktree',
      'add',
      '--quiet',
      '-b',
      repo.branch,
      dir,
      remoteExists ? remote : fallback,
    ]);
  else {
    if (
      repo.initial !== true ||
      (await cacheGit(cache, repo.url, [
        'for-each-ref',
        '--format=%(refname)',
      ])) !== ''
    )
      throw new CheckoutError(
        `${repo.url} has no branch ${repo.defaultBranch}`,
      );
    if (
      (await cacheGit(cache, repo.url, ['worktree', 'list', '--porcelain']))
        .split('\n')
        .includes(`branch ${branch}`)
    )
      throw new CheckoutError(
        `${repo.branch} is already checked out by another task`,
      );
    const empty = path.join(path.dirname(dir), `.empty-${randomUUID()}`);
    await writeFile(empty, '', { flag: 'wx', mode: 0o600 });
    try {
      const tree = await cacheGit(cache, repo.url, [
        'hash-object',
        '-t',
        'tree',
        '-w',
        empty,
      ]);
      const bootstrap = await cacheGit(cache, repo.url, [
        '-c',
        'user.name=NocoBase runner',
        '-c',
        'user.email=runner@nocobase.local',
        '-c',
        'commit.gpgsign=false',
        'commit-tree',
        tree,
        '-m',
        'Worktree bootstrap',
      ]);
      await cacheGit(cache, repo.url, [
        'worktree',
        'add',
        '--quiet',
        '--detach',
        dir,
        bootstrap,
      ]);
      await taskGit(context, ['symbolic-ref', 'HEAD', branch]);
    } finally {
      await rm(empty, { force: true });
    }
  }
  await taskGit(context, ['config', '--worktree', 'core.bare', 'false']);
  return true;
}

async function workspaceWarnings(repo: CheckedOutRepo): Promise<string[]> {
  const branch = await taskGit(repo, ['symbolic-ref', '--short', 'HEAD']).catch(
    () => 'detached HEAD',
  );
  const target = `refs/remotes/origin/${repo.branch}`;
  const counts = await taskGit(repo, [
    'rev-list',
    '--left-right',
    '--count',
    `HEAD...${target}`,
  ]).catch(() => 'unknown');
  const dirty = await taskGit(repo, ['status', '--porcelain']);
  const operations = [];
  for (const name of ['MERGE_HEAD', 'rebase-merge', 'rebase-apply'])
    if (existsSync(path.join(repo.gitDir, name))) operations.push(name);
  return [
    `Workspace branch: ${branch}; requested target: ${repo.branch}; ahead/behind origin target: ${counts}; uncommitted changes: ${dirty ? 'yes' : 'no'}; unfinished operations: ${operations.join(', ') || 'none'}. The runner only fetched remote refs; inspect and coordinate before changing this shared workspace.`,
  ];
}

/** The submodules initialized in the worktree `dir`, nested ones included, as absolute paths. */
export async function listSubmodules(
  context: Pick<CheckedOutRepo, 'dir' | 'cache' | 'url'>,
): Promise<string[]> {
  const { dir } = context;
  if (!existsSync(path.join(dir, '.gitmodules'))) return [];
  // `foreach` visits only checked-out submodules; `displaypath` is relative to this top-level worktree even in recursion.
  // The ./ prefix and NUL terminator preserve leading/trailing whitespace through git()'s trim().
  const listed = await taskGit(context, [
    'submodule',
    'foreach',
    '--quiet',
    '--recursive',
    'printf "%s\\0" "./$displaypath"',
  ]);
  return listed
    .split('\0')
    .filter((entry) => entry !== '')
    .map((entry) => path.resolve(dir, entry));
}

/** The subject's working directory and nonexclusive usage registration. */
export interface WorkspaceLock {
  workDir: string;
  release(): Promise<void>;
}

/** Registers use of the subject directory without restricting concurrent entry. */
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
  const release = await registerWorkspaceUse(
    options.paths,
    workDir,
    String(process.pid),
  );
  try {
    await waitForWorkspaceCleanup(workDir);
    await mkdir(workDir, { recursive: true, mode: 0o700 });
  } catch (error) {
    await release();
    throw error;
  }
  return {
    workDir,
    release,
  };
}

/**
 * Starts the subject over (`workspace.clean`): removes its worktrees and everything the runner keeps in its work
 * directory, including the record of prepared directories. The caller holds the workspace lock. A directory used in
 * place is never inside a work directory (`prepareDirs` refuses that), so its contents are never touched.
 */
export async function cleanWorkspace(
  paths: RunnerPaths,
  workDir: string,
  runId?: string,
): Promise<void> {
  if (await workspaceInUse(paths, workDir, runId))
    throw new CheckoutError('The workspace is in use and cannot be reset.');
  const meta = await readWorkspaceMeta(paths, workDir);
  await removeWorkspace(paths, workDir, meta ?? { repos: [] }, {
    ignoreRunId: runId,
  });
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
  clean?: boolean;
  readOnly?: boolean;
  paths: RunnerPaths;
  appKey: string;
  subjectKey: string;
  /** Locked by the caller. */
  workDir: string;
  dirs: readonly WorkspaceDir[];
  /** The run's repository credentials (`workspace.git`). */
  auth?: RepoAuthSource;
  lockTimeoutMs?: number;
  log?: (message: string) => void;
  /** How cloning and fetching are retried. */
  retry?: GitRetryOptions;
  /** The run preparing them, recorded as the last run that worked here. */
  runId?: string;
}

/**
 * Prepares every working directory: a repository is checked out (a bare cache and a long-lived clone on its branch,
 * with the runner's commit hook); a directory used in place must exist, is registered for cleanup, and is not checked out or
 * branched. A directory counts as fresh until a run of the subject finishes in it (`markDirsPrepared`), so a run that
 * dies before doing what the initialization prompt asks leaves it for the next attempt. The result's `release` gives
 * the directory locks back.
 */
export async function prepareDirs(
  options: PrepareDirsOptions,
): Promise<{ dirs: PreparedDir[]; release(): Promise<void> }> {
  const { paths, workDir } = options;
  const meta = await readWorkspaceMeta(paths, workDir);
  const prepared = new Set(meta?.prepared ?? []);
  const shas = new Map<string, Pick<WorkspaceRepo, 'startSha' | 'pushedSha'>>();
  const locks: Lock[] = [];
  const release = async (): Promise<void> => {
    for (const lock of locks.splice(0)) await lock.release();
  };
  try {
    const dirs: PreparedDir[] = [];
    for (const [index, requested] of options.dirs.entries()) {
      let entry = requested;
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
        const unregister = await registerWorkspaceUse(
          paths,
          dir,
          options.runId ?? String(process.pid),
        );
        locks.push({ release: unregister });
        await waitForWorkspaceCleanup(dir);
        const hash = await preparationHash(dir, common.initPrompt);
        const key = preparedKey(entry);
        dirs.push({
          kind: 'directory',
          dir,
          fresh: !(await preparationCurrent(paths, dir, hash)),
          preparationHash: hash,
          key,
          ...common,
        });
        continue;
      }
      // Only the run that makes an empty repository's first commit works on, and pushes, its default branch.
      if (
        entry.branch === entry.defaultBranch &&
        entry.initial !== true &&
        !existsSync(path.join(workDir, entry.path, '.git'))
      )
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
      const retry = options.retry === undefined ? {} : { retry: options.retry };
      const repoUrl = entry.url;
      const cache = await withRepoAuth(options.auth, repoUrl, (auth) =>
        updateCache(paths, repoUrl, {
          ...(auth === undefined ? {} : { auth }),
          ...retry,
        }),
      );
      // A missing branch is not proof of an empty repository. Fetch/authentication failures have already failed
      // above; read all advertised refs before granting the narrowly scoped first-push exception.
      let initializing = false;
      if (
        entry.initializeIfEmpty === true &&
        entry.initial !== true &&
        !(await gitOk(
          [
            'show-ref',
            '--verify',
            '--quiet',
            `refs/remotes/origin/${entry.defaultBranch}`,
          ],
          cache,
        )) &&
        !(await gitOk(
          [
            'show-ref',
            '--verify',
            '--quiet',
            `refs/remotes/origin/${entry.branch}`,
          ],
          cache,
        ))
      ) {
        const refs = await withRepoAuth(options.auth, repoUrl, (auth) =>
          retryGit(
            `git ls-remote ${repoUrl}`,
            () =>
              git(
                [...GIT_LOW_SPEED_CONFIG, 'ls-remote', '--refs', repoUrl],
                cache,
                gitAuthEnv(auth),
                options.retry,
              ),
            options.retry,
          ),
        );
        if (refs.trim() === '') {
          initializing = true;
          entry = { ...entry, branch: entry.defaultBranch, initial: true };
        }
      }
      const created = await ensureCheckout(cache, dir, entry);
      const gitDir = await taskGitDir({ dir, cache, url: entry.url });
      const relative = path.relative(workDir, dir);
      const known = meta?.repos.find(
        (item) => item.url === entry.url && item.path === relative,
      );
      // Where a new checkout starts: nothing past it is the agent's. A resumed one keeps what was recorded.
      const startSha = created
        ? await taskGit({ dir, cache, url: entry.url }, [
            'rev-parse',
            '--verify',
            '-q',
            'HEAD',
          ]).catch(() => '')
        : (known?.startSha ?? '');
      shas.set(dir, {
        startSha,
        ...(!created && known?.pushedSha !== undefined
          ? { pushedSha: known.pushedSha }
          : {}),
      });
      // Refresh hooks on resumed clones too, so none keeps the push guard an earlier runner installed.
      if (created && isInside(dir, gitDir))
        await installGitHooks(path.join(gitDir, 'hooks'));
      const repo: CheckedOutRepo = {
        url: entry.url,
        branch: entry.branch,
        defaultBranch: entry.defaultBranch,
        localBranch: await taskGit({ dir, cache, url: entry.url }, [
          'symbolic-ref',
          '--quiet',
          '--short',
          'HEAD',
        ]).catch(() => 'detached HEAD'),
        ...shas.get(dir),
        primary,
        dir,
        cache,
        gitDir,
        submodules: await listSubmodules({ dir, cache, url: entry.url }),
        ...(initializing ? { initializing: true as const } : {}),
      };
      const key = preparedKey(entry);
      // A checkout created again (removed by GC, say) needs its initialization again.
      if (created) prepared.delete(key);
      if (created) {
        const legacy = (
          await readdir(path.dirname(workDir), { withFileTypes: true })
        ).filter(
          (item) =>
            item.isDirectory() &&
            item.name !== path.basename(workDir) &&
            item.name.startsWith(`${safeName(options.subjectKey)}.`),
        );
        const key = continuationKey(
          options.appKey,
          options.subjectKey,
          entry.url,
          entry.branch,
        );
        const refs = await git(
          [
            'for-each-ref',
            '--format=%(refname) %(objectname)',
            `refs/runner/resume/${key}`,
            `refs/runner/saved/${key}/`,
          ],
          cache,
        );
        repo.warnings = [
          ...(legacy.length
            ? [
                `Historical task directories remain for manual recovery (not imported): ${legacy.map((item) => path.join(path.dirname(workDir), item.name)).join(', ')}`,
              ]
            : []),
          ...(refs
            ? [
                `Historical local references remain in ${cache} for manual integration:\n${refs}`,
              ]
            : []),
        ];
      }
      repo.warnings = [
        ...(repo.warnings ?? []),
        ...(await workspaceWarnings(repo)),
      ];
      const hash = await preparationHash(dir, common.initPrompt);
      dirs.push({
        kind: 'repo',
        dir,
        fresh: !(await preparationCurrent(paths, dir, hash)),
        preparationHash: hash,
        key,
        repo,
        ...common,
      });
    }
    const repos = dirs.flatMap((entry) =>
      entry.repo === undefined ? [] : [entry.repo],
    );
    await writeWorkspaceMeta(paths, workDir, {
      ...meta,
      appKey: options.appKey,
      subjectKey: options.subjectKey,
      repos: repos.map((repo) => ({
        url: repo.url,
        path: path.relative(workDir, repo.dir),
        cache: repo.cache,
        branch: repo.branch,
        ...(repo.localBranch === undefined
          ? {}
          : {
              localBranch: repo.localBranch,
              continuation: repo.continuation,
            }),
        ...shas.get(repo.dir),
      })),
      ...(meta?.sessionKeys ? { sessionKeys: meta.sessionKeys } : {}),
      prepared: [...prepared],
      lastUsedAt: new Date().toISOString(),
      ...((options.runId ?? meta?.lastRunId)
        ? { lastRunId: options.runId ?? meta?.lastRunId }
        : {}),
      // Checked again once the run is over (core/workspaces.ts); what it held before stands in until then.
      ...(meta?.unpushed === undefined ? {} : { unpushed: meta.unpushed }),
      ...(meta?.measuredAt === undefined
        ? {}
        : { measuredAt: meta.measuredAt }),
    });
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
  if (options.clean === true)
    await cleanWorkspace(
      options.paths,
      subjectWorkDir(options.paths, options.appKey, options.subjectKey),
    );
  const lock = await lockWorkspace({
    paths: options.paths,
    appKey: options.appKey,
    subjectKey: options.subjectKey,
    ...(options.lockTimeoutMs === undefined
      ? {}
      : { timeoutMs: options.lockTimeoutMs }),
  });
  try {
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

/** Why a push failed, as `RepoReport.failure` names it. */
export function pushFailureOf(error: unknown): RepoPushFailure {
  if (error instanceof RepoAccessFailure)
    return error.kind === 'leaseLost'
      ? 'leaseLost'
      : error.kind === 'denied'
        ? 'credentialDenied'
        : 'credentialUnavailable';
  if (isAuthFailure(error)) return 'authFailed';
  const message = error instanceof Error ? error.message : String(error);
  if (
    /\[rejected\]|\[remote rejected\]|pre-push hook declined|nocobase-runner:|protected branch|non-fast-forward/iu.test(
      message,
    )
  )
    return 'rejected';
  return 'error';
}

/**
 * Reports the shared directory's current branch, HEAD, dirty state and remote reachability. Never commits or pushes.
 * With `auth`, a covered repository is reached only with its run credential.
 */
export async function reportRepos(
  repos: readonly CheckedOutRepo[],
  options: {
    /** Retained for older callers; reporting never pushes. */
    push: boolean;
    active?: () => boolean;
    signal?: AbortSignal;
    onAbort?: () => Promise<void>;
    auth?: RepoAuthSource;
    log?: (message: string) => void;
  },
): Promise<RepoReport[]> {
  const reports: RepoReport[] = [];
  for (const repo of repos) {
    try {
      if (options.active?.() === false)
        throw new RepoAccessFailure(
          'leaseLost',
          'The run ended before querying the remote.',
        );
      const headSha = await taskGit(repo, ['rev-parse', 'HEAD']);
      const branch = await taskGit(repo, [
        'symbolic-ref',
        '--quiet',
        '--short',
        'HEAD',
      ]).catch(() => 'detached HEAD');
      const dirty = (await taskGit(repo, ['status', '--porcelain'])) !== '';
      // Refresh remote evidence without moving any local branch or claiming ownership of another run's work.
      await withRepoAuth(options.auth, repo.url, (auth) =>
        taskGit(
          repo,
          [
            'fetch',
            '--quiet',
            '--prune',
            repo.url,
            '+refs/heads/*:refs/remotes/origin/*',
          ],
          {},
          {
            ...(auth ? { auth } : {}),
            ...(options.signal ? { signal: options.signal } : {}),
          },
        ),
      );
      const refs = (
        await taskGit(repo, [
          'for-each-ref',
          '--format=%(objectname)',
          'refs/remotes/origin/',
        ])
      )
        .split('\n')
        .filter(Boolean);
      let reachable = false;
      for (const remote of refs)
        if (
          await taskGitOk(repo, [
            'merge-base',
            '--is-ancestor',
            headSha,
            remote,
          ])
        ) {
          reachable = true;
          break;
        }
      reports.push({
        url: repo.url,
        branch,
        targetBranch: repo.branch,
        localBranch: branch,
        headSha,
        pushed: reachable && !dirty,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      options.log?.(`report: ${repo.url}: ${message}`);
      reports.push({
        url: repo.url,
        branch: repo.branch,
        headSha: '',
        pushed: false,
        failure: {
          reason: pushFailureOf(error),
          message: message.slice(0, 2000),
        },
      });
    }
  }
  return reports;
}

/** Records that a run finished in `dirs`: they are no longer fresh for the subject. */
export async function markDirsPrepared(
  paths: RunnerPaths,
  workDir: string,
  dirs: readonly PreparedDir[],
): Promise<void> {
  void workDir;
  for (const dir of dirs)
    if (dir.preparationHash !== undefined)
      await confirmPreparation(
        paths,
        dir.dir,
        dir.initPrompt,
        dir.preparationHash,
      );
}

/**
 * Records that the run ended, with where each repository stood (`reportRepos`): every branch pushed or not, and for
 * each one pushed, the commit the remote task branch now holds.
 */
export async function markWorkspaceEnded(
  paths: RunnerPaths,
  workDir: string,
  reports: readonly RepoReport[],
): Promise<void> {
  const meta = await readWorkspaceMeta(paths, workDir);
  if (meta === undefined) return;
  const now = new Date().toISOString();
  if (
    meta.runWorktrees === true &&
    meta.readOnly !== true &&
    meta.appKey !== undefined
  )
    await updateContinuationState(
      paths,
      meta.appKey,
      meta.subjectKey,
      (state) => ({
        ...state,
        repos: state.repos.map((repo) => {
          const report = reports.find(
            (item) =>
              item.url === repo.url &&
              (item.targetBranch ?? item.branch) === repo.branch,
          );
          return report?.pushed === true && SHA.test(report.headSha ?? '')
            ? { ...repo, pushedSha: report.headSha }
            : repo;
        }),
      }),
    );
  await writeWorkspaceMeta(paths, workDir, {
    ...meta,
    repos: meta.repos.map((repo) => {
      const report = reports.find(
        (item) =>
          item.url === repo.url &&
          (item.targetBranch ?? item.branch) === repo.branch,
      );
      const headSha = report?.headSha ?? '';
      return report?.pushed === true && SHA.test(headSha)
        ? { ...repo, pushedSha: headSha }
        : repo;
    }),
    lastUsedAt: now,
    endedAt: now,
    pushed: reports.every((report) => report.pushed),
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

/** The dedicated sibling layout produced by workspaceKey; never a lock directory. */
export function isReadOnlyWorkspace(workDir: string): boolean {
  return /^[^.][^/]*\.readonly-[A-Za-z0-9_-]+$/u.test(path.basename(workDir));
}

/** A legacy `<KEY>.readonly-*` directory, or a read-only run's own attempt directory: nothing in it is ever saved. */
export function isDisposableWorkspace(
  workDir: string,
  meta: Partial<Pick<WorkspaceMeta, 'readOnly' | 'runAttempt'>> | undefined,
): boolean {
  return (
    isReadOnlyWorkspace(workDir) ||
    (meta?.readOnly === true && meta.runAttempt === true)
  );
}

/**
 * Removes a subject's work directory, and a legacy worktree's record in its cache. The caller holds the workspace lock.
 */
export async function removeWorkspace(
  paths: RunnerPaths,
  workDir: string,
  meta: Pick<WorkspaceMeta, 'repos'> & Partial<WorkspaceMeta>,
  options: { cleanupHeld?: boolean; ignoreRunId?: string } = {},
): Promise<void> {
  const lock = options.cleanupHeld
    ? undefined
    : await acquireLock(`${workDir}.lock`, { timeoutMs: 0 });
  try {
    await removeWorkspaceUnderCleanup(
      paths,
      workDir,
      meta,
      options.ignoreRunId,
    );
  } finally {
    await lock?.release();
  }
}

async function removeWorkspaceUnderCleanup(
  paths: RunnerPaths,
  workDir: string,
  meta: Pick<WorkspaceMeta, 'repos'> & Partial<WorkspaceMeta>,
  ignoreRunId?: string,
): Promise<void> {
  const checkUse = async (): Promise<void> => {
    if (await workspaceInUse(paths, workDir, ignoreRunId))
      throw new CheckoutError('The workspace is in use.');
  };
  await checkUse();
  for (const repo of meta.repos)
    await invalidatePreparation(paths, path.join(workDir, repo.path));

  if (meta.continuationOnly === true) {
    await clearContinuations(paths, workDir, meta as WorkspaceMeta);
    return;
  }
  // A read-only checkout holds nothing to save. The caller holds its lock and has stopped its processes.
  if (isDisposableWorkspace(workDir, meta)) {
    await checkUse();
    await rm(workDir, { recursive: true, force: true });
    // Missing metadata is common after an interrupted removal. Prune registrations, never borrowed objects.
    for (const entry of await readdir(paths.reposDir, {
      withFileTypes: true,
    }).catch(() => [])) {
      if (!entry.isDirectory() || !entry.name.endsWith('.git')) continue;
      const cache = path.join(paths.reposDir, entry.name);
      const lock = await lockCache(cache);
      try {
        await git(['worktree', 'prune'], cache);
        // Preserve agent branches and unpublished aliases even in a read-only attempt's shared cache.
        for (const repo of meta.repos)
          if (repo.cache === cache)
            await deletePublishedRunBranch(
              cache,
              repo.localBranch,
              runBranch(workDir, repo.path),
            );
      } finally {
        await lock.release();
      }
    }
    await rm(workspaceRecordPath(paths, workDir), { force: true });
    await removeOwnedSessions(paths, workDir, meta, ignoreRunId);
    return;
  }
  if (meta.runWorktrees === true || meta.recoveryRequired === true)
    throw new CheckoutError(
      'Run worktrees must be saved by their finalizer; recovery directories cannot be discarded by ordinary GC.',
    );
  // Unregister only the recorded checkout while holding its cache lock. Never prune other runs' worktree metadata.
  for (const repo of meta.repos) {
    const dir = path.join(workDir, repo.path);
    if (!isInside(workDir, dir) || dir === path.resolve(workDir)) continue;
    if (existsSync(repo.cache)) {
      const lock = await lockCache(repo.cache);
      try {
        await checkUse();
        await gitOk(['worktree', 'remove', '--force', dir], repo.cache);
      } finally {
        await lock.release();
      }
    }
  }
  await checkUse();
  await rm(workDir, { recursive: true, force: true });
  await rm(workspaceRecordPath(paths, workDir), { force: true });
  await removeOwnedSessions(paths, workDir, meta, ignoreRunId);
}

/** Legacy attempts own only their recorded legacy sessions, never the new fixed task's session home. */
export async function removeOwnedSessions(
  paths: RunnerPaths,
  workDir: string,
  meta: Partial<WorkspaceMeta>,
  ignoreRunId?: string,
): Promise<void> {
  if (meta.appKey && meta.subjectKey) {
    const owner = taskWorkDir(paths, meta.appKey, meta.subjectKey);
    if (
      path.resolve(workDir) === owner &&
      !(await workspaceInUse(paths, owner, ignoreRunId))
    )
      await rm(taskSessionRoot(paths, meta.appKey, meta.subjectKey), {
        recursive: true,
        force: true,
      });
  }
  for (const key of meta.sessionKeys ?? [])
    await rm(path.join(paths.workRoot, '.sessions', key), {
      recursive: true,
      force: true,
    });
}

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
    // `.pnpm-store`, `.jobs`: the runner's own, never an application's (`safeName` gives none a leading dot).
    if (!app.isDirectory() || app.name.startsWith('.')) continue;
    const appDir = path.join(paths.workRoot, app.name);
    for (const entry of await readdir(appDir, { withFileTypes: true }).catch(
      () => [],
    ))
      if (entry.isDirectory()) workDirs.push(path.join(appDir, entry.name));
  }
  for (const workDir of workDirs) {
    if (await workspaceInUse(paths, workDir)) continue;
    const meta = await readWorkspaceMeta(paths, workDir);
    // Unlocked: its run is gone. Removed without a Git validity check, which a half-deleted checkout fails.
    if (isDisposableWorkspace(workDir, meta)) {
      let lock: Lock;
      try {
        lock = await acquireLock(`${workDir}.lock`, { timeoutMs: 0 });
      } catch {
        continue;
      }
      try {
        await removeWorkspace(paths, workDir, meta ?? { repos: [] }, {
          cleanupHeld: true,
        });
        removed.push(workDir);
      } catch (error) {
        options.log?.(`gc: cleanup failed for ${workDir}: ${String(error)}`);
      } finally {
        await lock.release();
      }
      continue;
    }
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
      // Read again under the lock: a run may have used it since.
      const current = await readWorkspaceMeta(paths, workDir);
      if (current === undefined || current.lastUsedAt !== meta.lastUsedAt)
        continue;
      if (await hasUnpushedWork(workDir, current, options.log)) {
        options.log?.(
          `gc: kept ${workDir}: it holds work that was never pushed`,
        );
        continue;
      }
      await removeWorkspace(paths, workDir, current, { cleanupHeld: true });
      removed.push(workDir);
      options.log?.(`gc: removed ${workDir}`);
    } finally {
      await lock.release();
    }
  }
  return removed;
}
