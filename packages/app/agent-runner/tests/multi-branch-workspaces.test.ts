import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import {
  checkout,
  reportRepos,
  readWorkspaceMeta,
  markWorkspaceEnded,
  checkWorkspaceGit,
  gcWorkspaces,
  cleanWorkspace,
  writeWorkspaceMeta,
} from '../src/core/checkout.ts';
import { removePlanned, scanWorkspaces } from '../src/core/workspaces.ts';
import { cleanArtifacts } from '../src/core/artifacts.ts';
import { git, makeRemote, publishSeed, removeDir, tempDir } from './helpers.ts';
import * as hostGit from '../src/core/git.ts';

describe('multi-branch workspace preservation', () => {
  let root: string;
  let remote: string;
  let paths: RunnerPaths;
  beforeEach(() => {
    root = tempDir();
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    remote = makeRemote(root);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    removeDir(root);
  });
  const prepare = () =>
    checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-294',
      runId: 'run',
      dirs: [
        {
          kind: 'repo',
          url: remote,
          defaultBranch: 'main',
          branch: 'agent/PM-294',
          path: 'app',
        },
      ],
    });
  const commit = (dir: string, name: string) => {
    writeFileSync(path.join(dir, name), name);
    git(['add', name], dir);
    git(['-c', 'commit.gpgsign=false', 'commit', '-m', name], dir);
    return git(['rev-parse', 'HEAD'], dir);
  };
  const publish = (dir: string, branch: string, target = branch) =>
    git(['push', remote, `${branch}:refs/heads/${target}`], dir);
  const check = async (workDir: string) =>
    checkWorkspaceGit(workDir, (await readWorkspaceMeta(paths, workDir))!);

  it('preserves changes hidden from status by index flags', async () => {
    const work = await prepare();
    const dir = work.repos[0]!.dir;
    git(['update-index', '--assume-unchanged', 'README.md'], dir);
    writeFileSync(path.join(dir, 'README.md'), 'hidden draft');
    expect(git(['status', '--porcelain'], dir)).toBe('');
    expect((await check(work.workDir)).reason).toBe('missingEvidence');
    await work.release();
    expect(
      await gcWorkspaces({ paths, now: Date.now() + 31 * 86400000 }),
    ).toEqual([]);
  });

  it('preserves an unconfirmed writer across GC and restart', async () => {
    const work = await prepare();
    const meta = (await readWorkspaceMeta(paths, work.workDir))!;
    await writeWorkspaceMeta(paths, work.workDir, {
      ...meta,
      writerActive: true,
    });
    await work.release();
    expect(
      await gcWorkspaces({ paths, now: Date.now() + 31 * 86400000 }),
    ).toEqual([]);
    await expect(prepare()).rejects.toThrow(/writer.*not confirmed stopped/u);
    expect((await readWorkspaceMeta(paths, work.workDir))?.writerActive).toBe(
      true,
    );
  });

  it('rejects stale deletion plans even when a metadata write preserves the same timestamp and run id', async () => {
    const work = await prepare();
    await work.release();
    const [entry] = await scanWorkspaces(paths);
    const meta = (await readWorkspaceMeta(paths, work.workDir))!;
    await writeWorkspaceMeta(paths, work.workDir, meta);
    expect(await removePlanned(paths, entry!)).toBe('changed');
    expect(existsSync(work.workDir)).toBe(true);
  });

  it('detects refs changing while fresh remote evidence is fetched', async () => {
    const work = await prepare();
    const dir = work.repos[0]!.dir;
    const original = hostGit.git;
    let changed = false;
    vi.spyOn(hostGit, 'git').mockImplementation(async (args, cwd, env) => {
      if (!changed && args.includes('fetch') && cwd?.includes('evidence-')) {
        changed = true;
        git(['branch', 'concurrent'], dir);
      }
      return original(args, cwd, env);
    });
    expect((await check(work.workDir)).reason).toBe('changed');
    await work.release();
  });

  it('preserves annotated tags and tracked artifact files even when the branch tip is published', async () => {
    const work = await prepare();
    const dir = work.repos[0]!.dir;
    git(['tag', '-a', 'local-note', '-m', 'unpublished annotation'], dir);
    expect((await check(work.workDir)).reason).toBe('unpushed');
    git(['tag', '-d', 'local-note'], dir);
    mkdirSync(path.join(dir, '.next'), { recursive: true });
    commit(dir, '.next/source.txt');
    publish(dir, 'agent/PM-294');
    await work.release();
    const entries = await scanWorkspaces(paths);
    expect(
      await cleanArtifacts(entries, {
        paths,
        ttlMs: 1,
        patterns: ['.next'],
        now: Date.now() + 86400000,
      }),
    ).toEqual([]);
    expect(existsSync(path.join(dir, '.next/source.txt'))).toBe(true);
  });

  it('checks non-current submodule branches against the protected child remote, and cleans only after publication', async () => {
    vi.stubEnv('GIT_CONFIG_COUNT', '1');
    vi.stubEnv('GIT_CONFIG_KEY_0', 'protocol.file.allow');
    vi.stubEnv('GIT_CONFIG_VALUE_0', 'always');
    const childRemote = makeRemote(root, 'child');
    const seed = path.join(root, 'origin-repo-seed');
    git(['submodule', 'add', childRemote, 'vendor/sub'], seed);
    git(['commit', '-m', 'child'], seed);
    publishSeed(root);
    const work = await prepare();
    const dir = work.repos[0]!.dir;
    const child = path.join(dir, 'vendor/sub');
    expect(work.repos[0]?.protectedSubmodules).toMatchObject([
      { url: childRemote },
    ]);
    git(['switch', '-c', 'saved-child'], child);
    const sha = commit(child, 'child-work.txt');
    git(['checkout', '--detach', 'HEAD~1'], child);
    expect(git(['status', '--porcelain'], dir)).toBe('');
    expect((await check(work.workDir)).reason).toBe('unpushed');
    await markWorkspaceEnded(
      paths,
      work.workDir,
      await reportRepos(work.repos, { push: true }),
    );
    await work.release();
    expect(
      await gcWorkspaces({ paths, now: Date.now() + 31 * 86400000 }),
    ).toEqual([]);
    expect(git(['rev-parse', 'saved-child'], child)).toBe(sha);
    git(['push', childRemote, 'saved-child:refs/heads/published-child'], child);
    expect((await check(work.workDir)).reason).toBe('allowed');
    expect(
      await gcWorkspaces({ paths, now: Date.now() + 31 * 86400000 }),
    ).toEqual([work.workDir]);
  });

  for (const days of [8, 31])
    it(`keeps clean non-current unpublished work after actual completion, restart and ${days}-day retention`, async () => {
      const work = await prepare();
      const dir = work.repos[0]!.dir;
      git(['checkout', '-b', 'saved'], dir);
      const sha = commit(dir, 'saved.txt');
      git(['checkout', 'agent/PM-294'], dir);
      expect(git(['status', '--porcelain'], dir)).toBe('');
      const reports = await reportRepos(work.repos, { push: true });
      expect(reports).toMatchObject([
        {
          pushed: false,
          savedRefs: expect.arrayContaining([
            { ref: 'refs/heads/saved', sha, pushed: false },
          ]),
        },
      ]);
      await markWorkspaceEnded(paths, work.workDir, reports);
      const prior = (await readWorkspaceMeta(paths, work.workDir))!.repos[0]!
        .state!.refs;
      await markWorkspaceEnded(paths, work.workDir, []);
      expect(
        (await readWorkspaceMeta(paths, work.workDir))!.repos[0]!.state!.refs,
      ).toEqual(prior);
      await work.release();
      const restart = await prepare();
      await restart.release();
      expect(
        await gcWorkspaces({ paths, now: Date.now() + days * 86400000 }),
      ).toEqual([]);
      expect(existsSync(work.workDir)).toBe(true);
      expect(git(['rev-parse', 'saved'], dir)).toBe(sha);
      publish(dir, 'saved', 'renamed-on-host');
      expect((await check(work.workDir)).reason).toBe('allowed');
      expect(
        await gcWorkspaces({ paths, now: Date.now() + 31 * 86400000 }),
      ).toEqual([work.workDir]);
    });

  it('reports B without pushing to A, and resumes B with staged, unstaged and untracked files', async () => {
    const work = await prepare();
    const dir = work.repos[0]!.dir;
    publish(dir, 'agent/PM-294');
    const a = git(['rev-parse', 'HEAD'], dir);
    git(['checkout', '-b', 'other'], dir);
    const b = commit(dir, 'other.txt');
    expect(await reportRepos(work.repos, { push: true })).toMatchObject([
      { branch: 'other', headSha: b, pushed: false },
    ]);
    expect(
      git(['ls-remote', remote, 'refs/heads/agent/PM-294'], dir),
    ).toContain(a);
    writeFileSync(path.join(dir, 'other.txt'), 'stage');
    git(['add', 'other.txt'], dir);
    writeFileSync(path.join(dir, 'README.md'), 'unstaged');
    writeFileSync(path.join(dir, 'loose.txt'), 'untracked');
    const status = git(['status', '--porcelain'], dir);
    await work.release();
    const restart = await prepare();
    expect(restart.repos[0]).toMatchObject({
      branch: 'agent/PM-294',
      actualHead: 'other',
    });
    expect(git(['status', '--porcelain'], dir)).toBe(status);
    expect(git(['rev-parse', 'HEAD'], dir)).toBe(b);
    await restart.release();
  });

  it('ignores forged tracking refs and old single-SHA evidence; remote deletion revokes evidence', async () => {
    const work = await prepare();
    const dir = work.repos[0]!.dir;
    const sha = commit(dir, 'saved.txt');
    git(['update-ref', 'refs/remotes/origin/saved', sha], dir);
    const meta = (await readWorkspaceMeta(paths, work.workDir))!;
    expect(
      (
        await checkWorkspaceGit(work.workDir, {
          ...meta,
          repos: meta.repos.map((repo) => ({
            ...repo,
            startSha: sha,
            pushedSha: sha,
          })),
        })
      ).reason,
    ).toBe('unpushed');
    publish(dir, 'agent/PM-294', 'different-name');
    expect((await check(work.workDir)).reason).toBe('allowed');
    git(['push', remote, ':refs/heads/different-name'], dir);
    expect((await check(work.workDir)).reason).toBe('unpushed');
    await work.release();
  });

  it('protects stash and detached commits and continues offline in the actual state', async () => {
    const work = await prepare();
    const dir = work.repos[0]!.dir;
    writeFileSync(path.join(dir, 'README.md'), 'stash');
    git(['stash'], dir);
    expect((await check(work.workDir)).reason).toBe('unpushed');
    git(['stash', 'drop'], dir);
    git(['checkout', '--detach'], dir);
    const sha = commit(dir, 'detached.txt');
    await work.release();
    renameSync(
      path.join(root, 'origin-repo.git'),
      path.join(root, 'unavailable.git'),
    );
    const restart = await prepare();
    expect(restart.repos[0]?.actualHead).toBe(sha);
    await restart.release();
    expect((await check(work.workDir)).reason).toBe('missingEvidence');
    expect(
      await gcWorkspaces({ paths, now: Date.now() + 31 * 86400000 }),
    ).toEqual([]);
  });

  it('does not allow clean, settled/force removal or artifact cleanup to bypass work protection', async () => {
    const work = await prepare();
    const dir = work.repos[0]!.dir;
    git(['checkout', '-b', 'saved'], dir);
    const sha = commit(dir, 'saved.txt');
    git(['checkout', 'agent/PM-294'], dir);
    await expect(cleanWorkspace(paths, work.workDir)).rejects.toThrow(
      /preserved/u,
    );
    await work.release();
    const [entry] = await scanWorkspaces(paths);
    expect(await removePlanned(paths, entry!, { force: true })).toBe(
      'unpushed',
    );
    expect(
      await cleanArtifacts([entry!], {
        paths,
        ttlMs: 1,
        patterns: ['app'],
        now: Date.now() + 86400000,
      }),
    ).toEqual([]);
    expect(git(['rev-parse', 'saved'], dir)).toBe(sha);
  });

  it('preserves unknown additional worktrees, removed configured repositories and missing credentials', async () => {
    const work = await prepare();
    const dir = work.repos[0]!.dir;
    const extra = path.join(work.workDir, 'extra');
    git(['clone', remote, extra]);
    expect((await check(work.workDir)).reason).toBe('missingEvidence');
    await work.release();
    const restart = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-294',
      dirs: [],
    });
    await restart.release();
    expect((await readWorkspaceMeta(paths, work.workDir))?.repos).toHaveLength(
      1,
    );
    const meta = (await readWorkspaceMeta(paths, work.workDir))!;
    expect(
      (
        await checkWorkspaceGit(work.workDir, {
          ...meta,
          repos: meta.repos.map((repo) => ({ ...repo, requiresAuth: true })),
        })
      ).reason,
    ).toBe('missingEvidence');
    expect(existsSync(dir)).toBe(true);
  });
});
