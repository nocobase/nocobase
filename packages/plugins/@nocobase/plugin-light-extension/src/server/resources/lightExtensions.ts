/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { normalizeRunJSSourceLocator, type RunJSSourcePermissionResult } from '@nocobase/plugin-vsc-file';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { LightExtensionError, isLightExtensionError } from '../../shared/errors';
import type { LightExtensionMoveSourceInput } from '../../shared/types';
import {
  type LightExtensionCompilePreviewInput,
  LightExtensionCompilePreviewService,
} from '../services/LightExtensionCompilePreviewService';
import type { LightExtensionCanFunction } from '../services/LightExtensionPermissionService';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';
import { MoveSourceService, type MoveSourceServiceContext } from '../services/MoveSourceService';

export const lightExtensionActionNames = ['compilePreview', 'moveSource'] as const;

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
  state?: Record<string, unknown>;
  timezone?: string;
};

type ResourceActionRunner = (
  service: LightExtensionActionServices,
  input: ResourceActionInput,
  currentUser: MoveSourceServiceContext,
) => Promise<unknown>;

interface LightExtensionActionServices {
  compilePreviewService: LightExtensionCompilePreviewService;
  moveSourceService?: MoveSourceService;
}

const resourceActionRunners: Record<LightExtensionActionName, ResourceActionRunner> = {
  compilePreview: (services, input, currentUser) =>
    services.compilePreviewService.compilePreview(normalizeCompilePreviewInput(input), currentUser),
  moveSource: (services, input, currentUser) => {
    if (!services.moveSourceService) {
      throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'Move source service is unavailable');
    }
    return services.moveSourceService.moveSource(normalizeMoveSourceInput(input), currentUser);
  },
};

export function createLightExtensionsResource(
  compilePreviewService: LightExtensionCompilePreviewService,
  moveSourceService?: MoveSourceService,
): ResourceOptions {
  const services = {
    compilePreviewService,
    moveSourceService,
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

function normalizeMoveSourceInput(input: ResourceActionInput): LightExtensionMoveSourceInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    expectedOwnerFingerprint: requireString(input, 'expectedOwnerFingerprint'),
    sourceRepoId: requireString(input, 'sourceRepoId'),
    sourceHeadCommitId: optionalNullableString(input, 'sourceHeadCommitId') ?? null,
    entryPath: requireString(input, 'entryPath'),
    version: requireString(input, 'version'),
    files: requireArray(input, 'files', normalizeMoveSourceFile),
    destination: normalizeMoveSourceDestination(input.destination),
    entryName: requireString(input, 'entryName'),
    entryTitle: optionalNullableString(input, 'entryTitle'),
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

function getServiceContext(ctx: LightExtensionResourceContext): MoveSourceServiceContext {
  const headers = ctx.request?.headers || ctx.request?.header || {};

  const serviceContext: MoveSourceServiceContext = {
    actorUserId: getCurrentUserId(ctx),
    requestId: getHeader(headers, 'x-request-id') || getHeader(headers, 'x-correlation-id'),
    requestSource: getHeader(headers, 'x-request-source'),
    can: ctx.can,
    adapterContext: {
      userId: getCurrentUserId(ctx),
      request: {
        requestId: getHeader(headers, 'x-request-id') || getHeader(headers, 'x-correlation-id'),
        requestSource: getHeader(headers, 'x-request-source'),
      },
      state: ctx.state,
      currentUser: ctx.auth?.user,
      timezone: ctx.timezone,
      can: (input) => normalizeAdapterPermission(ctx.can?.(input)),
    },
  };
  return serviceContext;
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

function optionalNullableString(input: ResourceActionInput, key: string): string | null | undefined {
  const value = input[key];
  if (value === null) {
    return null;
  }
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw invalidInput(`${key} must be a string or null`);
  }
  return value.trim() || null;
}

function requireArray<T>(
  input: ResourceActionInput,
  key: string,
  normalize: (value: unknown, index: number) => T,
): T[] {
  const value = input[key];
  if (!Array.isArray(value) || value.length === 0) {
    throw invalidInput(`${key} must be a non-empty array`);
  }
  return value.map(normalize);
}

function normalizeMoveSourceFile(value: unknown, index: number): LightExtensionMoveSourceInput['files'][number] {
  const file = toRecord(value);
  return {
    path: requireString(file, 'path', `files[${index}].path`),
    content: requireStringValue(file, 'content', `files[${index}].content`),
    language: optionalString(file, 'language', `files[${index}].language`),
    mode: optionalString(file, 'mode', `files[${index}].mode`),
  };
}

function normalizeMoveSourceDestination(value: unknown): LightExtensionMoveSourceInput['destination'] {
  const destination = toRecord(value);
  const type = requireString(destination, 'type', 'destination.type');
  if (type === 'existing') {
    return {
      type,
      repoId: requireString(destination, 'repoId', 'destination.repoId'),
    };
  }
  if (type === 'new') {
    return {
      type,
      name: requireString(destination, 'name', 'destination.name'),
      title: optionalNullableString(destination, 'title'),
      description: optionalNullableString(destination, 'description'),
    };
  }
  throw invalidInput('destination.type must be "existing" or "new"');
}

function requireStringValue(input: ResourceActionInput, key: string, label: string): string {
  const value = input[key];
  if (typeof value !== 'string') {
    throw invalidInput(`${label} must be a string`);
  }
  return value;
}

function optionalString(input: ResourceActionInput, key: string, label: string): string | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw invalidInput(`${label} must be a string`);
  }
  return value;
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

function toRecord(value: unknown): ResourceActionInput {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) ? (value as ResourceActionInput) : {};
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}

function normalizeAdapterPermission(value: unknown): RunJSSourcePermissionResult | null {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    typeof (value as PromiseLike<unknown>).then === 'function'
  ) {
    return null;
  }
  const permission = value as { params?: unknown };
  if (!permission.params || typeof permission.params !== 'object' || Array.isArray(permission.params)) {
    return {};
  }
  return { params: permission.params as RunJSSourcePermissionResult['params'] };
}

function readHttpStatus(value: unknown): 200 | 207 | 422 | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const status = (value as { httpStatus?: unknown }).httpStatus;
  return status === 200 || status === 207 || status === 422 ? status : undefined;
}
