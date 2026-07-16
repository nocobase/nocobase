/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import path from 'path';

import type { VscFileRemoteRecord, VscRemoteNormalizedConfig } from '../../shared/remote-sync-types';
import { ConflictStore } from '../remotes/ConflictStore';
import { ExternalCommitMapStore } from '../remotes/ExternalCommitMapStore';
import { RemoteStore } from '../remotes/RemoteStore';
import { SyncJobStore } from '../remotes/SyncJobStore';

const normalizedConfig: VscRemoteNormalizedConfig = {
  owner: 'nocobase',
  repository: 'extensions',
  branch: 'main',
  subdirectory: null,
};

describe('vsc-file remote stores', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({
      directory: path.resolve(__dirname, '../collections'),
    });
    await db.sync();
  });

  afterEach(async () => {
    await db?.close();
  });

  it('rejects sensitive config keys recursively and returns a safe DTO', async () => {
    const repoId = await createRepository('sensitive-config');
    const store = new RemoteStore(db);
    const unsafeConfig = {
      ...normalizedConfig,
      nested: {
        tokenValue: 'not-allowed',
      },
    } as unknown as VscRemoteNormalizedConfig;

    await expect(
      store.create({
        repoId,
        name: 'origin',
        provider: 'github',
        config: unsafeConfig,
        authRef: '{{ $env.GITHUB_SYNC }}',
      }),
    ).rejects.toMatchObject({ code: 'CONFIG_INVALID' });

    const remote = await createRemote(store, repoId);
    expect(remote).toMatchObject({
      repoId,
      name: 'origin',
      provider: 'github',
      config: normalizedConfig,
      version: 1,
    });
    expect(JSON.stringify(remote)).not.toMatch(/privateKey|credential|authorization|password|secret|token/i);
  });

  it('preserves mappings across auth rotation and isolates old target versions', async () => {
    const repoId = await createRepository('target-version');
    const remoteStore = new RemoteStore(db);
    const mapStore = new ExternalCommitMapStore(db);
    const conflictStore = new ConflictStore(db);
    const remote = await createRemote(remoteStore, repoId);
    const mapping = await mapStore.record({
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      localCommitId: 'local-1',
      remoteRevision: 'remote-1',
      contentHash: 'sha256:content-1',
    });
    await conflictStore.upsert({
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      baseLocalCommitId: null,
      baseRemoteRevision: null,
      currentLocalCommitId: 'local-2',
      currentRemoteRevision: 'remote-2',
      localContentHash: 'sha256:local-2',
      remoteContentHash: 'sha256:remote-2',
      reasonCode: 'diverged',
    });
    await remoteStore.recordCheck(remote.id, { remoteTargetVersion: remote.version, lastErrorCode: 'AUTH_FAILED' });

    const rotated = await remoteStore.rotateAuthRef(remote.id, '{{ $env.GITHUB_SYNC_ROTATED }}');
    expect(rotated.version).toBe(1);
    expect(rotated.lastErrorCode).toBeNull();
    await expect(mapStore.findLatest(remote.id)).resolves.toMatchObject({ id: mapping.id });

    const updated = await remoteStore.updateTarget(remote.id, {
      provider: 'github',
      config: { ...normalizedConfig, branch: 'next' },
      authRef: rotated.authRef,
    });
    expect(updated.version).toBe(2);
    await expect(mapStore.findLatest(remote.id)).resolves.toBeNull();
    await expect(conflictStore.listOpen(remote.id)).resolves.toEqual([]);
    await expect(db.getRepository('vscFileExternalCommitMaps').count()).resolves.toBe(1);
    await expect(db.getRepository('vscFileConflicts').count()).resolves.toBe(1);
  });

  it('creates jobs idempotently and serializes claims with expiring leases', async () => {
    let now = new Date('2026-07-16T00:00:00.000Z');
    const claimTokens = ['claim-1', 'claim-2', 'claim-3', 'claim-4'];
    const repoId = await createRepository('job-leases');
    const remote = await createRemote(new RemoteStore(db), repoId);
    const store = new SyncJobStore(
      db,
      () => now,
      () => claimTokens.shift() || 'claim-fallback',
    );
    const input = {
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      operation: 'push' as const,
      idempotencyKey: 'push-1',
      planFingerprint: 'sha256:plan-1',
      expectedLocalCommitId: 'local-1',
      expectedRemoteRevision: 'remote-1',
    };
    const first = await store.createOrGet(input);
    const retry = await store.createOrGet(input);
    const second = await store.createOrGet({
      ...input,
      idempotencyKey: 'push-2',
      planFingerprint: 'sha256:plan-2',
    });
    expect(retry).toEqual({ job: first.job, created: false });

    const claimed = await store.claim(first.job.id, { leaseOwner: 'worker-a', leaseDurationMs: 1_000 });
    expect(claimed).toMatchObject({ claimToken: 'claim-1', status: 'running', attempt: 1 });
    await expect(store.claim(second.job.id, { leaseOwner: 'worker-b', leaseDurationMs: 1_000 })).resolves.toBeNull();
    await expect(
      store.reclaimExpired(first.job.id, { leaseOwner: 'worker-b', leaseDurationMs: 1_000 }),
    ).resolves.toBeNull();

    now = new Date('2026-07-16T00:00:02.000Z');
    const reclaimed = await store.reclaimExpired(first.job.id, { leaseOwner: 'worker-b', leaseDurationMs: 2_000 });
    expect(reclaimed).toMatchObject({ claimToken: 'claim-2', leaseOwner: 'worker-b', attempt: 2 });
    const renewed = await store.renewLease(first.job.id, 'claim-2', 3_000);
    expect(renewed.leaseExpiresAt).toBe('2026-07-16T00:00:05.000Z');

    const finalizePending = await store.markFinalizePending(first.job.id, 'claim-2', {
      resultRemoteRevision: 'remote-2',
      contentHash: 'sha256:content-2',
    });
    expect(finalizePending).toMatchObject({ status: 'finalize-pending', phase: 'finalize-pending', claimToken: null });
    await expect(store.listRecoverable()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: first.job.id, status: 'finalize-pending' }),
        expect.objectContaining({ id: second.job.id, status: 'pending' }),
      ]),
    );

    const restartedStore = new SyncJobStore(
      db,
      () => now,
      () => claimTokens.shift() || 'claim-fallback',
    );
    const finalizeClaim = await restartedStore.claim(first.job.id, {
      leaseOwner: 'reconciler',
      leaseDurationMs: 1_000,
    });
    expect(finalizeClaim).toMatchObject({ status: 'finalize-pending', claimToken: 'claim-3' });
    await restartedStore.succeed(first.job.id, 'claim-3');

    const secondClaim = await restartedStore.claim(second.job.id, {
      leaseOwner: 'worker-b',
      leaseDurationMs: 1_000,
    });
    expect(secondClaim).toMatchObject({ status: 'running', claimToken: 'claim-4' });
  });

  it('writes mappings and conflicts idempotently', async () => {
    const repoId = await createRepository('idempotent-baselines');
    const remote = await createRemote(new RemoteStore(db), repoId);
    const mapStore = new ExternalCommitMapStore(db);
    const conflictStore = new ConflictStore(db);
    const mapInput = {
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      localCommitId: 'local-1',
      remoteRevision: 'remote-1',
      contentHash: 'sha256:content-1',
    };
    const conflictInput = {
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      baseLocalCommitId: 'local-0',
      baseRemoteRevision: 'remote-0',
      currentLocalCommitId: 'local-1',
      currentRemoteRevision: 'remote-1',
      localContentHash: 'sha256:local-1',
      remoteContentHash: 'sha256:remote-1',
      reasonCode: 'diverged',
    };

    const firstMap = await mapStore.record(mapInput);
    const secondMap = await mapStore.record(mapInput);
    expect(secondMap.id).toBe(firstMap.id);
    await expect(db.getRepository('vscFileExternalCommitMaps').count()).resolves.toBe(1);

    const firstConflict = await conflictStore.upsert(conflictInput);
    const secondConflict = await conflictStore.upsert(conflictInput);
    expect(secondConflict.id).toBe(firstConflict.id);
    await expect(db.getRepository('vscFileConflicts').count()).resolves.toBe(1);

    await conflictStore.resolve(firstConflict.id);
    const reopened = await conflictStore.upsert(conflictInput);
    expect(reopened).toMatchObject({ id: firstConflict.id, status: 'open', resolvedAt: null });
    await expect(db.getRepository('vscFileConflicts').count()).resolves.toBe(1);
  });

  it('blocks lifecycle changes until active and finalize-pending jobs become terminal', async () => {
    const repoId = await createRepository('protected-lifecycle');
    const remoteStore = new RemoteStore(db);
    const remote = await createRemote(remoteStore, repoId);
    const jobStore = new SyncJobStore(
      db,
      () => new Date('2026-07-16T00:00:00.000Z'),
      () => 'claim-1',
    );
    const job = (
      await jobStore.createOrGet({
        remoteId: remote.id,
        remoteTargetVersion: remote.version,
        operation: 'push',
        idempotencyKey: 'protected-push',
      })
    ).job;

    await expect(
      remoteStore.updateTarget(remote.id, {
        provider: 'github',
        config: { ...normalizedConfig, branch: 'next' },
        authRef: remote.authRef,
      }),
    ).rejects.toMatchObject({ code: 'BUSY' });
    await expect(remoteStore.rotateAuthRef(remote.id, '{{ $env.ROTATED }}')).rejects.toMatchObject({ code: 'BUSY' });
    await expect(
      remoteStore.updateTarget(remote.id, {
        provider: 'github',
        config: normalizedConfig,
        authRef: '{{ $env.ROTATED }}',
      }),
    ).rejects.toMatchObject({ code: 'BUSY' });
    await expect(remoteStore.disconnect(remote.id)).rejects.toMatchObject({ code: 'BUSY' });
    await expect(remoteStore.deleteRemote(remote.id)).rejects.toMatchObject({ code: 'BUSY' });
    await expect(remoteStore.deleteRepository(repoId)).rejects.toMatchObject({ code: 'BUSY' });

    await jobStore.claim(job.id, { leaseOwner: 'worker', leaseDurationMs: 1_000 });
    await jobStore.markFinalizePending(job.id, 'claim-1', { resultRemoteRevision: 'remote-1' });
    await expect(remoteStore.disconnect(remote.id)).rejects.toMatchObject({ code: 'BUSY' });

    const finalizeClaim = await jobStore.claim(job.id, { leaseOwner: 'reconciler', leaseDurationMs: 1_000 });
    await jobStore.succeed(job.id, finalizeClaim?.claimToken || 'missing-claim');
    await new ExternalCommitMapStore(db).record({
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      localCommitId: 'local-1',
      remoteRevision: 'remote-1',
      contentHash: 'sha256:content-1',
    });
    await new ConflictStore(db).upsert({
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      baseLocalCommitId: null,
      baseRemoteRevision: null,
      currentLocalCommitId: 'local-2',
      currentRemoteRevision: 'remote-2',
      localContentHash: 'sha256:local-2',
      remoteContentHash: 'sha256:remote-2',
      reasonCode: 'diverged',
    });

    const disconnected = await remoteStore.disconnect(remote.id);
    expect(disconnected).toMatchObject({ status: 'disabled', authRef: null });

    await remoteStore.deleteRepository(repoId);
    await expect(db.getRepository('vscFileRemotes').count()).resolves.toBe(0);
    await expect(db.getRepository('vscFileSyncJobs').count()).resolves.toBe(0);
    await expect(db.getRepository('vscFileExternalCommitMaps').count()).resolves.toBe(0);
    await expect(db.getRepository('vscFileConflicts').count()).resolves.toBe(0);
  });

  it('rolls back writes from every Store when given an explicit transaction', async () => {
    const repoId = await createRepository('transaction-rollback');
    const remoteStore = new RemoteStore(db);
    const jobStore = new SyncJobStore(db);
    const mapStore = new ExternalCommitMapStore(db);
    const conflictStore = new ConflictStore(db);

    await expect(
      db.sequelize.transaction(async (transaction) => {
        const remote = await createRemote(remoteStore, repoId, transaction);
        await jobStore.createOrGet(
          {
            remoteId: remote.id,
            remoteTargetVersion: remote.version,
            operation: 'push',
            idempotencyKey: 'rollback-push',
          },
          transaction,
        );
        await mapStore.record(
          {
            remoteId: remote.id,
            remoteTargetVersion: remote.version,
            localCommitId: 'local-1',
            remoteRevision: 'remote-1',
            contentHash: 'sha256:content-1',
          },
          transaction,
        );
        await conflictStore.upsert(
          {
            remoteId: remote.id,
            remoteTargetVersion: remote.version,
            baseLocalCommitId: null,
            baseRemoteRevision: null,
            currentLocalCommitId: 'local-2',
            currentRemoteRevision: 'remote-2',
            localContentHash: 'sha256:local-2',
            remoteContentHash: 'sha256:remote-2',
            reasonCode: 'diverged',
          },
          transaction,
        );
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');

    await expect(db.getRepository('vscFileRemotes').count()).resolves.toBe(0);
    await expect(db.getRepository('vscFileSyncJobs').count()).resolves.toBe(0);
    await expect(db.getRepository('vscFileExternalCommitMaps').count()).resolves.toBe(0);
    await expect(db.getRepository('vscFileConflicts').count()).resolves.toBe(0);
  });

  async function createRepository(name: string): Promise<string> {
    const repository = await db.getRepository('vscFileRepositories').create({
      values: {
        ownerType: 'plugin',
        ownerId: name,
        name: 'main',
      },
    });
    return repository.get('id') as string;
  }

  async function createRemote(
    store: RemoteStore,
    repoId: string,
    transaction?: Parameters<RemoteStore['create']>[1],
  ): Promise<VscFileRemoteRecord> {
    return store.create(
      {
        repoId,
        name: 'origin',
        provider: 'github',
        config: normalizedConfig,
        authRef: '{{ $env.GITHUB_SYNC }}',
      },
      transaction,
    );
  }
});
