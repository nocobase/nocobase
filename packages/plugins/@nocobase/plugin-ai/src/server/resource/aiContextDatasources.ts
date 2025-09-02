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

export const aiContextDatasources: ResourceOptions = {
  name: 'aiContextDatasources',
  actions: {
    preview: async (ctx, next) => {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const { id } = ctx.action.params;
      ctx.body = await plugin.aiContextDatasourceManager.query({ id });
      next();
    },
  },
};
