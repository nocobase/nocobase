/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn } from 'node:child_process';
import { execFile } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VscGitRemoteConfig, VscRemoteSnapshot } from '../../../../../../shared/vsc-file/remote-sync-types';
import { RemoteSyncError, type RemoteSyncAdapterTarget } from '../../../RemoteSyncAdapter';
import { computeRemoteSnapshotContentHash } from '../../../snapshot';
import type { GitCommandRequest, GitCommandResult } from '../GitCommandRunner';
import { GitRemoteAdapter } from '../GitRemoteAdapter';
import { gitWorkspaceTemporaryDirectoryPrefix, type GitCommandExecutor } from '../GitRepositoryWorkspace';

const execFileAsync = promisify(execFile);
const remoteUrl = 'https://git.test/team/project.git';

describe('GitRemoteAdapter', () => {
  let temporaryDirectory: string;
  let remoteDirectory: string;
  let runner: LocalGitRunner;
  let adapter: GitRemoteAdapter;
  let config: VscGitRemoteConfig;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'git-remote-adapter-test-'));
    remoteDirectory = path.join(temporaryDirectory, 'remote.git');
    await seedRemote(remoteDirectory);
    runner = new LocalGitRunner(new Map([[remoteUrl, remoteDirectory]]));
    adapter = createAdapter(runner, temporaryDirectory);
    config = {
      url: remoteUrl,
      branch: 'main',
      subdirectory: null,
      transport: 'https',
    };
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { force: true, recursive: true });
  });

  it('discovers the default branch and probes specified, missing, and empty branches', async () => {
    const resolvedConfig = await adapter.resolveConfigDraft({ url: remoteUrl });
    expect(resolvedConfig).toEqual({
      url: remoteUrl,
      branch: 'main',
      subdirectory: null,
      transport: 'https',
    });
    const defaultTarget = target(resolvedConfig);
    const defaultProbe = await adapter.probe(defaultTarget);
    expect(defaultProbe).toMatchObject({
      revision: expect.stringMatching(/^[0-9a-f]{40}$/u),
      metadata: { branch: 'main', defaultBranch: null, transport: 'https', host: 'git.test' },
    });
    await expect(adapter.probe(target({ ...config, branch: 'missing' }))).resolves.toMatchObject({ revision: null });

    const emptyDirectory = path.join(temporaryDirectory, 'empty.git');
    await git(['init', '--bare', emptyDirectory]);
    const emptyUrl = 'https://git.test/team/empty.git';
    const emptyAdapter = createAdapter(new LocalGitRunner(new Map([[emptyUrl, emptyDirectory]])), temporaryDirectory);
    await expect(emptyAdapter.resolveConfigDraft({ url: emptyUrl })).rejects.toMatchObject({
      code: 'CONFIG_INVALID',
      details: { reasonCode: 'default-branch-unavailable' },
    });
  });

  it('fetches root and subdirectory snapshots and rejects drift from a planned revision', async () => {
    const root = await adapter.fetchSnapshot(target(config));
    expect(root).toMatchObject({
      revision: expect.stringMatching(/^[0-9a-f]{40}$/u),
      files: [
        { path: 'outside.txt', content: 'outside\n' },
        { path: 'packages/light/index.ts', content: 'export const value = 1;\n' },
      ],
    });
    const scoped = await adapter.fetchSnapshot(target({ ...config, subdirectory: 'packages/light' }), root.revision);
    expect(scoped.files).toEqual([{ path: 'index.ts', content: 'export const value = 1;\n', mode: '100644' }]);

    const plannedRevision = root.revision as string;
    const advanced = await createCompetingCommit(remoteDirectory, plannedRevision, 'advanced');
    await expect(adapter.fetchSnapshot(target(config), plannedRevision)).rejects.toMatchObject({
      code: 'REMOTE_CHANGED',
      details: {
        reasonCode: 'fetched-head-mismatch',
        expectedRemoteRevision: plannedRevision,
        currentRemoteRevision: advanced,
      },
    });
    expect(await activeWorkspaceDirectories(temporaryDirectory)).toEqual([]);
  });

  it('publishes a subdirectory while preserving outside files and creates a child commit', async () => {
    const scopedConfig = { ...config, subdirectory: 'packages/light' };
    const before = await adapter.fetchSnapshot(target(scopedConfig));
    const snapshot = createSnapshot([
      { path: 'index.ts', content: 'export const value = 2;\n', mode: '100755' },
      { path: 'new.ts', content: 'new\n' },
    ]);
    const published = await adapter.publishSnapshot(target(scopedConfig, 'https-secret'), snapshot, before.revision);

    expect((await git(['--git-dir', remoteDirectory, 'show', `${published.revision}:outside.txt`])).stdout).toBe(
      'outside\n',
    );
    expect(
      (await git(['--git-dir', remoteDirectory, 'show', `${published.revision}:packages/light/index.ts`])).stdout,
    ).toBe('export const value = 2;\n');
    expect((await git(['--git-dir', remoteDirectory, 'cat-file', '-p', published.revision])).stdout).toContain(
      `parent ${before.revision}`,
    );
    expect(
      (await git(['--git-dir', remoteDirectory, 'ls-tree', published.revision, '--', 'outside.txt'])).stdout,
    ).toMatch(/^100755 blob/u);
    expect(published.contentHash).toBe(snapshot.contentHash);
    expect(await activeWorkspaceDirectories(temporaryDirectory)).toEqual([]);
  });

  it('creates a new branch only while it remains absent', async () => {
    const emptyDirectory = path.join(temporaryDirectory, 'initial.git');
    await git(['init', '--bare', emptyDirectory]);
    const emptyUrl = 'https://git.test/team/initial.git';
    const emptyRunner = new LocalGitRunner(new Map([[emptyUrl, emptyDirectory]]));
    const emptyAdapter = createAdapter(emptyRunner, temporaryDirectory);
    const initialConfig: VscGitRemoteConfig = {
      url: emptyUrl,
      branch: 'main',
      subdirectory: null,
      transport: 'https',
    };
    const snapshot = createSnapshot([{ path: 'index.ts', content: 'initial\n' }]);
    const published = await emptyAdapter.publishSnapshot(target(initialConfig, 'https-secret'), snapshot, null);

    expect((await git(['--git-dir', emptyDirectory, 'rev-parse', 'refs/heads/main'])).stdout.trim()).toBe(
      published.revision,
    );
    expect(emptyRunner.requests.find((request) => request.args[0] === 'push')?.args).toContain(
      '--force-with-lease=refs/heads/main:',
    );
  });

  it('maps a concurrent branch advance during push to a lease conflict', async () => {
    const expected = (await adapter.probe(target(config))).revision as string;
    let competingRevision: string | null = null;
    const racingRunner = new LocalGitRunner(new Map([[remoteUrl, remoteDirectory]]), async (request) => {
      if (request.args[0] === 'push' && competingRevision === null) {
        competingRevision = await createCompetingCommit(remoteDirectory, expected, 'competitor');
      }
    });
    const racingAdapter = createAdapter(racingRunner, temporaryDirectory);

    await expect(
      racingAdapter.publishSnapshot(
        target(config, 'https-secret'),
        createSnapshot([{ path: 'replacement.ts', content: 'replacement\n' }]),
        expected,
      ),
    ).rejects.toMatchObject({
      code: 'REMOTE_CHANGED',
      details: {
        reasonCode: 'lease-rejected',
        expectedRemoteRevision: expected,
        currentRemoteRevision: expect.stringMatching(/^[0-9a-f]{40}$/u),
      },
    });
    expect(await activeWorkspaceDirectories(temporaryDirectory)).toEqual([]);
  });

  it('recovers when push succeeds but its response is reported as interrupted', async () => {
    const expected = (await adapter.probe(target(config))).revision as string;
    const ambiguousRunner = new LocalGitRunner(new Map([[remoteUrl, remoteDirectory]]), undefined, true);
    const ambiguousAdapter = createAdapter(ambiguousRunner, temporaryDirectory);
    const snapshot = createSnapshot([{ path: 'recovered.ts', content: 'recovered\n' }]);

    const published = await ambiguousAdapter.publishSnapshot(target(config, 'https-secret'), snapshot, expected);
    expect((await git(['--git-dir', remoteDirectory, 'rev-parse', 'refs/heads/main'])).stdout.trim()).toBe(
      published.revision,
    );
    expect(published.contentHash).toBe(snapshot.contentHash);
  });

  it('parses credential kinds before every transport reaches the runner', async () => {
    const fakeOid = 'a'.repeat(40);
    const fakeRunner: GitCommandExecutor = {
      run: vi.fn(async (request) => ({
        exitCode: 0,
        stdout: Buffer.from(`${fakeOid}\trefs/heads/main\n`),
        stderr: Buffer.alloc(0),
        durationMs: 1,
      })),
    };
    const credentialResolver = {
      resolve: vi.fn(async (authRef: unknown) => {
        if (authRef === 'https-auth') {
          return JSON.stringify({ kind: 'https', username: 'oauth2', password: 'secret' });
        }
        return JSON.stringify({
          kind: 'ssh',
          privateKey: 'private-key',
          knownHosts: 'git.test ssh-ed25519 AAAA',
        });
      }),
    };
    const fakeAdapter = new GitRemoteAdapter({ credentialResolver, runner: fakeRunner });
    await fakeAdapter.probe(target(config, 'https-auth'));
    await fakeAdapter.probe(
      target(
        {
          url: 'ssh://git@git.test/team/project.git',
          branch: 'main',
          subdirectory: null,
          transport: 'ssh',
        },
        'ssh-auth',
      ),
    );

    const calls = vi.mocked(fakeRunner.run).mock.calls.map(([request]) => request);
    expect(calls[0].credential).toEqual({ kind: 'https', username: 'oauth2', password: 'secret' });
    expect(calls[1].credential).toEqual({
      kind: 'ssh',
      privateKey: 'private-key',
      knownHosts: 'git.test ssh-ed25519 AAAA',
    });
  });

  it('does not publish a second commit when the verified snapshot already matches', async () => {
    const current = await adapter.fetchSnapshot(target(config));
    const pushesBefore = runner.requests.filter((request) => request.args[0] === 'push').length;
    const result = await adapter.publishSnapshot(target(config, 'https-secret'), current, current.revision);
    expect(result.revision).toBe(current.revision);
    expect(runner.requests.filter((request) => request.args[0] === 'push')).toHaveLength(pushesBefore);
  });

  it('rejects a no-op publish when the branch advances before the final probe', async () => {
    const current = await adapter.fetchSnapshot(target(config));
    const expected = current.revision as string;
    let competingRevision: string | null = null;
    const racingRunner = new LocalGitRunner(new Map([[remoteUrl, remoteDirectory]]), async (request) => {
      if (request.args[0] === 'ls-remote' && competingRevision === null) {
        competingRevision = await createCompetingCommit(remoteDirectory, expected, 'no-op competitor');
      }
    });

    await expect(
      createAdapter(racingRunner, temporaryDirectory).publishSnapshot(
        target(config, 'https-secret'),
        current,
        expected,
      ),
    ).rejects.toMatchObject({
      code: 'REMOTE_CHANGED',
      details: {
        reasonCode: 'head-mismatch',
        expectedRemoteRevision: expected,
        currentRemoteRevision: expect.stringMatching(/^[0-9a-f]{40}$/u),
      },
    });
    expect(competingRevision).toMatch(/^[0-9a-f]{40}$/u);
  });

  it('publishes mode-only changes even though the frozen content hash excludes modes', async () => {
    const current = await adapter.fetchSnapshot(target(config));
    const files = current.files.map((file) => (file.path === 'outside.txt' ? { ...file, mode: '100644' } : file));
    const published = await adapter.publishSnapshot(
      target(config, 'https-secret'),
      createSnapshot(files),
      current.revision,
    );

    expect(published.revision).not.toBe(current.revision);
    expect(published.contentHash).toBe(current.contentHash);
    expect(
      (await git(['--git-dir', remoteDirectory, 'ls-tree', published.revision, '--', 'outside.txt'])).stdout,
    ).toMatch(/^100644 blob/u);
  });
});

