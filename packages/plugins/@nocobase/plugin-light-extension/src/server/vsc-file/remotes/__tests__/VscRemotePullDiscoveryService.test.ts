/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, type Database, type Transaction } from '@nocobase/database';
import path from 'path';
import { vi } from 'vitest';

import type { VscFileRemoteRecord, VscRemoteSnapshot } from '../../../../shared/vsc-file/remote-sync-types';
import { VscPermissionHookRegistry } from '../../permissions';
import { CommitService } from '../../services/CommitService';
import { TreeService } from '../../services/TreeService';
import { VscFileService } from '../../services/VscFileService';
import { ExternalCommitMapStore } from '../ExternalCommitMapStore';
import { RemoteSyncError } from '../RemoteSyncAdapter';
import { RemoteSyncAdapterRegistry } from '../RemoteSyncAdapterRegistry';
import { RemoteStore } from '../RemoteStore';
import { SyncJobStore } from '../SyncJobStore';
import { SyncStatePlanner } from '../SyncStatePlanner';
import { DeterministicRemoteAdapter } from '../testing/DeterministicRemoteAdapter';
import { VscRemotePullDiscoveryService } from '../VscRemotePullDiscoveryService';
import { loadVscSnapshot } from '../VscRemotePushService';

const remoteConfig = {
  owner: 'nocobase',
  repository: 'extensions',
  branch: 'main',
  subdirectory: null,
};

