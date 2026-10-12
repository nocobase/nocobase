import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import {
  prepareDirs,
  readWorkspaceMeta,
  checkout,
  acquireLock,
  markDirsPrepared,
  reportRepos,
} from '../src/core/checkout.ts';
import {
  finalizeRunWorktrees,
  runWorkDir,
  clearContinuations,
  continuationWorkDir,
} from '../src/core/run-worktrees.ts';
import { git, makeRemote, removeDir, tempDir } from './helpers.ts';

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
  it('starts two unmarked writers, saves both heads, and merges both contents on the next run', async () => {
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
    ).toHaveLength(2);
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', 'refs/heads/agent/'],
        path.join(root, 'origin-repo.git'),
      ),
    ).toBe('');
    const c = await start('c');
    expect(readFileSync(path.join(c.repo.dir, 'a.txt'), 'utf8')).toBe('a');
    expect(readFileSync(path.join(c.repo.dir, 'b.txt'), 'utf8')).toBe('b');
    await finalizeRunWorktrees(paths, c.workDir, () => {});
  });
  it.each(['conflict.txt', '.gitmodules'])(
    'keeps unresolved %s merges and files for recovery',
    async (file) => {
      const a = await start('a');
      const b = await start('b');
      for (const [run, text] of [
        [a, 'a'],
        [b, 'b'],
      ] as const) {
        writeFileSync(path.join(run.repo.dir, file), `#${text}`);
        git(['add', '.'], run.repo.dir);
        git([...COMMIT, 'commit', '-m', text], run.repo.dir);
        await finalizeRunWorktrees(paths, run.workDir, () => {});
      }
      const c = await start('c');
      expect(c.repo.warnings?.join(' ')).toContain('Resolve the merge');
      expect(
        git(['diff', '--name-only', '--diff-filter=U'], c.repo.dir),
      ).toContain(file);
      const result = await finalizeRunWorktrees(paths, c.workDir, () => {});
      expect(result[0]?.saved).toBe(false);
      expect(existsSync(c.repo.dir)).toBe(true);
      expect(
        (await readWorkspaceMeta(paths, c.workDir))?.recoveryRequired,
      ).toBe(true);
    },
  );
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
  it('retains a snapshot during pending input, then saves later edits under a different immutable ref', async () => {
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

  it('imports unpublished legacy files and commits while retaining the legacy checkout', async () => {
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
    writeFileSync(path.join(legacy.repos[0]!.dir, 'legacy.txt'), 'legacy');
    await legacy.release();
    const next = await start('new');
    expect(readFileSync(path.join(next.repo.dir, 'legacy.txt'), 'utf8')).toBe(
      'legacy',
    );
    expect(existsSync(legacy.repos[0]!.dir)).toBe(true);
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
  it('starts a clean continuation generation without discarding earlier saved heads', async () => {
    const a = await start('a');
    writeFileSync(path.join(a.repo.dir, 'previous.txt'), 'recoverable');
    const saved = await finalizeRunWorktrees(paths, a.workDir, () => {});
    const clean = await start('clean', false, true);
    expect(existsSync(path.join(clean.repo.dir, 'previous.txt'))).toBe(false);
    expect(clean.repo.continuationEpoch).not.toBe(a.repo.continuationEpoch);
    expect(
      git(['cat-file', '-p', saved[0]!.head!], clean.repo.cache),
    ).toContain('chore(runner)');
    writeFileSync(path.join(clean.repo.dir, 'fresh.txt'), 'fresh');
    await finalizeRunWorktrees(paths, clean.workDir, () => {});
    const next = await start('next');
    expect(existsSync(path.join(next.repo.dir, 'previous.txt'))).toBe(false);
    expect(readFileSync(path.join(next.repo.dir, 'fresh.txt'), 'utf8')).toBe(
      'fresh',
    );
    await finalizeRunWorktrees(paths, next.workDir, () => {});
  });

  it('merges divergent remote target changes on the next worktree', async () => {
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
    expect(readFileSync(path.join(b.repo.dir, 'remote.txt'), 'utf8')).toBe(
      'remote',
    );
    expect(
      git(['rev-list', '--parents', '-n', '1', 'HEAD'], b.repo.dir).split(' '),
    ).toHaveLength(3);
    await finalizeRunWorktrees(paths, b.workDir, () => {});
  });

  it('does not fall back when the selected PR remote branch is missing', async () => {
    const workDir = runWorkDir(paths, 'app', 'PM-300', 'pr-missing', 1);
    await expect(
      prepareDirs({
        paths,
        appKey: 'app',
        subjectKey: 'PM-300',
        runId: 'pr-missing',
        perRun: true,
        workDir,
        dirs: [
          {
            kind: 'repo',
            url: remote,
            path: 'repo',
            branch: 'fix/missing',
            defaultBranch: 'main',
            pullRequest: { number: 123, url: 'https://example.com/pull/123' },
          },
        ],
      }),
    ).rejects.toThrow('selected pull request branch');
    expect(existsSync(path.join(workDir, 'repo', '.git'))).toBe(false);
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
  it('retains the checkout and its commit when publishing a saved ref fails', async () => {
    const a = await start('a');
    writeFileSync(
      path.join(a.repo.dir, 'must-survive.txt'),
      'retain on failure',
    );
    git(
      [
        'update-ref',
        `refs/runner/saved/${a.repo.continuation}`,
        'refs/remotes/origin/main',
      ],
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
