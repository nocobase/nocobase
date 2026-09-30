import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createMigrator } from '@nocobase/db';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { createAIEmployeeRoutes } from '../../server/route/index.js';
import { aiEmployeeApiRoutes } from '../../server/route/plugin.js';
import { AI_SETTINGS_ACTIONS } from '../../server/route/settings-access.js';
import { createTestAIEmployeeFixture } from './test-context.js';

/**
 * Every action a signed-in user reaches without AI settings access: the chat,
 * its files, and the non-secret model catalog the chat and other plugins read.
 * An action missing from here and from the gated lists is a route nobody
 * decided about, and the classification test below fails on it.
 */
const SIGNED_IN_ACTIONS = [
  'ai:listAllEnabledModels',
  'ai:listLLMProviders',
  'ai:listLLMServices',
  'ai:listModels',
  'ai:testFlight',
  'aiConversations:abort',
  'aiConversations:create',
  'aiConversations:destroy',
  'aiConversations:get',
  'aiConversations:getMessages',
  'aiConversations:list',
  'aiConversations:resendMessages',
  'aiConversations:resumeStream',
  'aiConversations:resumeToolCall',
  'aiConversations:sendMessages',
  'aiConversations:unreadCount',
  'aiConversations:unreadCounts',
  'aiConversations:update',
  'aiConversations:updateOptions',
  'aiConversations:updateToolArgs',
  'aiConversations:updateUserDecision',
  'aiEmployees:listByUser',
  'aiEmployees:updateUserPrompt',
  'aiFiles:create',
  'aiFiles:preview',
];

/** Management reads with a guard of their own, checking the same page access. */
const SELF_GUARDED_ACTIONS = [
  'aiConversations:listAll',
  'aiConversations:listUsers',
  'aiConversations:getAllMessages',
  'aiSkills:listAll',
  'aiSkills:getDetails',
  'aiTools:listAll',
  'aiTools:getDetails',
  'aiUsage:summary',
  'aiUsage:series',
  'aiUsage:breakdown',
  'aiUsage:filterOptions',
];

const READS = new Set([
  'list',
  'get',
  'getTemplates',
  'listTools',
  'listByUser',
]);

function methodOf(action: string): string {
  const name = action.split(':')[1] ?? '';
  if (READS.has(name)) return 'GET';
  if (name === 'update') return 'PUT';
  if (name === 'destroy') return 'DELETE';
  return 'POST';
}

describe('AI settings access', () => {
  const { deps, services, container } = createTestAIEmployeeFixture();
  let sessionUser: { id: string } | null = null;
  let app: Hono;

  beforeAll(async () => {
    await deps.database.connect();
    await deps.database.builder().createCollection('user', (collection) => {
      collection.string('id').notNull();
      collection.string('username').nullable();
      collection.primary('id');
    });
    await createMigrator({
      database: deps.database,
      packageName: '@nocobase/app-plugin-authorization',
      directory: join(
        dirname(
          createRequire(import.meta.url).resolve(
            '@nocobase/app-plugin-authorization/package.json',
          ),
        ),
        'database/migrations',
      ),
    }).latest();
    await deps.authorization.permissionSets.create({
      key: 'ai-settings',
      grants: [
        {
          resource: { type: 'page', id: 'ai.settings' },
          actions: [{ action: 'access' }],
        },
      ],
    });
    await deps.authorization.permissionSets.assign({
      permissionSet: 'ai-settings',
      subject: { type: 'user', id: 'settings-admin' },
    });
    vi.spyOn(deps.auth, 'getSession').mockImplementation(async () =>
      sessionUser ? ({ user: { ...sessionUser }, session: {} } as never) : null,
    );
    vi.spyOn(services, 'ready').mockResolvedValue(undefined);
    container.instance(authenticationToken, deps.auth);
    container.instance(authorizationToken, deps.authorization);
    const routes = await aiEmployeeApiRoutes.createRouter({
      appName: 'main',
      publicBasePath: '/main',
      config: { app: { name: 'main', publicBasePath: '/main' } },
      paths: deps.paths,
      router: new Hono(),
      container,
    });
    app = new Hono();
    app.route('/api', routes);
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await deps.database.destroy();
  });

  function request(action: string): Promise<Response> {
    const method = methodOf(action);
    return app.request(`/api/ai/${action}?key=anything`, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(method === 'GET'
        ? {}
        : {
            body: JSON.stringify({
              name: 'anything',
              enabled: false,
              toolName: 'anything',
              permission: 'ALLOW',
              transport: 'http',
              url: 'http://127.0.0.1:1/',
            }),
          }),
    });
  }

  it('refuses a signed-in user without the settings page before any service runs', async () => {
    sessionUser = { id: 'member' };
    const reached = [
      vi.spyOn(services.llmService, 'updateEnabled'),
      vi.spyOn(services.llmService, 'updateEnabledModels'),
      vi.spyOn(services.mcpServerService, 'testConnection'),
      vi.spyOn(services.mcpServerService, 'updateEnabled'),
      vi.spyOn(services.mcpServerService, 'updateToolPermission'),
      vi.spyOn(services.employeeService, 'upsert'),
      vi.spyOn(services.employeeService, 'delete'),
      vi.spyOn(services.toolService, 'upsert'),
      vi.spyOn(services.skillService, 'upsert'),
      vi.spyOn(services.modelService, 'listProviderModels'),
    ];

    for (const action of AI_SETTINGS_ACTIONS) {
      expect((await request(action)).status, action).toBe(403);
    }
    for (const spy of reached) expect(spy).not.toHaveBeenCalled();
  });

  it('lets a user with the settings page through', async () => {
    sessionUser = { id: 'settings-admin' };
    const updateEnabled = vi
      .spyOn(services.llmService, 'updateEnabled')
      .mockResolvedValue({} as never);
    const updateToolPermission = vi
      .spyOn(services.mcpServerService, 'updateToolPermission')
      .mockResolvedValue(undefined);

    expect((await request('llmServices:updateEnabled')).status).toBe(200);
    expect((await request('aiMcpServers:updateToolPermission')).status).toBe(
      200,
    );
    expect(updateEnabled).toHaveBeenCalledOnce();
    expect(updateToolPermission).toHaveBeenCalledOnce();
    for (const action of AI_SETTINGS_ACTIONS) {
      expect((await request(action)).status, action).not.toBe(403);
    }
  });

  it('classifies every registered action exactly once', () => {
    const { deps, services: routeServices } = createTestAIEmployeeFixture();
    const registered = new Set(
      createAIEmployeeRoutes({
        authentication: deps.auth,
        authorization: deps.authorization,
        services: routeServices,
        logger: deps.logging.getLogger('ai-employee-test'),
      })
        .routes.filter((route) => route.method !== 'ALL')
        .map((route) => route.path.replace(/^\//, '')),
    );
    const classified = [
      ...AI_SETTINGS_ACTIONS,
      ...SELF_GUARDED_ACTIONS,
      ...SIGNED_IN_ACTIONS,
    ];

    expect(new Set(classified).size, 'an action is in two lists').toBe(
      classified.length,
    );
    expect(
      [...registered].filter((action) => !classified.includes(action)),
      'registered but not classified',
    ).toEqual([]);
    expect(
      classified.filter((action) => !registered.has(action)),
      'classified but not registered',
    ).toEqual([]);
  });

  it('leaves the chat open to every signed-in user', async () => {
    sessionUser = { id: 'member' };
    vi.spyOn(services.employeeService, 'listByUser').mockResolvedValue(
      [] as never,
    );

    expect((await request('aiEmployees:listByUser')).status).toBe(200);
  });
});
