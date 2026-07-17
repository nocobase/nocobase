/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';

import type {
  RemoteSyncErrorCode,
  VscFileRemoteRecord,
  VscFileSyncJobRecord,
  VscRemoteSnapshot,
  VscRemoteSyncPlan,
} from '../../shared/remote-sync-types';
import type { VscRepositoryRecord } from '../../shared/types';
import type { VscPermissionRequestMetadata } from '../permissions';
import { VscPermissionHookRegistry } from '../permissions';
import { CommitService } from '../services/CommitService';
import { RepositoryService } from '../services/RepositoryService';
import { TreeService } from '../services/TreeService';
import { ConflictStore } from './ConflictStore';
import { ExternalCommitMapStore } from './ExternalCommitMapStore';
import { RemoteSyncError, type RemoteSyncAdapter } from './RemoteSyncAdapter';
import { RemoteSyncAdapterRegistry } from './RemoteSyncAdapterRegistry';
import { RemoteStore, remoteFromRecord } from './RemoteStore';
import { SyncJobStore, syncJobFromRecord } from './SyncJobStore';
import { SyncStatePlanner } from './SyncStatePlanner';
import { computeRemoteSnapshotContentHash } from './snapshot';
import { loadVscSnapshot, toRemoteSyncError } from './VscRemotePushService';

const defaultLeaseDurationMs = 30_000;
const defaultApplyLeaseDurationMs = 5 * 60_000;
const defaultMaxAttempts = 3;

export interface VscRemotePullDiscoveryInput {
  remoteId: string;
  expectedRepoId: string;
  expectedLocalCommitId: string | null;
  expectedRemoteRevision: string | null;
  expectedRemoteTargetVersion: number;
  planFingerprint: string;
  idempotencyKey?: string;
  maxAttempts?: number;
}

export interface VscRemotePullDiscoveryContext {
  authorId?: string | null;
  request?: VscPermissionRequestMetadata;
  leaseOwner?: string;
  leaseDurationMs?: number;
}

export interface VscRemotePullHandle {
  remote: VscFileRemoteRecord;
  jobId: string;
  claimToken: string;
  expectedLocalCommitId: string | null;
  expectedRemoteRevision: string;
  expectedRemoteTargetVersion: number;
  planFingerprint: string;
  snapshot: VscRemoteSnapshot;
}

export interface VscRemotePullDiscoveryResult {
  remote: VscFileRemoteRecord;
  job: VscFileSyncJobRecord;
  snapshot: VscRemoteSnapshot;
  plan: VscRemoteSyncPlan;
  applyRequired: boolean;
  handle: VscRemotePullHandle | null;
}

export interface VscRemotePullApplyResult {
  localCommitId: string;
  contentHash: string;
}

export interface VscRemotePullDiscoveryServiceOptions {
  adapterRegistry: RemoteSyncAdapterRegistry;
  permissionHooks?: VscPermissionHookRegistry;
  remoteStore?: RemoteStore;
  jobStore?: SyncJobStore;
  mapStore?: ExternalCommitMapStore;
  conflictStore?: ConflictStore;
  planner?: SyncStatePlanner;
  repositoryService?: RepositoryService;
  commitService?: CommitService;
  treeService?: TreeService;
  leaseOwner?: string;
  leaseDurationMs?: number;
  applyLeaseDurationMs?: number;
}

export interface VscRemotePullOwnerApply<TOwner, TResult> {
  lockOwner(transaction: Transaction): Promise<TOwner>;
  applyOwnerSnapshot(
    transaction: Transaction,
    remote: VscFileRemoteRecord,
    owner: TOwner,
  ): Promise<VscRemotePullApplyResult & TResult>;
}

interface PreparedPull {
  remote: VscFileRemoteRecord;
  repository: VscRepositoryRecord;
  job: VscFileSyncJobRecord;
  localSnapshot: VscRemoteSnapshot;
  completedSnapshot?: VscRemoteSnapshot;
}

export class VscRemotePullDiscoveryService {
  private readonly adapterRegistry: RemoteSyncAdapterRegistry;

  private readonly permissionHooks: VscPermissionHookRegistry;

  private readonly remoteStore: RemoteStore;

  private readonly jobStore: SyncJobStore;

  private readonly mapStore: ExternalCommitMapStore;

  private readonly conflictStore: ConflictStore;

  private readonly planner: SyncStatePlanner;

  private readonly repositoryService: RepositoryService;

