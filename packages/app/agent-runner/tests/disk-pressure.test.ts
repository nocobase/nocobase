import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  acquireLock,
  checkout,
  reportRepos,
  writeWorkspaceMeta,
} from '../src/core/checkout.ts';
import { runWorkDir } from '../src/core/run-worktrees.ts';
import { collectWorkspaces } from '../src/core/workspaces.ts';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import { isDiskFull } from '../src/lib/disk-full.ts';
import { stepFailure } from '../src/agent/prepare/index.ts';
import { makeRemote, removeDir, tempDir, git } from './helpers.ts';

describe('disk pressure', () => {
  let root: string;
  let paths: RunnerPaths;
  let remote: string;
  beforeEach(() => {
    root = tempDir();
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    remote = makeRemote(root);
  });
  afterEach(() => removeDir(root));
  const workspace = async (key: string, age: number) => {
    const prepared = await checkout({
      paths,
      appKey: 'app',
      subjectKey: key,
      runId: key,
      dirs: [
        {
          kind: 'repo',
          url: remote,
          defaultBranch: 'main',
          branch: `agent/${key}`,
          path: 'repo',
        },
      ],
    });
    await reportRepos(prepared.repos, { push: true });
    await prepared.release();
    const { readWorkspaceMeta } = await import('../src/core/checkout.ts');
    const meta = (await readWorkspaceMeta(paths, prepared.workDir))!;
    await writeWorkspaceMeta(paths, prepared.workDir, {
      ...meta,
      lastUsedAt: new Date(Date.now() - age).toISOString(),
    });
    return prepared.workDir;
  };
  const artifacts = { ttlMs: 0, patterns: ['node_modules', '.next'] };
  const threshold = { bytes: 100 };

  it('cleans artifacts in LRU order without waiting for TTL, then stops as soon as space recovers', async () => {
    const older = await workspace('old', 1000);
    const newer = await workspace('new', 0);
    for (const dir of [older, newer])
      mkdirSync(path.join(dir, 'repo/node_modules'), { recursive: true });
    const result = await collectWorkspaces({
      paths,
      artifacts,
      threshold,
      readDisk: async () => ({
        totalBytes: 1000,
        freeBytes: existsSync(path.join(older, 'repo/node_modules')) ? 0 : 100,
      }),
    });
    expect(result.artifactsCleaned).toEqual([older]);
    expect(result.removed).toEqual([]);
    expect(result.low).toBe(false);
    expect(existsSync(path.join(newer, 'repo/node_modules'))).toBe(true);
  });

  it('removes clean pushed work after artifacts, retains dirty, unpushed and running work, and only then removes broken read-only copies', async () => {
    const clean = await workspace('clean', 4000);
    const dirty = await workspace('dirty', 3000);
    const unpushed = await workspace('unpushed', 2000);
    const running = await workspace('running', 1000);
    mkdirSync(path.join(clean, 'repo/node_modules'), { recursive: true });
    writeFileSync(path.join(dirty, 'repo/draft'), 'keep');
    writeFileSync(path.join(unpushed, 'repo/change'), 'keep');
    git(['add', 'change'], path.join(unpushed, 'repo'));
    git(
      [
        '-c',
        'user.name=A',
        '-c',
        'user.email=a@example.com',
        '-c',
        'commit.gpgsign=false',
        'commit',
        '-m',
        'local',
      ],
      path.join(unpushed, 'repo'),
    );
    const broken = path.join(paths.workRoot, 'app', 'broken.readonly-agent');
    mkdirSync(broken, { recursive: true });
    const lock = await acquireLock(`${running}.lock`, { timeoutMs: 0 });
    const logs: string[] = [];
    try {
      const result = await collectWorkspaces({
        paths,
        artifacts,
        threshold,
        log: (line) => logs.push(line),
        readDisk: async () => ({ totalBytes: 1000, freeBytes: 0 }),
      });
      expect(result.removed.map((item) => item.workDir)).toEqual([
        clean,
        broken,
      ]);
      expect(
        logs.findIndex((line) => line.includes('regenerable')),
      ).toBeLessThan(
        logs.findIndex((line) => line.includes(`removed ${clean}`)),
      );
      for (const kept of [dirty, unpushed, running])
        expect(existsSync(kept)).toBe(true);
      expect(result.low).toBe(true);
    } finally {
      await lock.release();
    }
  });

  it('protects locked attempt directories and continuation refs, and cleans disposable attempts last', async () => {
    const clean = await workspace('clean-attempt-order', 1000);
    const disposable = path.join(paths.workRoot, 'app', 'task.run-readonly-1');
    const active = path.join(paths.workRoot, 'app', 'task.run-active-1');
    const continuation = path.join(
      paths.workRoot,
      'app',
      'task.continuations-state',
    );
    for (const dir of [disposable, active, continuation]) {
      mkdirSync(path.join(dir, 'node_modules'), { recursive: true });
      await writeWorkspaceMeta(paths, dir, {
        appKey: 'app',
        subjectKey: 'task',
        repos: [],
        lastUsedAt: new Date(0).toISOString(),
        ...(dir === continuation
          ? { continuationOnly: true, activeWorkDirs: [active] }
          : { runAttempt: true, runWorktrees: true, readOnly: true }),
      });
    }
    const lock = await acquireLock(`${active}.lock`, { timeoutMs: 0 });
    try {
      const result = await collectWorkspaces({
        paths,
        artifacts,
        threshold,
        readDisk: async () => ({ totalBytes: 1000, freeBytes: 0 }),
      });
      expect(result.removed.map((entry) => entry.workDir)).toEqual([
        clean,
        disposable,
      ]);
      expect(existsSync(path.join(active, 'node_modules'))).toBe(true);
      expect(existsSync(continuation)).toBe(true);
    } finally {
      await lock.release();
    }
  });

  it('recognizes a broken read-only attempt without metadata or valid Git', async () => {
    const dir = runWorkDir(paths, 'app', 'task', 'broken', 1, true);
    mkdirSync(dir, { recursive: true });
    const result = await collectWorkspaces({
      paths,
      artifacts,
      threshold,
      readDisk: async () => ({ totalBytes: 1000, freeBytes: 0 }),
    });
    expect(result.removed.map((entry) => entry.workDir)).toEqual([dir]);
    expect(existsSync(dir)).toBe(false);
  });

  it('protects tracked files matching artifact patterns and reports a real directory size', async () => {
    const dir = await workspace('tracked', 0);
    mkdirSync(path.join(dir, 'repo/.next'), { recursive: true });
    writeFileSync(path.join(dir, 'repo/.next/source'), 'keep');
    git(['add', '-f', '.next/source'], path.join(dir, 'repo'));
    const result = await collectWorkspaces({
      paths,
      artifacts,
      threshold,
      readDisk: async () => ({ totalBytes: 1000, freeBytes: 0 }),
    });
    expect(existsSync(path.join(dir, 'repo/.next/source'))).toBe(true);
    expect(result.entries[0]?.sizeBytes).toBeGreaterThan(0);
  });
});

it('classifies ENOSPC in wrapped preparation, spawn and failed tool errors only', () => {
  const error = new Error('write failed', {
    cause: Object.assign(new Error('disk'), { code: 'ENOSPC' }),
  });
  expect(isDiskFull(error)).toBe(true);
  expect(stepFailure({ failure: 'setupFailed' }, error, [])).toBe(
    'runnerDiskFull',
  );
  expect(isDiskFull({ stderr: 'No space left on device' })).toBe(true);
  expect(isDiskFull(new Error('permission denied'))).toBe(false);
});
