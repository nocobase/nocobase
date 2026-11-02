import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import {
  prepareDirs,
  markDirsPrepared,
  markWorkspaceEnded,
  checkWorkspaceGit,
  readWorkspaceMeta,
  reportRepos,
  subjectWorkDir,
  writeWorkspaceMeta,
} from '../src/core/checkout.ts';
import {
  registerWorkspaceUse,
  workspaceInUse,
} from '../src/core/workspace-use.ts';
import {
  preparationCurrent,
  preparationHash,
} from '../src/core/preparation.ts';
import { cleanArtifacts } from '../src/core/artifacts.ts';
import { scanWorkspaces } from '../src/core/workspaces.ts';
import {
  DEFAULT_ARTIFACT_TTL_MS,
  DEFAULT_ARTIFACT_PATTERNS,
} from '../src/lib/config.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { git, makeRemote, removeDir, tempDir } from './helpers.ts';

let root: string;
beforeEach(() => {
  root = tempDir('fixed-workspace-');
});
afterEach(() => removeDir(root));

it('reuses one worktree and dependencies concurrently, preserves branch and dirty merge state, and reports without pushing', async () => {
  const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
  const remote = makeRemote(root);
  const workDir = subjectWorkDir(paths, 'app', 'task');
  const options = {
    paths,
    appKey: 'app',
    subjectKey: 'task',
    workDir,
    runId: 'one',
    dirs: [
      {
        kind: 'repo' as const,
        path: 'repo',
        url: remote,
        branch: 'agent/task',
        defaultBranch: 'main',
        initPrompt: 'Install dependencies',
      },
    ],
  };
  const first = await prepareDirs(options);
  const dir = first.dirs[0]!;
  expect(dir.fresh).toBe(true);
  writeFileSync(path.join(dir.dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9');
  // A changed lockfile cannot be confirmed using the hash captured before initialization.
  await markDirsPrepared(paths, workDir, first.dirs);
  const second = await prepareDirs({
    ...options,
    runId: 'two',
    readOnly: true,
  });
  expect(second.dirs[0]!.fresh).toBe(true);
  await markDirsPrepared(paths, workDir, second.dirs);
  const changedPrompt = await prepareDirs({
    ...options,
    dirs: [
      {
        ...options.dirs[0]!,
        initPrompt: 'Changed initialization instructions',
      },
    ],
  });
  expect(changedPrompt.dirs[0]!.fresh).toBe(true);
  await changedPrompt.release();
  mkdirSync(path.join(dir.dir, 'node_modules'));
  writeFileSync(path.join(dir.dir, 'node_modules', 'marker'), 'retained');
  git(['checkout', '-b', 'fix/current'], dir.dir);
  writeFileSync(path.join(dir.dir, 'unfinished'), 'work');
  writeFileSync(
    path.join(dir.repo!.gitDir, 'MERGE_HEAD'),
    git(['rev-parse', 'HEAD'], dir.dir),
  );
  const third = await prepareDirs({ ...options, runId: 'three' });
  expect(third.dirs[0]!.dir).toBe(dir.dir);
  expect(third.dirs[0]!.fresh).toBe(false);
  expect(
    readFileSync(path.join(dir.dir, 'node_modules', 'marker'), 'utf8'),
  ).toBe('retained');
  expect(git(['symbolic-ref', '--short', 'HEAD'], dir.dir)).toBe('fix/current');
  expect(third.dirs[0]!.repo!.warnings!.join(' ')).toContain('MERGE_HEAD');
  expect((await reportRepos([dir.repo!], { push: true }))[0]).toMatchObject({
    pushed: false,
    branch: 'fix/current',
  });
  expect(
    git(
      ['for-each-ref', '--format=%(refname)', 'refs/heads/agent/task'],
      remote.slice('file://'.length),
    ),
  ).toBe('');
  rmSync(path.join(dir.repo!.gitDir, 'MERGE_HEAD'));
  writeFileSync(path.join(dir.dir, '.gitignore'), 'node_modules/\n');
  git(['add', '.'], dir.dir);
  git(['commit', '-m', 'Publish shared work'], dir.dir);
  git(['push', 'origin', 'fix/current'], dir.dir);
  const published = await reportRepos([dir.repo!], { push: false });
  expect(published[0]).toMatchObject({ branch: 'fix/current', pushed: true });
  await markWorkspaceEnded(paths, workDir, published);
  expect(
    (
      await checkWorkspaceGit(
        workDir,
        (await readWorkspaceMeta(paths, workDir))!,
      )
    ).reason,
  ).toBe('allowed');
  await Promise.all([first.release(), second.release(), third.release()]);
});

it('protects shared directory users and invalidates initialization at the 24-hour artifact boundary', async () => {
  expect(DEFAULT_ARTIFACT_TTL_MS).toBe(24 * 60 * 60_000);
  const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
  const workDir = subjectWorkDir(paths, 'app', 'task');
  const repoDir = path.join(workDir, 'repo');
  const prepared = await prepareDirs({
    paths,
    workDir,
    appKey: 'app',
    subjectKey: 'task',
    dirs: [
      {
        kind: 'repo',
        path: 'repo',
        url: makeRemote(root),
        branch: 'agent/task',
        defaultBranch: 'main',
      },
    ],
  });
  await markDirsPrepared(paths, workDir, prepared.dirs);
  await prepared.release();
  mkdirSync(path.join(repoDir, 'node_modules'));
  const now = Date.now();
  const usedAt = new Date(now - DEFAULT_ARTIFACT_TTL_MS).toISOString();
  await writeWorkspaceMeta(paths, workDir, {
    ...(await readWorkspaceMeta(paths, workDir))!,
    lastUsedAt: usedAt,
  });
  const clean = async (at: number) =>
    cleanArtifacts(await scanWorkspaces(paths), {
      paths,
      now: at,
      ttlMs: DEFAULT_ARTIFACT_TTL_MS,
      patterns: DEFAULT_ARTIFACT_PATTERNS,
    });
  expect(await clean(now - 1)).toEqual([]);
  const releaseA = await registerWorkspaceUse(paths, workDir, 'a');
  const releaseB = await registerWorkspaceUse(paths, workDir, 'b');
  expect(await workspaceInUse(paths, workDir)).toBe(true);
  expect(await clean(now)).toEqual([]);
  await releaseA();
  expect(await clean(now)).toEqual([]);
  await releaseB();
  const registry = path.join(
    paths.home,
    'workspace-users',
    createHash('sha256').update(workDir).digest('hex'),
  );
  writeFileSync(
    path.join(registry, '999999999-stale.json'),
    JSON.stringify({ runId: 'dead', pid: 999999999 }),
  );
  expect(await workspaceInUse(paths, workDir)).toBe(false);
  expect(existsSync(path.join(registry, '999999999-stale.json'))).toBe(false);
  expect(await clean(now)).toEqual([workDir]);
  expect(existsSync(path.join(repoDir, 'node_modules'))).toBe(false);
  expect(
    await preparationCurrent(paths, repoDir, await preparationHash(repoDir)),
  ).toBe(false);
});
