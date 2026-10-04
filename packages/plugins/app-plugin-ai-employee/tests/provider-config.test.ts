import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { cachingToken } from '@nocobase/app-server/caching';
import {
  type AppDriveConfig,
  driveManagerToken,
} from '@nocobase/app-server/drive';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import { createMigrator, databaseManagerToken } from '@nocobase/db';
import { createDriveManager } from '@nocobase/drive';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';

import { type AIEmployeeConfig } from '../server/config.js';
import {
  AIEmployeeProvider,
  aiManagerToken,
} from '../server/provider/ai-employee.js';
import { aiConversationsManagerToken } from '../server/manager/ai-conversations-manager.js';
import { managerFactoryToken } from '../server/factory/manager-factory.js';
import {
  RepositoryFactory,
  repositoryFactoryToken,
} from '../server/factory/repository-factory.js';
import { serviceFactoryToken } from '../server/factory/service-factory.js';
import { createTestAppDeps } from './app/test-app-deps.js';
import { aiEmployeeMigrations } from './support/migrations.js';

const providers: AIEmployeeProvider[] = [];
const databases: Awaited<ReturnType<typeof createTestAppDeps>>['database'][] =
  [];

afterEach(async () => {
  await Promise.all(providers.splice(0).map((provider) => provider.shutdown()));
  await Promise.all(
    databases.splice(0).map((database) => database.disconnect()),
  );
});

