import { existsSync, readFileSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { RunWorker } from '../src/agent/worker.ts';
import { prepareDirs, taskWorkDir } from '../src/core/checkout.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { git, makeRemote, tempDir, removeDir } from './helpers.ts';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, writeFile: vi.fn(actual.writeFile) };
});

let root: string;
afterEach(() => {
  vi.restoreAllMocks();
  removeDir(root);
});

it('reports original disk exhaustion when recovery metadata also cannot be written, preserving files without a commit', async () => {
  root = tempDir('worker-disk-full-');
  const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
  const workDir = taskWorkDir(paths, 'app', 'task');
  const prepared = await prepareDirs({
    paths,
    workDir,
    appKey: 'app',
    subjectKey: 'task',
    dirs: [
      {
        kind: 'repo',
        url: makeRemote(root),
        defaultBranch: 'main',
        branch: 'agent/disk-full',
        path: 'repo',
      },
    ],
  });
  const repo = prepared.dirs[0]!.dir;
  const head = git(['rev-parse', 'HEAD'], repo);
  const draft = path.join(repo, 'draft');
  await fs.writeFile(draft, 'unpublished work');
  const report = vi.fn(async () => true);
  const worker: RunWorker = Object.create(RunWorker.prototype);
  Object.assign(worker, {
    runId: 'run',
    prepared: { workspace: { workDir } },
    payload: { workspace: { readOnly: false }, run: { id: 'run' } },
    delivered: new Set(['input']),
    usage: [],
    deps: {
      paths,
      log: vi.fn(),
      stopWriters: vi.fn(async () => {
        throw new Error('writer stop failed');
      }),
    },
    redactor: { text: (text: string) => text },
    stopTool: vi.fn(async () => {}),
    updateRecord: vi.fn(async () => {}),
    repoReports: vi.fn(async () => []),
    spool: { stop() {} },
    drainEvents: vi.fn(async () => {}),
    report,
  });
  const actual =
    await vi.importActual<typeof import('node:fs/promises')>(
      'node:fs/promises',
    );
  const metadata = vi
    .spyOn(fs, 'writeFile')
    .mockImplementation(async (file, ...args) => {
      if (String(file).includes('/workspaces/'))
        throw Object.assign(new Error('secondary ENOSPC'), { code: 'ENOSPC' });
      return actual.writeFile(file, ...args);
    });
  expect(
    await worker['finishFailed']('runnerDiskFull', 'original ENOSPC'),
  ).toBe('failed');
  expect(metadata).toHaveBeenCalled();
  expect(report).toHaveBeenCalledWith(
    expect.stringContaining('/fail'),
    expect.objectContaining({
      reason: 'runnerDiskFull',
      handledInputIds: ['input'],
      detail: expect.stringContaining('original ENOSPC'),
    }),
  );
  expect(worker['retainWorkspace']).toBe(true);
  expect(readFileSync(draft, 'utf8')).toBe('unpublished work');
  expect(git(['rev-parse', 'HEAD'], repo)).toBe(head);
  metadata.mockRestore();
  await worker['saveLocal']();
  expect(existsSync(workDir)).toBe(true);
});
