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

const FLOW_ENGINE_LOCALE_NAMESPACE = 'flow-engine';
const FLOW_SURFACE_LOCALE_FALLBACK_NAMESPACES = [
  FLOW_ENGINE_LOCALE_NAMESPACE,
  '@nocobase/flow-engine',
  '@nocobase/plugin-flow-engine',
  'client',
];
const FLOW_SURFACE_LOCAL_TRANSLATIONS: Record<string, Record<string, string>> = {
  'zh-CN': {
    'Popup for Add New': '新增弹窗',
    'Popup for Edit': '编辑弹窗',
    'Popup for Details': '详情弹窗',
    'Auto generated': '自动生成',
    'Automatically generated popup template for collection "{{collectionLabel}}" ({{popupLabel}}).':
      '为数据表“{{collectionLabel}}”自动生成的弹窗模板（{{popupLabel}}）。',
    'Automatically generated popup template for relation field "{{associationFieldLabel}}" in collection "{{sourceCollectionLabel}}", targeting "{{targetCollectionLabel}}" ({{popupLabel}}).':
      '为数据表“{{sourceCollectionLabel}}”中的关系字段“{{associationFieldLabel}}”自动生成的弹窗模板，目标数据表为“{{targetCollectionLabel}}”（{{popupLabel}}）。',
  },
};

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
  options: { transaction?: any; t?: (key: string, options?: Record<string, any>) => string } = {},
) {
  const handler = service[actionName] as unknown as (
    values: Record<string, any>,
    options?: { transaction?: any; t?: (key: string, options?: Record<string, any>) => string },
  ) => Promise<any>;
  return handler.call(service, values, options);
}

function interpolateTranslation(value: string, options?: Record<string, any>) {
  return value.replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_match, name) => {
    const replacement = options?.[name];
    return replacement === null || typeof replacement === 'undefined' ? '' : String(replacement);
  });
}

function getResourceTranslation(ctx: any, key: string, options?: Record<string, any>) {
  const locale = ctx.getCurrentLocale?.() || ctx.i18n?.language;
  const i18n = ctx.app?.i18n;
  if (!locale || !i18n) {
    return undefined;
  }
  for (const ns of FLOW_SURFACE_LOCALE_FALLBACK_NAMESPACES) {
    const value = i18n.getResource?.(locale, ns, key);
    if (typeof value === 'string') {
      return interpolateTranslation(value, options);
    }
  }
  return undefined;
}

function getLocalTranslation(ctx: any, key: string, options?: Record<string, any>) {
  const locale = String(ctx.getCurrentLocale?.() || ctx.i18n?.language || '').trim();
  const resources = FLOW_SURFACE_LOCAL_TRANSLATIONS[locale];
  const value = resources?.[key];
  return typeof value === 'string' ? interpolateTranslation(value, options) : undefined;
}

function getFlowSurfaceTranslate(ctx: any) {
  const translate = ctx.i18n?.t?.bind(ctx.i18n) || ctx.t?.bind(ctx);
  if (typeof translate !== 'function') {
    return undefined;
  }
  return (key: string, options?: Record<string, any>) => {
    const resourceValue = getResourceTranslation(ctx, key, options);
    if (typeof resourceValue === 'string') {
      return resourceValue;
    }
    const localValue = getLocalTranslation(ctx, key, options);
    if (typeof localValue === 'string') {
      return localValue;
    }
    return translate(key, {
      ns: [FLOW_ENGINE_LOCALE_NAMESPACE, 'client'],
      nsMode: 'fallback',
      ...(options || {}),
    });
  };
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
          const t = getFlowSurfaceTranslate(ctx);

          if (definition.transaction) {
            return service.transaction((transaction) =>
              invokeFlowSurfaceServiceAction(service, actionName, values, { transaction, t }),
            );
          }

          return invokeFlowSurfaceServiceAction(service, actionName, values, { t });
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
