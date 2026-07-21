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
  LightExtensionPreviewProblemAppendInput,
  LightExtensionPreviewProblemCloseInput,
  LightExtensionPreviewProblemListInput,
  LightExtensionPreviewProblemOpenInput,
  LightExtensionProblem,
  LightExtensionReferenceOwnerLocator,
} from '../../shared/types';
import { normalizeReferenceOwnerLocator } from '../services/ReferenceOwnerRegistry';
import {
  LightExtensionPreviewProblemService,
  type LightExtensionPreviewProblemServiceContext,
} from '../services/LightExtensionPreviewProblemService';
import {
  createTypedResourceAction,
  getCurrentUserId,
  type LightExtensionResourceContext,
  type ResourceActionInput,
} from './resourceAction';

export const lightExtensionPreviewProblemActionNames = ['open', 'append', 'list', 'watch', 'close'] as const;

export function createLightExtensionPreviewProblemsResource(
  previewProblemService: LightExtensionPreviewProblemService,
): ResourceOptions {
  const services = { previewProblemService };
  return {
    name: 'lightExtensionPreviewProblems',
    only: [...lightExtensionPreviewProblemActionNames],
    actions: {
      open: createTypedResourceAction({
        services,
        run: (currentServices, input, ctx) =>
          currentServices.previewProblemService.open(normalizeOpenInput(input), ctx),
        getServiceContext: getPreviewProblemServiceContext,
      }),
      append: createTypedResourceAction({
        services,
        run: (currentServices, input, ctx) =>
          currentServices.previewProblemService.append(normalizeAppendInput(input), ctx),
        getServiceContext: getPreviewProblemServiceContext,
      }),
      list: createTypedResourceAction({
        services,
        run: (currentServices, input, ctx) =>
          currentServices.previewProblemService.list(normalizeListInput(input), ctx),
        getServiceContext: getPreviewProblemServiceContext,
      }),
      watch: createTypedResourceAction({
        services,
        run: (currentServices, input, ctx) =>
          currentServices.previewProblemService.watch(normalizeListInput(input), ctx),
        getServiceContext: getPreviewProblemServiceContext,
      }),
      close: createTypedResourceAction({
        services,
        run: (currentServices, input, ctx) =>
          currentServices.previewProblemService.close(normalizeCloseInput(input), ctx),
        getServiceContext: getPreviewProblemServiceContext,
      }),
    } as Record<(typeof lightExtensionPreviewProblemActionNames)[number], HandlerType>,
  };
}

function getPreviewProblemServiceContext(
  ctx: LightExtensionResourceContext,
): LightExtensionPreviewProblemServiceContext {
  return {
    actorUserId: getCurrentUserId(ctx),
    roleNames: getCurrentRoleNames(ctx.state),
  };
}

function normalizeOpenInput(input: ResourceActionInput): LightExtensionPreviewProblemOpenInput {
  return {
    repoId: requireString(input, 'repoId'),
    entryId: requireString(input, 'entryId'),
    ownerLocator: requireOwnerLocator(input.ownerLocator),
    snapshotId: requireString(input, 'snapshotId'),
    artifactHash: requireString(input, 'artifactHash'),
    ...(typeof input.ttlMs === 'number' ? { ttlMs: input.ttlMs } : {}),
  };
}

function normalizeAppendInput(input: ResourceActionInput): LightExtensionPreviewProblemAppendInput {
  return {
    ...normalizeSessionInput(input),
    problems: normalizeProblems(input.problems),
  };
}

function normalizeListInput(input: ResourceActionInput): LightExtensionPreviewProblemListInput {
  return {
    ...normalizeSessionInput(input),
    ...(typeof input.cursor === 'number' ? { cursor: input.cursor } : {}),
  };
}

function normalizeCloseInput(input: ResourceActionInput): LightExtensionPreviewProblemCloseInput {
  if (input.state !== 'completed' && input.state !== 'stale') {
    throw invalidInput('state must be completed or stale');
  }
  return {
    ...normalizeSessionInput(input),
    state: input.state,
  };
}

function normalizeSessionInput(input: ResourceActionInput) {
  return {
    sessionId: requireString(input, 'sessionId'),
    repoId: requireString(input, 'repoId'),
    entryId: requireString(input, 'entryId'),
    ownerLocator: requireOwnerLocator(input.ownerLocator),
    snapshotId: requireString(input, 'snapshotId'),
    artifactHash: requireString(input, 'artifactHash'),
    executionId: requireString(input, 'executionId'),
  };
}

function normalizeProblems(value: unknown): LightExtensionProblem[] {
  if (!Array.isArray(value)) {
    throw invalidInput('problems must be an array');
  }
  return value.filter(isRecord).map((problem) => problem as unknown as LightExtensionProblem);
}

function requireOwnerLocator(value: unknown): LightExtensionReferenceOwnerLocator {
  const locator = normalizeReferenceOwnerLocator(value);
  if (!locator) {
    throw invalidInput('ownerLocator is required');
  }
  return locator;
}

function requireString(input: ResourceActionInput, key: string): string {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput(`${key} is required`);
  }
  return value;
}

function getCurrentRoleNames(state?: Record<string, unknown>): string[] {
  if (Array.isArray(state?.currentRoles)) {
    return state.currentRoles.filter((role): role is string => typeof role === 'string');
  }
  return typeof state?.currentRole === 'string' ? [state.currentRole] : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}
