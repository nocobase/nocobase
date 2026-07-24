/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import {
  RemoteSyncAdapterRegistry,
  RemoteSyncError,
  RemoteSyncRuntimeService,
  VscPermissionHookRegistry,
} from '../vsc-file';
import { vi } from 'vitest';

import { GitHubRemoteAdapter } from '../vsc-file/remotes/providers/github/GitHubRemoteAdapter';
import type { GitHubApi } from '../vsc-file/remotes/providers/github/githubTypes';
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

  beforeEach(async () => {
    fixture = await createGitSyncAcceptanceFixture();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fixture?.close();
  });

  it('atomically creates credentialed and public Git sources with compiled entries, mappings, and jobs', async () => {
    const credentialedResult = await fixture.createFromRemote('Credentialed Git Source', '{{ $env.GITHUB_SYNC }}');
    const publicResult = await fixture.createFromRemote('Public Git Source');

    expect(fixture.validateCredential).toHaveBeenCalledTimes(2);
    expect(fixture.validateCredential).toHaveBeenNthCalledWith(1, '{{ $env.GITHUB_SYNC }}');
    expect(fixture.validateCredential).toHaveBeenNthCalledWith(2, '{{ $env.GITHUB_SYNC }}');
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
    const credential = 'github_pat_private_source_01234567890123456789';
    const authRef = '{{ $env.PRIVATE_GITHUB }}';
    const api = createPrivateGitHubApi(credential);
    const credentialResolver = new RemoteCredentialResolver({
      db: createSecretDatabase({ PRIVATE_GITHUB: 'secret' }),
      environment: { getVariables: () => ({ PRIVATE_GITHUB: credential }) },
    });
    const registry = new RemoteSyncAdapterRegistry();
    registry.register(new GitHubRemoteAdapter({ api, credentialResolver }));
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
        provider: 'github',
        config: gitSyncRemoteConfig,
        authRef: null,
      }),
    ).rejects.toMatchObject({ code: 'AUTH_FAILED' });
    await expect(persistenceCounts()).resolves.toEqual(countsBefore);
    expect(vi.mocked(api.getRepository).mock.calls[0]?.at(-1)).toBeNull();
    vi.mocked(api.getRepository).mockClear();
    vi.mocked(api.getRef).mockClear();
    vi.mocked(api.getCommit).mockClear();
    vi.mocked(api.getTree).mockClear();
    vi.mocked(api.getBlob).mockClear();

    const created = await service.create({
      name: 'Authenticated Private Source',
      provider: 'github',
      config: gitSyncRemoteConfig,
      authRef,
    });

    expect(created).toMatchObject({
      repo: { healthStatus: 'ready' },
      remote: { authRef },
      revision: 'private-commit',
      plan: { state: 'in-sync' },
    });
    for (const call of [
      ...vi.mocked(api.getRepository).mock.calls,
      ...vi.mocked(api.getRef).mock.calls,
      ...vi.mocked(api.getCommit).mock.calls,
      ...vi.mocked(api.getTree).mock.calls,
      ...vi.mocked(api.getBlob).mock.calls,
    ]) {
      expect(call.at(-1)).toBe(credential);
    }

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
      provider: 'github',
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

function createPrivateGitHubApi(expectedCredential: string): GitHubApi {
  const files = new Map(validGitSyncFiles().map((file, index) => [`blob-${index}`, file]));
  const requireCredential = (credential: string | null) => {
    if (credential !== expectedCredential) {
      throw new RemoteSyncError('AUTH_FAILED', 'Private GitHub repository authentication failed', {
        details: { provider: 'github', reasonCode: 'private-repository-auth-required' },
      });
    }
  };
  return {
    getRepository: vi.fn(async (_owner, _repository, credential) => {
      requireCredential(credential);
      return { default_branch: 'main', private: true, archived: false };
    }),
    getRef: vi.fn(async (_owner, _repository, _branch, credential) => {
      requireCredential(credential);
      return { ref: 'refs/heads/main', object: { type: 'commit', sha: 'private-commit' } };
    }),
    getCommit: vi.fn(async (_owner, _repository, _sha, credential) => {
      requireCredential(credential);
      return { sha: 'private-commit', tree: { sha: 'private-tree' } };
    }),
    getTree: vi.fn(async (_owner, _repository, _sha, _recursive, credential) => {
      requireCredential(credential);
      return {
        sha: 'private-tree',
        truncated: false,
        tree: [...files].map(([sha, file]) => ({
          path: file.path,
          mode: '100644',
          type: 'blob' as const,
          sha,
          size: Buffer.byteLength(file.content),
        })),
      };
    }),
    getBlob: vi.fn(async (_owner, _repository, sha, credential) => {
      requireCredential(credential);
      const file = files.get(sha);
      if (!file) {
        throw new Error(`Unknown private blob ${sha}`);
      }
      return {
        sha,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64',
        size: Buffer.byteLength(file.content),
      };
    }),
    createBlob: vi.fn(async () => ({ sha: 'unused-blob' })),
    createTree: vi.fn(async () => ({ sha: 'unused-tree' })),
    createCommit: vi.fn(async () => ({ sha: 'unused-commit' })),
    updateRef: vi.fn(async () => undefined),
    createRef: vi.fn(async () => undefined),
  };
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
