import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventSpool } from '../src/core/events.ts';
import {
  prepareDirs,
  readWorkspaceMeta,
  writeWorkspaceMeta,
} from '../src/core/checkout.ts';
import {
  recoverRun,
  recoverOrphans,
  readRecords,
  writeRecord,
  type RunRecord,
} from '../src/core/supervisor.ts';
import {
  observeWriters,
  workspaceWriters,
} from '../src/core/writer-ownership.ts';
import { runWorkDir, finalizeRunWorktrees } from '../src/core/run-worktrees.ts';
import { runnerPaths } from '../src/lib/home.ts';
import * as home from '../src/lib/home.ts';
import { ApiClient } from '../src/lib/http.ts';
import { git, makeRemote, tempDir, removeDir } from './helpers.ts';
import {
  cliEnv,
  registerRunner,
  startDaemon,
  stopDaemon,
  writeFakeCli,
} from './helpers.ts';
import { FakeServer } from './fake-server.ts';
import { waitFor } from './fake-server.ts';

describe('orphan writer recovery', () => {
  let root: string;
  const children: ChildProcess[] = [];
  beforeEach(() => {
    root = tempDir('orphan-worktrees-');
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    for (const child of children.splice(0)) {
      if (child.exitCode === null && child.signalCode === null)
        child.kill('SIGKILL');
      await waitFor(() => child.exitCode !== null || child.signalCode !== null);
    }
    removeDir(root);
  });

  it.each([
    ['intent', 'leaseExpired'],
    ['intent', 'runnerOffline'],
    ['report', 'leaseExpired'],
    ['report', 'runnerOffline'],
  ] as const)(
    'never downgrades durable cancellation %s through a direct %s recovery hint',
    async (evidence, hint) => {
      const paths = runnerPaths(
        path.join(root, 'home'),
        path.join(root, 'work'),
      );
      const workDir = runWorkDir(paths, 'app', 'fixture', 'direct-cancel', 1);
      mkdirSync(workDir, { recursive: true });
      await writeWorkspaceMeta(paths, workDir, {
        appKey: 'app',
        subjectKey: 'fixture',
        repos: [],
        lastUsedAt: new Date().toISOString(),
        runWorktrees: true,
      });
      const record: RunRecord = {
        runId: 'direct-cancel',
        appKey: 'app',
        attempt: 1,
        pid: 2147483647,
        workDir,
        startedAt: new Date().toISOString(),
        phase: 'running',
        firstSeq: 0,
        log: '',
        ...(evidence === 'intent'
          ? { recoveryReason: 'cancelled' as const }
          : {
              cancellationRecovery: {
                attempt: 1,
                detail: 'Unconfirmed cancellation preservation',
                localSave: [
                  {
                    path: workDir,
                    saved: false,
                    reason: 'Writer verification failed',
                  },
                ],
              },
            }),
      };
      await writeRecord(paths, record);
      vi.spyOn(EventSpool, 'open').mockImplementation(() => {
        throw new Error('injected unavailable spool');
      });
      let response = '503';
      const routes: string[] = [];
      const client = new ApiClient({
        server: 'http://fixture.test',
        headers: {},
        fetch: async (url) => {
          routes.push(String(url).split('/').at(-1)!);
          if (response === '503') return new Response('{}', { status: 503 });
          if (response === 'terminal')
            return new Response(
              JSON.stringify({
                error: {
                  code: 400,
                  status: 'FAILED_PRECONDITION',
                  domain: 'agents',
                  reason: 'RUN_NOT_ACTIVE',
                  message: 'Cancelled',
                },
              }),
              { status: 400 },
            );
          return new Response(
            JSON.stringify({
              data: {
                status: 'cancelled',
                ...(response === 'accepted' ? { recoveryAccepted: true } : {}),
              },
            }),
          );
        },
      });
      const options = {
        paths,
        clientFor: () => client,
        timings: {},
        log: () => {},
        reason: hint,
        detail: 'Live exit',
      };
      for (const fault of ['503', 'unconfirmed', 'terminal']) {
        response = fault;
        await recoverRun(record, options);
        expect(await readRecords(paths)).toHaveLength(1);
        expect(existsSync(workDir)).toBe(true);
      }
      response = 'accepted';
      await recoverRun(record, options);
      expect(routes).toEqual([
        'cancelAck',
        'cancelAck',
        'cancelAck',
        'cancelAck',
      ]);
      expect(await readRecords(paths)).toEqual([]);
      expect(existsSync(workDir)).toBe(true);
    },
  );

  it('retains an escaped writer with an open descriptor and reports recovery across idempotent restart retries', async () => {
    const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    const remote = makeRemote(root);
    const workDir = runWorkDir(paths, 'app', 'PM-300', 'orphan', 1);
    const prepared = await prepareDirs({
      paths,
      workDir,
      appKey: 'app',
      subjectKey: 'PM-300',
      runId: 'orphan',
      perRun: true,
      dirs: [
        {
          kind: 'repo',
          url: remote,
          path: 'repo',
          branch: 'agent/PM-300',
          defaultBranch: 'main',
        },
      ],
    });
    const repo = prepared.dirs[0].repo!;
    const file = path.join(repo.dir, 'late.txt');
    const child = spawn(
      process.execPath,
      [
        '-e',
        `const fs=require('fs');const fd=fs.openSync(${JSON.stringify(file)},'w');process.stdout.write('ready');process.stdin.on('data',()=>{fs.writeSync(fd,'late content');process.stdout.write('written')});`,
      ],
      {
        cwd: root,
        detached: true,
        env: { PATH: process.env.PATH },
        stdio: ['pipe', 'pipe', 'ignore'],
      },
    );
    children.push(child);
    await new Promise<void>((resolve) =>
      child.stdout!.once('data', () => resolve()),
    );
    if (process.platform === 'linux')
      expect(await workspaceWriters(workDir)).toContain(child.pid);
    const record: RunRecord = {
      runId: 'orphan',
      appKey: 'app',
      attempt: 1,
      pid: 2147483647,
      processTag: 'cleared',
      workDir,
      startedAt: new Date().toISOString(),
      phase: 'running',
      firstSeq: 0,
      log: '',
    };
    await writeRecord(paths, record);
    const failures: { detail: string }[] = [];
    const statuses: string[] = [];
    let rejectReport = true;
    const client = new ApiClient({
      server: 'http://fixture.test',
      headers: {},
      fetch: async (url, init) => {
        if (String(url).endsWith('/status'))
          return new Response(
            JSON.stringify({
              data: {
                status: 'running',
                cancelRequested: false,
                inputs: [],
                leaseExpiresAt: null,
              },
            }),
          );
        const body = JSON.parse(String(init?.body)) as {
          detail: string;
          events?: { content: string }[];
        };
        if (String(url).endsWith('/fail')) {
          failures.push(body);
          if (rejectReport) return new Response('{}', { status: 503 });
        } else statuses.push(JSON.stringify(body));
        return new Response('{}', { status: 200 });
      },
    });
    const options = {
      paths,
      clientFor: () => client,
      timings: { reportTimeoutMs: 20 },
      log: () => {},
      reason: 'leaseExpired' as const,
      detail: 'Runner restarted',
    };
    await recoverRun(record, options);
    expect(existsSync(repo.dir)).toBe(true);
    expect((await readWorkspaceMeta(paths, workDir))?.recoveryRequired).toBe(
      true,
    );
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', 'refs/runner/saved/'],
        repo.cache,
      ),
    ).toBe('');
    expect(failures[0].detail).toContain(repo.dir);
    expect(failures[0].detail).toContain(
      'writer quiescence cannot be verified',
    );
    expect(statuses.join(' ')).toContain('localSave');
    expect(
      (await readRecords(paths)).some((entry) => entry.runId === record.runId),
    ).toBe(true);
    child.stdin!.write('write now');
    await waitFor(() => readFileSync(file, 'utf8') === 'late content');
    rejectReport = false;
    await recoverRun(record, options);
    expect(readFileSync(file, 'utf8')).toBe('late content');
    expect(existsSync(repo.dir)).toBe(true);
    expect(await readRecords(paths)).toEqual([]);
    expect(failures).toHaveLength(2);
  });

  it('recovers durable identities after loss of process group and environment ownership', async (context) => {
    if (process.platform !== 'linux') {
      // eslint-disable-next-line vitest/no-disabled-tests -- Boot/start identities are Linux-specific; other platforms preserve orphan directories.
      context.skip();
    }
    const paths = runnerPaths(path.join(root, 'home'));
    const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {
      detached: true,
      env: {},
      stdio: 'ignore',
    });
    children.push(child);
    // The old observer saw this child. The restarting daemon does not have the old observer in its process tree.
    await observeWriters(paths, 'known', process.pid, 'worker', [
      { pid: child.pid!, ppid: process.pid, pgid: child.pid! },
    ]);
    const record: RunRecord = {
      runId: 'known',
      appKey: 'app',
      attempt: 1,
      pid: 2147483647,
      startedAt: new Date().toISOString(),
      phase: 'running',
      firstSeq: 0,
      log: '',
    };
    await recoverRun(record, {
      paths,
      clientFor: () => undefined,
      timings: {},
      log: () => {},
      reason: 'leaseExpired',
      detail: 'Restart',
    });
    await waitFor(() => child.signalCode !== null);
    expect(child.signalCode).toBe('SIGKILL');
  });

  it('retains preparation directories even before repositories are registered', async () => {
    const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    const workDir = runWorkDir(paths, 'app', 'PM-300', 'partial', 1);
    mkdirSync(workDir, { recursive: true });
    writeFileSync(path.join(workDir, 'preparing.txt'), 'partial preparation');
    await writeWorkspaceMeta(paths, workDir, {
      appKey: 'app',
      subjectKey: 'PM-300',
      repos: [],
      lastUsedAt: new Date().toISOString(),
      runWorktrees: true,
    });
    const result = await finalizeRunWorktrees(paths, workDir, () => {}, {
      unsafeReason: 'Writers cannot be verified',
    });
    expect(result).toEqual([
      { path: workDir, saved: false, reason: 'Writers cannot be verified' },
    ]);
    expect(readFileSync(path.join(workDir, 'preparing.txt'), 'utf8')).toBe(
      'partial preparation',
    );
    expect((await readWorkspaceMeta(paths, workDir))?.recoveryRequired).toBe(
      true,
    );
  });

  it('reports malformed process ownership instead of dropping preservation information', async () => {
    const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    const workDir = runWorkDir(paths, 'app', 'PM-300', 'corrupt', 1);
    mkdirSync(workDir, { recursive: true });
    await writeWorkspaceMeta(paths, workDir, {
      appKey: 'app',
      subjectKey: 'PM-300',
      repos: [],
      lastUsedAt: new Date().toISOString(),
      runWorktrees: true,
    });
    mkdirSync(paths.runsDir, { recursive: true });
    writeFileSync(
      path.join(paths.runsDir, 'corrupt.worker-writers'),
      '{broken',
    );
    const details: string[] = [];
    const client = new ApiClient({
      server: 'http://fixture.test',
      headers: {},
      fetch: async (url, init) => {
        if (String(url).endsWith('/status'))
          return new Response(
            JSON.stringify({
              data: {
                status: 'running',
                cancelRequested: false,
                inputs: [],
                leaseExpiresAt: null,
              },
            }),
          );
        if (String(url).endsWith('/fail'))
          details.push(
            (JSON.parse(String(init?.body)) as { detail: string }).detail,
          );
        return new Response('{}', { status: 200 });
      },
    });
    await recoverRun(
      {
        runId: 'corrupt',
        appKey: 'app',
        attempt: 1,
        pid: 2147483647,
        startedAt: new Date().toISOString(),
        phase: 'workspace',
        firstSeq: 0,
        log: '',
        workDir,
      },
      {
        paths,
        clientFor: () => client,
        timings: {},
        log: () => {},
        reason: 'leaseExpired',
        detail: 'Restart',
      },
    );
    expect(details[0]).toContain('ownership recovery failed');
    expect(details[0]).toContain(workDir);
    expect(existsSync(workDir)).toBe(true);
    expect(existsSync(path.join(paths.runsDir, 'corrupt.worker-writers'))).toBe(
      true,
    );
  });

  it.each(['open', 'write'] as const)(
    'retains cancelled recovery across %s spool failure and failed direct delivery',
    async (failure) => {
      const paths = runnerPaths(
        path.join(root, 'home'),
        path.join(root, 'work'),
      );
      const workDir = runWorkDir(paths, 'app', 'PM-300', 'cancel-report', 1);
      mkdirSync(workDir, { recursive: true });
      await writeWorkspaceMeta(paths, workDir, {
        appKey: 'app',
        subjectKey: 'PM-300',
        repos: [],
        lastUsedAt: new Date().toISOString(),
        runWorktrees: true,
      });
      if (failure === 'open')
        vi.spyOn(EventSpool, 'open').mockImplementation(() => {
          throw new Error('storage failure');
        });
      else
        vi.spyOn(EventSpool.prototype, 'push').mockImplementation(() => {
          throw new Error('write failure');
        });
      const record: RunRecord = {
        runId: 'cancel-report',
        appKey: 'app',
        attempt: 1,
        pid: 2147483647,
        workDir,
        startedAt: new Date().toISOString(),
        phase: 'running',
        firstSeq: 0,
        log: '',
      };
      await writeRecord(paths, record);
      let unavailable = true;
      const bodies: { recovery: { detail: string; localSave: unknown[] } }[] =
        [];
      const client = new ApiClient({
        server: 'http://fixture.test',
        headers: {},
        fetch: async (url, init) => {
          expect(String(url)).toContain('/cancelAck');
          bodies.push(JSON.parse(String(init?.body)));
          return new Response(
            unavailable
              ? '{}'
              : '{"data":{"status":"cancelled","recoveryAccepted":true}}',
            { status: unavailable ? 503 : 200 },
          );
        },
      });
      const options = {
        paths,
        clientFor: () => client,
        timings: { reportTimeoutMs: 5 },
        log: () => {},
      };
      await recoverRun(record, {
        ...options,
        reason: 'cancelled',
        detail: 'Cancellation',
      });
      expect(await readRecords(paths)).toHaveLength(1);
      unavailable = false;
      await recoverOrphans(options);
      expect(bodies.at(-1)?.recovery.detail).toContain(workDir);
      expect(bodies.at(-1)?.recovery.localSave).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: workDir, saved: false }),
        ]),
      );
      expect(await readRecords(paths)).toEqual([]);
      expect(existsSync(workDir)).toBe(true);
    },
  );

  it('keeps the sole report record when a legacy or terminal server does not acknowledge preservation', async () => {
    const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    const workDir = runWorkDir(paths, 'app', 'PM-300', 'legacy-cancel', 1);
    mkdirSync(workDir, { recursive: true });
    await writeWorkspaceMeta(paths, workDir, {
      appKey: 'app',
      subjectKey: 'PM-300',
      repos: [],
      lastUsedAt: new Date().toISOString(),
      runWorktrees: true,
    });
    vi.spyOn(EventSpool, 'open').mockImplementation(() => {
      throw new Error('storage failure');
    });
    const record: RunRecord = {
      runId: 'legacy-cancel',
      appKey: 'app',
      attempt: 1,
      pid: 2147483647,
      workDir,
      startedAt: new Date().toISOString(),
      phase: 'running',
      firstSeq: 0,
      log: '',
    };
    await writeRecord(paths, record);
    let terminal = false;
    const messages: string[] = [];
    const client = new ApiClient({
      server: 'http://fixture.test',
      headers: {},
      fetch: async () =>
        new Response(
          terminal
            ? '{"error":{"code":400,"status":"FAILED_PRECONDITION","domain":"agents","reason":"RUN_NOT_ACTIVE","message":"Cancelled"}}'
            : '{}',
          { status: terminal ? 400 : 200 },
        ),
    });
    const options = {
      paths,
      clientFor: () => client,
      timings: {},
      log: (message: string) => messages.push(message),
    };
    await recoverRun(record, {
      ...options,
      reason: 'cancelled',
      detail: 'Cancellation',
    });
    expect(await readRecords(paths)).toHaveLength(1);
    terminal = true;
    await recoverOrphans(options);
    expect(await readRecords(paths)).toHaveLength(1);
    expect(existsSync(workDir)).toBe(true);
    expect(messages.join(' ')).toContain('RUN_NOT_ACTIVE');
  });

  it('reports cancellation even when retry metadata cannot be rewritten, then recovers its reason from owned server status', async () => {
    const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    const workDir = runWorkDir(paths, 'app', 'PM-300', 'record-storage', 1);
    mkdirSync(workDir, { recursive: true });
    await writeWorkspaceMeta(paths, workDir, {
      appKey: 'app',
      subjectKey: 'PM-300',
      repos: [],
      lastUsedAt: new Date().toISOString(),
      runWorktrees: true,
    });
    const record: RunRecord = {
      runId: 'record-storage',
      appKey: 'app',
      attempt: 1,
      pid: 2147483647,
      workDir,
      startedAt: new Date().toISOString(),
      phase: 'running',
      firstSeq: 0,
      log: '',
    };
    await writeRecord(paths, record);
    const original = home.writeJsonAtomic;
    vi.spyOn(home, 'writeJsonAtomic').mockImplementation(
      async (file, value, mode) => {
        if (file === path.join(paths.runsDir, 'record-storage.json'))
          throw new Error('retry metadata storage unavailable');
        await original(file, value, mode);
      },
    );
    vi.spyOn(EventSpool, 'open').mockImplementation(() => {
      throw new Error('spool unavailable');
    });
    let offline = true;
    const bodies: { recovery: { detail: string } }[] = [];
    const client = new ApiClient({
      server: 'http://fixture.test',
      headers: {},
      fetch: async (url, init) => {
        if (String(url).endsWith('/status'))
          return new Response(
            '{"data":{"status":"cancelled","cancelRequested":true,"inputs":[],"leaseExpiresAt":null}}',
          );
        expect(String(url)).toContain('/cancelAck');
        bodies.push(JSON.parse(String(init?.body)));
        return new Response(
          offline
            ? '{}'
            : '{"data":{"status":"cancelled","recoveryAccepted":true}}',
          { status: offline ? 503 : 200 },
        );
      },
    });
    const options = {
      paths,
      clientFor: () => client,
      timings: {},
      log: () => {},
    };
    await recoverRun(record, {
      ...options,
      reason: 'cancelled',
      detail: 'Cancel',
    });
    expect(bodies[0].recovery.detail).toContain(
      'retry metadata could not be stored',
    );
    expect(await readRecords(paths)).toHaveLength(1);
    offline = false;
    await recoverOrphans(options);
    expect(await readRecords(paths)).toEqual([]);
    expect(existsSync(workDir)).toBe(true);
  });

  it('still reports recovery details when event spool storage fails', async () => {
    const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    const workDir = runWorkDir(paths, 'app', 'PM-300', 'no-spool', 1);
    mkdirSync(workDir, { recursive: true });
    await writeWorkspaceMeta(paths, workDir, {
      appKey: 'app',
      subjectKey: 'PM-300',
      repos: [],
      lastUsedAt: new Date().toISOString(),
      runWorktrees: true,
    });
    vi.spyOn(EventSpool, 'open').mockImplementation(() => {
      throw new Error('fixture storage unavailable');
    });
    const details: string[] = [];
    const client = new ApiClient({
      server: 'http://fixture.test',
      headers: {},
      fetch: async (url, init) => {
        if (String(url).endsWith('/status'))
          return new Response(
            JSON.stringify({
              data: {
                status: 'running',
                cancelRequested: false,
                inputs: [],
                leaseExpiresAt: null,
              },
            }),
          );
        if (String(url).endsWith('/fail'))
          details.push(
            (JSON.parse(String(init?.body)) as { detail: string }).detail,
          );
        return new Response('{}', { status: 200 });
      },
    });
    await recoverRun(
      {
        runId: 'no-spool',
        appKey: 'app',
        attempt: 1,
        pid: 2147483647,
        startedAt: new Date().toISOString(),
        phase: 'workspace',
        firstSeq: 0,
        log: '',
        workDir,
      },
      {
        paths,
        clientFor: () => client,
        timings: {},
        log: () => {},
        reason: 'leaseExpired',
        detail: 'Restart',
      },
    );
    expect(details[0]).toContain('writer quiescence cannot be verified');
    expect(details[0]).toContain('Recovery status could not be spooled');
    expect(details[0]).toContain(workDir);
    expect(existsSync(workDir)).toBe(true);
  });

  it('reports preserved repositories through a real daemon restart instead of deleting an escaped writer', async () => {
    const server = new FakeServer();
    await server.listen();
    const home = path.join(root, 'daemon-home');
    const env = cliEnv(home);
    await registerRunner(server.url, env, [
      '--cli',
      `appcli=${writeFakeCli(root)}`,
    ]);
    const remote = makeRemote(root);
    const run = server.enqueue({
      subject: { key: 'PM-300', url: 'http://fixture.test/PM-300' },
      workspace: {
        dirs: [
          {
            kind: 'repo',
            url: remote,
            branch: 'agent/PM-300',
            defaultBranch: 'main',
            path: 'repo',
          },
        ],
        env: [],
      },
      prompt: {
        system: '',
        session: 'fresh',
        turn: 'write before.txt before\nhang',
      },
    });
    const first = startDaemon(env);
    let second: ReturnType<typeof startDaemon> | undefined;
    try {
      await waitFor(
        () =>
          run.status === 'running' &&
          existsSync(
            path.join(String(run.start?.workDir), 'repo', 'before.txt'),
          ),
        30_000,
      );
      const dir = path.join(String(run.start?.workDir), 'repo');
      const file = path.join(dir, 'late.txt');
      const writer = spawn(
        process.execPath,
        [
          '-e',
          `const fs=require('fs');const fd=fs.openSync(${JSON.stringify(file)},'w');process.stdout.write('ready');process.stdin.on('data',()=>fs.writeSync(fd,'after restart'));`,
        ],
        {
          detached: true,
          cwd: root,
          env: {},
          stdio: ['pipe', 'pipe', 'ignore'],
        },
      );
      children.push(writer);
      await new Promise<void>((resolve) =>
        writer.stdout!.once('data', () => resolve()),
      );
      first.child.kill('SIGKILL');
      await first.exited;
      second = startDaemon(env);
      await waitFor(() => run.status === 'failed', 30_000);
      expect(run.fail?.detail).toContain(dir);
      expect(run.fail?.detail).toContain(
        'writer quiescence cannot be verified',
      );
      expect(existsSync(dir)).toBe(true);
      expect(
        server
          .events(run.payload.run.id)
          .some((event) => event.meta?.localSave !== undefined),
      ).toBe(true);
      writer.stdin!.write('go');
      await waitFor(() => readFileSync(file, 'utf8') === 'after restart');
      const meta = await readWorkspaceMeta(
        runnerPaths(home),
        String(run.start?.workDir),
      );
      expect(meta?.recoveryRequired).toBe(true);
    } finally {
      if (second !== undefined) await stopDaemon(second);
      await stopDaemon(first);
      await server.close();
    }
  }, 60_000);
});
