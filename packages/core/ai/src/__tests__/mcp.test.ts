/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AIManager } from '../ai-manager';
import { MCPLoader } from '../loader';
import { DefaultMCPManager, MCPManager } from '../mcp-manager';
vi.mock('@langchain/mcp-adapters', () => ({
  MultiServerMCPClient: class {
    async initializeConnections() {
      return {};
    }
    async close() {}
  },
}));

describe('MCP loader test cases', () => {
  let storage: string;
  let filePath: string;
  let app: MockServer;
  let aiManager: AIManager;
  let mcpManager: MCPManager;
  let loader: MCPLoader;

  beforeEach(async () => {
    storage = await mkdtemp(join(tmpdir(), 'mcp-persistence-'));
    vi.stubEnv('STORAGE_PATH', storage);
    // SQLite fixtures must not inherit a PostgreSQL schema from the CI matrix.
    vi.stubEnv('DB_SCHEMA', 'public');
    filePath = join(storage, 'ai', 'mcp', 'servers.json');
    await mkdir(join(storage, 'ai', 'mcp'), { recursive: true });
    app = await createMockServer({
      plugins: ['nocobase'],
      database: { dialect: 'sqlite', storage: join(storage, 'test.sqlite') },
    });
    await app.pm.enable('ai');
    aiManager = app.aiManager;
    mcpManager = aiManager.mcpManager;
    loader = new MCPLoader(mcpManager);
  });

  afterEach(async () => {
    await app.destroy();
    vi.unstubAllEnvs();
    await rm(storage, { recursive: true, force: true });
  });

  it('loads JSON deployment definitions into the database', async () => {
    await writeFile(
      filePath,
      JSON.stringify([
        {
          name: 'weather',
          transport: 'http',
          url: 'http://localhost:8123/mcp',
          headers: { Authorization: 'Bearer test-token' },
          env: { MCP_ENV: 'test' },
          args: ['--foo'],
          restart: { enabled: true },
        },
      ]),
    );
    await loader.load();

    const entry = await mcpManager.getMCP('weather');
    expect(entry).toBeDefined();
    expect(entry.name).toBe('weather');
    expect(entry.enabled).toBe(true);
    expect(entry.fromFile).toBe(true);
    expect(entry.transport).toBe('http');
    expect(entry.url).toBe('http://localhost:8123/mcp');
    expect(entry.headers).toEqual({
      Authorization: 'Bearer test-token',
    });
    expect(entry.env).toEqual({
      MCP_ENV: 'test',
    });
    expect(entry.args).toEqual(['--foo']);
    expect(entry.restart).toEqual({
      enabled: true,
    });

    const enabledEntries = await mcpManager.listMCP({ enabled: true, transport: 'http', name: 'weath' });
    expect(enabledEntries.map((item) => item.name)).toEqual(['weather']);
  });

  it('preserves disabled state and management through updates, repeated loads and removed entries', async () => {
    const definitions = [
      { name: 'local', transport: 'stdio', command: 'node', useUserContext: true },
      { name: 'remote', transport: 'http', url: 'http://127.0.0.1/old', useUserContext: true },
    ];
    await writeFile(filePath, JSON.stringify(definitions));
    await loader.load();
    expect(await mcpManager.getMCP('local')).toMatchObject({ enabled: true, fromFile: true, useUserContext: false });
    const repo = app.db.getRepository('aiMcpClients');
    await repo.update({ filterByTk: 'remote', values: { enabled: false } });
    definitions[1].url = 'http://127.0.0.1/new';
    await writeFile(filePath, JSON.stringify(definitions));
    await loader.load();
    await loader.load();
    expect(await repo.count()).toBe(2);
    expect(await mcpManager.getMCP('remote')).toMatchObject({
      enabled: false,
      fromFile: true,
      url: definitions[1].url,
      useUserContext: true,
    });
    await writeFile(filePath, '[]');
    await loader.load();
    await rm(filePath);
    await loader.load();
    await mcpManager.registerMCP({ remote: { transport: 'http', url: 'http://127.0.0.1/trusted', fromFile: false } });
    expect(await mcpManager.getMCP('remote')).toMatchObject({ enabled: false, fromFile: true });
    expect(await repo.count()).toBe(2);
  });
  it('validates before memory registration and persists before initializing connections', async () => {
    const manager = new DefaultMCPManager(app);
    const memoryLoader = new MCPLoader(manager);
    await manager.registerMCP({ local: { transport: 'stdio', command: 'old' } });
    await writeFile(filePath, JSON.stringify([{ name: 'local', transport: 'stdio', command: 'node' }]));
    await memoryLoader.load();
    await memoryLoader.load();
    await manager.registerMCP({ local: { transport: 'stdio', command: 'trusted', fromFile: false } });
    expect(await app.db.getRepository('aiMcpClients').count()).toBe(0);
    const rebuild = vi.spyOn(manager, 'rebuildClient').mockImplementation(async () => {
      expect(await manager.getMCP('local')).toMatchObject({ command: 'trusted', fromFile: true, enabled: true });
    });
    await manager.init();
    expect(rebuild).toHaveBeenCalledTimes(1);
    expect(await app.db.getRepository('aiMcpClients').count()).toBe(1);
  });

  it('loads deployment configuration through the actual afterStart lifecycle', async () => {
    await writeFile(
      filePath,
      JSON.stringify([{ name: 'startup', transport: 'http', url: 'http://127.0.0.1/startup' }]),
    );
    await app.stop();
    await app.start();
    expect(await app.aiManager.mcpManager.getMCP('startup')).toMatchObject({ enabled: true, fromFile: true });
  });

  it('adds the source column on upgrade without changing existing enabled state', async () => {
    const collection = app.db.getCollection('aiMcpClients');
    await app.db.getRepository('aiMcpClients').create({
      values: {
        name: 'legacy',
        transport: 'stdio',
        command: 'node',
        enabled: false,
      },
    });
    await app.db.sequelize.getQueryInterface().removeColumn(collection.model.getTableName(), 'fromFile');
    await app.upgrade();
    expect(await app.aiManager.mcpManager.getMCP('legacy')).toMatchObject({ enabled: false, fromFile: false });
    await app.db.getRepository('aiMcpClients').create({ values: { name: 'after-upgrade', transport: 'http' } });
    expect(await app.aiManager.mcpManager.getMCP('after-upgrade')).toMatchObject({ fromFile: false });
  });

  it('should expose cached mcp tools and allow updating permissions', async () => {
    await app.db.getRepository('aiMcpClients').create({ values: { name: 'weather', transport: 'http' } });
    Reflect.set(mcpManager, 'toolsMap', {
      weather: [
        {
          name: 'getForecast',
          description: 'Get weather forecast',
        },
        {
          name: 'setDefaultCity',
          description: 'Set default city',
        },
      ],
    });

    const tools = await mcpManager.listMCPTools();
    expect(tools.weather).toEqual([
      {
        name: 'mcp-weather-getForecast',
        title: 'getForecast',
        description: 'Get weather forecast',
        serverName: 'weather',
        permission: 'ALLOW',
      },
      {
        name: 'mcp-weather-setDefaultCity',
        title: 'setDefaultCity',
        description: 'Set default city',
        serverName: 'weather',
        permission: 'ASK',
      },
    ]);

    await mcpManager.updateMCPToolPermission('mcp-weather-getForecast', 'ALLOW');

    const updatedTools = await mcpManager.listMCPTools();
    expect(updatedTools.weather[0].permission).toBe('ALLOW');
    expect(updatedTools.weather[1].permission).toBe('ASK');
  });
});
