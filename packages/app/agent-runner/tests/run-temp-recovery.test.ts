import * as childProcess from 'node:child_process';
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  allocateRunTemp,
  cleanupRunTemp,
  gcRunTemps,
  runTempRoot,
} from '../src/core/run-temp.ts';
import {
  readRecords,
  recoverRun,
  Supervisor,
  writeRecord,
  type RunRecord,
} from '../src/core/supervisor.ts';
import { runnerPaths } from '../src/lib/home.ts';
import type { ApiClient } from '../src/lib/http.ts';
import type { RunPayload } from '../src/protocol/index.ts';
import { removeDir, tempDir } from './helpers.ts';

vi.mock('node:fs/promises', async (original) => {
  const actual = await original<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readdir: vi.fn(actual.readdir),
    mkdir: vi.fn(actual.mkdir),
  };
});
vi.mock('node:child_process', async (original) => {
  const actual = await original<typeof import('node:child_process')>();
  return { ...actual, spawn: vi.fn(actual.spawn) };
});

function signal() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('temporary cleanup during supervisor recovery and GC', () => {
  let home: string;
  let paths: ReturnType<typeof runnerPaths>;
  let root: string;
  const releases: (() => Promise<void>)[] = [];
  beforeEach(async () => {
    const actual =
      await vi.importActual<typeof import('node:fs/promises')>(
        'node:fs/promises',
      );
    vi.mocked(fs.readdir).mockImplementation(actual.readdir);
    vi.mocked(fs.mkdir).mockImplementation(actual.mkdir);
    home = tempDir('run-temp-recovery-');
    paths = runnerPaths(home, path.join(home, 'work'));
    root = await runTempRoot(paths);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    for (const release of releases.splice(0)) await release();
    await fs.rm(root, { recursive: true, force: true });
    removeDir(home);
  });

  const prepare = async () => {
    const workDir = path.join(paths.workRoot, 'app', 'attempt');
    await fs.mkdir(workDir, { recursive: true });
    const allocation = await allocateRunTemp(paths, workDir);
    await allocation.lock.release();
    const credentialsFile = path.join(home, 'synthetic-credential');
    await fs.writeFile(credentialsFile, '{}');
    const record: RunRecord = {
      runId: 'run',
      appKey: 'app',
      attempt: 1,
      firstSeq: 1,
      pid: 2147483647,
      phase: 'running',
      startedAt: new Date().toISOString(),
      workDir,
      credentialsFile,
      log: '',
    };
    await writeRecord(paths, record);
    return { allocation, record, credentialsFile };
  };

  // Pause actual GC inside readRecords, after it has acquired the real temporary lock.
  const pauseGc = async (dir: string) => {
    const actual =
      await vi.importActual<typeof import('node:fs/promises')>(
        'node:fs/promises',
      );
    const entered = signal();
    const resume = signal();
    const attempted = signal();
    vi.mocked(fs.readdir).mockImplementation(async (...args) => {
      if (String(args[0]) === paths.runsDir) {
        entered.resolve();
        await resume.promise;
      }
      return actual.readdir(...args);
    });
    vi.mocked(fs.mkdir).mockImplementation(async (...args) => {
      if (String(args[0]) === `${dir}.lock` && existsSync(`${dir}.lock`))
        attempted.resolve();
      return actual.mkdir(...args);
    });
    releases.push(async () => {
      resume.resolve();
    });
    const collecting = gcRunTemps(paths, true);
    await entered.promise;
    return { collecting, attempted, resume };
  };

  it.each(['cleanup', 'recover'] as const)(
    '%s waits for GC to check the still-present record, then finishes',
    async (mode) => {
      const { allocation, record, credentialsFile } = await prepare();
      const gc = await pauseGc(allocation.dir);
      const request = vi.fn(async () => ({}));
      const log = vi.fn();
      const cleaning =
        mode === 'cleanup'
          ? cleanupRunTemp(paths, record.workDir!)
          : recoverRun(record, {
              paths,
              clientFor: () => ({ request }) as unknown as ApiClient,
              timings: { reportTimeoutMs: 1_000 },
              log,
              reason: 'leaseExpired',
              detail: 'worker exited',
            });
      try {
        await gc.attempted.promise;
        expect(existsSync(allocation.dir)).toBe(true);
        expect(existsSync(credentialsFile)).toBe(true);
        expect((await fs.lstat(`${allocation.dir}.lock`)).isDirectory()).toBe(
          true,
        );
      } finally {
        gc.resume.resolve();
      }
      expect(await gc.collecting).toEqual([]);
      await cleaning;
      expect(existsSync(allocation.dir)).toBe(false);
      if (mode === 'recover') {
        expect(existsSync(credentialsFile)).toBe(false);
        expect(await readRecords(paths)).toEqual([]);
        expect(
          request.mock.calls.some((call) => String(call[1]).endsWith('/fail')),
        ).toBe(true);
        expect(log.mock.calls.flat().join('\n')).not.toContain(
          'temporary directory retained',
        );
      }
    },
  );

  it.each(['released', 'timeout'] as const)(
    'supervisor exit completes when the GC lock is %s',
    async (mode) => {
      const { allocation, record, credentialsFile } = await prepare();
      // Only worker process delivery is controlled; afterExit/recoverRun, files and GC are real.
      const child = Object.assign(new EventEmitter(), {
        pid: record.pid,
        stdin: Object.assign(new EventEmitter(), { end: vi.fn() }),
      });
      vi.mocked(childProcess.spawn).mockReturnValueOnce(
        child as unknown as childProcess.ChildProcess,
      );
      const request = vi.fn(async () => ({}));
      const log = vi.fn();
      const onExit = vi.fn();
      const supervisor = new Supervisor({
        paths,
        clientFor: () => ({ request }) as unknown as ApiClient,
        timings: { reportTimeoutMs: 1_000, processScanMs: 10 },
        log,
        onExit,
      });
      const run = await supervisor.spawn('app', {
        run: { id: 'run', attempt: 1, firstSeq: 1 },
        tool: { kind: 'claude' },
        subject: { key: 'attempt', url: 'http://app.test/attempt' },
        workspace: { readOnly: false, dirs: [] },
      } as RunPayload);
      await writeRecord(paths, record);
      const gc = await pauseGc(allocation.dir);
      try {
        child.emit('exit', 1, null);
        await gc.attempted.promise;
        expect(await gcRunTemps(paths, true)).toEqual([]);
        expect(existsSync(allocation.dir)).toBe(true);
        if (mode === 'released') gc.resume.resolve();
        // The timeout variant deliberately keeps GC paused beyond the two-second cleanup bound.
        await run.exited;
        expect(onExit).toHaveBeenCalledExactlyOnceWith('run');
        expect(supervisor.size).toBe(0);
        expect(existsSync(credentialsFile)).toBe(false);
        expect(
          request.mock.calls.some((call) => String(call[1]).endsWith('/fail')),
        ).toBe(true);
        expect(existsSync(path.join(paths.runsDir, 'run.json'))).toBe(false);
        expect(existsSync(allocation.dir)).toBe(mode === 'timeout');
        if (mode === 'timeout')
          expect(log.mock.calls.flat().join('\n')).toContain(
            'WorkspaceBusyError',
          );
      } finally {
        gc.resume.resolve();
      }
      await gc.collecting;
      await gcRunTemps(paths, true);
      expect(existsSync(allocation.dir)).toBe(false);
    },
    7_000,
  );
});
