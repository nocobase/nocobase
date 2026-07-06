/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { LightExtensionError, isLightExtensionError } from '../../shared/errors';
import type { LightExtensionReferenceListInput, LightExtensionReferenceRebuildInput } from '../../shared/types';
import type { LightExtensionCanFunction } from '../services/LightExtensionPermissionService';
import { ReferenceService } from '../services/ReferenceService';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';

export const lightExtensionReferenceActionNames = ['readReferences', 'rebuildIndex'] as const;

type LightExtensionReferenceActionName = (typeof lightExtensionReferenceActionNames)[number];
type ResourceActionInput = Record<string, unknown>;

type LightExtensionResourceContext = Context & {
  action?: {
    params?: unknown;
  };
  auth?: {
    user?: unknown;
  };
  can?: LightExtensionCanFunction;
  request?: {
    header?: Record<string, string | string[] | undefined>;
    headers?: Record<string, string | string[] | undefined>;
  };
  state?: Record<string, unknown>;
  timezone?: string;
  withoutDataWrapping?: boolean;
  type?: string;
  status?: number;
  body?: unknown;
};

type ResourceActionRunner = (
  service: ReferenceService,
  input: ResourceActionInput,
  currentUser: ReturnType<typeof getServiceContext>,
) => Promise<unknown>;

const resourceActionRunners: Record<LightExtensionReferenceActionName, ResourceActionRunner> = {
  readReferences: (service, input, currentUser) => service.readReferences(normalizeListInput(input), currentUser),
  rebuildIndex: (service, input, currentUser) => service.rebuildIndex(normalizeRebuildInput(input), currentUser),
};

export function createLightExtensionReferencesResource(service: ReferenceService): ResourceOptions {
  return {
    name: 'lightExtensionReferences',
    only: [...lightExtensionReferenceActionNames],
    actions: Object.fromEntries(
      lightExtensionReferenceActionNames.map((actionName) => [
        actionName,
        createLightExtensionReferenceAction(service, resourceActionRunners[actionName]),
      ]),
    ) as Record<LightExtensionReferenceActionName, HandlerType>,
  };
}

function createLightExtensionReferenceAction(service: ReferenceService, run: ResourceActionRunner): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as LightExtensionResourceContext;
    const input = getActionInput(resourceCtx);

    try {
      resourceCtx.body = await run(service, input, getServiceContext(resourceCtx));
      await next();
    } catch (error) {
      if (!isLightExtensionError(error)) {
        throw error;
      }

      resourceCtx.withoutDataWrapping = true;
      resourceCtx.type = 'application/json';
      resourceCtx.status = error.status;
      resourceCtx.body = error.toResponseBody();
    }
  };
}

function getActionInput(ctx: LightExtensionResourceContext): ResourceActionInput {
  const params = toRecord(ctx.action?.params);
  const values = toRecord(params.values);
  const { values: _values, ...queryParams } = params;

  return {
    ...queryParams,
    ...values,
  };
}

function getServiceContext(ctx: LightExtensionResourceContext): LightExtensionServiceContext & {
  currentUser?: unknown;
  state?: Record<string, unknown>;
  timezone?: string;
} {
  const headers = ctx.request?.headers || ctx.request?.header || {};

  return {
    actorUserId: getCurrentUserId(ctx),
    requestId: getHeader(headers, 'x-request-id') || getHeader(headers, 'x-correlation-id'),
    requestSource: getHeader(headers, 'x-request-source'),
    can: ctx.can,
    currentUser: ctx.auth?.user,
    state: ctx.state,
    timezone: ctx.timezone,
  };
}

function normalizeListInput(input: ResourceActionInput): LightExtensionReferenceListInput {
  return {
    repoId: optionalString(input, 'repoId'),
    entryId: optionalString(input, 'entryId'),
    publicationId: optionalString(input, 'publicationId'),
    ownerLocator: normalizeOwnerLocator(input.ownerLocator),
  };
}

function normalizeRebuildInput(input: ResourceActionInput): LightExtensionReferenceRebuildInput {
  return {
    rootUid: optionalString(input, 'rootUid') || optionalString(input, 'uid'),
    repoId: optionalString(input, 'repoId'),
    ownerLocator: normalizeOwnerLocator(input.ownerLocator),
  };
}

function normalizeOwnerLocator(value: unknown): LightExtensionReferenceListInput['ownerLocator'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const input = value as Record<string, unknown>;
  return {
    kind: input.kind === 'flowModel.step' ? 'flowModel.step' : undefined,
    modelUid: optionalString(input, 'modelUid'),
    use: input.use === 'JSBlockModel' ? 'JSBlockModel' : undefined,
    stepPath: Array.isArray(input.stepPath) ? (input.stepPath as ['stepParams', 'jsSettings']) : undefined,
  };
}

function getCurrentUserId(ctx: LightExtensionResourceContext): string | null {
  const user = ctx.auth?.user;
  if (!user || typeof user !== 'object') {
    return null;
  }

  const userWithId = user as { id?: unknown };
  if (typeof userWithId.id === 'string' || typeof userWithId.id === 'number') {
    return String(userWithId.id);
  }

  const get = (user as { get?: (key: string) => unknown }).get;
  if (typeof get !== 'function') {
    return null;
  }

  const id = get('id');
  return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
}

function optionalString(input: ResourceActionInput, key: string): string | undefined {
  const value = input[key];
  if (typeof value === 'undefined' || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw invalidInput(`${key} must be a string`);
  }
  return value.trim() || undefined;
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toRecord(value: unknown): ResourceActionInput {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) ? (value as ResourceActionInput) : {};
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}
