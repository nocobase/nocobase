/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Transaction } from '@nocobase/database';
import type {
  RemoteSyncErrorCode,
  VscFileRemoteRecord,
  VscFileSyncJobRecord,
  VscRemoteSnapshot,
  VscRemoteSyncPlan,
} from '../vsc-file/public-api';
import { RemoteSyncError } from '../vsc-file/public-api';

import { LightExtensionError, isLightExtensionError, mapRemoteSyncErrorToLightExtension } from '../../shared/errors';
import type { LightExtensionRepoRecord, LightExtensionSaveSourceResult } from '../../shared/types';
import { LightExtensionPermissionService } from './LightExtensionPermissionService';
import type { LightExtensionRepoInternalRecord, LightExtensionServiceContext } from './LightExtensionRepoService';
import { LightExtensionRepoService } from './LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from './LightExtensionRuntimeCompileService';

export interface LightExtensionRemotePullInput {
  repoId: string;
  remoteId: string;
  expectedLocalCommitId: string | null;
  expectedRemoteRevision: string | null;
  expectedRemoteTargetVersion: number;
  planFingerprint: string;
  idempotencyKey?: string;
  maxAttempts?: number;
  message?: string;
}

interface RemotePullHandle {
  remote: VscFileRemoteRecord;
  jobId: string;
  claimToken: string;
  leaseDurationMs: number;
  expectedLocalCommitId: string | null;
  expectedRemoteRevision: string;
  expectedRemoteTargetVersion: number;
  planFingerprint: string;
  snapshot: VscRemoteSnapshot;
}

interface RemotePullDiscoveryResult {
  remote: VscFileRemoteRecord;
  job: VscFileSyncJobRecord;
  snapshot: VscRemoteSnapshot;
  plan: VscRemoteSyncPlan;
  applyRequired: boolean;
  handle: RemotePullHandle | null;
}

interface RemotePullDiscoveryCoordinator {
  discover(
    input: Omit<LightExtensionRemotePullInput, 'repoId' | 'message'> & { expectedRepoId: string },
    ctx: {
      authorId?: string | null;
      request?: ReturnType<LightExtensionPermissionService['createInternalVscRequestContext']>;
    },
  ): Promise<RemotePullDiscoveryResult>;
  apply<TOwner, TResult>(
    handle: RemotePullHandle,
    ownerApply: {
      lockOwner(transaction: Transaction): Promise<TOwner>;
      applyOwnerSnapshot(
        transaction: Transaction,
        remote: VscFileRemoteRecord,
        owner: TOwner,
      ): Promise<{ localCommitId: string; contentHash: string } & TResult>;
    },
  ): Promise<{ job: VscFileSyncJobRecord; result: { localCommitId: string; contentHash: string } & TResult }>;
  runWithClaimLease<TResult>(handle: RemotePullHandle, action: () => Promise<TResult>): Promise<TResult>;
  failApply(handle: RemotePullHandle, code: RemoteSyncErrorCode): Promise<void>;
}

export interface LightExtensionRemotePullResult {
  plan: VscRemoteSyncPlan;
  repo: LightExtensionRepoRecord;
  commitId: string | null;
  changed: boolean;
  compile: LightExtensionSaveSourceResult['compile'] | null;
}

export class LightExtensionRemotePullService {
  constructor(
    private readonly permissionService: LightExtensionPermissionService,
    private readonly repoService: LightExtensionRepoService,
    private readonly runtimeCompileService: LightExtensionRuntimeCompileService,
    private readonly pullDiscovery: RemotePullDiscoveryCoordinator,
  ) {}

