import fs, { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it, vi } from 'vitest';
import { RunWorker, type WorkerDeps } from '../src/agent/worker.ts';
import {
  writeWorkspaceMeta,
  readWorkspaceMeta,
  workspaceRecordPath,
} from '../src/core/checkout.ts';
import {
  readRecords,
  recoverOrphans,
  writeRecord,
} from '../src/core/supervisor.ts';
import * as home from '../src/lib/home.ts';
import { ApiClient } from '../src/lib/http.ts';
import { FakeServer } from './fake-server.ts';

const { runnerPaths } = home;

it.each([
  'cancel',
  'lost',
  'error',
  'cancelMetadata',
  'errorThenCancel',
] as const)(
  'retains the worker retry record after %s, writer verification and spool failure without a confirmed report',
  async (ending) => {
    const root = await mkdtemp(path.join(tmpdir(), 'worker-recovery-'));
    try {
      const paths = runnerPaths(
        path.join(root, 'home'),
        path.join(root, 'work'),
      );
      const workDir = path.join(paths.workRoot, 'attempt');
      await mkdir(workDir, { recursive: true });
      await writeWorkspaceMeta(paths, workDir, {
        appKey: 'fixture',
        subjectKey: 'fixture',
        repos: [],
        runWorktrees: true,
        lastUsedAt: new Date().toISOString(),
      });
      const payload = new FakeServer().enqueue().payload;
      const record = {
        runId: payload.run.id,
        appKey: 'fixture',
        attempt: 1,
        pid: 2147483647,
        workDir,
        startedAt: new Date().toISOString(),
        phase: 'running',
        firstSeq: 0,
        log: '',
      };
      await writeRecord(paths, record);
      const requests: string[] = [];
      const client = new ApiClient({
        server: 'http://fixture.test',
        headers: {},
        fetch: async (url) => {
          requests.push(String(url).split('/').at(-1)!);
          return new Response('{}', { status: 503 });
        },
      });
      const worker = new RunWorker(
        payload,
        {
          reportTimeoutMs: -1,
          eventFlushMs: 60000,
          leaseIntervalMs: 60000,
          statusIntervalMs: 60000,
        },
        {
          paths,
          connection: { registration: {} } as WorkerDeps['connection'],
          settings: { passEnv: [] },
          adapters: new Map(),
          client,
          log: () => {},
          stopWriters: async () => {
            if (ending === 'errorThenCancel') worker.end({ kind: 'cancel' });
            throw new Error('injected writer verification failure');
          },
        },
        record,
      );
      // Keep the production ending, report and finally paths, starting from a prepared synthetic workspace.
      Object.assign(worker, {
        prepared: { workspace: { workDir }, dirs: [] },
        execute: () => {
          if (ending === 'error')
            throw new Error('injected preparation failure');
          return (
            worker as unknown as { finishEnding(): Promise<string> }
          ).finishEnding();
        },
      });
      if (ending === 'cancel' || ending === 'cancelMetadata')
        worker.end({ kind: 'cancel' });
      const write = home.writeJsonAtomic;
      const storage = vi
        .spyOn(home, 'writeJsonAtomic')
        .mockImplementation(async (file, value, mode) => {
          if (
            ending === 'cancelMetadata' &&
            file === workspaceRecordPath(paths, workDir)
          )
            throw new Error('injected preservation metadata storage failure');
          await write(file, value, mode);
        });
      if (ending === 'lost') worker.end({ kind: 'lost', code: 'LEASE_LOST' });
      const append = fs.appendFileSync;
      let failures = 0;
      vi.spyOn(fs, 'appendFileSync').mockImplementation((file, ...args) => {
        if (String(file).endsWith('.events.ndjson')) {
          failures += 1;
          throw Object.assign(new Error('injected spool ENOSPC'), {
            code: 'ENOSPC',
          });
        }
        return append(file, ...args);
      });
      syncBuiltinESMExports();
      if (ending === 'error') await expect(worker.run()).rejects.toThrow();
      else
        expect(await worker.run()).toBe(
          ending !== 'lost' ? 'cancelled' : 'leaseLost',
        );
      expect(failures).toBeGreaterThan(0);
      expect(await readRecords(paths)).toHaveLength(1);
      expect(existsSync(workDir)).toBe(true);
      expect((await readWorkspaceMeta(paths, workDir))?.recoveryRequired).toBe(
        ending === 'cancelMetadata' ? undefined : true,
      );
      expect(requests).toEqual(
        ending.startsWith('cancel') || ending === 'errorThenCancel'
          ? ['cancelAck']
          : ending === 'error'
            ? ['fail']
            : [],
      );
      if (ending === 'cancelMetadata') {
        const report = (await readRecords(paths))[0].cancellationRecovery;
        expect(report?.detail).toContain(
          'injected preservation metadata storage failure',
        );
        expect(report?.detail).toContain(
          'injected writer verification failure',
        );
      }
      storage.mockRestore();
      await recoverOrphans({
        paths,
        clientFor: () => client,
        timings: { reportTimeoutMs: 1 },
        log: () => {},
      });
      expect(await readRecords(paths)).toHaveLength(1);
      expect(existsSync(workDir)).toBe(true);
      await recoverOrphans({
        paths,
        clientFor: () => undefined,
        timings: {},
        log: () => {},
      });
      expect(await readRecords(paths)).toHaveLength(1);
      expect(existsSync(workDir)).toBe(true);
    } finally {
      vi.restoreAllMocks();
      syncBuiltinESMExports();
      await rm(root, { recursive: true, force: true });
    }
  },
);
