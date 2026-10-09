// Cleaning up working directories from the command line and in the daemon: `gc` lists and removes what the
// application says is over, `config set workspace-limit` caps the total, and the daemon reports only to an application
// that announces workspace reports.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { FakeServer } from './fake-server.ts';
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
        limitBytes: number | null;
        unreachable: { app: string }[];
        workspaces: {
          workDir: string;
          subject: string;
          status: string;
          action: string;
          reason: string | null;
          removed?: boolean;
        }[];
      };
    };

  it('shows what would go without removing it, and removes it with --apply', async () => {
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

    const applied = await cli(['gc', '--apply', '--json'], env);
    expect(applied.code).toBe(0);
    expect(existsSync(ended)).toBe(false);
    expect(existsSync(ongoing)).toBe(true);
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

  it('keeps the workspace limit in the settings', async () => {
    const set = await cli(
      ['config', 'set', 'workspace-limit', '40G', '--json'],
      env,
    );
    expect(set.code).toBe(0);
    const settings = JSON.parse(
      readFileSync(path.join(home, 'settings.json'), 'utf8'),
    ) as { workspaceLimit?: number };
    expect(settings.workspaceLimit).toBe(40 * 1024 ** 3);
    const listed = await cli(['gc', '--json'], env);
    expect(json(listed.stdout).result.limitBytes).toBe(40 * 1024 ** 3);
    const bad = await cli(['config', 'set', 'workspace-limit', 'lots'], env);
    expect(bad.code).toBe(5);
    await cli(['config', 'set', 'workspace-limit', 'off'], env);
    expect(
      JSON.parse(readFileSync(path.join(home, 'settings.json'), 'utf8')),
    ).not.toHaveProperty('workspaceLimit');
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
