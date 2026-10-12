import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  prepareDirs,
  readWorkspaceMeta,
  writeWorkspaceMeta,
} from '../src/core/checkout.ts';
import {
  recoverRun,
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
    for (const child of children.splice(0)) {
      if (child.exitCode === null && child.signalCode === null)
        child.kill('SIGKILL');
      await waitFor(() => child.exitCode !== null || child.signalCode !== null);
    }
    removeDir(root);
  });

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

  it('recovers durable identities after loss of process group and environment ownership', async () => {
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
