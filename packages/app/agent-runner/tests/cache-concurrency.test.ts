import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as fs from 'node:fs/promises';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  cachePath,
  checkout,
  reportRepos,
  updateCache,
} from '../src/core/checkout.ts';
import * as hostGit from '../src/core/git.ts';
import * as guardedGit from '../src/core/task-git.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { git, makeRemote, removeDir, tempDir } from './helpers.ts';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, mkdir: vi.fn(actual.mkdir) };
});

let root: string;
beforeEach(() => {
  root = tempDir('cache-concurrency-');
});
afterEach(() => {
  vi.restoreAllMocks();
  removeDir(root);
});
const pathsOf = () =>
  runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
const optionsOf = (url: string, subjectKey = 'task', appKey = 'app') => ({
  paths: pathsOf(),
  appKey,
  subjectKey,
  dirs: [
    {
      kind: 'repo' as const,
      url,
      branch: 'agent/shared',
      defaultBranch: 'main',
      path: 'repo',
    },
  ],
});

it('serializes 30 concurrent cache refreshes while the remote ref advances', async () => {
  const remote = makeRemote(root);
  const paths = pathsOf();
  const cache = await updateCache(paths, remote);
  const seed = path.join(root, 'seed');
  git(['clone', remote, seed], root);
  git(
    [
      '-c',
      'user.name=A',
      '-c',
      'user.email=a@example.com',
      'commit',
      '--allow-empty',
      '-m',
      'advance',
    ],
    seed,
  );
  git(['push', 'origin', 'main'], seed);
  const sha = git(['rev-parse', 'HEAD'], seed);
  const started = performance.now();
  const refreshes = Array.from({ length: 30 }, () =>
    updateCache(paths, remote),
  );
  expect(await Promise.all(refreshes)).toEqual(Array(30).fill(cache));
  expect(git(['rev-parse', 'refs/remotes/origin/main'], cache)).toBe(sha);
  expect(existsSync(`${cache}.lock`)).toBe(false);
  process.stdout.write(
    `cache-refresh-cost ${JSON.stringify({ concurrent: 30, failures: 0, elapsedMs: Math.round(performance.now() - started) })}\n`,
  );
}, 20_000);

it('creates a cold cache and same task directory once for concurrent initial runs', async () => {
  const remote = makeRemote(root);
  const options = optionsOf(remote);
  const actual = hostGit.git;
  let clones = 0;
  let additions = 0;
  vi.spyOn(hostGit, 'git').mockImplementation(async (...args) => {
    if (args[0].includes('clone')) clones++;
    if (args[0].includes('worktree') && args[0].includes('add')) additions++;
    return actual(...args);
  });
  const results = await Promise.all(
    Array.from({ length: 8 }, () => checkout(options)),
  );
  expect(clones).toBe(1);
  expect(additions).toBe(1);
  expect(new Set(results.map((result) => result.repos[0]!.dir)).size).toBe(1);
  await Promise.all(results.map((result) => result.release()));
});

it('does not let a second creator observe .git before the first checkout finishes', async () => {
  const remote = makeRemote(root);
  const options = optionsOf(remote);
  await updateCache(options.paths, remote);
  const entered = Promise.withResolvers<void>();
  const finish = Promise.withResolvers<void>();
  const actual = guardedGit.cacheGit;
  let additions = 0;
  vi.spyOn(guardedGit, 'cacheGit').mockImplementation(async (...args) => {
    if (args[2][0] === 'worktree' && args[2][1] === 'add') {
      additions++;
      const dir = args[2][args[2].length - 2]!;
      // Git writes this pointer before populating files. Hold that exact intermediate state.
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, '.git'), 'checkout is incomplete');
      entered.resolve();
      await finish.promise;
      rmSync(dir, { recursive: true });
    }
    return actual(...args);
  });
  const first = checkout(options);
  await entered.promise;
  const contending = Promise.withResolvers<void>();
  const { mkdir } =
    await vi.importActual<typeof import('node:fs/promises')>(
      'node:fs/promises',
    );
  vi.spyOn(fs, 'mkdir').mockImplementation(
    (...args: Parameters<typeof mkdir>) => {
      if (String(args[0]) === `${cachePath(options.paths, remote)}.lock`)
        contending.resolve();
      return mkdir(...args);
    },
  );
  let settled = false;
  const second = checkout(options).finally(() => {
    settled = true;
  });
  await contending.promise;
  // The later creator has reached the held cache mutex, while the pointer is incomplete.
  expect(settled).toBe(false);
  finish.resolve();
  const results = await Promise.all([first, second]);
  expect(additions).toBe(1);
  expect(results[0].repos[0]?.dir).toBe(results[1].repos[0]?.dir);
  expect(git(['rev-parse', 'HEAD'], results[1].repos[0]!.dir)).toBe(
    git(['rev-parse', 'main'], results[0].repos[0]!.cache),
  );
  await Promise.all(results.map((result) => result.release()));
});

