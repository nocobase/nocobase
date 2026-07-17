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
  VscFileRemoteRecord,
  VscFileSyncJobRecord,
  VscRemoteNormalizedConfig,
  VscRemoteProvider,
  VscRemoteSnapshot,
  VscRemoteSyncPlan,
} from '../../shared/remote-sync-types';
import { CommitService } from '../services/CommitService';
import { RepositoryService } from '../services/RepositoryService';
import { TreeService } from '../services/TreeService';
import { ExternalCommitMapStore } from './ExternalCommitMapStore';
import { RemoteReconcileService } from './RemoteReconcileService';
import type { RemoteReconcileRecoveryEvent } from './RemoteReconcileService';
import { RemoteSyncError } from './RemoteSyncAdapter';
import { RemoteSyncAdapterRegistry } from './RemoteSyncAdapterRegistry';
import type {
  RemoteSyncConfigureInput,
  RemoteSyncContext,
  RemoteSyncEstablishInitialBaselineInput,
  RemoteSyncEstablishInitialBaselineResult,
  RemoteSyncExecutionInput,
  RemoteSyncExecutionResult,
  RemoteSyncPullCoordinator,
  RemoteSyncRuntime,
  RemoteSyncTestTargetInput,
  RemoteSyncTestTargetResult,
} from './RemoteSyncRuntime';
import { RemoteStore } from './RemoteStore';
import type { RemoteCredentialResolver } from './security/RemoteCredentialResolver';
import { SyncJobStore } from './SyncJobStore';
import { SyncStatePlanner } from './SyncStatePlanner';
import { VscRemotePullDiscoveryService } from './VscRemotePullDiscoveryService';
import { loadVscSnapshot, toRemoteSyncError, VscRemotePushService } from './VscRemotePushService';
import { computeRemoteSnapshotContentHash, normalizeRemoteSnapshotFiles } from './snapshot';
import type { RemoteSyncAuditEmitter } from './audit';

const blockingJobStatuses = ['pending', 'running', 'finalize-pending'] as const;
const emptySnapshotContentHash = computeRemoteSnapshotContentHash([]);

export interface RemoteSyncRuntimeServiceOptions {
  adapterRegistry: RemoteSyncAdapterRegistry;
  credentialResolver: Pick<RemoteCredentialResolver, 'validate'>;
  permissionHooks: ConstructorParameters<typeof VscRemotePushService>[1]['permissionHooks'];
  audit?: RemoteSyncAuditEmitter;
}

export class RemoteSyncRuntimeService implements RemoteSyncRuntime {
  private readonly adapterRegistry: RemoteSyncAdapterRegistry;

  private readonly credentialResolver: Pick<RemoteCredentialResolver, 'validate'>;

  private readonly remoteStore: RemoteStore;

  private readonly mapStore: ExternalCommitMapStore;

  private readonly planner: SyncStatePlanner;

  private readonly jobStore: SyncJobStore;

  private readonly commitService: CommitService;

  private readonly treeService: TreeService;

  private readonly repositoryService: RepositoryService;

  private readonly pushService: VscRemotePushService;

  private readonly pullService: VscRemotePullDiscoveryService;

  private readonly pullCoordinator: RemoteSyncPullCoordinator;

  private readonly pullRecoveryJobIds = new Set<string>();

  private readonly reconcileService: RemoteReconcileService;

  private readonly audit?: RemoteSyncAuditEmitter;

