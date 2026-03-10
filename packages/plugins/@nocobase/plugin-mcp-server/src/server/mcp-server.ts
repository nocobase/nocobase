/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { McpToolsManager } from '@nocobase/ai';
import { McpServer as SDKMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';

function stringifyContent(content: any) {
  if (typeof content === 'string') {
    return content;
  }
  try {
    return JSON.stringify(content);
  } catch (error) {
    return String(content);
  }
}

function normalizeHeaderValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function resolveTokenFromExtra(extra?: RequestHandlerExtra<any, any>) {
  if (extra?.authInfo?.token) {
    return extra.authInfo.token;
  }
  const headers = extra?.requestInfo?.headers;
  if (!headers) {
    return undefined;
  }
  const authHeader = normalizeHeaderValue(headers.authorization || headers.Authorization);
  if (!authHeader) {
    return undefined;
  }
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || authHeader;
}

export class McpServer {
  constructor(
    private readonly options: {
      name: string;
      version: string;
      toolsManager: McpToolsManager;
      logger: {
        error: (...args: any[]) => void;
      };
    },
  ) {}

  async handlePost(ctx: any) {
    const body = (ctx.request.body || {}) as Record<string, any> | Record<string, any>[];
    const server = this.createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    transport.onerror = (error) => {
      this.options.logger.error(error);
    };

    await server.connect(transport);
    try {
      await transport.handleRequest(ctx.req, ctx.res, body);
    } finally {
      await server.close();
    }
    ctx.respond = false;
  }

  private createServer() {
    const server = new SDKMcpServer(
      {
        name: this.options.name,
        version: this.options.version,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );
    server.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.options.toolsManager.listTools().map((tool) => {
          return {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema || {
              type: 'object',
              properties: {},
            },
          };
        }),
      };
    });

    server.server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      const toolName = request.params.name;
      const args = (request.params.arguments || {}) as Record<string, any>;
      const tool = this.options.toolsManager.getTool(toolName);
      if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
      }
      const token = resolveTokenFromExtra(extra);

      try {
        const result = await tool.call(args, {
          token,
          headers: extra?.requestInfo?.headers,
        });
        return {
          content: [
            {
              type: 'text',
              text: stringifyContent(result),
            },
          ],
          isError: false,
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: error instanceof Error ? error.message : stringifyContent(error),
            },
          ],
          isError: true,
        };
      }
    });
    return server;
  }
}
