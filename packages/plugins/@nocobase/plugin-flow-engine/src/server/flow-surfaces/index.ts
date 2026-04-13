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
import { FLOW_SURFACES_READ_ACTION_NAMES, type FlowSurfacesActionName } from './constants';
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

export function registerFlowSurfacesResource(plugin: Plugin) {
  const service = new FlowSurfacesService(plugin);
  const actions: Record<FlowSurfacesActionName, any> = {
    catalog: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () => service.catalog(getValues(ctx)));
    },
    context: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () => service.context(getValues(ctx)));
    },
    get: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () => service.get(getReadValues(ctx)));
    },
    compose: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.compose(getValues(ctx), { transaction })),
      );
    },
    configure: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.configure(getValues(ctx), { transaction })),
      );
    },
    createMenu: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.createMenu(getValues(ctx), { transaction })),
      );
    },
    updateMenu: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.updateMenu(getValues(ctx), { transaction })),
      );
    },
    createPage: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.createPage(getValues(ctx), { transaction })),
      );
    },
    destroyPage: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.destroyPage(getValues(ctx), { transaction })),
      );
    },
    addTab: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.addTab(getValues(ctx), { transaction })),
      );
    },
    updateTab: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.updateTab(getValues(ctx), { transaction })),
      );
    },
    moveTab: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.moveTab(getValues(ctx), { transaction })),
      );
    },
    removeTab: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.removeTab(getValues(ctx), { transaction })),
      );
    },
    addPopupTab: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.addPopupTab(getValues(ctx), { transaction })),
      );
    },
    updatePopupTab: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.updatePopupTab(getValues(ctx), { transaction })),
      );
    },
    movePopupTab: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.movePopupTab(getValues(ctx), { transaction })),
      );
    },
    removePopupTab: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.removePopupTab(getValues(ctx), { transaction })),
      );
    },
    addBlock: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.addBlock(getValues(ctx), { transaction })),
      );
    },
    addBlocks: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () => service.addBlocks(getValues(ctx)));
    },
    addField: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.addField(getValues(ctx), { transaction })),
      );
    },
    addFields: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () => service.addFields(getValues(ctx)));
    },
    addAction: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.addAction(getValues(ctx), { transaction })),
      );
    },
    addActions: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () => service.addActions(getValues(ctx)));
    },
    addRecordAction: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.addRecordAction(getValues(ctx), { transaction })),
      );
    },
    addRecordActions: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () => service.addRecordActions(getValues(ctx)));
    },
    updateSettings: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.updateSettings(getValues(ctx), { transaction })),
      );
    },
    setEventFlows: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.setEventFlows(getValues(ctx), { transaction })),
      );
    },
    setLayout: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.setLayout(getValues(ctx), { transaction })),
      );
    },
    moveNode: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.moveNode(getValues(ctx), { transaction })),
      );
    },
    removeNode: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.removeNode(getValues(ctx), { transaction })),
      );
    },
    mutate: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.mutate(getValues(ctx), { transaction })),
      );
    },
    apply: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () =>
        service.transaction((transaction) => service.apply(getValues(ctx), { transaction })),
      );
    },
  };

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
