// Per-attempt worktrees. Resume advances only by fast-forward; divergent heads are listed for manual integration.
import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
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
  warnings: string[];
}> {
  const { paths, workDir, appKey, subjectKey, cache, repo } = options;
  const dir = path.resolve(workDir, repo.path);
  const branch = runBranch(workDir, repo.path);
  const key = continuationKey(appKey, subjectKey, repo.url, repo.branch);
  const warnings: string[] = [];
  const state = await readContinuationState(paths, appKey, subjectKey);
  for (const previous of state?.activeWorkDirs ?? []) {
    const record = await readWorkspaceMeta(paths, previous);
    if (record?.recoveryRequired === true)
      warnings.push(
        `Recovery work remains in ${previous}${record.recoveryReason ? `: ${record.recoveryReason}` : ''}. Resolve or recover it before continuing; this run's checkout cannot represent its unresolved index or uncommitted files.`,
      );
  }
  await mkdir(path.dirname(dir), { recursive: true });
  await updateContinuationState(paths, appKey, subjectKey, (state) => {
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
        },
      ],
    };
  });
  const resume = `refs/runner/resume/${key}`;
  const lock = await lockCache(cache);
  try {
    const remote = await ref(cache, `refs/remotes/origin/${repo.branch}`);
    const local = await ref(cache, resume);
    let base =
      (options.readOnly || options.clean ? undefined : local) ??
      remote ??
      (await ref(cache, `refs/remotes/origin/${repo.defaultBranch}`));
    if (
      !options.readOnly &&
      !options.clean &&
      local &&
      remote &&
      local !== remote
    ) {
      if (await gitOk(['merge-base', '--is-ancestor', local, remote], cache))
        base = remote;
      else if (
        !(await gitOk(['merge-base', '--is-ancestor', remote, local], cache))
      )
        warnings.push(
          `Remote ${repo.branch} diverged from local continuation. Integrate it manually before pushing; no automatic merge was performed.`,
        );
    }
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
      // Older Git cannot add an unborn worktree. Attach through an unreferenced empty commit, then make only
      // this worktree's HEAD unborn. The first user commit has no bootstrap parent and no shared ref is changed.
      const empty = path.join(workDir, `.empty-tree-${randomUUID()}`);
      await writeFile(empty, '', { flag: 'wx', mode: 0o600 });
      try {
        const tree = await git(
          ['hash-object', '-t', 'tree', '-w', empty],
          cache,
        );
        const bootstrap = await git(
          [...COMMIT, 'commit-tree', tree, '-m', 'Worktree bootstrap'],
          cache,
        );
        await git(
          ['worktree', 'add', '--quiet', '--detach', dir, bootstrap],
          cache,
        );
        await git(['symbolic-ref', 'HEAD', `refs/heads/${branch}`], dir);
      } finally {
        await rm(empty, { force: true });
      }
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
  const savedHeads = await git(
    [
      'for-each-ref',
      '--format=%(refname) %(objectname)',
      `refs/runner/saved/${key}/`,
    ],
    cache,
  );
  if (savedHeads !== '')
    warnings.push(
      `Additional saved commits require manual integration:\n${savedHeads}`,
    );
  if (options.clean === true)
    warnings.push(
      'Clean checkout starts from the remote. Existing local resume and saved commits remain available.',
    );
  if (await ref(cache, resume))
    warnings.push(
      `This machine has local continuation commits for target ${repo.branch}. These may not have been pushed.`,
    );
  return {
    branch,
    continuation: key,
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
  options: { remove?: boolean; unsafeReason?: string } = {},
): Promise<SaveResult[]> {
  const meta = await readWorkspaceMeta(paths, workDir);
  if (options.unsafeReason !== undefined) {
    const results: SaveResult[] = (meta?.repos ?? []).map((repo) => ({
      path: path.join(workDir, repo.path),
      saved: false,
      reason: options.unsafeReason,
    }));
    if (results.length === 0)
      results.push({
        path: workDir,
        saved: false,
        reason: options.unsafeReason,
      });
    if (meta !== undefined)
      await writeWorkspaceMeta(paths, workDir, {
        ...meta,
        recoveryRequired: true,
        recoveryReason: options.unsafeReason,
        endedAt: new Date().toISOString(),
      });
    for (const result of results)
      log(`worktree recovery required: ${result.path}: ${result.reason}`);
    return results;
  }
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
          const resume = `refs/runner/resume/${repo.continuation}`;
          const lock = await lockCache(repo.cache);
          try {
            const previous = await ref(repo.cache, resume);
            if (
              previous === undefined ||
              (await gitOk(
                ['merge-base', '--is-ancestor', previous, head],
                repo.cache,
              ))
            ) {
              await git(['update-ref', resume, head], repo.cache);
            } else {
              const saved = `refs/runner/saved/${repo.continuation}/${randomUUID()}`;
              await git(['update-ref', saved, head], repo.cache);
              log(
                `Divergent local commit saved for manual integration: ${saved} ${head}`,
              );
            }
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
        await git(['worktree', 'prune'], repo.cache);
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
      recoveryReason: results
        .filter((result) => !result.saved)
        .map((result) => result.reason)
        .join('; '),
      endedAt: new Date().toISOString(),
    });
  }
  return results;
}
