import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import {
  acquireLock,
  checkout,
  gcWorkspaces,
  markWorkspaceEnded,
  reportRepos,
  subjectWorkDir,
  markDirsPrepared,
} from '../src/core/checkout.ts';
import { git, makeRemote, removeDir, tempDir } from './helpers.ts';

const COMMIT = [
  '-c',
  'user.name=A',
  '-c',
  'user.email=a@example.com',
  '-c',
  'commit.gpgsign=false',
];

describe('checkout', () => {
  let root: string;
  let paths: RunnerPaths;
  let remote: string;

  beforeEach(() => {
    root = tempDir('nocobase-runner-checkout-');
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    remote = makeRemote(root);
  });
  afterEach(() => removeDir(root));

  const repo = (key: string) => ({
    kind: 'repo' as const,
    url: remote,
    defaultBranch: 'main',
    branch: `agent/${key}`,
    path: 'app',
  });

  it('creates a worktree on the subject branch from a bare cache, and reuses it', async () => {
    const first = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-1',
      dirs: [repo('PM-1')],
    });
    const dir = path.join(first.workDir, 'app');
    expect(first.workDir).toBe(subjectWorkDir(paths, 'app', 'PM-1'));
    expect(git(['symbolic-ref', '--short', 'HEAD'], dir)).toBe('agent/PM-1');
    expect(existsSync(first.repos[0]?.cache ?? '')).toBe(true);
    expect(
      git(['rev-parse', '--is-bare-repository'], first.repos[0]?.cache),
    ).toBe('true');
    writeFileSync(path.join(dir, 'work.txt'), 'in progress');
    await first.release();

    const second = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-1',
      dirs: [repo('PM-1')],
    });
    expect(existsSync(path.join(second.workDir, 'app', 'work.txt'))).toBe(true);
    await second.release();
  });

  it('pushes a branch with commits and reports it', async () => {
    const work = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-2',
      dirs: [repo('PM-2')],
    });
    const dir = path.join(work.workDir, 'app');
    expect(await reportRepos(work.repos, { push: true })).toEqual([
      expect.objectContaining({ branch: 'agent/PM-2', pushed: false }),
    ]);
    writeFileSync(path.join(dir, 'a.txt'), 'a');
    git([...COMMIT, 'add', '.'], dir);
    git([...COMMIT, 'commit', '-q', '-m', 'a'], dir);
    const [report] = await reportRepos(work.repos, { push: true });
    expect(report).toMatchObject({
      pushed: true,
      headSha: git(['rev-parse', 'HEAD'], dir),
    });
    await work.release();
  });

  it('makes the first commit of an empty repository on its default branch, and only for an initial run', async () => {
    const empty = path.join(root, 'empty.git');
    git(['init', '--quiet', '--bare', '--initial-branch=main', empty]);
    const dir = {
      kind: 'repo' as const,
      url: `file://${empty}`,
      defaultBranch: 'main',
      branch: 'main',
      path: 'app',
    };
    await expect(
      checkout({ paths, appKey: 'app', subjectKey: 'PM-9', dirs: [dir] }),
    ).rejects.toThrow(/default branch/u);

    const work = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-9',
      dirs: [{ ...dir, initial: true }],
    });
    const app = path.join(work.workDir, 'app');
    expect(git(['symbolic-ref', '--short', 'HEAD'], app)).toBe('main');
    writeFileSync(path.join(app, 'package.json'), '{}');
    git([...COMMIT, 'add', '.'], app);
    git([...COMMIT, 'commit', '-q', '-m', 'Initialize'], app);
    const [report] = await reportRepos(work.repos, { push: true });
    expect(report).toMatchObject({ branch: 'main', pushed: true });
    expect(git(['rev-parse', 'refs/heads/main'], empty)).toBe(report?.headSha);
    await work.release();
  });

  it('starts from the remote subject branch when another runner pushed it', async () => {
    const other = await checkout({
      paths: runnerPaths(
        path.join(root, 'other'),
        path.join(root, 'other-work'),
      ),
      appKey: 'app',
      subjectKey: 'PM-3',
      dirs: [repo('PM-3')],
    });
    const otherDir = path.join(other.workDir, 'app');
    writeFileSync(path.join(otherDir, 'b.txt'), 'b');
    git([...COMMIT, 'add', '.'], otherDir);
    git([...COMMIT, 'commit', '-q', '-m', 'b'], otherDir);
    await reportRepos(other.repos, { push: true });
    await other.release();

    const mine = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-3',
      dirs: [repo('PM-3')],
    });
    expect(existsSync(path.join(mine.workDir, 'app', 'b.txt'))).toBe(true);
    await mine.release();
  });

  it("lets a worktree push only its run's branch, to its own repository", async () => {
    const work = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-8',
      dirs: [repo('PM-8')],
    });
    const dir = path.join(work.workDir, 'app');
    writeFileSync(path.join(dir, 'c.txt'), 'c');
    git([...COMMIT, 'add', '.'], dir);
    git([...COMMIT, 'commit', '-q', '-m', 'c'], dir);
    const push = (args: string[], cwd = dir, env: NodeJS.ProcessEnv = {}) => {
      try {
        execFileSync('git', ['push', '--quiet', ...args], {
          cwd,
          env: { ...process.env, ...env },
          stdio: 'pipe',
        });
        return 'pushed';
      } catch (error) {
        return String((error as { stderr?: Buffer }).stderr ?? error);
      }
    };
    expect(push(['origin', 'HEAD:main'])).toContain(
      'may push only the branch agent/PM-8',
    );
    expect(push(['origin', 'HEAD:refs/tags/v1'])).toContain(
      'may push only the branch agent/PM-8',
    );
    const elsewhere = path.join(root, 'elsewhere.git');
    git(['init', '--quiet', '--bare', elsewhere]);
    expect(push([elsewhere, 'HEAD:agent/PM-8'])).toContain('may push only to');
    expect(push(['origin', 'HEAD:agent/PM-8'])).toBe('pushed');
    expect(push(['--force', 'origin', 'HEAD~1:agent/PM-8'])).toBe('pushed');
    expect(push(['origin', ':agent/PM-8'])).toContain('not allowed');

    // A clone the agent makes itself has no permission at all, once its git uses the runner's hooks.
    const clone = path.join(work.workDir, 'own');
    git(['clone', '--quiet', remote.replace('file://', ''), clone]);
    expect(
      push(['origin', 'HEAD:main'], clone, {
        GIT_CONFIG_COUNT: '1',
        GIT_CONFIG_KEY_0: 'core.hooksPath',
        GIT_CONFIG_VALUE_0: path.join(work.repos[0]!.cache, 'hooks'),
      }),
    ).toContain("only from the run's own checkouts");
    await work.release();
  });

  it('refuses a repository path outside the work directory', async () => {
    await expect(
      checkout({
        paths,
        appKey: 'app',
        subjectKey: 'PM-4',
        dirs: [{ ...repo('PM-4'), path: '../escape' }],
      }),
    ).rejects.toThrow(/outside the work directory/);
  });

  it('keeps a working directory fresh until a run finishes in it, and again after a clean', async () => {
    const own = path.join(root, 'own-dir');
    mkdirSync(own);
    writeFileSync(path.join(own, 'keep.txt'), 'mine');
    const dirs = [
      { ...repo('PM-10'), initPrompt: 'pnpm install' },
      { kind: 'directory' as const, path: own },
    ];
    const first = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-10',
      dirs,
    });
    expect(first.dirs.map((dir) => [dir.kind, dir.fresh, dir.primary])).toEqual(
      [
        ['repo', true, true],
        ['directory', true, false],
      ],
    );
    expect(first.dirs[0]?.initPrompt).toBe('pnpm install');
    expect(first.dirs[1]?.dir).toBe(own);
    await first.release();

    // The first run died before finishing: the next attempt is told to initialize again.
    const retried = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-10',
      dirs,
    });
    expect(retried.dirs.map((dir) => dir.fresh)).toEqual([true, true]);
    await markDirsPrepared(retried.workDir, retried.dirs);
    await retried.release();

    const second = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-10',
      dirs,
    });
    expect(second.dirs.map((dir) => dir.fresh)).toEqual([false, false]);
    writeFileSync(path.join(second.workDir, 'app', 'work.txt'), 'x');
    await second.release();

    const cleaned = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-10',
      dirs,
      clean: true,
    });
    expect(cleaned.dirs.map((dir) => dir.fresh)).toEqual([true, true]);
    expect(existsSync(path.join(cleaned.workDir, 'app', 'work.txt'))).toBe(
      false,
    );
    // A directory used in place is never cleaned.
    expect(existsSync(path.join(own, 'keep.txt'))).toBe(true);
    await cleaned.release();
  });

  it('uses a directory in place, one run at a time, and refuses a missing one', async () => {
    const own = path.join(root, 'in-place');
    mkdirSync(own);
    const dirs = [{ kind: 'directory' as const, path: own }];
    const first = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-11',
      dirs,
    });
    expect(first.repos).toEqual([]);
    await expect(
      checkout({
        paths,
        appKey: 'app',
        subjectKey: 'PM-12',
        dirs,
        lockTimeoutMs: 300,
      }),
    ).rejects.toThrow(/held by process/);
    await first.release();
    const again = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-12',
      dirs,
    });
    await again.release();

    await expect(
      checkout({
        paths,
        appKey: 'app',
        subjectKey: 'PM-13',
        dirs: [{ kind: 'directory', path: path.join(root, 'missing') }],
      }),
    ).rejects.toThrow(/does not exist/);
    await expect(
      checkout({
        paths,
        appKey: 'app',
        subjectKey: 'PM-13',
        dirs: [{ kind: 'directory', path: paths.workRoot }],
      }),
    ).rejects.toThrow(/runner's own directory/);
  });

  it('serializes a subject with a lock and takes over a dead owner', async () => {
    const lockDir = path.join(root, 'x.lock');
    const held = await acquireLock(lockDir);
    await expect(
      acquireLock(lockDir, { timeoutMs: 300, pollMs: 50 }),
    ).rejects.toThrow(/held by process/);
    await held.release();
    mkdirSync(lockDir);
    writeFileSync(path.join(lockDir, 'owner'), '999999');
    const taken = await acquireLock(lockDir, { timeoutMs: 1_000 });
    await taken.release();
  });

  it('collects pushed work directories after 7 days and idle ones after 30', async () => {
    const pushed = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-5',
      dirs: [repo('PM-5')],
    });
    await pushed.release();
    await markWorkspaceEnded(pushed.workDir, true);
    const kept = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-6',
      dirs: [repo('PM-6')],
    });
    await kept.release();
    await markWorkspaceEnded(kept.workDir, false);
    const day = 24 * 60 * 60 * 1000;

    expect(await gcWorkspaces({ paths, now: Date.now() + 6 * day })).toEqual(
      [],
    );
    expect(await gcWorkspaces({ paths, now: Date.now() + 8 * day })).toEqual([
      pushed.workDir,
    ]);
    expect(existsSync(pushed.workDir)).toBe(false);
    expect(git(['worktree', 'list'], pushed.repos[0]?.cache)).not.toContain(
      'PM-5',
    );
    expect(await gcWorkspaces({ paths, now: Date.now() + 31 * day })).toEqual([
      kept.workDir,
    ]);
    utimesSync(root, new Date(), new Date());
  });
});
