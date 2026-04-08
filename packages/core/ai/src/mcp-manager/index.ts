/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import { Op } from '@nocobase/database';
import { Registry } from '@nocobase/utils';
import { MultiServerMCPClient, StdioConnection, StreamableHTTPConnection } from '@langchain/mcp-adapters';
import { StructuredToolInterface } from '@langchain/core/tools';
import { MCPEntry, MCPFilter, MCPManager, MCPOptions, MCPTestResult, MCPToolEntry } from './types';
import type { DynamicToolsProvider, Permission, ToolsRegistration, ToolsOptions } from '../tools-manager/types';
import type { Context } from '@nocobase/actions';

export class DefaultMCPManager implements MCPManager {
  private readonly mcpRegistry = new Registry<MCPEntry>();
  private readonly provideCollectionManager: () => { collectionManager: SequelizeCollectionManager };
  private mode = 'memory';
  private client: MultiServerMCPClient | null = null;
  private toolsMap: Record<string, StructuredToolInterface[]> = {};
  private toolsPermissionMap: Record<string, Permission> = {};

  constructor(private readonly app: any) {
    this.provideCollectionManager = () => app.mainDataSource;
  }

  async init() {
    if (this.mode === 'memory') {
      await this.persistence();
      this.mode = 'database';
    }
    try {
      await this.rebuildClient();
    } catch (e) {
      this.app.log.error('fail to init mcp clients', e);
    }
  }

  async registerMCP(registration: { [key: string | symbol]: MCPOptions }): Promise<void> {
    if (this.mode === 'memory') {
      for (const [name, options] of Object.entries(registration)) {
        this.mcpRegistry.register(name, this.normalizeEntry(name, options));
      }
    } else {
      for (const [name, options] of Object.entries(registration)) {
        await this.persistenceEntry({
          name,
          ...this.normalizeEntry(name, options),
        });
      }
    }
  }

  async getMCP(name: string): Promise<MCPEntry> {
    return (await this.aiMcpClientsModel?.findOne({ where: { name } }))?.toJSON() as MCPEntry;
  }

  async listMCP(filter: MCPFilter = {}): Promise<MCPEntry[]> {
    const where = {};
    if (filter.name) {
      where['name'] = {
        [Op.substring]: filter.name,
      };
    }
    if (filter.enabled != null) {
      where['enabled'] = filter.enabled;
    }
    if (filter.transport) {
      where['transport'] = filter.transport;
    }
    return (await this.aiMcpClientsModel?.findAll({ where }))?.map((item) => item.toJSON() as MCPEntry) ?? [];
  }

  async rebuildClient(): Promise<void> {
    // Close existing client if exists
    if (this.client) {
      try {
        await this.client.close();
      } catch (e) {
        // Ignore close errors
      }
      this.client = null;
      this.toolsMap = {};
    }

    // Get all enabled MCP entries
    const entries = await this.listMCP({ enabled: true });

    if (entries.length === 0) {
      return;
    }

    // Build connections object
    const connections: Record<string, StdioConnection | StreamableHTTPConnection> = {};
    for (const entry of entries) {
      connections[entry.name] = this.buildMCPConnection(entry);
    }

    // Create new client and initialize connections
    this.client = new MultiServerMCPClient(connections);
    const toolsMap = await this.client.initializeConnections();

    // Cache tools for each server
    for (const [serverName, tools] of Object.entries(toolsMap)) {
      this.toolsMap[serverName] = tools as StructuredToolInterface[];
      for (const tool of tools as StructuredToolInterface[]) {
        const toolName = `mcp-${serverName}-${tool.name}`;
        if (!(toolName in this.toolsPermissionMap)) {
          this.toolsPermissionMap[toolName] = tool.name.startsWith('get') ? 'ALLOW' : 'ASK';
        }
      }
    }
  }

  getClient(): MultiServerMCPClient | null {
    return this.client;
  }

  getMCPToolsProvider(): DynamicToolsProvider {
    return async (register: ToolsRegistration): Promise<void> => {
      // Use cached tools from rebuildClient
      for (const [serverName, tools] of Object.entries(this.toolsMap)) {
        for (const tool of tools) {
          const toolName = `mcp-${serverName}-${tool.name}`;
          const toolOptions: ToolsOptions = {
            scope: 'GENERAL',
            from: 'mcp',
            defaultPermission: this.toolsPermissionMap[toolName],
            introduction: {
              title: tool.name,
              about: tool.description,
            },
            definition: {
              name: toolName,
              description: tool.description || `MCP tool: ${tool.name} from ${serverName}`,
              schema: tool.schema,
            },
            invoke: async (_ctx: Context, args: any) => {
              try {
                const result = await tool.invoke(args);
                return result;
              } catch (error: any) {
                return {
                  status: 'error' as const,
                  content: error?.message || 'Tool invocation failed',
                };
              }
            },
          };
          register.registerTools(toolOptions);
        }
      }
    };
  }

