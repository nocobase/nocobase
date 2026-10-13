// Drive the real runner recovery against production routes and a test database, with deterministic storage/network faults.
import fs, { existsSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import {
  RunWorker,
  type WorkerDeps,
} from '../../../app/agent-runner/src/agent/worker.ts';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it, vi } from 'vitest';
import { EventSpool } from '../../../app/agent-runner/src/core/events.ts';
import { writeWorkspaceMeta } from '../../../app/agent-runner/src/core/checkout.ts';
import { runWorkDir } from '../../../app/agent-runner/src/core/run-worktrees.ts';
import {
  recoverRun,
  recoverOrphans,
  writeRecord,
  readRecords,
} from '../../../app/agent-runner/src/core/supervisor.ts';
import * as home from '../../../app/agent-runner/src/lib/home.ts';
import { ApiClient } from '../../../app/agent-runner/src/lib/http.ts';
import { claim, createHarness } from './harness.js';

it('retains cancellation recovery through lost intent, unavailable spool, restart status failure and terminal rejection until production storage acknowledges it', async () => {
  const h = await createHarness();
  const root = await mkdtemp(path.join(tmpdir(), 'cancellation-recovery-'));
  try {
    const agentId = await h.createAgent();
    await h.enqueue(agentId, '1');
    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    const runId = payload.run.id;
    await h.services.runs.cancel(runId, 'owner');
    const paths = home.runnerPaths(
      path.join(root, 'home'),
      path.join(root, 'work'),
    );
    const workDir = runWorkDir(paths, 'app', 'fixture', runId, 1);
    await mkdir(workDir, { recursive: true });
    await writeWorkspaceMeta(paths, workDir, {
      appKey: 'app',
      subjectKey: 'fixture',
      repos: [],
      lastUsedAt: new Date().toISOString(),
      runWorktrees: true,
    });
    const record = {
      runId,
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
    const write = home.writeJsonAtomic;
    const storage = vi
      .spyOn(home, 'writeJsonAtomic')
      .mockImplementation(async (file, value, mode) => {
        if (file === path.join(paths.runsDir, `${runId}.json`))
          throw new Error('injected intent storage failure');
        await write(file, value, mode);
      });
    vi.spyOn(EventSpool, 'open').mockImplementation(() => {
      throw new Error('injected spool failure');
    });
    let fault: 'ack' | 'status' | 'terminal' | undefined = 'ack';
    const routes: string[] = [];
    const client = new ApiClient({
      server: 'http://fixture.test',
      headers: {},
      fetch: async (url, init) => {
        const route = new URL(String(url)).pathname;
        routes.push(route.split('/').at(-1)!);
        if (fault === 'ack' || fault === 'status')
          return new Response('{}', { status: 503 });
        if (fault === 'terminal')
          return new Response(
            JSON.stringify({
              error: {
                code: 400,
                status: 'FAILED_PRECONDITION',
                domain: 'agents',
                reason: 'RUN_NOT_ACTIVE',
                message: 'The run is cancelled.',
              },
            }),
            { status: 400 },
          );
        const response = await h.request(
          init?.method ?? 'GET',
          route.replace(/^\/api/, ''),
          {
            runnerKey: runner.key,
            ...(init?.body ? { body: JSON.parse(String(init.body)) } : {}),
          },
        );
        return new Response(JSON.stringify(response.body), {
          status: response.status,
        });
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
      detail: 'Cancellation recovery',
    });
    expect(await readRecords(paths)).toHaveLength(1);
    expect((await readRecords(paths))[0].recoveryReason).toBeUndefined();
    storage.mockRestore();
    h.clock.advance(61_000);
    await h.sweep();
    expect((await h.services.runs.get(runId)).status).toBe('cancelled');
    fault = 'status';
    await recoverOrphans(options);
    expect(await readRecords(paths)).toHaveLength(1);
    expect(routes).toEqual(['cancelAck', 'status']);
    fault = 'terminal';
    await recoverOrphans(options);
    expect(await readRecords(paths)).toHaveLength(1);
    // Even a known non-cancel recovery's terminal rejection is not evidence that unavailable preservation events arrived.
    await recoverRun((await readRecords(paths))[0], {
      ...options,
      reason: 'leaseExpired',
      detail: 'Restart',
    });
    expect(await readRecords(paths)).toHaveLength(1);
    expect(existsSync(workDir)).toBe(true);
    fault = undefined;
    await recoverOrphans(options);
    expect(await readRecords(paths)).toEqual([]);
    const saved = await h.services.runs.get(runId);
    expect(saved).toMatchObject({ status: 'cancelled' });
    expect(saved.failureDetail).toContain(workDir);
    const page = await h.services.runs.events(runId, 0, 100);
    expect(page.events).toHaveLength(1);
    expect(page.events[0]).toMatchObject({
      type: 'status',
      meta: { localSave: [{ path: workDir, saved: false }] },
    });
    await recoverRun(record, {
      ...options,
      reason: 'cancelled',
      detail: 'Cancellation recovery',
    });
    expect((await h.services.runs.events(runId, 0, 100)).events).toHaveLength(
      1,
    );
    expect(existsSync(workDir)).toBe(true);
  } finally {
    vi.restoreAllMocks();
    await h.close();
    await rm(root, { recursive: true, force: true });
  }
});

it.each([
  [false, '503'],
  [true, '503'],
  [false, 'unconfirmed'],
  [true, 'unconfirmed'],
  [false, 'terminal'],
  [true, 'terminal'],
] as const)(
  'retains the live worker recovery through failed intent=%s and ack=%s until restart reaches production storage',
  async (lostIntent, firstAck) => {
    const h = await createHarness();
    const root = await mkdtemp(
      path.join(tmpdir(), 'worker-cancellation-recovery-'),
    );
    try {
      const agentId = await h.createAgent();
      await h.enqueue(agentId, '1');
      const runner = await h.registerRunner();
      const [payload] = await claim(h, runner);
      const runId = payload.run.id;
      await h.services.runs.cancel(runId, 'owner');
      const paths = home.runnerPaths(
        path.join(root, 'home'),
        path.join(root, 'work'),
      );
      const workDir = runWorkDir(paths, 'app', 'fixture', runId, 1);
      await mkdir(workDir, { recursive: true });
      await writeWorkspaceMeta(paths, workDir, {
        appKey: 'app',
        subjectKey: 'fixture',
        repos: [],
        lastUsedAt: new Date().toISOString(),
        runWorktrees: true,
      });
      const record = {
        runId,
        appKey: 'app',
        attempt: payload.run.attempt,
        pid: 2147483647,
        workDir,
        startedAt: new Date().toISOString(),
        phase: 'running',
        firstSeq: payload.run.firstSeq,
        log: '',
      };
      await writeRecord(paths, record);
      const write = home.writeJsonAtomic;
      const storage = vi
        .spyOn(home, 'writeJsonAtomic')
        .mockImplementation(async (file, value, mode) => {
          if (lostIntent && file === path.join(paths.runsDir, `${runId}.json`))
            throw new Error('injected intent storage failure');
          await write(file, value, mode);
        });
      const append = fs.appendFileSync;
      let spoolFailures = 0;
      vi.spyOn(fs, 'appendFileSync').mockImplementation((file, ...args) => {
        if (String(file).endsWith('.events.ndjson')) {
          spoolFailures += 1;
          throw Object.assign(new Error('injected spool ENOSPC'), {
            code: 'ENOSPC',
          });
        }
        return append(file, ...args);
      });
      syncBuiltinESMExports();
      let fault: string | undefined = firstAck;
      const routes: string[] = [];
      const client = new ApiClient({
        server: 'http://fixture.test',
        headers: {},
        fetch: async (url, init) => {
          const route = new URL(String(url)).pathname;
          routes.push(route.split('/').at(-1)!);
          if (fault === '503' || fault === 'status')
            return new Response('{}', { status: 503 });
          if (fault === 'unconfirmed')
            return new Response(
              JSON.stringify({ data: { status: 'cancelled' } }),
            );
          if (fault === 'terminal')
            return new Response(
              JSON.stringify({
                error: {
                  code: 400,
                  status: 'FAILED_PRECONDITION',
                  domain: 'agents',
                  reason: 'RUN_NOT_ACTIVE',
                  message: 'The run is cancelled.',
                },
              }),
              { status: 400 },
            );
          const response = await h.request(
            init?.method ?? 'GET',
            route.replace(/^\/api/, ''),
            {
              runnerKey: runner.key,
              ...(init?.body ? { body: JSON.parse(String(init.body)) } : {}),
            },
          );
          return new Response(JSON.stringify(response.body), {
            status: response.status,
          });
        },
      });
      const logs: string[] = [];
      const worker = new RunWorker(
        payload,
        {
          reportTimeoutMs: -1,
          statusIntervalMs: 60000,
          leaseIntervalMs: 60000,
          eventFlushMs: 60000,
        },
        {
          paths,
          connection: { registration: {} } as WorkerDeps['connection'],
          settings: { passEnv: [] },
          adapters: new Map(),
          client,
          log: (message) => logs.push(message),
          stopWriters: async () => {
            throw new Error('injected writer verification failure');
          },
        },
        record,
      );
      // Begin at the prepared cancellation boundary, preserving the real ending, save, report and finally methods.
      Object.assign(worker, {
        prepared: { workspace: { workDir }, dirs: [] },
        execute: () => {
          if (lostIntent && firstAck === '503')
            throw new Error('injected preparation cancellation interruption');
          return (
            worker as unknown as { finishEnding(): Promise<string> }
          ).finishEnding();
        },
      });
      worker.end({ kind: 'cancel' });
      expect(await worker.run()).toBe('cancelled');
      expect(spoolFailures).toBeGreaterThan(0);
      expect(routes).toEqual(['cancelAck']);
      if (firstAck === 'terminal')
        expect(logs.some((message) => message.includes('RUN_NOT_ACTIVE'))).toBe(
          true,
        );
      expect(await readRecords(paths)).toHaveLength(1);
      expect(existsSync(workDir)).toBe(true);
      if (!lostIntent) {
        expect(
          (await readRecords(paths))[0].cancellationRecovery?.detail,
        ).toContain('injected writer verification failure');
        expect(
          (await readRecords(paths))[0].cancellationRecovery?.detail,
        ).toContain('ENOSPC');
      }
      storage.mockRestore();
      h.clock.advance(61000);
      await h.sweep();
      const options = {
        paths,
        clientFor: () => client,
        timings: { reportTimeoutMs: 1 },
        log: () => {},
      };
      fault = 'status';
      await recoverOrphans(options);
      expect(await readRecords(paths)).toHaveLength(1);
      if (lostIntent) expect(routes).toEqual(['cancelAck', 'status']);
      fault = 'terminal';
      await recoverOrphans(options);
      expect(await readRecords(paths)).toHaveLength(1);
      expect(existsSync(workDir)).toBe(true);
      fault = undefined;
      await recoverOrphans(options);
      expect(await readRecords(paths)).toEqual([]);
      const saved = await h.services.runs.get(runId);
      expect(saved.status).toBe('cancelled');
      expect(saved.failureDetail).toContain(workDir);
      expect(saved.failureDetail).toContain('Recovery required');
      expect(saved.failureDetail).toContain(
        'injected writer verification failure',
      );
      const events = await h.services.runs.events(runId, 0, 100);
      expect(events.events).toHaveLength(1);
      expect(events.events[0]).toMatchObject({
        type: 'status',
        meta: { localSave: [{ path: workDir, saved: false }] },
      });
      await recoverRun(record, {
        ...options,
        reason: 'cancelled',
        detail: 'Duplicate cancellation recovery',
      });
      expect((await h.services.runs.events(runId, 0, 100)).events).toHaveLength(
        1,
      );
      expect(existsSync(workDir)).toBe(true);
    } finally {
      vi.restoreAllMocks();
      syncBuiltinESMExports();
      await h.close();
      await rm(root, { recursive: true, force: true });
    }
  },
);
