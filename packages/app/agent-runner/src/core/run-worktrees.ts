// Per-attempt worktrees and local continuation refs. Saved heads are immutable: a concurrent run never replaces
// another run's work, even when the resume compare-and-swap loses. Only Git's normal merge combines their contents.
import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

import { safeName, type RunnerPaths } from '../lib/home.ts';
import { isInside } from '../lib/paths.ts';
import type { RepoDir } from '../protocol/index.ts';
import {
  acquireLock,
  lockCache,
  readWorkspaceMeta,
  writeWorkspaceMeta,
  workspaceRecordPath,
  type WorkspaceMeta,
  subjectWorkDir,
  CheckoutError,
  git,
  gitOk,
} from './checkout.ts';
import { taskGit, taskGitDir, taskGitOk } from './task-git.ts';

const identity = (parts: readonly string[]) =>
  createHash('sha256').update(JSON.stringify(parts)).digest('hex');
const COMMIT = [
  '-c',
  'core.fsync=objects,reference',
  '-c',
  'core.fsyncMethod=fsync',
  '-c',
  'user.name=NocoBase runner',
  '-c',
  'user.email=runner@nocobase.local',
  '-c',
  'commit.gpgsign=false',
];

export function continuationKey(
  app: string,
  subject: string,
  repo: string,
  target: string,
): string {
  return identity([app, subject, repo, target]);
}

export function runWorkDir(
  paths: RunnerPaths,
  app: string,
  subject: string,
  run: string,
  attempt: number,
): string {
  return subjectWorkDir(
    paths,
    app,
    `${subject}.run-${safeName(run)}-${attempt}-${randomUUID()}`,
  );
}

export function sessionWorkDir(
  paths: RunnerPaths,
  app: string,
  subject: string,
  agent: string,
  tool: string,
  scope = 'root',
): string {
  return path.join(
    paths.workRoot,
    '.sessions',
    identity([app, subject, agent, tool, scope]),
  );
}

export function runBranch(workDir: string, repoPath: string): string {
  return `runner-run-${identity([workDir])}-${identity([repoPath])}`;
}

export function continuationWorkDir(
  paths: RunnerPaths,
  app: string,
  subject: string,
): string {
  return subjectWorkDir(
    paths,
    app,
    `${subject}.continuations-${identity([app, subject]).slice(0, 16)}`,
  );
}

export async function readContinuationState(
  paths: RunnerPaths,
  app: string,
  subject: string,
): Promise<WorkspaceMeta | undefined> {
  return readWorkspaceMeta(paths, continuationWorkDir(paths, app, subject));
}

export async function updateContinuationState(
  paths: RunnerPaths,
  app: string,
  subject: string,
  update: (meta: WorkspaceMeta) => WorkspaceMeta,
): Promise<void> {
  const workDir = continuationWorkDir(paths, app, subject);
  const lock = await acquireLock(`${workDir}.lock`);
  try {
    await mkdir(workDir, { recursive: true, mode: 0o700 });
    const meta = (await readWorkspaceMeta(paths, workDir)) ?? {
      appKey: app,
      subjectKey: subject,
      repos: [],
      lastUsedAt: new Date().toISOString(),
    };
    await writeWorkspaceMeta(paths, workDir, {
      ...update(meta),
      continuationOnly: true,
      lastUsedAt: new Date(
        Math.max(Date.now(), Date.parse(meta.lastUsedAt) + 1),
      ).toISOString(),
    });
  } finally {
    await lock.release();
  }
}

/** Called only after the application's second cleanup confirmation, under the state directory lock. */
export async function clearContinuations(
  paths: RunnerPaths,
  workDir: string,
  meta: WorkspaceMeta,
): Promise<void> {
  if (
    meta.appKey === undefined ||
    workDir !== continuationWorkDir(paths, meta.appKey, meta.subjectKey)
  )
    throw new CheckoutError('Invalid continuation state directory');
  if ((meta.activeWorkDirs ?? []).some((dir) => existsSync(dir)))
    throw new CheckoutError(
      'An active or recovery worktree still holds this task',
    );
  for (const repo of meta.repos) {
    const key = continuationKey(
      meta.appKey,
      meta.subjectKey,
      repo.url,
      repo.branch,
    );
    if (repo.continuation !== key)
      throw new CheckoutError('Continuation namespace mismatch');
    const lock = await lockCache(repo.cache);
    try {
      const refs = (
        await git(
          [
            'for-each-ref',
            '--format=%(refname)',
            `refs/runner/saved/${key}/`,
            `refs/runner/resume/${key}`,
          ],
          repo.cache,
        )
      )
        .split('\n')
        .filter(Boolean);
      for (const name of refs)
        await git(['update-ref', '-d', name], repo.cache);
    } finally {
      await lock.release();
    }
  }
  for (const key of meta.sessionKeys ?? [])
    await rm(path.join(paths.workRoot, '.sessions', key), {
      recursive: true,
      force: true,
    });
  await rm(workDir, { recursive: true, force: true });
  await rm(workspaceRecordPath(paths, workDir), { force: true });
}