  private readonly commitService: CommitService;

  private readonly treeService: TreeService;

  private readonly leaseOwner: string;

  private readonly leaseDurationMs: number;

  private readonly applyLeaseDurationMs: number;

  constructor(
    private readonly db: Database,
    options: VscRemotePullDiscoveryServiceOptions,
  ) {
    this.adapterRegistry = options.adapterRegistry;
    this.permissionHooks = options.permissionHooks || new VscPermissionHookRegistry();
    this.remoteStore = options.remoteStore || new RemoteStore(db);
    this.jobStore = options.jobStore || new SyncJobStore(db);
    this.mapStore = options.mapStore || new ExternalCommitMapStore(db);
    this.conflictStore = options.conflictStore || new ConflictStore(db);
    this.planner = options.planner || new SyncStatePlanner();
    this.repositoryService = options.repositoryService || new RepositoryService(db);
    this.commitService = options.commitService || new CommitService(db);
    this.treeService = options.treeService || new TreeService(db);
    this.leaseOwner = options.leaseOwner ?? 'vsc-remote-pull';
    this.leaseDurationMs = options.leaseDurationMs ?? defaultLeaseDurationMs;
    this.applyLeaseDurationMs = options.applyLeaseDurationMs ?? defaultApplyLeaseDurationMs;
  }

  async discover(
    input: VscRemotePullDiscoveryInput,
    ctx: VscRemotePullDiscoveryContext = {},
  ): Promise<VscRemotePullDiscoveryResult> {
    const leaseDurationMs = ctx.leaseDurationMs ?? this.leaseDurationMs;
    const prepared = await this.prepare(input, ctx, ctx.leaseOwner ?? this.leaseOwner, leaseDurationMs);
    if (prepared.job.status === 'succeeded') {
      return this.completedResult(prepared);
    }
    const claimToken = requireClaimToken(prepared.job);

    try {
      const adapter = this.adapterRegistry.require(prepared.remote.provider);
      await this.jobStore.advancePhase(prepared.job.id, claimToken, { phase: 'remote-started' });
      let remoteSnapshot: VscRemoteSnapshot;
      try {
        remoteSnapshot = await this.runWithLeaseHeartbeat(prepared.job.id, claimToken, leaseDurationMs, () =>
          adapter.fetchSnapshot(remoteTarget(prepared.remote), input.expectedRemoteRevision),
        );
      } catch (error) {
        const fetchError = toRemoteSyncError(error);
        if (prepared.job.attempt > 1 && isUnprovablePinnedRevision(fetchError)) {
          await this.failUnprovableRecovery(prepared, claimToken, fetchError);
        }
        throw fetchError;
      }
      if (remoteSnapshot.revision !== input.expectedRemoteRevision) {
        if (prepared.job.attempt > 1) {
          await this.failWithConflict(
            prepared,
            claimToken,
            remoteSnapshot,
            'remote-changed-before-pull',
            'REMOTE_CHANGED',
          );
        } else {
          await this.safeFail(prepared.job.id, claimToken, 'REMOTE_CHANGED');
        }
        throw new RemoteSyncError('REMOTE_CHANGED', 'Remote revision changed before pull discovery', {
          details: {
            provider: prepared.remote.provider,
            operation: 'fetch',
            reasonCode: 'remote-changed-before-pull',
            expectedRemoteRevision: input.expectedRemoteRevision,
            currentRemoteRevision: remoteSnapshot.revision,
          },
        });
      }
      assertSnapshotIntegrity(remoteSnapshot);

      const plan = await this.createPlan(prepared, remoteSnapshot, adapter);
      if (plan.fingerprint !== input.planFingerprint) {
        if (prepared.job.attempt > 1) {
          await this.failWithConflict(
            prepared,
            claimToken,
            remoteSnapshot,
            'plan-fingerprint-changed',
            'REMOTE_CHANGED',
          );
        } else {
          await this.safeFail(prepared.job.id, claimToken, 'REMOTE_CHANGED');
        }
        throw new RemoteSyncError('REMOTE_CHANGED', 'Remote synchronization plan changed', {
          details: { reasonCode: 'plan-fingerprint-changed' },
        });
      }

      if (plan.action === 'conflict') {
        await this.failWithConflict(prepared, claimToken, remoteSnapshot, plan.reasonCode || plan.action, 'DIVERGED');
        throw new RemoteSyncError('DIVERGED', 'Remote synchronization requires conflict resolution', {
          details: { reasonCode: plan.reasonCode || plan.action },
        });
      }
      if (plan.action === 'fetch-required') {
        await this.safeFail(prepared.job.id, claimToken, 'REMOTE_UNAVAILABLE');
        throw new RemoteSyncError('REMOTE_UNAVAILABLE', 'Remote snapshot content remains unavailable after fetch', {
          details: { reasonCode: 'remote-content-unknown' },
        });
      }
      if (plan.action === 'pull' && !plan.canPull) {
        await this.safeFail(prepared.job.id, claimToken, 'PERMISSION_DENIED');
        throw new RemoteSyncError('PERMISSION_DENIED', 'Remote provider does not allow snapshot fetch', {
          details: { provider: prepared.remote.provider, operation: 'fetch', reasonCode: 'pull-not-available' },
        });
      }
      if (plan.action === 'pull' && !remoteSnapshot.revision) {
        await this.failWithConflict(prepared, claimToken, remoteSnapshot, 'remote-revision-missing', 'UNSAFE_CONTENT');
        throw new RemoteSyncError('UNSAFE_CONTENT', 'Fetched remote snapshot has no immutable revision', {
          details: { reasonCode: 'remote-revision-missing' },
        });
      }

      const job = await this.jobStore.advancePhase(prepared.job.id, claimToken, {
        phase: 'remote-succeeded',
        resultRemoteRevision: remoteSnapshot.revision,
        contentHash: remoteSnapshot.contentHash,
      });
      if (plan.action !== 'pull') {
        const finalized =
          plan.action === 'noop' || plan.action === 'establish-mapping' || plan.action === 'repair-mapping'
            ? await this.finalizeWithoutApply(prepared, remoteSnapshot, claimToken)
            : await this.finishWithoutApply(prepared, remoteSnapshot, claimToken);
        return withInternalHandle({
          remote: await this.remoteStore.get(prepared.remote.id),
          job: finalized,
          snapshot: remoteSnapshot,
          plan,
          applyRequired: false,
          handle: null,
        });
      }

      return withInternalHandle({
        remote: prepared.remote,
        job,
        snapshot: remoteSnapshot,
        plan,
        applyRequired: true,
        handle: {
          remote: prepared.remote,
          jobId: job.id,
          claimToken,
          expectedLocalCommitId: input.expectedLocalCommitId,
          expectedRemoteRevision: remoteSnapshot.revision as string,
          expectedRemoteTargetVersion: input.expectedRemoteTargetVersion,
          planFingerprint: input.planFingerprint,
          snapshot: remoteSnapshot,
        },
      });
    } catch (error) {
      const safeError = toRemoteSyncError(error);
      await this.safeFail(prepared.job.id, claimToken, safeError.code);
      throw safeError;
    }
  }

