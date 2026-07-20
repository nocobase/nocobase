/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscRemoteSnapshotFile } from '../vsc-file';
import { VscPermissionHookRegistry } from '../vsc-file';
import { createMockServer, type MockServer } from '@nocobase/test';
import { vi } from 'vitest';

import { ExternalCommitMapStore } from '../vsc-file/remotes/ExternalCommitMapStore';
import { RemoteSyncAdapterRegistry } from '../vsc-file/remotes/RemoteSyncAdapterRegistry';
import { RemoteStore } from '../vsc-file/remotes/RemoteStore';
import { SyncStatePlanner } from '../vsc-file/remotes/SyncStatePlanner';
import { DeterministicRemoteAdapter } from '../vsc-file/remotes/testing/DeterministicRemoteAdapter';
import { VscRemotePullDiscoveryService } from '../vsc-file/remotes/VscRemotePullDiscoveryService';
import { loadVscSnapshot } from '../vsc-file/remotes/VscRemotePushService';
import { CommitService } from '../vsc-file/services/CommitService';
import { TreeService } from '../vsc-file/services/TreeService';
import PluginLightExtensionServer from '../plugin';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionEntryService } from '../services/LightExtensionEntryService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionRemotePullService } from '../services/LightExtensionRemotePullService';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';
import { ReferenceService } from '../services/ReferenceService';

const remoteConfig = {
  owner: 'nocobase',
  repository: 'extensions',
  branch: 'main',
  subdirectory: null,
};