describe('VscRemotePullDiscoveryService', () => {
  let db: Database;
  let vsc: VscFileService;
  let adapter: DeterministicRemoteAdapter;
  let registry: RemoteSyncAdapterRegistry;
  let remoteStore: RemoteStore;
  let mapStore: ExternalCommitMapStore;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({ directory: path.resolve(__dirname, '../../collections') });
    await db.sync();
    vsc = new VscFileService(db);
    adapter = new DeterministicRemoteAdapter({
      initialRevision: 'remote-base',
      initialFiles: [{ path: 'README.md', content: '# base\n' }],
    });
    registry = new RemoteSyncAdapterRegistry();
    registry.register(adapter);
    remoteStore = new RemoteStore(db);
    mapStore = new ExternalCommitMapStore(db);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db?.close();
  });

  it('discovers a pinned remote-ahead snapshot and atomically finalizes owner apply', async () => {
    const setup = await createMappedRemote('remote-ahead');
    adapter.advanceRemote([{ path: 'README.md', content: '# remote next\n' }]);
    const input = await createPullInput(setup.remote, setup.commitId);
    const discovery = await createService().discover(input);

    expect(discovery).toMatchObject({
      applyRequired: true,
      plan: { state: 'remote-ahead', action: 'pull', canPull: true },
      job: { status: 'running', phase: 'remote-succeeded' },
    });
    expect(discovery.handle?.snapshot.revision).toBe(adapter.getSnapshot().revision);

    const applied = await createService().apply(requireHandle(discovery.handle), {
      lockOwner: async () => setup.repoId,
      applyOwnerSnapshot: async (transaction) => {
        const result = await vsc.push(
          {
            repoId: setup.repoId,
            baseCommitId: setup.commitId,
            message: 'apply remote snapshot',
            files: [{ path: 'README.md', content: '# remote next\n' }],
          },
          { transaction },
        );
        return {
          localCommitId: result.commit.id,
          contentHash: discovery.snapshot.contentHash,
        };
      },
    });

    expect(applied.job).toMatchObject({ status: 'succeeded', phase: 'finalized' });
    await expect(mapStore.findLatest(setup.remote.id)).resolves.toMatchObject({
      localCommitId: applied.result.localCommitId,
      remoteRevision: discovery.snapshot.revision,
      contentHash: discovery.snapshot.contentHash,
    });
  });

  it('records diverged state without invoking an owner apply', async () => {
    const setup = await createMappedRemote('diverged');
    const local = await vsc.push({
      repoId: setup.repoId,
      baseCommitId: setup.commitId,
      message: 'local change',
      files: [{ path: 'local.txt', content: 'local\n' }],
    });
    adapter.advanceRemote([{ path: 'README.md', content: '# remote changed\n' }]);
    const input = await createPullInput(setup.remote, local.commit.id);

    await expect(createService().discover(input)).rejects.toMatchObject<RemoteSyncError>({ code: 'DIVERGED' });
    await expect(db.getRepository('vscFileConflicts').findOne()).resolves.toMatchObject({
      reasonCode: 'both-content-changed',
      currentLocalCommitId: local.commit.id,
      currentRemoteRevision: adapter.getSnapshot().revision,
    });
    await expect(db.getRepository('vscFileSyncJobs').findOne()).resolves.toMatchObject({
      status: 'failed',
      lastErrorCode: 'DIVERGED',
    });
  });

  it('repairs identical content without creating a local commit', async () => {
    const created = await vsc.createRepository({
      ownerType: 'plugin',
      ownerId: 'identical',
      name: 'main',
      initialFiles: [{ path: 'README.md', content: '# base\n' }],
    });
    const remote = await remoteStore.create({
      repoId: created.repository.id,
      name: 'origin',
      provider: 'github',
      config: remoteConfig,
      authRef: null,
    });
    const commitId = created.initialCommit?.id as string;
    const input = await createPullInput(remote, commitId);
    const commitCount = await db.getRepository('vscFileCommits').count();

    const result = await createService().discover(input);

    expect(result).toMatchObject({ applyRequired: false, plan: { action: 'establish-mapping' } });
    await expect(db.getRepository('vscFileCommits').count()).resolves.toBe(commitCount);
    await expect(mapStore.findLatest(remote.id)).resolves.toMatchObject({
      localCommitId: commitId,
      remoteRevision: 'remote-base',
    });
  });

  it('finishes a local-ahead pull as a safe no-apply without opening a conflict', async () => {
    const setup = await createMappedRemote('local-ahead');
    const local = await vsc.push({
      repoId: setup.repoId,
      baseCommitId: setup.commitId,
      message: 'local only change',
      files: [{ path: 'local.txt', content: 'local only\n' }],
    });
    const input = await createPullInput(setup.remote, local.commit.id);
    const service = createService();
    const fetch = vi.spyOn(adapter, 'fetchSnapshot');

    const result = await service.discover(input);

    expect(result).toMatchObject({
      applyRequired: false,
      plan: { state: 'local-ahead', action: 'push' },
      job: { status: 'succeeded' },
    });
    await expect(db.getRepository('vscFileConflicts').count()).resolves.toBe(0);
    await expect(mapStore.findLatest(setup.remote.id)).resolves.toMatchObject({ localCommitId: setup.commitId });

    const fetchCount = fetch.mock.calls.length;
    const retried = await service.discover(input);

    expect(retried).toMatchObject({
      applyRequired: false,
      job: { id: result.job.id, status: 'succeeded' },
      plan: { state: 'local-ahead', action: 'push' },
      snapshot: { revision: adapter.getSnapshot().revision },
    });
    expect(fetch).toHaveBeenCalledTimes(fetchCount);
  });

  it('fetches the exact planned revision when the branch advances before pull', async () => {
    const setup = await createMappedRemote('advanced-before-fetch');
    const input = await createPullInput(setup.remote, setup.commitId);
    const plannedRevision = input.expectedRemoteRevision;
    const advanced = adapter.advanceRemote([{ path: 'README.md', content: '# newer than plan\n' }]);

    const result = await createService().discover(input);

    expect(result).toMatchObject({
      applyRequired: false,
      snapshot: { revision: plannedRevision },
      plan: { state: 'in-sync', action: 'noop' },
    });
    expect(advanced.revision).not.toBe(plannedRevision);
    await expect(db.getRepository('vscFileConflicts').count()).resolves.toBe(0);
  });

  it('fails a fresh stale plan without persisting a manual conflict when an adapter returns another revision', async () => {
    const setup = await createMappedRemote('adapter-revision-mismatch');
    const input = await createPullInput(setup.remote, setup.commitId);
    adapter.advanceRemote([{ path: 'README.md', content: '# newer than plan\n' }]);
    const fetchCurrent = adapter.fetchSnapshot.bind(adapter);
    vi.spyOn(adapter, 'fetchSnapshot').mockImplementationOnce((target) => fetchCurrent(target));

    await expect(createService().discover(input)).rejects.toMatchObject({
      code: 'REMOTE_CHANGED',
      details: { reasonCode: 'remote-changed-before-pull' },
    });
    await expect(db.getRepository('vscFileConflicts').count()).resolves.toBe(0);
  });

  it('rejects apply when local Head advances during fetch', async () => {
    const setup = await createMappedRemote('local-advance');
    adapter.advanceRemote([{ path: 'README.md', content: '# remote next\n' }]);
    const input = await createPullInput(setup.remote, setup.commitId);
    const fetch = adapter.fetchSnapshot.bind(adapter);
    vi.spyOn(adapter, 'fetchSnapshot').mockImplementationOnce(async (target) => {
      await vsc.push({
        repoId: setup.repoId,
        baseCommitId: setup.commitId,
        message: 'concurrent local write',
        files: [{ path: 'local.txt', content: 'new local\n' }],
      });
      return fetch(target);
    });
    const discovery = await createService().discover(input);
    const ownerApply = vi.fn(async (_transaction: Transaction) => ({
      localCommitId: 'must-not-apply',
      contentHash: discovery.snapshot.contentHash,
    }));

    await expect(
      createService().apply(requireHandle(discovery.handle), {
        lockOwner: async () => setup.repoId,
        applyOwnerSnapshot: ownerApply,
      }),
    ).rejects.toMatchObject({ code: 'LOCAL_OUTDATED' });
    expect(ownerApply).not.toHaveBeenCalled();
  });

  it('returns the completed idempotent pull after local Head advances without fetching again', async () => {
    const setup = await createMappedRemote('completed-retry');
    adapter.advanceRemote([{ path: 'README.md', content: '# remote applied\n' }]);
    const input = await createPullInput(setup.remote, setup.commitId);
    const service = createService();
    const fetch = vi.spyOn(adapter, 'fetchSnapshot');
    const discovery = await service.discover(input);
    const applied = await service.apply(requireHandle(discovery.handle), {
      lockOwner: async () => setup.repoId,
      applyOwnerSnapshot: async (transaction) => {
        const push = await vsc.push(
          {
            repoId: setup.repoId,
            baseCommitId: setup.commitId,
            message: 'apply completed retry base',
            files: [{ path: 'README.md', content: '# remote applied\n' }],
          },
          { transaction },
        );
        return { localCommitId: push.commit.id, contentHash: discovery.snapshot.contentHash };
      },
    });
    await vsc.push({
      repoId: setup.repoId,
      baseCommitId: applied.result.localCommitId,
      message: 'advance after completed pull',
      files: [{ path: 'later.txt', content: 'later\n' }],
    });
    const fetchCount = fetch.mock.calls.length;

    const retried = await service.discover(input);

    expect(retried).toMatchObject({
      applyRequired: false,
      job: { status: 'succeeded' },
      plan: { state: 'local-ahead', action: 'push' },
    });
    expect(retried.job.id).toBe(applied.job.id);
    expect(retried.snapshot.contentHash).toBe(discovery.snapshot.contentHash);
    expect(fetch).toHaveBeenCalledTimes(fetchCount);
  });

  it('extends the claim for owner apply beyond the initial discovery lease', async () => {
    const setup = await createMappedRemote('apply-lease');
    adapter.advanceRemote([{ path: 'README.md', content: '# slow apply\n' }]);
    const input = await createPullInput(setup.remote, setup.commitId);
    const service = createService({ leaseDurationMs: 30, applyLeaseDurationMs: 500 });
    const discovery = await service.discover(input, { leaseDurationMs: 30 });

    const result = await service.apply(requireHandle(discovery.handle), {
      lockOwner: async () => setup.repoId,
      applyOwnerSnapshot: async (transaction) => {
        await new Promise((resolve) => setTimeout(resolve, 60));
        const push = await vsc.push(
          {
            repoId: setup.repoId,
            baseCommitId: setup.commitId,
            message: 'slow owner apply',
            files: [{ path: 'README.md', content: '# slow apply\n' }],
          },
          { transaction },
        );
        return { localCommitId: push.commit.id, contentHash: discovery.snapshot.contentHash };
      },
    });

    expect(result.job.status).toBe('succeeded');
  });

  it('rolls back and fails the job when owner callback reports a non-Head local commit', async () => {
    const setup = await createMappedRemote('head-mismatch');
    adapter.advanceRemote([{ path: 'README.md', content: '# mismatched apply\n' }]);
    const input = await createPullInput(setup.remote, setup.commitId);
    const service = createService();
    const discovery = await service.discover(input);
    const handle = requireHandle(discovery.handle);

    await expect(
      service.apply(handle, {
        lockOwner: async () => setup.repoId,
        applyOwnerSnapshot: async (transaction) => {
          await vsc.push(
            {
              repoId: setup.repoId,
              baseCommitId: setup.commitId,
              message: 'rolled back mismatch',
              files: [{ path: 'README.md', content: '# mismatched apply\n' }],
            },
            { transaction },
          );
          return { localCommitId: 'not-the-vsc-head', contentHash: discovery.snapshot.contentHash };
        },
      }),
    ).rejects.toMatchObject({ code: 'LOCAL_OUTDATED', details: { reasonCode: 'owner-apply-head-mismatch' } });
    await service.failApply(handle, 'LOCAL_OUTDATED');

    await expect(vsc.getRepository({ repoId: setup.repoId })).resolves.toMatchObject({
      headCommitId: setup.commitId,
    });
    await expect(db.getRepository('vscFileSyncJobs').findOne({ filterByTk: discovery.job.id })).resolves.toMatchObject({
      status: 'failed',
      lastErrorCode: 'LOCAL_OUTDATED',
    });
  });

  it('does not allow a live pull lease to be claimed again', async () => {
    const setup = await createMappedRemote('live-lease');
    adapter.advanceRemote([{ path: 'README.md', content: '# remote next\n' }]);
    const input = await createPullInput(setup.remote, setup.commitId);
    const service = createService();
    const discovery = await service.discover(input);

    await expect(service.discover(input)).rejects.toMatchObject({ code: 'BUSY' });
    await service.failApply(requireHandle(discovery.handle), 'REMOTE_UNAVAILABLE');
  });

  it('reclaims an expired pull lease only for the same immutable revision', async () => {
    const setup = await createMappedRemote('stale-lease');
    adapter.advanceRemote([{ path: 'README.md', content: '# remote next\n' }]);
    const input = await createPullInput(setup.remote, setup.commitId);
    const service = createService();
    const first = await service.discover(input);
    await expireLease(first.job.id);
    await new SyncJobStore(db).createOrGet({
      remoteId: setup.remote.id,
      remoteTargetVersion: setup.remote.version,
      operation: 'push',
      idempotencyKey: 'unrelated-push-recovery',
    });

    await expect(service.listRecoverablePullJobs()).resolves.toEqual([
      expect.objectContaining({ id: first.job.id, operation: 'pull' }),
    ]);

    const recovered = await service.discover(input);

    expect(recovered).toMatchObject({ applyRequired: true, job: { attempt: 2, phase: 'remote-succeeded' } });
    expect(recovered.snapshot.revision).toBe(first.snapshot.revision);
    expect(recovered.handle?.claimToken).not.toBe(first.handle?.claimToken);
    await service.failApply(requireHandle(recovered.handle), 'REMOTE_UNAVAILABLE');
  });

  it('recovers a stale pull from the original immutable revision after the branch advances', async () => {
    const setup = await createMappedRemote('stale-newer');
    adapter.advanceRemote([{ path: 'README.md', content: '# remote one\n' }]);
    const input = await createPullInput(setup.remote, setup.commitId);
    const service = createService();
    const first = await service.discover(input);
    await expireLease(first.job.id);
    const latest = adapter.advanceRemote([{ path: 'README.md', content: '# remote two\n' }]);

    const recovered = await service.discover(input);

    expect(recovered).toMatchObject({ applyRequired: true, snapshot: { revision: first.snapshot.revision } });
    expect(recovered.snapshot.revision).not.toBe(latest.revision);
    await expect(db.getRepository('vscFileConflicts').count()).resolves.toBe(0);
    await service.failApply(requireHandle(recovered.handle), 'REMOTE_UNAVAILABLE');
  });

  it('turns an unprovable stale recovery into a conflict instead of applying the latest revision', async () => {
    const setup = await createMappedRemote('stale-unprovable');
    adapter.advanceRemote([{ path: 'README.md', content: '# remote one\n' }]);
    const input = await createPullInput(setup.remote, setup.commitId);
    const service = createService();
    const first = await service.discover(input);
    await expireLease(first.job.id);
    adapter.advanceRemote([{ path: 'README.md', content: '# remote two\n' }]);
    const fetchCurrent = adapter.fetchSnapshot.bind(adapter);
    vi.spyOn(adapter, 'fetchSnapshot').mockImplementationOnce((target) => fetchCurrent(target));

    await expect(service.discover(input)).rejects.toMatchObject({ code: 'REMOTE_CHANGED' });
    await expect(db.getRepository('vscFileConflicts').findOne()).resolves.toMatchObject({
      reasonCode: 'remote-changed-before-pull',
      currentRemoteRevision: adapter.getSnapshot().revision,
    });
  });

  it('records a conflict when stale recovery cannot fetch the pinned revision', async () => {
    const setup = await createMappedRemote('stale-revision-unavailable');
    adapter.advanceRemote([{ path: 'README.md', content: '# remote one\n' }]);
    const input = await createPullInput(setup.remote, setup.commitId);
    const service = createService();
    const first = await service.discover(input);
    await expireLease(first.job.id);
    vi.spyOn(adapter, 'fetchSnapshot').mockRejectedValueOnce(
      new RemoteSyncError('REMOTE_NOT_FOUND', 'Pinned revision is unavailable', {
        details: { reasonCode: 'revision-not-found' },
      }),
    );

    await expect(service.discover(input)).rejects.toMatchObject({ code: 'REMOTE_NOT_FOUND' });
    await expect(db.getRepository('vscFileConflicts').findOne()).resolves.toMatchObject({
      reasonCode: 'pinned-revision-unavailable',
      currentRemoteRevision: null,
    });
    await expect(db.getRepository('vscFileSyncJobs').findOne({ filterByTk: first.job.id })).resolves.toMatchObject({
      status: 'failed',
      lastErrorCode: 'REMOTE_NOT_FOUND',
    });
  });

  it('checks owner pull permission before adapter network access', async () => {
    const setup = await createMappedRemote('permission');
    adapter.advanceRemote([{ path: 'README.md', content: '# remote next\n' }]);
    const input = await createPullInput(setup.remote, setup.commitId);
    const permissionHooks = new VscPermissionHookRegistry();
    permissionHooks.register(() => false);
    const fetch = vi.spyOn(adapter, 'fetchSnapshot');

    await expect(createService({ permissionHooks }).discover(input)).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
    });
    expect(fetch).not.toHaveBeenCalled();
    await expect(db.getRepository('vscFileSyncJobs').count()).resolves.toBe(0);
  });

  it('rejects expected repository mismatches before any adapter call', async () => {
    const setup = await createMappedRemote('repo-mismatch');
    const input = await createPullInput(setup.remote, setup.commitId);
    const fetch = vi.spyOn(adapter, 'fetchSnapshot');

    await expect(createService().discover({ ...input, expectedRepoId: 'another-repository' })).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
      details: { reasonCode: 'remote-repository-mismatch' },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  function createService(
    options: Partial<ConstructorParameters<typeof VscRemotePullDiscoveryService>[1]> = {},
  ): VscRemotePullDiscoveryService {
    return new VscRemotePullDiscoveryService(db, { adapterRegistry: registry, ...options });
  }

  async function createMappedRemote(name: string) {
    const created = await vsc.createRepository({
      ownerType: 'plugin',
      ownerId: name,
      name: 'main',
      initialFiles: [{ path: 'README.md', content: '# base\n' }],
    });
    const commitId = created.initialCommit?.id as string;
    const remote = await remoteStore.create({
      repoId: created.repository.id,
      name: 'origin',
      provider: 'github',
      config: remoteConfig,
      authRef: null,
    });
    const snapshot = adapter.getSnapshot();
    await mapStore.record({
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      localCommitId: commitId,
      remoteRevision: snapshot.revision as string,
      contentHash: snapshot.contentHash,
    });
    return { repoId: created.repository.id, commitId, remote };
  }

  async function createPullInput(remote: VscFileRemoteRecord, commitId: string) {
    const local = await loadVscSnapshot(db, new CommitService(db), new TreeService(db), remote.repoId, commitId);
    const remoteSnapshot = adapter.getSnapshot();
    const baseline = await mapStore.findLatest(remote.id);
    const plan = new SyncStatePlanner().plan({
      configured: true,
      remoteId: remote.id,
      provider: remote.provider,
      remoteTargetVersion: remote.version,
      direction: 'pull',
      capabilities: { canPull: true, canPush: true },
      local: { headCommitId: commitId, contentHash: local.contentHash },
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
      remoteId: remote.id,
      expectedRepoId: remote.repoId,
      expectedLocalCommitId: commitId,
      expectedRemoteRevision: remoteSnapshot.revision,
      expectedRemoteTargetVersion: remote.version,
      planFingerprint: plan.fingerprint,
    };
  }

  async function expireLease(jobId: string) {
    await db.getRepository('vscFileSyncJobs').update({
      filterByTk: jobId,
      values: { leaseExpiresAt: new Date(Date.now() - 1_000) },
    });
  }
});

function requireHandle<T>(handle: T | null): T {
  if (!handle) {
    throw new Error('Expected a pull discovery handle');
  }
  return handle;
}
