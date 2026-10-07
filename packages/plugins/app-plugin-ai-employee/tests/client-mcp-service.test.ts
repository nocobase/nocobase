import { describe, expect, it, vi } from 'vitest';

import { createApiClient } from '@nocobase/app-client';
import { listMCPTools } from '../client/mcp-service.ts';

describe('MCP client service', () => {
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
