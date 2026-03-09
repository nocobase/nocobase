/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'node:crypto';
import type { McpToolsManager } from '@nocobase/ai';
import { McpServer as SDKMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  InitializeRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

type JsonRpcBody = Record<string, any> | Record<string, any>[];

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

export class McpServer {
  private readonly server: SDKMcpServer;
  private readonly transports = new Map<string, StreamableHTTPServerTransport>();

  constructor(
    private readonly options: {
      name: string;
      version: string;
      toolsManager: McpToolsManager;
      logger: {
        error: (...args: any[]) => void;
      };
    },
  ) {
    this.server = new SDKMcpServer(
      {
        name: options.name,
        version: options.version,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );
    this.registerHandlers();
  }

  async handlePost(ctx: any) {
    const sessionId = ctx.get('mcp-session-id');
    const body = (ctx.request.body || {}) as JsonRpcBody;

    if (sessionId) {
      const transport = this.transports.get(sessionId);
      if (!transport) {
        ctx.status = 400;
        ctx.body = this.badRequestError('Invalid session id');
        return;
      }
      ctx.respond = false;
      await transport.handleRequest(ctx.req, ctx.res, body);
      return;
    }

    if (!this.isInitializeRequest(body)) {
      ctx.status = 400;
      ctx.body = this.badRequestError('Initialize request required for new session');
      return;
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });
    transport.onerror = (error) => {
      this.options.logger.error(error);
    };
    await this.server.connect(transport);

    const newSessionId = transport.sessionId;
    if (newSessionId) {
      this.transports.set(newSessionId, transport);
      transport.onclose = () => {
        this.transports.delete(newSessionId);
      };
    }

    await transport.handleRequest(ctx.req, ctx.res, body);
    ctx.respond = false;
  }

  private registerHandlers() {
    this.server.server.setRequestHandler(ListToolsRequestSchema, async () => {
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

    this.server.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = (request.params.arguments || {}) as Record<string, any>;
      const tool = this.options.toolsManager.getTool(toolName);
      if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
      }

      try {
        const result = await tool.call(args);
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
  }

  private isInitializeRequest(body: JsonRpcBody) {
    if (Array.isArray(body)) {
      return body.some((item) => InitializeRequestSchema.safeParse(item).success);
    }
    return InitializeRequestSchema.safeParse(body).success;
  }

  private badRequestError(message: string) {
    return {
      jsonrpc: '2.0',
      id: randomUUID(),
      error: {
        code: -32000,
        message,
      },
    };
  }
}
