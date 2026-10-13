import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { waitFor } from './fake-server.ts';
import { workspaceHolders } from '../src/core/process-tree.ts';
import * as fsPromises from 'node:fs/promises';
import * as checkoutModule from '../src/core/checkout.ts';
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
} from '../src/core/run-worktrees.ts';
import { git, makeRemote, removeDir, tempDir } from './helpers.ts';

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
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    remote = makeRemote(root);
  });
  afterEach(() => removeDir(root));
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
  async function interruptedRemoval(id: string) {
    const a = await start(id);
    git(['push', a.repo.url, 'HEAD:refs/heads/agent/PM-300'], a.repo.dir);
    await markWorkspaceEnded(
      paths,
      a.workDir,
      await reportRepos([a.repo], { push: true }),
    );
    const original = checkoutModule.git;
    const spy = vi
      .spyOn(checkoutModule, 'git')
      .mockImplementation(async (args, ...rest) => {
        if (args[0] === 'worktree' && args[1] === 'remove') {
          rmSync(path.join(a.repo.dir, '.git'));
          throw new Error('EACCES: injected interrupted removal');
        }
        return original(args, ...rest);
      });
    try {
      const result = await finalizeRunWorktrees(paths, a.workDir, () => {});
      expect(result.every((entry) => entry.saved)).toBe(true);
    } finally {
      spy.mockRestore();
    }
    expect(existsSync(path.join(a.repo.dir, '.git'))).toBe(false);
    expect(
      (await readWorkspaceMeta(paths, a.workDir))?.recoveryRequired,
    ).not.toBe(true);
    expect(await readWorkspaceMeta(paths, a.workDir)).toMatchObject({
      recoveryReason: expect.stringContaining('EACCES'),
      repos: [expect.objectContaining({ removing: true })],
    });
    return a;
  }

  it.skipIf(process.platform !== 'linux')(
    'GC finishes a pushed interrupted removal without Git metadata and does not block the next run',
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
    'protects %s work even with a removal marker',
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
        recoveryRequired: false,
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

  it('finishes an interrupted removal without committing its half-deleted files', async () => {
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
    expect(finished?.saved).toBe(true);
    expect(existsSync(a.workDir)).toBe(false);
    expect(
      git(['rev-parse', `refs/runner/resume/${repo.continuation}`], repo.cache),
    ).toBe(saved?.head);
  });

  it('preserves the worktree when the local branch changes, and tells a subsequent run where recovery remains', async () => {
    const a = await start('a');
    git(['checkout', '-b', 'unexpected'], a.repo.dir);
    writeFileSync(path.join(a.repo.dir, 'recovery.txt'), 'retain');
    expect(
      (await finalizeRunWorktrees(paths, a.workDir, () => {}))[0]?.saved,
    ).toBe(false);
    const b = await start('b');
    expect(b.repo.warnings?.join(' ')).toContain(a.workDir);
    expect(readFileSync(path.join(a.repo.dir, 'recovery.txt'), 'utf8')).toBe(
      'retain',
    );
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
    ).toContain('chore(runner)');
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
