import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { agentWritableRoots } from '../src/agent/prepare/index.ts';
import { createPolicy, isInside } from '../src/core/command-policy.ts';
import { buildAgentEnv } from '../src/agent/env.ts';
import {
  ALLOW_FILE,
  installGitHooks,
  pushAllowPath,
} from '../src/core/push-guard.ts';
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
import { git, makeRemote, publishSeed, removeDir, tempDir } from './helpers.ts';

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

  it('creates a reference clone on the subject branch with local metadata, and reuses it', async () => {
    const first = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'new-clone',
      dirs: [repo('new-clone')],
    });
    const dir = path.join(first.workDir, 'app');
    expect(first.workDir).toBe(subjectWorkDir(paths, 'app', 'new-clone'));
    expect(git(['symbolic-ref', '--short', 'HEAD'], dir)).toBe(
      'agent/new-clone',
    );
    expect(existsSync(first.repos[0]?.cache ?? '')).toBe(true);
    expect(
      git(['rev-parse', '--is-bare-repository'], first.repos[0]?.cache),
    ).toBe('true');
    expect(first.repos[0]!.gitDir).toBe(path.join(dir, '.git'));
    expect(
      readFileSync(
        path.join(dir, '.git/objects/info/alternates'),
        'utf8',
      ).trim(),
    ).toBe(path.join(first.repos[0]!.cache, 'objects'));
    expect(git(['config', 'gc.auto'], first.repos[0]!.cache)).toBe('0');
    expect(git(['config', 'gc.pruneExpire'], first.repos[0]!.cache)).toBe(
      'never',
    );
    writeFileSync(path.join(dir, 'work.txt'), 'in progress');
    await first.release();

    const second = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'new-clone',
      dirs: [repo('new-clone')],
    });
    expect(existsSync(path.join(second.workDir, 'app', 'work.txt'))).toBe(true);
    await second.release();
  });

  it('keeps new objects and refs local during commits and rebase, independently of a concurrent subject', async () => {
    const a = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'local-objects',
      dirs: [repo('local-objects')],
    });
    const b = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'concurrent-checkout',
      dirs: [repo('concurrent-checkout')],
    });
    const dir = a.repos[0]!.dir;
    const other = git(['rev-parse', 'HEAD'], b.repos[0]!.dir);
    writeFileSync(path.join(dir, 'a.txt'), 'a');
    git(['add', '.'], dir);
    git([...COMMIT, 'commit', '-q', '-m', 'a'], dir);
    const sha = git(['rev-parse', 'HEAD'], dir);
    expect(
      existsSync(path.join(dir, '.git/objects', sha.slice(0, 2), sha.slice(2))),
    ).toBe(true);
    expect(
      existsSync(
        path.join(a.repos[0]!.cache, 'objects', sha.slice(0, 2), sha.slice(2)),
      ),
    ).toBe(false);
    git(['checkout', '-q', '-b', 'local-base', other], dir);
    git([...COMMIT, 'commit', '-q', '--allow-empty', '-m', 'new base'], dir);
    git([...COMMIT, 'rebase', 'local-base', 'agent/local-objects'], dir);
    expect(git(['rev-parse', 'HEAD'], b.repos[0]!.dir)).toBe(other);
    expect(
      existsSync(
        path.join(a.repos[0]!.cache, 'refs/heads/agent/local-objects'),
      ),
    ).toBe(false);
    await a.release();
    await b.release();
  });

  it('uses the fetched default branch for new clones and refreshes tracking refs when resuming without resetting work', async () => {
    const first = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'tracking-resume',
      dirs: [repo('tracking-resume')],
    });
    const dir = first.repos[0]!.dir;
    const head = git(['rev-parse', 'HEAD'], dir);
    writeFileSync(path.join(dir, 'pending.txt'), 'keep');
    await first.release();
    const seed = path.join(root, 'origin-repo-seed');
    writeFileSync(path.join(seed, 'upstream.txt'), 'new');
    git(['add', '.'], seed);
    git([...COMMIT, 'commit', '-q', '-m', 'upstream'], seed);
    publishSeed(root);
    const next = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'fresh-upstream',
      dirs: [repo('fresh-upstream')],
    });
    expect(existsSync(path.join(next.repos[0]!.dir, 'upstream.txt'))).toBe(
      true,
    );
    expect(
      git(
        ['for-each-ref', '--format=%(refname:short)', 'refs/heads/'],
        next.repos[0]!.dir,
      ),
    ).toBe('agent/fresh-upstream');
    await next.release();
    const resumed = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'tracking-resume',
      dirs: [repo('tracking-resume')],
    });
    expect(git(['rev-parse', 'origin/main'], dir)).toBe(
      git(['rev-parse', 'HEAD'], seed),
    );
    expect(git(['rev-parse', 'HEAD'], dir)).toBe(head);
    expect(readFileSync(path.join(dir, 'pending.txt'), 'utf8')).toBe('keep');
    await resumed.release();
  });

  it('resumes legacy worktrees without losing uncommitted work', async () => {
    const first = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'legacy-resume',
      dirs: [repo('legacy-resume')],
    });
    const cache = first.repos[0]!.cache;
    const legacy = path.join(first.workDir, 'legacy');
    git(
      ['worktree', 'add', '-q', '-b', 'agent/legacy', legacy, 'origin/main'],
      cache,
    );
    writeFileSync(path.join(legacy, 'pending.txt'), 'keep');
    await first.release();
    const resumed = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'legacy-resume',
      dirs: [{ ...repo('legacy'), path: 'legacy' }],
    });
    expect(readFileSync(path.join(legacy, 'pending.txt'), 'utf8')).toBe('keep');
    expect(resumed.repos[0]!.gitDir).toContain(path.join(cache, 'worktrees'));
    await resumed.release();
  });

  it('pushes a branch with commits and reports it', async () => {
    const work = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'push-report',
      dirs: [repo('push-report')],
    });
    const dir = path.join(work.workDir, 'app');
    expect(await reportRepos(work.repos, { push: true })).toEqual([
      expect.objectContaining({ branch: 'agent/push-report', pushed: false }),
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
      checkout({ paths, appKey: 'app', subjectKey: 'empty-repo', dirs: [dir] }),
    ).rejects.toThrow(/default branch/u);

    const work = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'empty-repo',
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
      subjectKey: 'remote-resume',
      dirs: [repo('remote-resume')],
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
      subjectKey: 'remote-resume',
      dirs: [repo('remote-resume')],
    });
    expect(existsSync(path.join(mine.workDir, 'app', 'b.txt'))).toBe(true);
    await mine.release();
  });

  it("lets a worktree push only its run's branch, to its own repository", async () => {
    const work = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'push-guard',
      dirs: [repo('push-guard')],
    });
    const dir = path.join(work.workDir, 'app');
    writeFileSync(path.join(dir, 'c.txt'), 'c');
    git([...COMMIT, 'add', '.'], dir);
    git([...COMMIT, 'commit', '-q', '-m', 'c'], dir);
    const guardEnv = buildAgentEnv({
      source: process.env,
      hooksDir: path.join(work.repos[0]!.cache, 'hooks'),
    });
    const push = (args: string[], cwd = dir, env: NodeJS.ProcessEnv = {}) => {
      try {
        execFileSync('git', ['push', '--quiet', ...args], {
          cwd,
          env: { ...process.env, ...guardEnv, ...env },
          stdio: 'pipe',
        });
        return 'pushed';
      } catch (error) {
        return String((error as { stderr?: Buffer }).stderr ?? error);
      }
    };
    expect(push(['origin', 'HEAD:main'])).toContain(
      'may push only the branch agent/push-guard',
    );
    expect(push(['origin', 'HEAD:refs/tags/v1'])).toContain(
      'may push only the branch agent/push-guard',
    );
    const elsewhere = path.join(root, 'elsewhere.git');
    git(['init', '--quiet', '--bare', elsewhere]);
    expect(push([elsewhere, 'HEAD:agent/push-guard'])).toContain(
      'may push only to',
    );
    expect(push(['origin', 'HEAD:agent/push-guard'])).toBe('pushed');
    expect(push(['--force', 'origin', 'HEAD~1:agent/push-guard'])).toBe(
      'pushed',
    );
    expect(push(['origin', ':agent/push-guard'])).toContain('not allowed');

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

  it('keeps push permissions protected from file edits, shell redirection and sandbox writable roots', async () => {
    const work = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'protected-push',
      dirs: [repo('protected-push')],
    });
    const entry = work.repos[0]!;
    const allow = await pushAllowPath(paths.pushAllowDir, entry.gitDir);
    expect(existsSync(allow)).toBe(true);
    expect(isInside(paths.home, allow)).toBe(true);
    expect(existsSync(path.join(entry.gitDir, ALLOW_FILE))).toBe(false);
    const roots = [entry.dir, ...agentWritableRoots(work.dirs, entry.dir)];
    for (const root of roots) expect(isInside(root, allow)).toBe(false);
    for (const permissionMode of ['acceptEdits', 'bypass'] as const) {
      const permission = createPolicy({
        workDir: work.workDir,
        cwd: entry.dir,
        protectedPaths: [paths.home],
        policy: {
          permissionMode,
          allowedCommands: ['^printf\\b'],
          deniedPatterns: [],
          idleTimeoutMs: 1_000,
        },
      });
      expect(
        permission('Write', { file_path: allow, content: 'branch=main' }),
      ).toMatchObject({ decision: 'deny' });
      expect(permission('Edit', { file_path: allow })).toMatchObject({
        decision: 'deny',
      });
      expect(
        permission('Bash', { command: `printf branch=main > '${allow}'` }),
      ).toMatchObject({ decision: 'deny' });
    }
    // A forged checkout-local file is ignored even when an agent can create it.
    writeFileSync(path.join(entry.dir, 'pending.txt'), 'new commit');
    git(['add', '.'], entry.dir);
    git([...COMMIT, 'commit', '-q', '-m', 'new work'], entry.dir);
    writeFileSync(
      path.join(entry.gitDir, ALLOW_FILE),
      `url=${remote}\nbranch=main\n`,
    );
    await installGitHooks(paths.hooksDir, paths.pushAllowDir);
    const env = buildAgentEnv({
      source: process.env,
      hooksDir: paths.hooksDir,
    });
    expect(() =>
      execFileSync('git', ['push', '--quiet', 'origin', 'HEAD:main'], {
        cwd: entry.dir,
        env,
        stdio: 'pipe',
      }),
    ).toThrow(/may push only the branch agent\/protected-push/u);
    expect(
      git(['rev-parse', 'refs/heads/main'], remote.replace('file://', '')),
    ).toBe(git(['rev-parse', 'origin/main'], entry.dir));
    // The runner's automatic push also enforces protected hooks if local hooks or the remote are tampered with.
    const elsewhere = path.join(root, 'forged-remote.git');
    git(['init', '--quiet', '--bare', elsewhere]);
    writeFileSync(
      path.join(entry.gitDir, 'hooks', 'pre-push'),
      '#!/bin/sh\nexit 0\n',
    );
    git(['remote', 'set-url', 'origin', elsewhere], entry.dir);
    expect(
      (
        await reportRepos(work.repos, {
          push: true,
        })
      )[0]?.pushed,
    ).toBe(true);
    expect(git(['for-each-ref', 'refs/heads/'], elsewhere)).toBe('');
    git(['remote', 'set-url', 'origin', remote], entry.dir);
    expect((await reportRepos(work.repos, { push: true }))[0]?.pushed).toBe(
      true,
    );
    const errors: string[] = [];
    expect(
      (
        await reportRepos([{ ...entry, branch: 'main' }], {
          push: true,
          log: (message) => errors.push(message),
        })
      )[0]?.pushed,
    ).toBe(false);
    expect(errors.join('\n')).toContain('may push only the branch');
    await work.release();
  });

  it('ignores writable hooks and executable config during remote queries, push and resume', async () => {
    const options = {
      paths,
      appKey: 'app',
      subjectKey: 'host-git-boundary',
      dirs: [repo('host-git-boundary')],
    };
    const work = await checkout(options);
    const entry = work.repos[0]!;
    git(
      [...COMMIT, 'commit', '-q', '--allow-empty', '-m', 'task work'],
      entry.dir,
    );
    const head = git(['rev-parse', 'HEAD'], entry.dir);
    git(['checkout', '--quiet', '--detach'], entry.dir);
    const marker = path.join(root, 'host-executed');
    const payload = path.join(root, 'payload.sh');
    const script = `#!/bin/sh\nprintf executed > '${marker}'\nexit 0\n`;
    writeFileSync(payload, script, { mode: 0o755 });
    for (const name of ['pre-push', 'post-checkout']) {
      writeFileSync(path.join(entry.gitDir, 'hooks', name), script, {
        mode: 0o755,
      });
    }
    for (const [key, value] of [
      ['core.hooksPath', path.join(entry.gitDir, 'hooks')],
      ['core.fsmonitor', payload],
      ['core.sshCommand', payload],
      ['credential.helper', `!${payload}`],
      ['remote.origin.pushurl', `ext::${payload}`],
      ['remote.origin.url', `ext::${payload}`],
    ])
      git(['config', key!, value!], entry.dir);
    expect((await reportRepos(work.repos, { push: true }))[0]).toMatchObject({
      pushed: true,
      headSha: head,
    });
    expect(existsSync(marker)).toBe(false);
    await work.release();
    const resumed = await checkout(options);
    expect(existsSync(marker)).toBe(false);
    expect(
      git(['symbolic-ref', '--short', 'HEAD'], resumed.repos[0]!.dir),
    ).toBe(entry.branch);
    expect((await reportRepos(resumed.repos, { push: true }))[0]?.pushed).toBe(
      true,
    );
    expect(existsSync(marker)).toBe(false);
    await resumed.release();
  });

  it.each([
    ['url.ext::payload.insteadOf', 'file://'],
    ['include.path', 'payload.conf'],
    ['includeIf.gitdir:*.path', 'payload.conf'],
    ['credential.https://example.com.helper', '!touch executed'],
    ['filter.payload.process', 'touch executed'],
    ['core.gitProxy', 'touch executed'],
    ['core.worktree', '../other-checkout'],
  ])(
    'refuses unsafe %s before remote queries, push or resume',
    async (key, value) => {
      const options = {
        paths,
        appKey: 'app',
        subjectKey: 'unsafe-config',
        dirs: [repo('unsafe-config')],
      };
      const work = await checkout(options);
      const entry = work.repos[0]!;
      git(
        [...COMMIT, 'commit', '-q', '--allow-empty', '-m', 'task work'],
        entry.dir,
      );
      git(['config', key, value], entry.dir);
      const logs: string[] = [];
      expect(
        (
          await reportRepos(work.repos, {
            push: true,
            log: (message) => logs.push(message),
          })
        )[0],
      ).toMatchObject({ pushed: false, headSha: '' });
      expect(logs.join('\n').toLowerCase()).toContain(
        `unsafe or unsupported git configuration ${key.toLowerCase()}`,
      );
      expect(
        git(
          ['for-each-ref', `refs/heads/${entry.branch}`],
          remote.slice('file://'.length),
        ),
      ).toBe('');
      await work.release();
      await expect(checkout(options)).rejects.toThrow(
        /unsafe or unsupported Git configuration/u,
      );
      expect(existsSync(path.join(entry.dir, '.git'))).toBe(true);
      // Rejection preserves the work and releases the workspace lock so it can be repaired and resumed.
      git(
        [
          'config',
          '--file',
          path.join(entry.gitDir, 'config'),
          '--unset-all',
          key,
        ],
        root,
      );
      const repaired = await checkout(options);
      await repaired.release();
    },
  );

  it('pushes and resumes with common local Git preferences without removing them', async () => {
    const options = {
      paths,
      appKey: 'app',
      subjectKey: 'local-preferences',
      dirs: [repo('local-preferences')],
    };
    const work = await checkout(options);
    const entry = work.repos[0]!;
    const preferences = [
      ['pull.rebase', 'true'],
      ['push.default', 'simple'],
      ['push.autoSetupRemote', 'true'],
      ['rerere.enabled', 'true'],
      ['commit.gpgsign', 'false'],
      ['core.sparseCheckout', 'false'],
      ['core.sparseCheckoutCone', 'false'],
      [
        `branch.${entry.branch}.vscode-merge-base`,
        git(['rev-parse', 'HEAD'], entry.dir),
      ],
    ] as const;
    for (const [key, value] of preferences)
      git(['config', key, value], entry.dir);
    git(
      [...COMMIT, 'commit', '-q', '--allow-empty', '-m', 'task work'],
      entry.dir,
    );
    expect((await reportRepos(work.repos, { push: true }))[0]?.pushed).toBe(
      true,
    );
    await work.release();
    const resumed = await checkout(options);
    for (const [key, value] of preferences)
      expect(git(['config', '--get', key], entry.dir)).toBe(value);
    expect((await reportRepos(resumed.repos, { push: true }))[0]?.pushed).toBe(
      true,
    );
    await resumed.release();
  });

  it('refreshes legacy and clone permissions without trusting their old local files', async () => {
    const first = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'guard-refresh',
      dirs: [repo('guard-refresh')],
    });
    const entry = first.repos[0]!;
    const legacy = path.join(first.workDir, 'legacy');
    git(
      [
        'worktree',
        'add',
        '-q',
        '-b',
        'agent/legacy-guard',
        legacy,
        'origin/main',
      ],
      entry.cache,
    );
    const legacyGitDir = git(['rev-parse', '--absolute-git-dir'], legacy);
    writeFileSync(
      path.join(entry.gitDir, ALLOW_FILE),
      `url=${remote}\nbranch=main\n`,
    );
    writeFileSync(
      path.join(legacyGitDir, ALLOW_FILE),
      `url=${remote}\nbranch=main\n`,
    );
    await first.release();
    const resumed = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'guard-refresh',
      dirs: [
        repo('guard-refresh'),
        { ...repo('legacy-guard'), path: 'legacy' },
      ],
    });
    for (const repository of resumed.repos) {
      expect(existsSync(path.join(repository.gitDir, ALLOW_FILE))).toBe(false);
      expect(
        readFileSync(
          await pushAllowPath(paths.pushAllowDir, repository.gitDir),
          'utf8',
        ),
      ).toContain(`branch=${repository.branch}\n`);
    }
    await resumed.release();
  });

  it('does not execute a checkout credential helper when host remote operations require authentication', async () => {
    const work = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'http-helper-boundary',
      dirs: [repo('http-helper-boundary')],
    });
    const entry = work.repos[0]!;
    git(
      [...COMMIT, 'commit', '-q', '--allow-empty', '-m', 'task work'],
      entry.dir,
    );
    const marker = path.join(root, 'credential-helper-executed');
    const requests: string[] = [];
    const server = createServer((request, response) => {
      requests.push(request.url ?? '');
      response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="fixture"' });
      response.end();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    if (address === null || typeof address === 'string')
      throw new Error('No HTTP fixture port');
    try {
      // The host has no helper for this fixture; the agent's helper must never be substituted for it.
      git(['config', 'credential.helper', ''], entry.cache);
      git(
        ['config', 'credential.helper', `!printf executed > '${marker}'`],
        entry.dir,
      );
      const [report] = await reportRepos(
        [{ ...entry, url: `http://127.0.0.1:${address.port}/repo.git` }],
        { push: true },
      );
      expect(report?.pushed).toBe(false);
      expect(
        requests.some((url) => url.includes('service=git-upload-pack')),
      ).toBe(true);
      expect(
        requests.some((url) => url.includes('service=git-receive-pack')),
      ).toBe(true);
      expect(existsSync(marker)).toBe(false);
      const hostMarker = path.join(root, 'trusted-host-helper-executed');
      git(
        [
          'config',
          'credential.helper',
          `!f() { printf trusted > '${hostMarker}'; printf 'username=fixture\\npassword=fixture-password\\n'; }; f`,
        ],
        entry.cache,
      );
      const logs: string[] = [];
      await reportRepos(
        [{ ...entry, url: `http://127.0.0.1:${address.port}/repo.git` }],
        { push: true, log: (message) => logs.push(message) },
      );
      expect(existsSync(hostMarker)).toBe(true);
      expect(existsSync(marker)).toBe(false);
      expect(logs.join('\n')).not.toContain('fixture-password');
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await work.release();
    }
  });

  it('reads protected push permissions when runner paths contain spaces and quotes', async () => {
    const specialPaths = runnerPaths(
      path.join(root, "runner's home"),
      path.join(root, 'work spaces'),
    );
    const work = await checkout({
      paths: specialPaths,
      appKey: 'app',
      subjectKey: 'quoted-paths',
      dirs: [repo('quoted-paths')],
    });
    const dir = work.repos[0]!.dir;
    writeFileSync(path.join(dir, 'pending.txt'), 'new commit');
    git(['add', '.'], dir);
    git([...COMMIT, 'commit', '-q', '-m', 'new work'], dir);
    expect((await reportRepos(work.repos, { push: true }))[0]?.pushed).toBe(
      true,
    );
    await work.release();
  });

  describe('submodules', () => {
    let sub: string;

    beforeEach(() => {
      // Git refuses file:// submodules unless told otherwise; real repositories are fetched over the network.
      vi.stubEnv('GIT_CONFIG_COUNT', '1');
      vi.stubEnv('GIT_CONFIG_KEY_0', 'protocol.file.allow');
      vi.stubEnv('GIT_CONFIG_VALUE_0', 'always');
      sub = makeRemote(root, 'sub-repo');
      const seed = path.join(root, 'origin-repo-seed');
      git(['submodule', 'add', '--quiet', sub, 'vendor/sub'], seed);
      git(['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'sub'], seed);
      publishSeed(root);
    });
    afterEach(() => vi.unstubAllEnvs());

    it.each(['rebase', 'merge', 'checkout', 'none'])(
      'pushes and resumes after initialization copies the %s submodule update policy',
      async (update) => {
        const seed = path.join(root, 'origin-repo-seed');
        git(
          [
            'config',
            '--file',
            '.gitmodules',
            'submodule.vendor/sub.update',
            update,
          ],
          seed,
        );
        git(['add', '.gitmodules'], seed);
        git([...COMMIT, 'commit', '-q', '-m', 'submodule update policy'], seed);
        publishSeed(root);
        const options = {
          paths,
          appKey: 'app',
          subjectKey: 'submodule-update-policy',
          dirs: [repo('submodule-update-policy')],
        };
        const work = await checkout(options);
        const entry = work.repos[0]!;
        expect(
          git(['config', '--get', 'submodule.vendor/sub.update'], entry.dir),
        ).toBe(update);
        expect(existsSync(path.join(entry.dir, 'vendor/sub/README.md'))).toBe(
          true,
        );
        for (const [key, value] of [
          ['branch', 'main'],
          ['ignore', 'dirty'],
          ['fetchRecurseSubmodules', 'false'],
        ]) {
          git(['config', `submodule.vendor/sub.${key}`, value!], entry.dir);
        }
        git(
          [...COMMIT, 'commit', '-q', '--allow-empty', '-m', 'task work'],
          entry.dir,
        );
        const head = git(['rev-parse', 'HEAD'], entry.dir);
        expect(
          (await reportRepos(work.repos, { push: true }))[0],
        ).toMatchObject({ pushed: true, headSha: head });
        expect(
          git(
            ['rev-parse', `refs/heads/${entry.branch}`],
            remote.slice('file://'.length),
          ),
        ).toBe(head);
        await work.release();

        const resumed = await checkout(options);
        expect(git(['rev-parse', 'HEAD'], entry.dir)).toBe(head);
        expect(
          git(['config', '--get', 'submodule.vendor/sub.update'], entry.dir),
        ).toBe(update);
        expect(
          (await reportRepos(resumed.repos, { push: true }))[0]?.pushed,
        ).toBe(true);
        await resumed.release();
      },
    );

    it('rejects a custom local submodule update command before push or resume', async () => {
      const options = {
        paths,
        appKey: 'app',
        subjectKey: 'submodule-update-command',
        dirs: [repo('submodule-update-command')],
      };
      const work = await checkout(options);
      const entry = work.repos[0]!;
      const marker = path.join(root, 'submodule-update-executed');
      git(
        ['config', 'submodule.vendor/sub.update', `!touch '${marker}'`],
        entry.dir,
      );
      const logs: string[] = [];
      expect(
        (
          await reportRepos(work.repos, {
            push: true,
            log: (message) => logs.push(message),
          })
        )[0]?.headSha,
      ).toBe('');
      expect(logs.join('\n')).toContain(
        'unsafe or unsupported Git configuration submodule.vendor/sub.update',
      );
      await work.release();
      await expect(checkout(options)).rejects.toThrow(
        /unsafe or unsupported Git configuration submodule\.vendor\/sub\.update/u,
      );
      expect(existsSync(marker)).toBe(false);
      expect(existsSync(path.join(entry.dir, 'vendor/sub/README.md'))).toBe(
        true,
      );
    });

    it('rejects unsafe submodule config before launching any child Git on resume', async () => {
      const options = {
        paths,
        appKey: 'app',
        subjectKey: 'submodule-config-boundary',
        dirs: [repo('submodule-config-boundary')],
      };
      const work = await checkout(options);
      const entry = work.repos[0]!;
      const child = path.join(entry.dir, 'vendor/sub');
      const childConfig = path.join(entry.gitDir, 'modules/vendor/sub/config');
      const marker = path.join(root, 'submodule-helper-executed');
      git(['config', 'filter.payload.process', `touch '${marker}'`], child);
      await work.release();
      await expect(checkout(options)).rejects.toThrow(
        /unsafe or unsupported Git configuration filter\.payload\.process/u,
      );
      expect(existsSync(marker)).toBe(false);
      git(
        ['config', '--file', childConfig, '--unset', 'filter.payload.process'],
        root,
      );
      // A replaced .git pointer must not make the runner load another repository's configuration either.
      writeFileSync(path.join(child, '.git'), `gitdir: ${entry.gitDir}\n`);
      await expect(checkout(options)).rejects.toThrow(
        /redirected submodule Git directory/u,
      );
      expect(existsSync(marker)).toBe(false);
    });

    it('initializes them in a new clone, with their metadata in its own git directory', async () => {
      const work = await checkout({
        paths,
        appKey: 'app',
        subjectKey: 'submodule-initialization',
        dirs: [repo('submodule-initialization')],
      });
      const dir = path.join(work.workDir, 'app');
      const gitDir = work.repos[0]!.gitDir;
      expect(existsSync(path.join(dir, 'vendor/sub/README.md'))).toBe(true);
      expect(gitDir).toBe(path.join(dir, '.git'));
      expect(
        git(['rev-parse', '--absolute-git-dir'], path.join(dir, 'vendor/sub')),
      ).toBe(path.join(gitDir, 'modules', 'vendor', 'sub'));
      await work.release();
    });

    it('initializes only the missing ones when a clone is resumed, keeping where the agent moved the others', async () => {
      const first = await checkout({
        paths,
        appKey: 'app',
        subjectKey: 'submodule-resume',
        dirs: [repo('submodule-resume')],
      });
      const dir = path.join(first.workDir, 'app');
      const subDir = path.join(dir, 'vendor/sub');
      git([...COMMIT, 'commit', '-q', '--allow-empty', '-m', 'moved'], subDir);
      const moved = git(['rev-parse', 'HEAD'], subDir);
      await first.release();

      const second = await checkout({
        paths,
        appKey: 'app',
        subjectKey: 'submodule-resume',
        dirs: [repo('submodule-resume')],
      });
      expect(git(['rev-parse', 'HEAD'], subDir)).toBe(moved);
      git(['submodule', 'deinit', '--quiet', '--force', 'vendor/sub'], dir);
      expect(existsSync(path.join(subDir, 'README.md'))).toBe(false);
      await second.release();

      const third = await checkout({
        paths,
        appKey: 'app',
        subjectKey: 'submodule-resume',
        dirs: [repo('submodule-resume')],
      });
      expect(existsSync(path.join(subDir, 'README.md'))).toBe(true);
      await third.release();
    });

    it('fails the preparation when a submodule cannot be fetched', async () => {
      const seed = path.join(root, 'origin-repo-seed');
      git(
        [
          'config',
          '--file',
          '.gitmodules',
          'submodule.vendor/sub.url',
          `file://${path.join(root, 'missing.git')}`,
        ],
        seed,
      );
      git(['add', '.gitmodules'], seed);
      git(['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'gone'], seed);
      publishSeed(root);
      await expect(
        checkout({
          paths,
          appKey: 'app',
          subjectKey: 'submodule-failure',
          dirs: [repo('submodule-failure')],
        }),
      ).rejects.toThrow(/initializing its submodules failed: .*vendor\/sub/s);
    });

    it('gives each subject a git directory of its own, apart from the shared cache', async () => {
      const a = await checkout({
        paths,
        appKey: 'app',
        subjectKey: 'isolated-first',
        dirs: [repo('isolated-first')],
      });
      const b = await checkout({
        paths,
        appKey: 'app',
        subjectKey: 'isolated-second',
        dirs: [repo('isolated-second')],
      });
      const rootsA = agentWritableRoots(a.dirs, a.workDir);
      const rootsB = agentWritableRoots(b.dirs, b.workDir);
      expect(rootsA).toEqual([a.repos[0]!.dir, a.repos[0]!.gitDir]);
      for (const root of rootsA) {
        expect(isInside(root, b.repos[0]!.gitDir)).toBe(false);
        expect(isInside(root, b.repos[0]!.dir)).toBe(false);
        expect(isInside(root, a.repos[0]!.cache)).toBe(false);
      }
      for (const root of rootsB)
        expect(isInside(root, a.repos[0]!.gitDir)).toBe(false);
      await a.release();
      await b.release();
    });
  });

  it('refuses a repository path outside the work directory', async () => {
    await expect(
      checkout({
        paths,
        appKey: 'app',
        subjectKey: 'outside-path',
        dirs: [{ ...repo('outside-path'), path: '../escape' }],
      }),
    ).rejects.toThrow(/outside the work directory/);
  });

  it('keeps a working directory fresh until a run finishes in it, and again after a clean', async () => {
    const own = path.join(root, 'own-dir');
    mkdirSync(own);
    writeFileSync(path.join(own, 'keep.txt'), 'mine');
    const dirs = [
      { ...repo('initialization'), initPrompt: 'pnpm install' },
      { kind: 'directory' as const, path: own },
    ];
    const first = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'initialization',
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
      subjectKey: 'initialization',
      dirs,
    });
    expect(retried.dirs.map((dir) => dir.fresh)).toEqual([true, true]);
    await markDirsPrepared(retried.workDir, retried.dirs);
    await retried.release();

    const second = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'initialization',
      dirs,
    });
    expect(second.dirs.map((dir) => dir.fresh)).toEqual([false, false]);
    writeFileSync(path.join(second.workDir, 'app', 'work.txt'), 'x');
    await second.release();

    const cleaned = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'initialization',
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
      subjectKey: 'directory-owner',
      dirs,
    });
    expect(first.repos).toEqual([]);
    await expect(
      checkout({
        paths,
        appKey: 'app',
        subjectKey: 'directory-waiter',
        dirs,
        lockTimeoutMs: 300,
      }),
    ).rejects.toThrow(/held by process/);
    await first.release();
    const again = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'directory-waiter',
      dirs,
    });
    await again.release();

    await expect(
      checkout({
        paths,
        appKey: 'app',
        subjectKey: 'invalid-directory',
        dirs: [{ kind: 'directory', path: path.join(root, 'missing') }],
      }),
    ).rejects.toThrow(/does not exist/);
    await expect(
      checkout({
        paths,
        appKey: 'app',
        subjectKey: 'invalid-directory',
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
      subjectKey: 'pushed-retention',
      dirs: [repo('pushed-retention')],
    });
    await pushed.release();
    await markWorkspaceEnded(pushed.workDir, true);
    const kept = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'idle-retention',
      dirs: [repo('idle-retention')],
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
      'pushed-retention',
    );
    expect(await gcWorkspaces({ paths, now: Date.now() + 31 * day })).toEqual([
      kept.workDir,
    ]);
    utimesSync(root, new Date(), new Date());
  });
});
