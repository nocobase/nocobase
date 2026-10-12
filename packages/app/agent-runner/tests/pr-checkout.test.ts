import { writeFileSync, readFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import { checkout, reportRepos } from '../src/core/checkout.ts';
import { git, makeRemote, removeDir, tempDir } from './helpers.ts';

describe('selected PR checkout', () => {
  let root: string;
  let remote: string;
  let paths: RunnerPaths;
  let seed: string;
  let bare: string;
  beforeEach(() => {
    root = tempDir('pr-checkout-');
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    remote = makeRemote(root);
    seed = path.join(root, 'origin-repo-seed');
    bare = path.join(root, 'origin-repo.git');
    git(['checkout', '-b', 'fix/human'], seed);
    commit(seed, 'pr.txt', 'PR');
    publish();
  });
  afterEach(() => removeDir(root));
  const commit = (dir: string, file: string, content: string) => {
    writeFileSync(path.join(dir, file), content);
    git(['add', '--', file], dir);
    git(
      [
        '-c',
        'commit.gpgsign=false',
        '-c',
        'user.name=A',
        '-c',
        'user.email=a@example.com',
        'commit',
        '-m',
        content,
      ],
      dir,
    );
    return git(['rev-parse', 'HEAD'], dir);
  };
  const publish = () =>
    git(['fetch', seed, '+refs/heads/fix/human:refs/heads/fix/human'], bare);
  const prepare = (pr = true) =>
    checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-294',
      dirs: [
        {
          kind: 'repo',
          url: remote,
          defaultBranch: 'main',
          branch: pr ? 'fix/human' : 'agent/PM-294',
          path: 'app',
          ...(pr
            ? {
                pullRequest: {
                  number: 42,
                  url: 'https://example.test/pull/42',
                },
              }
            : {}),
        },
      ],
      retry: { delaysMs: [] },
    });

  it('clones the PR head and pushes a new commit to the same remote branch', async () => {
    const work = await prepare();
    try {
      const repo = work.repos[0]!;
      expect(git(['rev-parse', 'HEAD'], repo.dir)).toBe(
        git(['rev-parse', 'fix/human'], bare),
      );
      const sha = commit(repo.dir, 'delivery.txt', 'delivery');
      expect(await reportRepos(work.repos, { push: true })).toMatchObject([
        { branch: 'fix/human', headSha: sha, pushed: true },
      ]);
      expect(git(['rev-parse', 'fix/human'], bare)).toBe(sha);
    } finally {
      await work.release();
    }
  });
  it('switches an existing agent checkout from the remote PR head, retaining old commits and changes', async () => {
    const old = await prepare(false);
    const dir = old.repos[0]!.dir;
    const oldSha = commit(dir, 'old.txt', 'unpublished');
    writeFileSync(path.join(dir, 'dirty.txt'), 'dirty');
    await old.release();
    const work = await prepare();
    try {
      expect(git(['rev-parse', 'HEAD'], dir)).toBe(
        git(['rev-parse', 'fix/human'], bare),
      );
      expect(git(['rev-parse', 'agent/PM-294'], dir)).toBe(oldSha);
      expect(readFileSync(path.join(dir, 'dirty.txt'), 'utf8')).toBe('dirty');
    } finally {
      await work.release();
    }
  });
  it('only fast-forwards a behind branch, and preserves a locally ahead branch and worktree changes', async () => {
    const first = await prepare();
    const dir = first.repos[0]!.dir;
    writeFileSync(path.join(dir, 'README.md'), 'local edit');
    await first.release();
    const remoteSha = commit(seed, 'next.txt', 'remote update');
    publish();
    const fast = await prepare();
    expect(git(['rev-parse', 'HEAD'], dir)).toBe(remoteSha);
    expect(readFileSync(path.join(dir, 'README.md'), 'utf8')).toBe(
      'local edit',
    );
    const localSha = commit(dir, 'local.txt', 'local commit');
    await fast.release();
    const ahead = await prepare();
    try {
      expect(git(['rev-parse', 'HEAD'], dir)).toBe(localSha);
      expect(readFileSync(path.join(dir, 'README.md'), 'utf8')).toBe(
        'local edit',
      );
    } finally {
      await ahead.release();
    }
  });
  it('fails a divergence without changing local commits or edits', async () => {
    const first = await prepare();
    const dir = first.repos[0]!.dir;
    const sha = commit(dir, 'local.txt', 'local');
    writeFileSync(path.join(dir, 'README.md'), 'dirty');
    await first.release();
    commit(seed, 'remote.txt', 'remote');
    publish();
    await expect(prepare()).rejects.toThrow(
      /PR #42 branch fix\/human:.*diverged/u,
    );
    expect(git(['rev-parse', 'HEAD'], dir)).toBe(sha);
    expect(readFileSync(path.join(dir, 'README.md'), 'utf8')).toBe('dirty');
  });
  it('names the PR and branch on fetch failure and preserves the workspace', async () => {
    const first = await prepare();
    const dir = first.repos[0]!.dir;
    const sha = commit(dir, 'local.txt', 'keep');
    writeFileSync(path.join(dir, 'README.md'), 'dirty');
    await first.release();
    renameSync(bare, `${bare}-unavailable`);
    await expect(prepare()).rejects.toThrow(/PR #42 branch fix\/human/u);
    expect(git(['rev-parse', 'HEAD'], dir)).toBe(sha);
    expect(readFileSync(path.join(dir, 'README.md'), 'utf8')).toBe('dirty');
  });
  it('fails missing remote branches on new and resumed checkouts without fallback', async () => {
    git(['branch', '-D', 'fix/human'], bare);
    await expect(prepare()).rejects.toThrow(
      /PR #42 branch fix\/human:.*missing/u,
    );
    publish();
    const first = await prepare();
    const dir = first.repos[0]!.dir;
    const sha = commit(dir, 'local.txt', 'keep');
    await first.release();
    git(['branch', '-D', 'fix/human'], bare);
    await expect(prepare()).rejects.toThrow(
      /PR #42 branch fix\/human:.*missing/u,
    );
    expect(git(['rev-parse', 'HEAD'], dir)).toBe(sha);
  });
  it('fails a fast-forward that would overwrite edits and preserves the edits', async () => {
    const first = await prepare();
    const dir = first.repos[0]!.dir;
    const sha = git(['rev-parse', 'HEAD'], dir);
    writeFileSync(path.join(dir, 'pr.txt'), 'local edit');
    await first.release();
    commit(seed, 'pr.txt', 'remote edit');
    publish();
    await expect(prepare()).rejects.toThrow(/PR #42 branch fix\/human/u);
    expect(git(['rev-parse', 'HEAD'], dir)).toBe(sha);
    expect(readFileSync(path.join(dir, 'pr.txt'), 'utf8')).toBe('local edit');
  });
});
