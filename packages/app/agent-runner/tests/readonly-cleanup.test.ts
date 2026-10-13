import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acquireLock,
  checkout,
  markDirsPrepared,
  removeWorkspace,
  readWorkspaceMeta,
  subjectWorkDir,
} from '../src/core/checkout.ts';
import { collectWorkspaces } from '../src/core/workspaces.ts';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import { listProcesses } from '../src/core/process-tree.ts';
import { Supervisor, type SupervisedRun } from '../src/core/supervisor.ts';
import { workspaceStep } from '../src/agent/prepare/workspace.ts';
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
    'preserves %s and refuses to rebuild nonempty read-only work',
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
      await expect(checkout({ ...options, log })).rejects.toThrow();
      expect(readFileSync(path.join(dir, 'remnant'), 'utf8')).toBe(
        'left by interrupted cleanup',
      );
      await collectWorkspaces({ paths });
      expect(existsSync(first.workDir)).toBe(true);
      expect(
        log.mock.calls.filter(([line]) =>
          String(line).includes('rebuilding read-only'),
        ),
      ).toHaveLength(0);
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

  it('preserves unrecorded nonempty read-only remnants and held directories', async () => {
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
      expect(result.removed).toEqual([]);
      expect(existsSync(dirs[0]!)).toBe(true);
      expect(existsSync(dirs[1]!)).toBe(true);
      expect(existsSync(dirs[2]!)).toBe(true);
    } finally {
      await lock.release();
    }
    await collectWorkspaces({ paths });
    expect(existsSync(dirs[1]!)).toBe(true);
  });

  it('does not interpret a failed process scan as an empty process tree', async () => {
    vi.stubEnv('PATH', root);
    await expect(listProcesses(true)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('preserves a damaged legacy checkout and its registration without damaging a live neighbor', async () => {
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
      expect(existsSync(first.workDir)).toBe(true);
      expect(git(['worktree', 'list', '--porcelain'], cache)).toContain(dir);
      expect(git(['rev-parse', 'HEAD'], neighbor.dirs[0]!.dir)).toMatch(
        /^[a-f0-9]{40}$/u,
      );
    } finally {
      await neighbor.release();
    }
  });

  it.each(['clean', 'repo', 'root'])(
    'requires published clean work even after writers stop (files=%s)',
    async (files) => {
      const remote = makeRemote(root);
      const first = await checkout({
        paths,
        appKey: 'app',
        subjectKey: 'PM-303.readonly-runner-test',
        dirs: [
          {
            kind: 'repo',
            url: remote,
            path: 'app',
            branch: 'main',
            defaultBranch: 'main',
          },
        ],
      });
      const dir = first.dirs[0]!.dir;
      if (files !== 'clean')
        writeFileSync(
          path.join(files === 'repo' ? dir : first.workDir, 'unpublished'),
          'keep',
        );
      await first.release();
      const releases: (() => Promise<void>)[] = [];
      const stop = vi.fn(async () => true);
      await workspaceStep.run({
        paths,
        registration: { key: 'app' },
        payload: {
          subject: { key: 'PM-303' },
          agent: { id: 'runner-test' },
          workspace: { readOnly: true },
        },
        onRelease: (release: () => Promise<void>) => releases.push(release),
        beforeWorkspaceRemoval: stop,
        log: () => {},
        event: () => {},
      } as never);
      try {
        await releases[1]!();
        expect(stop).toHaveBeenCalledOnce();
        expect(existsSync(first.workDir)).toBe(files !== 'clean');
      } finally {
        await releases[0]!();
      }
    },
  );

  it('removes a clean published legacy worktree and prunes only its stale registration', async () => {
    const remote = makeRemote(root);
    const first = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-303.readonly-runner-test',
      dirs: [
        {
          kind: 'repo',
          url: remote,
          path: 'app',
          branch: 'main',
          defaultBranch: 'main',
        },
      ],
    });
    const dir = first.dirs[0]!.dir;
    const cache = first.repos[0]!.cache;
    rmSync(dir, { recursive: true });
    git(
      ['worktree', 'add', '--detach', dir, 'refs/remotes/origin/main'],
      cache,
    );
    const meta = await readWorkspaceMeta(paths, first.workDir);
    expect(meta).toBeDefined();
    expect(await removeWorkspace(paths, first.workDir, meta!)).toBe(true);
    expect(git(['worktree', 'list', '--porcelain'], cache)).not.toContain(dir);
    await first.release();
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
});