  async apply<TOwner, TResult>(
    handle: VscRemotePullHandle,
    ownerApply: VscRemotePullOwnerApply<TOwner, TResult>,
  ): Promise<{ job: VscFileSyncJobRecord; result: VscRemotePullApplyResult & TResult }> {
    assertSnapshotIntegrity(handle.snapshot);
    if (handle.snapshot.revision !== handle.expectedRemoteRevision) {
      throw new RemoteSyncError('REMOTE_CHANGED', 'Pull snapshot handle revision is inconsistent', {
        details: { reasonCode: 'pull-handle-revision-mismatch' },
      });
    }

    return this.db.sequelize.transaction(async (transaction) => {
      const owner = await ownerApply.lockOwner(transaction);
      const remoteRecord = await this.lockRemote(handle.remote.id, transaction);
      const remote = remoteFromRecord(remoteRecord);
      const repository = await this.repositoryService.getRepositoryForUpdate(remote.repoId, transaction);
      const jobRecord = await this.lockJob(handle.jobId, transaction);
      let job = syncJobFromRecord(jobRecord);
      assertApplyGuards(remote, repository, job, handle);
      await jobRecord.update(
        {
          leaseExpiresAt: new Date(Date.now() + this.applyLeaseDurationMs),
          heartbeatAt: new Date(),
        },
        { transaction },
      );
      job = syncJobFromRecord(jobRecord);

      const result = await ownerApply.applyOwnerSnapshot(transaction, remote, owner);
      if (result.contentHash !== handle.snapshot.contentHash) {
        throw new RemoteSyncError('UNSAFE_CONTENT', 'Owner applied a snapshot with an unexpected content hash', {
          details: { reasonCode: 'owner-apply-content-mismatch' },
        });
      }
      const appliedRepository = await this.repositoryService.getRepositoryForUpdate(remote.repoId, transaction);
      if (appliedRepository.headCommitId !== result.localCommitId) {
        throw new RemoteSyncError('LOCAL_OUTDATED', 'Owner apply result does not match the VSC repository Head', {
          details: {
            reasonCode: 'owner-apply-head-mismatch',
            expectedHeadCommitId: result.localCommitId,
            currentHeadCommitId: appliedRepository.headCommitId,
          },
        });
      }
      await this.mapStore.record(
        {
          remoteId: remote.id,
          remoteTargetVersion: remote.version,
          localCommitId: result.localCommitId,
          remoteRevision: handle.expectedRemoteRevision,
          contentHash: result.contentHash,
        },
        transaction,
      );
      await this.remoteStore.recordSync(
        remote.id,
        { remoteTargetVersion: remote.version, lastErrorCode: null },
        transaction,
      );
      const completed = await this.jobStore.succeed(
        job.id,
        handle.claimToken,
        {
          resultLocalCommitId: result.localCommitId,
          resultRemoteRevision: handle.expectedRemoteRevision,
          contentHash: result.contentHash,
        },
        transaction,
      );
      return { job: completed, result };
    });
  }

