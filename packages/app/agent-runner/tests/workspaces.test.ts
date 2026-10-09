// Collecting working directories: what is measured and counted as unpushed, which directories the application's word
// and the owner's limit remove, and which are never removed.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  acquireLock,
  checkout,
  markWorkspaceEnded,
  metaPath,
  reportRepos,
  type Checkout,
  type WorkspaceMeta,
} from '../src/core/checkout.ts';
import {
  collectWorkspaces,
  planRemovals,
  scanWorkspaces,
  workspacesRequest,
  type WorkspaceEntry,
} from '../src/core/workspaces.ts';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import { formatSize, parseAge, parseSize } from '../src/lib/size.ts';
import type {
  WorkspacesRequest,
  WorkspacesResponse,
} from '../src/protocol/index.ts';
import { git, makeRemote, removeDir, tempDir } from './helpers.ts';

const COMMIT = [
  '-c',
  'user.name=A',
  '-c',
  'user.email=a@example.com',
  '-c',
  'commit.gpgsign=false',
];

describe('working directories', () => {
  let root: string;
  let paths: RunnerPaths;
  let remote: string;

  beforeEach(() => {
    root = tempDir('nocobase-runner-workspaces-');
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    remote = makeRemote(root);
  });
  afterEach(() => removeDir(root));

  /** A finished run of `key` in its own directory: checked out, released, ended with `pushed`. */
  const finishedRun = async (
    key: string,
    runId: string,
    work?: (dir: string) => void,
  ): Promise<Checkout> => {
    const prepared = await checkout({
      paths,
      appKey: 'acme',
      subjectKey: key,
      runId,
      dirs: [
        {
          kind: 'repo',
          url: remote,
          defaultBranch: 'main',
          branch: `agent/${key}`,
          path: 'app',
        },
      ],
    });
    work?.(path.join(prepared.workDir, 'app'));
    const reports = await reportRepos(prepared.repos, { push: true });
    await prepared.release();
    await markWorkspaceEnded(
      prepared.workDir,
      reports.every((report) => report.pushed),
    );
    return prepared;
  };

  const commit = (dir: string, file: string) => {
    writeFileSync(path.join(dir, file), `${file}\n`);
    git(['add', file], dir);
    git([...COMMIT, 'commit', '--quiet', '-m', file], dir);
  };

  const meta = (workDir: string): WorkspaceMeta =>
    JSON.parse(readFileSync(metaPath(workDir), 'utf8')) as WorkspaceMeta;

  /** A reporter that answers `answer` and keeps what it was told. */
  const reporter = (answer: Partial<WorkspacesResponse>) => {
    const requests: WorkspacesRequest[] = [];
    const report = (request: WorkspacesRequest) => {
      requests.push(request);
      return Promise.resolve({
        remove: answer.remove ?? [],
        keep: answer.keep ?? [],
      });
    };
    return { requests, reporters: new Map([['acme', report]]) };
  };

  it('records the last run, and measures size and unpushed work once the run is over', async () => {
    const done = await finishedRun('PM-1', 'run-1', (dir) =>
      commit(dir, 'a.txt'),
    );
    expect(meta(done.workDir).lastRunId).toBe('run-1');
    const [entry] = await scanWorkspaces(paths);
    expect(entry).toMatchObject({
      workDir: done.workDir,
      appKey: 'acme',
      subjectKey: 'PM-1',
      lastRunId: 'run-1',
      unpushed: false,
      inUse: false,
    });
    expect(entry.sizeBytes).toBeGreaterThan(0);
    expect(meta(done.workDir)).toMatchObject({
      sizeBytes: entry.sizeBytes,
      unpushed: false,
    });
  });

  it('counts uncommitted changes, untracked files included, as unpushed', async () => {
    await finishedRun('PM-1', 'run-1', (dir) =>
      writeFileSync(path.join(dir, 'notes.md'), 'draft\n'),
    );
    const [entry] = await scanWorkspaces(paths);
    expect(entry.unpushed).toBe(true);
  });

  it('counts commits the remote task branch lacks as unpushed', async () => {
    const prepared = await checkout({
      paths,
      appKey: 'acme',
      subjectKey: 'PM-1',
      runId: 'run-1',
      dirs: [
        {
          kind: 'repo',
          url: remote,
          defaultBranch: 'main',
          branch: 'agent/PM-1',
          path: 'app',
        },
      ],
    });
    commit(path.join(prepared.workDir, 'app'), 'a.txt');
    await prepared.release();
    // The push failed (or the run died before it).
    await markWorkspaceEnded(prepared.workDir, false);
    const [entry] = await scanWorkspaces(paths);
    expect(entry.unpushed).toBe(true);
  });

  it('does not judge a pushed branch by the default branch, so a squash-merged one is not unpushed', async () => {
    const done = await finishedRun('PM-1', 'run-1', (dir) =>
      commit(dir, 'a.txt'),
    );
    // The branch's commit is on the remote task branch, never on main (as after a squash merge).
    const bare = remote.replace(/^file:\/\//u, '');
    expect(git(['branch', '--contains', 'agent/PM-1'], bare)).not.toContain(
      'main',
    );
    // Even with the run's record lost, the checkout's tracking ref says the remote has it.
    const record = meta(done.workDir);
    delete record.pushed;
    writeFileSync(metaPath(done.workDir), JSON.stringify(record));
    const [entry] = await scanWorkspaces(paths, { force: true });
    expect(entry.unpushed).toBe(false);
  });

  it("reports each application's directories and removes those whose work is over", async () => {
    const ended = await finishedRun('PM-1', 'run-1');
    const ongoing = await finishedRun('PM-2', 'run-2');
    const { requests, reporters } = reporter({
      remove: ['run-1'],
      keep: ['run-2'],
    });
    const result = await collectWorkspaces({
      paths,
      reporters,
      limitBytes: 1024 ** 4,
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ limitBytes: 1024 ** 4 });
    expect(
      requests[0]?.workspaces.map(({ runId, workDir, unpushed }) => ({
        runId,
        workDir,
        unpushed,
      })),
    ).toEqual(
      expect.arrayContaining([
        { runId: 'run-1', workDir: ended.workDir, unpushed: false },
        { runId: 'run-2', workDir: ongoing.workDir, unpushed: false },
      ]),
    );
    expect(result.removed).toEqual([
      { workDir: ended.workDir, reason: 'ended' },
    ]);
    expect(existsSync(ended.workDir)).toBe(false);
    expect(existsSync(ongoing.workDir)).toBe(true);
  });

  it('keeps a directory whose work is over but holds unpushed work, and marks it', async () => {
    const done = await finishedRun('PM-1', 'run-1', (dir) =>
      writeFileSync(path.join(dir, 'notes.md'), 'draft\n'),
    );
    const { reporters } = reporter({ remove: ['run-1'] });
    const result = await collectWorkspaces({ paths, reporters });
    expect(result.removed).toEqual([]);
    expect(result.kept).toEqual([
      { workDir: done.workDir, reason: 'unpushed' },
    ]);
    expect(existsSync(done.workDir)).toBe(true);
    expect(meta(done.workDir).unpushed).toBe(true);
  });

  it('never touches a directory a run holds', async () => {
    const done = await finishedRun('PM-1', 'run-1');
    const lock = await acquireLock(`${done.workDir}.lock`);
    try {
      const { reporters } = reporter({ remove: ['run-1'] });
      const result = await collectWorkspaces({ paths, reporters });
      expect(result.removed).toEqual([]);
      expect(result.kept).toEqual([{ workDir: done.workDir, reason: 'inUse' }]);
      expect(existsSync(done.workDir)).toBe(true);
    } finally {
      await lock.release();
    }
  });

  it('removes nothing on its own without an application that answers, unless over the limit', async () => {
    const older = await finishedRun('PM-1', 'run-1');
    const newer = await finishedRun('PM-2', 'run-2');
    expect((await collectWorkspaces({ paths })).removed).toEqual([]);
    const result = await collectWorkspaces({ paths, limitBytes: 1 });
    // Over a limit nothing can meet, every pushed directory goes, least recently used first.
    expect(result.removed.map((item) => item.workDir)).toEqual([
      older.workDir,
      newer.workDir,
    ]);
  });

  it('describes a directory for the application by its last run', async () => {
    await finishedRun('PM-1', 'run-1');
    const entries = await scanWorkspaces(paths);
    const request = workspacesRequest(entries, 'acme', undefined);
    expect(request).not.toHaveProperty('limitBytes');
    expect(request.workspaces).toEqual([
      {
        runId: 'run-1',
        workDir: entries[0]?.workDir,
        sizeBytes: entries[0]?.sizeBytes,
        unpushed: false,
        lastUsedAt: entries[0]?.lastUsedAt,
      },
    ]);
    expect(workspacesRequest(entries, 'crm', undefined).workspaces).toEqual([]);
  });
});

describe('what goes', () => {
  const GB = 1024 ** 3;
  let day = 0;
  const entry = (
    subjectKey: string,
    sizeGb: number,
    options: Partial<WorkspaceEntry> = {},
  ): WorkspaceEntry => ({
    workDir: `/work/acme/${subjectKey}`,
    appKey: 'acme',
    subjectKey,
    lastRunId: `run-${subjectKey}`,
    lastUsedAt: new Date(Date.UTC(2026, 9, 1 + (day += 1))).toISOString(),
    sizeBytes: sizeGb * GB,
    unpushed: false,
    inUse: false,
    status: 'unknown',
    ...options,
  });
  const removed = (plan: ReturnType<typeof planRemovals>) =>
    plan.remove.map((item) => `${item.entry.subjectKey}:${item.reason}`);

  it('removes ended work first, then pushed directories least recently used, never unpushed or busy ones', () => {
    const entries = [
      entry('old-unpushed', 10, { unpushed: true }),
      entry('old', 5),
      entry('busy', 5, { inUse: true }),
      entry('active', 5, { status: 'active' }),
      entry('ended', 5, { status: 'ended' }),
      entry('ended-unpushed', 5, { status: 'ended', unpushed: true }),
      entry('newest', 5),
    ];
    const plan = planRemovals(entries, { limitBytes: 15 * GB });
    expect(removed(plan)).toEqual([
      'ended:ended',
      'old:overLimit',
      'active:overLimit',
      'newest:overLimit',
    ]);
    expect(
      plan.kept.map((item) => `${item.entry.subjectKey}:${item.reason}`),
    ).toEqual(['ended-unpushed:unpushed']);
    expect(plan.totalBytes).toBe(40 * GB);
    expect(plan.remainingBytes).toBe(20 * GB);
    expect(plan.overLimit).toBe(true);
  });

  it('removes only ended work while under the limit', () => {
    const plan = planRemovals(
      [entry('a', 1), entry('b', 1, { status: 'ended' })],
      { limitBytes: 10 * GB },
    );
    expect(removed(plan)).toEqual(['b:ended']);
    expect(plan.overLimit).toBe(false);
  });

  it('picks by filters instead, and removes unpushed work only when forced', () => {
    const now = Date.UTC(2026, 11, 1);
    const entries = [
      entry('PM-81', 1, { unpushed: true }),
      entry('PM-82', 1),
      entry('PM-83', 1, { lastUsedAt: new Date(now).toISOString() }),
    ];
    expect(
      removed(planRemovals(entries, { now, filters: { subject: 'PM-81' } })),
    ).toEqual([]);
    expect(
      removed(
        planRemovals(entries, {
          now,
          filters: { subject: 'PM-81' },
          force: true,
        }),
      ),
    ).toEqual(['PM-81:selected']);
    expect(
      removed(
        planRemovals(entries, {
          now,
          filters: { olderThanMs: 14 * 86_400_000 },
        }),
      ),
    ).toEqual(['PM-82:selected']);
    expect(
      removed(planRemovals(entries, { now, filters: { ended: true } })),
    ).toEqual([]);
  });
});

describe('sizes', () => {
  it('reads sizes and ages as people write them', () => {
    expect(parseSize('40G', 'limit')).toBe(40 * 1024 ** 3);
    expect(parseSize('512MB', 'limit')).toBe(512 * 1024 ** 2);
    expect(parseSize('1.5T', 'limit')).toBe(1.5 * 1024 ** 4);
    expect(parseSize('off', 'limit')).toBeUndefined();
    expect(() => parseSize('lots', 'limit')).toThrow(/40G/u);
    expect(parseAge('14d', 'age')).toBe(14 * 86_400_000);
    expect(formatSize(64.2 * 1024 ** 3)).toBe('64.2 GB');
    expect(formatSize(0)).toBe('0 B');
  });
});
