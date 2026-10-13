import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acquireLock,
  checkout,
  prepareDirs,
  readWorkspaceMeta,
  writeWorkspaceMeta,
  workspaceRecordPath,
} from '../src/core/checkout.ts';
import {
  finalizeRunWorktrees,
  runWorkDir,
  continuationWorkDir,
  updateContinuationState,
} from '../src/core/run-worktrees.ts';
import {
  collectWorkspaces,
  listWorkspaceDirs,
  scanWorkspaces,
  workspacesRequest,
} from '../src/core/workspaces.ts';
import {
  cleanupWorkspace,
  cleanupRegistrationPath,
  legacyReadOnlyKey,
} from '../src/core/workspace-cleanup.ts';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import {
  recoverRun,
  writeRecord,
  recordPath,
  type RunRecord,
} from '../src/core/supervisor.ts';
import { git, makeRemote, removeDir, tempDir } from './helpers.ts';

const failure = vi.hoisted(() => ({
  target: '',
  partial: false,
  lockTarget: '',
  recordPrefix: '',
}));
vi.mock('node:fs/promises', async (original) => {
  const fs = await original<typeof import('node:fs/promises')>();
  return {
    ...fs,
    writeFile: async (
      file: Parameters<typeof fs.writeFile>[0],
      data: Parameters<typeof fs.writeFile>[1],
      options: Parameters<typeof fs.writeFile>[2],
    ) => {
      if (
        failure.recordPrefix !== '' &&
        String(file).startsWith(failure.recordPrefix) &&
        typeof data === 'string' &&
        (JSON.parse(data) as { cleanupStage?: string }).cleanupStage ===
          'registration'
      ) {
        failure.recordPrefix = '';
        throw new Error('Injected cleanup phase record write failure');
      }
      return fs.writeFile(file, data, options);
    },
    mkdir: async (
      file: Parameters<typeof fs.mkdir>[0],
      options: Parameters<typeof fs.mkdir>[1],
    ) => {
      if (String(file) === failure.lockTarget) {
        failure.lockTarget = '';
        throw Object.assign(new Error('Injected cache lock failure'), {
          code: 'EACCES',
        });
      }
      return fs.mkdir(file, options);
    },
    rm: async (
      file: Parameters<typeof fs.rm>[0],
      options: Parameters<typeof fs.rm>[1],
    ) => {
      if (String(file) === failure.target) {
        failure.target = '';
        if (failure.partial)
          await fs.rm(path.join(String(file), 'gitdir'), { force: true });
        throw Object.assign(new Error('Injected interrupted deletion'), {
          code: 'EIO',
        });
      }
      return fs.rm(file, options);
    },
  };
});

