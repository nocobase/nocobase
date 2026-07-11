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
import { LightExtensionEntryService } from '../services/LightExtensionEntryService';
import type { LightExtensionCanFunction } from '../services/LightExtensionPermissionService';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';
import { RuntimeResolveService } from '../services/RuntimeResolveService';

export const lightExtensionEntryActionNames = ['list', 'get', 'listSelectable'] as const;

type LightExtensionEntryActionName = (typeof lightExtensionEntryActionNames)[number];
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
  withoutDataWrapping?: boolean;
  type?: string;
  status?: number;
  body?: unknown;
};

type ResourceActionRunner = (
  services: LightExtensionEntryActionServices,
  input: ResourceActionInput,
  currentUser: LightExtensionServiceContext,
) => Promise<unknown>;

interface LightExtensionEntryActionServices {
  entryService: LightExtensionEntryService;
  runtimeResolveService: RuntimeResolveService;
}

const resourceActionRunners: Record<LightExtensionEntryActionName, ResourceActionRunner> = {
  list: (services, input, currentUser) => services.entryService.listEntries(requireRepoId(input), currentUser),
  get: (services, input, currentUser) => services.entryService.getEntry(requireEntryId(input), currentUser),
  listSelectable: (services, input, currentUser) =>
    services.runtimeResolveService.listSelectableEntries(
      {
        repoId: optionalString(input, 'repoId'),
        kind: optionalString(input, 'kind'),
      },
      currentUser,
    ),
};

export function createLightExtensionEntriesResource(
  entryService: LightExtensionEntryService,
  runtimeResolveService: RuntimeResolveService,
): ResourceOptions {
  const services = {
    entryService,
    runtimeResolveService,
  };

  return {
    name: 'lightExtensionEntries',
    only: [...lightExtensionEntryActionNames],
    actions: Object.fromEntries(
      lightExtensionEntryActionNames.map((actionName) => [
        actionName,
        createLightExtensionEntryAction(services, resourceActionRunners[actionName]),
      ]),
    ) as Record<LightExtensionEntryActionName, HandlerType>,
  };
}

function createLightExtensionEntryAction(
  services: LightExtensionEntryActionServices,
  run: ResourceActionRunner,
): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as LightExtensionResourceContext;
    const input = getActionInput(resourceCtx);

    try {
      const result = await run(services, input, getServiceContext(resourceCtx));
      resourceCtx.body = result;
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

function requireEntryId(input: ResourceActionInput): string {
  return requireString(
    {
      entryId: input.entryId || input.filterByTk,
    },
    'entryId',
  );
}

function optionalString(input: ResourceActionInput, key: string): string | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw invalidInput(`${key} must be a string`);
  }

  return value;
}

function requireString(input: ResourceActionInput, key: string): string {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput(`${key} is required`);
  }

  return value.trim();
}

function toRecord(value: unknown): ResourceActionInput {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) ? (value as ResourceActionInput) : {};
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}
