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

import { isLightExtensionError } from '../../shared/errors';
import type { LightExtensionRuntimeResolveInput } from '../../shared/types';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';
import { RuntimeResolveService } from '../services/RuntimeResolveService';

export const lightExtensionRuntimeActionNames = ['resolve'] as const;

type LightExtensionRuntimeActionName = (typeof lightExtensionRuntimeActionNames)[number];
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
  service: RuntimeResolveService,
  input: ResourceActionInput,
  currentUser: LightExtensionServiceContext,
) => Promise<unknown>;

const resourceActionRunners: Record<LightExtensionRuntimeActionName, ResourceActionRunner> = {
  resolve: (service, input, currentUser) =>
    service.resolve(input as unknown as LightExtensionRuntimeResolveInput, currentUser),
};

export function createLightExtensionRuntimeResource(service: RuntimeResolveService): ResourceOptions {
  return {
    name: 'lightExtensionRuntime',
    only: [...lightExtensionRuntimeActionNames],
    actions: Object.fromEntries(
      lightExtensionRuntimeActionNames.map((actionName) => [
        actionName,
        createLightExtensionRuntimeAction(service, resourceActionRunners[actionName]),
      ]),
    ) as Record<LightExtensionRuntimeActionName, HandlerType>,
  };
}

function createLightExtensionRuntimeAction(service: RuntimeResolveService, run: ResourceActionRunner): HandlerType {
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

function toRecord(value: unknown): ResourceActionInput {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) ? (value as ResourceActionInput) : {};
}