describe('LightExtensionRemotePullService', () => {
  let app: MockServer;
  let repoService: LightExtensionRepoService;
  let fileService: LightExtensionFileService;
  let runtimeCompileService: LightExtensionRuntimeCompileService;
  let remotePullService: LightExtensionRemotePullService;
  let remoteStore: RemoteStore;
  let mapStore: ExternalCommitMapStore;
  let adapter: DeterministicRemoteAdapter;
  let registry: RemoteSyncAdapterRegistry;
  let discovery: VscRemotePullDiscoveryService;

  beforeEach(async () => {
    app = await createMockServer({ plugins: [PluginLightExtensionServer] });
    const auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    const permissionHooks = new VscPermissionHookRegistry();
    permissionHooks.register(permissionService.createVscPermissionHook());
    const validator = new LightExtensionValidator();
    repoService = new LightExtensionRepoService(app.db, auditService, permissionService, permissionHooks, validator);
    fileService = new LightExtensionFileService(
      app.db,
      auditService,
      permissionService,
      repoService,
      permissionHooks,
      validator,
    );
    const entryService = new LightExtensionEntryService(app.db, fileService, repoService, validator);
    const compilerBridge = new LightExtensionWorkspaceCompilerBridge(auditService, permissionService);
    runtimeCompileService = new LightExtensionRuntimeCompileService(app.db, fileService, entryService, compilerBridge);
    const referenceService = new ReferenceService(app.db, auditService, permissionService);
    runtimeCompileService.useReferenceService(referenceService);
    adapter = new DeterministicRemoteAdapter({ initialRevision: 'remote-base', initialFiles: baselineFiles() });
    registry = new RemoteSyncAdapterRegistry();
    registry.register(adapter);
    remoteStore = new RemoteStore(app.db);
    mapStore = new ExternalCommitMapStore(app.db);
    discovery = new VscRemotePullDiscoveryService(app.db, {
      adapterRegistry: registry,
      permissionHooks,
    });
    remotePullService = new LightExtensionRemotePullService(
      permissionService,
      repoService,
      runtimeCompileService,
      discovery,
    );
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('applies remote-ahead source as one commit and compiles runtime before finalizing the map', async () => {
    const setup = await createMappedRepo('Remote Ahead');
    adapter.advanceRemote(updatedFiles('Pulled runtime'));
    const input = await createPullInput(setup.repo.id, setup.remote.id);
    const commitsBefore = await app.db.getRepository('vscFileCommits').count({
      filter: { repoId: setup.internal.vscRepoId },
    });

    const result = await remotePullService.pull(input, { actorUserId: 'user-1', requestId: 'req_pull_success' });

    expect(result).toMatchObject({
      changed: true,
      plan: { state: 'remote-ahead', action: 'pull' },
      compile: { status: 'success' },
    });
    expect(JSON.stringify(result)).not.toMatch(/authRef|claimToken|leaseOwner|leaseExpiresAt|Pulled runtime/u);
    await expect(
      app.db.getRepository('vscFileCommits').count({ filter: { repoId: setup.internal.vscRepoId } }),
    ).resolves.toBe(commitsBefore + 1);
    const entry = await app.db.getRepository('lightExtensionEntries').findOne({
      filter: { repoId: setup.repo.id, entryName: 'sales-kpi' },
    });
    expect(entry).toMatchObject({ compiledCommitId: result.commitId });
    expect(entry?.get('runtimeArtifact')).toMatchObject({ code: expect.stringContaining('Pulled runtime') });
    await expect(mapStore.findLatest(setup.remote.id)).resolves.toMatchObject({
      localCommitId: result.commitId,
      remoteRevision: adapter.getSnapshot().revision,
      contentHash: adapter.getSnapshot().contentHash,
    });
  });

  it('rolls back Head, entries, artifacts, references, and map when compile fails', async () => {
    const setup = await createMappedRepo('Compile Rollback');
    await compileInitial(setup.repo.id);
    const headBefore = (await repoService.getRepo(setup.repo.id)).headCommitId;
    const entryBefore = await app.db.getRepository('lightExtensionEntries').findOne({
      filter: { repoId: setup.repo.id, entryName: 'sales-kpi' },
    });
    const artifactBefore = entryBefore?.get('artifactHash');
    const artifactCountBefore = await app.db.getRepository('lightExtensionRuntimeArtifacts').count();
    const mapBefore = await mapStore.findLatest(setup.remote.id);
    if (!mapBefore) {
      throw new Error('Expected baseline external commit map');
    }
    adapter.advanceRemote([
      {
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
        content: "import Missing from './missing';\nctx.render(<Missing />);\n",
        language: 'typescript',
      },
      baselineFiles()[1],
    ]);
    const input = await createPullInput(setup.repo.id, setup.remote.id);

    await expect(remotePullService.pull(input, { requestId: 'req_compile_rollback' })).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
    });

    await expect(repoService.getRepo(setup.repo.id)).resolves.toMatchObject({ headCommitId: headBefore });
    const entryAfter = await app.db.getRepository('lightExtensionEntries').findOne({
      filter: { repoId: setup.repo.id, entryName: 'sales-kpi' },
    });
    expect(entryAfter?.get('artifactHash')).toBe(artifactBefore);
    await expect(app.db.getRepository('lightExtensionRuntimeArtifacts').count()).resolves.toBe(artifactCountBefore);
    await expect(mapStore.findLatest(setup.remote.id)).resolves.toMatchObject(mapBefore);
    await expect(app.db.getRepository('vscFileSyncJobs').findOne({ sort: ['-createdAt'] })).resolves.toMatchObject({
      status: 'failed',
      lastErrorCode: 'UNSAFE_CONTENT',
    });
  });

  it('rejects archived repositories before remote network work', async () => {
    const setup = await createMappedRepo('Archived Pull');
    await repoService.archiveRepo({ repoId: setup.repo.id });
    adapter.advanceRemote(updatedFiles('Must not fetch'));
    const fetch = vi.spyOn(adapter, 'fetchSnapshot');
    const input = await createPullInput(setup.repo.id, setup.remote.id, setup.repo.headCommitId);

    await expect(remotePullService.pull(input)).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_REPO_ARCHIVED' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects a cross-repository remote before its credential or adapter can be used', async () => {
    const first = await createMappedRepo('First Repo');
    const second = await repoService.createRepo({ name: 'Second Repo', initialFiles: baselineFiles() });
    const fetch = vi.spyOn(adapter, 'fetchSnapshot');
    const input = await createPullInput(second.id, first.remote.id, second.headCommitId);

    await expect(remotePullService.pull(input)).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
      details: { sourceCode: 'PERMISSION_DENIED', reasonCode: 'remote-repository-mismatch' },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('replaces and compiles a 150-file complete snapshot in one local commit', async () => {
    const setup = await createMappedRepo('Large Pull');
    adapter.advanceRemote(largeSnapshotFiles(150));
    const input = await createPullInput(setup.repo.id, setup.remote.id);
    const commitsBefore = await app.db.getRepository('vscFileCommits').count({
      filter: { repoId: setup.internal.vscRepoId },
    });

    const result = await remotePullService.pull(input, { requestId: 'req_large_pull' });

    expect(result).toMatchObject({ changed: true, compile: { status: 'success' } });
    const pulled = await fileService.pull({ repoId: setup.repo.id, includeContent: 'all' });
    expect(pulled.files).toHaveLength(150);
    await expect(
      app.db.getRepository('vscFileCommits').count({ filter: { repoId: setup.internal.vscRepoId } }),
    ).resolves.toBe(commitsBefore + 1);
  });

  it('rejects a 201-file complete snapshot without changing the local Head', async () => {
    const setup = await createMappedRepo('Oversized Pull');
    adapter.advanceRemote(largeSnapshotFiles(201));
    const input = await createPullInput(setup.repo.id, setup.remote.id);

    await expect(remotePullService.pull(input, { requestId: 'req_oversized_pull' })).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'repo_file_count_exceeded' })]),
      },
    });
    await expect(repoService.getRepo(setup.repo.id)).resolves.toMatchObject({
      headCommitId: setup.repo.headCommitId,
    });
  });

  it('retries a completed pull without fetching or creating an empty commit', async () => {
    const setup = await createMappedRepo('Completed Retry');
    adapter.advanceRemote(updatedFiles('Retry runtime'));
    const input = await createPullInput(setup.repo.id, setup.remote.id);
    const commitsBefore = await app.db.getRepository('vscFileCommits').count({
      filter: { repoId: setup.internal.vscRepoId },
    });
    const fetch = vi.spyOn(adapter, 'fetchSnapshot');

    const first = await remotePullService.pull(input, { requestId: 'req_retry_first' });
    const fetchCount = fetch.mock.calls.length;
    const retried = await remotePullService.pull(input, { requestId: 'req_retry_second' });

    expect(retried).toMatchObject({
      changed: false,
      commitId: first.commitId,
      plan: { state: 'in-sync', action: 'noop' },
      compile: null,
    });
    expect(fetch).toHaveBeenCalledTimes(fetchCount);
    await expect(
      app.db.getRepository('vscFileCommits').count({ filter: { repoId: setup.internal.vscRepoId } }),
    ).resolves.toBe(commitsBefore + 1);
  });

  it('keeps the public incremental saveSource limit at 100 files', async () => {
    const setup = await createMappedRepo('Public Limit');
    const files = Array.from({ length: 101 }, (_, index) => ({
      path: `src/shared/public-${String(index).padStart(3, '0')}.ts`,
      content: `export const value${index} = ${index};\n`,
      language: 'typescript',
    }));

    await expect(
      runtimeCompileService.saveSource({
        repoId: setup.repo.id,
        expectedHeadCommitId: setup.repo.headCommitId,
        message: 'too many public changes',
        files,
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      details: { diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'sync_batch_too_large' })]) },
    });
  });

  async function createMappedRepo(name: string) {
    const repo = await repoService.createRepo({ name, initialFiles: baselineFiles() });
    const internal = await repoService.getInternalRepo(repo.id);
    const remote = await remoteStore.create({
      repoId: internal.vscRepoId,
      name: 'origin',
      provider: 'github',
      config: remoteConfig,
      authRef: null,
    });
    const snapshot = adapter.getSnapshot();
    await mapStore.record({
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      localCommitId: repo.headCommitId as string,
      remoteRevision: snapshot.revision as string,
      contentHash: snapshot.contentHash,
    });
    return { repo, internal, remote };
  }

  async function createPullInput(repoId: string, remoteId: string, expectedHead?: string | null) {
    const repo = await repoService.getInternalRepo(repoId);
    const headCommitId = expectedHead === undefined ? repo.headCommitId : expectedHead;
    const remote = await remoteStore.get(remoteId);
    const localSnapshot = await loadVscSnapshot(
      app.db,
      new CommitService(app.db),
      new TreeService(app.db),
      repo.vscRepoId,
      headCommitId,
    );
    const remoteSnapshot = adapter.getSnapshot();
    const baseline = await mapStore.findLatest(remote.id);
    const plan = new SyncStatePlanner().plan({
      configured: true,
      remoteId: remote.id,
      provider: remote.provider,
      remoteTargetVersion: remote.version,
      direction: 'pull',
      capabilities: { canPull: true, canPush: true },
      local: { headCommitId, contentHash: localSnapshot.contentHash },
      remote: {
        revision: remoteSnapshot.revision,
        contentHash: remoteSnapshot.contentHash,
        contentHashKnown: true,
      },
      baseline: baseline
        ? {
            remoteTargetVersion: baseline.remoteTargetVersion,
            lastLocalCommitId: baseline.localCommitId,
            lastRemoteRevision: baseline.remoteRevision,
            lastSyncedContentHash: baseline.contentHash,
          }
        : null,
    });
    return {
      repoId,
      remoteId,
      expectedLocalCommitId: headCommitId,
      expectedRemoteRevision: remoteSnapshot.revision,
      expectedRemoteTargetVersion: remote.version,
      planFingerprint: plan.fingerprint,
    };
  }

  async function compileInitial(repoId: string) {
    const repo = await repoService.getRepo(repoId);
    return runtimeCompileService.compileCurrentRuntime(repoId, repo.headCommitId as string);
  }
});

function baselineFiles(): VscRemoteSnapshotFile[] {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: 'ctx.render(<div>Initial</div>);\n',
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/sales-kpi/entry.json',
      content: '{"schemaVersion":1,"key":"sales-kpi"}',
      language: 'json',
    },
  ];
}

function updatedFiles(label: string): VscRemoteSnapshotFile[] {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: `ctx.render(<div>${label}</div>);\n`,
      language: 'typescript',
    },
    baselineFiles()[1],
  ];
}

function largeSnapshotFiles(total: number): VscRemoteSnapshotFile[] {
  const sharedCount = total - 2;
  return [
    ...updatedFiles('Large pull'),
    ...Array.from({ length: sharedCount }, (_, index) => ({
      path: `src/shared/value-${String(index).padStart(3, '0')}.ts`,
      content: `export const value${index} = ${index};\n`,
      language: 'typescript',
    })),
  ];
}