  constructor(
    private readonly db: Database,
    options: RemoteSyncRuntimeServiceOptions,
  ) {
    this.adapterRegistry = options.adapterRegistry;
    this.credentialResolver = options.credentialResolver;
    this.audit = options.audit;
    this.remoteStore = new RemoteStore(db);
    this.mapStore = new ExternalCommitMapStore(db);
    this.planner = new SyncStatePlanner();
    this.jobStore = new SyncJobStore(db);
    this.commitService = new CommitService(db);
    this.treeService = new TreeService(db);
    this.repositoryService = new RepositoryService(db);
    this.pushService = new VscRemotePushService(db, {
      adapterRegistry: this.adapterRegistry,
      permissionHooks: options.permissionHooks,
      remoteStore: this.remoteStore,
      mapStore: this.mapStore,
      planner: this.planner,
      commitService: this.commitService,
      treeService: this.treeService,
      repositoryService: this.repositoryService,
    });
    this.pullService = new VscRemotePullDiscoveryService(db, {
      adapterRegistry: this.adapterRegistry,
      permissionHooks: options.permissionHooks,
      remoteStore: this.remoteStore,
      mapStore: this.mapStore,
      planner: this.planner,
      commitService: this.commitService,
      treeService: this.treeService,
      repositoryService: this.repositoryService,
    });
    this.pullCoordinator = {
      discover: async (input, ctx) => {
        const recovery = ctx?.request?.requestSource === 'light-extension-pull-recovery';
        try {
          const result = await this.pullService.discover(input, ctx);
          const payload = this.toJobAuditPayload(result.job, {
            remoteId: result.remote.id,
            remoteRevision: result.snapshot.revision,
            result: result.plan.action,
            reasonCode: result.plan.reasonCode,
          });
          await this.emitAudit('pull', payload);
          await this.emitAudit('job', payload);
          if (recovery && result.handle) {
            this.pullRecoveryJobIds.add(result.handle.jobId);
          } else if (recovery) {
            await this.emitAudit('reconcile', payload);
          }
          if (result.plan.action === 'conflict' || result.job.lastErrorCode === 'DIVERGED') {
            await this.emitAudit('conflict', payload);
          }
          return result;
        } catch (error) {
          if (recovery) {
            const safeError = toRemoteSyncError(error);
            const payload = {
              remoteId: input.remoteId,
              jobId: readRecoveryJobId(ctx?.request?.requestId),
              operation: 'pull',
              status: 'failed',
              remoteTargetVersion: input.expectedRemoteTargetVersion,
              expectedRemoteRevision: input.expectedRemoteRevision,
              reasonCode: readReasonCode(safeError),
              result: 'failed',
            };
            await this.emitAudit('pull', payload);
            await this.emitAudit('job', payload);
            await this.emitAudit('reconcile', payload);
            if (await this.hasOpenConflict(input.remoteId, input.expectedRemoteTargetVersion)) {
              await this.emitAudit('conflict', payload);
            }
          }
          throw error;
        }
      },
      apply: async (handle, ownerApply) => {
        const result = await this.pullService.apply(handle, ownerApply);
        const payload = this.toJobAuditPayload(result.job, {
          remoteId: handle.remote.id,
          remoteRevision: handle.snapshot.revision,
          result: 'applied',
        });
        await this.emitAudit('job', payload);
        if (this.pullRecoveryJobIds.delete(handle.jobId)) {
          await this.emitAudit('reconcile', payload);
        }
        return result;
      },
      failApply: async (handle, code) => {
        await this.pullService.failApply(handle, code);
        const payload = {
          remoteId: handle.remote.id,
          jobId: handle.jobId,
          operation: 'pull',
          status: 'failed',
          remoteTargetVersion: handle.expectedRemoteTargetVersion,
          expectedRemoteRevision: handle.expectedRemoteRevision,
          reasonCode: code,
          result: 'failed',
        };
        await this.emitAudit('job', payload);
        if (this.pullRecoveryJobIds.delete(handle.jobId)) {
          await this.emitAudit('reconcile', payload);
        }
        if (code === 'DIVERGED') {
          await this.emitAudit('conflict', payload);
        }
      },
      listRecoverablePullJobs: () => this.pullService.listRecoverablePullJobs(),
    };
    this.reconcileService = new RemoteReconcileService(db, {
      adapterRegistry: this.adapterRegistry,
      remoteStore: this.remoteStore,
      mapStore: this.mapStore,
      planner: this.planner,
      commitService: this.commitService,
      treeService: this.treeService,
    });
  }

  normalizeConfig(provider: VscRemoteProvider, input: unknown): VscRemoteNormalizedConfig {
    return cloneFrozen(this.adapterRegistry.normalizeConfig(provider, input));
  }

