import { existsSync, readFileSync } from 'node:fs';
import * as syncfs from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RunWorker } from '../src/agent/worker.ts';
import { prepareDirs, readWorkspaceMeta } from '../src/core/checkout.ts';
import { EventSpool } from '../src/core/events.ts';
import { runWorkDir } from '../src/core/run-worktrees.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { makeRemote, tempDir, removeDir } from './helpers.ts';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, writeFile: vi.fn(actual.writeFile) };
});
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return { ...actual, appendFileSync: vi.fn(actual.appendFileSync) };
});

describe('disk-full failure reporting with secondary local write failures', () => {
  const roots: string[] = [];
  beforeEach(async () => {
    const actualFs =
      await vi.importActual<typeof import('node:fs/promises')>(
        'node:fs/promises',
      );
    const actualSync =
      await vi.importActual<typeof import('node:fs')>('node:fs');
    vi.mocked(fs.writeFile).mockImplementation(actualFs.writeFile);
    vi.mocked(syncfs.appendFileSync).mockImplementation(
      actualSync.appendFileSync,
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const root of roots.splice(0)) removeDir(root);
  });

  it.each(['metadata', 'event-append'] as const)(
    'reports the dedicated failure despite %s ENOSPC using the real finalizer and spool',
    async (fault) => {
      const root = tempDir('worker-disk-full-');
      roots.push(root);
      const paths = runnerPaths(
        path.join(root, 'home'),
        path.join(root, 'work'),
      );
      const remote = makeRemote(root);
      const workDir = runWorkDir(paths, 'app', 'task', 'run', 1);
      await prepareDirs({
        paths,
        workDir,
        appKey: 'app',
        subjectKey: 'task',
        runId: 'run',
        perRun: true,
        dirs: [
          {
            kind: 'repo',
            url: remote,
            defaultBranch: 'main',
            branch: 'agent/disk-full',
            path: 'repo',
          },
        ],
      });
      const draft = path.join(workDir, 'repo/draft');
      await fs.writeFile(draft, 'unpublished work');
      const stopWriters = vi.fn(async () => {
        if (fault === 'metadata') throw new Error('writer stop failed');
      });
      const report = vi.fn(async () => ({}));
      const spool = EventSpool.open({
        runsDir: paths.runsDir,
        runId: 'run',
        firstSeq: 1,
        client: {} as Parameters<typeof EventSpool.open>[0]['client'],
      });
      // Drive the failure boundary directly while retaining the actual local preservation and event I/O.
      const worker: RunWorker = Object.create(RunWorker.prototype);
      Object.assign(worker, {
        runId: 'run',
        prepared: { workspace: { workDir } },
        payload: { workspace: { readOnly: false }, run: { id: 'run' } },
        delivered: new Set(['input']),
        usage: [],
        deps: { paths, log: vi.fn(), stopWriters },
        redactor: { text: (text: string) => text },
        stopTool: vi.fn(async () => {}),
        updateRecord: vi.fn(async () => {}),
        repoReports: vi.fn(async () => []),
        spool,
        drainEvents: vi.fn(async () => {}),
        report,
      });
      const full = () =>
        Object.assign(new Error('secondary ENOSPC'), { code: 'ENOSPC' });
      const actual =
        await vi.importActual<typeof import('node:fs/promises')>(
          'node:fs/promises',
        );
      const metadata = vi
        .spyOn(fs, 'writeFile')
        .mockImplementation(async (file, ...args) => {
          if (fault === 'metadata' && String(file).includes('/workspaces/'))
            throw full();
          return actual.writeFile(file, ...args);
        });
      const append = vi
        .spyOn(syncfs, 'appendFileSync')
        .mockImplementation(() => {
          throw full();
        });
      try {
        expect(
          await worker['finishFailed']('runnerDiskFull', 'original ENOSPC'),
        ).toBe('failed');
        expect(stopWriters).toHaveBeenCalledOnce();
        expect(report).toHaveBeenCalledOnce();
        expect(report.mock.calls[0]).toEqual([
          expect.stringContaining('/fail'),
          expect.objectContaining({
            reason: 'runnerDiskFull',
            handledInputIds: ['input'],
            detail: expect.stringContaining('original ENOSPC'),
          }),
        ]);
        expect(readFileSync(draft, 'utf8')).toBe('unpublished work');
        const detail = (
          report.mock.calls[0] as unknown as [string, { detail: string }]
        )[1].detail;
        if (fault === 'metadata') {
          expect(metadata).toHaveBeenCalled();
          expect(detail).toContain('Local preservation did not finish');
          expect(detail).not.toContain('Local continuation saved');
          expect(worker['retainWorkspace']).toBe(true);
          metadata.mockRestore();
          // The shutdown retry also preserves the original directory when metadata writes recover.
          await worker['saveLocal'](!worker['retainWorkspace'], true);
          expect(existsSync(workDir)).toBe(true);
        } else {
          expect(append).toHaveBeenCalled();
          expect(detail).toContain('Local continuation saved');
          expect(detail).toContain('Local save event could not be recorded');
          expect(
            (await readWorkspaceMeta(paths, workDir))?.recoveryRequired,
          ).not.toBe(true);
        }
      } finally {
        spool.stop();
      }
    },
  );
});