it('cleans a failed initial clone and can retry immediately and in a later call', async () => {
  const remote = makeRemote(root);
  const paths = pathsOf();
  const cache = cachePath(paths, remote);
  const actual = hostGit.git;
  let failures = 2;
  vi.spyOn(hostGit, 'git').mockImplementation(async (...args) => {
    if (args[0].includes('clone') && failures-- > 0) {
      mkdirSync(cache, { recursive: true });
      writeFileSync(path.join(cache, 'partial'), 'incomplete');
      throw new hostGit.CheckoutError('Connection reset by peer');
    }
    return actual(...args);
  });
  await expect(
    updateCache(paths, remote, { retry: { delaysMs: [] } }),
  ).rejects.toThrow('Connection reset');
  expect(existsSync(cache)).toBe(false);
  expect(existsSync(`${cache}.lock`)).toBe(false);
  await updateCache(paths, remote, { retry: { delaysMs: [0] } });
  expect(existsSync(path.join(cache, 'partial'))).toBe(false);
  expect(git(['rev-parse', 'refs/remotes/origin/main'], cache)).not.toBe('');
});

it('retries fetch and worktree Git lock conflicts without leaving partial preparation', async () => {
  const remote = makeRemote(root);
  const options = optionsOf(remote);
  await updateCache(options.paths, remote);
  const actual = guardedGit.cacheGit;
  const failed = new Set<string>();
  vi.spyOn(guardedGit, 'cacheGit').mockImplementation(async (...args) => {
    const operation = args[2].includes('fetch')
      ? 'fetch'
      : args[2][0] === 'worktree' && args[2][1] === 'add'
        ? 'worktree'
        : '';
    if (operation && !failed.has(operation)) {
      failed.add(operation);
      throw new hostGit.CheckoutError(
        "cannot lock ref 'refs/heads/agent/shared': is at abcd but expected efgh",
      );
    }
    return actual(...args);
  });
  const result = await checkout({ ...options, retry: { delaysMs: [0] } });
  expect([...failed]).toEqual(['fetch', 'worktree']);
  expect(git(['symbolic-ref', '--short', 'HEAD'], result.repos[0]!.dir)).toBe(
    'agent/shared',
  );
  await result.release();
});

it.each(['task', 'app'] as const)(
  'checks out an occupied branch detached for another %s, from its remote tip',
  async (boundary) => {
    const remote = makeRemote(root);
    const options = optionsOf(remote);
    const first = await checkout(options);
    const repo = first.repos[0]!;
    git(['push', 'origin', 'HEAD:refs/heads/agent/shared'], repo.dir);
    const remoteTip = git(['rev-parse', 'HEAD'], repo.dir);
    git(
      [
        '-c',
        'user.name=A',
        '-c',
        'user.email=a@example.com',
        'commit',
        '--allow-empty',
        '-m',
        'unpublished',
      ],
      repo.dir,
    );
    const secondOptions = optionsOf(
      remote,
      boundary === 'task' ? 'other' : 'task',
      boundary === 'app' ? 'other' : 'app',
    );
    const [second, third] = await Promise.all([
      checkout(secondOptions),
      checkout(secondOptions),
    ]);
    expect(second.repos[0]?.dir).toBe(third.repos[0]?.dir);
    expect(git(['rev-parse', 'HEAD'], second.repos[0]!.dir)).toBe(remoteTip);
    expect(
      git(['rev-parse', '--abbrev-ref', 'HEAD'], second.repos[0]!.dir),
    ).toBe('HEAD');
    expect(second.repos[0]?.warnings?.join('\n')).toContain(
      'git push origin HEAD:refs/heads/agent/shared',
    );
    expect(git(['symbolic-ref', '--short', 'HEAD'], repo.dir)).toBe(
      'agent/shared',
    );
    await Promise.all([first.release(), second.release(), third.release()]);
  },
);

it('reports an unpublished HEAD among 500 remote branches with one containment query and no optional index locks', async () => {
  const remote = makeRemote(root);
  const result = await checkout(optionsOf(remote));
  const repo = result.repos[0]!;
  for (let i = 0; i < 500; i++)
    git(
      ['update-ref', `refs/heads/history-${i}`, 'main'],
      remote.slice('file://'.length),
    );
  git(
    [
      '-c',
      'user.name=A',
      '-c',
      'user.email=a@example.com',
      'commit',
      '--allow-empty',
      '-m',
      'unpublished',
    ],
    repo.dir,
  );
  const actual = hostGit.git;
  const commands: string[][] = [];
  vi.spyOn(hostGit, 'git').mockImplementation(async (...args) => {
    commands.push(args[0]);
    return actual(...args);
  });
  // An Agent can own index.lock; host status must remain read-only and report successfully.
  writeFileSync(path.join(repo.gitDir, 'index.lock'), 'agent commit');
  const started = performance.now();
  const report = await reportRepos([repo], { push: false });
  process.stdout.write(
    `report-cost ${JSON.stringify({ remoteBranches: 501, elapsedMs: Math.round(performance.now() - started), gitCommands: commands.length })}\n`,
  );
  expect(report[0]).toMatchObject({
    pushed: false,
    headSha: git(['rev-parse', 'HEAD'], repo.dir),
  });
  expect(report[0]).not.toHaveProperty('failure');
  expect(commands.filter((args) => args.includes('merge-base'))).toHaveLength(
    0,
  );
  expect(
    commands.filter(
      (args) => args.includes('for-each-ref') && args.includes('--contains'),
    ),
  ).toHaveLength(1);
  expect(
    commands
      .filter((args) => args.includes('status'))
      .every((args) => args.includes('--no-optional-locks')),
  ).toBe(true);
  rmSync(path.join(repo.gitDir, 'index.lock'));
  await result.release();
});