class LocalGitRunner implements GitCommandExecutor {
  readonly requests: GitCommandRequest[] = [];

  private interrupted = false;

  constructor(
    private readonly remotes: ReadonlyMap<string, string>,
    private readonly beforeRun?: (request: GitCommandRequest) => Promise<void>,
    private readonly interruptSuccessfulPush = false,
  ) {}

  async run(request: GitCommandRequest): Promise<GitCommandResult> {
    this.requests.push(request);
    await this.beforeRun?.(request);
    const args = request.args.map((argument) => this.remotes.get(argument) || argument);
    const result = await runGitProcess(args, request);
    if (this.interruptSuccessfulPush && request.args[0] === 'push' && !this.interrupted) {
      this.interrupted = true;
      throw new RemoteSyncError('REMOTE_UNAVAILABLE', 'Push response was interrupted', {
        details: { provider: 'git', reasonCode: 'network-error' },
      });
    }
    return result;
  }
}

function runGitProcess(args: readonly string[], request: GitCommandRequest): Promise<GitCommandResult> {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const child = spawn('git', [...args], {
      cwd: request.cwd,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...request.environment },
      stdio: 'pipe',
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (exitCode) => {
      const result = {
        exitCode: exitCode ?? -1,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
        durationMs: Date.now() - startedAt,
      };
      if ((request.acceptableExitCodes || [0]).includes(result.exitCode)) {
        resolve(result);
      } else {
        reject(
          new RemoteSyncError('REMOTE_UNAVAILABLE', 'Test Git command failed', {
            details: { provider: 'git', operation: request.operation, reasonCode: 'test-command-failed' },
          }),
        );
      }
    });
    child.stdin.end(request.stdin);
  });
}

