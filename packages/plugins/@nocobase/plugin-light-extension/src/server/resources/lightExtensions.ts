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
import {
  type LightExtensionCompilePreviewInput,
  LightExtensionCompilePreviewService,
} from '../services/LightExtensionCompilePreviewService';
import type { LightExtensionCanFunction } from '../services/LightExtensionPermissionService';
import {
  type LightExtensionPublishInput,
  LightExtensionPublishService,
} from '../services/LightExtensionPublishService';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';

export const lightExtensionActionNames = ['compilePreview', 'publish'] as const;

type LightExtensionActionName = (typeof lightExtensionActionNames)[number];
type ResourceActionInput = Record<string, unknown>;

type LightExtensionResourceContext = Context & {
  action?: {
    params?: unknown;
    resourceName?: string;
    actionName?: string;
  };
  auth?: {
    user?: unknown;
  };
  can?: LightExtensionCanFunction;
  request?: {
    path?: string;
    method?: string;
    header?: Record<string, string | string[] | undefined>;
    headers?: Record<string, string | string[] | undefined>;
  };
  withoutDataWrapping?: boolean;
  type?: string;
  status?: number;
  body?: unknown;
};

type ResourceActionRunner = (
  service: LightExtensionActionServices,
  input: ResourceActionInput,
  currentUser: LightExtensionServiceContext,
) => Promise<unknown>;

interface LightExtensionActionServices {
  compilePreviewService: LightExtensionCompilePreviewService;
  publishService?: LightExtensionPublishService;
}

const resourceActionRunners: Record<LightExtensionActionName, ResourceActionRunner> = {
  compilePreview: (services, input, currentUser) =>
    services.compilePreviewService.compilePreview(normalizeCompilePreviewInput(input), currentUser),
  publish: (services, input, currentUser) => {
    if (!services.publishService) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
        'Light extension publish service is not available',
      );
    }

    return services.publishService.publish(normalizePublishInput(input), currentUser);
  },
};

export function createLightExtensionsResource(
  compilePreviewService: LightExtensionCompilePreviewService,
  publishService?: LightExtensionPublishService,
): ResourceOptions {
  const services = {
    compilePreviewService,
    publishService,
  };

  return {
    name: 'lightExtensions',
    only: [...lightExtensionActionNames],
    actions: Object.fromEntries(
      lightExtensionActionNames.map((actionName) => [
        actionName,
        createLightExtensionAction(services, resourceActionRunners[actionName]),
      ]),
    ) as Record<LightExtensionActionName, HandlerType>,
  };
}

function createLightExtensionAction(services: LightExtensionActionServices, run: ResourceActionRunner): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as LightExtensionResourceContext;
    const input = getActionInput(resourceCtx);

    try {
      const result = await run(services, input, getServiceContext(resourceCtx));
      resourceCtx.body = result;
      const httpStatus = readHttpStatus(result);
      if (httpStatus) {
        resourceCtx.status = httpStatus;
      }
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

function normalizeCompilePreviewInput(input: ResourceActionInput): LightExtensionCompilePreviewInput {
  return {
    repoId: requireRepoId(input),
    entryIds: optionalStringArray(input, 'entryIds'),
  };
}

function normalizePublishInput(input: ResourceActionInput): LightExtensionPublishInput {
  return {
    repoId: requireRepoId(input),
    entryIds: requireStringArray(input, 'entryIds'),
    commitId: requireString(input, 'commitId'),
    clientRequestId: requireString(input, 'clientRequestId'),
    activate: optionalBoolean(input, 'activate'),
    expectedCurrentPublicationIdByEntry: optionalStringNullRecord(input, 'expectedCurrentPublicationIdByEntry'),
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

function getServiceContext(ctx: LightExtensionResourceContext): LightExtensionServiceContext {
  const headers = ctx.request?.headers || ctx.request?.header || {};

  return {
    actorUserId: getCurrentUserId(ctx),
    requestId: getHeader(headers, 'x-request-id') || getHeader(headers, 'x-correlation-id'),
    requestSource: getHeader(headers, 'x-request-source'),
    can: ctx.can,
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

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function requireRepoId(input: ResourceActionInput): string {
  return requireString(
    {
      repoId: input.repoId || input.filterByTk,
    },
    'repoId',
  );
}

function requireString(input: ResourceActionInput, key: string, label = key): string {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput(`${label} is required`);
  }

  return value.trim();
}

function optionalStringArray(input: ResourceActionInput, key: string): string[] | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw invalidInput(`${key} must be an array of strings`);
  }

  return value.map((item) => item.trim());
}

function requireStringArray(input: ResourceActionInput, key: string): string[] {
  const value = optionalStringArray(input, key);
  if (!value?.length) {
    throw invalidInput(`${key} is required`);
  }

  return value;
}

function optionalBoolean(input: ResourceActionInput, key: string): boolean | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw invalidInput(`${key} must be a boolean`);
  }

  return value;
}

function optionalStringNullRecord(input: ResourceActionInput, key: string): Record<string, string | null> | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidInput(`${key} must be an object`);
  }

  const record: Record<string, string | null> = {};
  for (const [recordKey, recordValue] of Object.entries(value)) {
    if (typeof recordValue !== 'string' && recordValue !== null) {
      throw invalidInput(`${key}.${recordKey} must be a string or null`);
    }
    record[recordKey] = recordValue;
  }

  return record;
}

function toRecord(value: unknown): ResourceActionInput {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) ? (value as ResourceActionInput) : {};
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}

function readHttpStatus(value: unknown): 200 | 207 | 422 | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const status = (value as { httpStatus?: unknown }).httpStatus;
  return status === 200 || status === 207 || status === 422 ? status : undefined;
}