  async pull(
    input: LightExtensionRemotePullInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRemotePullResult> {
    await this.permissionService.assertActionAllowed({ action: 'pullFromSyncSource', ctx });
    const initialRepo = await this.repoService.getInternalRepo(input.repoId, ctx);
    assertRepoWritable(initialRepo);
    const requestId = ctx.requestId || `remote-pull:${input.remoteId}`;
    let discovery: RemotePullDiscoveryResult;
    try {
      discovery = await this.pullDiscovery.discover(
        {
          remoteId: input.remoteId,
          expectedRepoId: initialRepo.vscRepoId,
          expectedLocalCommitId: input.expectedLocalCommitId,
          expectedRemoteRevision: input.expectedRemoteRevision,
          expectedRemoteTargetVersion: input.expectedRemoteTargetVersion,
          planFingerprint: input.planFingerprint,
          idempotencyKey: input.idempotencyKey,
          maxAttempts: input.maxAttempts,
        },
        {
          authorId: ctx.actorUserId || null,
          request: this.permissionService.createInternalVscRequestContext({
            requestId,
            reason: 'discover remote source for light-extension pull',
            allowedActions: ['pull'],
            actorUserId: ctx.actorUserId,
            lightExtensionRepoId: input.repoId,
            aclAction: 'pullFromSyncSource',
            requestSource: ctx.requestSource || 'light-extension-remote-pull',
          }),
        },
      );
    } catch (error) {
      throw normalizePullError(error);
    }

    assertRemoteOwnsRepository(discovery.remote, initialRepo.vscRepoId);
    if (!discovery.applyRequired || !discovery.handle) {
      const currentRepo = await this.repoService.getRepo(input.repoId, ctx);
      return {
        plan: discovery.plan,
        repo: currentRepo,
        commitId: discovery.job.resultLocalCommitId || currentRepo.headCommitId,
        changed: false,
        compile: null,
      };
    }

    const handle = discovery.handle;
    try {
      const prepared = await this.pullDiscovery.runWithClaimLease(handle, () =>
        this.runtimeCompileService.prepareRemoteSnapshot(
          {
            repoId: input.repoId,
            expectedHeadCommitId: input.expectedLocalCommitId,
            snapshot: handle.snapshot,
            message: input.message || `Pull source from ${handle.remote.provider}`,
            remoteId: handle.remote.id,
          },
          {
            ...ctx,
            requestId,
            requestSource: ctx.requestSource || 'light-extension-remote-pull-prepare',
          },
        ),
      );
      const applied = await this.pullDiscovery.apply<LightExtensionRepoInternalRecord, RemotePullOwnerApplyResult>(
        handle,
        {
          lockOwner: (transaction) => this.repoService.lockInternalRepoForUpdate(input.repoId, { ...ctx, transaction }),
          applyOwnerSnapshot: async (transaction, remote, repo) => {
            assertRepoWritable(repo);
            assertRemoteOwnsRepository(remote, repo.vscRepoId);
            assertExpectedHead(input.expectedLocalCommitId, repo.headCommitId);
            if (!prepared.source.changed) {
              const currentRepo = await this.repoService.getRepo(repo.id, { ...ctx, transaction });
              if (!repo.headCommitId) {
                throw new LightExtensionError(
                  'LIGHT_EXTENSION_SOURCE_ERROR',
                  'Light extension source has no commit after pull',
                );
              }
              return {
                repo: currentRepo,
                commitId: repo.headCommitId,
                contentHash: prepared.source.contentHash,
                changed: false,
                compile: { status: 'skipped', entries: [] },
                localCommitId: repo.headCommitId,
              };
            }
            if (!prepared.preparedSave) {
              throw new LightExtensionError(
                'LIGHT_EXTENSION_SOURCE_ERROR',
                'Prepared remote source is missing its compile state',
              );
            }
            const result = await this.runtimeCompileService.publishPreparedSave(prepared.preparedSave, {
              ...ctx,
              transaction,
              requestId,
              requestSource: ctx.requestSource || 'light-extension-remote-pull',
            });
            if (result.repo.headCommitId !== result.commit.id) {
              throw new LightExtensionError(
                'LIGHT_EXTENSION_SOURCE_OUTDATED',
                'Light extension source Head does not match the applied pull commit',
                {
                  details: {
                    expectedHeadCommitId: result.commit.id,
                    currentHeadCommitId: result.repo.headCommitId,
                  },
                },
              );
            }
            return {
              repo: result.repo,
              commitId: result.commit.id,
              contentHash: prepared.source.contentHash,
              changed: true,
              compile: result.compile,
              localCommitId: result.commit.id,
            };
          },
        },
      );
      return {
        plan: discovery.plan,
        repo: applied.result.repo,
        commitId: applied.result.commitId,
        changed: applied.result.changed,
        compile: applied.result.compile,
      };
    } catch (error) {
      await this.failApplyBestEffort(handle, toRemoteFailureCode(error));
      throw normalizePullError(error);
    }
  }

  private async failApplyBestEffort(handle: RemotePullHandle, code: RemoteSyncErrorCode): Promise<void> {
    try {
      await this.pullDiscovery.failApply(handle, code);
    } catch {
      // A lost or expired claim remains recoverable and must not mask the owner-domain failure.
    }
  }
}

interface RemotePullOwnerApplyResult {
  repo: LightExtensionRepoRecord;
  commitId: string;
  changed: boolean;
  compile: LightExtensionSaveSourceResult['compile'];
}

function assertRepoWritable(repo: { id: string; lifecycleStatus: string }): void {
  if (repo.lifecycleStatus !== 'archived') {
    return;
  }
  throw new LightExtensionError('LIGHT_EXTENSION_REPO_ARCHIVED', 'Archived light extension repositories cannot pull');
}

function assertRemoteOwnsRepository(remote: VscFileRemoteRecord, vscRepoId: string): void {
  if (remote.repoId === vscRepoId) {
    return;
  }
  throw new LightExtensionError(
    'LIGHT_EXTENSION_SYNC_CONFIG_INVALID',
    'Remote does not belong to the requested light extension repository',
    {
      details: { reasonCode: 'remote-repository-mismatch' },
    },
  );
}

function assertExpectedHead(expected: string | null, current: string | null): void {
  if (expected === current) {
    return;
  }
  throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_OUTDATED', 'Light extension source changed before pull apply', {
    details: { expectedHeadCommitId: expected, currentHeadCommitId: current },
  });
}

function toRemoteFailureCode(error: unknown): RemoteSyncErrorCode {
  if (error instanceof RemoteSyncError) {
    return error.code;
  }
  if (isLightExtensionError(error)) {
    if (error.code === 'LIGHT_EXTENSION_REPO_ARCHIVED') {
      return 'REPO_ARCHIVED';
    }
    if (error.code === 'LIGHT_EXTENSION_SOURCE_OUTDATED') {
      return 'LOCAL_OUTDATED';
    }
    if (error.code === 'LIGHT_EXTENSION_PERMISSION_DENIED') {
      return 'PERMISSION_DENIED';
    }
    if (error.code === 'LIGHT_EXTENSION_VALIDATION_FAILED' || error.code === 'LIGHT_EXTENSION_SYNC_UNSAFE_CONTENT') {
      return 'UNSAFE_CONTENT';
    }
  }
  return 'REMOTE_UNAVAILABLE';
}

function normalizePullError(error: unknown): Error {
  if (error instanceof RemoteSyncError) {
    return mapRemoteSyncErrorToLightExtension(error);
  }
  if (isLightExtensionError(error)) {
    return error;
  }
  return new LightExtensionError('LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE', 'LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE', {
    details: { reasonCode: 'remote-pull-failed' },
  });
}
