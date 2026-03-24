/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getMCPToolsByServer } from '../../ai-employees/admin/mcp/MCPToolsList';

describe('getMCPToolsByServer', () => {
  it('returns tools for the target MCP server only', () => {
    expect(
      getMCPToolsByServer(
        {
          weather: [
            { name: 'mcp-weather-current', title: 'current', serverName: 'weather', permission: 'ALLOW' },
            { name: 'mcp-weather-forecast', title: 'forecast', serverName: 'weather', permission: 'ASK' },
          ],
          maps: [{ name: 'mcp-maps-search', title: 'search', serverName: 'maps', permission: 'ASK' }],
        },
        'weather',
      ),
    ).toEqual([
      { name: 'mcp-weather-current', title: 'current', serverName: 'weather', permission: 'ALLOW' },
      { name: 'mcp-weather-forecast', title: 'forecast', serverName: 'weather', permission: 'ASK' },
    ]);
  });

  it('returns an empty array for unknown servers', () => {
    expect(getMCPToolsByServer(undefined, 'weather')).toEqual([]);
    expect(getMCPToolsByServer({}, 'weather')).toEqual([]);
  });
});
