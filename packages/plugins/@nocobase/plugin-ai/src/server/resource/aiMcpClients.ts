/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ResourceOptions } from '@nocobase/resourcer';
import { Repository, type Model } from '@nocobase/database';
import type { Context, Next } from '@nocobase/actions';
import { MCPOptions, MCPTestResult, MCPToolPermissionError } from '@nocobase/ai';

const namespace = '@nocobase/plugin-ai';
const toolPermissionErrorMessages: Record<MCPToolPermissionError['code'], string> = {
  INVALID_PERMISSION: 'Invalid MCP tool permission',
  TOOL_NOT_FOUND_OR_AMBIGUOUS: 'MCP tool not found or ambiguous',
};
const stdioMessage = 'Stdio MCP servers can only be configured in storage/ai/mcp/servers.json.';
const protectedMessage =
  'This MCP server is managed by deployment configuration. Only its enabled state can be changed.';
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

async function protectMCPWrites(ctx: Context, next: Next) {
  const { actionName, params } = ctx.action;
  if (!['create', 'update', 'destroy', 'firstOrCreate', 'updateOrCreate'].includes(actionName)) {
    return next();
  }

  const repository = ctx.db.getRepository('aiMcpClients');
  if (actionName === 'destroy') {
    const matches = await repository.find({
      filter: params.filter,
      filterByTk: params.filterByTk,
      fields: ['name', 'transport', 'fromFile'],
    });
    if (matches.some((record) => record.get('transport') === 'stdio' || record.get('fromFile') === true)) {
      ctx.throw(403, ctx.t(protectedMessage, { ns: namespace }));
    }
    return next();
  }

  const rawValues: unknown = params.values;
  const rows: unknown[] = Array.isArray(rawValues) ? rawValues : [rawValues];
  const sanitizedRows: Record<string, unknown>[] = [];
  for (const row of rows) {
    if (!isRecord(row)) {
      ctx.throw(400, ctx.t('Invalid MCP configuration', { ns: namespace }));
    }
    const values = { ...row };
    delete values.fromFile;
    sanitizedRows.push(values);
  }
  params.values = Array.isArray(rawValues) ? sanitizedRows : sanitizedRows[0];

  // Preflight every row before any builtin action can write; never forward pagination into the protection query.
  for (const values of sanitizedRows) {
    let matches: Model[] = [];
    if (actionName === 'update') {
      matches = await repository.find({
        filter: Array.isArray(rawValues) ? undefined : params.filter,
        filterByTk: Array.isArray(rawValues) ? values.name : params.filterByTk,
        fields: ['name', 'transport', 'fromFile'],
      });
    } else if (actionName === 'firstOrCreate' || actionName === 'updateOrCreate') {
      const match = await repository.findOne({ filter: Repository.valuesToFilter(values, params.filterKeys) });
      matches = match ? [match] : [];
      if (actionName === 'firstOrCreate' && match) {
        continue;
      }
    }
    if (values.transport === 'stdio') {
      ctx.throw(403, ctx.t(stdioMessage, { ns: namespace }));
    }
    const enabledOnly = Object.keys(values).length === 1 && Object.hasOwn(values, 'enabled');
    if (
      !enabledOnly &&
      matches.some((record) => record.get('transport') === 'stdio' || record.get('fromFile') === true)
    ) {
      ctx.throw(403, ctx.t(protectedMessage, { ns: namespace }));
    }
  }
  await next();
}

export const aiMcpClients: ResourceOptions = {
  name: 'aiMcpClients',
  middleware: protectMCPWrites,
  actions: {
    testConnection: async (ctx, next) => {
      const { filterByTk, values } = ctx.action.params;
      let options = values as MCPOptions;
      if (filterByTk != null) {
        if (typeof filterByTk !== 'string' || !filterByTk) {
          ctx.throw(403, ctx.t(stdioMessage, { ns: namespace }));
        }
        const record = await ctx.db.getRepository('aiMcpClients').findOne({ filterByTk });
        if (!record) {
          ctx.throw(404, ctx.t('MCP server not found', { ns: namespace }));
        }
        if (record.get('transport') === 'stdio') {
          // Never merge any request field into a saved process configuration.
          options = record.toJSON() as MCPOptions;
          if (!options.command) {
            ctx.body = {
              success: false,
              error: ctx.t('Command is required for stdio transport', { ns: namespace }),
            } satisfies MCPTestResult;
            await next();
            return;
          }
        } else if (options?.transport === 'stdio') {
          ctx.throw(403, ctx.t(stdioMessage, { ns: namespace }));
        }
      } else if (options?.transport === 'stdio') {
        ctx.throw(403, ctx.t(stdioMessage, { ns: namespace }));
      }
      if (!options) {
        ctx.body = {
          success: false,
          error: ctx.t('No configuration provided', { ns: namespace }),
        } satisfies MCPTestResult;
        await next();
        return;
      }

      const plugin = ctx.app.pm.get('ai');
      ctx.body = await plugin.ai.mcpManager.testConnection(options, ctx);
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
      const values: unknown = ctx.action.params.values;
      if (
        !isRecord(values) ||
        typeof values.toolName !== 'string' ||
        !values.toolName.trim() ||
        (values.permission !== 'ASK' && values.permission !== 'ALLOW')
      ) {
        return ctx.throw(400, ctx.t('Invalid MCP tool permission', { ns: namespace }));
      }
      const { toolName, permission } = values;
      const plugin = ctx.app.pm.get('ai');
      try {
        await plugin.ai.mcpManager.updateMCPToolPermission(toolName, permission, ctx);
      } catch (error: unknown) {
        if (error instanceof MCPToolPermissionError) {
          return ctx.throw(400, ctx.t(toolPermissionErrorMessages[error.code], { ns: namespace }));
        }
        throw error;
      }
      ctx.body = { success: true };
      await next();
    },
  },
};

export default aiMcpClients;
