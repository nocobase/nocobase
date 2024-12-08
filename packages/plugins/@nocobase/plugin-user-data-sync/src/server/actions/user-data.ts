/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { PluginUserDataSyncServer } from '../plugin';

export default {
  listSyncTypes: async (ctx: Context, next: Next) => {
    const plugin = ctx.app.pm.get(PluginUserDataSyncServer) as PluginUserDataSyncServer;
    ctx.body = plugin.sourceManager.listTypes();
    await next();
  },
  pull: async (ctx: Context, next: Next) => {
    const { name } = ctx.action.params;
    const plugin = ctx.app.pm.get(PluginUserDataSyncServer) as PluginUserDataSyncServer;
    await plugin.syncService.pull(name, ctx);
    await next();
  },
  push: async (ctx: Context, next: Next) => {
    const data = ctx.action.params.values || {};
    const plugin = ctx.app.pm.get(PluginUserDataSyncServer) as PluginUserDataSyncServer;
    try {
      let supported = false;
      for (const resource of plugin.resourceManager.resources.nodes) {
        if (resource.accepts.includes(data.dataType)) {
          supported = true;
        }
      }
      if (!supported) {
        throw new Error(`dataType ${data.dataType} is not supported`);
      }
      const result = await plugin.syncService.push(data);
      ctx.body = { code: 0, message: 'success', result };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { code: 500, message: error.message };
      return;
    }
    await next();
  },
  retry: async (ctx: Context, next: Next) => {
    const { sourceId, id } = ctx.action.params;
    const plugin = ctx.app.pm.get(PluginUserDataSyncServer) as PluginUserDataSyncServer;
    await plugin.syncService.retry(sourceId, id, ctx);
    await next();
  },
};