describe('read-only corruption and restartable cleanup', () => {
  let root: string;
  let paths: RunnerPaths;
  let remote: string;
  beforeEach(() => {
    root = tempDir('pm303-');
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    remote = makeRemote(root);
    failure.target = '';
    failure.lockTarget = '';
    failure.recordPrefix = '';
    failure.partial = false;
  });
  afterEach(() => removeDir(root));
  const repo = () => ({
    kind: 'repo' as const,
    url: remote,
    path: 'repo',
    branch: 'agent/PM-303',
    defaultBranch: 'main',
  });
  const legacyKey = 'PM-303.readonly-runner-codex-020e5fc4fbd20a895e61';
  async function start(readOnly = true, perRun = false) {
    if (!perRun)
      return checkout({
        paths,
        appKey: 'app',
        subjectKey: legacyKey,
        readOnly,
        dirs: [repo()],
        runId: '303',
      });
    const workDir = runWorkDir(paths, 'app', 'PM-303', '303', 1);
    const lock = await acquireLock(`${workDir}.lock`);
    const prepared = await prepareDirs({
      paths,
      appKey: 'app',
      subjectKey: 'PM-303',
      workDir,
      readOnly,
      perRun,
      runId: '303',
      dirs: [repo()],
    });
    return {
      workDir,
      repos: [prepared.dirs[0]!.repo!],
      release: async () => {
        await prepared.release();
        await lock.release();
      },
    };
  }
  it.each([
    'missing .git',
    'missing registration',
    'residue',
    'only .git/logs',
  ])(
    'rebuilds a damaged historical checkout exactly once: %s',
    async (kind) => {
      const first = await start();
      const dir = first.repos[0]!.dir;
      const scaffold = path.join(
        first.workDir,
        '.nocobase-runner',
        'context.marker',
      );
      writeFileSync(scaffold, 'current run scaffolding');
      await first.release();
      await writeWorkspaceMeta(paths, first.workDir, {
        ...(await readWorkspaceMeta(paths, first.workDir))!,
        prepared: ['repo:repo'],
      });
      if (kind === 'missing registration') {
        rmSync(dir, { recursive: true });
        git(
          ['worktree', 'add', '--detach', dir, 'refs/remotes/origin/main'],
          first.repos[0]!.cache,
        );
        const pointer = readFileSync(path.join(dir, '.git'), 'utf8')
          .trim()
          .slice(8);
        rmSync(pointer, { recursive: true });
      } else rmSync(path.join(dir, '.git'), { recursive: true });
      if (kind === 'only .git/logs')
        mkdirSync(path.join(dir, '.git', 'logs'), { recursive: true });
      if (kind === 'residue')
        writeFileSync(path.join(dir, 'residue'), 'discard');
      const rebuilt: string[] = [];
      const next = await checkout({
        paths,
        appKey: 'app',
        subjectKey: legacyKey,
        readOnly: true,
        dirs: [repo()],
        onRebuild: (reason) => rebuilt.push(reason),
      });
      expect(
        git(['rev-parse', '--is-inside-work-tree'], next.repos[0]!.dir),
      ).toBe('true');
      expect(rebuilt).toHaveLength(1);
      expect(readFileSync(scaffold, 'utf8')).toBe('current run scaffolding');
      expect(next.dirs[0]!.fresh).toBe(true);
      expect(existsSync(path.join(dir, 'residue'))).toBe(false);
      await next.release();
    },
  );
  it('retains a writable corrupt directory, including a settled subject, with diagnostics and cached size', async () => {
    const run = await start(false);
    rmSync(path.join(run.repos[0]!.dir, '.git'), { recursive: true });
    await run.release();
    await expect(start(false)).rejects.toThrow();
    const result = await collectWorkspaces({
      paths,
      reporters: new Map([
        [
          'app',
          async (request) => ({
            remove: ['303'],
            keep: [],
            decisions: request.directories!.map((entry) => ({
              reportId: request.reportId!,
              workDir: entry.workDir,
              runId: entry.runId,
              lastUsedAt: entry.lastUsedAt,
              settled: true,
              reason: 'settled' as const,
              commits: [],
            })),
          }),
        ],
      ]),
      decisionApps: new Set(['app']),
    });
    expect(result.removed).toHaveLength(0);
    expect(existsSync(run.workDir)).toBe(true);
    expect(result.entries[0]!.gitCheck?.reason).toBe('gitFailed');
    expect(result.entries[0]!.sizeBytes).toBeGreaterThan(0);
    expect(
      workspacesRequest(result.entries, 'app', undefined, true).directories![0]!
        .gitCheck,
    ).toBeDefined();
  });
  it('unregisters the original cache when rebuilding a corrupt checkout for a different repository URL', async () => {
    const first = await start();
    await first.release();
    const original = first.repos[0]!;
    rmSync(original.dir, { recursive: true });
    git(
      ['worktree', 'add', '--detach', original.dir, 'refs/remotes/origin/main'],
      original.cache,
    );
    const pointer = readFileSync(path.join(original.dir, '.git'), 'utf8')
      .trim()
      .slice(8);
    rmSync(path.join(original.dir, '.git'));
    const next = await checkout({
      paths,
      appKey: 'app',
      subjectKey: legacyKey,
      readOnly: true,
      dirs: [{ ...repo(), url: `${remote}/` }],
    });
    expect(next.repos[0]!.cache).not.toBe(original.cache);
    expect(existsSync(pointer)).toBe(false);
    expect(
      git(['rev-parse', '--is-inside-work-tree'], next.repos[0]!.dir),
    ).toBe('true');
    await next.release();
  });
  it('reports Git failure for a damaged writable recovery worktree without making it eligible for cleanup', async () => {
    const run = await start(false, true);
    rmSync(path.join(run.repos[0]!.dir, '.git'));
    await finalizeRunWorktrees(paths, run.workDir, () => {});
    await run.release();
    const result = await collectWorkspaces({ paths });
    const entry = result.entries.find(
      (entry) => entry.workDir === run.workDir,
    )!;
    expect(entry.gitCheck?.reason).toBe('gitFailed');
    expect(entry.disposable).toBe(false);
    expect(existsSync(run.workDir)).toBe(true);
  });
  it('collects old no-record residue but protects active locks, explicit writable identity, and unfamiliar names', async () => {
    const dir = path.join(paths.workRoot, 'app', legacyKey);
    mkdirSync(path.join(dir, 'repo'), { recursive: true });
    writeFileSync(path.join(dir, 'repo', 'residue'), 'dead');
    const lock = await acquireLock(`${dir}.lock`);
    expect((await collectWorkspaces({ paths })).removed).toHaveLength(0);
    await lock.release();
    expect(
      (await collectWorkspaces({ paths })).removed.map((item) => item.workDir),
    ).toContain(dir);
    expect(
      legacyReadOnlyKey(
        paths,
        path.join(paths.workRoot, 'app', 'PM-303.readonly-arbitrary'),
      ),
    ).toBeUndefined();
  });
  it('finalizes damaged read-only run worktrees without Git recovery and preserves their healthy neighbor', async () => {
    const damaged = await start(true, true);
    const neighbor = await start(false, true);
    rmSync(path.join(damaged.repos[0]!.dir, '.git'));
    const result = await finalizeRunWorktrees(paths, damaged.workDir, () => {});
    expect(result.every((entry) => entry.saved)).toBe(true);
    expect(existsSync(damaged.workDir)).toBe(false);
    expect(
      git(['rev-parse', '--is-inside-work-tree'], neighbor.repos[0]!.dir),
    ).toBe('true');
    expect(
      (await readWorkspaceMeta(
        paths,
        continuationWorkDir(paths, 'app', 'PM-303'),
      ))!.activeWorkDirs,
    ).not.toContain(damaged.workDir);
    await damaged.release();
    await neighbor.release();
  });
  it('cleans a stopped read-only attempt with no repositories and clears its session active-directory registration', async () => {
    const workDir = runWorkDir(paths, 'app', 'PM-303', 'empty', 1);
    mkdirSync(workDir, { recursive: true });
    await writeWorkspaceMeta(paths, workDir, {
      appKey: 'app',
      subjectKey: 'PM-303',
      lastUsedAt: new Date().toISOString(),
      repos: [],
      runAttempt: true,
      readOnly: true,
    });
    await updateContinuationState(paths, 'app', 'PM-303', (state) => ({
      ...state,
      activeWorkDirs: [workDir],
    }));
    await finalizeRunWorktrees(paths, workDir, () => {});
    expect(existsSync(workDir)).toBe(false);
    expect(
      (await readWorkspaceMeta(
        paths,
        continuationWorkDir(paths, 'app', 'PM-303'),
      ))!.activeWorkDirs,
    ).toEqual([]);
  });
  it.each(['files', 'registration', 'record'])(
    'retries interruption during %s after restart, including a partially deleted registration',
    async (stage) => {
      const run = await start(true, true);
      const pointer = readFileSync(path.join(run.repos[0]!.dir, '.git'), 'utf8')
        .trim()
        .slice(8);
      const quarantine = cleanupRegistrationPath(
        run.repos[0]!.cache,
        run.workDir,
        path.basename(pointer),
      );
      failure.target =
        stage === 'files'
          ? run.repos[0]!.dir
          : stage === 'registration'
            ? quarantine
            : workspaceRecordPath(paths, run.workDir);
      failure.partial = stage === 'registration';
      const logs: string[] = [];
      expect(
        (
          await finalizeRunWorktrees(paths, run.workDir, (message) =>
            logs.push(message),
          )
        )[0]!.saved,
      ).toBe(false);
      expect(
        logs.some(
          (message) =>
            message.includes('workspace cleanup pending:') &&
            message.includes('Injected interrupted deletion'),
        ),
      ).toBe(true);
      expect(
        (await readWorkspaceMeta(paths, run.workDir))!.cleanupPending,
      ).toBe(true);
      expect((await readWorkspaceMeta(paths, run.workDir))!.cleanupStage).toBe(
        stage === 'registration'
          ? 'registration'
          : stage === 'record'
            ? 'record'
            : 'files',
      );
      await run.release();
      expect(
        (await listWorkspaceDirs(paths)).some(
          (entry) => entry.workDir === run.workDir,
        ),
      ).toBe(true);
      await collectWorkspaces({ paths });
      expect(existsSync(run.workDir)).toBe(false);
      expect(existsSync(pointer)).toBe(false);
      expect(existsSync(quarantine)).toBe(false);
      expect(await readWorkspaceMeta(paths, run.workDir)).toBeUndefined();
      const evidence = process.env.PM303_EVIDENCE_DIR;
      if (evidence) {
        mkdirSync(evidence, { recursive: true });
        writeFileSync(
          path.join(evidence, `pm303-${stage}-retry.log`),
          logs.map((line) => line.replaceAll(root, '<fixture>')).join('\n') +
            '\nNext GC: workspace, registration quarantine and cleanup record absent.\n',
        );
      }
    },
  );
  it('protects unsafe orphan writers and preparing worktrees, and serializes two collectors', async () => {
    const run = await start(true, true);
    await finalizeRunWorktrees(paths, run.workDir, () => {}, {
      unsafeReason: 'Unknown writer ownership',
    });
    await run.release();
    const results = await Promise.all([
      collectWorkspaces({ paths }),
      collectWorkspaces({ paths }),
    ]);
    expect(results.flatMap((entry) => entry.removed)).toHaveLength(0);
    expect(existsSync(run.workDir)).toBe(true);
    const meta = (await readWorkspaceMeta(paths, run.workDir))!;
    await writeWorkspaceMeta(paths, run.workDir, {
      ...meta,
      recoveryRequired: false,
    });
    expect(
      (await scanWorkspaces(paths)).find(
        (entry) => entry.workDir === run.workDir,
      )!.disposable,
    ).toBe(false);
  });
  it('does not delete a new neighbor when Git reuses a registration name after interrupted cleanup', async () => {
    const run = await start(true, true);
    const cache = run.repos[0]!.cache;
    const pointer = readFileSync(path.join(run.repos[0]!.dir, '.git'), 'utf8')
      .trim()
      .slice(8);
    failure.target = cleanupRegistrationPath(
      cache,
      run.workDir,
      path.basename(pointer),
    );
    failure.partial = true;
    await finalizeRunWorktrees(paths, run.workDir, () => {});
    const neighbor = path.join(root, 'neighbor', 'repo');
    mkdirSync(path.dirname(neighbor), { recursive: true });
    git(
      ['worktree', 'add', '--detach', neighbor, 'refs/remotes/origin/main'],
      cache,
    );
    expect(
      readFileSync(path.join(neighbor, '.git'), 'utf8').trim().slice(8),
    ).toBe(pointer);
    await run.release();
    await collectWorkspaces({ paths });
    expect(git(['rev-parse', '--is-inside-work-tree'], neighbor)).toBe('true');
    expect(existsSync(run.workDir)).toBe(false);
  });
  it('retries a verified read-only cleanup after supervisor restart while retaining its unconfirmed report', async () => {
    const run = await start(true, true);
    failure.target = run.repos[0]!.dir;
    await finalizeRunWorktrees(paths, run.workDir, () => {});
    await run.release();
    const record: RunRecord = {
      runId: '303',
      appKey: 'app',
      attempt: 1,
      firstSeq: 1,
      pid: 2147483647,
      startedAt: new Date().toISOString(),
      phase: 'reporting',
      log: path.join(root, 'run.log'),
      workDir: run.workDir,
    };
    await writeRecord(paths, record);
    await recoverRun(record, {
      paths,
      clientFor: () => undefined,
      timings: {},
      log: () => {},
      reason: 'unknown',
      detail: 'Injected restart during cleanup',
    });
    expect(existsSync(run.workDir)).toBe(false);
    expect(await readWorkspaceMeta(paths, run.workDir)).toBeUndefined();
    expect(existsSync(recordPath(paths, '303'))).toBe(true);
    expect((await collectWorkspaces({ paths })).removed).toHaveLength(0);
  });
  it('preserves files on cache lock failure and allows the next collector to retry', async () => {
    const run = await start(true, true);
    failure.lockTarget = `${run.repos[0]!.cache}.lock`;
    const logs: string[] = [];
    const result = await finalizeRunWorktrees(paths, run.workDir, (message) =>
      logs.push(message),
    );
    expect(result[0]!.saved).toBe(false);
    expect(existsSync(path.join(run.repos[0]!.dir, '.git'))).toBe(true);
    expect(logs.join('\n')).toContain('Injected cache lock failure');
    await run.release();
    await collectWorkspaces({ paths });
    expect(existsSync(run.workDir)).toBe(false);
  });
  it('retries a phase-record write failure after the deletion intent was committed', async () => {
    const run = await start(true, true);
    failure.recordPrefix = `${workspaceRecordPath(paths, run.workDir)}.`;
    const result = await finalizeRunWorktrees(paths, run.workDir, () => {});
    expect(result[0]!.reason).toContain(
      'Injected cleanup phase record write failure',
    );
    expect((await readWorkspaceMeta(paths, run.workDir))!.cleanupPending).toBe(
      true,
    );
    await run.release();
    await collectWorkspaces({ paths });
    expect(existsSync(run.workDir)).toBe(false);
    expect(await readWorkspaceMeta(paths, run.workDir)).toBeUndefined();
  });
  it('keeps an unlocked legacy directory while a live process still holds it', async () => {
    const dir = path.join(paths.workRoot, 'app', legacyKey);
    mkdirSync(dir, { recursive: true });
    const child = spawn(
      process.execPath,
      ['-e', 'setTimeout(() => {}, 60000)'],
      { cwd: dir, stdio: 'ignore' },
    );
    await new Promise<void>((resolve, reject) => {
      child.once('spawn', resolve);
      child.once('error', reject);
    });
    try {
      expect((await collectWorkspaces({ paths })).removed).toHaveLength(0);
      expect(existsSync(dir)).toBe(true);
    } finally {
      const exited = new Promise((resolve) => child.once('exit', resolve));
      child.kill('SIGKILL');
      await exited;
    }
    expect(
      (await collectWorkspaces({ paths })).removed.map(
        (entry) => entry.workDir,
      ),
    ).toContain(dir);
  });
  it('continues after one deletion fails and collects the pending workspace on the next pass', async () => {
    const first = await start(true, true);
    failure.target = first.repos[0]!.dir;
    await finalizeRunWorktrees(paths, first.workDir, () => {});
    await first.release();
    const next = await checkout({
      paths,
      appKey: 'app',
      subjectKey: legacyKey.replace('PM-303', 'PM-304'),
      readOnly: true,
      dirs: [repo()],
    });
    await next.release();
    failure.target = first.repos[0]!.dir;
    const result = await collectWorkspaces({ paths });
    expect(result.removed.map((entry) => entry.workDir)).toContain(
      next.workDir,
    );
    expect(existsSync(first.workDir)).toBe(true);
    await collectWorkspaces({ paths });
    expect(existsSync(first.workDir)).toBe(false);
  });
  it('cleans a corrupt read-only workspace directly without resetting shared refs', async () => {
    const run = await start(true, true);
    const cache = run.repos[0]!.cache;
    const before = git(['rev-parse', 'refs/remotes/origin/main'], cache);
    rmSync(path.join(run.repos[0]!.dir, '.git'));
    await cleanupWorkspace(
      paths,
      run.workDir,
      (await readWorkspaceMeta(paths, run.workDir))!,
    );
    expect(git(['rev-parse', 'refs/remotes/origin/main'], cache)).toBe(before);
    await run.release();
  });
});