async function ref(cache: string, name: string): Promise<string | undefined> {
  const refs = (
    await git(['for-each-ref', '--format=%(refname)', name], cache)
  ).split('\n');
  if (!refs.includes(name)) return undefined;
  return git(['rev-parse', '--verify', `${name}^{commit}`], cache);
}

async function importLegacy(
  paths: RunnerPaths,
  app: string,
  subject: string,
  cache: string,
  url: string,
): Promise<void> {
  const workDir = subjectWorkDir(paths, app, subject);
  const meta = await readWorkspaceMeta(paths, workDir);
  if (meta === undefined || meta.repos.length === 0) return;
  const lock = await acquireLock(`${workDir}.lock`, { timeoutMs: 0 });
  try {
    for (const repo of meta.repos) {
      if (repo.url !== url) continue;
      const context = { dir: path.join(workDir, repo.path), cache, url };
      const gitDir = await taskGitDir(context);
      if (
        (await taskGit(context, [
          'symbolic-ref',
          '--quiet',
          '--short',
          'HEAD',
        ]).catch(() => '')) === ''
      )
        throw new CheckoutError(
          `Legacy recovery required in ${context.dir}: detached HEAD cannot be imported as a task branch`,
        );
      if (
        [
          'MERGE_HEAD',
          'rebase-merge',
          'rebase-apply',
          'CHERRY_PICK_HEAD',
          'REVERT_HEAD',
        ].some((name) => existsSync(path.join(gitDir, name))) ||
        (await taskGit(context, ['diff', '--name-only', '--diff-filter=U'])) !==
          ''
      )
        throw new CheckoutError(
          `Legacy recovery required in ${context.dir}: unresolved Git operation`,
        );
      if (
        (await taskGit(context, ['submodule', 'status', '--recursive'])) !== ''
      )
        throw new CheckoutError(
          `Legacy recovery required in ${context.dir}: submodule objects must remain in their original repository`,
        );
      await taskGit(context, ['add', '--all']);
      if (!(await taskGitOk(context, ['diff', '--cached', '--quiet'])))
        await taskGit(context, [
          ...COMMIT,
          'commit',
          '-m',
          'chore(runner): save legacy local continuation',
        ]);
      const branches = (
        await taskGit(context, [
          'for-each-ref',
          '--format=%(refname:strip=2)',
          'refs/heads/',
        ])
      )
        .split('\n')
        .filter(Boolean);
      for (const branch of branches) {
        const head = await taskGit(context, [
          'rev-parse',
          `refs/heads/${branch}`,
        ]);
        const key = continuationKey(app, subject, url, branch);
        const saved = `refs/runner/saved/${key}/0/legacy-${identity([workDir, repo.path])}/${head}`;
        // Fetch only into an immutable namespace; never overwrite remote tracking refs or the legacy branch.
        await git(
          [
            'fetch',
            '--no-write-fetch-head',
            context.dir,
            `refs/heads/${branch}:${saved}`,
          ],
          cache,
        );
        if ((await ref(cache, saved)) !== head)
          throw new CheckoutError(
            `Legacy ref verification failed: ${context.dir}`,
          );
        await updateContinuationState(paths, app, subject, (state) => ({
          ...state,
          repos: state.repos.some((item) => item.continuation === key)
            ? state.repos
            : [
                ...state.repos,
                { url, path: key, cache, branch, continuation: key },
              ],
        }));
      }
    }
    // The old directory stays protected by its existing GC evidence; do not remove it during import.
    // Each repository is imported on demand, so do not mark a multi-repository workspace fully migrated yet.
  } catch (error) {
    await writeWorkspaceMeta(paths, workDir, {
      ...meta,
      recoveryRequired: true,
    });
    await updateContinuationState(paths, app, subject, (state) => ({
      ...state,
      activeWorkDirs: [...new Set([...(state.activeWorkDirs ?? []), workDir])],
    }));
    throw error;
  } finally {
    await lock.release();
  }
}

