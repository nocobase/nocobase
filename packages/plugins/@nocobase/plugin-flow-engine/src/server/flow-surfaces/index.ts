/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parseQuery } from '@nocobase/resourcer';
import type { Plugin } from '@nocobase/server';
import {
  FLOW_SURFACE_ACTION_DEFINITIONS,
  FLOW_SURFACES_ACTION_NAMES,
  FLOW_SURFACES_READ_ACTION_NAMES,
  type FlowSurfacesActionName,
} from './constants';
import { FlowSurfaceForbiddenError, normalizeFlowSurfaceError, throwBadRequest } from './errors';
import { FlowSurfacesService } from './service';

function getValues(ctx: any) {
  return ctx.action?.params?.values ?? ctx.action?.params ?? {};
}

function isImplicitEmptyValuesBag(value: any) {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.keys(value).length === 0
  );
}

function getRawReadQuery(ctx: any) {
  const querystring = String(ctx.request?.querystring ?? '');
  if (!querystring) {
    return {};
  }
  try {
    return parseQuery(querystring) || {};
  } catch {
    return {};
  }
}

function hasExplicitQueryWrapper(ctx: any, key: string) {
  const query = getRawReadQuery(ctx);
  return Object.prototype.hasOwnProperty.call(query, key);
}

function hasExplicitRequestBody(ctx: any) {
  const headers = ctx.request?.headers ?? {};
  const contentLength = headers['content-length'];
  if (Array.isArray(contentLength)) {
    return contentLength.some((value) => value !== '0');
  }
  if (typeof contentLength === 'string') {
    return contentLength !== '0';
  }
  return Boolean(headers['transfer-encoding']);
}

function getReadValues(ctx: any) {
  if (ctx.request?.method?.toUpperCase() !== 'GET') {
    throwBadRequest(
      `flowSurfaces:get only supports GET with root query locator fields like /api/flowSurfaces:get?uid=...`,
    );
  }
  if (hasExplicitQueryWrapper(ctx, 'target')) {
    throwBadRequest(`flowSurfaces:get only accepts root locator fields; do not wrap them in 'target'`);
  }
  if (hasExplicitQueryWrapper(ctx, 'values')) {
    throwBadRequest(`flowSurfaces:get only accepts root locator fields; do not wrap them in 'values'`);
  }
  const params = ctx.action?.params ?? {};
  if (!Object.prototype.hasOwnProperty.call(params, 'values')) {
    return params;
  }
  const values = params.values;
  if (typeof values !== 'undefined' && !isImplicitEmptyValuesBag(values)) {
    return params;
  }
  if (hasExplicitRequestBody(ctx)) {
    return params;
  }

  // Resourcer injects an empty `values` bag even for GET query requests.
  // Strip only this no-body transport artifact and keep explicit query/body wrappers for service-level validation.
  const { values: _values, ...rest } = params;
  return rest;
}

function writeFlowSurfaceErrorResponse(ctx: any, error: unknown) {
  const normalized = normalizeFlowSurfaceError(error);
  ctx.withoutDataWrapping = true;
  ctx.type = 'application/json';
  ctx.status = normalized.status;
  ctx.body = normalized.toResponseBody();
}

function isAclPermissionDeniedForFlowSurfaces(ctx: any, error: any) {
  const resourceName = ctx.action?.resourceName ?? ctx.permission?.resourceName;
  return resourceName === 'flowSurfaces' && error?.status === 403 && error?.message === 'No permissions';
}

function toFlowSurfaceForbiddenError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return new FlowSurfaceForbiddenError(message);
}

async function runFlowSurfaceAclErrorWrapper(ctx: any, next: () => Promise<any>) {
  try {
    await next();
  } catch (error) {
    if (!isAclPermissionDeniedForFlowSurfaces(ctx, error)) {
      throw error;
    }
    writeFlowSurfaceErrorResponse(ctx, toFlowSurfaceForbiddenError(error));
  }
}

async function runFlowSurfaceAction(ctx: any, next: () => Promise<any>, handler: () => Promise<any>) {
  try {
    ctx.body = await handler();
    await next();
  } catch (error) {
    writeFlowSurfaceErrorResponse(ctx, error);
    await next();
  }
}

function invokeFlowSurfaceServiceAction(
  service: FlowSurfacesService,
  actionName: FlowSurfacesActionName,
  values: Record<string, any>,
  options: { transaction?: any } = {},
) {
  const handler = service[actionName] as unknown as (
    values: Record<string, any>,
    options?: { transaction?: any },
  ) => Promise<any>;
  return handler.call(service, values, options);
}

export function registerFlowSurfacesResource(plugin: Plugin) {
  const service = new FlowSurfacesService(plugin);
  const actions = Object.fromEntries(
    FLOW_SURFACES_ACTION_NAMES.map((actionName) => [
      actionName,
      async (ctx, next) => {
        await runFlowSurfaceAction(ctx, next, async () => {
          const definition = FLOW_SURFACE_ACTION_DEFINITIONS[actionName];
          const values = definition.valueSource === 'read' ? getReadValues(ctx) : getValues(ctx);

          if (definition.transaction) {
            return service.transaction((transaction) =>
              invokeFlowSurfaceServiceAction(service, actionName, values, { transaction }),
            );
          }

          return invokeFlowSurfaceServiceAction(service, actionName, values);
        });
      },
    ]),
  ) as Record<FlowSurfacesActionName, any>;

  plugin.app.acl.registerSnippet({
    name: 'ui.flowSurfaces',
    actions: ['flowSurfaces:*'],
  });
  plugin.app.acl.allow('flowSurfaces', [...FLOW_SURFACES_READ_ACTION_NAMES], 'loggedIn');
  plugin.app.acl.use(runFlowSurfaceAclErrorWrapper, {
    tag: 'flow-surfaces-acl-errors',
    after: 'allow-manager',
    before: 'core',
  });

  plugin.app.resourceManager.define({
    name: 'flowSurfaces',
    actions,
  });

  return service;
}
