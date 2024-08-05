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
  sync: async (ctx: Context, next: Next) => {
    const { name } = ctx.action.params;
    const plugin = ctx.app.pm.get(PluginUserDataSyncServer) as PluginUserDataSyncServer;
    await plugin.syncService.sync(name, ctx);
    await next();
  },
  listTypes: async (ctx: Context, next: Next) => {
    const plugin = ctx.app.pm.get(PluginUserDataSyncServer) as PluginUserDataSyncServer;
    ctx.body = plugin.sourceManager.listTypes();
    await next();
  },
};
