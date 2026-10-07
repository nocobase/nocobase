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
import {
  AI_SETTINGS,
  AI_SETTINGS_ACTIONS,
  type AISettingsKey,
} from '../../shared/authorization.js';
import { AI_ROUTES, concretePath } from './route-table.js';
import { createTestAIEmployeeFixture } from './test-context.js';

const SETTINGS_ROUTES = AI_ROUTES.flatMap(([method, path, access]) =>
  access === 'signedIn' ? [] : [[method, path, access] as const],
);

/** Every action of every AI settings item, as the route table names it: `ai.llmServices:manage`. */
const PERMISSIONS = (Object.keys(AI_SETTINGS) as AISettingsKey[]).flatMap(
  (key) =>
    AI_SETTINGS_ACTIONS[key].map((action) => ({
      name: `${AI_SETTINGS[key]}:${action}`,
      id: AI_SETTINGS[key],
      action,
    })),
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
    // One Permission Set, and one user, per AI settings permission; the administrator holds them all.
    for (const permission of PERMISSIONS) {
      await deps.authorization.permissionSets.create({
        key: permission.name,
        grants: [
          {
            resource: { type: 'settings', id: permission.id },
            actions: [{ action: permission.action }],
          },
        ],
      });
      for (const user of [permission.name, 'settings-admin'])
        await deps.authorization.permissionSets.assign({
          permissionSet: permission.name,
          subject: { type: 'user', id: user },
        });
    }
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

  it('refuses a signed-in user without any AI settings permission before any service runs', async () => {
    sessionUser = { id: 'member' };
    const reached = [
      vi.spyOn(services.llmService, 'setEnabled'),
      vi.spyOn(services.llmService, 'updateEnabledModels'),
      vi.spyOn(services.mcpServerService, 'setEnabled'),
      vi.spyOn(services.mcpServerService, 'updateToolPermission'),
      vi.spyOn(services.employeeService, 'update'),
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

  it('lets a user with every AI settings permission through', async () => {
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

  it.each(PERMISSIONS)(
    'admits $name exactly to the routes that list it',
    async ({ name }) => {
      sessionUser = { id: name };
      for (const [method, path, access] of SETTINGS_ROUTES) {
        const response = await request(method, path);
        if (access.includes(name))
          expect(response.status, `${method} ${path}`).not.toBe(403);
        else {
          expect(response.status, `${method} ${path}`).toBe(403);
          expect((await response.json()).error.reason).toBe(
            'AI_SETTINGS_ACCESS_REQUIRED',
          );
        }
      }
    },
  );

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

  it('names only registered items and actions on every settings route', () => {
    const names = new Set(PERMISSIONS.map(({ name }) => name));
    for (const [method, path, access] of SETTINGS_ROUTES)
      for (const name of access)
        expect(names.has(name), `${method} ${path}: ${name}`).toBe(true);
  });

  it('leaves the chat open to every signed-in user', async () => {
    sessionUser = { id: 'member' };
    vi.spyOn(services.employeeService, 'listByUser').mockResolvedValue(
      [] as never,
    );

    expect((await request('GET', '/aiEmployees/roster')).status).toBe(200);
  });
});
