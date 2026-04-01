/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Plugin } from '@nocobase/server';
import { parseQuery } from '@nocobase/resourcer';
import { FLOW_SURFACES_ACTION_NAMES, type FlowSurfacesActionName } from './constants';
import { FlowSurfaceBadRequestError, isFlowSurfaceBadRequestError } from './errors';
import { FlowSurfacesService } from './service';

function getValues(ctx: any) {
  return ctx.action?.params?.values ?? ctx.action?.params ?? {};
}

function getReadValues(ctx: any) {
  if (ctx.request?.method?.toUpperCase() !== 'GET') {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces:get only supports GET with root query locator fields like /api/flowSurfaces:get?uid=...`,
    );
  }
  const query = parseQuery(ctx.request?.querystring || '');
  if (Object.prototype.hasOwnProperty.call(query, 'target')) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces:get only accepts root locator fields; do not wrap them in 'target'`,
    );
  }
  if (Object.prototype.hasOwnProperty.call(query, 'values')) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces:get only accepts root locator fields; do not wrap them in 'values'`,
    );
  }
  return ctx.action?.params ?? {};
}

async function runFlowSurfaceAction(ctx: any, next: () => Promise<any>, handler: () => Promise<any>) {
  try {
    ctx.body = await handler();
    await next();
  } catch (error) {
    if (isFlowSurfaceBadRequestError(error)) {
      ctx.throw(400, {
        message: error.message,
      });
    }
    throw error;
  }
}

export function registerFlowSurfacesResource(plugin: Plugin) {
  const service = new FlowSurfacesService(plugin);
  const actions: Record<FlowSurfacesActionName, any> = {
    catalog: async (ctx, next) => {
      await runFlowSurfaceAction(ctx, next, () => service.catalog(getValues(ctx)));
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
  plugin.app.acl.allow('flowSurfaces', [...FLOW_SURFACES_ACTION_NAMES], 'loggedIn');

  plugin.app.resourceManager.define({
    name: 'flowSurfaces',
    actions,
  });

  return service;
}
