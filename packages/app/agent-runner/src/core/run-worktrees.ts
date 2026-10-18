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
  type WorkspaceRepo,
  type CheckedOutRepo,
  subjectWorkDir,
  CheckoutError,
  git,
  gitOk,
} from './checkout.ts';
import { taskGit, taskGitDir, taskGitOk } from './task-git.ts';
import { stopWorkspaceHolders } from './process-tree.ts';
import { TRAILERS_ENV } from './git-hooks.ts';

const identity = (parts: readonly string[]) =>
  createHash('sha256').update(JSON.stringify(parts)).digest('hex');
const COMMIT = [
  '-c',
  'core.fsync=objects,reference',
  '-c',
  'core.fsyncMethod=fsync',
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

/** Read-only attempts remain recognizable without metadata, for diagnostics and disposable-copy cleanup. */
export function runWorkDir(
  paths: RunnerPaths,
  app: string,
  subject: string,
  run: string,
  attempt: number,
  readOnly = false,
): string {
  return subjectWorkDir(
    paths,
    app,
    `${subject}.${readOnly ? 'readonly' : 'run'}-${safeName(run)}-${attempt}-${randomUUID()}`,
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

/** Equality to the original start means no work; delivered history also covers squash-deleted branches. */
async function hasNoPendingCommits(
  cache: string,
  head: string,
  record: WorkspaceRepo | undefined,
): Promise<boolean> {
  return (
    head === record?.startSha ||
    (record?.pushedSha !== undefined &&
      (await gitOk(
        ['merge-base', '--is-ancestor', head, record.pushedSha],
        cache,
      )))
  );
}

async function assertWorktreeIdentity(
  context: { dir: string; cache: string; url: string },
  localBranch: string,
  allowBranchChange = false,
): Promise<void> {
  const gitDir = await taskGitDir(context);
  await taskGit(context, ['status', '--porcelain']);
  if (
    (await taskGit(context, ['diff', '--name-only', '--diff-filter=U'])) !==
      '' ||
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
  if ((await taskGit(context, ['submodule', 'status', '--recursive'])) !== '')
    throw new CheckoutError(
      'Initialized submodules require recovery in the original worktree; their objects are not saved by a parent commit',
    );
  if (
    !allowBranchChange &&
    (await taskGit(context, ['symbolic-ref', '--short', 'HEAD'])) !==
      localBranch
  )
    throw new CheckoutError(
      'The agent changed the local branch; keep the worktree for recovery',
    );
}

/** Called under the cache lock after removing the worktree. Only this attempt's published alias is disposable. */
export async function deletePublishedRunBranch(
  cache: string,
  branch: string | undefined,
  expected: string,
): Promise<void> {
  if (branch !== expected || !branch.startsWith('runner-run-')) return;
  const name = `refs/heads/${branch}`;
  const head = await ref(cache, name);
  if (head === undefined) return;
  if (
    (await git(['worktree', 'list', '--porcelain'], cache))
      .split('\n')
      .includes(`branch ${name}`)
  )
    return;
  // Continuation refs are local preservation, not evidence of a push. No origin refs means retain the branch.
  if (
    (await git(
      ['rev-list', '--count', head, '--not', '--remotes=origin'],
      cache,
    )) === '0'
  )
    await git(['update-ref', '-d', name, head], cache);
}

/** The runner's removal marker plus local pushed evidence; never infer safety from a broken checkout alone. */
export async function canRetryWorkspaceRemoval(
  paths: RunnerPaths,
  workDir: string,
  meta: WorkspaceMeta,
): Promise<boolean> {
  if (
    !isInside(paths.workRoot, workDir) ||
    meta.runWorktrees !== true ||
    meta.repos.length === 0 ||
    (meta.recoveryRequired === true &&
      (!/git worktree remove [^\n]* failed/u.test(meta.recoveryReason ?? '') ||
        meta.repos.some((repo) => !repo.pushedSha)))
  )
    return false;
  for (const repo of meta.repos) {
    if (
      repo.removing !== true ||
      repo.localBranch !== runBranch(workDir, repo.path) ||
      repo.continuation !==
        continuationKey(
          meta.appKey ?? '',
          meta.subjectKey,
          repo.url,
          repo.branch,
        )
    )
      return false;
    try {
      if (meta.readOnly !== true) {
        if (
          repo.pushedSha === undefined ||
          !(await gitOk(
            ['cat-file', '-e', `${repo.pushedSha}^{commit}`],
            repo.cache,
          ))
        )
          return false;
        const head = await ref(repo.cache, `refs/heads/${repo.localBranch}`);
        if (
          head !== undefined &&
          !(await gitOk(
            ['merge-base', '--is-ancestor', head, repo.pushedSha],
            repo.cache,
          ))
        )
          return false;
        // Saving and pushing preceded the removal marker. A partial removal is not new work.
      }
    } catch {
      return false;
    }
  }
  return true;
}

/** Finish only already-authorized removal, under the actual attempt lock. False means retained or pending. */
export async function retryWorkspaceRemoval(
  paths: RunnerPaths,
  workDir: string,
  log: (message: string) => void,
  lockHeld = false,
): Promise<boolean> {
  if (!isInside(paths.workRoot, workDir)) return false;
  const lock = lockHeld
    ? undefined
    : await acquireLock(`${workDir}.lock`, { timeoutMs: 0 }).catch(
        () => undefined,
      );
  if (!lockHeld && lock === undefined) return false;
  try {
    const meta = await readWorkspaceMeta(paths, workDir);
    if (
      meta === undefined ||
      !meta.repos.some((repo) => repo.removing === true)
    )
      return false;
    if (!(await canRetryWorkspaceRemoval(paths, workDir, meta))) {
      if (meta.recoveryRequired === true) return false;
      const reason =
        'Removal candidate is not verified clean and pushed; retain it for recovery.';
      await writeWorkspaceMeta(paths, workDir, {
        ...meta,
        recoveryRequired: true,
        recoveryReason: reason,
      });
      log(`worktree recovery required: ${workDir}: ${reason}`);
      return false;
    }
    try {
      await stopWorkspaceHolders(workDir);
      if (!(await canRetryWorkspaceRemoval(paths, workDir, meta))) {
        await writeWorkspaceMeta(paths, workDir, {
          ...meta,
          recoveryRequired: true,
          recoveryReason:
            'Work changed while stopping processes; retain it for recovery.',
        });
        return false;
      }
      for (const repo of meta.repos) {
        const cacheLock = await lockCache(repo.cache);
        try {
          await rm(path.join(workDir, repo.path), {
            recursive: true,
            force: true,
          });
          await git(['worktree', 'prune'], repo.cache);
          await deletePublishedRunBranch(
            repo.cache,
            repo.localBranch,
            runBranch(workDir, repo.path),
          );
        } finally {
          await cacheLock.release();
        }
      }
      await rm(workDir, { recursive: true, force: true });
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
      await rm(workspaceRecordPath(paths, workDir), { force: true });
      log(`workspace: finished deferred removal of ${workDir}`);
      return true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      await writeWorkspaceMeta(paths, workDir, {
        ...meta,
        recoveryRequired: false,
        recoveryReason: reason,
      });
      log(`workspace: removal deferred for ${workDir}: ${reason}`);
      return false;
    }
  } finally {
    await lock?.release();
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
  warnings: string[];
  deliveryBaseSha?: string;
  pushedSha?: string;
}> {
  const { paths, workDir, appKey, subjectKey, cache, repo } = options;
  const dir = path.resolve(workDir, repo.path);
  const branch = runBranch(workDir, repo.path);
  const key = continuationKey(appKey, subjectKey, repo.url, repo.branch);
  const warnings: string[] = [];
  const state = await readContinuationState(paths, appKey, subjectKey);
  let record = state?.repos.find((item) => item.continuation === key);
  for (const previous of state?.activeWorkDirs ?? []) {
    await retryWorkspaceRemoval(paths, previous, () => {});
    const record = await readWorkspaceMeta(paths, previous);
    if (record?.recoveryRequired === true)
      warnings.push(
        options.readOnly
          ? `Recovery work remains in ${previous}; this run's checkout does not contain its pending changes. You may continue this read-only run.`
          : `Recovery work remains in ${previous}${record.recoveryReason ? `: ${record.recoveryReason}` : ''}. Resolve or recover it before continuing; this run's checkout cannot represent its unresolved index or uncommitted files.`,
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
          ...(record?.startSha === undefined
            ? {}
            : { startSha: record.startSha }),
          ...(record?.pushedSha === undefined
            ? {}
            : { pushedSha: record.pushedSha }),
        },
      ],
    };
  });
  const resume = `refs/runner/resume/${key}`;
  const lock = await lockCache(cache);
  try {
    const remote = await ref(cache, `refs/remotes/origin/${repo.branch}`);
    let local = await ref(cache, resume);
    if (
      !options.readOnly &&
      !options.clean &&
      local &&
      !remote &&
      ((await hasNoPendingCommits(cache, local, record)) ||
        (await gitOk(
          [
            'merge-base',
            '--is-ancestor',
            local,
            `refs/remotes/origin/${repo.defaultBranch}`,
          ],
          cache,
        )))
    ) {
      await git(['update-ref', '-d', resume, local], cache);
      local = undefined;
      record = undefined;
    }
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
    if (!options.readOnly && !options.clean) {
      // An unknown historical resume retains unknown provenance until this run adds work.
      record = {
        url: repo.url,
        path: key,
        cache,
        branch: repo.branch,
        continuation: key,
        ...(local === undefined
          ? { startSha: base ?? '' }
          : record?.startSha === undefined
            ? {}
            : { startSha: record.startSha }),
        ...(remote !== undefined
          ? { pushedSha: remote }
          : record?.pushedSha === undefined
            ? {}
            : { pushedSha: record.pushedSha }),
      };
      await updateContinuationState(paths, appKey, subjectKey, (state) => ({
        ...state,
        repos: state.repos.map((item) =>
          item.continuation === key ? record! : item,
        ),
      }));
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
          [
            ...COMMIT,
            '-c',
            'user.name=NocoBase runner',
            '-c',
            'user.email=runner@nocobase.local',
            'commit-tree',
            tree,
            '-m',
            'Worktree bootstrap',
          ],
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
    ...(record?.pushedSha === undefined ? {} : { pushedSha: record.pushedSha }),
    ...((record?.pushedSha ?? record?.startSha) === undefined
      ? {}
      : { deliveryBaseSha: record?.pushedSha ?? record?.startSha }),
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
  options: {
    remove?: boolean;
    unsafeReason?: string;
    repos?: readonly CheckedOutRepo[];
  } = {},
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
    // A read-only attempt without repositories holds nothing to save either.
    if (
      options.remove !== false &&
      meta?.readOnly === true &&
      meta.runAttempt === true
    ) {
      await rm(workDir, { recursive: true, force: true });
      await rm(workspaceRecordPath(paths, workDir), { force: true });
      log(`workspace: removed ${workDir}`);
    }
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
  if (
    options.remove !== false &&
    (await canRetryWorkspaceRemoval(paths, workDir, meta))
  ) {
    await retryWorkspaceRemoval(paths, workDir, log, true);
    return meta.repos.map((repo) => ({
      path: path.join(workDir, repo.path),
      saved: true,
    }));
  }
  const results: SaveResult[] = [];
  for (const repo of meta.repos) {
    const dir = path.join(workDir, repo.path);
    if (!existsSync(dir)) continue;
    const context = { dir, cache: repo.cache, url: repo.url };
    try {
      await taskGitDir(context);
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
      // Saved before an interrupted removal: committing now would record its half-deleted files.
      if (repo.removing === true) {
        if (
          !(await canRetryWorkspaceRemoval(paths, workDir, {
            ...meta,
            repos: [repo],
          }))
        )
          throw new CheckoutError(
            'Removal evidence no longer matches the checkout; keep the worktree for recovery',
          );
        results.push({ path: dir, saved: true });
      } else if (meta.readOnly !== true) {
        await assertWorktreeIdentity(context, repo.localBranch, true);
        await taskGit(context, ['add', '--all']);
        if (!(await taskGitOk(context, ['diff', '--cached', '--quiet']))) {
          const name = await taskGit(context, [
            'config',
            '--get',
            'user.name',
          ]).catch(() => '');
          const email = await taskGit(context, [
            'config',
            '--get',
            'user.email',
          ]).catch(() => '');
          if (
            !name ||
            !email ||
            /[<>\r\n\0]/u.test(name) ||
            /[<>\s\0]/u.test(email)
          )
            throw new CheckoutError(
              'Cannot save local work: configure valid user.name and user.email in this checkout; no continuation commit was created. The original worktree is retained for recovery.',
            );
          const files = (
            await taskGit(context, ['diff', '--cached', '--name-only', '-z'])
          )
            .split('\0')
            .filter(Boolean);
          const first = (files[0] ?? 'files')
            .replace(/[\r\n\t]/gu, ' ')
            .slice(0, 60);
          const title = `Update ${first}${files.length > 1 ? ` and ${files.length - 1} other ${files.length === 2 ? 'file' : 'files'}` : ''}`;
          await taskGit(
            context,
            [
              ...COMMIT,
              'commit',
              '-m',
              title,
              '-m',
              'Save work in progress when the run is interrupted or ends.',
            ],
            {
              GIT_AUTHOR_NAME: name,
              GIT_AUTHOR_EMAIL: email,
              GIT_COMMITTER_NAME: name,
              GIT_COMMITTER_EMAIL: email,
              [TRAILERS_ENV]: '',
            },
          );
        }
        const head = await taskGit(context, ['rev-parse', 'HEAD']).catch(
          () => undefined,
        );
        if (head !== undefined) {
          const currentBranch = await taskGit(context, [
            'symbolic-ref',
            '--quiet',
            '--short',
            'HEAD',
          ]).catch(() => undefined);
          const resume = `refs/runner/resume/${repo.continuation}`;
          const lock = await lockCache(repo.cache);
          try {
            const previous = await ref(repo.cache, resume);
            const reported = options.repos?.find((item) => item.dir === dir);
            const continuation = (
              await readContinuationState(
                paths,
                meta.appKey ?? '',
                meta.subjectKey,
              )
            )?.repos.find((item) => item.continuation === repo.continuation);
            const discard =
              reported?.remoteMissing === true &&
              ((await hasNoPendingCommits(repo.cache, head, continuation)) ||
                (await gitOk(
                  [
                    'merge-base',
                    '--is-ancestor',
                    head,
                    `refs/remotes/origin/${reported.defaultBranch}`,
                  ],
                  repo.cache,
                )));
            if (
              currentBranch !== undefined &&
              currentBranch !== repo.localBranch
            ) {
              // Its own branch ref preserves the head; it is not a continuation of the initial target.
              log(`Run ended on branch ${currentBranch} at ${head}`);
            } else if (
              currentBranch === undefined &&
              // The run's own alias is not evidence: its commits continue this target.
              (await git(
                [
                  'rev-list',
                  '--count',
                  head,
                  '--not',
                  `--exclude=${repo.localBranch}`,
                  '--branches',
                  '--remotes',
                ],
                repo.cache,
              )) === '0'
            ) {
              log(
                `Run ended on a detached HEAD already reachable from a branch: ${head}`,
              );
            } else if (
              currentBranch === repo.localBranch &&
              discard &&
              (previous === undefined ||
                (await gitOk(
                  ['merge-base', '--is-ancestor', previous, head],
                  repo.cache,
                )))
            ) {
              if (previous !== undefined)
                await git(['update-ref', '-d', resume, previous], repo.cache);
              await updateContinuationState(
                paths,
                meta.appKey ?? '',
                meta.subjectKey,
                (state) => ({
                  ...state,
                  repos: state.repos.map((item) => {
                    if (item.continuation !== repo.continuation) return item;
                    const identity = { ...item };
                    delete identity.startSha;
                    delete identity.pushedSha;
                    return identity;
                  }),
                }),
              );
            } else if (
              currentBranch === repo.localBranch &&
              previous === undefined &&
              head === repo.startSha
            ) {
              // Do not create a resume for an untouched checkout (including one cleared during preparation).
            } else if (
              currentBranch === repo.localBranch &&
              (previous === undefined ||
                (await gitOk(
                  ['merge-base', '--is-ancestor', previous, head],
                  repo.cache,
                )))
            ) {
              await git(['update-ref', resume, head], repo.cache);
              if (
                continuation?.startSha === undefined &&
                repo.startSha !== undefined &&
                head !== repo.startSha
              )
                await updateContinuationState(
                  paths,
                  meta.appKey ?? '',
                  meta.subjectKey,
                  (state) => ({
                    ...state,
                    repos: state.repos.map((item) =>
                      item.continuation === repo.continuation &&
                      item.startSha === undefined
                        ? { ...item, startSha: repo.startSha }
                        : item,
                    ),
                  }),
                );
            } else {
              const saved = `refs/runner/saved/${repo.continuation}/${randomUUID()}`;
              await git(['update-ref', saved, head], repo.cache);
              log(
                `Local commit saved for manual integration: ${saved} ${head}`,
              );
            }
          } finally {
            await lock.release();
          }
          results.push({ path: dir, saved: true, head });
        } else results.push({ path: dir, saved: true });
      } else {
        await taskGit(context, ['status', '--porcelain']);
        results.push({ path: dir, saved: true });
      }
      if (options.remove === false) continue;
      const current = (await readWorkspaceMeta(paths, workDir)) ?? meta;
      await writeWorkspaceMeta(paths, workDir, {
        ...current,
        repos: current.repos.map((item) =>
          item.path === repo.path ? { ...item, removing: true } : item,
        ),
      });
      const lock = await lockCache(repo.cache);
      try {
        // Validate the backlink again before Git removes anything. Never prune unrelated worktree metadata.
        await taskGitDir(context);
        // Git refuses to remove a populated submodule worktree. A validated read-only checkout has no work to save.
        if (meta.readOnly === true && existsSync(path.join(dir, '.gitmodules')))
          await rm(dir, { recursive: true, force: true });
        await git(['worktree', 'remove', '--force', dir], repo.cache);
        await deletePublishedRunBranch(
          repo.cache,
          repo.localBranch,
          runBranch(workDir, repo.path),
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
      log(`worktree finalization failed: ${dir}: ${reason}`);
    }
  }
  if (results.every((result) => result.saved) && options.remove !== false) {
    try {
      await rm(workDir, { recursive: true, force: true });
      log(`workspace: removed ${workDir}`);
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
      await rm(workspaceRecordPath(paths, workDir), { force: true });
    } catch (error) {
      results.push({
        path: workDir,
        saved: false,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  if (results.some((result) => !result.saved)) {
    const current = (await readWorkspaceMeta(paths, workDir)) ?? meta;
    const deletionOnly = await canRetryWorkspaceRemoval(
      paths,
      workDir,
      current,
    );
    await writeWorkspaceMeta(paths, workDir, {
      // Fresh: keeps the `removing` marks written above.
      ...current,
      recoveryRequired: !deletionOnly,
      recoveryReason: results
        .filter((result) => !result.saved)
        .map((result) => result.reason)
        .join('; '),
      endedAt: new Date().toISOString(),
    });
    if (deletionOnly) {
      log(
        `workspace: removal deferred for ${workDir}: ${results
          .filter((result) => !result.saved)
          .map((result) => result.reason)
          .join('; ')}`,
      );
      for (const [index, result] of results.entries())
        if (!result.saved) results[index] = { ...result, saved: true };
    }
  }
  return results;
}
