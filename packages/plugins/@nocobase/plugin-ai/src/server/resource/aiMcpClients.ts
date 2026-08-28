/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context, Next } from '@nocobase/actions';
import { ResourceOptions } from '@nocobase/resourcer';
import { MCPOptions, MCPTestResult } from '@nocobase/ai';
import type { Permission } from '@nocobase/ai';

type MCPRecordData = MCPOptions & {
  name: string;
};

const getConnectionOptions = (values: Partial<MCPOptions>): MCPOptions => ({
  transport: values.transport as MCPOptions['transport'],
  command: values.command,
  args: values.args,
  env: values.env,
  url: values.url,
  headers: values.headers,
  restart: values.restart,
  useUserContext: values.useUserContext,
});

export async function guardMCPClientMutations(ctx: Context, next: Next) {
  const { resourceName, actionName, params } = ctx.action;
  if (resourceName !== 'aiMcpClients' || !['create', 'update', 'destroy'].includes(actionName)) {
    await next();
    return;
  }

  const values = params.values || {};
  if (Object.prototype.hasOwnProperty.call(values, 'fromFile')) {
    delete values.fromFile;
  }

  const managedMessage = ctx.t(
    'Stdio MCP configurations are managed by storage/ai/mcp/servers.json. Modify that file and reload the application.',
  );
  if ((actionName === 'create' || actionName === 'update') && values.transport === 'stdio') {
    ctx.throw(400, managedMessage);
  }

  if (actionName === 'update' || actionName === 'destroy') {
    const repository = ctx.db.getRepository('aiMcpClients');
    const query = params.filterByTk != null ? { filterByTk: params.filterByTk } : { filter: params.filter };
    const records = await repository.find(query);
    const managedRecords = records.filter(
      (record) => record.get('transport') === 'stdio' || record.get('fromFile') === true,
    );
    const isEnabledOnlyUpdate =
      actionName === 'update' &&
      Object.keys(values).length === 1 &&
      Object.prototype.hasOwnProperty.call(values, 'enabled');
    if (managedRecords.length > 0 && !isEnabledOnlyUpdate) {
      ctx.throw(400, managedMessage);
    }
  }

  await next();
}

export const aiMcpClients: ResourceOptions = {
  name: 'aiMcpClients',
  actions: {
    testConnection: async (ctx, next) => {
      const { filterByTk, values } = ctx.action.params;
      const submittedValues = values as Partial<MCPOptions> | undefined;
      const repository = ctx.db.getRepository('aiMcpClients');

      if (filterByTk != null && filterByTk !== '') {
        const record = await repository.findOne({ filterByTk });
        if (!record) {
          ctx.throw(404, ctx.t('MCP configuration not found'));
        }

        const recordData = record.toJSON() as MCPRecordData;
        if (recordData.transport === 'stdio') {
          if (!recordData.command) {
            ctx.throw(400, ctx.t('MCP stdio configuration is incomplete'));
          }
          const plugin = ctx.app.pm.get('ai');
          ctx.body = await plugin.ai.mcpManager.testConnection(getConnectionOptions(recordData), ctx);
          await next();
          return;
        }

        if (submittedValues?.transport === 'stdio') {
          ctx.throw(
            400,
            ctx.t(
              'Stdio MCP configurations are managed by storage/ai/mcp/servers.json. Modify that file and reload the application.',
            ),
          );
        }
      }

      if (!submittedValues) {
        ctx.body = {
          success: false,
          error: 'No configuration provided',
        } as MCPTestResult;
        await next();
        return;
      }

      if (submittedValues.transport === 'stdio') {
        ctx.throw(
          400,
          ctx.t(
            'Stdio MCP configurations are managed by storage/ai/mcp/servers.json. Modify that file and reload the application.',
          ),
        );
      }

      const plugin = ctx.app.pm.get('ai');
      ctx.body = await plugin.ai.mcpManager.testConnection(getConnectionOptions(submittedValues), ctx);
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
      ctx.body = await plugin.ai.mcpManager.listMCPTools(ctx);
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