  async getRemote(repoId: string, name: string): Promise<VscFileRemoteRecord | null> {
    const remote = await this.remoteStore.getByRepoAndName(repoId, name);
    return remote ? cloneFrozen(remote) : null;
  }

  async getRemoteById(remoteId: string): Promise<VscFileRemoteRecord> {
    return cloneFrozen(await this.remoteStore.get(remoteId));
  }

  async getLatestMappedRevision(remoteId: string): Promise<string | null> {
    return (await this.mapStore.findLatest(remoteId))?.remoteRevision || null;
  }

  async configureRemote(input: RemoteSyncConfigureInput): Promise<VscFileRemoteRecord> {
    let config = this.adapterRegistry.normalizeConfig(input.provider, input.config);
    if (input.authRef !== null) {
      await this.credentialResolver.validate(input.authRef);
    }
    if (!config.branch) {
      const tested = await this.testTarget({
        provider: input.provider,
        config,
        authRef: input.authRef,
      });
      config = tested.config;
    }

    const remote = await this.db.sequelize.transaction(async (transaction) => {
      await this.assertRepositoryIdle(input.repoId, transaction);
      const existing = await this.remoteStore.getByRepoAndName(input.repoId, input.name, transaction);
      return existing
        ? this.remoteStore.updateTarget(
            existing.id,
            {
              provider: input.provider,
              config,
              authRef: input.authRef,
            },
            transaction,
          )
        : this.remoteStore.create(
            {
              repoId: input.repoId,
              name: input.name,
              provider: input.provider,
              config,
              authRef: input.authRef,
            },
            transaction,
          );
    });
    return cloneFrozen(remote);
  }

  async disconnectRemote(remoteId: string): Promise<void> {
    await this.remoteStore.disconnect(remoteId);
  }

  async testTarget(input: RemoteSyncTestTargetInput): Promise<RemoteSyncTestTargetResult> {
    const adapter = this.adapterRegistry.require(input.provider);
    let config = this.adapterRegistry.normalizeConfig(input.provider, input.config);
    if (input.authRef !== null) {
      await this.credentialResolver.validate(input.authRef);
    }
    const probe = await adapter.probe({
      config,
      authRef: input.authRef,
    });
    const branch = readProbeBranch(probe.metadata);
    if (!config.branch) {
      if (!branch) {
        throw new RemoteSyncError('CONFIG_INVALID', 'Remote default branch is unavailable', {
          details: { provider: input.provider, reasonCode: 'default-branch-unavailable' },
        });
      }
      config = this.adapterRegistry.normalizeConfig(input.provider, { ...config, branch });
    }
    return cloneFrozen({
      provider: input.provider,
      config,
      snapshot: {
        revision: probe.revision,
        contentHash: emptySnapshotContentHash,
        files: [],
        metadata: probe.metadata,
      },
    });
  }

  async fetchTarget(input: RemoteSyncTestTargetInput): Promise<RemoteSyncTestTargetResult> {
    const tested = await this.testTarget(input);
    const adapter = this.adapterRegistry.require(tested.provider);
    const snapshot = validateFetchedSnapshot(
      await adapter.fetchSnapshot({
        config: tested.config,
        authRef: input.authRef,
      }),
    );
    return cloneFrozen({
      provider: tested.provider,
      config: tested.config,
      snapshot,
    });
  }

