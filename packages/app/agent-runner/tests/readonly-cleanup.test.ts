import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acquireLock,
  checkout,
  gcWorkspaces,
  markDirsPrepared,
  subjectWorkDir,
  writeWorkspaceMeta,
} from '../src/core/checkout.ts';
import { collectWorkspaces } from '../src/core/workspaces.ts';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import { listProcesses } from '../src/core/process-tree.ts';
import {
  Supervisor,
  writeRecord,
  type RunRecord,
  type SupervisedRun,
} from '../src/core/supervisor.ts';
import { git, makeRemote, removeDir, tempDir } from './helpers.ts';

describe('read-only workspace cleanup', () => {
  let root: string;
  let paths: RunnerPaths;
  beforeEach(() => {
    root = tempDir('readonly-cleanup-');
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    removeDir(root);
  });

  it.each(['missing-git', 'remnants', 'lost-registration'])(
    'rebuilds %s once and clears prepared state',
    async (damage) => {
      const remote = makeRemote(root);
      const options = {
        paths,
        appKey: 'app',
        subjectKey: 'PM-303.readonly-runner-test',
        dirs: [
          {
            kind: 'repo' as const,
            url: remote,
            path: 'app',
            branch: 'agent/test',
            defaultBranch: 'main',
          },
        ],
      };
      const first = await checkout(options);
      await markDirsPrepared(paths, first.workDir, first.dirs);
      const dir = first.dirs[0]!.dir;
      const cache = first.repos[0]!.cache;
      await first.release();
      if (damage === 'lost-registration') {
        rmSync(dir, { recursive: true });
        git(
          ['worktree', 'add', '--detach', dir, 'refs/remotes/origin/main'],
          cache,
        );
        rmSync(path.join(cache, 'worktrees'), { recursive: true });
      } else {
        rmSync(damage === 'remnants' ? dir : path.join(dir, '.git'), {
          recursive: true,
        });
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(path.join(dir, 'remnant'), 'left by interrupted cleanup');
      const log = vi.fn();
      const next = await checkout({ ...options, log });
      expect(git(['rev-parse', '--is-inside-work-tree'], dir)).toBe('true');
      expect(existsSync(path.join(dir, 'remnant'))).toBe(false);
      expect(next.dirs[0]!.fresh).toBe(true);
      expect(
        log.mock.calls.filter(([line]) =>
          String(line).includes('rebuilding read-only'),
        ),
      ).toHaveLength(1);
      await next.release();
    },
  );

  it('keeps a corrupt writable checkout and refuses to rebuild it', async () => {
    const remote = makeRemote(root);
    const options = {
      paths,
      appKey: 'app',
      subjectKey: 'PM-303',
      dirs: [
        {
          kind: 'repo' as const,
          url: remote,
          path: 'app',
          branch: 'agent/test',
          defaultBranch: 'main',
        },
      ],
    };
    const first = await checkout(options);
    await first.release();
    rmSync(path.join(first.dirs[0]!.dir, '.git'), { recursive: true });
    await expect(checkout(options)).rejects.toThrow('not a worktree');
    await collectWorkspaces({ paths });
    expect(existsSync(first.workDir)).toBe(true);
  });

  it('collects unrecorded read-only remnants but protects held and writable directories', async () => {
    const dirs = [
      'PM-1.readonly-runner-test',
      'PM-2.readonly-runner-test',
      'PM-3',
    ].map((key) => subjectWorkDir(paths, 'app', key));
    for (const dir of dirs) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, 'remnant'), 'data');
    }
    const lock = await acquireLock(`${dirs[1]}.lock`);
    try {
      const result = await collectWorkspaces({ paths });
      expect(result.removed.map((entry) => entry.workDir)).toEqual([dirs[0]]);
      expect(existsSync(dirs[1]!)).toBe(true);
      expect(existsSync(dirs[2]!)).toBe(true);
    } finally {
      await lock.release();
    }
    await collectWorkspaces({ paths });
    expect(existsSync(dirs[1]!)).toBe(false);
  });

  it('collects unlocked read-only run attempts without Git checks but keeps writer attempts', async () => {
    const [readOnly, held, writer] = [
      'PM-1.run-a-1-x',
      'PM-2.run-b-1-y',
      'PM-3.run-c-1-z',
    ].map((key) => subjectWorkDir(paths, 'app', key));
    for (const [dir, ro] of [
      [readOnly, true],
      [held, true],
      [writer, false],
    ] as const) {
      mkdirSync(path.join(dir!, 'app'), { recursive: true });
      writeFileSync(path.join(dir!, 'app', '.git'), 'gitdir: /missing');
      await writeWorkspaceMeta(paths, dir!, {
        appKey: 'app',
        subjectKey: path.basename(dir!).split('.')[0]!,
        repos: [],
        lastUsedAt: new Date().toISOString(),
        runAttempt: true,
        runWorktrees: true,
        readOnly: ro,
      });
    }
    const lock = await acquireLock(`${held}.lock`);
    try {
      const result = await collectWorkspaces({ paths });
      expect(result.removed.map((entry) => entry.workDir)).toEqual([readOnly]);
      expect(existsSync(held!)).toBe(true);
      expect(existsSync(writer!)).toBe(true);
    } finally {
      await lock.release();
    }
    expect(await gcWorkspaces({ paths })).toEqual([held]);
    expect(existsSync(writer!)).toBe(true);
  });

  it('does not interpret a failed process scan as an empty process tree', async () => {
    vi.stubEnv('PATH', root);
    await expect(listProcesses(true)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('prunes a removed legacy registration without damaging a live neighbor', async () => {
    const remote = makeRemote(root);
    const dirs = [
      {
        kind: 'repo' as const,
        url: remote,
        path: 'app',
        branch: 'agent/test',
        defaultBranch: 'main',
      },
    ];
    const first = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-303.readonly-runner-test',
      dirs,
    });
    const neighbor = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-304',
      dirs,
    });
    const dir = first.dirs[0]!.dir;
    const cache = first.repos[0]!.cache;
    await first.release();
    rmSync(dir, { recursive: true });
    git(
      ['worktree', 'add', '--detach', dir, 'refs/remotes/origin/main'],
      cache,
    );
    rmSync(path.join(dir, '.git'));
    try {
      await Promise.all([
        collectWorkspaces({ paths }),
        collectWorkspaces({ paths }),
      ]);
      expect(existsSync(first.workDir)).toBe(false);
      expect(git(['worktree', 'list', '--porcelain'], cache)).not.toContain(
        dir,
      );
      expect(git(['rev-parse', 'HEAD'], neighbor.dirs[0]!.dir)).toMatch(
        /^[a-f0-9]{40}$/u,
      );
    } finally {
      await neighbor.release();
    }
  });

  it('waits beyond the shutdown deadline for read-only cleanup without SIGKILL', async () => {
    const kill = vi.spyOn(process, 'kill').mockReturnValue(true);
    const supervisor = new Supervisor({
      paths,
      clientFor: () => undefined,
      timings: {},
      log: () => {},
    });
    let finish!: () => void;
    const exited = new Promise<void>((resolve) => {
      finish = resolve;
    });
    supervisor.runs.set('test', {
      runId: 'test',
      pid: 987654,
      readOnly: true,
      exited,
      groups: new Set(),
    } as SupervisedRun);
    let stopped = false;
    const stopping = supervisor.stopAll(5).then(() => {
      stopped = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(stopped).toBe(false);
    expect(kill.mock.calls).toEqual([[987654, 'SIGTERM']]);
    finish();
    await stopping;
    expect(stopped).toBe(true);
  });

  it('waits for a writer that is saving and removing its worktrees at shutdown', async () => {
    const kill = vi.spyOn(process, 'kill').mockReturnValue(true);
    const supervisor = new Supervisor({
      paths,
      clientFor: () => undefined,
      timings: {},
      log: () => {},
    });
    await writeRecord(paths, {
      runId: 'writer',
      appKey: 'app',
      attempt: 1,
      firstSeq: 0,
      pid: 987655,
      startedAt: new Date().toISOString(),
      phase: 'reporting',
      finalizing: true,
      log: '',
    } satisfies RunRecord);
    let finish!: () => void;
    const exited = new Promise<void>((resolve) => {
      finish = resolve;
    });
    supervisor.runs.set('writer', {
      runId: 'writer',
      pid: 987655,
      exited,
      groups: new Set(),
    } as unknown as SupervisedRun);
    let stopped = false;
    const stopping = supervisor.stopAll(5).then(() => {
      stopped = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(stopped).toBe(false);
    expect(kill.mock.calls).toEqual([[987655, 'SIGTERM']]);
    finish();
    await stopping;
    expect(stopped).toBe(true);
  });
});
