import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { ToolsEntity } from '@nocobase/ai-employee';
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createMigrator } from '@nocobase/db';
import { Hono } from 'hono';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { z } from 'zod';

import { aiEmployeeApiRoutes } from '../../server/route/plugin.js';
import type {
  ManagedToolSummary,
  ToolsManagementActor,
} from '../../server/types.js';
import { createTestAIEmployeeFixture } from './test-context.js';

const summaries: ManagedToolSummary[] = [
  {
    name: 'general-tool',
    title: 'General title',
    description: 'General description',
    about: '# General tool\n\nUsage instructions.',
    scope: 'GENERAL',
    source: 'loader',
  },
  {
    name: 'specified-tool',
    title: 'Specified title',
    description: 'Specified description',
    about: '',
    scope: 'SPECIFIED',
    source: 'mcp',
  },
  {
    name: 'custom-tool',
    title: 'custom-tool',
    description: 'Custom description',
    about: '',
    scope: 'CUSTOM',
    source: 'workflow',
  },
  {
    name: 'dynamic-tool',
    title: 'Dynamic title',
    description: 'Last dynamic registration',
    about: 'Dynamic usage',
    scope: 'CUSTOM',
    source: 'mcp',
  },
];

const plainSchema = {
  type: 'object',
  properties: { limit: { type: 'integer', minimum: 1 } },
  required: ['limit'],
};

