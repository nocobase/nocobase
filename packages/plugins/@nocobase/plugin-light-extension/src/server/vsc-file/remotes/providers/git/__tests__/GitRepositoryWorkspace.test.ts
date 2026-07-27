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
import { promisify } from 'node:util';
import { access, chmod, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { VscGitRemoteConfig } from '../../../../../../shared/vsc-file/remote-sync-types';
import { RemoteSyncError } from '../../../RemoteSyncAdapter';
import type { GitCommandRequest, GitCommandResult } from '../GitCommandRunner';
import {
  GitRepositoryWorkspace,
  gitWorkspaceTemporaryDirectoryPrefix,
  parseBatchOutput,
  parseGitTreeOutput,
  type GitCommandExecutor,
} from '../GitRepositoryWorkspace';
import { normalizeGitSnapshotLimits } from '../gitSnapshotPolicy';

const execFileAsync = promisify(execFile);
const remoteUrl = 'https://git.test/team/project.git';

describe('GitRepositoryWorkspace', () => {
  let temporaryDirectory: string;
  let remoteDirectory: string;
  let runner: LocalGitRunner;
  let config: VscGitRemoteConfig;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'git-repository-workspace-test-'));
    remoteDirectory = path.join(temporaryDirectory, 'remote.git');
    await seedRemote(remoteDirectory);
    runner = new LocalGitRunner(new Map([[remoteUrl, remoteDirectory]]));
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

  it('fetches into a temporary bare repository and reads blobs in one NUL-safe batch', async () => {
    const workspace = await createWorkspace(runner, config, temporaryDirectory);
    const revision = await workspace.fetchBranch();
    const snapshot = await workspace.readSnapshot(revision);

    expect(snapshot.files).toEqual([
      { path: 'outside.txt', content: 'outside\n', mode: '100755' },
      { path: 'packages/light/index.ts', content: 'export const value = 1;\n', mode: '100755' },
      { path: 'packages/light/odd\tname\n.ts', content: 'odd\n', mode: '100644' },
    ]);
    expect(snapshot.treeOid).toMatch(/^[0-9a-f]{40}$/u);
    expect(runner.requests.filter((request) => request.args[0] === 'cat-file')).toHaveLength(1);
    expect(runner.requests.some((request) => request.args.includes('checkout'))).toBe(false);
    expect(runner.requests.some((request) => request.args.includes('clone'))).toBe(false);

    const rootDirectory = workspace.rootDirectory;
    await workspace.cleanup();
    await expect(access(rootDirectory)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('reads a configured subdirectory and rejects a blob masquerading as one', async () => {
    const scoped = await createWorkspace(runner, { ...config, subdirectory: 'packages/light' }, temporaryDirectory);
    const revision = await scoped.fetchBranch();
    await expect(scoped.readSnapshot(revision)).resolves.toMatchObject({
      files: [
        { path: 'index.ts', content: 'export const value = 1;\n', mode: '100755' },
        { path: 'odd\tname\n.ts', content: 'odd\n', mode: '100644' },
      ],
    });
    expect(
      runner.requests
        .filter((request) => request.args[0] === 'ls-tree' && request.args.includes('--'))
        .every((request) => request.args[request.args.indexOf('--') + 1] === ':(literal)packages/light'),
    ).toBe(true);
    await scoped.cleanup();

    const invalid = await createWorkspace(runner, { ...config, subdirectory: 'outside.txt' }, temporaryDirectory);
    const invalidRevision = await invalid.fetchBranch();
    await expect(invalid.readSnapshot(invalidRevision)).rejects.toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { reasonCode: 'subdirectory-not-directory' },
    });
    await invalid.cleanup();
  });

  it('replaces only the configured subdirectory and preserves executable mode and outside files', async () => {
    const scopedConfig = { ...config, subdirectory: 'packages/light' };
    const workspace = await createWorkspace(runner, scopedConfig, temporaryDirectory);
    const parent = await workspace.fetchBranch();
    const current = await workspace.readSnapshot(parent);
    const created = await workspace.createCommit(
      [
        { path: 'index.ts', content: 'export const value = 2;\n' },
        { path: 'new.ts', content: 'new\n', mode: '100644' },
      ],
      parent,
      current.files,
    );
    await workspace.pushCommit(created.commitOid, parent);

    expect((await git(['--git-dir', remoteDirectory, 'show', `${created.commitOid}:outside.txt`])).stdout).toBe(
      'outside\n',
    );
    expect(
      (await git(['--git-dir', remoteDirectory, 'ls-tree', created.commitOid, '--', 'outside.txt'])).stdout,
    ).toMatch(/^100755 blob/u);
    expect(
      (await git(['--git-dir', remoteDirectory, 'show', `${created.commitOid}:packages/light/index.ts`])).stdout,
    ).toBe('export const value = 2;\n');
    const tree = (await git(['--git-dir', remoteDirectory, 'ls-tree', '-r', created.commitOid, '--', 'packages/light']))
      .stdout;
    expect(tree).toMatch(/^100755 blob [0-9a-f]{40}\tpackages\/light\/index\.ts$/mu);
    expect(tree).toMatch(/packages\/light\/new\.ts/u);
    expect(tree).not.toMatch(/odd\tname/u);
    await workspace.cleanup();
  });

  it('preserves opaque symlink and gitlink entries outside the configured subdirectory', async () => {
    await seedOpaqueOutsideEntries(remoteDirectory);
    const workspace = await createWorkspace(runner, { ...config, subdirectory: 'packages/light' }, temporaryDirectory);
    const parent = await workspace.fetchBranch();
    const outsideEntries = (
      await git(['--git-dir', remoteDirectory, 'ls-tree', parent, '--', 'outside-link', 'outside-gitlink'])
    ).stdout;
    const current = await workspace.readSnapshot(parent);
    const created = await workspace.createCommit(
      [{ path: 'index.ts', content: 'export const value = 3;\n', mode: '100755' }],
      parent,
      current.files,
    );
    await workspace.pushCommit(created.commitOid, parent);

    expect(
      (await git(['--git-dir', remoteDirectory, 'ls-tree', created.commitOid, '--', 'outside-link', 'outside-gitlink']))
        .stdout,
    ).toBe(outsideEntries);
    expect(outsideEntries).toMatch(/^160000 commit [0-9a-f]{40}\toutside-gitlink$/mu);
    expect(outsideEntries).toMatch(/^120000 blob [0-9a-f]{40}\toutside-link$/mu);
    await workspace.cleanup();
  });

  it('creates an initial branch with a compare-and-swap lease', async () => {
    const emptyRemote = path.join(temporaryDirectory, 'empty.git');
    await git(['init', '--bare', emptyRemote]);
    const emptyUrl = 'https://git.test/team/empty.git';
    const emptyRunner = new LocalGitRunner(new Map([[emptyUrl, emptyRemote]]));
    const workspace = await createWorkspace(
      emptyRunner,
      { ...config, url: emptyUrl, branch: 'created', subdirectory: null },
      temporaryDirectory,
    );
    const created = await workspace.createCommit([{ path: 'index.ts', content: 'created\n' }], null, []);
    await workspace.pushCommit(created.commitOid, null);

    expect((await git(['--git-dir', emptyRemote, 'rev-parse', 'refs/heads/created'])).stdout.trim()).toBe(
      created.commitOid,
    );
    const push = emptyRunner.requests.find((request) => request.args[0] === 'push');
    expect(push?.args).toContain('--force-with-lease=refs/heads/created:');
    await workspace.cleanup();
  });

  it('cleans a partially initialized workspace when initialization fails', async () => {
    const failingRunner: GitCommandExecutor = {
      run: async () => {
        throw new RemoteSyncError('REMOTE_UNAVAILABLE', 'Git unavailable', {
          details: { reasonCode: 'git-binary-unavailable' },
        });
      },
    };
    await expect(createWorkspace(failingRunner, config, temporaryDirectory)).rejects.toMatchObject({
      code: 'REMOTE_UNAVAILABLE',
    });
    expect(
      (await readDirectoryNames(temporaryDirectory)).filter((name) =>
        name.startsWith(gitWorkspaceTemporaryDirectoryPrefix),
      ),
    ).toEqual([]);
  });

  it('parses NUL-delimited tree output without splitting tabs or newlines in paths', () => {
    const output = Buffer.from(`100644 blob ${'a'.repeat(40)} 3\todd\tname\n.ts\0`, 'utf8');
    expect(parseGitTreeOutput(output, true)).toEqual([
      { mode: '100644', type: 'blob', oid: 'a'.repeat(40), size: 3, path: 'odd\tname\n.ts' },
    ]);
  });

  it('rejects malformed cat-file batch framing and trailing data', () => {
    const blobOid = 'a'.repeat(40);
    expect(parseBatchOutput(Buffer.from(`${blobOid} blob 3\nabc\n`), [{ oid: blobOid, size: 3 }])).toEqual([
      Buffer.from('abc'),
    ]);
    expect(
      captureError(() => parseBatchOutput(Buffer.from(`${blobOid} blob 3\nabc`), [{ oid: blobOid, size: 3 }])),
    ).toMatchObject({ code: 'UNSAFE_CONTENT', details: { reasonCode: 'invalid-batch-output' } });
    expect(
      captureError(() =>
        parseBatchOutput(Buffer.from(`${blobOid} blob 3\nabc\nunexpected`), [{ oid: blobOid, size: 3 }]),
      ),
    ).toMatchObject({ code: 'UNSAFE_CONTENT', details: { reasonCode: 'invalid-batch-output' } });
  });
});

