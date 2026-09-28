import type {
  AIManager,
  MCPOptions,
  MCPTestResult,
  MCPToolEntry,
} from '@nocobase/ai-employee';
import {
  asRecord,
  badRequest,
  notFound,
  redactSecrets,
  requiredString,
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

  public async updateEnabled({ input }: { input: unknown }): Promise<void> {
    const record = asRecord(input);
    if (!record) throw badRequest('Resource body must be an object');
    const name = requiredString(record.name, 'name');
    if (typeof record.enabled !== 'boolean')
      throw badRequest('enabled must be a boolean');
    await this.ai.mcpServerManager.updateMCPEnabled(name, record.enabled);
    await this.ai.mcpServerManager.rebuildClient();
  }

  public async list(_options: {}): Promise<unknown[]> {
    return (await this.ai.mcpServerManager.listMCP({})).map(serializeMCPServer);
  }

  public async get({ name }: { name: string }): Promise<unknown> {
    const server = await this.ai.mcpServerManager.getMCP(name);
    if (!server) throw notFound('aiMcpServers', name);
    return serializeMCPServer(server);
  }

  public async testConnection({
    input,
  }: {
    input: unknown;
  }): Promise<MCPTestResult> {
    const record = asRecord(input);
    if (!record) throw badRequest('Resource body must be an object');
    let source = record;
    if (record.name !== undefined) {
      // A named test uses only the configured server, never the request body.
      const name = requiredString(record.name, 'name');
      const configured = await this.ai.mcpServerManager.getMCP(name);
      if (!configured) throw notFound('aiMcpServers', name);
      source = asRecord(configured) ?? {};
    } else if (record.transport === 'stdio') {
      // stdio spawns `command` on this host, so it must come from config.yml.
      throw badRequest(
        'A stdio server can only be tested by the name of a configured server',
      );
    }
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

  public async listTools(): Promise<Record<string, MCPToolEntry[]>> {
    return this.ai.mcpServerManager.listMCPTools();
  }

  public async updateToolPermission({
    input,
  }: {
    input: unknown;
  }): Promise<void> {
    const record = asRecord(input);
    if (!record) throw badRequest('Resource body must be an object');
    const toolName = requiredString(record.toolName, 'toolName');
    const permission = record.permission;
    if (permission !== 'ASK' && permission !== 'ALLOW') {
      throw badRequest('permission must be ASK or ALLOW');
    }
    // A tool is listed only while its server is connected; a permission for
    // any other name has nowhere to be kept.
    const tools = await this.ai.mcpServerManager.listMCPTools();
    const listed = Object.values(tools).some((entries) =>
      entries.some((entry) => entry.name === toolName),
    );
    if (!listed) throw notFound('MCP tool', toolName);
    await this.ai.mcpServerManager.updateMCPToolPermission(
      toolName,
      permission,
    );
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
