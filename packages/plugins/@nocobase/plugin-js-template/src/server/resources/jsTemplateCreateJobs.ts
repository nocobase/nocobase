/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { JsTemplateError } from '../../shared/errors';
import type {
  JsTemplateCreateJobAcceptedResult,
  JsTemplateCreateJobDismissResult,
  JsTemplateCreateJobListResult,
  JsTemplateCreateSourceType,
} from '../../shared/types';
import type { JsTemplateCreateJobRunner } from '../services/JsTemplateCreateJobRunner';
import { JsTemplateCreateJobStore, toCreateJobSummary } from '../services/JsTemplateCreateJobStore';
import { JsTemplateAuditService } from '../services/JsTemplateAuditService';
import { JsTemplatePermissionService } from '../services/JsTemplatePermissionService';
import {
  createTypedResourceAction,
  getServiceContext,
  type JsTemplateResourceContext,
  type ResourceActionInput,
} from './resourceAction';

export const jsTemplateCreateJobActionNames = ['list', 'get', 'retry', 'dismiss'] as const;

type JsTemplateCreateJobActionName = (typeof jsTemplateCreateJobActionNames)[number];

interface JsTemplateCreateJobActionServices {
  store: JsTemplateCreateJobStore;
  permissionService: JsTemplatePermissionService;
  applicationName: string;
  auditService: JsTemplateAuditService;
  runner: JsTemplateCreateJobRunner;
}

export function createJsTemplateCreateJobsResource(services: JsTemplateCreateJobActionServices): ResourceOptions {
  const actions: Record<JsTemplateCreateJobActionName, HandlerType> = {
    list: createTypedResourceAction({
      services,
      getServiceContext: (ctx) => ({ ...getServiceContext(ctx), can: ctx.can }),
      run: async (currentServices, _input, ctx): Promise<JsTemplateCreateJobListResult> => {
        const actorUserId = requireActorUserId(ctx.actorUserId);
        const sessionId = requireSessionId(ctx.sessionId);
        const jobs = await currentServices.store.listOwnVisibleJobs(
          currentServices.applicationName,
          actorUserId,
          sessionId,
        );
        const visibleJobs = [];
        for (const job of jobs) {
          if (await hasSourcePermissions(currentServices.permissionService, job.sourceType, ctx)) {
            visibleJobs.push(job);
          }
        }
        return {
          jobs: visibleJobs,
        };
      },
    }),
    get: createTypedResourceAction({
      services,
      getServiceContext: (ctx) => ({ ...getServiceContext(ctx), can: ctx.can }),
      run: async (currentServices, input, ctx): Promise<JsTemplateCreateJobAcceptedResult> => {
        assertOnlyJobId(input);
        const actorUserId = requireActorUserId(ctx.actorUserId);
        const sessionId = requireSessionId(ctx.sessionId);
        const job = await currentServices.store.getOwn(
          requireJobId(input),
          currentServices.applicationName,
          actorUserId,
          sessionId,
        );
        await assertSourcePermissions(currentServices.permissionService, job.sourceType, ctx);
        return toCreateJobSummary(job);
      },
    }),
    retry: createTypedResourceAction({
      services,
      getServiceContext: (ctx) => ({ ...getServiceContext(ctx), can: ctx.can }),
      run: async (currentServices, input, ctx): Promise<JsTemplateCreateJobAcceptedResult> => {
        assertOnlyJobId(input);
        const actorUserId = requireActorUserId(ctx.actorUserId);
        const sessionId = requireSessionId(ctx.sessionId);
        const current = await currentServices.store.getOwn(
          requireJobId(input),
          currentServices.applicationName,
          actorUserId,
          sessionId,
        );
        await assertSourcePermissions(currentServices.permissionService, current.sourceType, ctx);
        const job = await currentServices.store.retry(
          current.id,
          currentServices.applicationName,
          actorUserId,
          sessionId,
        );
        await currentServices.runner.publish(job.id);
        await recordMutationAudit(currentServices.auditService, job, 'createJobRetry');
        return toCreateJobSummary(job);
      },
    }),
    dismiss: createTypedResourceAction({
      services,
      getServiceContext: (ctx) => ({ ...getServiceContext(ctx), can: ctx.can }),
      run: async (currentServices, input, ctx): Promise<JsTemplateCreateJobDismissResult> => {
        assertOnlyJobId(input);
        const actorUserId = requireActorUserId(ctx.actorUserId);
        const sessionId = requireSessionId(ctx.sessionId);
        const jobId = requireJobId(input);
        const job = await currentServices.store.getOwn(jobId, currentServices.applicationName, actorUserId, sessionId);
        await assertSourcePermissions(currentServices.permissionService, job.sourceType, ctx);
        await currentServices.store.dismiss(job.id, currentServices.applicationName, actorUserId, sessionId);
        await recordMutationAudit(currentServices.auditService, job, 'createJobDismiss');
        return { id: job.id };
      },
    }),
  };

  return {
    name: 'jsTemplateCreateJobs',
    only: [...jsTemplateCreateJobActionNames],
    actions,
  };
}