  async establishInitialBaseline(
    input: RemoteSyncEstablishInitialBaselineInput,
    transaction: Transaction,
  ): Promise<RemoteSyncEstablishInitialBaselineResult> {
    const config = this.adapterRegistry.normalizeConfig(input.provider, input.config);
    const revision = requireInitialRemoteRevision(input.snapshot.revision);
    const contentHash = computeRemoteSnapshotContentHash(input.snapshot.files);
    if (contentHash !== input.snapshot.contentHash) {
      throw new RemoteSyncError('UNSAFE_CONTENT', 'Remote snapshot content hash is invalid', {
        details: { reasonCode: 'snapshot-content-hash-mismatch' },
      });
    }
    const repository = await this.repositoryService.getRepositoryForUpdate(input.repoId, transaction);
    if (repository.headCommitId !== input.localCommitId) {
      throw new RemoteSyncError('LOCAL_OUTDATED', 'Local repository Head changed before baseline creation', {
        details: {
          reasonCode: 'initial-local-head-changed',
          expectedHeadCommitId: input.localCommitId,
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
    if (localSnapshot.contentHash !== contentHash) {
      throw new RemoteSyncError('LOCAL_OUTDATED', 'Local repository content does not match the fetched snapshot', {
        details: { reasonCode: 'initial-local-content-mismatch' },
      });
    }

    const remote = await this.remoteStore.create(
      {
        repoId: input.repoId,
        name: input.name,
        provider: input.provider,
        config,
        authRef: input.authRef,
      },
      transaction,
    );
    const baseline = {
      remoteTargetVersion: remote.version,
      lastLocalCommitId: input.localCommitId,
      lastRemoteRevision: revision,
      lastSyncedContentHash: contentHash,
    };
    const adapter = this.adapterRegistry.require(remote.provider);
    const plan = this.planner.plan({
      configured: true,
      remoteId: remote.id,
      provider: remote.provider,
      remoteTargetVersion: remote.version,
      direction: 'bidirectional',
      capabilities: {
        canPull: adapter.capabilities.fetch,
        canPush: adapter.capabilities.publish && !adapter.capabilities.readOnly,
      },
      local: { headCommitId: input.localCommitId, contentHash },
      remote: { revision, contentHash, contentHashKnown: true },
      baseline,
    });
    const createdJob = await this.jobStore.createOrGet(
      {
        remoteId: remote.id,
        remoteTargetVersion: remote.version,
        operation: 'pull',
        idempotencyKey: `initial-pull:${remote.id}:${revision}:${input.localCommitId}`,
        planFingerprint: plan.fingerprint,
        expectedLocalCommitId: input.localCommitId,
        expectedRemoteRevision: revision,
        maxAttempts: 1,
      },
      transaction,
    );
    const claimedJob = await this.jobStore.claim(
      createdJob.job.id,
      { leaseOwner: 'initial-baseline', leaseDurationMs: 60_000 },
      transaction,
    );
    if (!claimedJob?.claimToken) {
      throw new RemoteSyncError('BUSY', 'Initial synchronization job could not be claimed', {
        details: { reasonCode: 'initial-job-claim-failed' },
      });
    }
    await this.mapStore.record(
      {
        remoteId: remote.id,
        remoteTargetVersion: remote.version,
        localCommitId: input.localCommitId,
        remoteRevision: revision,
        contentHash,
      },
      transaction,
    );
    const job = await this.jobStore.succeed(
      claimedJob.id,
      claimedJob.claimToken,
      {
        resultLocalCommitId: input.localCommitId,
        resultRemoteRevision: revision,
        contentHash,
      },
      transaction,
    );
    const syncedRemote = await this.remoteStore.recordSync(
      remote.id,
      { remoteTargetVersion: remote.version, lastErrorCode: null },
      transaction,
    );

    return cloneFrozen({ remote: syncedRemote, job, plan });
  }

  async probeRemote(remoteId: string): Promise<VscRemoteSnapshot> {
    const remote = await this.requireActiveRemote(remoteId);
    const adapter = this.adapterRegistry.require(remote.provider);
    try {
      const probe = await adapter.probe(toAdapterTarget(remote));
      await this.remoteStore.recordCheck(remote.id, {
        remoteTargetVersion: remote.version,
        lastErrorCode: null,
      });
      return cloneFrozen({
        revision: probe.revision,
        contentHash: emptySnapshotContentHash,
        files: [],
        metadata: probe.metadata,
      });
    } catch (error) {
      const safeError = toRemoteSyncError(error);
      await this.recordCheckFailure(remote, safeError);
      throw safeError;
    }
  }

  async fetchRemoteSnapshot(remoteId: string): Promise<VscRemoteSnapshot> {
    const remote = await this.requireActiveRemote(remoteId);
    const adapter = this.adapterRegistry.require(remote.provider);
    try {
      const snapshot = await adapter.fetchSnapshot(toAdapterTarget(remote));
      await this.remoteStore.recordCheck(remote.id, {
        remoteTargetVersion: remote.version,
        lastErrorCode: null,
      });
      return cloneFrozen(snapshot);
    } catch (error) {
      const safeError = toRemoteSyncError(error);
      await this.recordCheckFailure(remote, safeError);
      throw safeError;
    }
  }

  async planRemote(remoteId: string): Promise<VscRemoteSyncPlan> {
    const remote = await this.requireActiveRemote(remoteId);
    const adapter = this.adapterRegistry.require(remote.provider);
    const [repository, local, snapshot, baseline] = await Promise.all([
      this.repositoryService.getRepository(remote.repoId),
      this.loadLocalSnapshot(remote.repoId),
      adapter.fetchSnapshot(toAdapterTarget(remote)),
      this.mapStore.findLatest(remote.id),
    ]);
    return cloneFrozen(
      this.planner.plan({
        configured: true,
        remoteId: remote.id,
        provider: remote.provider,
        remoteTargetVersion: remote.version,
        direction: 'bidirectional',
        capabilities: {
          canPull: adapter.capabilities.fetch,
          canPush: adapter.capabilities.publish && !adapter.capabilities.readOnly,
        },
        local: { headCommitId: repository.headCommitId, contentHash: local.contentHash },
        remote: { revision: snapshot.revision, contentHash: snapshot.contentHash, contentHashKnown: true },
        baseline: baseline
          ? {
              remoteTargetVersion: baseline.remoteTargetVersion,
              lastLocalCommitId: baseline.localCommitId,
              lastRemoteRevision: baseline.remoteRevision,
              lastSyncedContentHash: baseline.contentHash,
            }
          : null,
      }),
    );
  }

  async planUnconfigured(repoId: string): Promise<VscRemoteSyncPlan> {
    const repository = await this.repositoryService.getRepository(repoId);
    const local = await this.loadLocalSnapshot(repoId);
    return cloneFrozen(
      this.planner.plan({
        configured: false,
        remoteId: null,
        provider: null,
        remoteTargetVersion: null,
        direction: 'bidirectional',
        capabilities: { canPull: false, canPush: false },
        local: { headCommitId: repository.headCommitId, contentHash: local.contentHash },
        remote: { revision: null, contentHash: null, contentHashKnown: true },
        baseline: null,
      }),
    );
  }

  async push(input: RemoteSyncExecutionInput, ctx: RemoteSyncContext = {}): Promise<RemoteSyncExecutionResult> {
    const result = await this.pushService.push(input, ctx);
    return cloneFrozen({
      remote: result.remote,
      job: result.job,
      snapshot: result.snapshot,
      plan: result.plan,
    });
  }

  async pull(input: RemoteSyncExecutionInput, ctx: RemoteSyncContext = {}): Promise<RemoteSyncExecutionResult> {
    const remote = await this.requireActiveRemote(input.remoteId);
    const result = await this.pullService.discover(
      {
        ...input,
        expectedRepoId: remote.repoId,
      },
      ctx,
    );
    if (result.applyRequired) {
      if (result.handle) {
        await this.pullService.failApply(result.handle, 'CONFIG_INVALID');
      }
      throw new RemoteSyncError('CONFIG_INVALID', 'Remote pull requires an owner apply coordinator', {
        details: { reasonCode: 'owner-apply-required' },
      });
    }
    return cloneFrozen({
      remote: result.remote,
      job: result.job,
      snapshot: result.snapshot,
      plan: result.plan,
    });
  }

  getPullCoordinator(): RemoteSyncPullCoordinator {
    return this.pullCoordinator;
  }

  async assertRepositoryIdle(repoId: string, transaction?: Transaction): Promise<void> {
    await withTransaction(this.db, transaction, async (currentTransaction) => {
      const remotes = await this.db.getRepository('vscFileRemotes').find({
        filter: { repoId },
        fields: ['id'],
        transaction: currentTransaction,
        lock: currentTransaction.LOCK.UPDATE,
      });
      const repositoryModel = this.db.getModel<Model>('vscFileRepositories');
      const repository = await repositoryModel.findByPk(repoId, {
        transaction: currentTransaction,
        lock: currentTransaction.LOCK.UPDATE,
      });
      if (!repository) {
        throw new RemoteSyncError('REMOTE_NOT_FOUND', 'Local VSC repository was not found', {
          details: { reasonCode: 'local-repository-not-found' },
        });
      }
      if (!remotes.length) {
        return;
      }
      const remoteIds = remotes.map((remote) => String(remote.get('id')));
      const activeJobs = await this.db.getRepository('vscFileSyncJobs').count({
        filter: {
          remoteId: { $in: remoteIds },
          status: { $in: [...blockingJobStatuses] },
        },
        transaction: currentTransaction,
      });
      if (activeJobs > 0) {
        throw new RemoteSyncError('BUSY', 'Repository has an active synchronization job', {
          details: { reasonCode: 'active-sync-job' },
        });
      }
    });
  }

  async recoverPushJobs(): Promise<void> {
    await this.reconcileService.reconcileRecoverable({
      onRecoveryResult: (event) => this.auditPushRecovery(event),
    });
  }

  private async auditPushRecovery(event: RemoteReconcileRecoveryEvent): Promise<void> {
    const payload = this.toJobAuditPayload(event.job, {
      decision: event.result?.decision ?? 'failed',
      reasonCode: event.errorCode,
      result: event.result?.published ? 'published' : event.result?.decision ?? 'failed',
    });
    await this.emitAudit('reconcile', payload);
    await this.emitAudit('job', payload);
    if (event.result?.decision === 'conflict' || event.job.lastErrorCode === 'DIVERGED') {
      await this.emitAudit('conflict', payload);
    }
  }

  private async hasOpenConflict(remoteId: string, remoteTargetVersion: number): Promise<boolean> {
    try {
      return Boolean(
        await this.db.getRepository('vscFileConflicts').findOne({
          filter: { remoteId, remoteTargetVersion, status: 'open' },
          fields: ['id'],
        }),
      );
    } catch {
      return false;
    }
  }

  private toJobAuditPayload(
    job: { id: string; remoteId: string; operation: string; status: string; remoteTargetVersion: number } & Partial<
      Pick<
        VscFileSyncJobRecord,
        'expectedRemoteRevision' | 'resultRemoteRevision' | 'resultLocalCommitId' | 'lastErrorCode'
      >
    >,
    extra: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return {
      remoteId: job.remoteId,
      jobId: job.id,
      operation: job.operation,
      status: job.status,
      remoteTargetVersion: job.remoteTargetVersion,
      expectedRemoteRevision: job.expectedRemoteRevision,
      resultRemoteRevision: job.resultRemoteRevision,
      resultLocalCommitId: job.resultLocalCommitId,
      reasonCode: job.lastErrorCode,
      ...extra,
    };
  }

  private async emitAudit(actionName: 'pull' | 'reconcile' | 'job' | 'conflict', payload: Record<string, unknown>) {
    try {
      await this.audit?.(actionName, payload);
    } catch {
      // Durable synchronization recovery must not depend on audit delivery.
    }
  }

  private async loadLocalSnapshot(repoId: string): Promise<VscRemoteSnapshot> {
    const repository = await this.repositoryService.getRepository(repoId);
    return loadVscSnapshot(this.db, this.commitService, this.treeService, repoId, repository.headCommitId);
  }

  private async requireActiveRemote(remoteId: string): Promise<VscFileRemoteRecord> {
    const remote = await this.remoteStore.get(remoteId);
    if (remote.status !== 'active') {
      throw new RemoteSyncError('CONFIG_INVALID', 'Remote is disabled', {
        details: { reasonCode: 'remote-disabled' },
      });
    }
    return remote;
  }

  private async recordCheckFailure(remote: VscFileRemoteRecord, error: RemoteSyncError): Promise<void> {
    try {
      await this.remoteStore.recordCheck(remote.id, {
        remoteTargetVersion: remote.version,
        lastErrorCode: error.code,
      });
    } catch {
      // A concurrent target update must not replace the safe provider error returned to the caller.
    }
  }
}

function toAdapterTarget(remote: VscFileRemoteRecord) {
  return {
    provider: remote.provider,
    config: remote.config,
    authRef: remote.authRef,
  };
}

function readProbeBranch(metadata: Record<string, unknown>): string | null {
  const branch = metadata.branch;
  return typeof branch === 'string' && branch ? branch : null;
}

function requireInitialRemoteRevision(revision: string | null): string {
  if (!revision) {
    throw new RemoteSyncError('REMOTE_NOT_FOUND', 'Remote branch has no revision', {
      details: { reasonCode: 'remote-branch-empty' },
    });
  }
  return revision;
}

function validateFetchedSnapshot(snapshot: VscRemoteSnapshot): VscRemoteSnapshot {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new RemoteSyncError('UNSAFE_CONTENT', 'Remote snapshot is invalid', {
      details: { reasonCode: 'invalid-snapshot' },
    });
  }
  if (snapshot.revision !== null && (typeof snapshot.revision !== 'string' || !snapshot.revision.trim())) {
    throw new RemoteSyncError('UNSAFE_CONTENT', 'Remote snapshot revision is invalid', {
      details: { reasonCode: 'invalid-snapshot-revision' },
    });
  }
  if (!Array.isArray(snapshot.files)) {
    throw new RemoteSyncError('UNSAFE_CONTENT', 'Remote snapshot files are invalid', {
      details: { reasonCode: 'invalid-snapshot-files' },
    });
  }
  for (const file of snapshot.files) {
    if (!file || typeof file !== 'object' || typeof file.path !== 'string' || typeof file.content !== 'string') {
      throw new RemoteSyncError('UNSAFE_CONTENT', 'Remote snapshot file is invalid', {
        details: { reasonCode: 'invalid-snapshot-file' },
      });
    }
  }
  const files = normalizeRemoteSnapshotFiles(snapshot.files);
  const contentHash = computeRemoteSnapshotContentHash(files);
  if (typeof snapshot.contentHash !== 'string' || snapshot.contentHash !== contentHash) {
    throw new RemoteSyncError('UNSAFE_CONTENT', 'Remote snapshot content hash is invalid', {
      details: { reasonCode: 'snapshot-content-hash-mismatch' },
    });
  }
  if (!snapshot.metadata || typeof snapshot.metadata !== 'object' || Array.isArray(snapshot.metadata)) {
    throw new RemoteSyncError('UNSAFE_CONTENT', 'Remote snapshot metadata is invalid', {
      details: { reasonCode: 'invalid-snapshot-metadata' },
    });
  }
  for (const value of Object.values(snapshot.metadata)) {
    if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) {
      throw new RemoteSyncError('UNSAFE_CONTENT', 'Remote snapshot metadata is invalid', {
        details: { reasonCode: 'invalid-snapshot-metadata' },
      });
    }
  }
  return {
    revision: snapshot.revision,
    contentHash,
    files,
    metadata: { ...snapshot.metadata },
  };
}

function readRecoveryJobId(requestId: string | undefined): string | undefined {
  return requestId?.startsWith('recover:') ? requestId.slice('recover:'.length) || undefined : undefined;
}

function readReasonCode(error: RemoteSyncError): string {
  const reasonCode = error.details?.reasonCode;
  return typeof reasonCode === 'string' ? reasonCode : error.code;
}

async function withTransaction<T>(
  db: Database,
  transaction: Transaction | undefined,
  run: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  if (transaction) {
    return run(transaction);
  }
  return db.sequelize.transaction(run);
}

function cloneFrozen<T>(value: T): T {
  return deepFreeze(structuredClone(value));
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  return value;
}
