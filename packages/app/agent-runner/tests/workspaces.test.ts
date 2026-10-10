// Collecting working directories: what is counted as unpushed, which directories the application's word and a low disk
// remove, and which are never removed.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  acquireLock,
  cachePath,
  checkout,
  gcWorkspaces,
  legacyMetaPath,
  markWorkspaceEnded,
  readWorkspaceMeta,
  reportRepos,
  workspaceRecordPath,
  type Checkout,
  type WorkspaceMeta,
} from '../src/core/checkout.ts';
import { isInside } from '../src/lib/paths.ts';
import {
  collectWorkspaces,
  lowOnDisk,
  planRemovals,
  readDisk,
  scanWorkspaces,
  workspaceDisk,
  workspacesRequest,
  type ReadDisk,
  type WorkspaceEntry,
} from '../src/core/workspaces.ts';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import {
  formatFreeSpace,
  formatSize,
  minFreeBytes,
  parseAge,
  parseFreeSpace,
  parseSize,
} from '../src/lib/size.ts';
import type {
  WorkspacesRequest,
  WorkspacesResponse,
} from '../src/protocol/index.ts';
import { git, makeRemote, removeDir, tempDir } from './helpers.ts';

const GB = 1024 ** 3;

/** A 100 GB disk with `free` free, and `perRemoval` more for each of `dirs` that is gone. */
const fakeDisk = (
  free: number,
  dirs: readonly string[] = [],
  perRemoval = 0,
): ReadDisk & { reads: number } => {
  const read = Object.assign(
    () => {
      read.reads += 1;
      return Promise.resolve({
        totalBytes: 100 * GB,
        freeBytes:
          free + dirs.filter((dir) => !existsSync(dir)).length * perRemoval,
      });
    },
    { reads: 0 },
  );
  return read;
};

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
    await markWorkspaceEnded(paths, prepared.workDir, reports);
    return prepared;
  };

  const commit = (dir: string, file: string) => {
    writeFileSync(path.join(dir, file), `${file}\n`);
    git(['add', file], dir);
    git([...COMMIT, 'commit', '--quiet', '-m', file], dir);
  };

  const meta = (workDir: string): WorkspaceMeta =>
    JSON.parse(
      readFileSync(workspaceRecordPath(paths, workDir), 'utf8'),
    ) as WorkspaceMeta;

  /** What an agent may write in its work directory, posing as the runner's record. */
  const forgeRecord = (workDir: string, record: Record<string, unknown>) => {
    mkdirSync(path.dirname(legacyMetaPath(workDir)), { recursive: true });
    writeFileSync(legacyMetaPath(workDir), JSON.stringify(record));
  };

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

  it('records the last run, and checks unpushed work once the run is over', async () => {
    const done = await finishedRun('TASK-1', 'run-1', (dir) =>
      commit(dir, 'a.txt'),
    );
    expect(meta(done.workDir).lastRunId).toBe('run-1');
    const [entry] = await scanWorkspaces(paths);
    expect(entry).toMatchObject({
      workDir: done.workDir,
      appKey: 'acme',
      subjectKey: 'TASK-1',
      lastRunId: 'run-1',
      unpushed: false,
      inUse: false,
    });
    expect(entry).not.toHaveProperty('sizeBytes');
    expect(meta(done.workDir)).toMatchObject({ unpushed: false });
    expect(meta(done.workDir).measuredAt).toBeDefined();
  });

  it('counts uncommitted changes, untracked files included, as unpushed', async () => {
    await finishedRun('TASK-1', 'run-1', (dir) =>
      writeFileSync(path.join(dir, 'notes.md'), 'draft\n'),
    );
    const [entry] = await scanWorkspaces(paths);
    expect(entry.unpushed).toBe(true);
  });

  it('counts commits the remote task branch lacks as unpushed', async () => {
    const prepared = await checkout({
      paths,
      appKey: 'acme',
      subjectKey: 'TASK-1',
      runId: 'run-1',
      dirs: [
        {
          kind: 'repo',
          url: remote,
          defaultBranch: 'main',
          branch: 'agent/TASK-1',
          path: 'app',
        },
      ],
    });
    commit(path.join(prepared.workDir, 'app'), 'a.txt');
    await prepared.release();
    // The push failed (or the run died before it).
    await markWorkspaceEnded(paths, prepared.workDir, [
      {
        url: remote,
        branch: 'agent/TASK-1',
        pushed: false,
        headSha: git(['rev-parse', 'HEAD'], path.join(prepared.workDir, 'app')),
      },
    ]);
    const [entry] = await scanWorkspaces(paths);
    expect(entry.unpushed).toBe(true);
  });

  it('does not judge a pushed branch by the default branch, so a squash-merged one is not unpushed', async () => {
    const done = await finishedRun('TASK-1', 'run-1', (dir) =>
      commit(dir, 'a.txt'),
    );
    // The branch's commit is on the remote task branch, never on main (as after a squash merge).
    const bare = remote.replace(/^file:\/\//u, '');
    expect(git(['branch', '--contains', 'agent/TASK-1'], bare)).not.toContain(
      'main',
    );
    const [entry] = await scanWorkspaces(paths, { force: true });
    expect(entry.unpushed).toBe(false);
    expect(meta(done.workDir).repos[0]?.pushedSha).toBe(
      git(['rev-parse', 'HEAD'], path.join(done.workDir, 'app')),
    );
  });

  it("keeps its record out of the agent's reach, and believes nothing the agent writes in its work directory", async () => {
    const done = await finishedRun('TASK-1', 'run-1');
    commit(path.join(done.workDir, 'app'), 'unpushed.txt');
    // The record lives in the runner's own directory, which agents are kept from.
    expect(isInside(paths.home, workspaceRecordPath(paths, done.workDir))).toBe(
      true,
    );
    expect(existsSync(legacyMetaPath(done.workDir))).toBe(false);
    // A record the agent writes in its work directory, claiming nothing is there to push.
    forgeRecord(done.workDir, {
      subjectKey: 'TASK-1',
      repos: [],
      pushed: true,
      lastUsedAt: '2000-01-01T00:00:00.000Z',
    });
    // Moving the remote-tracking ref along does not make the commit pushed either.
    git(
      ['update-ref', 'refs/remotes/origin/agent/TASK-1', 'HEAD'],
      path.join(done.workDir, 'app'),
    );
    const [entry] = await scanWorkspaces(paths, { force: true });
    expect(entry.unpushed).toBe(true);
    const { reporters } = reporter({ remove: ['run-1'] });
    const result = await collectWorkspaces({
      paths,
      reporters,
      threshold: { percent: 50 },
      readDisk: fakeDisk(0),
    });
    expect(result.removed).toEqual([]);
    expect(existsSync(done.workDir)).toBe(true);
  });

  it("checks an earlier runner's record: caches derived from the URL, paths inside the work directory, pushed ignored", async () => {
    const workDir = path.join(paths.workRoot, 'acme', 'TASK-9');
    mkdirSync(path.join(workDir, 'app'), { recursive: true });
    forgeRecord(workDir, {
      appKey: 'acme',
      subjectKey: 'TASK-9',
      repos: [
        {
          url: remote,
          path: 'app',
          cache: path.join(root, 'elsewhere.git'),
          branch: 'agent/TASK-9',
          pushedSha: 'a'.repeat(40),
        },
        {
          url: remote,
          path: '../TASK-8/app',
          cache: path.join(root, 'elsewhere.git'),
          branch: 'agent/TASK-8',
        },
        { url: remote, path: '.nocobase-runner/x', cache: '', branch: 'b' },
      ],
      pushed: true,
      lastUsedAt: '2026-10-01T00:00:00.000Z',
    });
    const read = await readWorkspaceMeta(paths, workDir);
    expect(read).toMatchObject({
      legacy: true,
      repos: [
        {
          url: remote,
          path: 'app',
          cache: cachePath(paths, remote),
          branch: 'agent/TASK-9',
        },
      ],
    });
    expect(read).not.toHaveProperty('pushed');
    expect(read?.repos[0]).not.toHaveProperty('pushedSha');
  });

  it('keeps a directory idle past the retention rules while it holds unpushed work', async () => {
    const idle = await finishedRun('TASK-1', 'run-1', (dir) =>
      writeFileSync(path.join(dir, 'notes.md'), 'draft\n'),
    );
    const day = 24 * 60 * 60 * 1000;
    expect(await gcWorkspaces({ paths, now: Date.now() + 31 * day })).toEqual(
      [],
    );
    expect(existsSync(idle.workDir)).toBe(true);
  });

  it("reports each application's directories and removes those whose work is over", async () => {
    const ended = await finishedRun('TASK-1', 'run-1');
    const ongoing = await finishedRun('TASK-2', 'run-2');
    const { requests, reporters } = reporter({
      remove: ['run-1'],
      keep: ['run-2'],
    });
    const result = await collectWorkspaces({
      paths,
      reporters,
      threshold: { percent: 10 },
      readDisk: fakeDisk(50 * GB),
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]?.disk).toEqual({
      freeBytes: 50 * GB,
      totalBytes: 100 * GB,
      minFreeBytes: 10 * GB,
    });
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
    const done = await finishedRun('TASK-1', 'run-1', (dir) =>
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
    const done = await finishedRun('TASK-1', 'run-1');
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

  it('removes nothing on its own without an application that answers, even on a low disk, and warns once', async () => {
    await finishedRun('TASK-1', 'run-1');
    await finishedRun('TASK-2', 'run-2');
    const threshold = { bytes: 5 * GB };
    const logs: string[] = [];
    const log = (message: string) => logs.push(message);
    const roomy = await collectWorkspaces({
      paths,
      threshold,
      readDisk: fakeDisk(50 * GB),
      log,
    });
    expect(roomy.removed).toEqual([]);
    expect(roomy.low).toBe(false);
    // No threshold, or a file system that cannot say: no warning either.
    for (const options of [
      { threshold: null, readDisk: fakeDisk(0) },
      { threshold, readDisk: () => Promise.resolve(undefined) },
    ])
      expect((await collectWorkspaces({ paths, log, ...options })).low).toBe(
        false,
      );
    expect(logs.filter((line) => line.includes('is low'))).toEqual([]);

    const low = await collectWorkspaces({
      paths,
      threshold,
      readDisk: fakeDisk(GB),
      log,
    });
    expect(low.removed).toEqual([]);
    expect(low.low).toBe(true);
    const warnings = logs.filter((line) => line.includes('is low'));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('2 pushed working directories');
    expect(warnings[0]).toContain('0 with unpushed work');
    expect(warnings[0]).toContain('`nocobase-runner gc`');
  });

  it('on a low disk removes only what the application settled, least recently used first, never work that goes on', async () => {
    const settledOld = await finishedRun('TASK-1', 'run-1');
    const ongoing = await finishedRun('TASK-2', 'run-2');
    const unpushed = await finishedRun('TASK-3', 'run-3', (dir) =>
      writeFileSync(path.join(dir, 'notes.md'), 'draft\n'),
    );
    const settledNew = await finishedRun('TASK-4', 'run-4');
    const { reporters } = reporter({
      remove: ['run-4', 'run-1'],
      keep: ['run-2', 'run-3'],
    });
    const logs: string[] = [];
    const result = await collectWorkspaces({
      paths,
      reporters,
      threshold: { bytes: 5 * GB },
      readDisk: fakeDisk(0),
      log: (message) => logs.push(message),
    });
    expect(result.removed).toEqual([
      { workDir: settledOld.workDir, reason: 'ended' },
      { workDir: settledNew.workDir, reason: 'ended' },
    ]);
    expect(existsSync(ongoing.workDir)).toBe(true);
    expect(existsSync(unpushed.workDir)).toBe(true);
    const warnings = logs.filter((line) => line.includes('is low'));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('1 pushed working directory whose');
    expect(warnings[0]).toContain('1 with unpushed work');
  });

  it('leaves the shared pnpm store under the work root alone', async () => {
    const store = path.join(paths.pnpmStoreDir, 'v10', 'files');
    mkdirSync(store, { recursive: true });
    writeFileSync(path.join(store, 'pkg'), 'x');
    expect(await scanWorkspaces(paths)).toEqual([]);
    const day = 24 * 60 * 60 * 1000;
    await gcWorkspaces({ paths, now: Date.now() + 365 * day });
    await collectWorkspaces({
      paths,
      threshold: { percent: 99 },
      readDisk: fakeDisk(0),
    });
    expect(existsSync(path.join(store, 'pkg'))).toBe(true);
  });

  it('describes a directory for the application by its last run', async () => {
    await finishedRun('TASK-1', 'run-1');
    const entries = await scanWorkspaces(paths);
    const request = workspacesRequest(entries, 'acme', undefined);
    expect(request).not.toHaveProperty('disk');
    expect(request.workspaces).toEqual([
      {
        runId: 'run-1',
        workDir: entries[0]?.workDir,
        unpushed: false,
        lastUsedAt: entries[0]?.lastUsedAt,
      },
    ]);
    expect(workspacesRequest(entries, 'crm', undefined).workspaces).toEqual([]);
  });
});

describe('what goes', () => {
  let day = 0;
  const entry = (
    subjectKey: string,
    options: Partial<WorkspaceEntry> = {},
  ): WorkspaceEntry => ({
    workDir: `/work/acme/${subjectKey}`,
    appKey: 'acme',
    subjectKey,
    lastRunId: `run-${subjectKey}`,
    lastUsedAt: new Date(Date.UTC(2026, 9, 1 + (day += 1))).toISOString(),
    unpushed: false,
    inUse: false,
    status: 'unknown',
    ...options,
  });
  const removed = (plan: ReturnType<typeof planRemovals>) =>
    plan.remove.map((item) => `${item.entry.subjectKey}:${item.reason}`);

  it('removes ended work least recently used first, never unpushed or busy ones, and nothing else', () => {
    const entries = [
      entry('old-unpushed', { unpushed: true }),
      entry('old'),
      entry('busy', { inUse: true }),
      entry('active', { status: 'active' }),
      entry('ended-newer', {
        status: 'ended',
        lastUsedAt: '2026-12-01T00:00:00.000Z',
      }),
      entry('ended', { status: 'ended' }),
      entry('ended-unpushed', { status: 'ended', unpushed: true }),
      entry('newest'),
    ];
    const plan = planRemovals(entries);
    expect(removed(plan)).toEqual(['ended:ended', 'ended-newer:ended']);
    expect(
      plan.kept.map((item) => `${item.entry.subjectKey}:${item.reason}`),
    ).toEqual(['ended-unpushed:unpushed']);
  });

  it('picks by filters instead, and removes unpushed work only when forced', () => {
    const now = Date.UTC(2026, 11, 1);
    const entries = [
      entry('TASK-81', { unpushed: true }),
      entry('TASK-82'),
      entry('TASK-83', { lastUsedAt: new Date(now).toISOString() }),
    ];
    expect(
      removed(planRemovals(entries, { now, filters: { subject: 'TASK-81' } })),
    ).toEqual([]);
    expect(
      removed(
        planRemovals(entries, {
          now,
          filters: { subject: 'TASK-81' },
          force: true,
        }),
      ),
    ).toEqual(['TASK-81:selected']);
    expect(
      removed(
        planRemovals(entries, {
          now,
          filters: { olderThanMs: 14 * 86_400_000 },
        }),
      ),
    ).toEqual(['TASK-82:selected']);
    expect(
      removed(planRemovals(entries, { now, filters: { ended: true } })),
    ).toEqual([]);
  });
});

describe('the disk', () => {
  it('is read from the file system, without measuring any directory', async () => {
    const root = tempDir('nocobase-runner-disk-');
    try {
      const disk = await readDisk(root);
      expect(disk?.totalBytes).toBeGreaterThan(0);
      expect(disk?.freeBytes).toBeGreaterThanOrEqual(0);
      expect(disk?.freeBytes).toBeLessThanOrEqual(disk?.totalBytes ?? 0);
      // A work root not created yet: the disk it will be created on.
      expect(
        (await readDisk(path.join(root, 'missing', 'work')))?.totalBytes,
      ).toBe(disk?.totalBytes);
    } finally {
      removeDir(root);
    }
  });

  it('is low below the threshold, in bytes or as a share of the disk', () => {
    const disk = { freeBytes: 8 * GB, totalBytes: 100 * GB };
    expect(lowOnDisk(disk, { percent: 10 })).toBe(true);
    expect(lowOnDisk(disk, { percent: 5 })).toBe(false);
    expect(lowOnDisk(disk, { bytes: 9 * GB })).toBe(true);
    expect(lowOnDisk(disk, null)).toBe(false);
    expect(lowOnDisk(undefined, { percent: 10 })).toBe(false);
    expect(workspaceDisk(disk, { percent: 10 })).toEqual({
      freeBytes: 8 * GB,
      totalBytes: 100 * GB,
      minFreeBytes: 10 * GB,
    });
    expect(workspaceDisk(disk, null)).not.toHaveProperty('minFreeBytes');
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
    expect(parseFreeSpace('20G', 'min')).toEqual({ bytes: 20 * GB });
    expect(parseFreeSpace('10%', 'min')).toEqual({ percent: 10 });
    expect(parseFreeSpace('2.5 %', 'min')).toEqual({ percent: 2.5 });
    expect(parseFreeSpace('off', 'min')).toBeNull();
    expect(() => parseFreeSpace('100%', 'min')).toThrow(/10%/u);
    expect(() => parseFreeSpace('lots', 'min')).toThrow(/20G/u);
    expect(minFreeBytes({ percent: 10 }, 200 * GB)).toBe(20 * GB);
    expect(minFreeBytes({ bytes: GB }, 200 * GB)).toBe(GB);
    expect(formatFreeSpace({ percent: 10 })).toBe('10%');
    expect(formatFreeSpace({ bytes: 20 * GB })).toBe('20.0 GB');
  });
});
