import type {
  AIManager,
  MCPEntity,
  MCPOptions,
  MCPTestResult,
  MCPToolEntry,
} from '@nocobase/ai-employee';
import type { z } from 'zod';

import {
  findReservedMCPServerNames,
  reservedMCPServerNameMessage,
} from '../route/reserved-names.js';
import type { MCPCandidateInput } from '../route/schemas.js';
import {
  asRecord,
  badRequest,
  notFound,
  redactSecrets,
  stringArray,
  stringRecord,
} from './utils.js';

export interface AIMCPServerServiceOptions {
  readonly ai: AIManager;
}

export class AIMCPServerService {
  private readonly ai: AIManager;

  public constructor({ ai }: AIMCPServerServiceOptions) {
    this.ai = ai;
  }

  public async syncConfiguredMCPServers(
    configured: Readonly<Record<string, MCPOptions>> | undefined,
  ): Promise<void> {
    const desired = configured ?? {};
    const reserved = findReservedMCPServerNames(desired);
    if (reserved.length > 0)
      throw new Error(reserved.map(reservedMCPServerNameMessage).join(' '));
    const current = await this.ai.mcpServerManager.listMCP({});
    for (const server of current) {
      if (!(server.name in desired))
        await this.ai.mcpServerManager.deleteMCP(server.name);
    }
    if (Object.keys(desired).length > 0) {
      await this.ai.mcpServerManager.registerMCP(desired);
    }
    await this.ai.mcpServerManager.rebuildClient();
  }

  public async setEnabled({
    name,
    enabled,
  }: {
    name: string;
    enabled: boolean;
  }): Promise<unknown> {
    await this.requireServer(name);
    await this.ai.mcpServerManager.updateMCPEnabled(name, enabled);
    await this.ai.mcpServerManager.rebuildClient();
    return this.get({ name });
  }

  public async list(_options: {}): Promise<unknown[]> {
    return (await this.ai.mcpServerManager.listMCP({})).map(serializeMCPServer);
  }

  public async get({ name }: { name: string }): Promise<unknown> {
    return serializeMCPServer(await this.requireServer(name));
  }

  /** Tests a configured server, using only its saved configuration. */
  public async testConnection({
    name,
  }: {
    name: string;
  }): Promise<MCPTestResult> {
    const configured = await this.requireServer(name);
    return this.test(asRecord(configured) ?? {});
  }

  /**
   * Tests a remote server from values that are not saved yet. A stdio server spawns `command` on this host, so it can
   * only be tested by the name of a server configured in config.yml.
   */
  public async testCandidate({
    values,
  }: {
    values: z.infer<typeof MCPCandidateInput>;
  }): Promise<MCPTestResult> {
    return this.test(values);
  }

  public async listTools(): Promise<Record<string, MCPToolEntry[]>> {
    return this.ai.mcpServerManager.listMCPTools();
  }

  public async updateToolPermission({
    serverName,
    toolName,
    permission,
  }: {
    serverName: string;
    toolName: string;
    permission: 'ASK' | 'ALLOW';
  }): Promise<MCPToolEntry> {
    await this.requireServer(serverName);
    // A tool is listed only while its server is connected; a permission for
    // any other name has nowhere to be kept.
    const tools = await this.ai.mcpServerManager.listMCPTools();
    const listed = (tools[serverName] ?? []).find(
      (entry) => entry.name === toolName,
    );
    if (!listed)
      throw notFound(
        'MCP_TOOL_NOT_FOUND',
        `MCP server ${serverName} has no connected tool ${toolName}.`,
      );
    await this.ai.mcpServerManager.updateMCPToolPermission(
      toolName,
      permission,
    );
    return { ...listed, permission };
  }

  private async requireServer(name: string): Promise<MCPEntity> {
    const server = await this.ai.mcpServerManager.getMCP(name);
    if (!server)
      throw notFound(
        'MCP_SERVER_NOT_FOUND',
        `MCP server ${name} was not found.`,
      );
    return server;
  }

  private test(source: Record<string, unknown>): Promise<MCPTestResult> {
    const transport = source.transport;
    if (transport !== 'stdio' && transport !== 'sse' && transport !== 'http') {
      throw badRequest('transport must be stdio, sse, or http');
    }
    return this.ai.mcpServerManager.testConnection({
      transport,
      command: typeof source.command === 'string' ? source.command : undefined,
      args: stringArray(source.args),
      env: stringRecord(source.env),
      url: typeof source.url === 'string' ? source.url : undefined,
      headers: stringRecord(source.headers),
      restart: asRecord(source.restart),
    });
  }
}

function serializeMCPServer(value: unknown): unknown {
  const record = asRecord(value);
  return record
    ? {
        ...record,
        env: redactSecrets(record.env),
        headers: redactSecrets(record.headers),
      }
    : value;
}
