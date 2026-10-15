import { mkdirSync, writeFileSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { workspaceRecordPath } from '../src/core/checkout.ts';
import { collectWorkspaces } from '../src/core/workspaces.ts';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import { removeDir, tempDir } from './helpers.ts';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readdir: vi.fn(actual.readdir),
    lstat: vi.fn(actual.lstat),
  };
});

describe('what a collection round reads', () => {
  let home: string;
  let paths: RunnerPaths;

  beforeEach(() => {
    home = tempDir('nocobase-runner-collection-cost-');
    paths = runnerPaths(home, `${home}-work`);
  });

  afterEach(() => {
    vi.clearAllMocks();
    removeDir(home);
    removeDir(`${home}-work`);
  });

  it('never walks the contents of a working directory', async () => {
    const workDir = path.join(paths.workRoot, 'app', 'busy-task');
    mkdirSync(path.join(workDir, 'node_modules', 'pkg', 'lib'), {
      recursive: true,
    });
    writeFileSync(path.join(workDir, 'node_modules', 'pkg', 'lib', 'a.js'), '');
    const record = workspaceRecordPath(paths, workDir);
    mkdirSync(path.dirname(record), { recursive: true });
    writeFileSync(
      record,
      JSON.stringify({
        appKey: 'app',
        subjectKey: 'busy-task',
        repos: [],
        lastRunId: 'run-1',
        lastUsedAt: new Date().toISOString(),
      }),
    );
    const inside = (target: unknown): boolean =>
      String(target).startsWith(`${workDir}${path.sep}`) ||
      String(target) === workDir;

    for (let round = 0; round < 2; round += 1) {
      const result = await collectWorkspaces({ paths, threshold: null });
      expect(result.entries.map((entry) => entry.workDir)).toEqual([workDir]);
      expect(result.entries[0]).not.toHaveProperty('sizeBytes');
    }
    expect(
      vi.mocked(fs.readdir).mock.calls.filter(([target]) => inside(target)),
    ).toEqual([]);
    expect(
      vi.mocked(fs.lstat).mock.calls.filter(([target]) => inside(target)),
    ).toEqual([]);
  });
});
