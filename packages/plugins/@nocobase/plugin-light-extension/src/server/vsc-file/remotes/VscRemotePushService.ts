/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';

import { VscError } from '../../../shared/vsc-file/errors';
import type {
  RemoteSyncErrorCode,
  VscFileRemoteRecord,
  VscFileSyncJobRecord,
  VscRemoteSnapshot,
  VscRemoteSyncPlan,
} from '../../../shared/vsc-file/remote-sync-types';
import type { VscRepositoryRecord } from '../../../shared/vsc-file/types';
import type { VscPermissionRequestMetadata } from '../permissions';
import { VscPermissionHookRegistry } from '../permissions';
import { CommitService } from '../services/CommitService';
import { RepositoryService } from '../services/RepositoryService';
import { TreeService } from '../services/TreeService';
import { ConflictStore } from './ConflictStore';
import { ExternalCommitMapStore } from './ExternalCommitMapStore';
import { RemoteSyncError, type RemoteSyncAdapter, type RemoteSyncPublishResult } from './RemoteSyncAdapter';
import { RemoteSyncAdapterRegistry } from './RemoteSyncAdapterRegistry';
import { RemoteStore, remoteFromRecord } from './RemoteStore';
import { SyncJobStore } from './SyncJobStore';
import { SyncStatePlanner } from './SyncStatePlanner';
import { computeRemoteSnapshotContentHash } from './snapshot';

const defaultLeaseDurationMs = 30_000;
const defaultMaxAttempts = 3;

export interface VscRemotePushInput {
  remoteId: string;
  expectedLocalCommitId: string | null;
  expectedRemoteRevision: string | null;
  expectedRemoteTargetVersion: number;
  planFingerprint: string;
  idempotencyKey?: string;
  maxAttempts?: number;
}

export interface VscRemotePushContext {
  authorId?: string | null;
  request?: VscPermissionRequestMetadata;
  leaseOwner?: string;
  leaseDurationMs?: number;
}

export interface VscRemotePushResult {
  remote: VscFileRemoteRecord;
  job: VscFileSyncJobRecord;
  snapshot: VscRemoteSnapshot;
  plan: VscRemoteSyncPlan;
  published: boolean;
}

export interface VscRemotePushServiceOptions {
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
}

interface PreparedPush {
  remote: VscFileRemoteRecord;
  repository: VscRepositoryRecord;
  job: VscFileSyncJobRecord;
  snapshot: VscRemoteSnapshot;
}

export class VscRemotePushService {
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

  constructor(
    private readonly db: Database,
    options: VscRemotePushServiceOptions,
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
    this.leaseOwner = options.leaseOwner ?? 'vsc-remote-push';
    this.leaseDurationMs = options.leaseDurationMs ?? defaultLeaseDurationMs;
  }

