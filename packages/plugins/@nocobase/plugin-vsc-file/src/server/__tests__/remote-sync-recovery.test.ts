/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType } from '@nocobase/resourcer';
import { vi } from 'vitest';

import { CommitService } from '../services/CommitService';
import { TreeService } from '../services/TreeService';
import { VscPermissionHookRegistry } from '../permissions';
import { createVscFileResource } from '../resources/vscFile';
import { ExternalCommitMapStore } from '../remotes/ExternalCommitMapStore';
import { RemoteReconcileService } from '../remotes/RemoteReconcileService';
import { RemoteSyncRuntimeService } from '../remotes/RemoteSyncRuntimeService';
import { SyncJobStore } from '../remotes/SyncJobStore';
import { SyncStatePlanner } from '../remotes/SyncStatePlanner';
import { VscRemotePullDiscoveryService } from '../remotes/VscRemotePullDiscoveryService';
import { loadVscSnapshot, VscRemotePushService } from '../remotes/VscRemotePushService';
import { createRemoteSyncAcceptanceFixture, type RemoteSyncAcceptanceFixture } from './helpers/remoteSyncAcceptance';

describe('remote sync server recovery acceptance', () => {
  let fixture: RemoteSyncAcceptanceFixture;

  afterEach(async () => {
    vi.restoreAllMocks();
    await fixture?.close();
  });

  it('blocks configure and archive after remote success until finalize completes, then archives through VSC', async () => {
    fixture = await createRemoteSyncAcceptanceFixture();
    const setup = await fixture.createLocalRemote('recovery-finalize');
    const input = await fixture.createPushInput(setup.remote, setup.commitId);
    const failingMapStore = new ExternalCommitMapStore(fixture.db);
    const record = vi.spyOn(failingMapStore, 'record').mockRejectedValueOnce(new Error('injected finalize failure'));

    await expect(
      new VscRemotePushService(fixture.db, {
        adapterRegistry: fixture.adapterRegistry,
        mapStore: failingMapStore,
      }).push(input),
    ).rejects.toMatchObject({ code: 'REMOTE_UNAVAILABLE', details: { reasonCode: 'finalize-pending' } });
    const pending = await fixture.db.getRepository('vscFileSyncJobs').findOne();
    expect(pending).toMatchObject({ status: 'finalize-pending', phase: 'finalize-pending' });
    expect(fixture.adapter.getPublishCount()).toBe(1);
    const runtime = new RemoteSyncRuntimeService(fixture.db, {
      adapterRegistry: fixture.adapterRegistry,
      credentialResolver: {
        validate: async () => {
          throw new Error('Credential validation is not expected');
        },
      },
      permissionHooks: new VscPermissionHookRegistry(),
    });
    await expect(
      runtime.configureRemote({
        repoId: setup.repoId,
        name: 'origin',
        provider: 'github',
        config: { ...setup.remote.config, branch: 'next' },
        authRef: null,
      }),
    ).rejects.toMatchObject({ code: 'BUSY' });
    const blockedArchive = await runArchiveResource(setup.repoId);
    expect(blockedArchive).toMatchObject({ status: 409, body: { errors: [{ code: 'BUSY' }] } });
    await expect(fixture.vsc.getRepository({ repoId: setup.repoId })).resolves.toMatchObject({ status: 'active' });

    record.mockRestore();
    const recovered = await new RemoteReconcileService(fixture.db, {
      adapterRegistry: fixture.adapterRegistry,
      mapStore: failingMapStore,
    }).reconcile(pending?.get('id') as string);

    expect(recovered).toMatchObject({ decision: 'finalized', published: false, job: { status: 'succeeded' } });
    expect(fixture.adapter.getPublishCount()).toBe(1);
    await expect(fixture.mapStore.findLatest(setup.remote.id)).resolves.toMatchObject({
      localCommitId: setup.commitId,
    });
    const archived = await runArchiveResource(setup.repoId);
    expect(archived.body).toMatchObject({ status: 'archived' });
  });

  it('allows only one of two independently keyed concurrent Push jobs to reach provider CAS', async () => {
    fixture = await createRemoteSyncAcceptanceFixture();
    const setup = await fixture.createLocalRemote('recovery-concurrent');
    const input = await fixture.createPushInput(setup.remote, setup.commitId);
    const service = new VscRemotePushService(fixture.db, { adapterRegistry: fixture.adapterRegistry });
    const originalPublish = fixture.adapter.publishSnapshot.bind(fixture.adapter);
    let releasePublish: (() => void) | undefined;
    const publicationGate = new Promise<void>((resolve) => {
      releasePublish = resolve;
    });
    let publishStarted: (() => void) | undefined;
    const publishStartedGate = new Promise<void>((resolve) => {
      publishStarted = resolve;
    });
    let secondInput: Awaited<ReturnType<RemoteSyncAcceptanceFixture['createPushInput']>> | null = null;
    vi.spyOn(fixture.adapter, 'publishSnapshot').mockImplementationOnce(async (target, snapshot, expectedRevision) => {
      const advanced = await fixture.vsc.push({
        repoId: setup.repoId,
        baseCommitId: setup.commitId,
        message: 'independent concurrent push',
        files: [{ path: 'second.ts', content: 'export const second = true;\n' }],
      });
      secondInput = await fixture.createPushInput(setup.remote, advanced.commit.id);
      publishStarted?.();
      await publicationGate;
      return originalPublish(target, snapshot, expectedRevision);
    });

    const first = service.push({ ...input, idempotencyKey: 'independent-push-a' });
    await publishStartedGate;
    if (!secondInput) {
      throw new Error('Expected a second independent Push input');
    }
    await expect(service.push({ ...secondInput, idempotencyKey: 'independent-push-b' })).rejects.toMatchObject({
      code: 'BUSY',
    });
    releasePublish?.();
    const completed = await first;
    await expect(service.push({ ...secondInput, idempotencyKey: 'independent-push-b' })).rejects.toMatchObject({
      code: 'REMOTE_CHANGED',
    });

    expect(completed.job.status).toBe('succeeded');
    expect(fixture.adapter.getPublishCount()).toBe(1);
    await expect(fixture.db.getRepository('vscFileSyncJobs').count()).resolves.toBe(2);
  });

  it('allows only one independently keyed Pull job to hold the repo and remote lease', async () => {
    fixture = await createRemoteSyncAcceptanceFixture();
    const setup = await createMappedRemoteAhead('recovery-pull-contention');
    const pullService = new VscRemotePullDiscoveryService(fixture.db, {
      adapterRegistry: fixture.adapterRegistry,
    });
    const input = await createPullInput(setup.remote, setup.commitId);

    const first = await pullService.discover({ ...input, idempotencyKey: 'independent-pull-a' });
    await expect(pullService.discover({ ...input, idempotencyKey: 'independent-pull-b' })).rejects.toMatchObject({
      code: 'BUSY',
    });
    if (!first.handle) {
      throw new Error('Expected the first Pull to retain an apply handle');
    }
    await pullService.failApply(first.handle, 'REMOTE_UNAVAILABLE');
  });

  it('prevents a Push from starting while a Pull owns the same remote and repo', async () => {
    fixture = await createRemoteSyncAcceptanceFixture();
    const setup = await createMappedRemoteAhead('recovery-push-pull-exclusion');
    const pullService = new VscRemotePullDiscoveryService(fixture.db, {
      adapterRegistry: fixture.adapterRegistry,
    });
    const pullInput = await createPullInput(setup.remote, setup.commitId);
    const discovered = await pullService.discover({ ...pullInput, idempotencyKey: 'blocking-pull' });
    const pushInput = await fixture.createPushInput(setup.remote, setup.commitId);

    await expect(
      new VscRemotePushService(fixture.db, { adapterRegistry: fixture.adapterRegistry }).push({
        ...pushInput,
        idempotencyKey: 'blocked-push',
      }),
    ).rejects.toMatchObject({ code: 'BUSY' });
    if (!discovered.handle) {
      throw new Error('Expected the Pull to retain an apply handle');
    }
    await pullService.failApply(discovered.handle, 'REMOTE_UNAVAILABLE');
  });

  it('recognizes a ref update that crashed before phase persistence and finalizes without republishing', async () => {
    fixture = await createRemoteSyncAcceptanceFixture();
    const setup = await fixture.createLocalRemote('recovery-after-ref-update');
    const input = await fixture.createPushInput(setup.remote, setup.commitId);
    const now = new Date('2026-07-16T00:00:00.000Z');
    const jobStore = new SyncJobStore(
      fixture.db,
      () => now,
      () => 'crashed-claim',
    );
    const created = await jobStore.createOrGet({
      remoteId: setup.remote.id,
      remoteTargetVersion: setup.remote.version,
      operation: 'push',
      idempotencyKey: 'crash-after-ref-update',
      planFingerprint: input.planFingerprint,
      expectedLocalCommitId: setup.commitId,
      expectedRemoteRevision: null,
    });
    const claimed = await jobStore.claim(created.job.id, { leaseOwner: 'crashed-worker', leaseDurationMs: 1_000 });
    const snapshot = await loadVscSnapshot(
      fixture.db,
      new CommitService(fixture.db),
      new TreeService(fixture.db),
      setup.repoId,
      setup.commitId,
    );
    await jobStore.advancePhase(created.job.id, claimed?.claimToken || 'missing', {
      phase: 'prepared',
      contentHash: snapshot.contentHash,
    });
    await jobStore.advancePhase(created.job.id, claimed?.claimToken || 'missing', { phase: 'remote-started' });
    const published = await fixture.adapter.publishSnapshot(
      { config: setup.remote.config, authRef: null },
      snapshot,
      null,
    );
    await fixture.db.getRepository('vscFileSyncJobs').update({
      filterByTk: created.job.id,
      values: { leaseExpiresAt: new Date('2026-07-15T23:59:59.000Z') },
    });

    const result = await new RemoteReconcileService(fixture.db, {
      adapterRegistry: fixture.adapterRegistry,
      jobStore: new SyncJobStore(
        fixture.db,
        () => new Date('2026-07-16T00:00:02.000Z'),
        () => 'recovery-claim',
      ),
    }).reconcile(created.job.id, { leaseDurationMs: 1_000 });

    expect(result).toMatchObject({ decision: 'finalized', published: false, job: { status: 'succeeded' } });
    expect(result.job.resultRemoteRevision).toBe(published.revision);
    expect(fixture.adapter.getPublishCount()).toBe(1);
  });

  it('finalizes durable remote-succeeded evidence when the repository was already archived before recovery', async () => {
    fixture = await createRemoteSyncAcceptanceFixture();
    const setup = await fixture.createLocalRemote('recovery-archived-after-remote-success');
    const input = await fixture.createPushInput(setup.remote, setup.commitId);
    const jobStore = new SyncJobStore(
      fixture.db,
      () => new Date('2026-07-16T00:00:00.000Z'),
      () => 'remote-succeeded-claim',
    );
    const created = await jobStore.createOrGet({
      remoteId: setup.remote.id,
      remoteTargetVersion: setup.remote.version,
      operation: 'push',
      idempotencyKey: 'archived-after-remote-success',
      planFingerprint: input.planFingerprint,
      expectedLocalCommitId: setup.commitId,
      expectedRemoteRevision: null,
    });
    const claimed = await jobStore.claim(created.job.id, { leaseOwner: 'crashed-worker', leaseDurationMs: 1_000 });
    const snapshot = await loadVscSnapshot(
      fixture.db,
      new CommitService(fixture.db),
      new TreeService(fixture.db),
      setup.repoId,
      setup.commitId,
    );
    await jobStore.advancePhase(created.job.id, claimed?.claimToken || 'missing', {
      phase: 'prepared',
      contentHash: snapshot.contentHash,
    });
    await jobStore.advancePhase(created.job.id, claimed?.claimToken || 'missing', { phase: 'remote-started' });
    const published = await fixture.adapter.publishSnapshot(
      { config: setup.remote.config, authRef: null },
      snapshot,
      null,
    );
    await jobStore.advancePhase(created.job.id, claimed?.claimToken || 'missing', {
      phase: 'remote-succeeded',
      resultLocalCommitId: setup.commitId,
      resultRemoteRevision: published.revision,
      contentHash: published.contentHash,
    });
    await fixture.db.getRepository('vscFileRepositories').update({
      filterByTk: setup.repoId,
      values: { status: 'archived' },
    });
    await fixture.db.getRepository('vscFileSyncJobs').update({
      filterByTk: created.job.id,
      values: { leaseExpiresAt: new Date('2026-07-15T23:59:59.000Z') },
    });

    const result = await new RemoteReconcileService(fixture.db, {
      adapterRegistry: fixture.adapterRegistry,
      jobStore: new SyncJobStore(
        fixture.db,
        () => new Date('2026-07-16T00:00:02.000Z'),
        () => 'archived-recovery-claim',
      ),
    }).reconcile(created.job.id, { leaseDurationMs: 1_000 });

    expect(result).toMatchObject({ decision: 'finalized', published: false, job: { status: 'succeeded' } });
    expect(fixture.adapter.getPublishCount()).toBe(1);
    await expect(fixture.vsc.getRepository({ repoId: setup.repoId })).resolves.toMatchObject({ status: 'archived' });
    await expect(fixture.mapStore.findLatest(setup.remote.id)).resolves.toMatchObject({
      localCommitId: setup.commitId,
      remoteRevision: published.revision,
    });
  });

  it('reclaims an expired prepared Push and publishes it once with a new claim token', async () => {
    fixture = await createRemoteSyncAcceptanceFixture();
    const setup = await fixture.createLocalRemote('recovery-prepared');
    const input = await fixture.createPushInput(setup.remote, setup.commitId);
    const jobStore = new SyncJobStore(
      fixture.db,
      () => new Date('2026-07-16T00:00:00.000Z'),
      () => 'prepared-claim',
    );
    const created = await jobStore.createOrGet({
      remoteId: setup.remote.id,
      remoteTargetVersion: setup.remote.version,
      operation: 'push',
      idempotencyKey: 'expired-prepared',
      planFingerprint: input.planFingerprint,
      expectedLocalCommitId: setup.commitId,
      expectedRemoteRevision: null,
      maxAttempts: 3,
    });
    const claimed = await jobStore.claim(created.job.id, { leaseOwner: 'crashed-worker', leaseDurationMs: 1_000 });
    const snapshot = await loadVscSnapshot(
      fixture.db,
      new CommitService(fixture.db),
      new TreeService(fixture.db),
      setup.repoId,
      setup.commitId,
    );
    await jobStore.advancePhase(created.job.id, claimed?.claimToken || 'missing', {
      phase: 'prepared',
      contentHash: snapshot.contentHash,
    });
    await fixture.db.getRepository('vscFileSyncJobs').update({
      filterByTk: created.job.id,
      values: { leaseExpiresAt: new Date('2026-07-15T23:59:59.000Z') },
    });

    const result = await new RemoteReconcileService(fixture.db, {
      adapterRegistry: fixture.adapterRegistry,
      jobStore: new SyncJobStore(
        fixture.db,
        () => new Date('2026-07-16T00:00:02.000Z'),
        () => 'reclaimed-prepared-claim',
      ),
    }).reconcile(created.job.id, { leaseDurationMs: 1_000 });

    expect(result).toMatchObject({ decision: 'retried-publication', published: true, job: { status: 'succeeded' } });
    expect(result.job.attempt).toBe(2);
    expect(fixture.adapter.getPublishCount()).toBe(1);
  });

  it('protects lifecycle operations for live and finalize-pending jobs, then allows terminal cleanup', async () => {
    fixture = await createRemoteSyncAcceptanceFixture();
    const setup = await fixture.createLocalRemote('recovery-lifecycle');
    const jobStore = new SyncJobStore(
      fixture.db,
      () => new Date('2026-07-16T00:00:00.000Z'),
      () => 'claim-one',
    );
    const job = (
      await jobStore.createOrGet({
        remoteId: setup.remote.id,
        remoteTargetVersion: setup.remote.version,
        operation: 'push',
        idempotencyKey: 'lifecycle-job',
      })
    ).job;

    await expect(fixture.remoteStore.disconnect(setup.remote.id)).rejects.toMatchObject({ code: 'BUSY' });
    const claimed = await jobStore.claim(job.id, { leaseOwner: 'worker', leaseDurationMs: 1_000 });
    await jobStore.markFinalizePending(job.id, claimed?.claimToken || 'missing', {
      resultRemoteRevision: 'remote-result',
    });
    await expect(fixture.remoteStore.deleteRemote(setup.remote.id)).rejects.toMatchObject({ code: 'BUSY' });

    const finalizeClaim = await jobStore.claim(job.id, { leaseOwner: 'reconciler', leaseDurationMs: 1_000 });
    await jobStore.succeed(job.id, finalizeClaim?.claimToken || 'missing');
    await expect(fixture.remoteStore.disconnect(setup.remote.id)).resolves.toMatchObject({ status: 'disabled' });
  });

  async function createMappedRemoteAhead(name: string) {
    const setup = await fixture.createLocalRemote(name);
    const initialInput = await fixture.createPushInput(setup.remote, setup.commitId);
    await new VscRemotePushService(fixture.db, { adapterRegistry: fixture.adapterRegistry }).push({
      ...initialInput,
      idempotencyKey: `baseline:${name}`,
    });
    fixture.adapter.advanceRemote([{ path: 'README.md', content: `# ${name} remote advance\n` }]);
    return setup;
  }

  async function runArchiveResource(repoId: string) {
    const resource = createVscFileResource(fixture.db);
    const handler = (resource.actions as Record<string, HandlerType>).archiveRepository;
    const ctx = {
      action: { resourceName: 'vscFile', actionName: 'archiveRepository', params: { values: { repoId } } },
    };
    await handler(
      ctx,
      vi.fn(async () => undefined),
    );
    return ctx as typeof ctx & { body?: unknown; status?: number };
  }

  async function createPullInput(
    remote: Parameters<RemoteSyncAcceptanceFixture['createPushInput']>[0],
    commitId: string,
  ) {
    const local = await loadVscSnapshot(
      fixture.db,
      new CommitService(fixture.db),
      new TreeService(fixture.db),
      remote.repoId,
      commitId,
    );
    const remoteSnapshot = fixture.adapter.getSnapshot();
    const baseline = await fixture.mapStore.findLatest(remote.id);
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
});
