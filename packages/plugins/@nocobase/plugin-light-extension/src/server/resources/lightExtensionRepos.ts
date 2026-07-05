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
import { isVscError } from '@nocobase/plugin-vsc-file';

import { LightExtensionError, isLightExtensionError } from '../../shared/errors';
import type { LightExtensionCreateRepoInput, LightExtensionTreeEntryInput } from '../../shared/types';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import { toLightExtensionSourceError } from './errorContract';

export const lightExtensionRepoActionNames = ['create', 'list', 'get', 'changeLifecycle', 'archive', 'delete'] as const;

type LightExtensionRepoActionName = (typeof lightExtensionRepoActionNames)[number];

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
  service: LightExtensionRepoService,
  input: ResourceActionInput,
  currentUser: LightExtensionServiceContext,
) => Promise<unknown>;

const resourceActionRunners: Record<LightExtensionRepoActionName, ResourceActionRunner> = {
  create: (service, input, currentUser) => service.createRepo(normalizeCreateInput(input), currentUser),
  list: (service, _input, currentUser) => service.listRepos(currentUser),
  get: (service, input, currentUser) => service.getRepo(requireRepoId(input), currentUser),
  changeLifecycle: (service, input, currentUser) =>
    service.changeLifecycle(
      {
        repoId: requireRepoId(input),
        lifecycleStatus: requireString(input, 'lifecycleStatus'),
        expectedLifecycleStatus: optionalString(input, 'expectedLifecycleStatus'),
        expectedVersion: optionalPositiveInteger(input, 'expectedVersion'),
      },
      currentUser,
    ),
  archive: (service, input, currentUser) =>
    service.archiveRepo(
      {
        repoId: requireRepoId(input),
        expectedLifecycleStatus: optionalString(input, 'expectedLifecycleStatus'),
        expectedVersion: optionalPositiveInteger(input, 'expectedVersion'),
      },
      currentUser,
    ),
  delete: (service, input, currentUser) =>
    service.deleteRepo(
      {
        repoId: requireRepoId(input),
      },
      currentUser,
    ),
};

export function createLightExtensionReposResource(service: LightExtensionRepoService): ResourceOptions {
  return {
    name: 'lightExtensionRepos',
    only: [...lightExtensionRepoActionNames],
    actions: Object.fromEntries(
      lightExtensionRepoActionNames.map((actionName) => [
        actionName,
        createLightExtensionRepoAction(service, resourceActionRunners[actionName]),
      ]),
    ) as Record<LightExtensionRepoActionName, HandlerType>,
  };
}

function createLightExtensionRepoAction(service: LightExtensionRepoService, run: ResourceActionRunner): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as LightExtensionResourceContext;
    const input = getActionInput(resourceCtx);

    try {
      resourceCtx.body = await run(service, input, getServiceContext(resourceCtx));
      await next();
    } catch (error) {
      const safeError = isVscError(error) ? toLightExtensionSourceError(error, getOptionalRepoId(input)) : error;
      if (!isLightExtensionError(safeError)) {
        throw error;
      }

      resourceCtx.withoutDataWrapping = true;
      resourceCtx.type = 'application/json';
      resourceCtx.status = safeError.status;
      resourceCtx.body = safeError.toResponseBody();
    }
  };
}

function normalizeCreateInput(input: ResourceActionInput): LightExtensionCreateRepoInput {
  return {
    name: requireString(input, 'name'),
    title: optionalNullableString(input, 'title'),
    description: optionalNullableString(input, 'description'),
    initialFiles: optionalArray(input, 'initialFiles', normalizeTreeEntryInput),
    message: optionalString(input, 'message'),
  };
}

function normalizeTreeEntryInput(value: unknown, label: string): LightExtensionTreeEntryInput {
  const record = requireRecord(value, label);
  const normalized = compactObject({
    path: requireString(record, 'path', label),
    content: optionalString(record, 'content', label),
    blobHash: optionalString(record, 'blobHash', label),
    size: optionalNumber(record, 'size', label),
    language: optionalString(record, 'language', label),
    mode: optionalString(record, 'mode', label),
  });

  assertUpsertHasSource(normalized, label);

  return normalized;
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

function getOptionalRepoId(input: ResourceActionInput): string | undefined {
  const value = input.repoId || input.filterByTk;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function requireString(input: ResourceActionInput, key: string, label = key): string {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput(`${label} is required`);
  }

  return value.trim();
}

function optionalString(input: ResourceActionInput, key: string, label = key): string | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw invalidInput(`${label} must be a string`);
  }

  return value;
}

function optionalNullableString(input: ResourceActionInput, key: string, label = key): string | null | undefined {
  if (input[key] === null) {
    return null;
  }

  return optionalString(input, key, label);
}

function optionalNumber(input: ResourceActionInput, key: string, label = key): number | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw invalidInput(`${label} must be a number`);
  }

  return value;
}

function optionalPositiveInteger(input: ResourceActionInput, key: string, label = key): number | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (!Number.isInteger(value) || value < 1) {
    throw invalidInput(`${label} must be a positive integer`);
  }

  return value as number;
}

function optionalArray<T>(
  input: ResourceActionInput,
  key: string,
  normalize: (value: unknown, label: string) => T,
): T[] | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw invalidInput(`${key} must be an array`);
  }

  return value.map((item, index) => normalize(item, `${key}[${index}]`));
}

function requireRecord(value: unknown, label: string): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidInput(`${label} must be an object`);
  }

  return value as ResourceActionInput;
}

function toRecord(value: unknown): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as ResourceActionInput;
}

function compactObject<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => typeof value !== 'undefined')) as T;
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}

function assertUpsertHasSource(file: LightExtensionTreeEntryInput, label: string): void {
  if (typeof file.content !== 'string' && !file.blobHash) {
    throw invalidInput(`${label} must include content or blobHash`);
  }
}
