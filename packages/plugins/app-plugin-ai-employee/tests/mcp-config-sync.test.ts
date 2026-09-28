import { AIManager, MemoryRepositoryFactory } from '@nocobase/ai-employee';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AIMCPServerService } from '../server/service/ai-mcp-server-service.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('syncConfiguredMCPServers', () => {
  it('registers headers, args and env exactly as configured', async () => {
    const ai = new AIManager({ repositories: new MemoryRepositoryFactory() });
    // Connecting is not what this asserts, and a stdio server would spawn.
    vi.spyOn(ai.mcpServerManager, 'rebuildClient').mockResolvedValue(
      undefined as never,
    );

    // A `${NAME}` is not expanded: an application maps a variable onto the
    // field with `env` in its `defineAppConfig` instead.
    await new AIMCPServerService({ ai }).syncConfiguredMCPServers({
      remote: {
        transport: 'http',
        url: 'https://example.test',
        headers: { Authorization: 'Bearer real-token' },
      },
      local: {
        transport: 'stdio',
        command: 'npx',
        args: ['--token', '${MCP_TOKEN}'],
        env: { TOKEN: 'real-token' },
      },
    });

    const servers = await ai.mcpServerManager.listMCP({});
    const byName = new Map(servers.map((server) => [server.name, server]));
    expect(byName.get('remote')?.headers).toEqual({
      Authorization: 'Bearer real-token',
    });
    expect(byName.get('local')?.args).toEqual(['--token', '${MCP_TOKEN}']);
    expect(byName.get('local')?.env).toEqual({ TOKEN: 'real-token' });
  });
});
