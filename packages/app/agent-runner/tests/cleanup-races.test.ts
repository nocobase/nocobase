import { existsSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import { cleanArtifacts } from '../src/core/artifacts.ts';
import {
  removeWorkspace,
  taskWorkDir,
  subjectWorkDir,
  writeWorkspaceMeta,
  workspaceRecordPath,
  cleanWorkspace,
  acquireLock,
} from '../src/core/checkout.ts';
import { taskSessionRoot } from '../src/core/run-worktrees.ts';
import {
  registerWorkspaceUse,
  workspaceInUse,
  waitForWorkspaceCleanup,
} from '../src/core/workspace-use.ts';
import { Supervisor, type SupervisedRun } from '../src/core/supervisor.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import { removePlanned, scanWorkspaces } from '../src/core/workspaces.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { tempDir, removeDir } from './helpers.ts';

let root: string;
beforeEach(() => {
  root = tempDir('cleanup-race-');
});
afterEach(() => {
  vi.restoreAllMocks();
  removeDir(root);
});

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, readFile: vi.fn(actual.readFile), rm: vi.fn(actual.rm) };
});

it('registers supervisor startup before spawning, and retains that registration until worker exit', async () => {
  const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
  const payload = new FakeServer().enqueue({
    subject: { key: 'task', url: 'http://app.test/task' },
  }).payload;
  const workDir = taskWorkDir(paths, 'app', 'task');
  const supervisor = new Supervisor({
    paths,
    timings: {},
    clientFor: () => undefined,
    log: () => {},
  });
  const exit = Promise.withResolvers<void>();
  vi.spyOn(
    supervisor as unknown as { start: () => Promise<SupervisedRun> },
    'start',
  ).mockImplementation(async () => {
    expect(await workspaceInUse(paths, workDir)).toBe(true);
    return { exited: exit.promise } as SupervisedRun;
  });
  await supervisor.spawn('app', payload);
  expect(await workspaceInUse(paths, workDir)).toBe(true);
  exit.resolve();
  await waitFor(async () => !(await workspaceInUse(paths, workDir)), 1000);
});

it('keeps startup registration visible after creating a directory under a symlinked work root', async () => {
  const real = path.join(root, 'real');
  mkdirSync(real);
  symlinkSync(real, path.join(root, 'alias'));
  const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'alias'));
  const workDir = taskWorkDir(paths, 'app', 'task');
  const release = await registerWorkspaceUse(paths, workDir, 'starting');
  mkdirSync(workDir, { recursive: true });
  expect(await workspaceInUse(paths, workDir)).toBe(true);
  expect(await workspaceInUse(paths, path.join(real, 'app', 'task.task'))).toBe(
    true,
  );
  await release();
});

it.each(['manual', 'reset'] as const)(
  '%s cleanup retains a directory when a run registers after the first check',
  async (kind) => {
    const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    const workDir = taskWorkDir(paths, 'app', 'task');
    mkdirSync(path.join(workDir, 'node_modules'), { recursive: true });
    await writeWorkspaceMeta(paths, workDir, {
      appKey: 'app',
      subjectKey: 'task',
      repos: [],
      lastUsedAt: new Date(0).toISOString(),
    });
    const entry = (await scanWorkspaces(paths))[0]!;
    const actual =
      await vi.importActual<typeof import('node:fs/promises')>(
        'node:fs/promises',
      );
    let release: (() => Promise<void>) | undefined;
    vi.spyOn(fs, 'readFile').mockImplementation(async (file, ...args) => {
      if (String(file) === workspaceRecordPath(paths, workDir) && !release)
        release = await registerWorkspaceUse(paths, workDir, 'late');
      return actual.readFile(file, ...args);
    });
    try {
      if (kind === 'reset')
        await expect(cleanWorkspace(paths, workDir)).rejects.toThrow('in use');
      else
        await expect(
          removePlanned(paths, { ...entry, status: 'ended' }),
        ).rejects.toThrow('in use');
      expect(existsSync(path.join(workDir, 'node_modules'))).toBe(true);
    } finally {
      await release?.();
    }
  },
);

it('startup observes an existing cleanup without taking an exclusive run lock', async () => {
  const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
  const workDir = taskWorkDir(paths, 'app', 'task');
  const cleanup = await acquireLock(`${workDir}.lock`);
  const releaseA = await registerWorkspaceUse(paths, workDir, 'a');
  const releaseB = await registerWorkspaceUse(paths, workDir, 'b');
  let entered = false;
  const ready = waitForWorkspaceCleanup(workDir).then(() => {
    entered = true;
  });
  expect(await workspaceInUse(paths, workDir)).toBe(true);
  expect(entered).toBe(false);
  await cleanup.release();
  await ready;
  expect(entered).toBe(true);
  await Promise.all([releaseA(), releaseB()]);
});

