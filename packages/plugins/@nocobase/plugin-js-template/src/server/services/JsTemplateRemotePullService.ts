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
} from '../../shared/vsc-file/remote-sync-types';
import { RemoteSyncError } from '../vsc-file/remotes';

import { JsTemplateError, isJsTemplateError, mapRemoteSyncErrorToJsTemplate } from '../../shared/errors';
import type { JsTemplateProject, JsTemplateSaveSourceResult } from '../../shared/types';
import { JsTemplatePermissionService } from './JsTemplatePermissionService';
import type { JsTemplateProjectInternalRecord, JsTemplateServiceContext } from './JsTemplateProjectService';
import { JsTemplateProjectService } from './JsTemplateProjectService';
import { JsTemplateCompileService } from './JsTemplateCompileService';

export interface JsTemplateRemotePullInput {
  projectId: string;
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
    input: Omit<JsTemplateRemotePullInput, 'projectId' | 'message'> & { expectedRepoId: string },
    ctx: {
      authorId?: string | null;
      request?: ReturnType<JsTemplatePermissionService['createInternalVscRequestContext']>;
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

export interface JsTemplateRemotePullResult {
  plan: VscRemoteSyncPlan;
  project: JsTemplateProject;
  commitId: string | null;
  changed: boolean;
  compile: JsTemplateSaveSourceResult['compile'] | null;
}

export class JsTemplateRemotePullService {
  constructor(
    private readonly permissionService: JsTemplatePermissionService,
    private readonly projectService: JsTemplateProjectService,
    private readonly runtimeCompileService: JsTemplateCompileService,
    private readonly pullDiscovery: RemotePullDiscoveryCoordinator,
  ) {}

  async pull(
    input: JsTemplateRemotePullInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateRemotePullResult> {
    await this.permissionService.assertActionAllowed({ action: 'pullFromSyncSource', ctx });
    const initialProject = await this.projectService.getInternalProject(input.projectId, ctx);
    const requestId = ctx.requestId || `remote-pull:${input.remoteId}`;
    let discovery: RemotePullDiscoveryResult;
    try {
      discovery = await this.pullDiscovery.discover(
        {
          remoteId: input.remoteId,
          expectedRepoId: initialProject.vscRepoId,
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
            reason: 'discover remote source for js-template pull',
            allowedActions: ['pull'],
            actorUserId: ctx.actorUserId,
            jsTemplateProjectId: input.projectId,
            aclAction: 'pullFromSyncSource',
            requestSource: ctx.requestSource || 'js-template-remote-pull',
          }),
        },
      );
    } catch (error) {
      throw normalizePullError(error);
    }

    assertRemoteOwnsRepository(discovery.remote, initialProject.vscRepoId);
    if (!discovery.applyRequired || !discovery.handle) {
      const currentProject = await this.projectService.getProject(input.projectId, ctx);
      return {
        plan: discovery.plan,
        project: currentProject,
        commitId: discovery.job.resultLocalCommitId || currentProject.headCommitId,
        changed: false,
        compile: null,
      };
    }

    const handle = discovery.handle;
    try {
      const prepared = await this.pullDiscovery.runWithClaimLease(handle, () =>
        this.runtimeCompileService.prepareRemoteSnapshot(
          {
            projectId: input.projectId,
            expectedHeadCommitId: input.expectedLocalCommitId,
            snapshot: handle.snapshot,
            message: input.message || `Pull source from ${handle.remote.provider}`,
            remoteId: handle.remote.id,
          },
          {
            ...ctx,
            requestId,
            requestSource: ctx.requestSource || 'js-template-remote-pull-prepare',
          },
        ),
      );
      const applied = await this.pullDiscovery.apply<JsTemplateProjectInternalRecord, RemotePullOwnerApplyResult>(
        handle,
        {
          lockOwner: (transaction) =>
            this.projectService.lockInternalProjectForUpdate(input.projectId, { ...ctx, transaction }),
          applyOwnerSnapshot: async (transaction, remote, project) => {
            assertRemoteOwnsRepository(remote, project.vscRepoId);
            assertExpectedHead(input.expectedLocalCommitId, project.headCommitId);
            if (!prepared.source.changed) {
              const currentProject = await this.projectService.getProject(project.id, { ...ctx, transaction });
              if (!project.headCommitId) {
                throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'JS Template source has no commit after pull');
              }
              return {
                project: currentProject,
                commitId: project.headCommitId,
                contentHash: prepared.source.contentHash,
                changed: false,
                compile: { status: 'skipped', templates: [] },
                localCommitId: project.headCommitId,
              };
            }
            if (!prepared.preparedSave) {
              throw new JsTemplateError(
                'JS_TEMPLATE_SOURCE_ERROR',
                'Prepared remote source is missing its compile state',
              );
            }
            const result = await this.runtimeCompileService.commitPreparedSave(prepared.preparedSave, {
              ...ctx,
              transaction,
              requestId,
              requestSource: ctx.requestSource || 'js-template-remote-pull',
            });
            if (result.project.headCommitId !== result.commit.id) {
              throw new JsTemplateError(
                'JS_TEMPLATE_SOURCE_OUTDATED',
                'JS Template source Head does not match the applied pull commit',
                {
                  details: {
                    expectedHeadCommitId: result.commit.id,
                    currentHeadCommitId: result.project.headCommitId,
                  },
                },
              );
            }
            return {
              project: result.project,
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
        project: applied.result.project,
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
  project: JsTemplateProject;
  commitId: string;
  changed: boolean;
  compile: JsTemplateSaveSourceResult['compile'];
}

function assertRemoteOwnsRepository(remote: VscFileRemoteRecord, vscRepoId: string): void {
  if (remote.repoId === vscRepoId) {
    return;
  }
  throw new JsTemplateError(
    'JS_TEMPLATE_SYNC_CONFIG_INVALID',
    'Remote does not belong to the requested JS Template project',
    {
      details: { reasonCode: 'remote-repository-mismatch' },
    },
  );
}

function assertExpectedHead(expected: string | null, current: string | null): void {
  if (expected === current) {
    return;
  }
  throw new JsTemplateError('JS_TEMPLATE_SOURCE_OUTDATED', 'JS Template source changed before pull apply', {
    details: { expectedHeadCommitId: expected, currentHeadCommitId: current },
  });
}

function toRemoteFailureCode(error: unknown): RemoteSyncErrorCode {
  if (error instanceof RemoteSyncError) {
    return error.code;
  }
  if (isJsTemplateError(error)) {
    if (error.code === 'JS_TEMPLATE_SOURCE_OUTDATED') {
      return 'LOCAL_OUTDATED';
    }
    if (error.code === 'JS_TEMPLATE_PERMISSION_DENIED') {
      return 'PERMISSION_DENIED';
    }
    if (error.code === 'JS_TEMPLATE_VALIDATION_FAILED' || error.code === 'JS_TEMPLATE_SYNC_UNSAFE_CONTENT') {
      return 'UNSAFE_CONTENT';
    }
  }
  return 'REMOTE_UNAVAILABLE';
}

function normalizePullError(error: unknown): Error {
  if (error instanceof RemoteSyncError) {
    return mapRemoteSyncErrorToJsTemplate(error);
  }
  if (isJsTemplateError(error)) {
    if (error.code === 'JS_TEMPLATE_SOURCE_OUTDATED') {
      return mapRemoteSyncErrorToJsTemplate(
        new RemoteSyncError('LOCAL_OUTDATED', error.message, { details: error.details }),
      );
    }
    return error;
  }
  return new JsTemplateError('JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE', 'JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE', {
    details: { reasonCode: 'remote-pull-failed' },
  });
}
