/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourceOptions } from '@nocobase/resourcer';
import { AIManager } from './ai-manager';

export default {
  name: 'core-ai',
  actions: {
    async getTools(ctx, next) {
      const { toolsManager } = ctx.app.aiManager as AIManager;
      const { filterByTk } = ctx.action.params;
      ctx.body = await toolsManager.getTools(filterByTk);
      await next();
    },

    async listTools(ctx, next) {
      const { toolsManager } = ctx.app.aiManager as AIManager;
      const { filter } = ctx.action.params;
      ctx.body = await toolsManager.listTools(filter);
      await next();
    },
  },
} as ResourceOptions;
