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
  listTypes: async (ctx: Context, next: Next) => {
    const plugin = ctx.app.pm.get(PluginUserDataSyncServer) as PluginUserDataSyncServer;
    ctx.body = plugin.sourceManager.listTypes();
    await next();
  },
};
