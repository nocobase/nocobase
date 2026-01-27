/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ResourceOptions } from '@nocobase/resourcer';
import PluginAIServer from '../plugin';
import { Context } from '@nocobase/actions';

export const aiContextDatasources: ResourceOptions = {
  name: 'aiContextDatasources',
  actions: {
    preview: async (ctx, next) => {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      ctx.body = await plugin.aiContextDatasourceManager.preview(ctx as Context, ctx.action.params.values);
      next();
    },
  },
};
