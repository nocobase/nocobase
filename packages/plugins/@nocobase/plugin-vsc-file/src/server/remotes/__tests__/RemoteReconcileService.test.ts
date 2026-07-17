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

import type { VscFileRemoteRecord, VscRemoteSnapshot } from '../../../shared/remote-sync-types';
import { VscFileService } from '../../services/VscFileService';
import { CommitService } from '../../services/CommitService';
import { TreeService } from '../../services/TreeService';
import { ExternalCommitMapStore } from '../ExternalCommitMapStore';
import { RemoteReconcileService, type RemoteReconcileRecoveryEvent } from '../RemoteReconcileService';
import { RemoteSyncError } from '../RemoteSyncAdapter';
import { RemoteSyncAdapterRegistry } from '../RemoteSyncAdapterRegistry';
import { RemoteStore } from '../RemoteStore';
import { SyncJobStore } from '../SyncJobStore';
import { SyncStatePlanner } from '../SyncStatePlanner';
import { DeterministicRemoteAdapter } from '../testing/DeterministicRemoteAdapter';
import { loadVscSnapshot } from '../VscRemotePushService';

const remoteConfig = {
  owner: 'nocobase',
  repository: 'extensions',
  branch: 'main',
  subdirectory: null,
};

describe('RemoteReconcileService', () => {
  let db: Database;
  let now: Date;
  let claimSequence: number;
  let vsc: VscFileService;
  let adapter: DeterministicRemoteAdapter;
  let adapterRegistry: RemoteSyncAdapterRegistry;
  let remoteStore: RemoteStore;
  let mapStore: ExternalCommitMapStore;
  let jobStore: SyncJobStore;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({ directory: path.resolve(__dirname, '../../collections') });
    await db.sync();
    now = new Date('2026-07-16T00:00:00.000Z');
    claimSequence = 0;
    vsc = new VscFileService(db);
    adapter = new DeterministicRemoteAdapter({ initialRevision: null });
    adapterRegistry = new RemoteSyncAdapterRegistry();
    adapterRegistry.register(adapter);
    remoteStore = new RemoteStore(db, () => now);
    mapStore = new ExternalCommitMapStore(db);
    jobStore = new SyncJobStore(
      db,
      () => now,
      () => `claim-${(claimSequence += 1)}`,
    );
  });

  afterEach(async () => {
    await db?.close();
  });

  it('classifies a ref update before phase persistence and only finalizes the evidence', async () => {
    const prepared = await prepareRunningJob('crash-after-ref', { phase: 'remote-started' });
    const published = await adapter.publishSnapshot(
      { config: prepared.remote.config, authRef: null },
      prepared.snapshot,
      null,
    );
    now = new Date('2026-07-16T00:00:02.000Z');

    const result = await createReconciler().reconcile(prepared.jobId, { leaseDurationMs: 1_000 });
    expect(result).toMatchObject({ decision: 'finalized', published: false, job: { status: 'succeeded' } });
    expect(result.job.resultRemoteRevision).toBe(published.revision);
    expect(adapter.getPublishCount()).toBe(1);
    await expect(mapStore.findLatest(prepared.remote.id)).resolves.toMatchObject({
      localCommitId: prepared.commitId,
      remoteRevision: published.revision,
    });
  });

  it('records an uncertain conflict when the remote continues past an unpersisted result', async () => {
    const prepared = await prepareRunningJob('uncertain-result', { phase: 'remote-started' });
    await adapter.publishSnapshot({ config: prepared.remote.config, authRef: null }, prepared.snapshot, null);
    const advanced = adapter.advanceRemote([{ path: 'third-party.txt', content: 'later change\n' }]);
    now = new Date('2026-07-16T00:00:02.000Z');

    const result = await createReconciler().reconcile(prepared.jobId, { leaseDurationMs: 1_000 });
    expect(result).toMatchObject({ decision: 'conflict', published: false, job: { status: 'failed' } });
    expect(adapter.getPublishCount()).toBe(1);
    await expect(mapStore.findLatest(prepared.remote.id)).resolves.toBeNull();
    await expect(db.getRepository('vscFileConflicts').findOne()).resolves.toMatchObject({
      reasonCode: 'uncertain-remote-result',
      currentRemoteRevision: advanced.revision,
      remoteContentHash: advanced.contentHash,
    });
  });

  it('retries the original pinned snapshot when the expected remote revision is unchanged', async () => {
    const prepared = await prepareRunningJob('safe-retry', { phase: 'remote-started' });
    now = new Date('2026-07-16T00:00:02.000Z');

    const result = await createReconciler().reconcile(prepared.jobId, { leaseDurationMs: 1_000 });
    expect(result).toMatchObject({ decision: 'retried-publication', published: true, job: { status: 'succeeded' } });
    expect(adapter.getPublishCount()).toBe(1);
    expect(adapter.getSnapshot().contentHash).toBe(prepared.snapshot.contentHash);
  });

  it('uses persisted remote success as stronger evidence even if the remote later advances', async () => {
    const prepared = await prepareRunningJob('persisted-success', { phase: 'remote-started' });
    const published = await adapter.publishSnapshot(
      { config: prepared.remote.config, authRef: null },
      prepared.snapshot,
      null,
    );
    await jobStore.advancePhase(prepared.jobId, prepared.claimToken, {
      phase: 'remote-succeeded',
      resultLocalCommitId: prepared.commitId,
      resultRemoteRevision: published.revision,
      contentHash: published.contentHash,
    });
    adapter.advanceRemote([{ path: 'third-party.txt', content: 'later change\n' }]);
    now = new Date('2026-07-16T00:00:02.000Z');

    const result = await createReconciler().reconcile(prepared.jobId, { leaseDurationMs: 1_000 });
    expect(result).toMatchObject({ decision: 'finalized', published: false, job: { status: 'succeeded' } });
    expect(adapter.getPublishCount()).toBe(1);
    await expect(mapStore.findLatest(prepared.remote.id)).resolves.toMatchObject({
      remoteRevision: published.revision,
      contentHash: published.contentHash,
    });
  });

  it('does not reclaim a live lease', async () => {
    const prepared = await prepareRunningJob('live-lease', { phase: 'remote-started' });

    await expect(createReconciler().reconcile(prepared.jobId, { leaseDurationMs: 1_000 })).rejects.toMatchObject({
      code: 'BUSY',
      details: { reasonCode: 'active-sync-job' },
    });
    expect(adapter.getPublishCount()).toBe(0);
  });

  it('enforces maxAttempts when a stale job cannot be reclaimed again', async () => {
    const prepared = await prepareRunningJob('bounded-attempts', { phase: 'remote-started', maxAttempts: 1 });
    now = new Date('2026-07-16T00:00:02.000Z');

    const result = await createReconciler().reconcile(prepared.jobId, { leaseDurationMs: 1_000 });
    expect(result).toMatchObject({ decision: 'already-terminal', published: false, job: { status: 'failed' } });
    expect(result.job).toMatchObject({ attempt: 1, maxAttempts: 1, lastErrorCode: 'REMOTE_UNAVAILABLE' });
    expect(adapter.getPublishCount()).toBe(0);
  });

  it('reconciles pending jobs serially without turning recovery into a scheduler', async () => {
    const first = await preparePendingJob('pending-one');
    const results = await createReconciler().reconcileRecoverable({ leaseDurationMs: 1_000 });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ job: { id: first.jobId, status: 'succeeded' }, published: true });
    expect(adapter.getPublishCount()).toBe(1);
  });

  it('continues a recovery scan after an independent job fails', async () => {
    const first = await preparePendingJob('scan-failure');
    const second = await preparePendingJob('scan-success');
    const fetch = adapter.fetchSnapshot.bind(adapter);
    const fetchSpy = vi.spyOn(adapter, 'fetchSnapshot').mockImplementation(async (target) => {
      if (target.config.repository === 'scan-failure') {
        throw new RemoteSyncError('REMOTE_UNAVAILABLE', 'Provider unavailable', {
          details: { provider: 'github', operation: 'fetch', reasonCode: 'provider-unavailable' },
        });
      }
      return fetch(target);
    });

    const recoveryEvents: RemoteReconcileRecoveryEvent[] = [];
    const results = await createReconciler().reconcileRecoverable({
      leaseDurationMs: 1_000,
      onRecoveryResult: async (event) => {
        recoveryEvents.push(event);
      },
    });
    expect(results).toEqual([
      expect.objectContaining({ job: expect.objectContaining({ id: second.jobId, status: 'succeeded' }) }),
    ]);
    await expect(jobStore.get(first.jobId)).resolves.toMatchObject({
      status: 'failed',
      lastErrorCode: 'REMOTE_UNAVAILABLE',
    });
    expect(adapter.getPublishCount()).toBe(1);
    expect(recoveryEvents).toEqual([
      expect.objectContaining({
        job: expect.objectContaining({ id: first.jobId, status: 'failed' }),
        errorCode: 'REMOTE_UNAVAILABLE',
      }),
      expect.objectContaining({
        job: expect.objectContaining({ id: second.jobId, status: 'succeeded' }),
        result: expect.objectContaining({ decision: 'retried-publication' }),
      }),
    ]);
    fetchSpy.mockRestore();
  });

  function createReconciler(): RemoteReconcileService {
    return new RemoteReconcileService(db, {
      adapterRegistry,
      remoteStore,
      mapStore,
      jobStore,
      leaseDurationMs: 1_000,
    });
  }

  async function preparePendingJob(name: string) {
    const local = await createLocalRemote(name);
    const snapshot = await localSnapshot(local.remote.repoId, local.commitId);
    const plan = createPlan(local.remote, local.commitId, snapshot, adapter.getSnapshot());
    const created = await jobStore.createOrGet({
      remoteId: local.remote.id,
      remoteTargetVersion: local.remote.version,
      operation: 'push',
      idempotencyKey: `pending:${name}`,
      planFingerprint: plan.fingerprint,
      expectedLocalCommitId: local.commitId,
      expectedRemoteRevision: null,
      maxAttempts: 3,
    });
    const claimed = await jobStore.claim(created.job.id, { leaseOwner: 'preparer', leaseDurationMs: 1_000 });
    if (!claimed?.claimToken) {
      throw new Error('Expected a claimed job');
    }
    await jobStore.advancePhase(created.job.id, claimed.claimToken, {
      phase: 'prepared',
      contentHash: snapshot.contentHash,
    });
    await db.getRepository('vscFileSyncJobs').update({
      filterByTk: created.job.id,
      values: {
        status: 'pending',
        claimToken: null,
        leaseOwner: null,
        leaseExpiresAt: null,
      },
    });
    return { ...local, snapshot, jobId: created.job.id };
  }

  async function prepareRunningJob(
    name: string,
    options: { phase: 'prepared' | 'remote-started'; maxAttempts?: number },
  ) {
    const local = await createLocalRemote(name);
    const snapshot = await localSnapshot(local.remote.repoId, local.commitId);
    const plan = createPlan(local.remote, local.commitId, snapshot, adapter.getSnapshot());
    const created = await jobStore.createOrGet({
      remoteId: local.remote.id,
      remoteTargetVersion: local.remote.version,
      operation: 'push',
      idempotencyKey: `running:${name}`,
      planFingerprint: plan.fingerprint,
      expectedLocalCommitId: local.commitId,
      expectedRemoteRevision: null,
      maxAttempts: options.maxAttempts ?? 3,
    });
    const claimed = await jobStore.claim(created.job.id, { leaseOwner: 'worker', leaseDurationMs: 1_000 });
    if (!claimed?.claimToken) {
      throw new Error('Expected a claimed job');
    }
    await jobStore.advancePhase(created.job.id, claimed.claimToken, {
      phase: 'prepared',
      contentHash: snapshot.contentHash,
    });
    if (options.phase === 'remote-started') {
      await jobStore.advancePhase(created.job.id, claimed.claimToken, { phase: 'remote-started' });
    }
    return { ...local, snapshot, jobId: created.job.id, claimToken: claimed.claimToken };
  }

  async function createLocalRemote(name: string) {
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
      config: { ...remoteConfig, repository: name },
      authRef: null,
    });
    return { repoId: created.repository.id, commitId: created.initialCommit.id, remote };
  }

  async function localSnapshot(repoId: string, commitId: string) {
    return loadVscSnapshot(db, new CommitService(db), new TreeService(db), repoId, commitId);
  }

  function createPlan(
    remote: VscFileRemoteRecord,
    commitId: string,
    local: VscRemoteSnapshot,
    remoteSnapshot: VscRemoteSnapshot,
  ) {
    return new SyncStatePlanner().plan({
      configured: true,
      remoteId: remote.id,
      provider: remote.provider,
      remoteTargetVersion: remote.version,
      direction: 'push',
      capabilities: { canPull: true, canPush: true },
      local: { headCommitId: commitId, contentHash: local.contentHash },
      remote: {
        revision: remoteSnapshot.revision,
        contentHash: remoteSnapshot.contentHash,
        contentHashKnown: true,
      },
      baseline: null,
    });
  }
});
