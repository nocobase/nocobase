import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createMigrator } from '@nocobase/db';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  createAIEmployeeRoutes,
  listAIRouteAccess,
} from '../../server/route/index.js';
import { aiEmployeeApiRoutes } from '../../server/route/plugin.js';
import { AI_ROUTES, concretePath } from './route-table.js';
import { createTestAIEmployeeFixture } from './test-context.js';

const SETTINGS_ROUTES = AI_ROUTES.filter(
  ([, , access]) => access === 'settings',
);

describe('AI settings access', async () => {
  const { deps, services, container } = await createTestAIEmployeeFixture();
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

  function request(
    method: string,
    path: string,
    body: unknown = { transport: 'http', url: 'http://127.0.0.1:1/' },
  ): Promise<Response> {
    return app.request(`/api${concretePath(path)}`, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(method === 'GET' || method === 'DELETE'
        ? {}
        : { body: JSON.stringify(body) }),
    });
  }

  it('refuses a signed-in user without the settings page before any service runs', async () => {
    sessionUser = { id: 'member' };
    const reached = [
      vi.spyOn(services.llmService, 'setEnabled'),
      vi.spyOn(services.llmService, 'updateEnabledModels'),
      vi.spyOn(services.mcpServerService, 'testConnection'),
      vi.spyOn(services.mcpServerService, 'testCandidate'),
      vi.spyOn(services.mcpServerService, 'setEnabled'),
      vi.spyOn(services.mcpServerService, 'updateToolPermission'),
      vi.spyOn(services.employeeService, 'create'),
      vi.spyOn(services.employeeService, 'update'),
      vi.spyOn(services.employeeService, 'delete'),
      vi.spyOn(services.toolService, 'create'),
      vi.spyOn(services.toolService, 'update'),
      vi.spyOn(services.skillService, 'create'),
      vi.spyOn(services.skillService, 'update'),
      vi.spyOn(services.modelService, 'listProviderModels'),
      vi.spyOn(services.conversationService, 'listAll'),
      vi.spyOn(services.usageStatisticsService, 'summary'),
    ];

    for (const [method, path] of SETTINGS_ROUTES) {
      const response = await request(method, path);
      expect(response.status, `${method} ${path}`).toBe(403);
      expect((await response.json()).error).toMatchObject({
        status: 'PERMISSION_DENIED',
        reason: 'AI_SETTINGS_ACCESS_REQUIRED',
        domain: 'aiEmployees',
      });
    }
    for (const spy of reached) expect(spy).not.toHaveBeenCalled();
  });

  it('lets a user with the settings page through', async () => {
    sessionUser = { id: 'settings-admin' };
    const setEnabled = vi
      .spyOn(services.llmService, 'setEnabled')
      .mockResolvedValue({} as never);
    const updateToolPermission = vi
      .spyOn(services.mcpServerService, 'updateToolPermission')
      .mockResolvedValue({} as never);

    expect(
      (await request('POST', '/aiEmployee/llmServices/:name/disable')).status,
    ).toBe(200);
    expect(
      (
        await request('PATCH', '/aiEmployee/mcpServers/:name/tools/:toolName', {
          permission: 'ALLOW',
        })
      ).status,
    ).toBe(200);
    expect(setEnabled).toHaveBeenCalledWith({
      name: 'any-name',
      enabled: false,
    });
    expect(updateToolPermission).toHaveBeenCalledWith({
      serverName: 'any-name',
      toolName: 'any-toolName',
      permission: 'ALLOW',
    });
    for (const [method, path] of SETTINGS_ROUTES) {
      expect(
        (await request(method, path)).status,
        `${method} ${path}`,
      ).not.toBe(403);
    }
  });

  it('reads who may call each route off the guard it names first, matching the route table', async () => {
    const { deps, services: routeServices } =
      await createTestAIEmployeeFixture();
    const router = createAIEmployeeRoutes({
      authentication: deps.auth,
      authorization: deps.authorization,
      services: routeServices,
      logger: deps.logging.getLogger('ai-employee-test'),
    });

    expect(listAIRouteAccess(router)).toEqual(
      Object.fromEntries(
        AI_ROUTES.map(([method, path, access]) => [
          `${method} ${path}`,
          access,
        ]),
      ),
    );
  });

  it('leaves the chat open to every signed-in user', async () => {
    sessionUser = { id: 'member' };
    vi.spyOn(services.employeeService, 'listByUser').mockResolvedValue(
      [] as never,
    );

    expect((await request('GET', '/aiEmployees/roster')).status).toBe(200);
  });
});
