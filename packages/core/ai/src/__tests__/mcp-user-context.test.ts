/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const mcpClientMock = vi.hoisted(() => {
  const instances: any[] = [];

  class MultiServerMCPClient {
    connections: Record<string, any>;
    close = vi.fn();

    constructor(connections: Record<string, any>) {
      this.connections = connections;
      instances.push(this);
    }

    async initializeConnections() {
      return Object.fromEntries(
        Object.keys(this.connections).map((serverName) => [
          serverName,
          [
            {
              name: 'getProfile',
              description: `Get profile from ${serverName}`,
              schema: {},
              invoke: vi.fn(async (args) => ({ serverName, args })),
            },
          ],
        ]),
      );
    }
  }

  return {
    instances,
    MultiServerMCPClient,
  };
});

vi.mock('@langchain/mcp-adapters', () => ({
  MultiServerMCPClient: mcpClientMock.MultiServerMCPClient,
}));

import { DefaultMCPManager } from '../mcp-manager';
import { normalizeMCPOptions, renderMCPOptions } from '../mcp-manager/options-renderer';
import { UserContextMCPClientManager } from '../mcp-manager/user-context-client-manager';

describe('user-bound MCP clients', () => {
  const createApp = () => ({
    environment: {
      getVariables: () => ({
        MCP_HOST: 'mcp.example.test',
        API_TOKEN: 'env-token',
      }),
    },
    log: {
      warn: vi.fn(),
    },
  });

  const createCtx = (id: number, extraUser: Record<string, unknown> = {}) =>
    ({
      state: {
        currentUser: {
          id,
          name: `user-${id}`,
          ...extraUser,
        },
      },
      auth: {
        user: {
          id,
          name: `user-${id}`,
          ...extraUser,
        },
      },
      db: {
        getRepository: () => ({
          findOne: vi.fn(),
        }),
      },
    }) as any;

  beforeEach(() => {
    mcpClientMock.instances.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('normalizes stdio records as not user-bound', () => {
    expect(
      normalizeMCPOptions({
        transport: 'stdio',
        command: 'node',
        args: ['server.js'],
        env: { TOKEN: '{{ $env.API_TOKEN }}' },
        useUserContext: true,
      }),
    ).toMatchObject({
      transport: 'stdio',
      command: 'node',
      args: ['server.js'],
      env: { TOKEN: '{{ $env.API_TOKEN }}' },
      useUserContext: false,
      headers: {},
    });
  });

  it('renders environment and current user variables in MCP options', async () => {
    const rendered = await renderMCPOptions(
      {
        transport: 'http',
        url: 'https://{{ $env.MCP_HOST }}/users/{{ currentUser.id }}',
        headers: {
          Authorization: 'Bearer {{ $env.API_TOKEN }}',
          'X-User': '{{ $user.name }}',
        },
        useUserContext: true,
      },
      createApp(),
      createCtx(7),
    );

    expect(rendered).toMatchObject({
      transport: 'http',
      url: 'https://mcp.example.test/users/7',
      headers: {
        Authorization: 'Bearer env-token',
        'X-User': 'user-7',
      },
      useUserContext: true,
    });
  });

  it('excludes user-bound records when rebuilding the shared client', async () => {
    const manager = new DefaultMCPManager(createApp() as any) as any;
    manager.listMCP = vi.fn().mockResolvedValue([]);

    await manager.rebuildClient();

    expect(manager.listMCP).toHaveBeenCalledWith({ enabled: true, useUserContext: false });
    expect(mcpClientMock.instances).toHaveLength(0);
  });

  it('registers user-bound tools from filter ctx', async () => {
    const manager = new DefaultMCPManager(createApp() as any) as any;
    manager.listMCP = vi.fn().mockResolvedValue([
      {
        name: 'profile',
        enabled: true,
        transport: 'http',
        url: 'https://{{ $env.MCP_HOST }}/{{ currentUser.id }}',
        headers: {},
        useUserContext: true,
      },
    ]);
    const registered: any[] = [];

    await manager.getMCPToolsProvider()(
      {
        registerTools: (tool) => registered.push(tool),
        registerDynamicTools: vi.fn(),
      },
      { ctx: createCtx(9) },
    );

    expect(registered).toHaveLength(1);
    expect(registered[0].definition.name).toBe('mcp-profile-getProfile');
    expect(mcpClientMock.instances[0].connections.profile.url).toBe('https://mcp.example.test/9');
  });

  it('lists user-bound tools from ctx', async () => {
    const manager = new DefaultMCPManager(createApp() as any) as any;
    manager.listMCP = vi.fn().mockResolvedValue([
      {
        name: 'profile',
        enabled: true,
        transport: 'http',
        url: 'https://{{ $env.MCP_HOST }}/{{ currentUser.id }}',
        headers: {},
        useUserContext: true,
      },
    ]);

    const tools = await manager.listMCPTools(createCtx(11));

    expect(tools.profile).toEqual([
      {
        name: 'mcp-profile-getProfile',
        title: 'getProfile',
        description: 'Get profile from profile',
        serverName: 'profile',
        permission: 'ALLOW',
      },
    ]);
    expect(mcpClientMock.instances[0].connections.profile.url).toBe('https://mcp.example.test/11');
  });

  it('reuses cached user-bound tools and refreshes them after TTL', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);

    const manager = new UserContextMCPClientManager({
      app: createApp(),
      ttlMs: 10,
      maxSize: 10,
      listEntries: async () => [
        {
          name: 'profile',
          enabled: true,
          transport: 'http',
          url: 'https://{{ $env.MCP_HOST }}/{{ currentUser.id }}',
          headers: {},
          useUserContext: true,
        },
      ],
      buildConnection: (options) => options as any,
    });

    await manager.getToolsMap(createCtx(1));
    await manager.getToolsMap(createCtx(1));
    expect(mcpClientMock.instances).toHaveLength(1);

    vi.setSystemTime(11);
    await manager.getToolsMap(createCtx(1));

    expect(mcpClientMock.instances).toHaveLength(2);
    expect(mcpClientMock.instances[0].close).toHaveBeenCalledTimes(1);
  });

  it('evicts the oldest user-bound cache entry when max size is exceeded', async () => {
    const manager = new UserContextMCPClientManager({
      app: createApp(),
      ttlMs: 1000,
      maxSize: 1,
      listEntries: async () => [
        {
          name: 'profile',
          enabled: true,
          transport: 'http',
          url: 'https://{{ $env.MCP_HOST }}/{{ currentUser.id }}',
          headers: {},
          useUserContext: true,
        },
      ],
      buildConnection: (options) => options as any,
    });

    await manager.getToolsMap(createCtx(1));
    await manager.getToolsMap(createCtx(2));

    expect(mcpClientMock.instances).toHaveLength(2);
    expect(mcpClientMock.instances[0].close).toHaveBeenCalledTimes(1);

    await manager.clear();
    expect(mcpClientMock.instances[1].close).toHaveBeenCalledTimes(1);
  });
});