/** Create and register before any subsequent preparation can fail or be cancelled. */
export async function addRunWorktree(options: {
  paths: RunnerPaths;
  workDir: string;
  appKey: string;
  subjectKey: string;
  runId: string;
  cache: string;
  repo: RepoDir;
  readOnly: boolean;
  clean?: boolean;
}): Promise<{
  branch: string;
  continuation: string;
  continuationEpoch: string;
  conflicted: boolean;
  warnings: string[];
}> {
  const { paths, workDir, appKey, subjectKey, cache, repo } = options;
  const dir = path.resolve(workDir, repo.path);
  const branch = runBranch(workDir, repo.path);
  const key = continuationKey(appKey, subjectKey, repo.url, repo.branch);
  let epoch = '0';
  const warnings: string[] = [];
  let conflicted = false;
  const state = await readContinuationState(paths, appKey, subjectKey);
  for (const previous of state?.activeWorkDirs ?? []) {
    const record = await readWorkspaceMeta(paths, previous);
    if (record?.recoveryRequired === true)
      warnings.push(
        `Recovery work remains in ${previous}. Resolve or recover it before continuing; this run's checkout cannot represent its unresolved index or uncommitted files.`,
      );
  }
  await mkdir(path.dirname(dir), { recursive: true });
  await updateContinuationState(paths, appKey, subjectKey, (state) => {
    epoch =
      options.clean === true && !options.readOnly
        ? randomUUID()
        : (state.repos.find((item) => item.continuation === key)
            ?.continuationEpoch ?? '0');
    return {
      ...state,
      lastRunId: options.runId,
      ...(options.clean === true ? { prepared: [] } : {}),
      activeWorkDirs: [...new Set([...(state.activeWorkDirs ?? []), workDir])],
      repos: [
        ...state.repos.filter((item) => item.continuation !== key),
        {
          url: repo.url,
          path: key,
          cache,
          branch: repo.branch,
          continuation: key,
          continuationEpoch: epoch,
        },
      ],
    };
  });
  const resume = `refs/runner/resume/${key}/${epoch}`;
  const lock = await lockCache(cache);
  try {
    if (!options.readOnly)
      await importLegacy(paths, appKey, subjectKey, cache, repo.url);
    const remote = await ref(cache, `refs/remotes/origin/${repo.branch}`);
    const local = await ref(cache, resume);
    const base =
      local ??
      remote ??
      (await ref(cache, `refs/remotes/origin/${repo.defaultBranch}`));
    // PM-294's selected PR must exist remotely; do not substitute the default branch.
    if (
      'pullRequest' in repo &&
      repo.pullRequest !== undefined &&
      remote === undefined
    )
      throw new CheckoutError(
        `${repo.url}: selected pull request branch ${repo.branch} is missing remotely`,
      );
    const existing = await readWorkspaceMeta(paths, workDir);
    await writeWorkspaceMeta(paths, workDir, {
      ...existing,
      appKey,
      subjectKey,
      lastRunId: options.runId,
      lastUsedAt: new Date().toISOString(),
      runWorktrees: true,
      readOnly: options.readOnly,
      repos: [
        ...(existing?.repos ?? []),
        {
          url: repo.url,
          path: repo.path,
          cache,
          branch: repo.branch,
          localBranch: branch,
          continuation: key,
          continuationEpoch: epoch,
          ...(base === undefined ? {} : { startSha: base }),
        },
      ],
    });
    if (base === undefined) {
      if (
        repo.initial !== true ||
        (await git(['for-each-ref', '--format=%(refname)'], cache)) !== ''
      )
        throw new CheckoutError(
          `${repo.url}: no base commit for ${repo.branch}`,
        );
      // Git supports unborn worktrees through --orphan only in recent versions. Fail safely if unavailable.
      await git(['worktree', 'add', '--orphan', '-b', branch, dir], cache);
    } else {
      await git(['worktree', 'add', '--quiet', '-b', branch, dir, base], cache);
    }
    await git(['config', 'extensions.worktreeConfig', 'true'], cache);
    // Bare applies only to the cache itself. Other linked worktrees, including build jobs, must remain usable.
    await git(['config', '--worktree', 'core.bare', 'true'], cache);
    if (await gitOk(['config', '--get', '--local', 'core.bare'], cache))
      await git(['config', '--local', '--unset', 'core.bare'], cache);
    await git(['config', '--worktree', 'core.bare', 'false'], dir);
  } finally {
    await lock.release();
  }
  if (options.clean === true)
    warnings.push(
      `A clean run starts a new continuation generation. Earlier saved heads remain protected under refs/runner/saved/${key}/; they are not discarded or merged into this generation.`,
    );
  const context = { dir, cache, url: repo.url };
  const heads = (
    await git(
      [
        'for-each-ref',
        '--format=%(objectname)',
        `refs/runner/saved/${key}/${epoch}/`,
      ],
      cache,
    )
  )
    .split('\n')
    .filter(Boolean);
  const remote = await ref(cache, `refs/remotes/origin/${repo.branch}`);
  if (remote !== undefined) heads.push(remote);
  for (const head of options.readOnly ? [] : [...new Set(heads)]) {
    if (await taskGitOk(context, ['merge-base', '--is-ancestor', head, 'HEAD']))
      continue;
    try {
      await taskGit(context, [...COMMIT, 'merge', '--no-edit', head]);
    } catch (error) {
      const gitDir = await taskGitDir(context);
      if (
        !existsSync(path.join(gitDir, 'MERGE_HEAD')) &&
        (await taskGit(context, ['diff', '--name-only', '--diff-filter=U'])) ===
          ''
      )
        throw error;
      conflicted = true;
      warnings.push(
        `Resolve the merge in ${dir} before working or pushing. Remaining continuation heads: ${heads.join(', ')}.`,
      );
      break;
    }
  }

  if (await ref(cache, resume))
    warnings.push(
      `This machine restored local continuation commits for target ${repo.branch}. These may not have been pushed.`,
    );
  return {
    branch,
    continuation: key,
    continuationEpoch: epoch,
    conflicted,
    warnings,
  };
}

