import { writeFileSync, readFileSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import {
  checkout,
  reportRepos,
  readWorkspaceMeta,
  markWorkspaceEnded,
  checkWorkspaceGit,
  gcWorkspaces,
} from '../src/core/checkout.ts';
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

  it('starts at the remote PR head, reports unpublished work without pushing, and observes the agent push', async () => {
    const work = await prepare();
    const repo = work.repos[0]!;
    const before = git(['rev-parse', 'fix/human'], bare);
    expect(git(['rev-parse', 'HEAD'], repo.dir)).toBe(before);
    const sha = commit(repo.dir, 'delivery.txt', 'delivery');
    expect(await reportRepos(work.repos, { push: true })).toMatchObject([
      { branch: 'fix/human', headSha: sha, pushed: false },
    ]);
    expect(git(['rev-parse', 'fix/human'], bare)).toBe(before);
    git(['push', remote, 'HEAD:refs/heads/fix/human'], repo.dir);
    expect(await reportRepos(work.repos, { push: true })).toMatchObject([
      { pushed: true },
    ]);
    await work.release();
  });
  for (const existing of [false, true])
    it(`keeps the agent branch when a ${existing ? 'local' : 'new'} PR becomes recommended, preserving unpublished work`, async () => {
      const old = await prepare(false);
      const dir = old.repos[0]!.dir;
      const sha = commit(dir, 'local.txt', 'local');
      if (existing) git(['branch', 'fix/human', 'origin/fix/human'], dir);
      await markWorkspaceEnded(
        paths,
        old.workDir,
        await reportRepos(old.repos, { push: true }),
      );
      await old.release();
      const work = await prepare();
      expect(work.repos[0]).toMatchObject({
        branch: 'fix/human',
        actualHead: 'agent/PM-294',
      });
      expect(git(['rev-parse', 'HEAD'], dir)).toBe(sha);
      expect(
        (
          await checkWorkspaceGit(
            work.workDir,
            (await readWorkspaceMeta(paths, work.workDir))!,
          )
        ).reason,
      ).toBe('unpushed');
      await work.release();
      expect(
        await gcWorkspaces({ paths, now: Date.now() + 31 * 86400000 }),
      ).toEqual([]);
      expect(existsSync(work.workDir)).toBe(true);
    });
  it('keeps detached HEAD, edits and metadata when the remote becomes unavailable', async () => {
    const first = await prepare();
    const dir = first.repos[0]!.dir;
    git(['checkout', '--detach'], dir);
    const sha = commit(dir, 'local.txt', 'keep');
    writeFileSync(path.join(dir, 'README.md'), 'dirty');
    await first.release();
    renameSync(bare, `${bare}-unavailable`);
    const resumed = await prepare();
    expect(resumed.repos[0]?.actualHead).toBe(sha);
    expect(readFileSync(path.join(dir, 'README.md'), 'utf8')).toBe('dirty');
    await resumed.release();
  });
  it('does not move a reused PR branch on upstream advance or divergence', async () => {
    const first = await prepare();
    const dir = first.repos[0]!.dir;
    const sha = commit(dir, 'local.txt', 'local');
    await first.release();
    commit(seed, 'remote.txt', 'remote');
    publish();
    const resumed = await prepare();
    expect(git(['rev-parse', 'HEAD'], dir)).toBe(sha);
    await resumed.release();
  });
  it('fails a missing PR branch only on the first checkout and preserves a resumed branch after remote deletion', async () => {
    git(['branch', '-D', 'fix/human'], bare);
    await expect(prepare()).rejects.toThrow(
      /PR #42 branch fix\/human:.*missing/u,
    );
    publish();
    const first = await prepare();
    const dir = first.repos[0]!.dir;
    const sha = commit(dir, 'local.txt', 'local');
    await first.release();
    git(['branch', '-D', 'fix/human'], bare);
    const resumed = await prepare();
    expect(git(['rev-parse', 'HEAD'], dir)).toBe(sha);
    await resumed.release();
  });
  it('preserves edits that an automatic fast-forward would overwrite', async () => {
    const first = await prepare();
    const dir = first.repos[0]!.dir;
    const sha = git(['rev-parse', 'HEAD'], dir);
    writeFileSync(path.join(dir, 'pr.txt'), 'local edit');
    await first.release();
    commit(seed, 'pr.txt', 'remote edit');
    publish();
    const resumed = await prepare();
    expect(git(['rev-parse', 'HEAD'], dir)).toBe(sha);
    expect(readFileSync(path.join(dir, 'pr.txt'), 'utf8')).toBe('local edit');
    await resumed.release();
  });
});
