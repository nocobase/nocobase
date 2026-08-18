/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { HandlerType } from '@nocobase/resourcer';

import { isJsTemplateError, JsTemplateError } from '../../shared/errors';
import type { JsTemplateCanFunction } from '../services/JsTemplatePermissionService';
import type { JsTemplateServiceContext } from '../services/JsTemplateProjectService';

export type ResourceActionInput = Record<string, unknown>;

export type JsTemplateResourceContext = Context & {
  action?: {
    params?: unknown;
    resourceName?: string;
    actionName?: string;
  };
  auth?: {
    user?: unknown;
  };
  can?: JsTemplateCanFunction;
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

type ResourceActionRunner<TServices, TServiceContext, TResult> = (
  services: TServices,
  input: ResourceActionInput,
  serviceContext: TServiceContext,
) => Promise<TResult>;

interface TypedResourceActionOptions<TServices, TServiceContext, TResult> {
  services: TServices;
  run: ResourceActionRunner<TServices, TServiceContext, TResult>;
  getServiceContext: (ctx: JsTemplateResourceContext) => TServiceContext;
  transformError?: (error: unknown, input: ResourceActionInput) => unknown;
  getHttpStatus?: (result: TResult) => number | undefined;
}

export function createTypedResourceAction<TServices, TServiceContext, TResult = unknown>(
  options: TypedResourceActionOptions<TServices, TServiceContext, TResult>,
): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as JsTemplateResourceContext;
    const input = getActionInput(resourceCtx);

    try {
      const result = await options.run(options.services, input, options.getServiceContext(resourceCtx));
      resourceCtx.body = result;
      const httpStatus = options.getHttpStatus?.(result);
      if (httpStatus) {
        resourceCtx.status = httpStatus;
      }
      await next();
    } catch (error) {
      const safeError = options.transformError ? options.transformError(error, input) : error;
      if (!isJsTemplateError(safeError)) {
        throw error;
      }

      resourceCtx.withoutDataWrapping = true;
      resourceCtx.type = 'application/json';
      resourceCtx.status = safeError.status;
      resourceCtx.body = safeError.toResponseBody();
    }
  };
}

export function getActionInput(ctx: JsTemplateResourceContext): ResourceActionInput {
  const params = toRecord(ctx.action?.params);
  const values = toRecord(params.values);
  const { values: _values, ...queryParams } = params;
  const publicQueryParams = Object.fromEntries(
    Object.entries(queryParams).filter(
      ([key, value]) => key !== 'resourceName' && key !== 'actionName' && typeof value !== 'undefined',
    ),
  );

  return {
    ...publicQueryParams,
    ...values,
  };
}

export function getServiceContext(ctx: JsTemplateResourceContext): JsTemplateServiceContext {
  const metadata = getRequestMetadata(ctx);
  return {
    actorUserId: metadata.actorUserId,
    sessionId: metadata.sessionId,
    can: ctx.can,
    currentUser: ctx.state?.currentUser || ctx.auth?.user,
    requestId: metadata.requestId,
    requestSource: metadata.requestSource,
    state: ctx.state,
    currentRole: normalizeRole(ctx.state?.currentRole),
    currentRoles: normalizeRoles(ctx.state?.currentRoles),
    timezone: ctx.timezone,
  };
}

export function requireCreateJobAuthorizationContext(ctx: JsTemplateServiceContext): {
  authorizationRole: string;
  authorizationRoles: string[];
} {
  const authorizationRole = normalizeRole(ctx.currentRole ?? ctx.state?.currentRole);
  const currentRoles = normalizeRoles(ctx.currentRoles ?? ctx.state?.currentRoles);
  if (!authorizationRole) {
    throw new JsTemplateError('JS_TEMPLATE_PERMISSION_DENIED', 'Authenticated role context is required');
  }
  const authorizationRoles =
    authorizationRole === '__union__'
      ? currentRoles
      : currentRoles.includes(authorizationRole)
        ? [authorizationRole]
        : [];
  if (!authorizationRoles.length) {
    throw new JsTemplateError('JS_TEMPLATE_PERMISSION_DENIED', 'Authenticated role context is invalid');
  }
  return { authorizationRole, authorizationRoles };
}

export function getRequestMetadata(ctx: JsTemplateResourceContext): {
  actorUserId: string | null;
  sessionId: string | null;
  requestId?: string;
  requestSource?: string;
} {
  const headers = ctx.request?.headers || ctx.request?.header || {};

  return {
    actorUserId: getCurrentUserId(ctx),
    sessionId: getCurrentSessionId(ctx),
    requestId: getHeader(headers, 'x-request-id') || getHeader(headers, 'x-correlation-id'),
    requestSource: getHeader(headers, 'x-request-source'),
  };
}

function getCurrentSessionId(ctx: JsTemplateResourceContext): string | null {
  const token = (ctx as JsTemplateResourceContext & { getBearerToken?: () => unknown }).getBearerToken?.();
  if (typeof token !== 'string' || !token) {
    return null;
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { jti?: unknown };
    return typeof payload.jti === 'string' && payload.jti ? payload.jti : null;
  } catch {
    return null;
  }
}

export function getCurrentUserId(ctx: JsTemplateResourceContext): string | null {
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

export function toRecord(value: unknown): ResourceActionInput {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) ? (value as ResourceActionInput) : {};
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeRole(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeRoles(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.map(normalizeRole).filter((role): role is string => Boolean(role)))].sort((left, right) =>
    left.localeCompare(right),
  );
}
