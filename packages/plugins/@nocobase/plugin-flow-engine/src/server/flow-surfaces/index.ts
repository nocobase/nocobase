/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Plugin } from '@nocobase/server';
import { FLOW_SURFACES_ACTION_NAMES, type FlowSurfacesActionName } from './constants';
import { FlowSurfacesService } from './service';

function getValues(ctx: any) {
  return ctx.action?.params?.values ?? ctx.action?.params ?? {};
}

export function registerFlowSurfacesResource(plugin: Plugin) {
  const service = new FlowSurfacesService(plugin);
  const actions: Record<FlowSurfacesActionName, any> = {
    catalog: async (ctx, next) => {
      ctx.body = await service.catalog(getValues(ctx));
      await next();
    },
    get: async (ctx, next) => {
      ctx.body = await service.get(getValues(ctx));
      await next();
    },
    compose: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.compose(getValues(ctx), { transaction }));
      await next();
    },
    configure: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.configure(getValues(ctx), { transaction }));
      await next();
    },
    createPage: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.createPage(getValues(ctx), { transaction }));
      await next();
    },
    destroyPage: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.destroyPage(getValues(ctx), { transaction }));
      await next();
    },
    addTab: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.addTab(getValues(ctx), { transaction }));
      await next();
    },
    updateTab: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.updateTab(getValues(ctx), { transaction }));
      await next();
    },
    moveTab: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.moveTab(getValues(ctx), { transaction }));
      await next();
    },
    removeTab: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.removeTab(getValues(ctx), { transaction }));
      await next();
    },
    addBlock: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.addBlock(getValues(ctx), { transaction }));
      await next();
    },
    addBlocks: async (ctx, next) => {
      ctx.body = await service.addBlocks(getValues(ctx));
      await next();
    },
    addField: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.addField(getValues(ctx), { transaction }));
      await next();
    },
    addFields: async (ctx, next) => {
      ctx.body = await service.addFields(getValues(ctx));
      await next();
    },
    addAction: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.addAction(getValues(ctx), { transaction }));
      await next();
    },
    addActions: async (ctx, next) => {
      ctx.body = await service.addActions(getValues(ctx));
      await next();
    },
    addRecordAction: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.addRecordAction(getValues(ctx), { transaction }));
      await next();
    },
    addRecordActions: async (ctx, next) => {
      ctx.body = await service.addRecordActions(getValues(ctx));
      await next();
    },
    updateSettings: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.updateSettings(getValues(ctx), { transaction }));
      await next();
    },
    setEventFlows: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.setEventFlows(getValues(ctx), { transaction }));
      await next();
    },
    setLayout: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.setLayout(getValues(ctx), { transaction }));
      await next();
    },
    moveNode: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.moveNode(getValues(ctx), { transaction }));
      await next();
    },
    removeNode: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.removeNode(getValues(ctx), { transaction }));
      await next();
    },
    mutate: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.mutate(getValues(ctx), { transaction }));
      await next();
    },
    apply: async (ctx, next) => {
      ctx.body = await service.transaction((transaction) => service.apply(getValues(ctx), { transaction }));
      await next();
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
