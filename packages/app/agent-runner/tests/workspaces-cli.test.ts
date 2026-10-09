// Cleaning up working directories from the command line and in the daemon: `gc` lists and removes what the
// application says is over, `config set min-free-disk` sets what is kept free, and the daemon reports only to an
// application that announces workspace reports.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RunnerDaemon } from '../src/core/loop.ts';
import { readConnections, readSettings } from '../src/lib/config.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import {
  cli,
  cliEnv,
  FAST_TIMINGS,
  registerRunner,
  removeDir,
  startDaemon,
  stopDaemon,
  tempDir,
  workRootOf,
} from './helpers.ts';

const APP = 'test-app';

describe('cleaning up working directories', () => {
  let server: FakeServer;
  let home: string;
  let env: NodeJS.ProcessEnv;

  beforeEach(async () => {
    server = new FakeServer();
    await server.listen();
    home = tempDir('nocobase-runner-gc-home-');
    env = cliEnv(home);
    await registerRunner(server.url, env);
  });
  afterEach(async () => {
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
  });

  /** A working directory a run of `subject` finished in, with nothing to push. */
  const workspace = (subject: string, runId: string): string => {
    const workDir = path.join(workRootOf(home), APP, subject);
    mkdirSync(path.join(workDir, '.nocobase-runner'), { recursive: true });
    writeFileSync(path.join(workDir, 'notes.txt'), 'x'.repeat(4096));
    const at = new Date(Date.now() - 60_000).toISOString();
    writeFileSync(
      path.join(workDir, '.nocobase-runner', 'workspace.json'),
      JSON.stringify({
        appKey: APP,
        subjectKey: subject,
        repos: [],
        lastUsedAt: at,
        endedAt: at,
        pushed: true,
        lastRunId: runId,
      }),
    );
    return workDir;
  };

  const json = (stdout: string) =>
    JSON.parse(stdout) as {
      ok: boolean;
      result: {
        applied: boolean;
        disk: { freeBytes: number; totalBytes: number } | null;
        minFreeBytes: number | null;
        low: boolean;
        unreachable: { app: string }[];
        workspaces: {
          workDir: string;
          subject: string;
          status: string;
          action: string;
          reason: string | null;
          removed?: boolean;
          sizeBytes?: number;
        }[];
      };
    };

  /** Keeps no free space, so what goes does not depend on the disk the tests run on. */
  const keepNoFreeSpace = () =>
    cli(['config', 'set', 'min-free-disk', 'off'], env);

  it('shows what would go without removing it, and removes it with --apply', async () => {
    await keepNoFreeSpace();
    server.workspaceReporting = { intervalMs: 60_000 };
    server.workspaceAnswer = { remove: ['run-1'], keep: ['run-2'] };
    const ended = workspace('TASK-1', 'run-1');
    const ongoing = workspace('TASK-2', 'run-2');

    const preview = await cli(['gc', '--json'], env);
    expect(preview.code).toBe(0);
    const listed = json(preview.stdout).result;
    expect(listed.applied).toBe(false);
    expect(
      listed.workspaces.map(({ subject, status, action, reason }) => ({
        subject,
        status,
        action,
        reason,
      })),
    ).toEqual(
      expect.arrayContaining([
        {
          subject: 'TASK-1',
          status: 'ended',
          action: 'remove',
          reason: 'ended',
        },
        { subject: 'TASK-2', status: 'active', action: 'keep', reason: null },
      ]),
    );
    expect(existsSync(ended)).toBe(true);
    expect(server.workspaceReports[0]?.workspaces).toHaveLength(2);
    // No sizes: the disk's free space and what is kept free instead.
    expect(listed.workspaces[0]).not.toHaveProperty('sizeBytes');
    expect(server.workspaceReports[0]?.workspaces[0]).not.toHaveProperty(
      'sizeBytes',
    );
    expect(listed.disk?.totalBytes).toBeGreaterThan(0);
    expect(listed.minFreeBytes).toBeNull();
    expect(server.workspaceReports[0]?.disk).toMatchObject({
      totalBytes: listed.disk?.totalBytes,
    });
    expect(server.workspaceReports[0]?.disk).not.toHaveProperty('minFreeBytes');

    const applied = await cli(['gc', '--apply', '--json'], env);
    expect(applied.code).toBe(0);
    expect(existsSync(ended)).toBe(false);
    expect(existsSync(ongoing)).toBe(true);
  });

  it('on a low disk removes only what is over, and says what is left for gc to pick', async () => {
    server.workspaceReporting = { intervalMs: 60_000 };
    server.workspaceAnswer = { remove: ['run-1'], keep: ['run-2'] };
    const ended = workspace('TASK-1', 'run-1');
    const ongoing = workspace('TASK-2', 'run-2');
    // More than any disk has free.
    await cli(['config', 'set', 'min-free-disk', '99.9%'], env);
    const applied = await cli(['gc', '--apply', '--json'], env);
    expect(applied.code).toBe(0);
    const { low, workspaces } = json(applied.stdout).result;
    expect(low).toBe(true);
    expect(existsSync(ended)).toBe(false);
    expect(existsSync(ongoing)).toBe(true);
    expect(workspaces.find((item) => item.subject === 'TASK-2')?.action).toBe(
      'keep',
    );
    const text = await cli(['gc'], env);
    expect(text.stdout).toContain(
      '1 pushed working directory whose work goes on',
    );
    expect(text.stdout).toContain('`nocobase-runner gc`');
    // Picked by subject, it goes.
    await cli(['gc', '--subject', 'TASK-2', '--apply'], env);
    expect(existsSync(ongoing)).toBe(false);
  });

  it('picks by subject, and lists the status as unknown when the application predates reports', async () => {
    const picked = workspace('TASK-81', 'run-81');
    const other = workspace('TASK-82', 'run-82');
    const result = await cli(
      ['gc', '--subject', 'TASK-81', '--apply', '--json'],
      env,
    );
    expect(result.code).toBe(0);
    const { unreachable, workspaces } = json(result.stdout).result;
    expect(unreachable).toEqual([expect.objectContaining({ app: APP })]);
    expect(workspaces.every((item) => item.status === 'unknown')).toBe(true);
    expect(existsSync(picked)).toBe(false);
    expect(existsSync(other)).toBe(true);
  });

  it('keeps the free space to keep in the settings, 5G unless set', async () => {
    const settingsFile = path.join(home, 'settings.json');
    const stored = () =>
      JSON.parse(readFileSync(settingsFile, 'utf8')) as {
        minFreeDisk?: unknown;
        workspaceLimit?: number;
      };
    expect(stored()).not.toHaveProperty('minFreeDisk');
    const byDefault = json((await cli(['gc', '--json'], env)).stdout).result;
    expect(byDefault.minFreeBytes).toBe(5 * 1024 ** 3);
    const set = await cli(
      ['config', 'set', 'min-free-disk', '20G', '--json'],
      env,
    );
    expect(set.code).toBe(0);
    expect(stored().minFreeDisk).toEqual({ bytes: 20 * 1024 ** 3 });
    const listed = await cli(['gc', '--json'], env);
    expect(json(listed.stdout).result.minFreeBytes).toBe(20 * 1024 ** 3);
    await cli(['config', 'set', 'min-free-disk', '5%'], env);
    expect(stored().minFreeDisk).toEqual({ percent: 5 });
    const bad = await cli(['config', 'set', 'min-free-disk', 'lots'], env);
    expect(bad.code).toBe(5);
    await cli(['config', 'set', 'min-free-disk', 'off'], env);
    expect(stored().minFreeDisk).toBeNull();
    expect(
      json((await cli(['gc', '--json'], env)).stdout).result.minFreeBytes,
    ).toBeNull();
    const old = await cli(
      ['config', 'set', 'workspace-limit', '40G', '--json'],
      env,
    );
    expect(old.code).not.toBe(0);
  });

  it('drops a workspace limit an earlier version stored, saying so once', async () => {
    const settingsFile = path.join(home, 'settings.json');
    writeFileSync(
      settingsFile,
      JSON.stringify({
        ...JSON.parse(readFileSync(settingsFile, 'utf8')),
        workspaceLimit: 40 * 1024 ** 3,
      }),
    );
    const paths = runnerPaths(home, workRootOf(home));
    const start = async (): Promise<string[]> => {
      const logs: string[] = [];
      const [connection] = await readConnections(paths);
      if (connection === undefined) throw new Error('Not registered.');
      const daemon = new RunnerDaemon({
        paths,
        settings: await readSettings(paths),
        connections: [connection],
        adapters: new Map(),
        timings: {
          heartbeatIntervalMs: 100,
          pollTimeoutMs: 200,
          pollFallbackMs: 200,
        },
        log: (message) => logs.push(message),
        pruneStore: () => Promise.resolve(true),
      });
      await daemon.start();
      await waitFor(() => logs.some((line) => line.includes('starting')));
      await daemon.stop();
      return logs;
    };
    expect((await start()).join('\n')).toContain(
      'workspace-limit no longer applies',
    );
    expect(JSON.parse(readFileSync(settingsFile, 'utf8'))).not.toHaveProperty(
      'workspaceLimit',
    );
    expect((await start()).join('\n')).not.toContain('workspace-limit');
  });

  it('reports from the daemon to an application that announces reports, and removes what it says is over', async () => {
    server.workspaceReporting = { intervalMs: 60_000 };
    server.workspaceAnswer = { remove: ['run-1'], keep: [] };
    const ended = workspace('TASK-1', 'run-1');
    const daemon = startDaemon(
      cliEnv(home, {
        NOCOBASE_RUNNER_TIMINGS: JSON.stringify({
          ...FAST_TIMINGS,
          gcTickMs: 100,
        }),
      }),
    );
    try {
      const deadline = Date.now() + 20_000;
      while (existsSync(ended) && Date.now() < deadline)
        await new Promise((resolve) => setTimeout(resolve, 100));
      expect(existsSync(ended)).toBe(false);
      expect(server.workspaceReports[0]?.workspaces[0]).toMatchObject({
        runId: 'run-1',
        workDir: ended,
        unpushed: false,
      });
    } finally {
      await stopDaemon(daemon);
    }
  });

  it('sends no report to an application that does not announce reports', async () => {
    await keepNoFreeSpace();
    const kept = workspace('TASK-1', 'run-1');
    const daemon = startDaemon(
      cliEnv(home, {
        NOCOBASE_RUNNER_TIMINGS: JSON.stringify({
          ...FAST_TIMINGS,
          gcTickMs: 100,
          collectIntervalMs: 200,
        }),
      }),
    );
    try {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      expect(server.workspaceReports).toEqual([]);
      expect(existsSync(kept)).toBe(true);
    } finally {
      await stopDaemon(daemon);
    }
  });
});
