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

export class PluginMcpServerServer extends Plugin {
  private mcpServer: McpServer;

  async afterAdd() {
    this.app.on('afterStart', async () => {
      this.mcpServer = new McpServer({
        name: 'nocobase-mcp-server',
        version: this.options.version || '0.0.0',
        toolsManager: this.ai.mcpToolsManager,
        logger: this.log,
      });
    });
  }

  async beforeLoad() {}

  async load() {
    const apiTools = await collectMcpToolsFromSwagger({
      app: this.app,
    });
    this.ai.mcpToolsManager.registerTools(apiTools);

    this.app.resourceManager.define({
      name: 'mcp',
      actions: {
        call: async (ctx, next) => {
          await this.mcpServer.handlePost(ctx);
          await next();
        },
      },
    });
    this.app.acl.allow('mcp', 'call', 'loggedIn');

    this.log.info(`MCP StreamableHTTP route ready: POST /mcp`);
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginMcpServerServer;
