/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AIManager } from '../ai-manager';
import { MCPLoader } from '../loader';
import { MCPManager } from '../mcp-manager';

describe('MCP loader test cases', () => {
  const fixturePath = path.resolve(__dirname, 'resource', 'ai', 'mcp', 'servers.json');
  let app: MockServer;
  let aiManager: AIManager;
  let mcpManager: MCPManager;
  let tempDirectory: string;
  let serversPath: string;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
    });
    await app.pm.enable('ai');
    aiManager = app.aiManager;
    mcpManager = aiManager.mcpManager;
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'nocobase-mcp-loader-'));
    serversPath = path.join(tempDirectory, 'servers.json');
  });

  afterEach(async () => {
    await app.destroy();
    await rm(tempDirectory, { recursive: true, force: true });
  });

  const load = async (filePath = serversPath) => {
    const loader = new MCPLoader(aiManager, {
      serversPath: filePath,
      log: app.log,
    });
    await loader.load();
  };

  it('loads JSON definitions, overwrites connection settings, and preserves enabled state', async () => {
    await app.db.getRepository('aiMcpClients').create({
      values: {
        name: 'weather',
        enabled: false,
        transport: 'sse',
        url: 'http://old.example.com/mcp',
        fromFile: false,
      },
    });
    await cp(fixturePath, serversPath);

    await load();

    const entry = await mcpManager.getMCP('weather');
    expect(entry).toMatchObject({
      name: 'weather',
      enabled: false,
      fromFile: true,
      transport: 'http',
      url: 'http://localhost:8123/mcp',
      headers: { Authorization: 'Bearer test-token' },
      env: { MCP_ENV: 'test' },
      args: ['--foo'],
      restart: { enabled: true },
    });

    await load();
    const weatherRecords = await app.db.getRepository('aiMcpClients').find({ filter: { name: 'weather' } });
    expect(weatherRecords).toHaveLength(1);
    expect(weatherRecords[0].get('enabled')).toBe(false);
    expect(weatherRecords[0].get('fromFile')).toBe(true);
  });

  it('defaults newly created file-managed records to enabled', async () => {
    await cp(fixturePath, serversPath);

    await load();

    expect(await mcpManager.getMCP('weather')).toMatchObject({ enabled: true, fromFile: true });
  });

  it('ignores a missing file', async () => {
    await load(path.join(tempDirectory, 'missing.json'));

    expect(await mcpManager.listMCP({})).toEqual([]);
  });

  it.each([
    ['malformed JSON', '{'],
    ['non-array root', '{"name":"weather"}'],
    ['non-object entry', '[null]'],
    ['missing name', '[{"transport":"http"}]'],
    ['empty name', '[{"name":" ","transport":"http"}]'],
    ['missing transport', '[{"name":"weather"}]'],
    ['unsupported transport', '[{"name":"weather","transport":"websocket"}]'],
    ['duplicate names', '[{"name":"weather","transport":"http"},{"name":"weather","transport":"sse"}]'],
    ['reserved enabled field', '[{"name":"weather","transport":"http","enabled":false}]'],
    ['reserved fromFile field', '[{"name":"weather","transport":"http","fromFile":false}]'],
  ])('ignores the complete file when it has %s', async (_caseName, content) => {
    await writeFile(serversPath, content);

    await load();

    expect(await mcpManager.listMCP({})).toEqual([]);
  });

  it('does not partially register entries when one entry is invalid', async () => {
    await writeFile(
      serversPath,
      JSON.stringify([{ name: 'valid', transport: 'http', url: 'https://example.com/mcp' }, { name: 'invalid' }]),
    );

    await load();

    expect(await mcpManager.getMCP('valid')).toBeUndefined();
  });

  it('passes supported connection settings through normalization and persistence', async () => {
    await writeFile(
      serversPath,
      JSON.stringify([
        {
          name: 'stdio-service',
          transport: 'stdio',
          command: 'npx',
          args: ['-y', 123],
          env: { TOKEN: 123 },
          restart: { enabled: true },
          useUserContext: true,
        },
        {
          name: 'remote-service',
          transport: 'sse',
          url: 'https://example.com/mcp',
          headers: { Authorization: 123 },
          useUserContext: true,
        },
      ]),
    );

    await load();

    expect(await mcpManager.getMCP('stdio-service')).toMatchObject({
      command: 'npx',
      args: ['-y', '123'],
      env: { TOKEN: '123' },
      restart: { enabled: true },
      useUserContext: false,
      fromFile: true,
    });
    expect(await mcpManager.getMCP('remote-service')).toMatchObject({
      transport: 'sse',
      url: 'https://example.com/mcp',
      headers: { Authorization: '123' },
      useUserContext: true,
      fromFile: true,
    });
  });

  it('should expose cached mcp tools and allow updating permissions', async () => {
    const manager = mcpManager as unknown as {
      toolsMap: Record<string, Array<{ name: string; description: string }>>;
    };
    manager.toolsMap = {
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
    };

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
