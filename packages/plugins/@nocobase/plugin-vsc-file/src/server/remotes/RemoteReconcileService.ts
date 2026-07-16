/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';

import type {
  RemoteSyncErrorCode,
  VscFileRemoteRecord,
  VscFileSyncJobRecord,
  VscRemoteSnapshot,
  VscRemoteSyncPlan,
} from '../../shared/remote-sync-types';
import { CommitService } from '../services/CommitService';
import { TreeService } from '../services/TreeService';
import { ConflictStore } from './ConflictStore';
import { ExternalCommitMapStore } from './ExternalCommitMapStore';
import { RemoteSyncError, type RemoteSyncAdapter, type RemoteSyncPublishResult } from './RemoteSyncAdapter';
import { RemoteSyncAdapterRegistry } from './RemoteSyncAdapterRegistry';
import { RemoteStore } from './RemoteStore';
import { SyncJobStore } from './SyncJobStore';
import { SyncStatePlanner } from './SyncStatePlanner';
import { loadVscSnapshot, toRemoteSyncError } from './VscRemotePushService';

const defaultLeaseDurationMs = 30_000;

export type RemoteReconcileDecision = 'already-terminal' | 'finalized' | 'retried-publication' | 'conflict';

export interface RemoteReconcileResult {
  job: VscFileSyncJobRecord;
  decision: RemoteReconcileDecision;
  published: boolean;
}

export interface RemoteReconcileContext {
  leaseOwner?: string;
  leaseDurationMs?: number;
}

export interface RemoteReconcileServiceOptions {
  adapterRegistry: RemoteSyncAdapterRegistry;
  remoteStore?: RemoteStore;
  jobStore?: SyncJobStore;
  mapStore?: ExternalCommitMapStore;
  conflictStore?: ConflictStore;
  planner?: SyncStatePlanner;
  commitService?: CommitService;
  treeService?: TreeService;
  leaseOwner?: string;
  leaseDurationMs?: number;
}

export class RemoteReconcileService {
  private readonly adapterRegistry: RemoteSyncAdapterRegistry;

  private readonly remoteStore: RemoteStore;

  private readonly jobStore: SyncJobStore;

  private readonly mapStore: ExternalCommitMapStore;

  private readonly conflictStore: ConflictStore;

  private readonly planner: SyncStatePlanner;

  private readonly commitService: CommitService;

  private readonly treeService: TreeService;

  private readonly leaseOwner: string;

  private readonly leaseDurationMs: number;

  constructor(
    private readonly db: Database,
    options: RemoteReconcileServiceOptions,
  ) {
    this.adapterRegistry = options.adapterRegistry;
    this.remoteStore = options.remoteStore || new RemoteStore(db);
    this.jobStore = options.jobStore || new SyncJobStore(db);
    this.mapStore = options.mapStore || new ExternalCommitMapStore(db);
    this.conflictStore = options.conflictStore || new ConflictStore(db);
    this.planner = options.planner || new SyncStatePlanner();
    this.commitService = options.commitService || new CommitService(db);
    this.treeService = options.treeService || new TreeService(db);
    this.leaseOwner = options.leaseOwner ?? 'vsc-remote-reconcile';
    this.leaseDurationMs = options.leaseDurationMs ?? defaultLeaseDurationMs;
  }