  async listMCPTools(): Promise<Record<string, MCPToolEntry[]>> {
    return Object.fromEntries(
      Object.entries(this.toolsMap).map(([serverName, tools]) => [
        serverName,
        tools.map((tool) => {
          const toolName = `mcp-${serverName}-${tool.name}`;
          return {
            name: toolName,
            title: tool.name,
            description: tool.description,
            serverName,
            permission: this.toolsPermissionMap[toolName] ?? 'ASK',
          };
        }),
      ]),
    );
  }

  async updateMCPToolPermission(toolName: string, permission: Permission): Promise<void> {
    this.toolsPermissionMap[toolName] = permission;
  }

  async testConnection(options: MCPOptions): Promise<MCPTestResult> {
    const { transport } = options;

    // Validate required fields
    if (!transport) {
      return {
        success: false,
        error: 'Transport type is required',
      };
    }

    if (transport === 'stdio' && !options.command) {
      return {
        success: false,
        error: 'Command is required for stdio transport',
      };
    }

    if ((transport === 'http' || transport === 'sse') && !options.url) {
      return {
        success: false,
        error: 'URL is required for HTTP/SSE transport',
      };
    }

    let client: MultiServerMCPClient | null = null;

    try {
      const connection = this.buildMCPConnection(options);
      const serverName = 'test-server';

      client = new MultiServerMCPClient({
        [serverName]: connection,
      });

      // Initialize connections with timeout
      const toolsMap = await Promise.race([
        client.initializeConnections(),
        new Promise<never>((_resolve, reject) =>
          setTimeout(() => reject(new Error('Connection timeout (60s)')), 60000),
        ),
      ]);
      const tools = toolsMap[serverName] || [];

      // Get tool names for display
      const toolNames = tools.map((tool) => tool.name);

      return {
        success: true,
        message: 'Connection successful',
        toolsCount: tools.length,
        tools: toolNames.slice(0, 20), // Limit to 20 tools for display
        toolsTruncated: toolNames.length > 20,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to connect to MCP server';

      // Provide helpful hints for common errors
      let hint: string | undefined;
      if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
        hint = 'Try running: npm cache clean --force';
      } else if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
        hint = 'Make sure the command exists and is accessible';
      } else if (errorMessage.includes('timeout')) {
        hint = 'The server took too long to respond. Check if the server is running correctly.';
      }

      return {
        success: false,
        error: errorMessage,
        details: hint ? `Hint: ${hint}\n\n${error?.stack || ''}` : error?.stack || '',
      };
    } finally {
      if (client) {
        try {
          await client.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }

  private buildMCPConnection(options: MCPOptions): StdioConnection | StreamableHTTPConnection {
    const { transport, command, args, env, url, headers, restart } = options;

    if (transport === 'stdio') {
      const connection: StdioConnection = {
        transport: 'stdio',
        command: command || '',
        args: args || [],
      };

      if (env && Object.keys(env).length > 0) {
        connection.env = env;
      }

      if (restart && typeof restart === 'object' && !Array.isArray(restart)) {
        connection.restart = restart;
      }

      return connection;
    }

    // For http or sse transport
    const connection: StreamableHTTPConnection = {
      transport: transport === 'sse' ? 'sse' : 'http',
      url: url || '',
    };

    if (headers && Object.keys(headers).length > 0) {
      connection.headers = headers;
    }

    return connection;
  }

  async persistence(): Promise<void> {
    for (const entry of this.mcpRegistry.getValues()) {
      await this.persistenceEntry(entry);
    }
  }

  private async persistenceEntry(entry: MCPEntry): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      const existed = await this.aiMcpClientsModel.findOne({ where: { name: entry.name }, transaction });
      if (existed) {
        await existed.update(
          {
            transport: entry.transport,
            command: entry.command,
            args: entry.args,
            env: entry.env,
            url: entry.url,
            headers: entry.headers,
            restart: entry.restart,
          },
          { transaction },
        );
        return;
      }

      await this.aiMcpClientsModel.create(
        {
          ...entry,
        },
        { transaction },
      );
    });
  }

  private normalizeEntry(name: string, options: MCPOptions): MCPEntry {
    return {
      name,
      enabled: true,
      ...options,
      args: options.args ?? [],
      env: options.env ?? {},
    };
  }

  private get aiMcpClientsCollection() {
    return this.collectionManager.getCollection('aiMcpClients');
  }

  private get aiMcpClientsModel() {
    return this.aiMcpClientsCollection?.model;
  }

  private get sequelize() {
    return this.collectionManager.db.sequelize;
  }

  private get collectionManager() {
    return this.provideCollectionManager().collectionManager;
  }
}

export function defineMCP(options: MCPOptions) {
  return options;
}

export * from './types';