it.each(['manual', 'reset'] as const)(
  'startup cannot enter %s cleanup already at its deletion boundary',
  async (kind) => {
    const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    const workDir = taskWorkDir(paths, 'app', 'task');
    mkdirSync(path.join(workDir, 'node_modules'), { recursive: true });
    await writeWorkspaceMeta(paths, workDir, {
      appKey: 'app',
      subjectKey: 'task',
      repos: [],
      lastUsedAt: new Date(0).toISOString(),
    });
    const entry = (await scanWorkspaces(paths))[0]!;
    const atDelete = Promise.withResolvers<void>();
    const continueDelete = Promise.withResolvers<void>();
    const actual =
      await vi.importActual<typeof import('node:fs/promises')>(
        'node:fs/promises',
      );
    vi.spyOn(fs, 'rm').mockImplementation(async (file, ...args) => {
      if (String(file) === workDir) {
        atDelete.resolve();
        await continueDelete.promise;
      }
      return actual.rm(file, ...args);
    });
    const cleaning =
      kind === 'manual'
        ? removePlanned(paths, { ...entry, status: 'ended' })
        : cleanWorkspace(paths, workDir);
    await atDelete.promise;
    const release = await registerWorkspaceUse(paths, workDir, 'starting');
    let entered = false;
    const starting = waitForWorkspaceCleanup(workDir).then(() => {
      entered = true;
    });
    try {
      expect(await workspaceInUse(paths, workDir)).toBe(true);
      expect(entered).toBe(false);
      continueDelete.resolve();
      await cleaning;
      await starting;
      expect(entered).toBe(true);
    } finally {
      continueDelete.resolve();
      await release();
    }
  },
);

it('reset ignores its own pending startup registration but refuses other users', async () => {
  const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
  const workDir = taskWorkDir(paths, 'app', 'task');
  const release = await registerWorkspaceUse(paths, workDir, 'resetting');
  const other = await registerWorkspaceUse(paths, workDir, 'other');
  await expect(cleanWorkspace(paths, workDir, 'resetting')).rejects.toThrow(
    'in use',
  );
  await other();
  await cleanWorkspace(paths, workDir, 'resetting');
  expect(await workspaceInUse(paths, workDir)).toBe(true);
  await release();
});

it('does not delete fixed sessions when workspace removal is refused', async () => {
  const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
  const workDir = taskWorkDir(paths, 'app', 'task');
  const session = taskSessionRoot(paths, 'app', 'task');
  mkdirSync(session, { recursive: true });
  await expect(
    removeWorkspace(paths, workDir, {
      appKey: 'app',
      subjectKey: 'task',
      repos: [],
      recoveryRequired: true,
    }),
  ).rejects.toThrow('recovery');
  expect(existsSync(session)).toBe(true);
});

it('retains artifacts when a run registers after inspection but before deletion', async () => {
  const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
  const workDir = taskWorkDir(paths, 'app', 'task');
  const dependency = path.join(workDir, 'node_modules');
  mkdirSync(dependency, { recursive: true });
  await writeWorkspaceMeta(paths, workDir, {
    appKey: 'app',
    subjectKey: 'task',
    repos: [],
    lastUsedAt: new Date(0).toISOString(),
  });
  let calls = 0;
  let release: (() => Promise<void>) | undefined;
  try {
    await cleanArtifacts(await scanWorkspaces(paths), {
      paths,
      ttlMs: 1,
      patterns: ['node_modules'],
      shouldStop: async () => {
        if (++calls === 2)
          release = await registerWorkspaceUse(paths, workDir, 'starting');
        return false;
      },
    });
    expect(await workspaceInUse(paths, workDir)).toBe(true);
    expect(existsSync(dependency)).toBe(true);
  } finally {
    await release?.();
  }
});

it.each(['ordinary', 'ended'] as const)(
  'cleaning a legacy directory (%s) leaves a live fixed directory session intact',
  async (kind) => {
    const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    const fixed = taskWorkDir(paths, 'app', 'task');
    const legacy = subjectWorkDir(paths, 'app', 'task.readonly');
    mkdirSync(fixed, { recursive: true });
    mkdirSync(legacy, { recursive: true });
    const meta = {
      appKey: 'app',
      subjectKey: 'task',
      repos: [],
      lastUsedAt: new Date(0).toISOString(),
      readOnly: true,
      runAttempt: true,
    };
    await writeWorkspaceMeta(paths, legacy, meta);
    const session = taskSessionRoot(paths, 'app', 'task');
    mkdirSync(session, { recursive: true });
    writeFileSync(path.join(session, 'codex-home'), 'session');
    const release = await registerWorkspaceUse(paths, fixed, 'live');
    try {
      if (kind === 'ordinary') await removeWorkspace(paths, legacy, meta);
      else {
        const entry = (await scanWorkspaces(paths)).find(
          (entry) => entry.workDir === legacy,
        )!;
        expect(
          await removePlanned(paths, { ...entry, status: 'ended' }),
        ).toBeUndefined();
      }
      expect(existsSync(legacy)).toBe(false);
      expect(await workspaceInUse(paths, fixed)).toBe(true);
      expect(existsSync(path.join(session, 'codex-home'))).toBe(true);
    } finally {
      await release();
    }
  },
);