function captureError(callback: () => unknown): RemoteSyncError {
  try {
    callback();
  } catch (error) {
    expect(error).toBeInstanceOf(RemoteSyncError);
    return error as RemoteSyncError;
  }
  throw new Error('Expected callback to throw RemoteSyncError');
}

class LocalGitRunner implements GitCommandExecutor {
  readonly requests: GitCommandRequest[] = [];

  constructor(
    private readonly remotes: ReadonlyMap<string, string>,
    private readonly beforeRun?: (request: GitCommandRequest) => Promise<void>,
  ) {}

  async run(request: GitCommandRequest): Promise<GitCommandResult> {
    this.requests.push(request);
    await this.beforeRun?.(request);
    const args = request.args.map((argument) => this.remotes.get(argument) || argument);
    const startedAt = Date.now();
    return new Promise((resolve, reject) => {
      const child = spawn('git', args, {
        cwd: request.cwd,
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0',
          ...request.environment,
        },
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
          return;
        }
        reject(
          new RemoteSyncError('REMOTE_UNAVAILABLE', 'Test Git command failed', {
            details: { provider: 'git', operation: request.operation, reasonCode: 'test-command-failed' },
          }),
        );
      });
      child.stdin.end(request.stdin);
    });
  }
}

function createWorkspace(
  runner: GitCommandExecutor,
  workspaceConfig: VscGitRemoteConfig,
  temporaryDirectory: string,
): Promise<GitRepositoryWorkspace> {
  return GitRepositoryWorkspace.create({
    runner,
    config: workspaceConfig,
    credential: null,
    limits: normalizeGitSnapshotLimits(),
    temporaryDirectory,
    identity: { date: '2026-01-01T00:00:00Z' },
  });
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
  await chmod(path.join(working, 'packages/light/index.ts'), 0o755);
  await writeFile(path.join(working, 'packages/light/odd\tname\n.ts'), 'odd\n');
  await git(['-C', working, 'add', '.']);
  await git(['-C', working, 'commit', '-m', 'seed']);
  await git(['-C', working, 'branch', '-M', 'main']);
  await git(['-C', working, 'push', remote, 'main']);
  await git(['--git-dir', remote, 'symbolic-ref', 'HEAD', 'refs/heads/main']);
}

async function seedOpaqueOutsideEntries(remote: string): Promise<void> {
  const working = `${remote}-working`;
  const gitlinkOid = (await git(['-C', working, 'rev-parse', 'HEAD'])).stdout.trim();
  await symlink('outside.txt', path.join(working, 'outside-link'));
  await git(['-C', working, 'add', 'outside-link']);
  await git(['-C', working, 'update-index', '--add', '--cacheinfo', '160000', gitlinkOid, 'outside-gitlink']);
  await git(['-C', working, 'commit', '-m', 'add opaque outside entries']);
  await git(['-C', working, 'push', remote, 'main']);
}

async function git(args: readonly string[]) {
  return execFileAsync('git', [...args], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
}

async function readDirectoryNames(directory: string): Promise<string[]> {
  const { readdir } = await import('node:fs/promises');
  return readdir(directory);
}