function createAdapter(runner: GitCommandExecutor, temporaryDirectory: string): GitRemoteAdapter {
  return new GitRemoteAdapter({
    runner,
    temporaryDirectory,
    identity: { date: '2026-01-01T00:00:00Z' },
    credentialResolver: {
      resolve: async (authRef, mode) => {
        if (authRef === null || authRef === undefined) {
          if (mode === 'required') {
            throw new RemoteSyncError('CREDENTIAL_UNAVAILABLE', 'Credential required', {
              details: { reasonCode: 'credential-required' },
            });
          }
          return null;
        }
        return JSON.stringify({ kind: 'https', username: 'oauth2', password: String(authRef) });
      },
    },
  });
}

function target(targetConfig: VscGitRemoteConfig, authRef: string | null = null): RemoteSyncAdapterTarget {
  return { config: targetConfig, authRef };
}

function createSnapshot(files: VscRemoteSnapshot['files']): VscRemoteSnapshot {
  return {
    revision: null,
    contentHash: computeRemoteSnapshotContentHash(files),
    files,
    metadata: {},
  };
}

async function seedRemote(remote: string): Promise<void> {
  const working = `${remote}-working`;
  await git(['init', '--bare', remote]);
  await git(['init', working]);
  await git(['-C', working, 'config', 'user.name', 'Test']);
  await git(['-C', working, 'config', 'user.email', 'test@example.com']);
  await mkdir(path.join(working, 'packages/light'), { recursive: true });
  await writeFile(path.join(working, 'outside.txt'), 'outside\n');
  await chmod(path.join(working, 'outside.txt'), 0o755);
  await writeFile(path.join(working, 'packages/light/index.ts'), 'export const value = 1;\n');
  await git(['-C', working, 'add', '.']);
  await git(['-C', working, 'commit', '-m', 'seed']);
  await git(['-C', working, 'branch', '-M', 'main']);
  await git(['-C', working, 'push', remote, 'main']);
  await git(['--git-dir', remote, 'symbolic-ref', 'HEAD', 'refs/heads/main']);
}

async function createCompetingCommit(remote: string, parent: string, message: string): Promise<string> {
  const tree = (await git(['--git-dir', remote, 'rev-parse', `${parent}^{tree}`])).stdout.trim();
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: 'Competitor',
    GIT_AUTHOR_EMAIL: 'competitor@example.com',
    GIT_COMMITTER_NAME: 'Competitor',
    GIT_COMMITTER_EMAIL: 'competitor@example.com',
  };
  const commit = (
    await execFileAsync('git', ['--git-dir', remote, 'commit-tree', tree, '-p', parent, '-m', message], {
      encoding: 'utf8',
      env,
    })
  ).stdout.trim();
  await git(['--git-dir', remote, 'update-ref', 'refs/heads/main', commit, parent]);
  return commit;
}

async function activeWorkspaceDirectories(directory: string): Promise<string[]> {
  return (await readdir(directory)).filter((name) => name.startsWith(gitWorkspaceTemporaryDirectoryPrefix));
}

function git(args: readonly string[]) {
  return execFileAsync('git', [...args], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
}
