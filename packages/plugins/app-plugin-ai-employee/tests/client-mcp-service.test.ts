import { describe, expect, it, vi } from 'vitest';

import { createApiClient } from '@nocobase/app-client';
import { listMCPTools, testMCPConnection } from '../client/mcp-service.ts';

describe('MCP client service', () => {
  it('tests unsaved remote values at the collection and a configured server by name', async () => {
    const api = createApiClient({ baseURL: '/api' });
    const request = vi
      .spyOn(api, 'request')
      .mockResolvedValue({ data: { success: true, toolsCount: 2 } });

    await expect(
      testMCPConnection(api, {
        transport: 'http',
        url: 'https://example.com/mcp',
      }),
    ).resolves.toMatchObject({
      success: true,
      toolsCount: 2,
    });
    expect(request).toHaveBeenCalledWith({
      path: 'aiEmployee/mcpServers/testConnection',
      method: 'POST',
      json: { transport: 'http', url: 'https://example.com/mcp' },
    });

    await testMCPConnection(api, { name: 'local/files' });
    expect(request).toHaveBeenLastCalledWith({
      path: 'aiEmployee/mcpServers/local%2Ffiles/testConnection',
      method: 'POST',
    });
  });

  it('reads tools grouped by MCP server', async () => {
    const api = createApiClient({ baseURL: '/api' });
    vi.spyOn(api, 'request').mockResolvedValue({
      data: {
        profile: [
          {
            name: 'getProfile',
            title: 'Get profile',
            serverName: 'profile',
            permission: 'ASK',
          },
        ],
      },
    });

    await expect(listMCPTools(api)).resolves.toEqual({
      profile: [
        {
          name: 'getProfile',
          title: 'Get profile',
          serverName: 'profile',
          permission: 'ASK',
        },
      ],
    });
  });
});
