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
  JsTemplateCreateJobDismissResult,
  JsTemplateCreateJobListResult,
  JsTemplateCreateSourceType,
} from '../../shared/types';
import { JsTemplateCreateJobStore } from '../services/JsTemplateCreateJobStore';
import { JsTemplateAuditService } from '../services/JsTemplateAuditService';
import { JsTemplatePermissionService } from '../services/JsTemplatePermissionService';
import {
  createTypedResourceAction,
  getServiceContext,
  type JsTemplateResourceContext,
  type ResourceActionInput,
} from './resourceAction';

export const jsTemplateCreateJobActionNames = ['list', 'dismiss'] as const;

type JsTemplateCreateJobActionName = (typeof jsTemplateCreateJobActionNames)[number];

interface JsTemplateCreateJobActionServices {
  store: JsTemplateCreateJobStore;
  permissionService: JsTemplatePermissionService;
  applicationName: string;
  auditService: JsTemplateAuditService;
}

export function createJsTemplateCreateJobsResource(services: JsTemplateCreateJobActionServices): ResourceOptions {
  const actions: Record<JsTemplateCreateJobActionName, HandlerType> = {
    list: createTypedResourceAction({
      services,
      getServiceContext: (ctx) => ({ ...getServiceContext(ctx), can: ctx.can }),
      run: async (currentServices, _input, ctx): Promise<JsTemplateCreateJobListResult> => {
        const actorUserId = requireActorUserId(ctx.actorUserId);
        return {
          jobs: await currentServices.store.listOwnVisibleJobs(currentServices.applicationName, actorUserId),
        };
      },
    }),
    dismiss: createTypedResourceAction({
      services,
      getServiceContext: (ctx) => ({ ...getServiceContext(ctx), can: ctx.can }),
      run: async (currentServices, input, ctx): Promise<JsTemplateCreateJobDismissResult> => {
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
  action: 'createJobDismiss',
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
