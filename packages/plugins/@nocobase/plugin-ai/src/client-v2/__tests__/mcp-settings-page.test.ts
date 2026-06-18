/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  createMCPClient,
  deleteMCPClient,
  deleteMCPClients,
  getMCPToolsByServer,
  listMCPClients,
  listMCPTools,
  rebuildMCPClient,
  sanitizeMCPValues,
  testMCPConnection,
  toMCPFormValues,
  updateMCPClient,
  updateMCPClientEnabled,
  updateMCPToolPermission,
} from '../pages/MCPSettingsPage';

describe('MCPSettingsPage request helpers', () => {
  it('sanitizes stdio values and clears remote fields', () => {
    expect(
      sanitizeMCPValues({
        name: 'server',
        transport: 'stdio',
        command: 'npx',
        args: '-y package --flag',
        env: [{ name: 'TOKEN', value: 'secret' }],
        headers: [{ name: 'Authorization', value: 'Bearer token' }],
        url: 'https://example.com/mcp',
        restart: null,
      }),
    ).toEqual({
      name: 'server',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', 'package', '--flag'],
      env: { TOKEN: 'secret' },
      headers: {},
      url: null,
      restart: {},
    });
  });

  it('sanitizes remote values and clears stdio fields', () => {
    expect(
      sanitizeMCPValues({
        name: 'server',
        transport: 'http',
        command: 'npx',
        args: ['-y'],
        env: { TOKEN: 'secret' },
        headers: [{ name: 'Authorization', value: 'Bearer token' }],
        url: 'https://example.com/mcp',
        restart: { max: 1 },
      }),
    ).toEqual({
      name: 'server',
      transport: 'http',
      command: null,
      args: [],
      env: {},
      headers: { Authorization: 'Bearer token' },
      url: 'https://example.com/mcp',
      restart: { max: 1 },
    });
  });

  it('maps records to form values', () => {
    expect(
      toMCPFormValues({
        name: 'server',
        transport: 'stdio',
        args: ['-y', 'pkg'],
        env: { TOKEN: 'secret' },
        headers: { Authorization: 'Bearer token' },
      }),
    ).toMatchObject({
      args: '-y pkg',
      env: [{ name: 'TOKEN', value: 'secret' }],
      headers: [{ name: 'Authorization', value: 'Bearer token' }],
      restart: {},
    });
  });

  it('lists MCP clients from aiMcpClients.list', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [
          { name: 'server', transport: 'stdio' },
          { name: 'invalid', transport: 'bad' },
        ],
        count: 1,
      },
    });
    const apiClient = {
      resource: () => ({ list }),
    };

    await expect(listMCPClients(apiClient)).resolves.toEqual({
      data: [{ name: 'server', transport: 'stdio' }],
      total: 1,
    });
  });

  it('tests connection with sanitized values', async () => {
    const testConnection = vi.fn().mockResolvedValue({
      data: {
        data: {
          success: true,
          toolsCount: 2,
        },
      },
    });
    const apiClient = {
      resource: () => ({ testConnection }),
    };

    await expect(
      testMCPConnection(apiClient, {
        name: 'server',
        transport: 'stdio',
        command: 'npx',
        args: '-y pkg',
      }),
    ).resolves.toEqual({ success: true, toolsCount: 2 });
    expect(testConnection).toHaveBeenCalledWith({
      values: {
        name: 'server',
        transport: 'stdio',
        command: 'npx',
        args: ['-y', 'pkg'],
        env: {},
        headers: {},
        url: null,
        restart: {},
      },
    });
  });

  it('creates and updates MCP clients with sanitized payloads and name filter', async () => {
    const create = vi.fn().mockResolvedValue({});
    const update = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ create, update }),
    };

    await createMCPClient(apiClient, {
      name: 'server',
      transport: 'http',
      url: 'https://example.com/mcp',
    });
    await updateMCPClient(
      apiClient,
      {
        name: 'server',
        transport: 'http',
        url: 'https://example.com/mcp',
      },
      'server',
    );

    expect(create).toHaveBeenCalledWith({
      values: {
        name: 'server',
        transport: 'http',
        url: 'https://example.com/mcp',
        command: null,
        args: [],
        env: {},
        headers: {},
        restart: {},
      },
    });
    expect(update).toHaveBeenCalledWith({
      filterByTk: 'server',
      values: {
        name: 'server',
        transport: 'http',
        url: 'https://example.com/mcp',
        command: null,
        args: [],
        env: {},
        headers: {},
        restart: {},
      },
    });
  });

  it('deletes MCP clients and updates enabled state by name', async () => {
    const destroy = vi.fn().mockResolvedValue({});
    const update = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ destroy, update }),
    };

    await deleteMCPClient(apiClient, 'server');
    await deleteMCPClients(apiClient, ['server', 'other']);
    await updateMCPClientEnabled(apiClient, 'server', false);

    expect(destroy).toHaveBeenNthCalledWith(1, { filterByTk: 'server' });
    expect(destroy).toHaveBeenNthCalledWith(2, { filterByTk: ['server', 'other'] });
    expect(update).toHaveBeenCalledWith({
      filterByTk: 'server',
      values: { enabled: false },
    });
  });

  it('rebuilds the MCP client', async () => {
    const rebuildClient = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ rebuildClient }),
    };

    await rebuildMCPClient(apiClient);

    expect(rebuildClient).toHaveBeenCalledWith(undefined);
  });

  it('lists MCP tools by server and updates permission', async () => {
    const listTools = vi.fn().mockResolvedValue({
      data: {
        data: {
          server: [{ name: 'tool', title: 'Tool', serverName: 'server', permission: 'ASK' }],
          other: [{ name: 'other', title: 'Other', serverName: 'other', permission: 'ASK' }],
        },
      },
    });
    const updateToolPermission = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ listTools, updateToolPermission }),
    };

    await expect(listMCPTools(apiClient, 'server')).resolves.toEqual([
      { name: 'tool', title: 'Tool', serverName: 'server', permission: 'ASK' },
    ]);
    expect(
      getMCPToolsByServer(
        {
          server: [{ name: 'tool', title: 'Tool', serverName: 'server', permission: 'ASK' }],
        },
        'missing',
      ),
    ).toEqual([]);
    await updateMCPToolPermission(apiClient, 'tool', 'ALLOW');

    expect(updateToolPermission).toHaveBeenCalledWith({
      values: {
        toolName: 'tool',
        permission: 'ALLOW',
      },
    });
  });
});