  async reconcile(jobId: string, ctx: RemoteReconcileContext = {}): Promise<RemoteReconcileResult> {
    const leaseOwner = ctx.leaseOwner ?? this.leaseOwner;
    const leaseDurationMs = ctx.leaseDurationMs ?? this.leaseDurationMs;
    const initial = await this.jobStore.get(jobId);
    if (initial.status === 'succeeded' || initial.status === 'failed') {
      return { job: initial, decision: 'already-terminal', published: false };
    }

    const claimed = await this.claim(initial, leaseOwner, leaseDurationMs);
    if (!claimed) {
      const current = await this.jobStore.get(jobId);
      if (current.status === 'succeeded' || current.status === 'failed') {
        return { job: current, decision: 'already-terminal', published: false };
      }
      throw new RemoteSyncError('BUSY', 'Synchronization job has a live lease', {
        details: { reasonCode: 'active-sync-job' },
      });
    }
    const claimToken = requireClaimToken(claimed);
    const remote = await this.remoteStore.get(claimed.remoteId);
    const snapshot = await loadVscSnapshot(
      this.db,
      this.commitService,
      this.treeService,
      remote.repoId,
      claimed.expectedLocalCommitId,
    );
    if (claimed.contentHash !== snapshot.contentHash) {
      return this.finishConflict(remote, claimed, claimToken, snapshot, null, 'pinned-local-snapshot-mismatch');
    }

    if (
      (claimed.phase === 'remote-succeeded' || claimed.phase === 'finalize-pending') &&
      claimed.resultRemoteRevision &&
      claimed.resultLocalCommitId === claimed.expectedLocalCommitId &&
      claimed.contentHash
    ) {
      try {
        const job = await this.finalize(
          remote,
          claimed.resultLocalCommitId,
          claimed.resultRemoteRevision,
          claimed.contentHash,
          claimed.id,
          claimToken,
        );
        return { job, decision: 'finalized', published: false };
      } catch (error) {
        await this.markFinalizePending(claimed, claimToken, {
          revision: claimed.resultRemoteRevision,
          contentHash: claimed.contentHash,
          metadata: {},
        });
        throw toRemoteSyncError(error);
      }
    }

    let publishResult: RemoteSyncPublishResult | null = null;
    try {
      const adapter: RemoteSyncAdapter = this.adapterRegistry.require(remote.provider);
      const remoteSnapshot = await this.runWithLeaseHeartbeat(claimed.id, claimToken, leaseDurationMs, () =>
        adapter.fetchSnapshot(remoteTarget(remote)),
      );

      if (remoteSnapshot.contentHash === snapshot.contentHash) {
        const job = await this.finalize(
          remote,
          claimed.expectedLocalCommitId,
          remoteSnapshot.revision,
          snapshot.contentHash,
          claimed.id,
          claimToken,
        );
        return { job, decision: 'finalized', published: false };
      }

      if (remoteSnapshot.revision !== claimed.expectedRemoteRevision) {
        return this.finishConflict(remote, claimed, claimToken, snapshot, remoteSnapshot, 'uncertain-remote-result');
      }

      const plan = await this.createPlan(remote, claimed, snapshot, remoteSnapshot, adapter);
      if (plan.fingerprint !== claimed.planFingerprint) {
        return this.finishConflict(remote, claimed, claimToken, snapshot, remoteSnapshot, 'plan-fingerprint-changed');
      }
      if (plan.action !== 'push' || !plan.canPush) {
        if (plan.action === 'noop' || plan.action === 'establish-mapping' || plan.action === 'repair-mapping') {
          const job = await this.finalize(
            remote,
            claimed.expectedLocalCommitId,
            remoteSnapshot.revision,
            snapshot.contentHash,
            claimed.id,
            claimToken,
          );
          return { job, decision: 'finalized', published: false };
        }
        return this.finishConflict(
          remote,
          claimed,
          claimToken,
          snapshot,
          remoteSnapshot,
          plan.reasonCode || plan.action,
        );
      }

      await this.jobStore.advancePhase(claimed.id, claimToken, { phase: 'remote-started' });
      publishResult = await this.runWithLeaseHeartbeat(claimed.id, claimToken, leaseDurationMs, () =>
        adapter.publishSnapshot(remoteTarget(remote), snapshot, claimed.expectedRemoteRevision),
      );
      await this.jobStore.advancePhase(claimed.id, claimToken, {
        phase: 'remote-succeeded',
        resultLocalCommitId: claimed.expectedLocalCommitId,
        resultRemoteRevision: publishResult.revision,
        contentHash: publishResult.contentHash,
      });
      const job = await this.finalize(
        remote,
        claimed.expectedLocalCommitId,
        publishResult.revision,
        publishResult.contentHash,
        claimed.id,
        claimToken,
      );
      return { job, decision: 'retried-publication', published: true };
    } catch (error) {
      const safeError = toRemoteSyncError(error);
      if (publishResult) {
        await this.markFinalizePending(claimed, claimToken, publishResult);
      } else {
        await this.safeFail(claimed.id, claimToken, safeError.code);
      }
      throw safeError;
    }
  }

