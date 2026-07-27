/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionCreateJobDismissResult,
  LightExtensionCreateJobListResult,
  LightExtensionCreateJobRetryResult,
  LightExtensionCreateSourceType,
} from '../../shared/types';
import { LightExtensionCreateJobRunner } from '../services/LightExtensionCreateJobRunner';
import { LightExtensionCreateJobStore, toCreateJobSummary } from '../services/LightExtensionCreateJobStore';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import {
  createTypedResourceAction,
  getServiceContext,
  type LightExtensionResourceContext,
  type ResourceActionInput,
} from './resourceAction';

export const lightExtensionCreateJobActionNames = ['list', 'retry', 'dismiss'] as const;

type LightExtensionCreateJobActionName = (typeof lightExtensionCreateJobActionNames)[number];

interface LightExtensionCreateJobActionServices {
  store: LightExtensionCreateJobStore;
  runner: LightExtensionCreateJobRunner;
  permissionService: LightExtensionPermissionService;
  applicationName: string;
  auditService: LightExtensionAuditService;
}

export function createLightExtensionCreateJobsResource(
  services: LightExtensionCreateJobActionServices,
): ResourceOptions {
  const actions: Record<LightExtensionCreateJobActionName, HandlerType> = {
    list: createTypedResourceAction({
      services,
      getServiceContext: (ctx) => ({ ...getServiceContext(ctx), can: ctx.can }),
      run: async (currentServices, input, ctx): Promise<LightExtensionCreateJobListResult> => {
        if (Object.keys(input).some((key) => typeof input[key] !== 'undefined')) {
          throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Request contains unsupported fields');
        }
        const actorUserId = requireActorUserId(ctx.actorUserId);
        return {
          jobs: await currentServices.store.listOwnVisibleJobs(currentServices.applicationName, actorUserId),
        };
      },
    }),
    retry: createTypedResourceAction({
      services,
      getServiceContext: (ctx) => ({ ...getServiceContext(ctx), can: ctx.can }),
      run: async (currentServices, input, ctx): Promise<LightExtensionCreateJobRetryResult> => {
        assertOnlyJobId(input);
        const actorUserId = requireActorUserId(ctx.actorUserId);
        const jobId = requireJobId(input);
        const job = await currentServices.store.getOwn(jobId, currentServices.applicationName, actorUserId);
        await assertSourcePermissions(currentServices.permissionService, job.sourceType, ctx);
        const retried = await currentServices.store.retry(job.id, currentServices.applicationName, actorUserId);
        currentServices.runner.scheduleWake(retried.id);
        await recordMutationAudit(currentServices.auditService, retried, 'createJobRetry');
        return toCreateJobSummary(retried);
      },
    }),
    dismiss: createTypedResourceAction({
      services,
      getServiceContext: (ctx) => ({ ...getServiceContext(ctx), can: ctx.can }),
      run: async (currentServices, input, ctx): Promise<LightExtensionCreateJobDismissResult> => {
        assertOnlyJobId(input);
        const actorUserId = requireActorUserId(ctx.actorUserId);
        const jobId = requireJobId(input);
        const job = await currentServices.store.getOwn(jobId, currentServices.applicationName, actorUserId);
        await assertSourcePermissions(currentServices.permissionService, job.sourceType, ctx);
        await currentServices.store.dismiss(job.id, currentServices.applicationName, actorUserId);
        await recordMutationAudit(currentServices.auditService, job, 'createJobDismiss');
        return { id: job.id };
      },
    }),
  };

  return {
    name: 'lightExtensionCreateJobs',
    only: [...lightExtensionCreateJobActionNames],
    actions,
  };
}

async function recordMutationAudit(
  auditService: LightExtensionAuditService,
  job: {
    id: string;
    targetRepoId: string;
    sourceType: LightExtensionCreateSourceType;
    requestId: string | null;
    actorUserId: string | null;
  },
  action: 'createJobRetry' | 'createJobDismiss',
): Promise<void> {
  try {
    await auditService.recordCreateJobEvent({
      jobId: job.id,
      targetRepoId: job.targetRepoId,
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
  permissionService: LightExtensionPermissionService,
  sourceType: LightExtensionCreateSourceType,
  ctx: { can?: LightExtensionResourceContext['can'] },
): Promise<void> {
  await permissionService.assertActionAllowed({ action: 'create', ctx });
  if (sourceType !== 'git') {
    return;
  }
  await permissionService.assertActionAllowed({ action: 'manageSyncSource', ctx });
  await permissionService.assertActionAllowed({ action: 'pullFromSyncSource', ctx });
}

function assertOnlyJobId(input: ResourceActionInput): void {
  const keys = Object.keys(input).filter((key) => typeof input[key] !== 'undefined');
  if (keys.some((key) => key !== 'jobId' && key !== 'filterByTk')) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Request contains unsupported fields');
  }
}

function requireJobId(input: ResourceActionInput): string {
  const value = input.jobId || input.filterByTk;
  if (typeof value !== 'string' || !value.trim()) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'jobId is required');
  }
  return value.trim();
}

function requireActorUserId(actorUserId: string | null | undefined): string {
  if (!actorUserId) {
    throw new LightExtensionError('LIGHT_EXTENSION_PERMISSION_DENIED', 'Authenticated user identity is required');
  }
  return actorUserId;
}
