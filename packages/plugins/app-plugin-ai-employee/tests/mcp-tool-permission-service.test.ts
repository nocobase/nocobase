import { AIManager, MemoryRepositoryFactory } from '@nocobase/ai-employee';
import { describe, expect, it } from 'vitest';

import { AIMCPServerService } from '../server/service/ai-mcp-server-service.js';

describe('updateToolPermission', () => {
  it('answers 404 for a tool no connected server exposes, and keeps nothing', async () => {
    const ai = new AIManager({ repositories: new MemoryRepositoryFactory() });
    await ai.mcpServerManager.registerMCP({
      search: { transport: 'http', url: 'http://127.0.0.1:1/mcp' },
    });

    await expect(
      new AIMCPServerService({ ai }).updateToolPermission({
        serverName: 'search',
        toolName: 'mcp-search-query',
        permission: 'ALLOW',
      }),
    ).rejects.toMatchObject({ status: 404, reason: 'MCP_TOOL_NOT_FOUND' });
    await expect(
      new AIMCPServerService({ ai }).updateToolPermission({
        serverName: 'missing',
        toolName: 'mcp-search-query',
        permission: 'ALLOW',
      }),
    ).rejects.toMatchObject({ status: 404, reason: 'MCP_SERVER_NOT_FOUND' });
    expect(
      (await ai.mcpServerManager.getMCP('search'))?.toolPermissions ?? {},
    ).toEqual({});
  });
});