  async reconcileRecoverable(ctx: RemoteReconcileContext = {}): Promise<RemoteReconcileResult[]> {
    const jobs = await this.jobStore.listRecoverable();
    const results: RemoteReconcileResult[] = [];
    for (const job of jobs) {
      try {
        results.push(await this.reconcile(job.id, ctx));
      } catch {
        // Recovery is best-effort per durable job. One unavailable provider or live lease must not block later jobs.
      }
    }
    return results;
  }

  private async claim(
    job: VscFileSyncJobRecord,
    leaseOwner: string,
    leaseDurationMs: number,
  ): Promise<VscFileSyncJobRecord | null> {
    if (job.status === 'running') {
      return this.jobStore.reclaimExpired(job.id, { leaseOwner, leaseDurationMs });
    }
    return this.jobStore.claim(job.id, { leaseOwner, leaseDurationMs });
  }

  private async createPlan(
    remote: VscFileRemoteRecord,
    job: VscFileSyncJobRecord,
    localSnapshot: VscRemoteSnapshot,
    remoteSnapshot: VscRemoteSnapshot,
    adapter: RemoteSyncAdapter,
  ): Promise<VscRemoteSyncPlan> {
    const baseline = await this.mapStore.findLatest(remote.id);
    return this.planner.plan({
      configured: true,
      remoteId: remote.id,
      provider: remote.provider,
      remoteTargetVersion: remote.version,
      direction: 'push',
      capabilities: {
        canPull: adapter.capabilities.fetch,
        canPush: adapter.capabilities.publish && !adapter.capabilities.readOnly,
      },
      local: { headCommitId: job.expectedLocalCommitId, contentHash: localSnapshot.contentHash },
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

  private async finishConflict(
    remote: VscFileRemoteRecord,
    job: VscFileSyncJobRecord,
    claimToken: string,
    localSnapshot: VscRemoteSnapshot,
    remoteSnapshot: VscRemoteSnapshot | null,
    reasonCode: string,
  ): Promise<RemoteReconcileResult> {
    const failed = await this.db.sequelize.transaction(async (transaction) => {
      const baseline = await this.mapStore.findLatest(remote.id, transaction);
      await this.conflictStore.upsert(
        {
          remoteId: remote.id,
          remoteTargetVersion: remote.version,
          baseLocalCommitId: baseline?.localCommitId || null,
          baseRemoteRevision: baseline?.remoteRevision || null,
          currentLocalCommitId: job.expectedLocalCommitId,
          currentRemoteRevision: remoteSnapshot?.revision || null,
          localContentHash: localSnapshot.contentHash,
          remoteContentHash: remoteSnapshot?.contentHash || null,
          reasonCode,
        },
        transaction,
      );
      return this.jobStore.fail(job.id, claimToken, 'DIVERGED', transaction);
    });
    return { job: failed, decision: 'conflict', published: false };
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
    job: VscFileSyncJobRecord,
    claimToken: string,
    publishResult: RemoteSyncPublishResult,
  ): Promise<void> {
    try {
      await this.jobStore.markFinalizePending(job.id, claimToken, {
        resultLocalCommitId: job.expectedLocalCommitId,
        resultRemoteRevision: publishResult.revision,
        contentHash: publishResult.contentHash,
        lastErrorCode: 'REMOTE_UNAVAILABLE',
      });
    } catch {
      // The existing running job remains recoverable after its lease expires.
    }
  }

  private async safeFail(jobId: string, claimToken: string, code: RemoteSyncErrorCode): Promise<void> {
    try {
      await this.jobStore.fail(jobId, claimToken, code);
    } catch {
      // A lost lease must not let this worker overwrite a later claimant.
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
