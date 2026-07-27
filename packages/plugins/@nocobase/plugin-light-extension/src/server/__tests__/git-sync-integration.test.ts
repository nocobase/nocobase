/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { spawn } from 'node:child_process';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  RemoteSyncAdapterRegistry,
  RemoteSyncError,
  RemoteSyncRuntimeService,
  VscPermissionHookRegistry,
} from '../vsc-file';
import { vi } from 'vitest';

import type { GitCommandRequest, GitCommandResult } from '../vsc-file/remotes/providers/git/GitCommandRunner';
import { GitRemoteAdapter } from '../vsc-file/remotes/providers/git/GitRemoteAdapter';
import type { GitCommandExecutor } from '../vsc-file/remotes/providers/git/GitRepositoryWorkspace';
import { RemoteCredentialResolver } from '../vsc-file/remotes/security/RemoteCredentialResolver';
import { LightExtensionCreateFromRemoteService } from '../services/LightExtensionCreateFromRemoteService';
import {
  createGitSyncAcceptanceFixture,
  gitSyncRemoteConfig,
  type GitSyncAcceptanceFixture,
  validGitSyncFiles,
} from './helpers/gitSyncAcceptance';

describe('light extension Git sync integration', () => {
  let fixture: GitSyncAcceptanceFixture;
  let temporaryDirectories: string[];

  beforeEach(async () => {
    temporaryDirectories = [];
    fixture = await createGitSyncAcceptanceFixture();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(temporaryDirectories.map((directory) => rm(directory, { force: true, recursive: true })));
    await fixture?.close();
  });

  it('atomically creates credentialed and public Git sources with compiled entries, mappings, and jobs', async () => {
    const credentialedResult = await fixture.createFromRemote('Credentialed Git Source', '{{ $env.GIT_SYNC }}');
    const publicResult = await fixture.createFromRemote('Public Git Source');

    expect(fixture.validateCredential).toHaveBeenCalledTimes(2);
    expect(fixture.validateCredential).toHaveBeenNthCalledWith(1, '{{ $env.GIT_SYNC }}');
    expect(fixture.validateCredential).toHaveBeenNthCalledWith(2, '{{ $env.GIT_SYNC }}');
    for (const result of [credentialedResult, publicResult]) {
      const internal = await fixture.repoService.getInternalRepo(result.repo.id);
      const remote = await fixture.runtime.getRemote(internal.vscRepoId, 'origin');
      expect(result).toMatchObject({
        repo: { healthStatus: 'ready', headCommitId: expect.stringMatching(/^vscc_/) },
        plan: { state: 'in-sync', action: 'noop' },
        revision: 'remote-base',
        fileCount: 2,
      });
      await expect(
        fixture.app.db.getRepository('lightExtensionEntries').findOne({ filter: { repoId: result.repo.id } }),
      ).resolves.toMatchObject({ healthStatus: 'ready', runtimeArtifact: expect.any(Object) });
      await expect(
        fixture.app.db.getRepository('vscFileExternalCommitMaps').findOne({ filter: { remoteId: remote?.id } }),
      ).resolves.toMatchObject({
        localCommitId: result.repo.headCommitId,
        remoteRevision: 'remote-base',
      });
      await expect(
        fixture.app.db.getRepository('vscFileSyncJobs').findOne({ filter: { remoteId: remote?.id } }),
      ).resolves.toMatchObject({ operation: 'pull', status: 'succeeded', phase: 'finalized' });
    }
  });

  it('rejects anonymous private-source creation and succeeds only after resolving the referenced secret', async () => {
    const credential = 'git-private-source-password';
    const authRef = '{{ $env.PRIVATE_GIT }}';
    const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'git-sync-integration-'));
    temporaryDirectories.push(temporaryDirectory);
    const remoteDirectory = path.join(temporaryDirectory, 'remote.git');
    await seedGitRemote(remoteDirectory);
    const runner = new CredentialGatedLocalGitRunner(new Map([[gitSyncRemoteConfig.url, remoteDirectory]]), credential);
    const credentialResolver = new RemoteCredentialResolver({
      db: createSecretDatabase({ PRIVATE_GIT: 'secret' }),
      environment: {
        getVariables: () => ({
          PRIVATE_GIT: JSON.stringify({ kind: 'https', username: 'git-user', password: credential }),
        }),
      },
    });
    const registry = new RemoteSyncAdapterRegistry();
    registry.register(new GitRemoteAdapter({ runner, credentialResolver, temporaryDirectory }));
    const permissionHooks = new VscPermissionHookRegistry();
    permissionHooks.register(fixture.permissionService.createVscPermissionHook());
    const runtime = new RemoteSyncRuntimeService(fixture.app.db, {
      adapterRegistry: registry,
      credentialResolver,
      permissionHooks,
    });
    const service = new LightExtensionCreateFromRemoteService(
      fixture.app.db,
      fixture.auditService,
      fixture.repoService,
      fixture.runtimeCompileService,
      () => runtime,
    );
    const countsBefore = await persistenceCounts();

    await expect(
      service.create({
        name: 'Anonymous Private Source',
        provider: 'git',
        config: gitSyncRemoteConfig,
        authRef: null,
      }),
    ).rejects.toMatchObject({ code: 'AUTH_FAILED' });
    await expect(persistenceCounts()).resolves.toEqual(countsBefore);
    expect(runner.requests[0]?.credential).toBeNull();
    runner.requests.length = 0;

    const created = await service.create({
      name: 'Authenticated Private Source',
      provider: 'git',
      config: gitSyncRemoteConfig,
      authRef,
    });

    expect(created).toMatchObject({
      repo: { healthStatus: 'ready' },
      remote: { authRef },
      revision: expect.stringMatching(/^[0-9a-f]{40}$/u),
      plan: { state: 'in-sync' },
    });
    expect(runner.requests).not.toHaveLength(0);
    const remoteRequests = runner.requests.filter((request) => request.remoteUrl);
    expect(remoteRequests).not.toHaveLength(0);
    expect(remoteRequests.every((request) => request.credential?.kind === 'https')).toBe(true);
    expect(
      remoteRequests.every(
        (request) => request.credential?.kind === 'https' && request.credential.password === credential,
      ),
    ).toBe(true);

    async function persistenceCounts() {
      return {
        repos: await fixture.app.db.getRepository('lightExtensionRepos').count(),
        vscRepos: await fixture.app.db.getRepository('vscFileRepositories').count(),
        entries: await fixture.app.db.getRepository('lightExtensionEntries').count(),
        remotes: await fixture.app.db.getRepository('vscFileRemotes').count(),
        maps: await fixture.app.db.getRepository('vscFileExternalCommitMaps').count(),
        jobs: await fixture.app.db.getRepository('vscFileSyncJobs').count(),
      };
    }
  });

  it('pulls and compiles an immutable remote snapshot while a later branch advance remains remote-ahead', async () => {
    const created = await fixture.createFromRemote('Immutable Pull');
    const planned = fixture.adapter.advanceRemote(validGitSyncFiles('Pulled revision'));
    const input = await fixture.createPullInput(created.repo.id);
    const fetchSnapshot = fixture.adapter.fetchSnapshot.bind(fixture.adapter);
    vi.spyOn(fixture.adapter, 'fetchSnapshot').mockImplementationOnce(async (target, expectedRevision) => {
      const fetched = await fetchSnapshot(target, expectedRevision);
      fixture.adapter.advanceRemote(validGitSyncFiles('Later revision'));
      return fetched;
    });

    const pulled = await fixture.pullService.pull(input, { requestId: 'git-sync-immutable-pull' });
    const internal = await fixture.repoService.getInternalRepo(created.repo.id);
    const remote = await fixture.runtime.getRemote(internal.vscRepoId, 'origin');
    const nextPlan = await fixture.runtime.planRemote(remote?.id as string);
    const entry = await fixture.app.db.getRepository('lightExtensionEntries').findOne({
      filter: { repoId: created.repo.id, entryName: 'sales-kpi' },
    });

    expect(pulled).toMatchObject({ changed: true, compile: { status: 'success' } });
    expect(entry?.get('runtimeArtifact')).toMatchObject({ code: expect.stringContaining('Pulled revision') });
    await expect(
      fixture.app.db.getRepository('vscFileExternalCommitMaps').findOne({
        filter: { remoteId: remote?.id, remoteTargetVersion: remote?.version },
        sort: ['-createdAt'],
      }),
    ).resolves.toMatchObject({ remoteRevision: planned.revision, localCommitId: pulled.commitId });
    expect(nextPlan).toMatchObject({ state: 'remote-ahead', action: 'pull' });
  });

  it('records diverged state without changing local source or runtime artifacts', async () => {
    const created = await fixture.createFromRemote('Diverged Source');
    const local = await fixture.runtimeCompileService.saveSource({
      repoId: created.repo.id,
      expectedHeadCommitId: created.repo.headCommitId,
      message: 'local source change',
      files: [{ path: 'src/shared/local.ts', content: 'export const local = true;\n' }],
    });
    const entryBefore = await fixture.app.db.getRepository('lightExtensionEntries').findOne({
      filter: { repoId: created.repo.id, entryName: 'sales-kpi' },
    });
    fixture.adapter.advanceRemote(validGitSyncFiles('Remote divergence'));
    const input = await fixture.createPullInput(created.repo.id);

    await expect(fixture.pullService.pull(input)).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_SYNC_DIVERGED' });
    await expect(fixture.repoService.getRepo(created.repo.id)).resolves.toMatchObject({
      headCommitId: local.repo.headCommitId,
    });
    const entryAfter = await fixture.app.db.getRepository('lightExtensionEntries').findOne({
      filter: { repoId: created.repo.id, entryName: 'sales-kpi' },
    });
    expect(entryAfter?.get('artifactHash')).toBe(entryBefore?.get('artifactHash'));
    await expect(fixture.app.db.getRepository('vscFileConflicts').findOne()).resolves.toMatchObject({
      status: 'open',
      reasonCode: 'both-content-changed',
    });
  });

  it('reports initial-ambiguous when binding an existing non-empty repo and writes neither side', async () => {
    const localFiles = validGitSyncFiles('Existing local source');
    const repo = await fixture.repoService.createRepo({ name: 'Existing Ambiguous', initialFiles: localFiles });
    const internal = await fixture.repoService.getInternalRepo(repo.id);
    const remoteBefore = fixture.adapter.getSnapshot();
    const countsBefore = {
      maps: await fixture.app.db.getRepository('vscFileExternalCommitMaps').count(),
      jobs: await fixture.app.db.getRepository('vscFileSyncJobs').count(),
      conflicts: await fixture.app.db.getRepository('vscFileConflicts').count(),
    };
    const remote = await fixture.runtime.configureRemote({
      repoId: internal.vscRepoId,
      name: 'origin',
      provider: 'git',
      config: gitSyncRemoteConfig,
      authRef: null,
    });

    const plan = await fixture.runtime.planRemote(remote.id);

    expect(plan).toMatchObject({ state: 'diverged', action: 'conflict', reasonCode: 'initial-ambiguous' });
    await expect(fixture.repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: repo.headCommitId });
    expect(fixture.adapter.getSnapshot()).toEqual(remoteBefore);
    await expect(fixture.app.db.getRepository('vscFileExternalCommitMaps').count()).resolves.toBe(countsBefore.maps);
    await expect(fixture.app.db.getRepository('vscFileSyncJobs').count()).resolves.toBe(countsBefore.jobs);
    await expect(fixture.app.db.getRepository('vscFileConflicts').count()).resolves.toBe(countsBefore.conflicts);
  });
});