async function recordMutationAudit(
  auditService: JsTemplateAuditService,
  job: {
    id: string;
    targetProjectId: string;
    sourceType: JsTemplateCreateSourceType;
    requestId: string | null;
    actorUserId: string | null;
  },
  action: 'createJobRetry' | 'createJobDismiss',
): Promise<void> {
  try {
    await auditService.recordCreateJobEvent({
      jobId: job.id,
      targetProjectId: job.targetProjectId,
      sourceType: job.sourceType,
      action,
      result: 'success',
      requestId: job.requestId,
      actorUserId: job.actorUserId,
    });
  } catch {
    // Job mutation durability must not depend on audit persistence availability.
  }
}

async function assertSourcePermissions(
  permissionService: JsTemplatePermissionService,
  sourceType: JsTemplateCreateSourceType,
  ctx: { can?: JsTemplateResourceContext['can'] },
): Promise<void> {
  await permissionService.assertActionAllowed({ action: 'create', ctx });
  if (sourceType !== 'git') {
    return;
  }
  await permissionService.assertActionAllowed({ action: 'manageSyncSource', ctx });
  await permissionService.assertActionAllowed({ action: 'pullFromSyncSource', ctx });
}

async function hasSourcePermissions(
  permissionService: JsTemplatePermissionService,
  sourceType: JsTemplateCreateSourceType,
  ctx: { can?: JsTemplateResourceContext['can'] },
): Promise<boolean> {
  try {
    await assertSourcePermissions(permissionService, sourceType, ctx);
    return true;
  } catch (error) {
    if (error instanceof JsTemplateError && error.code === 'JS_TEMPLATE_PERMISSION_DENIED') {
      return false;
    }
    throw error;
  }
}

function assertOnlyJobId(input: ResourceActionInput): void {
  const keys = Object.keys(input).filter((key) => typeof input[key] !== 'undefined');
  if (keys.some((key) => key !== 'resourceName' && key !== 'actionName' && key !== 'jobId' && key !== 'filterByTk')) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'Request contains unsupported fields');
  }
}

function requireJobId(input: ResourceActionInput): string {
  const value = input.jobId || input.filterByTk;
  if (typeof value !== 'string' || !value.trim()) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'jobId is required');
  }
  return value.trim();
}

function requireActorUserId(actorUserId: string | null | undefined): string {
  if (!actorUserId) {
    throw new JsTemplateError('JS_TEMPLATE_PERMISSION_DENIED', 'Authenticated user identity is required');
  }
  return actorUserId;
}

function requireSessionId(sessionId: string | null | undefined): string {
  if (!sessionId) {
    throw new JsTemplateError('JS_TEMPLATE_PERMISSION_DENIED', 'Authenticated session identity is required');
  }
  return sessionId;
}