  async push(input: VscRemotePushInput, ctx: VscRemotePushContext = {}): Promise<VscRemotePushResult> {
    const leaseOwner = ctx.leaseOwner ?? this.leaseOwner;
    const leaseDurationMs = ctx.leaseDurationMs ?? this.leaseDurationMs;
    const prepared = await this.prepare(input, ctx, leaseOwner, leaseDurationMs);
    if (prepared.job.status === 'succeeded') {
      return this.completedResult(prepared);
    }
    if (!prepared.job.claimToken) {
      throw new RemoteSyncError('BUSY', 'Remote synchronization job is not claimed', {
        details: { reasonCode: 'sync-job-not-claimed' },
      });
    }

    const claimToken = prepared.job.claimToken;
    let plan: VscRemoteSyncPlan | null = null;
    let publishResult: RemoteSyncPublishResult | null = null;

    try {
      const adapter: RemoteSyncAdapter = this.adapterRegistry.require(prepared.remote.provider);
      const remoteSnapshot = await this.runWithLeaseHeartbeat(prepared.job.id, claimToken, leaseDurationMs, () =>
        adapter.fetchSnapshot(remoteTarget(prepared.remote)),
      );
      if (remoteSnapshot.revision !== input.expectedRemoteRevision) {
        await this.failWithConflict(
          prepared,
          claimToken,
          remoteSnapshot,
          'remote-changed-before-publish',
          'REMOTE_CHANGED',
        );
        throw new RemoteSyncError('REMOTE_CHANGED', 'Remote revision changed before publication', {
          details: {
            provider: prepared.remote.provider,
            operation: 'publish',
            reasonCode: 'remote-changed-before-publish',
            expectedRemoteRevision: input.expectedRemoteRevision,
            currentRemoteRevision: remoteSnapshot.revision,
          },
        });
      }

      const baseline = await this.mapStore.findLatest(prepared.remote.id);
      plan = this.planner.plan({
        configured: true,
        remoteId: prepared.remote.id,
        provider: prepared.remote.provider,
        remoteTargetVersion: prepared.remote.version,
        direction: 'push',
        capabilities: {
          canPull: adapter.capabilities.fetch,
          canPush: adapter.capabilities.publish && !adapter.capabilities.readOnly,
        },
        local: {
          headCommitId: prepared.repository.headCommitId,
          contentHash: prepared.snapshot.contentHash,
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
      if (plan.fingerprint !== input.planFingerprint) {
        await this.failWithConflict(prepared, claimToken, remoteSnapshot, 'plan-fingerprint-changed', 'REMOTE_CHANGED');
        throw new RemoteSyncError('REMOTE_CHANGED', 'Remote synchronization plan changed', {
          details: { reasonCode: 'plan-fingerprint-changed' },
        });
      }

      if (plan.action === 'conflict' || plan.action === 'pull' || plan.action === 'fetch-required') {
        await this.failWithConflict(prepared, claimToken, remoteSnapshot, plan.reasonCode || plan.action, 'DIVERGED');
        throw new RemoteSyncError('DIVERGED', 'Remote synchronization requires conflict resolution', {
          details: { reasonCode: plan.reasonCode || plan.action },
        });
      }
      if (plan.action === 'push' && !plan.canPush) {
        await this.safeFail(prepared.job.id, claimToken, 'PERMISSION_DENIED');
        throw new RemoteSyncError('PERMISSION_DENIED', 'Remote provider does not allow publication', {
          details: { provider: prepared.remote.provider, operation: 'publish', reasonCode: 'push-not-available' },
        });
      }

      if (plan.action === 'push') {
        await this.jobStore.advancePhase(prepared.job.id, claimToken, { phase: 'remote-started' });
        publishResult = await this.runWithLeaseHeartbeat(prepared.job.id, claimToken, leaseDurationMs, () =>
          adapter.publishSnapshot(remoteTarget(prepared.remote), prepared.snapshot, input.expectedRemoteRevision),
        );
        if (!publishResult.revision || publishResult.contentHash !== prepared.snapshot.contentHash) {
          await this.jobStore.markFinalizePending(prepared.job.id, claimToken, {
            resultLocalCommitId: prepared.repository.headCommitId,
            contentHash: prepared.snapshot.contentHash,
            lastErrorCode: 'UNSAFE_CONTENT',
          });
          publishResult = null;
          throw new RemoteSyncError('UNSAFE_CONTENT', 'Remote provider returned inconsistent publication evidence', {
            details: {
              provider: prepared.remote.provider,
              operation: 'publish',
              reasonCode: 'inconsistent-publish-result',
            },
          });
        }
        await this.jobStore.advancePhase(prepared.job.id, claimToken, {
          phase: 'remote-succeeded',
          resultLocalCommitId: prepared.repository.headCommitId,
          resultRemoteRevision: publishResult.revision,
          contentHash: publishResult.contentHash,
        });
      } else {
        publishResult = remoteSnapshot.revision
          ? {
              revision: remoteSnapshot.revision,
              contentHash: remoteSnapshot.contentHash,
              metadata: remoteSnapshot.metadata,
            }
          : null;
      }

      const job = await this.finalize(
        prepared.remote,
        prepared.repository.headCommitId,
        publishResult?.revision || null,
        prepared.snapshot.contentHash,
        prepared.job.id,
        claimToken,
      );
      return {
        remote: await this.remoteStore.get(prepared.remote.id),
        job,
        snapshot: prepared.snapshot,
        plan,
        published: plan.action === 'push',
      };
    } catch (error) {
      const safeError = toRemoteSyncError(error);
      if (publishResult) {
        await this.markFinalizePending(prepared, claimToken, publishResult);
        throw new RemoteSyncError('REMOTE_UNAVAILABLE', 'Remote synchronization result is awaiting finalization', {
          details: {
            provider: prepared.remote.provider,
            operation: 'publish',
            reasonCode: 'finalize-pending',
            expectedRemoteRevision: input.expectedRemoteRevision,
            currentRemoteRevision: publishResult.revision,
          },
        });
      }
      await this.safeFail(prepared.job.id, claimToken, safeError.code);
      throw safeError;
    }
  }

  private async prepare(
    input: VscRemotePushInput,
    ctx: VscRemotePushContext,
    leaseOwner: string,
    leaseDurationMs: number,
  ): Promise<PreparedPush> {
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
          details: {
            reasonCode: 'remote-target-version-changed',
            remoteTargetVersion: remote.version,
          },
        });
      }

      const repository = await this.repositoryService.getRepositoryForUpdate(remote.repoId, transaction);
      await this.assertPermission(remote, repository, ctx);
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

      const snapshot = await loadVscSnapshot(
        this.db,
        this.commitService,
        this.treeService,
        repository.id,
        repository.headCommitId,
        transaction,
      );
      const idempotencyKey =
        input.idempotencyKey ||
        `push:${remote.id}:${remote.version}:${input.expectedLocalCommitId || 'empty'}:${input.planFingerprint}`;
      const created = await this.jobStore.createOrGet(
        {
          remoteId: remote.id,
          remoteTargetVersion: remote.version,
          operation: 'push',
          idempotencyKey,
          planFingerprint: input.planFingerprint,
          expectedLocalCommitId: input.expectedLocalCommitId,
          expectedRemoteRevision: input.expectedRemoteRevision,
          maxAttempts: input.maxAttempts ?? defaultMaxAttempts,
        },
        transaction,
      );
      if (created.job.status === 'succeeded') {
        return { remote, repository, job: created.job, snapshot };
      }
      if (created.job.status === 'failed') {
        throw new RemoteSyncError(created.job.lastErrorCode || 'REMOTE_UNAVAILABLE', 'Synchronization job has failed', {
          details: { reasonCode: 'sync-job-failed' },
        });
      }

      const claimed = await this.jobStore.claim(created.job.id, { leaseOwner, leaseDurationMs }, transaction);
      if (!claimed) {
        throw new RemoteSyncError('BUSY', 'Remote has an active synchronization job', {
          details: { reasonCode: 'active-sync-job' },
        });
      }
      const job = await this.jobStore.advancePhase(
        claimed.id,
        requireClaimToken(claimed),
        { phase: 'prepared', contentHash: snapshot.contentHash },
        transaction,
      );
      return { remote, repository, job, snapshot };
    });
  }

  private async assertPermission(
    remote: VscFileRemoteRecord,
    repository: VscRepositoryRecord,
    ctx: VscRemotePushContext,
  ): Promise<void> {
    try {
      await this.permissionHooks.assertAllowed({
        userId: ctx.authorId ?? null,
        action: 'push',
        repoId: repository.id,
        repository: { ...repository },
        ownerType: repository.ownerType,
        ownerId: repository.ownerId,
        request: ctx.request,
        actionMetadata: { operation: 'remote-push', remoteId: remote.id },
      });
    } catch (error) {
      throw toRemoteSyncError(error);
    }
  }

  private async failWithConflict(
    prepared: PreparedPush,
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
          localContentHash: prepared.snapshot.contentHash,
          remoteContentHash: remoteSnapshot.contentHash,
          reasonCode,
        },
        transaction,
      );
      await this.jobStore.fail(prepared.job.id, claimToken, errorCode, transaction);
    });
  }

  private async finalize(
    remote: VscFileRemoteRecord,
    localCommitId: string | null,
    remoteRevision: string | null,
    contentHash: string,
    jobId: string,
    claimToken: string,
  ): Promise<VscFileSyncJobRecord> {
    return this.db.sequelize.transaction(async (transaction) => {
      if (localCommitId && remoteRevision) {
        await this.mapStore.record(
          {
            remoteId: remote.id,
            remoteTargetVersion: remote.version,
            localCommitId,
            remoteRevision,
            contentHash,
          },
          transaction,
        );
      }
      await this.remoteStore.recordSync(
        remote.id,
        { remoteTargetVersion: remote.version, lastErrorCode: null },
        transaction,
      );
      return this.jobStore.succeed(
        jobId,
        claimToken,
        {
          resultLocalCommitId: localCommitId,
          resultRemoteRevision: remoteRevision,
          contentHash,
        },
        transaction,
      );
    });
  }

  private async markFinalizePending(
    prepared: PreparedPush,
    claimToken: string,
    publishResult: RemoteSyncPublishResult,
  ): Promise<void> {
    try {
      await this.jobStore.markFinalizePending(prepared.job.id, claimToken, {
        resultLocalCommitId: prepared.repository.headCommitId,
        resultRemoteRevision: publishResult.revision,
        contentHash: publishResult.contentHash,
        lastErrorCode: 'REMOTE_UNAVAILABLE',
      });
    } catch {
      // The durable running job remains recoverable after its lease expires.
    }
  }

  private async safeFail(jobId: string, claimToken: string, code: RemoteSyncErrorCode): Promise<void> {
    try {
      await this.jobStore.fail(jobId, claimToken, code);
    } catch {
      // A lost lease leaves the running job for the reconciler instead of overwriting another claimant.
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

  private async completedResult(prepared: PreparedPush): Promise<VscRemotePushResult> {
    const baseline = await this.mapStore.findLatest(prepared.remote.id);
    const plan = this.planner.plan({
      configured: true,
      remoteId: prepared.remote.id,
      provider: prepared.remote.provider,
      remoteTargetVersion: prepared.remote.version,
      direction: 'push',
      capabilities: { canPull: true, canPush: true },
      local: { headCommitId: prepared.repository.headCommitId, contentHash: prepared.snapshot.contentHash },
      remote: {
        revision: prepared.job.resultRemoteRevision,
        contentHash: prepared.job.contentHash,
        contentHashKnown: prepared.job.contentHash !== null,
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
      remote: prepared.remote,
      job: prepared.job,
      snapshot: prepared.snapshot,
      plan,
      published: false,
    };
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
}

export async function loadVscSnapshot(
  db: Database,
  commitService: CommitService,
  treeService: TreeService,
  repoId: string,
  commitId: string | null,
  transaction?: Transaction,
): Promise<VscRemoteSnapshot> {
  if (!commitId) {
    const files: VscRemoteSnapshot['files'] = [];
    return { revision: null, contentHash: computeRemoteSnapshotContentHash(files), files, metadata: {} };
  }

  const commit = await commitService.getCommit(repoId, commitId, transaction);
  const entries = await treeService.loadTreeEntries(commit.treeHash, { transaction });
  const files: VscRemoteSnapshot['files'] = [];
  for (const entry of entries) {
    const blob = await db.getRepository('vscFileBlobs').findOne({
      filterByTk: entry.blobHash,
      fields: ['content'],
      transaction,
    });
    if (!blob) {
      throw new RemoteSyncError('UNSAFE_CONTENT', `Blob "${entry.blobHash}" was not found`, {
        details: { reasonCode: 'local-blob-not-found' },
      });
    }
    files.push({
      path: entry.path,
      content: blob.get('content') as string,
      mode: entry.mode,
      language: entry.language,
    });
  }
  return {
    revision: commit.id,
    contentHash: computeRemoteSnapshotContentHash(files),
    files,
    metadata: {},
  };
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

export function toRemoteSyncError(error: unknown): RemoteSyncError {
  if (error instanceof RemoteSyncError) {
    return error;
  }
  if (error instanceof VscError) {
    if (error.code === 'PERMISSION_DENIED') {
      return new RemoteSyncError('PERMISSION_DENIED', 'Permission denied');
    }
    if (error.code === 'REPO_ARCHIVED') {
      return new RemoteSyncError('REPO_ARCHIVED', 'Repository is archived');
    }
    if (error.code === 'REPO_NOT_FOUND' || error.code === 'COMMIT_NOT_FOUND' || error.code === 'BLOB_NOT_FOUND') {
      return new RemoteSyncError('REMOTE_NOT_FOUND', 'Local synchronization source was not found', {
        details: { reasonCode: 'local-source-not-found' },
      });
    }
    if (error.code === 'BASE_COMMIT_OUTDATED') {
      return new RemoteSyncError('LOCAL_OUTDATED', 'Local repository head changed', {
        details: { reasonCode: 'local-head-changed' },
      });
    }
  }
  return new RemoteSyncError('REMOTE_UNAVAILABLE', 'Remote synchronization failed', {
    details: { reasonCode: 'remote-operation-failed' },
  });
}
