/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, type Database } from '@nocobase/database';
import path from 'path';
import { vi } from 'vitest';

import type { VscFileRemoteRecord, VscRemoteSnapshot, VscRemoteSyncPlan } from '../../../shared/remote-sync-types';
import { VscPermissionHookRegistry } from '../../permissions';
import { CommitService } from '../../services/CommitService';
import { TreeService } from '../../services/TreeService';
import { VscFileService } from '../../services/VscFileService';
import { ExternalCommitMapStore } from '../ExternalCommitMapStore';
import { RemoteReconcileService } from '../RemoteReconcileService';
import { RemoteSyncError } from '../RemoteSyncAdapter';
import { RemoteSyncAdapterRegistry } from '../RemoteSyncAdapterRegistry';
import { RemoteStore } from '../RemoteStore';
import { SyncStatePlanner } from '../SyncStatePlanner';
import { DeterministicRemoteAdapter } from '../testing/DeterministicRemoteAdapter';
import { VscRemotePushService, loadVscSnapshot } from '../VscRemotePushService';

const remoteConfig = {
  owner: 'nocobase',
  repository: 'extensions',
  branch: 'main',
  subdirectory: null,
};

describe('VscRemotePushService', () => {
  let db: Database;
  let vsc: VscFileService;
  let adapter: DeterministicRemoteAdapter;
  let adapterRegistry: RemoteSyncAdapterRegistry;
  let remoteStore: RemoteStore;
  let mapStore: ExternalCommitMapStore;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({ directory: path.resolve(__dirname, '../../collections') });
    await db.sync();
    vsc = new VscFileService(db);
    adapter = new DeterministicRemoteAdapter({ initialRevision: null });
    adapterRegistry = new RemoteSyncAdapterRegistry();
    adapterRegistry.register(adapter);
    remoteStore = new RemoteStore(db);
    mapStore = new ExternalCommitMapStore(db);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db?.close();
  });

  it('publishes a pinned local snapshot and finalizes its durable mapping', async () => {
    const setup = await createLocalRemote('normal-push');
    const input = await createPushInput(setup.remote, setup.commitId);
    const result = await createPushService().push(input);

    expect(result).toMatchObject({ published: true, job: { status: 'succeeded', phase: 'finalized' } });
    expect(adapter.getPublishCount()).toBe(1);
    expect(adapter.getSnapshot().files).toEqual([
      expect.objectContaining({ path: 'README.md', content: '# normal-push\n' }),
    ]);
    await expect(mapStore.findLatest(setup.remote.id)).resolves.toMatchObject({
      localCommitId: setup.commitId,
      remoteRevision: result.job.resultRemoteRevision,
      contentHash: result.snapshot.contentHash,
    });
    await expect(remoteStore.get(setup.remote.id)).resolves.toMatchObject({
      lastErrorCode: null,
      lastSyncedAt: expect.any(String),
    });
  });

  it('uses provider CAS and never overwrites a remote advance', async () => {
    const setup = await createLocalRemote('cas-conflict');
    const input = await createPushInput(setup.remote, setup.commitId);
    const publish = adapter.publishSnapshot.bind(adapter);
    vi.spyOn(adapter, 'publishSnapshot').mockImplementationOnce(async (target, snapshot, expectedRevision) => {
      adapter.advanceRemote([{ path: 'third-party.txt', content: 'advanced\n' }]);
      return publish(target, snapshot, expectedRevision);
    });

    await expect(createPushService().push(input)).rejects.toMatchObject<RemoteSyncError>({ code: 'REMOTE_CHANGED' });
    expect(adapter.getSnapshot().files).toEqual([
      expect.objectContaining({ path: 'third-party.txt', content: 'advanced\n' }),
    ]);
    expect(adapter.getPublishCount()).toBe(0);
    await expect(mapStore.findLatest(setup.remote.id)).resolves.toBeNull();
    await expect(db.getRepository('vscFileSyncJobs').findOne()).resolves.toMatchObject({
      status: 'failed',
      lastErrorCode: 'REMOTE_CHANGED',
    });
  });

  it('records initial divergence instead of overwriting a non-empty remote', async () => {
    adapter = new DeterministicRemoteAdapter({
      initialRevision: 'remote-existing',
      initialFiles: [{ path: 'remote.txt', content: 'remote content\n' }],
    });
    adapterRegistry = new RemoteSyncAdapterRegistry();
    adapterRegistry.register(adapter);
    const setup = await createLocalRemote('initial-divergence');
    const input = await createPushInput(setup.remote, setup.commitId);

    await expect(createPushService().push(input)).rejects.toMatchObject({
      code: 'DIVERGED',
      details: { reasonCode: 'initial-ambiguous' },
    });
    expect(adapter.getPublishCount()).toBe(0);
    await expect(db.getRepository('vscFileConflicts').findOne()).resolves.toMatchObject({
      reasonCode: 'initial-ambiguous',
      currentLocalCommitId: setup.commitId,
      currentRemoteRevision: 'remote-existing',
    });
  });

  it('marks finalization pending and reconciles without a second remote commit', async () => {
    const setup = await createLocalRemote('finalize-retry');
    const input = await createPushInput(setup.remote, setup.commitId);
    const failingMapStore = new ExternalCommitMapStore(db);
    const record = vi.spyOn(failingMapStore, 'record').mockRejectedValueOnce(new Error('injected finalize failure'));
    const pushService = createPushService({ mapStore: failingMapStore });

    await expect(pushService.push(input)).rejects.toMatchObject<RemoteSyncError>({
      code: 'REMOTE_UNAVAILABLE',
      details: { reasonCode: 'finalize-pending' },
    });
    const pending = await db.getRepository('vscFileSyncJobs').findOne();
    expect(pending).toMatchObject({ status: 'finalize-pending', phase: 'finalize-pending' });
    expect(adapter.getPublishCount()).toBe(1);

    record.mockRestore();
    const reconcile = new RemoteReconcileService(db, { adapterRegistry, mapStore: failingMapStore });
    const reconciled = await reconcile.reconcile(pending?.get('id') as string);
    expect(reconciled).toMatchObject({ decision: 'finalized', published: false, job: { status: 'succeeded' } });
    expect(adapter.getPublishCount()).toBe(1);
    await expect(mapStore.findLatest(setup.remote.id)).resolves.toMatchObject({ localCommitId: setup.commitId });
  });

  it('maps the pinned commit when local head advances during remote publication', async () => {
    const setup = await createLocalRemote('local-advance');
    const input = await createPushInput(setup.remote, setup.commitId);
    const publish = adapter.publishSnapshot.bind(adapter);
    let advancedCommitId: string | null = null;
    vi.spyOn(adapter, 'publishSnapshot').mockImplementationOnce(async (target, snapshot, expectedRevision) => {
      const advanced = await vsc.push({
        repoId: setup.repoId,
        baseCommitId: setup.commitId,
        message: 'advance local head',
        files: [{ path: 'next.txt', content: 'next\n' }],
      });
      advancedCommitId = advanced.commit.id;
      return publish(target, snapshot, expectedRevision);
    });

    const result = await createPushService().push(input);
    expect(advancedCommitId).not.toBeNull();
    await expect(mapStore.findLatest(setup.remote.id)).resolves.toMatchObject({ localCommitId: setup.commitId });
    expect(result.snapshot.files).toHaveLength(1);

    const nextSnapshot = await loadVscSnapshot(
      db,
      new CommitService(db),
      new TreeService(db),
      setup.repoId,
      advancedCommitId,
    );
    const baseline = await mapStore.findLatest(setup.remote.id);
    const nextPlan = new SyncStatePlanner().plan({
      configured: true,
      remoteId: setup.remote.id,
      provider: setup.remote.provider,
      remoteTargetVersion: setup.remote.version,
      direction: 'push',
      capabilities: { canPull: true, canPush: true },
      local: { headCommitId: advancedCommitId, contentHash: nextSnapshot.contentHash },
      remote: {
        revision: adapter.getSnapshot().revision,
        contentHash: adapter.getSnapshot().contentHash,
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
    expect(nextPlan).toMatchObject({ state: 'local-ahead', action: 'push', canPush: true });
  });

  it('repairs identical initial content without creating a remote commit', async () => {
    const files = [{ path: 'README.md', content: '# same-content\n' }];
    adapter = new DeterministicRemoteAdapter({ initialFiles: files, initialRevision: 'remote-existing' });
    adapterRegistry = new RemoteSyncAdapterRegistry();
    adapterRegistry.register(adapter);
    const setup = await createLocalRemote('same-content');
    const input = await createPushInput(setup.remote, setup.commitId);

    const result = await createPushService().push(input);
    expect(result).toMatchObject({ published: false, plan: { action: 'establish-mapping' } });
    expect(adapter.getPublishCount()).toBe(0);
    await expect(mapStore.findLatest(setup.remote.id)).resolves.toMatchObject({
      localCommitId: setup.commitId,
      remoteRevision: 'remote-existing',
    });
  });

  it('recovers an establish-mapping finalize failure without publishing', async () => {
    const files = [{ path: 'README.md', content: '# mapping-finalize\n' }];
    adapter = new DeterministicRemoteAdapter({ initialFiles: files, initialRevision: 'remote-existing' });
    adapterRegistry = new RemoteSyncAdapterRegistry();
    adapterRegistry.register(adapter);
    const setup = await createLocalRemote('mapping-finalize');
    const input = await createPushInput(setup.remote, setup.commitId);
    const failingMapStore = new ExternalCommitMapStore(db);
    const record = vi.spyOn(failingMapStore, 'record').mockRejectedValueOnce(new Error('injected mapping failure'));

    await expect(createPushService({ mapStore: failingMapStore }).push(input)).rejects.toMatchObject({
      code: 'REMOTE_UNAVAILABLE',
      details: { reasonCode: 'finalize-pending' },
    });
    expect(adapter.getPublishCount()).toBe(0);
    const pending = await db.getRepository('vscFileSyncJobs').findOne();
    expect(pending?.get('status')).toBe('finalize-pending');

    record.mockRestore();
    const result = await new RemoteReconcileService(db, { adapterRegistry, mapStore: failingMapStore }).reconcile(
      pending?.get('id') as string,
    );
    expect(result).toMatchObject({ decision: 'finalized', published: false, job: { status: 'succeeded' } });
    expect(adapter.getPublishCount()).toBe(0);
  });

  it('checks the owner permission hook before credential or network work', async () => {
    const setup = await createLocalRemote('permission-denied');
    const input = await createPushInput(setup.remote, setup.commitId);
    const permissionHooks = new VscPermissionHookRegistry();
    const permission = vi.fn(() => false);
    permissionHooks.register(permission);
    const fetch = vi.spyOn(adapter, 'fetchSnapshot');

    await expect(createPushService({ permissionHooks }).push(input, { authorId: 'user-1' })).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
    });
    expect(permission).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        action: 'push',
        repoId: setup.repoId,
        actionMetadata: { operation: 'remote-push', remoteId: setup.remote.id },
      }),
    );
    expect(fetch).not.toHaveBeenCalled();
    await expect(db.getRepository('vscFileSyncJobs').count()).resolves.toBe(0);
  });

  it('rejects archived repositories and stale target versions before network work', async () => {
    const setup = await createLocalRemote('guarded-push');
    const input = await createPushInput(setup.remote, setup.commitId);
    const fetch = vi.spyOn(adapter, 'fetchSnapshot');
    await vsc.archiveRepository({ repoId: setup.repoId });

    await expect(createPushService().push(input)).rejects.toMatchObject({ code: 'REPO_ARCHIVED' });
    await expect(createPushService().push({ ...input, expectedRemoteTargetVersion: 99 })).rejects.toMatchObject({
      code: 'REMOTE_CHANGED',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns sanitized remote errors without provider causes or credential values', async () => {
    const setup = await createLocalRemote('safe-error', '{{ $env.SAFE_REMOTE_SECRET }}');
    const input = await createPushInput(setup.remote, setup.commitId);
    adapter.setFailure(
      'fetch',
      new RemoteSyncError('REMOTE_UNAVAILABLE', 'Safe provider failure', {
        details: { provider: 'github', operation: 'fetch', reasonCode: 'provider-unavailable' },
      }),
    );

    let caught: unknown;
    try {
      await createPushService().push(input);
    } catch (error) {
      caught = error;
    }
    expect(caught).toMatchObject({ code: 'REMOTE_UNAVAILABLE', message: 'Safe provider failure' });
    expect(JSON.stringify(caught)).not.toMatch(/SAFE_REMOTE_SECRET|authorization|token|cause|response|request/i);
  });

  function createPushService(
    options: Partial<ConstructorParameters<typeof VscRemotePushService>[1]> = {},
  ): VscRemotePushService {
    return new VscRemotePushService(db, { adapterRegistry, ...options });
  }

  async function createLocalRemote(name: string, authRef: string | null = null) {
    const created = await vsc.createRepository({
      ownerType: 'plugin',
      ownerId: name,
      name: 'main',
      initialFiles: [{ path: 'README.md', content: `# ${name}\n` }],
    });
    if (!created.initialCommit) {
      throw new Error('Expected an initial commit');
    }
    const remote = await remoteStore.create({
      repoId: created.repository.id,
      name: 'origin',
      provider: 'github',
      config: remoteConfig,
      authRef,
    });
    return { repoId: created.repository.id, commitId: created.initialCommit.id, remote };
  }

  async function createPushInput(remote: VscFileRemoteRecord, commitId: string) {
    const localSnapshot = await loadVscSnapshot(
      db,
      new CommitService(db),
      new TreeService(db),
      remote.repoId,
      commitId,
    );
    const remoteSnapshot = adapter.getSnapshot();
    const plan = createPlan(remote, commitId, localSnapshot, remoteSnapshot);
    return {
      remoteId: remote.id,
      expectedLocalCommitId: commitId,
      expectedRemoteRevision: remoteSnapshot.revision,
      expectedRemoteTargetVersion: remote.version,
      planFingerprint: plan.fingerprint,
    };
  }

  function createPlan(
    remote: VscFileRemoteRecord,
    commitId: string,
    localSnapshot: VscRemoteSnapshot,
    remoteSnapshot: VscRemoteSnapshot,
  ): VscRemoteSyncPlan {
    return new SyncStatePlanner().plan({
      configured: true,
      remoteId: remote.id,
      provider: remote.provider,
      remoteTargetVersion: remote.version,
      direction: 'push',
      capabilities: { canPull: true, canPush: true },
      local: { headCommitId: commitId, contentHash: localSnapshot.contentHash },
      remote: {
        revision: remoteSnapshot.revision,
        contentHash: remoteSnapshot.contentHash,
        contentHashKnown: true,
      },
      baseline: null,
    });
  }
});
