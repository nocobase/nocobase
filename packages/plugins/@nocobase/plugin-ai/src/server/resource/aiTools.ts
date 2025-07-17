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

export const aiTools: ResourceOptions = {
  name: 'aiTools',
  actions: {
    list: async (ctx, next) => {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const tools = await plugin.aiManager.toolManager.listTools();
      ctx.body = tools;
      await next();
    },
  },
};

export default aiTools;