  async failApply(handle: VscRemotePullHandle, code: RemoteSyncErrorCode): Promise<void> {
    await this.db.sequelize.transaction(async (transaction) => {
      await this.lockRemote(handle.remote.id, transaction);
      const jobRecord = await this.lockJob(handle.jobId, transaction);
      const job = syncJobFromRecord(jobRecord);
      if (job.status === 'failed' || job.status === 'succeeded') {
        return;
      }
      if (job.claimToken !== handle.claimToken) {
        throw new RemoteSyncError('BUSY', 'Pull discovery claim is no longer owned by this worker', {
          details: { reasonCode: 'claim-token-mismatch' },
        });
      }
      await jobRecord.update(
        {
          leaseExpiresAt: new Date(Date.now() + this.leaseDurationMs),
          heartbeatAt: new Date(),
        },
        { transaction },
      );
      await this.jobStore.fail(handle.jobId, handle.claimToken, code, transaction);
    });
  }

  /** Pull recovery must be routed back through discovery/owner apply, never through the push reconciler. */
  async listRecoverablePullJobs(): Promise<VscFileSyncJobRecord[]> {
    const jobs = await this.jobStore.listRecoverable();
    return jobs.filter((job) => job.operation === 'pull');
  }

  private async prepare(
    input: VscRemotePullDiscoveryInput,
    ctx: VscRemotePullDiscoveryContext,
    leaseOwner: string,
    leaseDurationMs: number,
  ): Promise<PreparedPull> {
    return this.db.sequelize.transaction(async (transaction) => {
      const remoteRecord = await this.lockRemote(input.remoteId, transaction);
      const remote = remoteFromRecord(remoteRecord);
      if (remote.status !== 'active') {
        throw new RemoteSyncError('CONFIG_INVALID', 'Remote is disabled', {
          details: { reasonCode: 'remote-disabled' },
        });
      }
      if (remote.version !== input.expectedRemoteTargetVersion) {
        throw new RemoteSyncError('REMOTE_CHANGED', 'Remote target version changed', {
          details: { reasonCode: 'remote-target-version-changed', remoteTargetVersion: remote.version },
        });
      }
      if (remote.repoId !== input.expectedRepoId) {
        throw new RemoteSyncError('PERMISSION_DENIED', 'Remote does not belong to the expected repository', {
          details: { reasonCode: 'remote-repository-mismatch' },
        });
      }

      const repository = await this.repositoryService.getRepositoryForUpdate(remote.repoId, transaction);
      await this.assertPermission(remote, repository, ctx);
      const idempotencyKey =
        input.idempotencyKey ||
        `pull:${remote.id}:${remote.version}:${input.expectedLocalCommitId || 'empty'}:${
          input.expectedRemoteRevision || 'empty'
        }:${input.planFingerprint}`;
      const created = await this.jobStore.createOrGet(
        {
          remoteId: remote.id,
          remoteTargetVersion: remote.version,
          operation: 'pull',
          idempotencyKey,
          planFingerprint: input.planFingerprint,
          expectedLocalCommitId: input.expectedLocalCommitId,
          expectedRemoteRevision: input.expectedRemoteRevision,
          maxAttempts: input.maxAttempts ?? defaultMaxAttempts,
        },
        transaction,
      );
      if (created.job.status === 'succeeded') {
        const localSnapshot = await loadVscSnapshot(
          this.db,
          this.commitService,
          this.treeService,
          repository.id,
          repository.headCommitId,
          transaction,
        );
        const completedSnapshot = await this.loadCompletedSnapshot(remote, repository, created.job, transaction);
        return { remote, repository, job: created.job, localSnapshot, completedSnapshot };
      }
      if (created.job.status === 'failed') {
        throw new RemoteSyncError(created.job.lastErrorCode || 'REMOTE_UNAVAILABLE', 'Synchronization job has failed', {
          details: { reasonCode: 'sync-job-failed' },
        });
      }
      if (repository.status === 'archived') {
        throw new RemoteSyncError('REPO_ARCHIVED', `Repository "${repository.id}" is archived`);
      }
      if (repository.headCommitId !== input.expectedLocalCommitId) {
        throw new RemoteSyncError('LOCAL_OUTDATED', 'Local repository head changed', {
          details: {
            reasonCode: 'local-head-changed',
            expectedHeadCommitId: input.expectedLocalCommitId,
            currentHeadCommitId: repository.headCommitId,
          },
        });
      }
      const localSnapshot = await loadVscSnapshot(
        this.db,
        this.commitService,
        this.treeService,
        repository.id,
        repository.headCommitId,
        transaction,
      );

      const claimed = await this.jobStore.claim(created.job.id, { leaseOwner, leaseDurationMs }, transaction);
      if (!claimed) {
        throw new RemoteSyncError('BUSY', 'Remote has an active synchronization job', {
          details: { reasonCode: 'active-sync-job' },
        });
      }
      const job = await this.jobStore.advancePhase(
        claimed.id,
        requireClaimToken(claimed),
        { phase: 'prepared' },
        transaction,
      );
      return { remote, repository, job, localSnapshot };
    });
  }