export interface SaveResult {
  readonly path: string;
  readonly saved: boolean;
  readonly head?: string;
  readonly reason?: string;
}

/** Stop every writer before calling. Never pushes. On any uncertainty keep the worktree and its metadata. */
export async function finalizeRunWorktrees(
  paths: RunnerPaths,
  workDir: string,
  log: (message: string) => void,
  options: { remove?: boolean } = {},
): Promise<SaveResult[]> {
  const meta = await readWorkspaceMeta(paths, workDir);
  if (meta?.runWorktrees !== true) {
    if (options.remove !== false && meta?.appKey !== undefined)
      await updateContinuationState(
        paths,
        meta.appKey,
        meta.subjectKey,
        (state) => ({
          ...state,
          activeWorkDirs: (state.activeWorkDirs ?? []).filter(
            (dir) => dir !== workDir,
          ),
        }),
      );
    return [];
  }
  if (meta.readOnly === true && options.remove === false) return [];
  const results: SaveResult[] = [];
  for (const repo of meta.repos) {
    const dir = path.join(workDir, repo.path);
    if (!existsSync(dir)) continue;
    const context = { dir, cache: repo.cache, url: repo.url };
    try {
      const gitDir = await taskGitDir(context);
      if (
        !isInside(workDir, dir) ||
        repo.localBranch !== runBranch(workDir, repo.path) ||
        repo.continuation !==
          continuationKey(
            meta.appKey ?? '',
            meta.subjectKey,
            repo.url,
            repo.branch,
          )
      )
        throw new CheckoutError(
          'Worktree ownership or continuation identity does not match its record',
        );
      // Metadata validation runs before checking/committing; never execute checkout-provided hooks or filters.
      await taskGit(context, ['status', '--porcelain']);
      if (meta.readOnly !== true) {
        if (
          (await taskGit(context, [
            'diff',
            '--name-only',
            '--diff-filter=U',
          ])) !== '' ||
          [
            'MERGE_HEAD',
            'rebase-merge',
            'rebase-apply',
            'CHERRY_PICK_HEAD',
            'REVERT_HEAD',
          ].some((name) => existsSync(path.join(gitDir, name)))
        )
          throw new CheckoutError(
            'Unresolved Git operation; keep the original worktree for recovery',
          );
        // Retain any initialized submodule, including its unpublished objects. A parent gitlink cannot save them.
        if (
          (await taskGit(context, ['submodule', 'status', '--recursive'])) !==
          ''
        )
          throw new CheckoutError(
            'Initialized submodules require recovery in the original worktree; their objects are not saved by a parent commit',
          );
        if (
          (await taskGit(context, ['symbolic-ref', '--short', 'HEAD'])) !==
          repo.localBranch
        )
          throw new CheckoutError(
            'The agent changed the local branch; keep the worktree for recovery',
          );
        await taskGit(context, ['add', '--all']);
        if (!(await taskGitOk(context, ['diff', '--cached', '--quiet'])))
          await taskGit(context, [
            ...COMMIT,
            'commit',
            '-m',
            'chore(runner): save local continuation',
          ]);
        const head = await taskGit(context, ['rev-parse', 'HEAD']).catch(
          () => undefined,
        );
        if (head !== undefined) {
          const saved = `refs/runner/saved/${repo.continuation}/${repo.continuationEpoch ?? '0'}/${identity([workDir])}/${head}`;
          const resume = `refs/runner/resume/${repo.continuation}/${repo.continuationEpoch ?? '0'}`;
          const lock = await acquireLock(
            path.join(paths.locksDir, `resume-${repo.continuation}.lock`),
          );
          try {
            const previousSaved = await ref(repo.cache, saved);
            if (previousSaved !== undefined && previousSaved !== head)
              throw new CheckoutError(
                'Immutable saved ref already contains a different head',
              );
            if (previousSaved === undefined)
              await git(
                ['update-ref', saved, head, '0'.repeat(head.length)],
                repo.cache,
              );
            if ((await ref(repo.cache, saved)) !== head)
              throw new CheckoutError('Saved ref verification failed');
            const previous = await ref(repo.cache, resume);
            if (
              previous === undefined ||
              (await gitOk(
                ['merge-base', '--is-ancestor', previous, head],
                repo.cache,
              ))
            )
              await git(
                [
                  'update-ref',
                  resume,
                  head,
                  previous ?? '0'.repeat(head.length),
                ],
                repo.cache,
              );
            // A divergent result stays reachable in saved/* and is merged during the next preparation.
          } finally {
            await lock.release();
          }
          results.push({ path: dir, saved: true, head });
        } else results.push({ path: dir, saved: true });
      } else results.push({ path: dir, saved: true });
      if (options.remove === false) continue;
      const lock = await lockCache(repo.cache);
      try {
        // Validate the backlink again before Git removes anything. Never prune unrelated worktree metadata.
        await taskGitDir(context);
        // Git refuses to remove a populated submodule worktree. A validated read-only checkout has no work to save.
        if (meta.readOnly === true && existsSync(path.join(dir, '.gitmodules')))
          await rm(dir, { recursive: true, force: true });
        await git(['worktree', 'remove', '--force', dir], repo.cache);
        await git(
          ['update-ref', '-d', `refs/heads/${repo.localBranch}`],
          repo.cache,
        );
      } finally {
        await lock.release();
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      // Replace a provisional success if deleting failed, so the recovery directory remains registered.
      const index = results.findIndex((result) => result.path === dir);
      if (index >= 0) results.splice(index, 1);
      results.push({ path: dir, saved: false, reason });
      log(`worktree recovery required: ${dir}: ${reason}`);
    }
  }
  if (results.every((result) => result.saved) && options.remove !== false) {
    await rm(workDir, { recursive: true, force: true });
    await rm(workspaceRecordPath(paths, workDir), { force: true });
    if (meta.appKey !== undefined)
      await updateContinuationState(
        paths,
        meta.appKey,
        meta.subjectKey,
        (state) => ({
          ...state,
          activeWorkDirs: (state.activeWorkDirs ?? []).filter(
            (dir) => dir !== workDir,
          ),
        }),
      );
  } else if (results.some((result) => !result.saved)) {
    await writeWorkspaceMeta(paths, workDir, {
      ...meta,
      recoveryRequired: true,
      endedAt: new Date().toISOString(),
    });
  }
  return results;
}
