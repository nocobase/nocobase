/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ResourceOptions } from '@nocobase/resourcer';
import { MCPOptions, MCPTestResult } from '@nocobase/ai';
import type { Permission } from '@nocobase/ai';

export const aiMcpClients: ResourceOptions = {
  name: 'aiMcpClients',
  actions: {
    testConnection: async (ctx, next) => {
      const values = ctx.action.params.values as MCPOptions;

      if (!values) {
        ctx.body = {
          success: false,
          error: 'No configuration provided',
        } as MCPTestResult;
        await next();
        return;
      }

      const plugin = ctx.app.pm.get('ai');
      const result = await plugin.ai.mcpManager.testConnection(values);

      ctx.body = result;
      await next();
    },
    rebuildClient: async (ctx, next) => {
      const plugin = ctx.app.pm.get('ai');
      await plugin.ai.mcpManager.rebuildClient();
      ctx.body = { success: true };
      await next();
    },
    listTools: async (ctx, next) => {
      const plugin = ctx.app.pm.get('ai');
      ctx.body = await plugin.ai.mcpManager.listMCPTools();
      await next();
    },
    updateToolPermission: async (ctx, next) => {
      const { toolName, permission } = ctx.action.params.values || {};

      if (!toolName || !permission) {
        ctx.throw(400, 'toolName and permission are required');
      }

      const plugin = ctx.app.pm.get('ai');
      await plugin.ai.mcpManager.updateMCPToolPermission(toolName, permission as Permission);
      ctx.body = { success: true };
      await next();
    },
  },
};

export default aiMcpClients;
