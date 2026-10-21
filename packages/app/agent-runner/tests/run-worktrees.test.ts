import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { waitFor } from './fake-server.ts';
import { workspaceHolders } from '../src/core/process-tree.ts';
import * as fsPromises from 'node:fs/promises';
import * as checkoutModule from '../src/core/checkout.ts';
import * as gitModule from '../src/core/git.ts';
import { collectWorkspaces } from '../src/core/workspaces.ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import {
  prepareDirs,
  readWorkspaceMeta,
  checkout,
  acquireLock,
  markDirsPrepared,
  reportRepos,
  markWorkspaceEnded,
  writeWorkspaceMeta,
} from '../src/core/checkout.ts';
import {
  finalizeRunWorktrees,
  runWorkDir,
  clearContinuations,
  continuationWorkDir,
  retryWorkspaceRemoval,
  updateContinuationState,
  readContinuationState,
} from '../src/core/run-worktrees.ts';
import { git, makeRemote, publishSeed, removeDir, tempDir } from './helpers.ts';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, rm: vi.fn(actual.rm) };
});

const COMMIT = [
  '-c',
  'user.name=A',
  '-c',
  'user.email=a@example.com',
  '-c',
  'commit.gpgsign=false',
];

describe('per-attempt worktrees', () => {
  let root: string;
  let paths: RunnerPaths;
  let remote: string;
  beforeEach(() => {
    root = tempDir('run-worktrees-');
    const config = path.join(root, 'gitconfig');
    writeFileSync(config, '[user]\nname = A\nemail = a@example.com\n');
    vi.stubEnv('GIT_CONFIG_GLOBAL', config);
    vi.stubEnv('GIT_CONFIG_NOSYSTEM', '1');
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    remote = makeRemote(root);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    removeDir(root);
  });
  it('creates isolated unborn worktrees on older Git and resumes the first real root commit', async () => {
    const empty = path.join(root, 'empty.git');
    git(['init', '--bare', '--initial-branch=main', empty], root);
    const open = async (id: string) => {
      const workDir = runWorkDir(paths, 'app', 'EMPTY', id, 1);
      const prepared = await prepareDirs({
        paths,
        workDir,
        appKey: 'app',
        subjectKey: 'EMPTY',
        runId: id,
        perRun: true,
        dirs: [
          {
            kind: 'repo',
            url: `file://${empty}`,
            path: 'repo',
            branch: 'main',
            defaultBranch: 'main',
            initial: true,
          },
        ],
      });
      return { workDir, repo: prepared.dirs[0].repo! };
    };
    const a = await open('a');
    const b = await open('b');
    expect(a.repo.localBranch).not.toBe(b.repo.localBranch);
    expect(git(['for-each-ref', '--format=%(refname)'], a.repo.cache)).toBe('');
    writeFileSync(path.join(a.repo.dir, 'first.txt'), 'first real commit');
    const saved = await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(saved[0].saved).toBe(true);
    expect(
      git(
        ['rev-list', '--parents', '-n', '1', saved[0].head!],
        a.repo.cache,
      ).split(' '),
    ).toHaveLength(1);
    expect(git(['symbolic-ref', '--short', 'HEAD'], b.repo.dir)).toBe(
      b.repo.localBranch,
    );
    const c = await open('c');
    expect(readFileSync(path.join(c.repo.dir, 'first.txt'), 'utf8')).toBe(
      'first real commit',
    );
    expect(git(['rev-parse', 'HEAD'], c.repo.dir)).toBe(saved[0].head);
    await finalizeRunWorktrees(paths, b.workDir, () => {});
    await finalizeRunWorktrees(paths, c.workDir, () => {});
  });
  async function start(id: string, readOnly = false, clean = false) {
    const workDir = runWorkDir(paths, 'app', 'PM-300', id, 1);
    const prepared = await prepareDirs({
      paths,
      appKey: 'app',
      subjectKey: 'PM-300',
      runId: id,
      perRun: true,
      readOnly,
      clean,
      workDir,
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
    return { workDir, repo: prepared.dirs[0]!.repo!, prepared };
  }
  function commitFile(dir: string, name = 'work.txt') {
    writeFileSync(path.join(dir, name), name);
    git(['add', name], dir);
    git([...COMMIT, 'commit', '-q', '-m', name], dir);
    return git(['rev-parse', 'HEAD'], dir);
  }
  const remoteBranch = 'refs/heads/agent/PM-300';
  const resumeRef = (repo: { continuation?: string }) =>
    `refs/runner/resume/${repo.continuation}`;
  const remoteHead = () =>
    git(['ls-remote', remote, remoteBranch], root).split(/\s/)[0];
  async function finish(a: Awaited<ReturnType<typeof start>>, push = true) {
    const reports = await reportRepos([a.repo], { push });
    await markWorkspaceEnded(paths, a.workDir, reports);
    expect(
      (
        await finalizeRunWorktrees(paths, a.workDir, () => {}, {
          repos: [a.repo],
        })
      )[0].saved,
    ).toBe(true);
    return reports[0];
  }
  it('preserves the latest delivery when read-only preparation overlaps a writer finishing', async () => {
    const a = await start('first-delivery');
    const first = commitFile(a.repo.dir);
    expect((await finish(a)).pushed).toBe(true);
    const baseline = (await readContinuationState(paths, 'app', 'PM-300'))!
      .repos[0].startSha;
    const writer = await start('writer');
    const second = commitFile(writer.repo.dir, 'second.txt');
    const original = (
      await vi.importActual<typeof fsPromises>('node:fs/promises')
    ).mkdir;
    let pause!: () => void;
    let resume!: () => void;
    const paused = new Promise<void>((resolve) => {
      pause = resolve;
    });
    const resumed = new Promise<void>((resolve) => {
      resume = resolve;
    });
    let intercepted = false;
    const spy = vi
      .spyOn(fsPromises, 'mkdir')
      .mockImplementation(async (...args) => {
        if (
          !intercepted &&
          String(args[0]) ===
            `${continuationWorkDir(paths, 'app', 'PM-300')}.lock`
        ) {
          intercepted = true;
          // Pause after reading the first delivery, before registration acquires its existing lock.
          pause();
          await resumed;
        }
        return original(...args);
      });
    const preparing = start('reader', true);
    try {
      await paused;
      expect(
        (await readContinuationState(paths, 'app', 'PM-300'))!.repos[0]
          .pushedSha,
      ).toBe(first);
      expect((await finish(writer)).pushed).toBe(true);
      expect(
        (await readContinuationState(paths, 'app', 'PM-300'))!.repos[0]
          .pushedSha,
      ).toBe(second);
      resume();
      const reader = await preparing;
      const record = (await readContinuationState(paths, 'app', 'PM-300'))!
        .repos[0];
      const readerBase = reader.repo.deliveryBaseSha;
      await finish(reader, false);
      git(
        ['update-ref', '-d', remoteBranch],
        path.join(root, 'origin-repo.git'),
      );
      const next = await start('after-deletion');
      const report = await finish(next);
      expect({
        startSha: record.startSha,
        pushedSha: record.pushedSha,
        readerBase,
        pushed: report.pushed,
        remote: remoteHead(),
      }).toEqual({
        startSha: baseline,
        pushedSha: second,
        readerBase: second,
        pushed: false,
        remote: '',
      });
    } finally {
      resume();
      await preparing.catch(() => undefined);
      spy.mockRestore();
    }
  });
  it('does not push an untouched checkout when another run advances the shared default ref', async () => {
    const a = await start('shared-cache');
    const original = git(['rev-parse', 'HEAD'], a.repo.dir);
    const seed = path.join(root, 'origin-repo-seed');
    const upstream = commitFile(seed, 'upstream.txt');
    git(
      ['fetch', seed, '+refs/heads/main:refs/remotes/origin/main'],
      a.repo.cache,
    );
    expect(upstream).not.toBe(original);
    expect((await finish(a)).pushed).toBe(false);
    expect(remoteHead()).toBe('');
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', resumeRef(a.repo)],
        a.repo.cache,
      ),
    ).toBe('');
  });
  it.each(['deleted', 'squashed'] as const)(
    'does not recreate a %s branch across two further runs',
    async (kind) => {
      const a = await start('delivered');
      const delivered = commitFile(a.repo.dir);
      expect((await finish(a)).pushed).toBe(true);
      expect(
        (await readContinuationState(paths, 'app', 'PM-300'))?.repos[0]
          .pushedSha,
      ).toBe(delivered);
      if (kind === 'squashed') {
        const seed = path.join(root, 'origin-repo-seed');
        git(['fetch', remote, remoteBranch], seed);
        git(['merge', '--squash', 'FETCH_HEAD'], seed);
        git([...COMMIT, 'commit', '-m', 'Squashed work'], seed);
        git(['push', remote, 'main'], seed);
        expect(git(['rev-parse', 'HEAD'], seed)).not.toBe(delivered);
      }
      git(
        ['update-ref', '-d', remoteBranch],
        path.join(root, 'origin-repo.git'),
      );
      for (const id of ['next', 'again']) {
        const b = await start(id);
        expect(git(['rev-parse', 'HEAD'], b.repo.dir)).toBe(
          git(
            ['rev-parse', 'refs/heads/main'],
            path.join(root, 'origin-repo.git'),
          ),
        );
        expect(
          git(
            ['for-each-ref', '--format=%(refname)', resumeRef(b.repo)],
            b.repo.cache,
          ),
        ).toBe('');
        expect((await finish(b)).pushed).toBe(false);
        expect(remoteHead()).toBe('');
        expect(
          git(
            ['for-each-ref', '--format=%(refname)', resumeRef(b.repo)],
            b.repo.cache,
          ),
        ).toBe('');
      }
    },
  );
  it('clears a branch deleted during a run without saving the stale head again', async () => {
    const a = await start('published');
    commitFile(a.repo.dir);
    await finish(a);
    const b = await start('delete-during-run');
    git(['update-ref', '-d', remoteBranch], path.join(root, 'origin-repo.git'));
    expect((await finish(b)).pushed).toBe(false);
    expect(remoteHead()).toBe('');
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', resumeRef(b.repo)],
        b.repo.cache,
      ),
    ).toBe('');
    const c = await start('after-delete');
    expect((await finish(c)).pushed).toBe(false);
    expect(remoteHead()).toBe('');
  });
  it('retries known pending commits after a rejected first push without another edit', async () => {
    const a = await start('rejected');
    const head = commitFile(a.repo.dir);
    const hook = path.join(root, 'origin-repo.git/hooks/pre-receive');
    writeFileSync(hook, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    expect((await finish(a)).failure).toBeDefined();
    const state = await readContinuationState(paths, 'app', 'PM-300');
    expect(state?.repos[0].startSha).not.toBe(head);
    expect(state?.repos[0].pushedSha).toBeUndefined();
    rmSync(hook);
    const b = await start('retry');
    expect(git(['rev-parse', 'HEAD'], b.repo.dir)).toBe(head);
    expect((await finish(b)).pushed).toBe(true);
    expect(remoteHead()).toBe(head);
  });
  it('keeps new commits beyond a delivered head when the remote branch is deleted', async () => {
    const a = await start('first-delivery');
    commitFile(a.repo.dir);
    await finish(a);
    const b = await start('pending');
    const pending = commitFile(b.repo.dir, 'pending.txt');
    await finalizeRunWorktrees(paths, b.workDir, () => {});
    git(['update-ref', '-d', remoteBranch], path.join(root, 'origin-repo.git'));
    const c = await start('deliver-pending');
    expect(git(['rev-parse', 'HEAD'], c.repo.dir)).toBe(pending);
    expect((await finish(c)).pushed).toBe(true);
    expect(remoteHead()).toBe(pending);
  });
  it('retains continuation evidence when the remote query fails', async () => {
    const a = await start('before-offline');
    const head = commitFile(a.repo.dir);
    await finish(a);
    const b = await start('offline');
    const bare = path.join(root, 'origin-repo.git');
    await fsPromises.rename(bare, `${bare}.offline`);
    const report = await finish(b);
    expect(report.failure).toBeDefined();
    expect(b.repo.remoteMissing).toBeUndefined();
    expect(git(['rev-parse', resumeRef(b.repo)], b.repo.cache)).toBe(head);
    expect(
      (await readContinuationState(paths, 'app', 'PM-300'))?.repos[0].pushedSha,
    ).toBe(head);
    await fsPromises.rename(`${bare}.offline`, bare);
  });
  it.each(['offline', 'leaseLost'] as const)(
    'logs a %s lookup without a push failure for a non-pushing run',
    async (kind) => {
      const a = await start('non-pushing-lookup', true);
      const bare = path.join(root, 'origin-repo.git');
      if (kind === 'offline') await fsPromises.rename(bare, `${bare}.offline`);
      const logs: string[] = [];
      a.repo.remoteMissing = true;
      try {
        const [report] = await reportRepos([a.repo], {
          push: false,
          ...(kind === 'leaseLost' ? { active: () => false } : {}),
          log: (message) => logs.push(message),
        });
        expect(report.pushed).toBe(false);
        expect(report.failure).toBeUndefined();
        expect(a.repo.remoteMissing).toBeUndefined();
        expect(logs.join('\n')).toContain('report:');
        await markWorkspaceEnded(paths, a.workDir, [report]);
        expect(
          (
            await finalizeRunWorktrees(paths, a.workDir, () => {}, {
              repos: [a.repo],
            })
          )[0].saved,
        ).toBe(true);
      } finally {
        if (kind === 'offline')
          await fsPromises.rename(`${bare}.offline`, bare);
      }
    },
  );
  it('forgets pre-push absence when delivery succeeds but its confirmation lookup fails', async () => {
    const a = await start('unconfirmed-delivery');
    const head = commitFile(a.repo.dir);
    await finalizeRunWorktrees(paths, a.workDir, () => {}, { remove: false });
    const original = gitModule.git;
    let lookups = 0;
    const spy = vi
      .spyOn(gitModule, 'git')
      .mockImplementation(async (args, ...rest) => {
        if (args.includes('ls-remote') && ++lookups === 2)
          throw new checkoutModule.CheckoutError(
            'git ls-remote failed: injected confirmation failure',
          );
        return original(args, ...rest);
      });
    try {
      const [report] = await reportRepos([a.repo], { push: true });
      expect(lookups).toBe(2);
      expect(remoteHead()).toBe(head);
      expect(report.pushed).toBe(false);
      expect(report.failure?.message).toContain(
        'injected confirmation failure',
      );
      expect(a.repo.remoteMissing).toBeUndefined();
      await markWorkspaceEnded(paths, a.workDir, [report]);
      await finalizeRunWorktrees(paths, a.workDir, () => {}, {
        repos: [a.repo],
      });
      expect(git(['rev-parse', resumeRef(a.repo)], a.repo.cache)).toBe(head);
    } finally {
      spy.mockRestore();
    }
  });
  it('preserves unknown historical continuations without republishing until new work is added', async () => {
    const a = await start('historical');
    const old = commitFile(a.repo.dir);
    await finalizeRunWorktrees(paths, a.workDir, () => {});
    await updateContinuationState(paths, 'app', 'PM-300', (state) => ({
      ...state,
      repos: state.repos.map((repo) => {
        const identity = { ...repo };
        delete identity.startSha;
        delete identity.pushedSha;
        return identity;
      }),
    }));
    const b = await start('unknown-no-edit');
    expect((await finish(b)).pushed).toBe(false);
    expect(remoteHead()).toBe('');
    expect(git(['rev-parse', resumeRef(b.repo)], b.repo.cache)).toBe(old);
    const c = await start('unknown-new-work');
    const head = commitFile(c.repo.dir, 'new.txt');
    expect((await finish(c)).pushed).toBe(true);
    expect(remoteHead()).toBe(head);
  });
  it.each(['dev', 'v3-develop'])(
    'delivers first and subsequent real commits for %s repositories',
    async (defaultBranch) => {
      const bare = path.join(root, 'origin-repo.git');
      git(['branch', '-m', 'main', defaultBranch], bare);
      const open = async (id: string) => {
        const workDir = runWorkDir(paths, 'app', 'normal', id, 1);
        const prepared = await prepareDirs({
          paths,
          workDir,
          appKey: 'app',
          subjectKey: 'normal',
          runId: id,
          perRun: true,
          dirs: [
            {
              kind: 'repo',
              url: remote,
              path: 'repo',
              branch: 'agent/PM-300',
              defaultBranch,
            },
          ],
        });
        return { workDir, prepared, repo: prepared.dirs[0].repo! };
      };
      const a = await open('first');
      const first = commitFile(a.repo.dir);
      expect((await finish(a)).pushed).toBe(true);
      expect(remoteHead()).toBe(first);
      const b = await open('second');
      const second = commitFile(b.repo.dir, 'second.txt');
      expect((await finish(b)).pushed).toBe(true);
      expect(remoteHead()).toBe(second);
    },
  );

  it('does not publish historical work already included in the default branch', async () => {
    const a = await start('included');
    const head = commitFile(a.repo.dir);
    await finalizeRunWorktrees(paths, a.workDir, () => {});
    git(
      ['fetch', a.repo.cache, `${resumeRef(a.repo)}:refs/heads/main`],
      path.join(root, 'origin-repo.git'),
    );
    const b = await start('default-includes-work');
    expect(git(['rev-parse', 'HEAD'], b.repo.dir)).toBe(head);
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', resumeRef(b.repo)],
        b.repo.cache,
      ),
    ).toBe('');
    expect((await finish(b)).pushed).toBe(false);
    expect(remoteHead()).toBe('');
  });
  it('records a baseline for new work added to an unknown resume so a failed push can retry', async () => {
    const a = await start('old-unknown');
    commitFile(a.repo.dir);
    await finalizeRunWorktrees(paths, a.workDir, () => {});
    await updateContinuationState(paths, 'app', 'PM-300', (state) => ({
      ...state,
      repos: state.repos.map((repo) => {
        const identity = { ...repo };
        delete identity.startSha;
        delete identity.pushedSha;
        return identity;
      }),
    }));
    const b = await start('unknown-add-work');
    const head = commitFile(b.repo.dir, 'new-pending.txt');
    const hook = path.join(root, 'origin-repo.git/hooks/pre-receive');
    writeFileSync(hook, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    expect((await finish(b)).failure).toBeDefined();
    rmSync(hook);
    const c = await start('unknown-retry');
    expect((await finish(c)).pushed).toBe(true);
    expect(remoteHead()).toBe(head);
  });
  it('retains the unborn starting point across runs until the first real commit is delivered', async () => {
    const empty = path.join(root, 'initial.git');
    git(['init', '--bare', '--initial-branch=main', empty], root);
    const open = async (id: string) => {
      const workDir = runWorkDir(paths, 'app', 'initial', id, 1);
      const prepared = await prepareDirs({
        paths,
        workDir,
        appKey: 'app',
        subjectKey: 'initial',
        runId: id,
        perRun: true,
        dirs: [
          {
            kind: 'repo',
            url: `file://${empty}`,
            path: 'repo',
            branch: 'main',
            defaultBranch: 'main',
            initial: true,
          },
        ],
      });
      return { workDir, prepared, repo: prepared.dirs[0].repo! };
    };
    const a = await open('first-root');
    const head = commitFile(a.repo.dir);
    await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(
      (await readContinuationState(paths, 'app', 'initial'))?.repos[0].startSha,
    ).toBe('');
    const b = await open('deliver-root');
    expect((await finish(b)).pushed).toBe(true);
    expect(git(['rev-parse', 'refs/heads/main'], empty)).toBe(head);
  });

  async function pushedRemoval(id: string) {
    const a = await start(id);
    git(['push', a.repo.url, 'HEAD:refs/heads/agent/PM-300'], a.repo.dir);
    await markWorkspaceEnded(
      paths,
      a.workDir,
      await reportRepos([a.repo], { push: true }),
    );
    const meta = (await readWorkspaceMeta(paths, a.workDir))!;
    await writeWorkspaceMeta(paths, a.workDir, {
      ...meta,
      repos: meta.repos.map((repo) => ({ ...repo, removing: true })),
    });
    return a;
  }

  it('saves with the checkout identity despite inherited author and trailer overrides', async () => {
    const a = await start('identity');
    git(['config', '--worktree', 'user.name', 'Checkout Author'], a.repo.dir);
    git(
      ['config', '--worktree', 'user.email', 'checkout@example.com'],
      a.repo.dir,
    );
    for (const key of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME'])
      vi.stubEnv(key, 'Wrong author');
    for (const key of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL'])
      vi.stubEnv(key, 'wrong@example.com');
    vi.stubEnv(
      'NOCOBASE_RUNNER_COMMIT_TRAILERS',
      'Co-authored-by: Wrong <wrong@example.com>\nSigned-off-by: Wrong <wrong@example.com>',
    );
    writeFileSync(path.join(a.repo.dir, 'identity.txt'), 'pending');
    const [saved] = await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(saved.saved).toBe(true);
    expect(
      git(
        ['show', '-s', '--format=%an <%ae>|%cn <%ce>', saved.head!],
        a.repo.cache,
      ),
    ).toBe(
      'Checkout Author <checkout@example.com>|Checkout Author <checkout@example.com>',
    );
    const message = git(
      ['show', '-s', '--format=%B', saved.head!],
      a.repo.cache,
    );
    expect(message).toContain('Update identity.txt');
    expect(message).toContain('work in progress');
    expect(message).not.toMatch(
      /co-authored-by|signed-off-by|save local continuation/iu,
    );
  });

  it.each(['user.name', 'user.email'])(
    'retains work and reports an unavailable %s without committing',
    async (key) => {
      const a = await start('missing-identity');
      git(['config', '--worktree', key, ''], a.repo.dir);
      const head = git(['rev-parse', 'HEAD'], a.repo.dir);
      writeFileSync(path.join(a.repo.dir, 'pending.txt'), 'must survive');
      const log = vi.fn();
      const [saved] = await finalizeRunWorktrees(paths, a.workDir, log);
      expect(saved).toMatchObject({
        saved: false,
        reason: expect.stringContaining(
          'configure valid user.name and user.email',
        ),
      });
      expect(git(['rev-parse', 'HEAD'], a.repo.dir)).toBe(head);
      expect(readFileSync(path.join(a.repo.dir, 'pending.txt'), 'utf8')).toBe(
        'must survive',
      );
      expect(await readWorkspaceMeta(paths, a.workDir)).toMatchObject({
        recoveryRequired: true,
        recoveryReason: saved.reason,
      });
      expect(log).toHaveBeenCalledWith(expect.stringContaining(saved.reason!));
      const b = await start('after-missing-identity');
      expect(b.repo.warnings?.join('\n')).toContain(saved.reason);
    },
  );

  it.each(['startup', 'gc'] as const)(
    'cleans legacy removal failures through %s, with preview and idempotency',
    async (entry) => {
      const a = await pushedRemoval('legacy');
      rmSync(path.join(a.repo.dir, 'README.md'));
      const meta = (await readWorkspaceMeta(paths, a.workDir))!;
      await writeWorkspaceMeta(paths, a.workDir, {
        ...meta,
        recoveryRequired: true,
        recoveryReason: `git worktree remove --force ${a.repo.dir} failed: permission denied\n`,
      });
      const before = await readWorkspaceMeta(paths, a.workDir);
      const { scanWorkspaces, planRemovals, removePlanned } =
        await import('../src/core/workspaces.ts');
      const entries = await scanWorkspaces(paths, {});
      const plan = planRemovals(entries, {});
      expect(plan.remove.map((item) => item.entry.workDir)).toContain(
        a.workDir,
      );
      expect(await readWorkspaceMeta(paths, a.workDir)).toEqual(before);
      expect(existsSync(a.workDir)).toBe(true);
      if (entry === 'startup') await start('next');
      else
        expect(
          await removePlanned(
            paths,
            plan.remove.find((item) => item.entry.workDir === a.workDir)!.entry,
          ),
        ).toBeUndefined();
      expect(existsSync(a.workDir)).toBe(false);
      expect(await readWorkspaceMeta(paths, a.workDir)).toBeUndefined();
      expect(
        (
          await readWorkspaceMeta(
            paths,
            continuationWorkDir(paths, 'app', 'PM-300'),
          )
        )?.activeWorkDirs,
      ).not.toContain(a.workDir);
      expect(await retryWorkspaceRemoval(paths, a.workDir, () => {})).toBe(
        false,
      );
      expect(
        (await collectWorkspaces({ paths })).removed.map(
          (item) => item.workDir,
        ),
      ).not.toContain(a.workDir);
    },
  );

  it.each([
    'save failed',
    'Removal candidate is not verified clean and pushed; retain it for recovery.',
    'missing push',
    'missing marker',
  ])('keeps other legacy recovery records unchanged: %s', async (reason) => {
    const a = await pushedRemoval('protected');
    const meta = (await readWorkspaceMeta(paths, a.workDir))!;
    await writeWorkspaceMeta(paths, a.workDir, {
      ...meta,
      recoveryRequired: true,
      recoveryReason: reason.startsWith('missing')
        ? 'git worktree remove --force checkout failed'
        : reason,
      repos: meta.repos.map((repo) => ({
        ...repo,
        ...(reason === 'missing push' ? { pushedSha: undefined } : {}),
        ...(reason === 'missing marker' ? { removing: false } : {}),
      })),
    });
    const before = await readWorkspaceMeta(paths, a.workDir);
    const next = await start('reader', true);
    expect(next.repo.warnings?.join(' ')).toContain(
      'You may continue this read-only run',
    );
    expect(next.repo.warnings?.join(' ')).toContain(
      'does not contain its pending changes',
    );
    expect(next.repo.warnings?.join(' ')).not.toContain('before continuing');
    expect(await readWorkspaceMeta(paths, a.workDir)).toEqual(before);
    const writer = await start('writer');
    expect(writer.repo.warnings?.join(' ')).toContain(
      'Resolve or recover it before continuing',
    );
    await collectWorkspaces({ paths });
    expect(existsSync(a.workDir)).toBe(true);
    expect((await readWorkspaceMeta(paths, a.workDir))?.recoveryReason).toBe(
      before?.recoveryReason,
    );
  });

  it('automatically finishes a pushed removing checkout whose Git metadata survived', async () => {
    const a = await pushedRemoval('git-survived');
    expect(await retryWorkspaceRemoval(paths, a.workDir, () => {})).toBe(true);
    expect(existsSync(a.workDir)).toBe(false);
  });

  it('preserves the complete Git removal stderr in its error message', async () => {
    const a = await start('stderr');
    const args = [
      'worktree',
      'remove',
      '--force',
      path.join(a.workDir, 'missing'),
    ];
    const { stderr } = spawnSync('git', args, {
      cwd: a.repo.cache,
      encoding: 'utf8',
    });
    expect(stderr).toContain('fatal:');
    expect(stderr.endsWith('\n')).toBe(true);
    await expect(checkoutModule.git(args, a.repo.cache)).rejects.toThrow(
      `git ${args.join(' ')} failed: ${stderr}`,
    );
  });

  async function interruptedRemoval(id: string) {
    const a = await start(id);
    git(['push', a.repo.url, 'HEAD:refs/heads/agent/PM-300'], a.repo.dir);
    await markWorkspaceEnded(
      paths,
      a.workDir,
      await reportRepos([a.repo], { push: true }),
    );
    const reason = `git worktree remove --force ${a.repo.dir} failed: EACCES: injected interrupted removal\n`;
    const log = vi.fn();
    const original = checkoutModule.git;
    const spy = vi
      .spyOn(checkoutModule, 'git')
      .mockImplementation(async (args, ...rest) => {
        if (args[0] === 'worktree' && args[1] === 'remove') {
          rmSync(path.join(a.repo.dir, 'README.md'));
          throw new Error(reason);
        }
        return original(args, ...rest);
      });
    try {
      const result = await finalizeRunWorktrees(paths, a.workDir, log);
      expect(log).toHaveBeenCalledWith(
        `worktree finalization failed: ${a.repo.dir}: ${reason}`,
      );
      expect(result.every((entry) => entry.saved)).toBe(true);
    } finally {
      spy.mockRestore();
    }
    expect(existsSync(path.join(a.repo.dir, '.git'))).toBe(true);
    expect(
      (await readWorkspaceMeta(paths, a.workDir))?.recoveryRequired,
    ).not.toBe(true);
    expect(await readWorkspaceMeta(paths, a.workDir)).toMatchObject({
      recoveryReason: reason,
      repos: [expect.objectContaining({ removing: true })],
    });
    return a;
  }

  it.skipIf(process.platform !== 'linux')(
    'GC finishes a pushed partially deleted checkout and does not block the next run',
    async () => {
      const a = await interruptedRemoval('remove-fails');
      // An actual attempt lock still wins over the removal marker.
      const lock = await acquireLock(`${a.workDir}.lock`, { timeoutMs: 0 });
      expect(await retryWorkspaceRemoval(paths, a.workDir, () => {})).toBe(
        false,
      );
      expect(existsSync(a.workDir)).toBe(true);
      await lock.release();
      const holder = spawn(
        process.execPath,
        ['-e', 'setInterval(() => {}, 1000)'],
        { cwd: a.repo.dir, detached: true, stdio: 'ignore' },
      );
      const unrelated = spawn(
        process.execPath,
        ['-e', 'setInterval(() => {}, 1000)'],
        { cwd: root, detached: true, stdio: 'ignore' },
      );
      try {
        await waitFor(async () =>
          (await workspaceHolders(a.workDir)).includes(holder.pid!),
        );
        const collected = await collectWorkspaces({ paths });
        await waitFor(
          () => holder.exitCode !== null || holder.signalCode !== null,
        );
        expect(unrelated.exitCode).toBeNull();
        expect(unrelated.signalCode).toBeNull();
        expect(collected.removed.map((entry) => entry.workDir)).toContain(
          a.workDir,
        );
        expect(existsSync(a.workDir)).toBe(false);
        expect(
          git(['worktree', 'list', '--porcelain'], a.repo.cache),
        ).not.toContain(a.repo.dir);
        const b = await start('after-removal');
        expect(b.repo.warnings?.join(' ')).not.toContain(
          'Recovery work remains',
        );
        await finalizeRunWorktrees(paths, b.workDir, () => {});
      } finally {
        holder.kill('SIGKILL');
        unrelated.kill('SIGKILL');
      }
    },
  );

  it('records retry failures without demanding recovery, and the next run retries cleanup', async () => {
    const a = await interruptedRemoval('retry-fails');
    const original = (
      await vi.importActual<typeof fsPromises>('node:fs/promises')
    ).rm;
    const spy = vi
      .spyOn(fsPromises, 'rm')
      .mockImplementation(async (...args) => {
        if (String(args[0]) === a.repo.dir)
          throw new Error('EACCES: cleanup retry');
        return original(...args);
      });
    try {
      expect(await retryWorkspaceRemoval(paths, a.workDir, () => {})).toBe(
        false,
      );
      expect(
        (await readWorkspaceMeta(paths, a.workDir))?.recoveryRequired,
      ).not.toBe(true);
      expect(await readWorkspaceMeta(paths, a.workDir)).toMatchObject({
        recoveryReason: 'EACCES: cleanup retry',
      });
    } finally {
      spy.mockRestore();
    }
    const b = await start('retry-on-next-run');
    expect(existsSync(a.workDir)).toBe(false);
    expect(b.repo.warnings?.join(' ')).not.toContain('Recovery work remains');
    await finalizeRunWorktrees(paths, b.workDir, () => {});
  });

  it.each(['dirty', 'unpushed'] as const)(
    'protects %s work after a save failure even with a removal marker',
    async (kind) => {
      const a = await start(`protected-${kind}`);
      git(['push', a.repo.url, 'HEAD:refs/heads/agent/PM-300'], a.repo.dir);
      await markWorkspaceEnded(
        paths,
        a.workDir,
        await reportRepos([a.repo], { push: true }),
      );
      writeFileSync(path.join(a.repo.dir, 'new-work.txt'), 'keep');
      if (kind === 'unpushed') {
        git(['add', 'new-work.txt'], a.repo.dir);
        git([...COMMIT, 'commit', '-m', 'unpublished'], a.repo.dir);
      }
      const meta = (await readWorkspaceMeta(paths, a.workDir))!;
      await writeWorkspaceMeta(paths, a.workDir, {
        ...meta,
        recoveryRequired: true,
        recoveryReason: 'Saving failed; retain the original worktree.',
        repos: meta.repos.map((repo) => ({ ...repo, removing: true })),
      });
      expect(await retryWorkspaceRemoval(paths, a.workDir, () => {})).toBe(
        false,
      );
      await collectWorkspaces({ paths });
      expect(readFileSync(path.join(a.repo.dir, 'new-work.txt'), 'utf8')).toBe(
        'keep',
      );
      expect(
        (await readWorkspaceMeta(paths, a.workDir))?.recoveryRequired,
      ).toBe(true);
    },
  );

  it('removes the recovery attempt, continuation state and sessions of an ended task whatever they hold', async () => {
    const a = await start('ended-recovery');
    writeFileSync(path.join(a.repo.dir, 'proposal.md'), 'scratch');
    git(['add', 'proposal.md'], a.repo.dir);
    git([...COMMIT, 'commit', '-m', 'unpublished'], a.repo.dir);
    writeFileSync(path.join(a.repo.dir, 'progress.md'), 'scratch');
    const meta = (await readWorkspaceMeta(paths, a.workDir))!;
    await writeWorkspaceMeta(paths, a.workDir, {
      ...meta,
      recoveryRequired: true,
      recoveryReason: 'Saving failed; retain the original worktree.',
    });
    const session = path.join(paths.workRoot, '.sessions', 'a'.repeat(64));
    await fsPromises.mkdir(path.join(session, 'codex-home'), {
      recursive: true,
    });
    await updateContinuationState(paths, 'app', 'PM-300', (state) => ({
      ...state,
      sessionKeys: ['a'.repeat(64)],
    }));
    const state = continuationWorkDir(paths, 'app', 'PM-300');
    const reporters = new Map([
      [
        'app',
        (request: { workspaces: readonly { runId: string }[] }) =>
          Promise.resolve({
            remove: request.workspaces.map((item) => item.runId),
            keep: [],
          }),
      ],
    ]);
    const result = await collectWorkspaces({ paths, reporters });
    expect(result.removed.map((item) => item.workDir).sort()).toEqual(
      [a.workDir, state].sort(),
    );
    expect(existsSync(a.workDir)).toBe(false);
    expect(existsSync(state)).toBe(false);
    expect(existsSync(session)).toBe(false);
    expect(await readWorkspaceMeta(paths, a.workDir)).toBeUndefined();
    expect(
      git(['for-each-ref', '--format=%(refname)'], a.repo.cache),
    ).not.toMatch(/runner-run-|refs\/runner\//u);
  });

  it('keeps an attempt and its sessions while a run holds the attempt, even when the task ended', async () => {
    const a = await start('ended-busy');
    writeFileSync(path.join(a.repo.dir, 'proposal.md'), 'scratch');
    const session = path.join(paths.workRoot, '.sessions', 'a'.repeat(64));
    await fsPromises.mkdir(session, { recursive: true });
    await updateContinuationState(paths, 'app', 'PM-300', (state) => ({
      ...state,
      sessionKeys: ['a'.repeat(64)],
    }));
    const reporters = new Map([
      [
        'app',
        (request: { workspaces: readonly { runId: string }[] }) =>
          Promise.resolve({
            remove: request.workspaces.map((item) => item.runId),
            keep: [],
          }),
      ],
    ]);
    const lock = await acquireLock(`${a.workDir}.lock`);
    try {
      const result = await collectWorkspaces({ paths, reporters });
      expect(result.removed).toEqual([]);
      expect(result.kept.map((item) => item.reason).sort()).toEqual([
        'inUse',
        'inUse',
      ]);
    } finally {
      await lock.release();
    }
    expect(existsSync(path.join(a.repo.dir, 'proposal.md'))).toBe(true);
    expect(existsSync(session)).toBe(true);
  });

  it('starts two unmarked writers and keeps divergent heads visible without merging', async () => {
    const [a, b] = await Promise.all([start('a'), start('b')]);
    expect(a.workDir).not.toBe(b.workDir);
    expect(a.repo.localBranch).not.toBe(b.repo.localBranch);
    writeFileSync(path.join(a.repo.dir, 'a.txt'), 'a');
    writeFileSync(path.join(b.repo.dir, 'b.txt'), 'b');
    const [savedA, savedB] = await Promise.all([
      finalizeRunWorktrees(paths, a.workDir, () => {}),
      finalizeRunWorktrees(paths, b.workDir, () => {}),
    ]);
    expect(savedA[0]?.saved).toBe(true);
    expect(savedB[0]?.saved).toBe(true);
    expect(existsSync(a.workDir)).toBe(false);
    expect(existsSync(b.workDir)).toBe(false);
    expect(
      git(
        ['for-each-ref', '--format=%(objectname)', 'refs/runner/saved/'],
        a.repo.cache,
      ).split('\n'),
    ).toHaveLength(1);
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', 'refs/heads/agent/'],
        path.join(root, 'origin-repo.git'),
      ),
    ).toBe('');
    const c = await start('c');
    const files = ['a.txt', 'b.txt'].filter((name) =>
      existsSync(path.join(c.repo.dir, name)),
    );
    expect(files).toHaveLength(1);
    const other = files[0] === 'a.txt' ? 'b.txt' : 'a.txt';
    const ref = git(
      ['for-each-ref', '--format=%(refname)', 'refs/runner/saved/'],
      c.repo.cache,
    );
    expect(c.repo.warnings?.join(' ')).toContain(ref);
    expect(git(['show', `${ref}:${other}`], c.repo.cache)).toBe(other[0]);
    expect(
      git(['rev-list', '--parents', '-n', '1', 'HEAD'], c.repo.dir).split(' '),
    ).toHaveLength(2);
    await finalizeRunWorktrees(paths, c.workDir, () => {});
  });
  function seedSubmodule() {
    const child = makeRemote(root, 'child');
    const seed = path.join(root, 'origin-repo-seed');
    git(
      [
        '-c',
        'protocol.file.allow=always',
        'submodule',
        'add',
        child,
        'vendor/core',
      ],
      seed,
    );
    git([...COMMIT, 'commit', '-am', 'Add submodule fixture'], seed);
    publishSeed(root);
  }
  const oldSubmoduleReason =
    'Initialized submodules require recovery in the original worktree; their objects are not saved by a parent commit';
  async function oldSubmoduleRecovery(a: Awaited<ReturnType<typeof start>>) {
    await writeWorkspaceMeta(paths, a.workDir, {
      ...(await readWorkspaceMeta(paths, a.workDir))!,
      recoveryRequired: true,
      recoveryReason: oldSubmoduleReason,
    });
  }
  it('saves parent changes with uninitialized submodules and resumes without a recovery warning', async () => {
    seedSubmodule();
    const a = await start('uninitialized');
    expect(git(['submodule', 'status', '--recursive'], a.repo.dir)).toMatch(
      /^-/,
    );
    expect(git(['status', '--porcelain'], a.repo.dir)).toBe('');
    writeFileSync(path.join(a.repo.dir, 'pending.txt'), 'parent work');
    const saved = await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(saved[0].saved).toBe(true);
    const b = await start('uninitialized-resume');
    expect(readFileSync(path.join(b.repo.dir, 'pending.txt'), 'utf8')).toBe(
      'parent work',
    );
    expect(b.repo.warnings?.join(' ')).not.toContain('Resolve or recover');
    expect(
      (await finalizeRunWorktrees(paths, b.workDir, () => {}))[0].saved,
    ).toBe(true);
  });
  it('still retains initialized submodules and their uncommitted contents', async () => {
    seedSubmodule();
    const a = await start('initialized');
    git(
      ['-c', 'protocol.file.allow=always', 'submodule', 'update', '--init'],
      a.repo.dir,
    );
    const pending = path.join(a.repo.dir, 'vendor/core/pending.txt');
    writeFileSync(pending, 'submodule work');
    const saved = await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(saved[0]).toMatchObject({
      saved: false,
      reason: oldSubmoduleReason,
    });
    expect(readFileSync(pending, 'utf8')).toBe('submodule work');
    const b = await start('initialized-next');
    expect(b.repo.warnings?.join(' ')).toContain('Resolve or recover');
    expect(readFileSync(pending, 'utf8')).toBe('submodule work');
    await finalizeRunWorktrees(paths, b.workDir, () => {});
  });
  it('retains a deinitialized submodule object store with unpublished commits', async () => {
    seedSubmodule();
    const a = await start('deinitialized');
    git(
      ['-c', 'protocol.file.allow=always', 'submodule', 'update', '--init'],
      a.repo.dir,
    );
    const child = path.join(a.repo.dir, 'vendor/core');
    const head = commitFile(child, 'unpublished.txt');
    const childGitDir = git(['rev-parse', '--absolute-git-dir'], child);
    git(['submodule', 'deinit', '--force', '--', 'vendor/core'], a.repo.dir);
    expect(git(['submodule', 'status', '--recursive'], a.repo.dir)).toMatch(
      /^-/,
    );
    const saved = await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(saved[0]).toMatchObject({
      saved: false,
      reason: oldSubmoduleReason,
    });
    const b = await start('deinitialized-next');
    expect(b.repo.warnings?.join(' ')).toContain('Resolve or recover');
    expect(
      git(['--git-dir', childGitDir, 'show', `${head}:unpublished.txt`], root),
    ).toBe('unpublished.txt');
    await finalizeRunWorktrees(paths, b.workDir, () => {});
  });
  it('rechecks an inactive clean legacy submodule false alarm and preserves unpublished commits', async () => {
    seedSubmodule();
    const a = await start('legacy-submodule');
    commitFile(a.repo.dir, 'unpublished.txt');
    await oldSubmoduleRecovery(a);
    const b = await start('legacy-resume');
    expect(existsSync(a.workDir)).toBe(false);
    expect(b.repo.warnings?.join(' ')).not.toContain('Resolve or recover');
    expect(readFileSync(path.join(b.repo.dir, 'unpublished.txt'), 'utf8')).toBe(
      'unpublished.txt',
    );
    expect(
      (await readContinuationState(paths, 'app', 'PM-300'))?.activeWorkDirs,
    ).not.toContain(a.workDir);
    await finalizeRunWorktrees(paths, b.workDir, () => {});
  });
  it('defers a legacy submodule false alarm while its original attempt is locked', async () => {
    seedSubmodule();
    const a = await start('locked-legacy');
    await oldSubmoduleRecovery(a);
    const lock = await acquireLock(`${a.workDir}.lock`, { timeoutMs: 0 });
    let b: Awaited<ReturnType<typeof start>>;
    try {
      b = await start('locked-next');
      expect(existsSync(a.workDir)).toBe(true);
      expect(b.repo.warnings?.join(' ')).toContain('Resolve or recover');
    } finally {
      await lock.release();
    }
    await finalizeRunWorktrees(paths, b.workDir, () => {});
    const c = await start('unlocked-next');
    expect(existsSync(a.workDir)).toBe(false);
    expect(c.repo.warnings?.join(' ')).not.toContain('Resolve or recover');
    await finalizeRunWorktrees(paths, c.workDir, () => {});
  });
  it.each(['dirty', 'initialized', 'otherReason', 'otherSubject', 'otherApp'])(
    'does not auto-finalize an unsafe or unrelated legacy recovery: %s',
    async (condition) => {
      seedSubmodule();
      const a = await start('retained-legacy');
      await oldSubmoduleRecovery(a);
      if (condition === 'dirty')
        writeFileSync(path.join(a.repo.dir, 'pending.txt'), 'retain');
      if (condition === 'initialized')
        git(
          ['-c', 'protocol.file.allow=always', 'submodule', 'update', '--init'],
          a.repo.dir,
        );
      if (['otherReason', 'otherSubject', 'otherApp'].includes(condition)) {
        await writeWorkspaceMeta(paths, a.workDir, {
          ...(await readWorkspaceMeta(paths, a.workDir))!,
          ...(condition === 'otherReason'
            ? { recoveryReason: 'Unresolved Git operation' }
            : {}),
          ...(condition === 'otherSubject' ? { subjectKey: 'OTHER' } : {}),
          ...(condition === 'otherApp' ? { appKey: 'other-app' } : {}),
        });
      }
      const b = await start('retained-next');
      expect(existsSync(a.workDir)).toBe(true);
      expect(
        (await readWorkspaceMeta(paths, a.workDir))?.recoveryRequired,
      ).toBe(true);
      expect(b.repo.warnings?.join(' ')).toContain('Resolve or recover');
      if (condition === 'dirty')
        expect(readFileSync(path.join(a.repo.dir, 'pending.txt'), 'utf8')).toBe(
          'retain',
        );
      await finalizeRunWorktrees(paths, b.workDir, () => {});
    },
  );
  it('keeps an unresolved user merge instead of committing or deleting it', async () => {
    const a = await start('a');
    git(['checkout', '-b', 'other'], a.repo.dir);
    writeFileSync(path.join(a.repo.dir, 'conflict.txt'), 'other');
    git(['add', '.'], a.repo.dir);
    git([...COMMIT, 'commit', '-m', 'other'], a.repo.dir);
    git(['checkout', a.repo.localBranch!], a.repo.dir);
    writeFileSync(path.join(a.repo.dir, 'conflict.txt'), 'local');
    git(['add', '.'], a.repo.dir);
    git([...COMMIT, 'commit', '-m', 'local'], a.repo.dir);
    try {
      git(['merge', 'other'], a.repo.dir);
    } catch {
      /* Expected conflict. */
    }
    const result = await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(result[0].saved).toBe(false);
    expect(existsSync(a.repo.dir)).toBe(true);
    expect((await readWorkspaceMeta(paths, a.workDir))?.recoveryRequired).toBe(
      true,
    );
  });
  it('preserves agent branches, stash and current uncommitted work after removal and in the next run', async () => {
    const a = await start('branch-owner');
    git(['checkout', '-b', 'fix/agent-work'], a.repo.dir);
    writeFileSync(path.join(a.repo.dir, 'committed.txt'), 'agent branch');
    git(['add', '.'], a.repo.dir);
    git([...COMMIT, 'commit', '-m', 'agent commit'], a.repo.dir);
    writeFileSync(path.join(a.repo.dir, 'stashed.txt'), 'shared stash');
    git([...COMMIT, 'stash', 'push', '--include-untracked'], a.repo.dir);
    const stash = git(['rev-parse', 'refs/stash'], a.repo.dir);
    writeFileSync(path.join(a.repo.dir, 'pending.txt'), 'save current head');
    const reports = await reportRepos([a.repo], { push: true });
    expect(reports[0].pushed).toBe(false);
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', 'refs/heads/agent/'],
        path.join(root, 'origin-repo.git'),
      ),
    ).toBe('');
    const saved = await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(saved[0].saved).toBe(true);
    expect(existsSync(a.workDir)).toBe(false);
    expect(git(['rev-parse', 'refs/heads/fix/agent-work'], a.repo.cache)).toBe(
      saved[0].head,
    );
    expect(git(['rev-parse', 'refs/stash'], a.repo.cache)).toBe(stash);
    const b = await start('next-branch-owner');
    expect(existsSync(path.join(b.repo.dir, 'pending.txt'))).toBe(false);
    git(['checkout', 'fix/agent-work'], b.repo.dir);
    expect(readFileSync(path.join(b.repo.dir, 'committed.txt'), 'utf8')).toBe(
      'agent branch',
    );
    expect(readFileSync(path.join(b.repo.dir, 'pending.txt'), 'utf8')).toBe(
      'save current head',
    );
    git([...COMMIT, 'stash', 'apply'], b.repo.dir);
    expect(readFileSync(path.join(b.repo.dir, 'stashed.txt'), 'utf8')).toBe(
      'shared stash',
    );
    await finalizeRunWorktrees(paths, b.workDir, () => {});
    expect(git(['rev-parse', 'refs/stash'], b.repo.cache)).toBe(stash);
  });

  it('retains unpublished runner aliases even after saving continuation refs', async () => {
    const a = await start('unpublished-alias');
    writeFileSync(path.join(a.repo.dir, 'local.txt'), 'local');
    const saved = await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(existsSync(a.workDir)).toBe(false);
    expect(
      git(['rev-parse', `refs/heads/${a.repo.localBranch}`], a.repo.cache),
    ).toBe(saved[0].head);
  });

  it('cleans a published runner alias but preserves an agent branch at the same commit', async () => {
    const a = await start('published-alias');
    git(['branch', 'fix/keep-published'], a.repo.dir);
    git(['branch', 'runner-run-agent-owned'], a.repo.dir);
    git(['push', a.repo.url, 'HEAD:refs/heads/agent/PM-300'], a.repo.dir);
    await reportRepos([a.repo], { push: false });
    const head = git(['rev-parse', 'HEAD'], a.repo.dir);
    await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(
      git(
        [
          'for-each-ref',
          '--format=%(refname)',
          `refs/heads/${a.repo.localBranch}`,
        ],
        a.repo.cache,
      ),
    ).toBe('');
    expect(
      git(['rev-parse', 'refs/heads/fix/keep-published'], a.repo.cache),
    ).toBe(head);
    expect(
      git(['rev-parse', 'refs/heads/runner-run-agent-owned'], a.repo.cache),
    ).toBe(head);
  });

  it('preserves a switched-away runner alias with unpublished commits', async () => {
    const a = await start('switched-away');
    writeFileSync(path.join(a.repo.dir, 'alias.txt'), 'unpublished alias');
    git(['add', '.'], a.repo.dir);
    git([...COMMIT, 'commit', '-m', 'alias work'], a.repo.dir);
    const head = git(['rev-parse', 'HEAD'], a.repo.dir);
    git(
      ['checkout', '-b', 'fix/separate', 'refs/remotes/origin/main'],
      a.repo.dir,
    );
    await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(
      git(['rev-parse', `refs/heads/${a.repo.localBranch}`], a.repo.cache),
    ).toBe(head);
    expect(git(['show', `${head}:alias.txt`], a.repo.cache)).toBe(
      'unpublished alias',
    );
  });

  it('retains a published alias while another worktree has it checked out', async () => {
    const a = await start('active-alias');
    git(['checkout', '-b', 'fix/elsewhere'], a.repo.dir);
    const job = path.join(root, 'other-worktree');
    git(['worktree', 'add', job, a.repo.localBranch!], a.repo.cache);
    const head = git(['rev-parse', 'HEAD'], job);
    await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(
      git(['rev-parse', `refs/heads/${a.repo.localBranch}`], a.repo.cache),
    ).toBe(head);
    expect(git(['status', '--porcelain'], job)).toBe('');
    git(['worktree', 'remove', job], a.repo.cache);
  });
  it('discards read-only changes without updating continuation refs or deleting another run', async () => {
    const a = await start('a');
    const b = await start('b', true);
    writeFileSync(path.join(b.repo.dir, 'readonly.txt'), 'discard');
    await finalizeRunWorktrees(paths, b.workDir, () => {});
    expect(existsSync(a.repo.dir)).toBe(true);
    expect(existsSync(b.workDir)).toBe(false);
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', 'refs/runner/'],
        a.repo.cache,
      ),
    ).toBe('');
    await finalizeRunWorktrees(paths, a.workDir, () => {});
  });
  it('retains a snapshot during pending input, then fast-forwards the resume ref with later edits', async () => {
    const a = await start('a');
    writeFileSync(path.join(a.repo.dir, 'first.txt'), 'first');
    const first = await finalizeRunWorktrees(paths, a.workDir, () => {}, {
      remove: false,
    });
    expect(first[0]?.saved).toBe(true);
    expect(existsSync(a.repo.dir)).toBe(true);
    writeFileSync(path.join(a.repo.dir, 'second.txt'), 'second');
    const second = await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(second[0]?.head).not.toBe(first[0]?.head);
    const b = await start('b');
    expect(readFileSync(path.join(b.repo.dir, 'first.txt'), 'utf8')).toBe(
      'first',
    );
    expect(readFileSync(path.join(b.repo.dir, 'second.txt'), 'utf8')).toBe(
      'second',
    );
    await finalizeRunWorktrees(paths, b.workDir, () => {});
  });

  it('retains half-deleted files without pushed evidence and does not commit their deletion', async () => {
    const a = await start('a');
    writeFileSync(path.join(a.repo.dir, 'kept.txt'), 'kept');
    const [saved] = await finalizeRunWorktrees(paths, a.workDir, () => {}, {
      remove: false,
    });
    const meta = (await readWorkspaceMeta(paths, a.workDir))!;
    const repo = meta.repos[0]!;
    await writeWorkspaceMeta(paths, a.workDir, {
      ...meta,
      repos: [{ ...repo, removing: true }],
    });
    rmSync(path.join(a.repo.dir, 'kept.txt'));
    const [finished] = await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(finished?.saved).toBe(false);
    expect(existsSync(a.workDir)).toBe(true);
    expect((await readWorkspaceMeta(paths, a.workDir))?.recoveryRequired).toBe(
      true,
    );
    expect(
      git(['rev-parse', `refs/runner/resume/${repo.continuation}`], repo.cache),
    ).toBe(saved?.head);
  });

  it('keeps a switched branch on its own ref without a saved head for the initial target', async () => {
    const a = await start('a');
    git(['checkout', '-b', 'unexpected'], a.repo.dir);
    writeFileSync(path.join(a.repo.dir, 'recovery.txt'), 'retain');
    expect(
      (await finalizeRunWorktrees(paths, a.workDir, () => {}))[0]?.saved,
    ).toBe(true);
    expect(existsSync(a.workDir)).toBe(false);
    const b = await start('b');
    expect(b.repo.warnings?.join(' ')).not.toContain(
      'Additional saved commits',
    );
    expect(
      git(['show', 'refs/heads/unexpected:recovery.txt'], b.repo.cache),
    ).toBe('retain');
    await finalizeRunWorktrees(paths, b.workDir, () => {});
  });

  it('adds no manual-integration note to the initial target for a pushed switched branch', async () => {
    const a = await start('a');
    git(['checkout', '-b', 'feature/other'], a.repo.dir);
    writeFileSync(path.join(a.repo.dir, 'other.txt'), 'other');
    git(['add', 'other.txt'], a.repo.dir);
    git(['commit', '-m', 'other'], a.repo.dir);
    git(['push', a.repo.url, 'HEAD:refs/heads/feature/other'], a.repo.dir);
    await finalizeRunWorktrees(paths, a.workDir, () => {});
    const b = await start('b');
    expect(b.repo.warnings?.join(' ')).not.toContain(
      'Additional saved commits',
    );
    expect(existsSync(path.join(b.repo.dir, 'other.txt'))).toBe(false);
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', 'refs/runner/saved/'],
        b.repo.cache,
      ),
    ).toBe('');
    await finalizeRunWorktrees(paths, b.workDir, () => {});
  });

  it('reports a switched branch without a failure and never pushes it to the initial target', async () => {
    const a = await start('a');
    git(['checkout', '-b', 'fix/reported'], a.repo.dir);
    writeFileSync(path.join(a.repo.dir, 'reported.txt'), 'reported');
    git(['add', 'reported.txt'], a.repo.dir);
    git(['commit', '-m', 'reported'], a.repo.dir);
    const [report] = await reportRepos([a.repo], { push: true });
    expect(report?.failure).toBeUndefined();
    expect(report?.pushed).toBe(false);
    expect(
      git(['ls-remote', a.repo.url, 'refs/heads/agent/PM-300'], a.repo.dir),
    ).toBe('');
    await finalizeRunWorktrees(paths, a.workDir, () => {});
  });

  it('saves a detached HEAD whose commits no branch or remote reaches', async () => {
    const a = await start('a');
    git(['checkout', '--detach'], a.repo.dir);
    writeFileSync(path.join(a.repo.dir, 'detached.txt'), 'detached');
    git(['add', 'detached.txt'], a.repo.dir);
    git(['commit', '-m', 'detached'], a.repo.dir);
    const head = git(['rev-parse', 'HEAD'], a.repo.dir);
    await finalizeRunWorktrees(paths, a.workDir, () => {});
    const b = await start('b');
    expect(b.repo.warnings?.join(' ')).toContain('Additional saved commits');
    expect(b.repo.warnings?.join(' ')).toContain(head);
    await finalizeRunWorktrees(paths, b.workDir, () => {});
  });

  it('leaves legacy clones to GC and starts from the remote without importing their files', async () => {
    const legacy = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-300',
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
    writeFileSync(path.join(legacy.repos[0].dir, 'legacy.txt'), 'legacy');
    await legacy.release();
    const next = await start('new');
    expect(existsSync(path.join(next.repo.dir, 'legacy.txt'))).toBe(false);
    expect(existsSync(legacy.repos[0].dir)).toBe(true);
    await finalizeRunWorktrees(paths, next.workDir, () => {});
  });
  it('keeps initialization state across disposable worktrees', async () => {
    const a = await start('a');
    expect(a.prepared.dirs[0]!.fresh).toBe(true);
    await markDirsPrepared(paths, a.workDir, a.prepared.dirs);
    await finalizeRunWorktrees(paths, a.workDir, () => {});
    const b = await start('b');
    expect(b.prepared.dirs[0]!.fresh).toBe(false);
    await finalizeRunWorktrees(paths, b.workDir, () => {});
  });

  it('refuses continuation cleanup during a run and removes only this task refs after finalization', async () => {
    const a = await start('a');
    const stateDir = continuationWorkDir(paths, 'app', 'PM-300');
    const lock = await acquireLock(`${stateDir}.lock`);
    try {
      await expect(
        clearContinuations(
          paths,
          stateDir,
          (await readWorkspaceMeta(paths, stateDir))!,
        ),
      ).rejects.toThrow('active or recovery');
    } finally {
      await lock.release();
    }
    writeFileSync(path.join(a.repo.dir, 'saved.txt'), 'saved');
    await finalizeRunWorktrees(paths, a.workDir, () => {});
    const other = 'refs/runner/saved/unrelated/head';
    git(['update-ref', other, 'refs/remotes/origin/main'], a.repo.cache);
    const cleanupLock = await acquireLock(`${stateDir}.lock`);
    try {
      await clearContinuations(
        paths,
        stateDir,
        (await readWorkspaceMeta(paths, stateDir))!,
      );
    } finally {
      await cleanupLock.release();
    }
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', 'refs/runner/'],
        a.repo.cache,
      ),
    ).toBe(other);
    expect(existsSync(a.repo.cache)).toBe(true);
  });
  it('starts a clean continuation generation without discarding earlier local heads', async () => {
    const a = await start('a');
    writeFileSync(path.join(a.repo.dir, 'previous.txt'), 'recoverable');
    const saved = await finalizeRunWorktrees(paths, a.workDir, () => {});
    const clean = await start('clean', false, true);
    expect(existsSync(path.join(clean.repo.dir, 'previous.txt'))).toBe(false);
    expect(
      git(['cat-file', '-p', saved[0]!.head!], clean.repo.cache),
    ).toContain('Update previous.txt');
    writeFileSync(path.join(clean.repo.dir, 'fresh.txt'), 'fresh');
    await finalizeRunWorktrees(paths, clean.workDir, () => {});
    const next = await start('next');
    expect(readFileSync(path.join(next.repo.dir, 'previous.txt'), 'utf8')).toBe(
      'recoverable',
    );
    expect(existsSync(path.join(next.repo.dir, 'fresh.txt'))).toBe(false);
    expect(next.repo.warnings?.join(' ')).toContain('Additional saved commits');
    await finalizeRunWorktrees(paths, next.workDir, () => {});
  });

  it('starts from a remote fast-forward without rewriting local continuation history', async () => {
    const a = await start('a');
    writeFileSync(path.join(a.repo.dir, 'local.txt'), 'local');
    const saved = await finalizeRunWorktrees(paths, a.workDir, () => {});
    const resume = git(
      ['for-each-ref', '--format=%(refname)', 'refs/runner/resume/'],
      a.repo.cache,
    );
    const seed = path.join(root, 'origin-repo-seed');
    git(['fetch', a.repo.cache, resume], seed);
    git(['checkout', '-B', 'main', 'FETCH_HEAD'], seed);
    writeFileSync(path.join(seed, 'remote.txt'), 'remote');
    git(['add', '.'], seed);
    git([...COMMIT, 'commit', '-m', 'fast forward'], seed);
    git(
      ['fetch', seed, 'refs/heads/main:refs/heads/agent/PM-300'],
      path.join(root, 'origin-repo.git'),
    );
    const b = await start('b');
    expect(readFileSync(path.join(b.repo.dir, 'local.txt'), 'utf8')).toBe(
      'local',
    );
    expect(readFileSync(path.join(b.repo.dir, 'remote.txt'), 'utf8')).toBe(
      'remote',
    );
    expect(git(['rev-parse', resume], b.repo.cache)).toBe(saved[0].head);
    await finalizeRunWorktrees(paths, b.workDir, () => {});
    expect(git(['rev-parse', resume], b.repo.cache)).toBe(
      git(['rev-parse', 'HEAD'], seed),
    );
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', 'refs/runner/saved/'],
        b.repo.cache,
      ),
    ).toBe('');
  });

  it('lists remote divergence without merging it into local continuation', async () => {
    const a = await start('a');
    writeFileSync(path.join(a.repo.dir, 'local.txt'), 'local');
    await finalizeRunWorktrees(paths, a.workDir, () => {});
    const seed = path.join(root, 'origin-repo-seed');
    writeFileSync(path.join(seed, 'remote.txt'), 'remote');
    git(['add', '.'], seed);
    git([...COMMIT, 'commit', '-m', 'remote change'], seed);
    git(
      ['fetch', seed, 'refs/heads/main:refs/heads/agent/PM-300'],
      path.join(root, 'origin-repo.git'),
    );
    const b = await start('b');
    expect(readFileSync(path.join(b.repo.dir, 'local.txt'), 'utf8')).toBe(
      'local',
    );
    expect(existsSync(path.join(b.repo.dir, 'remote.txt'))).toBe(false);
    expect(b.repo.warnings?.join(' ')).toContain('no automatic merge');
    expect(
      git(['rev-list', '--parents', '-n', '1', 'HEAD'], b.repo.dir).split(' '),
    ).toHaveLength(2);
    await finalizeRunWorktrees(paths, b.workDir, () => {});
  });

  it('keeps other linked job worktrees usable when enabling per-worktree configuration', async () => {
    const a = await start('a');
    const job = path.join(root, 'job');
    git(
      ['worktree', 'add', '--detach', job, 'refs/remotes/origin/main'],
      a.repo.cache,
    );
    expect(git(['rev-parse', '--is-inside-work-tree'], job)).toBe('true');
    expect(git(['rev-parse', '--is-bare-repository'], a.repo.cache)).toBe(
      'true',
    );
    await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(existsSync(path.join(job, 'README.md'))).toBe(true);
    expect(git(['status', '--porcelain'], job)).toBe('');
    git(['worktree', 'remove', job], a.repo.cache);
  });
  it('retains the checkout and its commit when publishing the resume ref fails', async () => {
    const a = await start('a');
    writeFileSync(
      path.join(a.repo.dir, 'must-survive.txt'),
      'retain on failure',
    );
    git(
      ['update-ref', `refs/runner/resume`, 'refs/remotes/origin/main'],
      a.repo.cache,
    );
    const result = await finalizeRunWorktrees(paths, a.workDir, () => {});
    expect(result[0]?.saved).toBe(false);
    expect(existsSync(a.repo.dir)).toBe(true);
    expect(
      readFileSync(path.join(a.repo.dir, 'must-survive.txt'), 'utf8'),
    ).toBe('retain on failure');
    expect(git(['show', 'HEAD:must-survive.txt'], a.repo.dir)).toBe(
      'retain on failure',
    );
    expect((await readWorkspaceMeta(paths, a.workDir))?.recoveryRequired).toBe(
      true,
    );
  });
  it('uses no remote credential or push after the lease is lost, but still saves locally', async () => {
    const a = await start('lost');
    writeFileSync(path.join(a.repo.dir, 'local-only.txt'), 'local only');
    git(['add', '.'], a.repo.dir);
    git([...COMMIT, 'commit', '-m', 'unpublished'], a.repo.dir);
    const get = vi.fn(async () => {
      throw new Error('Remote access must not begin after lease loss');
    });
    const reports = await reportRepos([a.repo], {
      push: true,
      active: () => false,
      auth: { covers: () => true, get, erase: () => false },
    });
    expect(get).not.toHaveBeenCalled();
    expect(reports[0]?.pushed).toBe(false);
    expect(
      (await finalizeRunWorktrees(paths, a.workDir, () => {}))[0]?.saved,
    ).toBe(true);
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', 'refs/heads/agent/'],
        path.join(root, 'origin-repo.git'),
      ),
    ).toBe('');
  });
  it('does not collide with an existing remote branch named runner', async () => {
    git(
      ['update-ref', 'refs/heads/runner', 'refs/heads/main'],
      path.join(root, 'origin-repo.git'),
    );
    const a = await start('branch-collision');
    expect(a.repo.localBranch).toMatch(/^runner-run-/u);
    expect(git(['rev-parse', 'refs/heads/runner'], a.repo.cache)).toBe(
      git(
        ['rev-parse', 'refs/heads/runner'],
        path.join(root, 'origin-repo.git'),
      ),
    );
    await finalizeRunWorktrees(paths, a.workDir, () => {});
  });
});