const execFileAsync = promisify(execFile);

class CredentialGatedLocalGitRunner implements GitCommandExecutor {
  readonly requests: GitCommandRequest[] = [];

  constructor(
    private readonly remotes: ReadonlyMap<string, string>,
    private readonly expectedPassword: string,
  ) {}

  async run(request: GitCommandRequest): Promise<GitCommandResult> {
    this.requests.push(request);
    if (
      request.remoteUrl &&
      (request.credential?.kind !== 'https' || request.credential.password !== this.expectedPassword)
    ) {
      throw new RemoteSyncError('AUTH_FAILED', 'Private Git repository authentication failed', {
        details: { provider: 'git', reasonCode: 'private-repository-auth-required' },
      });
    }
    return runGitProcess(
      request.args.map((argument) => this.remotes.get(argument) || argument),
      request,
    );
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
      resolve({
        exitCode: exitCode ?? -1,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
        durationMs: Date.now() - startedAt,
      });
    });
    child.stdin.end(request.stdin);
  });
}

async function seedGitRemote(remoteDirectory: string): Promise<void> {
  const workingDirectory = `${remoteDirectory}-working`;
  await git(['init', '--bare', remoteDirectory]);
  await git(['init', workingDirectory]);
  await git(['-C', workingDirectory, 'config', 'user.name', 'Test']);
  await git(['-C', workingDirectory, 'config', 'user.email', 'test@example.com']);
  for (const file of validGitSyncFiles()) {
    const targetPath = path.join(workingDirectory, file.path);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, file.content);
  }
  await git(['-C', workingDirectory, 'add', '.']);
  await git(['-C', workingDirectory, 'commit', '-m', 'seed']);
  await git(['-C', workingDirectory, 'branch', '-M', 'main']);
  await git(['-C', workingDirectory, 'push', remoteDirectory, 'main']);
  await git(['--git-dir', remoteDirectory, 'symbolic-ref', 'HEAD', 'refs/heads/main']);
}

function git(args: readonly string[]) {
  return execFileAsync('git', [...args], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
}

function createSecretDatabase(records: Record<string, string>): Database {
  return {
    hasCollection: (name: string) => name === 'environmentVariables',
    getRepository: () => ({
      collection: { existsInDb: async () => true },
      findOne: async (options: { filterByTk?: string }) => {
        const name = options.filterByTk;
        const type = name ? records[name] : undefined;
        return name && type ? { get: (field: string) => (field === 'name' ? name : type) } : null;
      },
    }),
  } as unknown as Database;
}