describe('AIEmployeeProvider application config', () => {
  it('registers private factories and the conversation manager lazily', async () => {
    const { provider, container } = await createProvider(() => ({ ai: {} }));
    provider.register();

    expect(container.has(repositoryFactoryToken)).toBe(true);
    expect(container.has(managerFactoryToken)).toBe(true);
    expect(container.has(serviceFactoryToken)).toBe(true);
    expect(container.has(aiConversationsManagerToken)).toBe(true);
    expect(container.resolveIfCreated(repositoryFactoryToken)).toBeUndefined();
    expect(container.resolveIfCreated(managerFactoryToken)).toBeUndefined();
    expect(container.resolveIfCreated(serviceFactoryToken)).toBeUndefined();
    expect(
      container.resolveIfCreated(aiConversationsManagerToken),
    ).toBeUndefined();

    await provider.shutdown();

    expect(container.resolveIfCreated(repositoryFactoryToken)).toBeUndefined();
    expect(container.resolveIfCreated(managerFactoryToken)).toBeUndefined();
    expect(container.resolveIfCreated(serviceFactoryToken)).toBeUndefined();
    expect(
      container.resolveIfCreated(aiConversationsManagerToken),
    ).toBeUndefined();
  });

  it('resolves the public conversation manager from the container', async () => {
    const { provider, container } = await createProvider(() => ({ ai: {} }));
    provider.register();

    const manager = container.resolve(aiConversationsManagerToken);

    expect(manager).toBe(
      container.resolve(managerFactoryToken).aiConversationsManager,
    );
  });

  it('migrates initial config into the database while preserving matching user state', async () => {
    const deps = await createTestAppDeps();
    databases.push(deps.database);
    await deps.database.connect();
    await createMigrator({
      database: deps.database,
      sources: aiEmployeeMigrations,
    }).latest();
    const repositories = new RepositoryFactory({
      connection: deps.database.connection(),
    });
    await repositories.llmServices.create({
      values: {
        name: 'openai',
        title: 'Database title',
        provider: 'old-provider',
        options: { apiKey: 'database' },
        enabledModels: {
          mode: 'custom',
          models: [{ label: 'User model', value: 'user-model' }],
        },
        modelOptions: {},
        enabled: true,
        sort: 99,
      },
    });
    await repositories.llmServices.create({
      values: {
        name: 'obsolete',
        title: 'Obsolete',
        provider: 'openai',
        options: {},
        enabledModels: { mode: 'provider', models: [] },
        modelOptions: {},
        enabled: true,
        sort: 0,
      },
    });
    const { provider, container } = await createProvider(
      () => ({
        ai: {
          llmServices: {
            openai: {
              title: 'Configured title',
              provider: 'openai',
              options: { apiKey: 'configured' },
              enabledModels: [
                { label: 'Configured model', value: 'configured-model' },
              ],
              enabled: false,
              sort: 10,
            },
          },
        },
      }),
      deps,
    );

    provider.register();
    await provider.boot();
    const manager = container.resolve(aiManagerToken).llmServiceManager;

    await expect(manager.getLLMService('openai')).resolves.toMatchObject({
      title: 'Configured title',
      provider: 'openai',
      options: { apiKey: 'configured' },
      enabled: true,
      enabledModels: {
        mode: 'custom',
        models: [{ label: 'User model', value: 'user-model' }],
      },
      sort: 10,
    });
    await expect(manager.getLLMService('obsolete')).resolves.toBeUndefined();
  });

  it('reapplies an overriding model list over the stored one on start, and keeps the enable switch', async () => {
    const deps = await createTestAppDeps();
    databases.push(deps.database);
    await deps.database.connect();
    await createMigrator({
      database: deps.database,
      sources: aiEmployeeMigrations,
    }).latest();
    await new RepositoryFactory({
      connection: deps.database.connection(),
    }).llmServices.create({
      values: {
        name: 'openai',
        title: 'OpenAI',
        provider: 'openai',
        options: {},
        enabledModels: {
          mode: 'custom',
          models: [{ label: 'User model', value: 'user-model' }],
        },
        modelOptions: {},
        enabled: false,
        sort: 0,
      },
    });
    const { provider, container } = await createProvider(
      () => ({
        ai: {
          llmServices: {
            openai: {
              provider: 'openai',
              enabledModels: [
                { label: 'Configured model', value: 'configured-model' },
              ],
              overrideEnabledModels: true,
            },
          },
        },
      }),
      deps,
    );

    provider.register();
    await provider.boot();

    await expect(
      container
        .resolve(aiManagerToken)
        .llmServiceManager.getLLMService('openai'),
    ).resolves.toMatchObject({
      enabled: false,
      enabledModels: {
        mode: 'custom',
        models: [{ label: 'Configured model', value: 'configured-model' }],
      },
    });
  });

  it('synchronizes initial and reloaded snapshots and unsubscribes on shutdown', async () => {
    let current: AIEmployeeConfig = {
      llmServices: {
        openai: {
          title: 'Initial OpenAI',
          provider: 'openai',
          options: { apiKey: 'initial' },
          enabledModels: [{ label: 'Initial model', value: 'initial-model' }],
          enabled: false,
        },
      },
    };
    const { provider, config, container } = await createProvider(() => ({
      ai: current,
    }));

    provider.register();
    await provider.boot();
    const manager = container.resolve(aiManagerToken).llmServiceManager;
    await expect(manager.getLLMService('openai')).resolves.toMatchObject({
      title: 'Initial OpenAI',
      enabled: false,
    });

    await manager.registerLLMService(
      {
        name: 'openai',
        provider: 'openai',
        enabled: true,
        enabledModels: ['user-model'],
      },
      { preserveUserState: false },
    );
    current = {
      llmServices: {
        openai: {
          title: 'Reloaded OpenAI',
          provider: 'openai',
          options: { apiKey: 'reloaded' },
          enabled: false,
          enabledModels: [
            { label: 'Configured model', value: 'configured-model' },
          ],
        },
        deepseek: { provider: 'deepseek' },
      },
    };

    await expect(config.reload()).resolves.toEqual({
      changedNamespaces: ['ai'],
    });
    await expect(manager.getLLMService('openai')).resolves.toMatchObject({
      title: 'Reloaded OpenAI',
      options: { apiKey: 'reloaded' },
      enabled: true,
      enabledModels: {
        mode: 'custom',
        models: [{ label: 'user-model', value: 'user-model' }],
      },
    });
    await expect(manager.getLLMService('deepseek')).resolves.toBeDefined();
    await expect(config.reload()).resolves.toEqual({ changedNamespaces: [] });

    await provider.shutdown();
    current = { llmServices: {} };
    await config.reload();
    await expect(manager.listLLMServices()).resolves.toHaveLength(2);
  });

  it('keeps an MCP server an administrator disabled disabled across a restart', async () => {
    const deps = await createTestAppDeps();
    databases.push(deps.database);
    await deps.database.connect();
    await createMigrator({
      database: deps.database,
      sources: aiEmployeeMigrations,
    }).latest();
    const config = () => ({
      ai: {
        mcpServers: {
          search: { transport: 'http', url: 'http://127.0.0.1:1/mcp' },
        },
      },
    });
    // The server is never reachable here, which must not stop the start.
    const first = await createProvider(config, deps);
    first.provider.register();
    await first.provider.boot();
    await first.container
      .resolve(aiManagerToken)
      .mcpServerManager.updateMCPEnabled('search', false);
    await first.provider.shutdown();

    const second = await createProvider(config, deps);
    second.provider.register();
    await second.provider.boot();

    await expect(
      second.container
        .resolve(aiManagerToken)
        .mcpServerManager.getMCP('search'),
    ).resolves.toMatchObject({ enabled: false });
  });

  it('keeps an MCP tool permission an administrator set across a restart', async () => {
    const mcp = await startMCPServer(['setDefaultCity']);
    const deps = await createTestAppDeps();
    databases.push(deps.database);
    await deps.database.connect();
    await createMigrator({
      database: deps.database,
      sources: aiEmployeeMigrations,
    }).latest();
    const config = () => ({
      ai: { mcpServers: { search: { transport: 'http', url: mcp.url } } },
    });
    const permissionOf = async (container: ServiceContainer) => {
      const tools = await container
        .resolve(aiManagerToken)
        .mcpServerManager.listMCPTools();
      return tools.search?.find(
        (tool) => tool.name === 'mcp-search-setDefaultCity',
      )?.permission;
    };

    try {
      const first = await createProvider(config, deps);
      first.provider.register();
      await first.provider.boot();
      expect(await permissionOf(first.container)).toBe('ASK');
      await first.container
        .resolve(serviceFactoryToken)
        .mcpServerService.updateToolPermission({
          serverName: 'search',
          toolName: 'mcp-search-setDefaultCity',
          permission: 'ALLOW',
        });
      await first.provider.shutdown();

      const second = await createProvider(config, deps);
      second.provider.register();
      await second.provider.boot();

      expect(await permissionOf(second.container)).toBe('ALLOW');
      await second.provider.shutdown();
    } finally {
      await mcp.close();
    }
  });

  it('uses new config state after a removed service is added again', async () => {
    let current: AIEmployeeConfig = {
      llmServices: {
        openai: {
          provider: 'openai',
          enabled: false,
          enabledModels: [{ label: 'First model', value: 'first-model' }],
        },
      },
    };
    const { provider, config, container } = await createProvider(() => ({
      ai: current,
    }));
    provider.register();
    await provider.boot();
    const manager = container.resolve(aiManagerToken).llmServiceManager;

    current = { llmServices: {} };
    await config.reload();
    await expect(manager.getLLMService('openai')).resolves.toBeUndefined();

    current = {
      llmServices: {
        openai: {
          provider: 'openai',
          enabled: true,
          enabledModels: [{ label: 'Second model', value: 'second-model' }],
        },
      },
    };
    await config.reload();

    await expect(manager.getLLMService('openai')).resolves.toMatchObject({
      enabled: true,
      enabledModels: {
        mode: 'custom',
        models: [{ label: 'Second model', value: 'second-model' }],
      },
    });
  });
});

