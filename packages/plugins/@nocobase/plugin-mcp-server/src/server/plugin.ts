/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { collectMcpToolsFromSwagger } from './mcp-tools';
import { McpServer } from './mcp-server';
import { createCrudTool } from './crud-tool';

export class PluginMcpServerServer extends Plugin {
  private mcpServer: McpServer;
  private readonly registerMcpTools = async () => {
    const apiTools = await collectMcpToolsFromSwagger({
      app: this.app,
    });
    this.ai.mcpToolsManager.registerTools([...apiTools, createCrudTool({ app: this.app })]);
  };

  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    await this.registerMcpTools();

    this.mcpServer = new McpServer({
      name: 'nocobase-mcp-server',
      version: this.options.version || '0.0.0',
      toolsManager: this.ai.mcpToolsManager,
      logger: this.log,
    });

    const mcpHandler = async (ctx, next) => {
      await this.mcpServer.handlePost(ctx);
      await next();
    };
    this.app.resourceManager.define({
      name: 'mcp',
      actions: {
        // list and create are default methods for 'GET' and 'POST' requests
        // so that the mcp server can be called via '/mcp' endpoint directly
        list: mcpHandler,
        create: mcpHandler,
      },
      only: ['list', 'create'],
    });
    this.app.acl.allow('mcp', '*', 'loggedIn');
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginMcpServerServer;