describe('Tools management API', async () => {
  const { deps, services, container } = await createTestAIEmployeeFixture();
  const invoke = vi.fn(async () => ({
    status: 'success',
    content: 'Never execute',
  }));
  const tools: ToolsEntity[] = [
    {
      scope: 'GENERAL',
      definition: {
        name: 'general-tool',
        description: 'General description',
        schema: z.object({ query: z.string().describe('Search query') }),
      },
      introduction: {
        title: 'General title',
        about: '# General tool\n\nUsage instructions.',
      },
      invoke,
    },
    {
      scope: 'SPECIFIED',
      from: 'mcp',
      definition: {
        name: 'specified-tool',
        description: 'Specified description',
        schema: plainSchema,
      },
      introduction: { title: 'Specified title' },
      invoke,
    },
    {
      scope: 'CUSTOM',
      from: 'workflow',
      definition: { name: 'custom-tool', description: 'Custom description' },
      introduction: { title: '' },
      invoke,
    },
  ];
  let sessionUser: { id: string; [key: string]: unknown } | null;
  let dynamicEnabled = true;
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
    for (const [key, page, id, action] of [
      ['all-settings', '*', 'wildcard-reader', 'access'],
      ['ai-settings', 'ai.settings', 'exact-reader', 'access'],
      ['other-settings', 'users.settings', 'other-reader', 'access'],
      ['wrong-action', 'ai.settings', 'wrong-action-reader', 'read'],
    ]) {
      await deps.authorization.permissionSets.create({
        key,
        grants: [
          { resource: { type: 'page', id: page }, actions: [{ action }] },
        ],
      });
      await deps.authorization.permissionSets.assign({
        permissionSet: key,
        subject: { type: 'user', id },
      });
    }
    // Extra implementation fields must never enter management DTOs.
    const extra = {
      apiKey: 'private-api-key',
      options: { password: 'private-password' },
      implementation: invoke,
    };
    await deps.ai.toolsManager.registerTools(
      tools.map((tool) => ({ ...tool, ...extra })),
    );
    deps.ai.toolsManager.registerDynamicTools(async (registration) => {
      if (!dynamicEnabled) return;
      await registration.registerTools([
        {
          scope: 'GENERAL',
          from: 'workflow',
          definition: {
            name: 'general-tool',
            description: 'Must not override static registration',
          },
          invoke,
        },
        {
          scope: 'GENERAL',
          definition: {
            name: 'dynamic-tool',
            description: 'Earlier dynamic registration',
          },
          invoke,
        },
        {
          scope: 'CUSTOM',
          from: 'mcp',
          definition: {
            name: 'dynamic-tool',
            description: 'Last dynamic registration',
            schema: plainSchema,
          },
          introduction: { title: 'Dynamic title', about: 'Dynamic usage' },
          invoke,
        },
      ]);
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

  beforeEach(() => {
    sessionUser = { id: 'exact-reader' };
    vi.clearAllMocks();
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await deps.database.destroy();
  });

  function request(
    action: string,
    query = '',
    headers?: HeadersInit,
  ): Promise<Response> {
    return app.request(`/api/ai/aiTools:${action}${query ? `?${query}` : ''}`, {
      headers,
    });
  }

  it.each(['wildcard-reader', 'exact-reader'])(
    'allows id-only %s with all scopes and static-first deduplication',
    async (id) => {
      sessionUser = { id };
      const list = vi.spyOn(services.toolService, 'listAll');
      const detail = vi.spyOn(services.toolService, 'getDetails');
      const response = await request('listAll');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ rows: summaries });
      for (const summary of summaries) {
        const response = await request('getDetails', `name=${summary.name}`);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          ...summary,
          about:
            summary.name === 'general-tool'
              ? '# General tool\n\nUsage instructions.'
              : summary.name === 'dynamic-tool'
                ? 'Dynamic usage'
                : '',
          inputSchema:
            summary.name === 'general-tool'
              ? expect.objectContaining({
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                  },
                  required: ['query'],
                })
              : summary.name === 'custom-tool'
                ? null
                : plainSchema,
        });
      }
      expect(list.mock.calls[0][0].actor).toEqual({
        id,
        canReadAllTools: true,
      });
      expect(detail.mock.calls[0][0].actor).toEqual({
        id,
        canReadAllTools: true,
      });
      expect(invoke).not.toHaveBeenCalled();
      list.mockRestore();
      detail.mockRestore();
    },
  );

  it('rejects anonymous, ungranted, unrelated grants, wrong actions and spoofed root before initialization or registry reads', async () => {
    const list = vi.spyOn(deps.ai.toolsManager, 'listTools');
    const get = vi.spyOn(deps.ai.toolsManager, 'getTools');
    const listAll = vi.spyOn(services.toolService, 'listAll');
    const getDetails = vi.spyOn(services.toolService, 'getDetails');
    for (const user of [
      null,
      { id: 'ungranted' },
      { id: 'other-reader' },
      { id: 'wrong-action-reader' },
      { id: 'ungranted', roles: ['root'], isRoot: true, canReadAllTools: true },
    ]) {
      sessionUser = user;
      for (const action of ['listAll', 'getDetails']) {
        const response = await request(
          action,
          'name=general-tool&isRoot=true&canReadAllTools=true',
          {
            'x-user-id': 'wildcard-reader',
            'x-role': 'root',
            'x-is-root': 'true',
            'x-can-read-all-tools': 'true',
          },
        );
        expect(response.status).toBe(user ? 403 : 401);
      }
    }
    for (const spy of [list, get, listAll, getDetails]) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    }
    expect(services.ready).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('rechecks real permission assignments for every request', async () => {
    sessionUser = { id: 'temporary-reader' };
    const assignment = await deps.authorization.permissionSets.assign({
      permissionSet: 'ai-settings',
      subject: { type: 'user', id: sessionUser.id },
    });
    expect((await request('listAll')).status).toBe(200);
    expect((await request('getDetails', 'name=general-tool')).status).toBe(200);
    await deps.authorization.permissionSets.revoke(assignment.id);
    expect((await request('listAll')).status).toBe(403);
    expect((await request('getDetails', 'name=general-tool')).status).toBe(403);
  });

  it('requires a dedicated service capability before reading the registry', async () => {
    const list = vi.spyOn(deps.ai.toolsManager, 'listTools');
    const get = vi.spyOn(deps.ai.toolsManager, 'getTools');
    const actors: ToolsManagementActor[] = [
      { id: 'exact-reader' },
      { id: 'exact-reader', canReadAllTools: false },
      { id: 'anonymous', canReadAllTools: true },
      { id: '', canReadAllTools: true },
      { id: ' ', canReadAllTools: true },
    ];
    const root = { id: 'root', isRoot: true, roles: ['root'] };
    const skillReader = { id: 'exact-reader', canReadAllSkills: true };
    const conversationReader = {
      id: 'exact-reader',
      canReadAllConversations: true,
    };
    for (const actor of [...actors, root, skillReader, conversationReader]) {
      await expect(
        services.toolService.listAll({ actor }),
      ).rejects.toMatchObject({ status: 403 });
      await expect(
        services.toolService.getDetails({ actor, name: 'general-tool' }),
      ).rejects.toMatchObject({ status: 403 });
    }
    expect(list).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
    list.mockRestore();
    get.mockRestore();
  });

  it('validates a single nonblank name, normalizes whitespace, and returns 404 for missing tools', async () => {
    const get = vi.spyOn(deps.ai.toolsManager, 'getTools');
    for (const query of [
      '',
      'name=',
      'name=%20%09',
      'key=general-tool',
      'name=general-tool&name=custom-tool',
      'name=general-tool&name=general-tool',
    ]) {
      expect((await request('getDetails', query)).status, query).toBe(400);
    }
    expect(get).not.toHaveBeenCalled();
    get.mockRestore();
    expect((await request('getDetails', 'name=missing-tool')).status).toBe(404);
    expect(
      (await request('getDetails', 'name=%20general-tool%20')).status,
    ).toBe(200);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('returns empty rows for an empty registry', async () => {
    dynamicEnabled = false;
    await deps.ai.toolsManager.unregisterTools(
      tools.map((tool) => tool.definition.name),
    );
    try {
      const response = await request('listAll');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ rows: [] });
    } finally {
      await deps.ai.toolsManager.registerTools(tools);
      dynamicEnabled = true;
    }
  });

  it('uses an empty source when the actual registry entry has no from value', async () => {
    const tool: ToolsEntity = {
      scope: 'GENERAL',
      definition: { name: 'no-source', description: '' },
      invoke,
    };
    const list = vi
      .spyOn(deps.ai.toolsManager, 'listTools')
      .mockResolvedValueOnce([tool]);
    const get = vi
      .spyOn(deps.ai.toolsManager, 'getTools')
      .mockResolvedValueOnce(tool);
    expect(await (await request('listAll')).json()).toEqual({
      rows: [
        {
          name: 'no-source',
          title: 'no-source',
          description: '',
          about: '',
          scope: 'GENERAL',
          source: '',
        },
      ],
    });
    expect(
      await (await request('getDetails', 'name=no-source')).json(),
    ).toEqual({
      name: 'no-source',
      title: 'no-source',
      description: '',
      scope: 'GENERAL',
      source: '',
      about: '',
      inputSchema: null,
    });
    list.mockRestore();
    get.mockRestore();
  });

  it('returns null for nonserializable schemas without executing functions', async () => {
    const schemaFunction = vi.fn();
    const tool: ToolsEntity = {
      scope: 'GENERAL',
      definition: {
        name: 'bad-schema',
        description: '',
        schema: { type: 'object', implementation: schemaFunction },
      },
      invoke,
    };
    await deps.ai.toolsManager.registerTools(tool);
    try {
      const response = await request('getDetails', 'name=bad-schema');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        name: 'bad-schema',
        title: 'bad-schema',
        description: '',
        scope: 'GENERAL',
        source: 'loader',
        about: '',
        inputSchema: null,
      });
      expect(schemaFunction).not.toHaveBeenCalled();
      expect(invoke).not.toHaveBeenCalled();
    } finally {
      await deps.ai.toolsManager.unregisterTools('bad-schema');
    }
  });

  it('refuses legacy list, get and mutations without AI settings access', async () => {
    sessionUser = { id: 'ungranted' };
    expect((await request('list')).status).toBe(403);
    expect((await request('get', 'key=specified-tool')).status).toBe(403);
    const create = await app.request('/api/ai/aiTools:create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ definition: { name: 'intruder-tool' } }),
    });
    expect(create.status).toBe(403);
    expect(
      await deps.ai.toolsManager.getTools('intruder-tool'),
    ).toBeUndefined();
  });

  it('preserves legacy list, key-based get and mutations for AI settings access', async () => {
    sessionUser = { id: 'exact-reader' };
    const list = await request('list');
    expect(list.status).toBe(200);
    const rows: unknown = await list.json();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          definition: expect.objectContaining({
            name: 'specified-tool',
            schema: plainSchema,
          }),
        }),
      ]),
    );
    const detail = await request('get', 'key=specified-tool');
    expect(detail.status).toBe(200);
    expect(await detail.json()).toEqual({
      ...tools[1],
      invoke: undefined,
      execution: 'backend',
      defaultPermission: 'ASK',
      silence: false,
    });
    expect((await request('get', 'name=specified-tool')).status).toBe(400);
    const create = await app.request('/api/ai/aiTools:create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        definition: { name: 'legacy-tool', description: 'Legacy' },
        execution: 'frontend',
      }),
    });
    expect(create.status).toBe(200);
    const update = await app.request('/api/ai/aiTools:update?key=legacy-tool', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ definition: { description: 'Updated' } }),
    });
    expect(update.status).toBe(200);
    expect(await update.json()).toMatchObject({
      definition: { name: 'legacy-tool', description: 'Updated' },
    });
    const remove = await app.request(
      '/api/ai/aiTools:destroy?key=legacy-tool',
      { method: 'DELETE' },
    );
    expect(remove.status).toBe(200);
    expect(await deps.ai.toolsManager.getTools('legacy-tool')).toBeUndefined();
    expect(invoke).not.toHaveBeenCalled();
  });
});