/** A Streamable HTTP MCP server answering only what a client needs to list tools. */
async function startMCPServer(
  toolNames: readonly string[],
): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = createServer((request, response) => {
    if (request.method !== 'POST') {
      response.writeHead(405).end();
      return;
    }
    let body = '';
    request.on('data', (chunk: Buffer) => (body += chunk.toString()));
    request.on('end', () => {
      const message = JSON.parse(body) as {
        id?: number | string;
        method: string;
        params?: { protocolVersion?: string };
      };
      if (message.id === undefined) {
        response.writeHead(202).end();
        return;
      }
      const result =
        message.method === 'initialize'
          ? {
              protocolVersion: message.params?.protocolVersion,
              capabilities: { tools: {} },
              serverInfo: { name: 'test-mcp', version: '1.0.0' },
            }
          : message.method === 'tools/list'
            ? {
                tools: toolNames.map((name) => ({
                  name,
                  description: name,
                  inputSchema: { type: 'object', properties: {} },
                })),
              }
            : {};
      response
        .writeHead(200, { 'content-type': 'application/json' })
        .end(JSON.stringify({ jsonrpc: '2.0', id: message.id, result }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/mcp`,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}

async function createProvider(
  readConfig: () => Record<string, unknown>,
  existingDeps?: Awaited<ReturnType<typeof createTestAppDeps>>,
): Promise<{
  provider: AIEmployeeProvider;
  config: AppConfig;
  container: ServiceContainer;
}> {
  const deps = existingDeps ?? (await createTestAppDeps());
  if (!existingDeps) {
    databases.push(deps.database);
    await deps.database.connect();
    await createMigrator({
      database: deps.database,
      sources: aiEmployeeMigrations,
    }).latest();
  }

  const paths = createAppPaths({ rootDir: process.cwd() });
  const config = new AppConfig();
  config.load({
    name: 'test-ai-config',
    read: async () => ({ kind: 'map', value: readConfig() }),
  });
  await config.loadAll();
  config.mergeDefaults({
    ai: { llmServices: {} },
    drive: {
      default: 'local',
      disks: {
        local: {
          driver: 'fs',
          location: paths.storage(),
          visibility: 'private',
        },
      },
    },
  });

  const container = new ServiceContainer();
  container.instance(databaseManagerToken, deps.database);
  container.instance(authenticationToken, deps.auth);
  container.instance(cachingToken, deps.caching);
  container.instance(idGeneratorToken, deps.idGenerator);
  container.instance(loggingToken, deps.logging);
  container.instance(
    driveManagerToken,
    createDriveManager(config.get<AppDriveConfig>('drive')!),
  );
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config,
    paths,
    router: new Hono(),
    container,
  };
  const provider = new AIEmployeeProvider(app);
  providers.push(provider);
  return { provider, config, container };
}
