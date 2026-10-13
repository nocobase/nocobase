import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
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
  lockWorkspace,
  writeWorkspaceMeta,
} from '../src/core/checkout.ts';
import {
  collectWorkspaces,
  removePlanned,
  scanWorkspaces,
} from '../src/core/workspaces.ts';
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

  it('preserves older stashes after reporting and retention GC when only the newest stash is published', async () => {
    const work = await prepare();
    const dir = work.repos[0]!.dir;
    const stashes: string[] = [];
    for (const name of ['oldest', 'middle', 'newest']) {
      writeFileSync(path.join(dir, 'README.md'), name);
      git(['stash', 'push', '-m', name], dir);
      stashes.push(git(['rev-parse', 'refs/stash'], dir));
    }
    publish(dir, 'refs/stash', 'saved-newest');
    expect(git(['status', '--porcelain'], dir)).toBe('');
    const reports = await reportRepos(work.repos, { push: false });
    expect(reports[0]?.pushed).toBe(false);
    expect(reports[0]?.savedRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sha: stashes[0], pushed: false }),
      ]),
    );
    await markWorkspaceEnded(paths, work.workDir, reports);
    await work.release();
    expect(
      await gcWorkspaces({ paths, now: Date.now() + 31 * 86400000 }),
    ).toEqual([]);
    expect(git(['stash', 'list'], dir).split('\n')).toHaveLength(3);
    for (const sha of stashes)
      expect(git(['cat-file', '-t', sha!], dir)).toBe('commit');
    for (const [index, sha] of stashes.entries())
      publish(dir, sha!, `saved-${index}`);
    expect(
      await gcWorkspaces({ paths, now: Date.now() + 31 * 86400000 }),
    ).toEqual([work.workDir]);
  });

  it('includes stash log changes in the final fingerprint and preserves unreadable logs', async () => {
    const work = await prepare();
    const dir = work.repos[0]!.dir;
    writeFileSync(path.join(dir, 'README.md'), 'saved');
    git(['stash', 'push'], dir);
    publish(dir, 'refs/stash', 'saved-stash');
    const log = path.join(dir, '.git/logs/refs/stash');
    const original = hostGit.git;
    let changed = false;
    vi.spyOn(hostGit, 'git').mockImplementation(async (args, cwd, env) => {
      if (!changed && args.includes('fetch') && cwd?.includes('evidence-')) {
        changed = true;
        writeFileSync(
          log,
          readFileSync(log, 'utf8').replace(/\t.*\n$/u, '\tchanged message\n'),
        );
      }
      return original(args, cwd, env);
    });
    expect((await check(work.workDir)).reason).toBe('changed');
    vi.restoreAllMocks();
    writeFileSync(log, 'broken');
    expect((await check(work.workDir)).reason).toBe('missingEvidence');
    rmSync(log);
    expect((await check(work.workDir)).reason).toBe('missingEvidence');
    await work.release();
  });

  it.each(['bare', 'separate'])(
    'preserves unknown %s metadata through clean, retention, pressure, settled, force and artifact cleanup',
    async (kind) => {
      const work = await prepare();
      const seed = path.join(root, 'origin-repo-seed');
      const sha = commit(seed, 'private.txt');
      const backup = path.join(work.workDir, 'backup.git');
      if (kind === 'bare') git(['clone', '--bare', seed, backup]);
      else
        git([
          'clone',
          `--separate-git-dir=${backup}`,
          seed,
          path.join(root, 'separate-checkout'),
        ]);
      expect((await check(work.workDir)).reason).toBe('missingEvidence');
      await expect(cleanWorkspace(paths, work.workDir)).rejects.toThrow(
        /preserved/u,
      );
      await markWorkspaceEnded(
        paths,
        work.workDir,
        await reportRepos(work.repos, { push: false }),
      );
      await work.release();
      const now = Date.now() + 31 * 86400000;
      expect(await gcWorkspaces({ paths, now })).toEqual([]);
      const [entry] = await scanWorkspaces(paths);
      expect(await removePlanned(paths, entry!, { force: true })).toBe(
        'unpushed',
      );
      const collected = await collectWorkspaces({
        paths,
        now,
        threshold: { bytes: 1000 },
        readDisk: async () => ({ freeBytes: 0, totalBytes: 2000 }),
        reporters: new Map([
          [
            'app',
            async (request) => ({
              remove: request.workspaces.map((item) => item.runId),
              decisions: request.directories?.map((item) => ({
                ...item,
                reportId: request.reportId!,
                settled: true,
              })),
            }),
          ],
        ]),
        decisionApps: new Set(['app']),
        artifacts: { ttlMs: 1, patterns: ['backup.git'] },
      });
      expect(collected.removed).toEqual([]);
      expect(collected.artifactsCleaned).toEqual([]);
      expect(git(['--git-dir', backup, 'rev-parse', 'HEAD'])).toBe(sha);
    },
  );

  it('cleans published annotated tags but preserves differing annotations, stale evidence and missing authorization', async () => {
    const seed = path.join(root, 'origin-repo-seed');
    git(['tag', '-a', 'v1', '-m', 'published release'], seed);
    git(['push', remote, 'refs/tags/v1'], seed);
    const work = await prepare();
    const dir = work.repos[0]!.dir;
    const published = git(['rev-parse', 'refs/tags/v1'], dir);
    expect((await check(work.workDir)).reason).toBe('allowed');
    git(['tag', '-f', '-a', 'v1', '-m', 'unpublished annotation'], dir);
    expect(git(['rev-parse', 'v1^{}'], dir)).toBe(
      git(['rev-parse', 'HEAD'], dir),
    );
    expect((await check(work.workDir)).reason).toBe('unpushed');
    git(['update-ref', 'refs/tags/v1', published], dir);
    const meta = (await readWorkspaceMeta(paths, work.workDir))!;
    expect(
      (
        await checkWorkspaceGit(work.workDir, {
          ...meta,
          repos: meta.repos.map((repo) => ({ ...repo, requiresAuth: true })),
        })
      ).reason,
    ).toBe('missingEvidence');
    git(['push', remote, ':refs/tags/v1'], seed);
    expect((await check(work.workDir)).reason).toBe('unpushed');
    git(['push', remote, 'refs/tags/v1'], seed);
    await work.release();
    expect(
      await gcWorkspaces({ paths, now: Date.now() + 31 * 86400000 }),
    ).toEqual([work.workDir]);
  });

  it('permits clean initialization only for empty directories and permits it again after normal GC', async () => {
    const options = {
      paths,
      appKey: 'app',
      subjectKey: 'NEW',
      clean: true,
      dirs: [
        {
          kind: 'repo' as const,
          url: remote,
          defaultBranch: 'main',
          branch: 'agent/NEW',
          path: 'app',
        },
      ],
    };
    const first = await checkout(options);
    await first.release();
    const recorded = await checkout(options);
    await recorded.release();
    expect(
      await gcWorkspaces({ paths, now: Date.now() + 31 * 86400000 }),
    ).toEqual([recorded.workDir]);
    const afterGC = await checkout(options);
    await afterGC.release();
    const lock = await lockWorkspace({
      paths,
      appKey: 'app',
      subjectKey: 'unknown',
    });
    writeFileSync(path.join(lock.workDir, 'saved.txt'), 'local work');
    await expect(cleanWorkspace(paths, lock.workDir)).rejects.toThrow(
      /unrecorded/u,
    );
    expect(readFileSync(path.join(lock.workDir, 'saved.txt'), 'utf8')).toBe(
      'local work',
    );
    rmSync(path.join(lock.workDir, 'saved.txt'));
    writeFileSync(
      path.join(lock.workDir, '.nocobase-runner/workspace.json'),
      'invalid metadata',
    );
    await expect(cleanWorkspace(paths, lock.workDir)).rejects.toThrow(
      /unrecorded/u,
    );
    await lock.release();
  });

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