  private async createPlan(
    prepared: PreparedPull,
    remoteSnapshot: VscRemoteSnapshot,
    adapter: RemoteSyncAdapter,
  ): Promise<VscRemoteSyncPlan> {
    const baseline = await this.mapStore.findLatest(prepared.remote.id);
    return this.planner.plan({
      configured: true,
      remoteId: prepared.remote.id,
      provider: prepared.remote.provider,
      remoteTargetVersion: prepared.remote.version,
      direction: 'pull',
      capabilities: {
        canPull: adapter.capabilities.fetch,
        canPush: adapter.capabilities.publish && !adapter.capabilities.readOnly,
      },
      local: {
        headCommitId: prepared.repository.headCommitId,
        contentHash: prepared.localSnapshot.contentHash,
      },
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
  }

  private async finalizeWithoutApply(
    prepared: PreparedPull,
    remoteSnapshot: VscRemoteSnapshot,
    claimToken: string,
  ): Promise<VscFileSyncJobRecord> {
    return this.finalizeNoApply(prepared, remoteSnapshot, claimToken, true);
  }

  private async finishWithoutApply(
    prepared: PreparedPull,
    remoteSnapshot: VscRemoteSnapshot,
    claimToken: string,
  ): Promise<VscFileSyncJobRecord> {
    return this.finalizeNoApply(prepared, remoteSnapshot, claimToken, false);
  }

  private async finalizeNoApply(
    prepared: PreparedPull,
    remoteSnapshot: VscRemoteSnapshot,
    claimToken: string,
    recordMapping: boolean,
  ): Promise<VscFileSyncJobRecord> {
    return this.db.sequelize.transaction(async (transaction) => {
      const remote = remoteFromRecord(await this.lockRemote(prepared.remote.id, transaction));
      const repository = await this.repositoryService.getRepositoryForUpdate(remote.repoId, transaction);
      const job = syncJobFromRecord(await this.lockJob(prepared.job.id, transaction));
      assertNoApplyGuards(remote, repository, job, prepared, remoteSnapshot, claimToken);
      if (recordMapping && repository.headCommitId && remoteSnapshot.revision) {
        await this.mapStore.record(
          {
            remoteId: remote.id,
            remoteTargetVersion: remote.version,
            localCommitId: repository.headCommitId,
            remoteRevision: remoteSnapshot.revision,
            contentHash: remoteSnapshot.contentHash,
          },
          transaction,
        );
      }
      if (recordMapping) {
        await this.remoteStore.recordSync(
          remote.id,
          { remoteTargetVersion: remote.version, lastErrorCode: null },
          transaction,
        );
      }
      return this.jobStore.succeed(
        job.id,
        claimToken,
        {
          resultLocalCommitId: repository.headCommitId,
          resultRemoteRevision: remoteSnapshot.revision,
          contentHash: remoteSnapshot.contentHash,
        },
        transaction,
      );
    });
  }

  private async failWithConflict(
    prepared: PreparedPull,
    claimToken: string,
    remoteSnapshot: VscRemoteSnapshot,
    reasonCode: string,
    errorCode: RemoteSyncErrorCode,
  ): Promise<void> {
    await this.db.sequelize.transaction(async (transaction) => {
      const baseline = await this.mapStore.findLatest(prepared.remote.id, transaction);
      await this.conflictStore.upsert(
        {
          remoteId: prepared.remote.id,
          remoteTargetVersion: prepared.remote.version,
          baseLocalCommitId: baseline?.localCommitId || null,
          baseRemoteRevision: baseline?.remoteRevision || null,
          currentLocalCommitId: prepared.repository.headCommitId,
          currentRemoteRevision: remoteSnapshot.revision,
          localContentHash: prepared.localSnapshot.contentHash,
          remoteContentHash: remoteSnapshot.contentHash,
          reasonCode,
        },
        transaction,
      );
      await this.jobStore.fail(prepared.job.id, claimToken, errorCode, transaction);
    });
  }

  private async failUnprovableRecovery(
    prepared: PreparedPull,
    claimToken: string,
    error: RemoteSyncError,
  ): Promise<void> {
    await this.db.sequelize.transaction(async (transaction) => {
      const baseline = await this.mapStore.findLatest(prepared.remote.id, transaction);
      await this.conflictStore.upsert(
        {
          remoteId: prepared.remote.id,
          remoteTargetVersion: prepared.remote.version,
          baseLocalCommitId: baseline?.localCommitId || null,
          baseRemoteRevision: baseline?.remoteRevision || null,
          currentLocalCommitId: prepared.repository.headCommitId,
          currentRemoteRevision: error.details?.currentRemoteRevision || null,
          localContentHash: prepared.localSnapshot.contentHash,
          remoteContentHash: null,
          reasonCode: 'pinned-revision-unavailable',
        },
        transaction,
      );
      await this.jobStore.fail(prepared.job.id, claimToken, error.code, transaction);
    });
  }

  private async loadCompletedSnapshot(
    remote: VscFileRemoteRecord,
    repository: VscRepositoryRecord,
    job: VscFileSyncJobRecord,
    transaction: Transaction,
  ): Promise<VscRemoteSnapshot> {
    const emptyFiles: VscRemoteSnapshot['files'] = [];
    const emptyContentHash = computeRemoteSnapshotContentHash(emptyFiles);
    if (job.resultRemoteRevision === null && job.contentHash === emptyContentHash) {
      return { revision: null, contentHash: emptyContentHash, files: emptyFiles, metadata: {} };
    }

    const mapping = job.resultRemoteRevision
      ? await this.mapStore.findByRemoteRevision(remote.id, job.resultRemoteRevision, transaction)
      : null;
    const mappedCommitId =
      mapping?.remoteTargetVersion === remote.version &&
      mapping.remoteRevision === job.resultRemoteRevision &&
      mapping.contentHash === job.contentHash
        ? mapping.localCommitId
        : null;
    const snapshot = await loadVscSnapshot(
      this.db,
      this.commitService,
      this.treeService,
      repository.id,
      mappedCommitId || job.resultLocalCommitId,
      transaction,
    );
    if (!job.contentHash || snapshot.contentHash !== job.contentHash) {
      throw new RemoteSyncError('UNSAFE_CONTENT', 'Completed pull snapshot can no longer be reconstructed', {
        details: { reasonCode: 'completed-pull-content-mismatch' },
      });
    }
    return {
      ...snapshot,
      revision: job.resultRemoteRevision,
      contentHash: job.contentHash,
    };
  }

  private async assertPermission(
    remote: VscFileRemoteRecord,
    repository: VscRepositoryRecord,
    ctx: VscRemotePullDiscoveryContext,
  ): Promise<void> {
    try {
      await this.permissionHooks.assertAllowed({
        userId: ctx.authorId ?? null,
        action: 'pull',
        repoId: repository.id,
        repository: { ...repository },
        ownerType: repository.ownerType,
        ownerId: repository.ownerId,
        request: ctx.request,
        actionMetadata: { operation: 'remote-pull', remoteId: remote.id },
      });
    } catch (error) {
      throw toRemoteSyncError(error);
    }
  }

  private async completedResult(prepared: PreparedPull): Promise<VscRemotePullDiscoveryResult> {
    const snapshot = prepared.completedSnapshot;
    if (!snapshot) {
      throw new RemoteSyncError('UNSAFE_CONTENT', 'Completed pull snapshot is unavailable', {
        details: { reasonCode: 'completed-pull-snapshot-missing' },
      });
    }
    const plan = await this.createPlan(prepared, snapshot, this.adapterRegistry.require(prepared.remote.provider));
    return {
      remote: prepared.remote,
      job: prepared.job,
      snapshot,
      plan,
      applyRequired: false,
      handle: null,
    };
  }

  private async safeFail(jobId: string, claimToken: string, code: RemoteSyncErrorCode): Promise<void> {
    try {
      await this.jobStore.fail(jobId, claimToken, code);
    } catch {
      // A lost lease leaves the durable job for the next claimant instead of overwriting it.
    }
  }

  private async runWithLeaseHeartbeat<T>(
    jobId: string,
    claimToken: string,
    leaseDurationMs: number,
    action: () => Promise<T>,
  ): Promise<T> {
    const intervalMs = Math.max(10, Math.floor(leaseDurationMs / 3));
    let heartbeatError: RemoteSyncError | null = null;
    let heartbeat = Promise.resolve();
    const timer = setInterval(() => {
      heartbeat = heartbeat
        .then(() => this.jobStore.renewLease(jobId, claimToken, leaseDurationMs))
        .then(() => undefined)
        .catch((error: unknown) => {
          heartbeatError = toRemoteSyncError(error);
        });
    }, intervalMs);

    try {
      const result = await action();
      await heartbeat;
      if (heartbeatError) {
        throw heartbeatError;
      }
      await this.jobStore.renewLease(jobId, claimToken, leaseDurationMs);
      return result;
    } finally {
      clearInterval(timer);
      await heartbeat;
    }
  }

  private async lockRemote(remoteId: string, transaction: Transaction): Promise<Model> {
    const record = await this.db.getModel<Model>('vscFileRemotes').findByPk(remoteId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!record) {
      throw new RemoteSyncError('REMOTE_NOT_FOUND', `Remote "${remoteId}" was not found`);
    }
    return record;
  }

  private async lockJob(jobId: string, transaction: Transaction): Promise<Model> {
    const record = await this.db.getModel<Model>('vscFileSyncJobs').findByPk(jobId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!record) {
      throw new RemoteSyncError('REMOTE_NOT_FOUND', `Synchronization job "${jobId}" was not found`, {
        details: { reasonCode: 'sync-job-not-found' },
      });
    }
    return record;
  }
}

function assertApplyGuards(
  remote: VscFileRemoteRecord,
  repository: VscRepositoryRecord,
  job: VscFileSyncJobRecord,
  handle: VscRemotePullHandle,
): void {
  if (remote.status !== 'active') {
    throw new RemoteSyncError('CONFIG_INVALID', 'Remote is disabled', { details: { reasonCode: 'remote-disabled' } });
  }
  if (remote.version !== handle.expectedRemoteTargetVersion || job.remoteTargetVersion !== remote.version) {
    throw new RemoteSyncError('REMOTE_CHANGED', 'Remote target version changed', {
      details: { reasonCode: 'remote-target-version-changed', remoteTargetVersion: remote.version },
    });
  }
  if (repository.status === 'archived') {
    throw new RemoteSyncError('REPO_ARCHIVED', `Repository "${repository.id}" is archived`);
  }
  if (repository.headCommitId !== handle.expectedLocalCommitId) {
    throw new RemoteSyncError('LOCAL_OUTDATED', 'Local repository head changed', {
      details: {
        reasonCode: 'local-head-changed',
        expectedHeadCommitId: handle.expectedLocalCommitId,
        currentHeadCommitId: repository.headCommitId,
      },
    });
  }
  if (
    job.operation !== 'pull' ||
    job.status !== 'running' ||
    job.phase !== 'remote-succeeded' ||
    job.claimToken !== handle.claimToken ||
    job.expectedLocalCommitId !== handle.expectedLocalCommitId ||
    job.expectedRemoteRevision !== handle.expectedRemoteRevision ||
    job.resultRemoteRevision !== handle.expectedRemoteRevision ||
    job.planFingerprint !== handle.planFingerprint ||
    job.contentHash !== handle.snapshot.contentHash
  ) {
    throw new RemoteSyncError('BUSY', 'Pull discovery claim is no longer valid', {
      details: { reasonCode: 'pull-claim-invalid' },
    });
  }
  const leaseExpiresAt = job.leaseExpiresAt ? new Date(job.leaseExpiresAt) : null;
  if (!leaseExpiresAt || Number.isNaN(leaseExpiresAt.getTime()) || leaseExpiresAt.getTime() <= Date.now()) {
    throw new RemoteSyncError('BUSY', 'Synchronization job lease has expired', {
      details: { reasonCode: 'lease-expired' },
    });
  }
}

function assertNoApplyGuards(
  remote: VscFileRemoteRecord,
  repository: VscRepositoryRecord,
  job: VscFileSyncJobRecord,
  prepared: PreparedPull,
  snapshot: VscRemoteSnapshot,
  claimToken: string,
): void {
  if (remote.status !== 'active') {
    throw new RemoteSyncError('CONFIG_INVALID', 'Remote is disabled', {
      details: { reasonCode: 'remote-disabled' },
    });
  }
  if (remote.version !== prepared.remote.version || job.remoteTargetVersion !== remote.version) {
    throw new RemoteSyncError('REMOTE_CHANGED', 'Remote target version changed', {
      details: { reasonCode: 'remote-target-version-changed', remoteTargetVersion: remote.version },
    });
  }
  if (repository.status === 'archived') {
    throw new RemoteSyncError('REPO_ARCHIVED', `Repository "${repository.id}" is archived`);
  }
  if (repository.headCommitId !== prepared.repository.headCommitId) {
    throw new RemoteSyncError('LOCAL_OUTDATED', 'Local repository head changed', {
      details: {
        reasonCode: 'local-head-changed',
        expectedHeadCommitId: prepared.repository.headCommitId,
        currentHeadCommitId: repository.headCommitId,
      },
    });
  }
  if (
    job.operation !== 'pull' ||
    job.status !== 'running' ||
    job.phase !== 'remote-succeeded' ||
    job.claimToken !== claimToken ||
    job.resultRemoteRevision !== snapshot.revision ||
    job.contentHash !== snapshot.contentHash ||
    job.planFingerprint !== prepared.job.planFingerprint
  ) {
    throw new RemoteSyncError('BUSY', 'Pull discovery claim is no longer valid', {
      details: { reasonCode: 'pull-claim-invalid' },
    });
  }
  const leaseExpiresAt = job.leaseExpiresAt ? new Date(job.leaseExpiresAt) : null;
  if (!leaseExpiresAt || Number.isNaN(leaseExpiresAt.getTime()) || leaseExpiresAt.getTime() <= Date.now()) {
    throw new RemoteSyncError('BUSY', 'Synchronization job lease has expired', {
      details: { reasonCode: 'lease-expired' },
    });
  }
}

function assertSnapshotIntegrity(snapshot: VscRemoteSnapshot): void {
  if (computeRemoteSnapshotContentHash(snapshot.files) !== snapshot.contentHash) {
    throw new RemoteSyncError('UNSAFE_CONTENT', 'Remote snapshot content hash is inconsistent', {
      details: { reasonCode: 'snapshot-content-hash-mismatch' },
    });
  }
}

function isUnprovablePinnedRevision(error: RemoteSyncError): boolean {
  return error.code === 'REMOTE_CHANGED' || error.code === 'REMOTE_NOT_FOUND';
}

function remoteTarget(remote: VscFileRemoteRecord) {
  return { config: remote.config, authRef: remote.authRef };
}

function requireClaimToken(job: VscFileSyncJobRecord): string {
  if (!job.claimToken) {
    throw new RemoteSyncError('BUSY', 'Synchronization job is not claimed', {
      details: { reasonCode: 'sync-job-not-claimed' },
    });
  }
  return job.claimToken;
}

function withInternalHandle(result: VscRemotePullDiscoveryResult): VscRemotePullDiscoveryResult {
  const handle = result.handle;
  const safeResult = { ...result, handle: null };
  Object.defineProperty(safeResult, 'handle', {
    value: handle,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return safeResult;
}
