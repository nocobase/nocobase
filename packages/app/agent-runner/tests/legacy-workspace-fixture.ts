// Historical layouts are constructed explicitly for cleanup compatibility tests. New workers never create these.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  updateCache,
  readWorkspaceMeta,
  writeWorkspaceMeta,
  type PrepareDirsOptions,
  type PreparedDir,
} from '../src/core/checkout.ts';
import {
  addRunWorktree,
  readContinuationState,
} from '../src/core/run-worktrees.ts';
import { taskGit, taskGitDir } from '../src/core/task-git.ts';

export async function legacyPrepareDirs(
  options: PrepareDirsOptions & { perRun?: boolean },
) {
  const { paths, workDir, appKey, subjectKey } = options;
  await mkdir(workDir, { recursive: true });
  const before = await readContinuationState(paths, appKey, subjectKey);
  await writeWorkspaceMeta(paths, workDir, {
    appKey,
    subjectKey,
    repos: [],
    runAttempt: true,
    runWorktrees: true,
    readOnly: options.readOnly === true,
    lastUsedAt: new Date().toISOString(),
  });
  const dirs: PreparedDir[] = [];
  for (const entry of options.dirs) {
    if (entry.kind !== 'repo')
      throw new Error('Legacy fixture expects repositories');
    const cache = await updateCache(paths, entry.url);
    const tree = await addRunWorktree({
      paths,
      workDir,
      appKey,
      subjectKey,
      runId: options.runId!,
      cache,
      repo: entry,
      readOnly: options.readOnly === true,
      clean: options.clean === true,
    });
    const dir = path.join(workDir, entry.path);
    const context = { dir, cache, url: entry.url };
    const startSha = await taskGit(context, [
      'rev-parse',
      '--verify',
      'HEAD',
    ]).catch(() => '');
    dirs.push({
      kind: 'repo',
      primary: dirs.length === 0,
      dir,
      key: `repo:${entry.path}`,
      fresh: !before?.prepared?.includes(`repo:${entry.path}`),
      repo: {
        ...context,
        branch: entry.branch,
        defaultBranch: entry.defaultBranch,
        localBranch: tree.branch,
        continuation: tree.continuation,
        warnings: tree.warnings,
        startSha,
        deliveryBaseSha: tree.deliveryBaseSha,
        primary: dirs.length === 0,
        gitDir: await taskGitDir(context),
        submodules: [],
      },
    });
  }
  const meta = (await readWorkspaceMeta(paths, workDir))!;
  await writeWorkspaceMeta(paths, workDir, {
    ...meta,
    runAttempt: true,
    runWorktrees: true,
    readOnly: options.readOnly === true,
  });
  return { dirs, release: async () => {} };
}
