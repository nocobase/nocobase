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
    defaultPermission: 'ASK',
  },
  {
    name: 'specified-tool',
    title: 'Specified title',
    description: 'Specified description',
    about: '',
    scope: 'SPECIFIED',
    source: 'mcp',
    defaultPermission: 'ASK',
  },
  {
    name: 'custom-tool',
    title: 'custom-tool',
    description: 'Custom description',
    about: '',
    scope: 'CUSTOM',
    source: 'workflow',
    defaultPermission: 'ASK',
  },
  {
    name: 'dynamic-tool',
    title: 'Dynamic title',
    description: 'Last dynamic registration',
    about: 'Dynamic usage',
    scope: 'CUSTOM',
    source: 'mcp',
    defaultPermission: 'ASK',
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
    // Tools are read on their own page, and listed by the employee editor; every page, another AI item, or the old
    // settings page grant is not enough.
    for (const [key, resource, action, id] of [
      [
        'tools-read',
        { type: 'settings', id: 'ai.tools' },
        'read',
        'tools-reader',
      ],
      [
        'employees-read',
        { type: 'settings', id: 'ai.employees' },
        'read',
        'employees-reader',
      ],
      ['all-pages', { type: 'page', id: '*' }, 'access', 'all-pages-reader'],
      [
        'skills-read',
        { type: 'settings', id: 'ai.skills' },
        'read',
        'other-reader',
      ],
      [
        'legacy-page',
        { type: 'page', id: 'ai.settings' },
        'access',
        'legacy-page-reader',
      ],
    ] as const) {
      await deps.authorization.permissionSets.create({
        key,
        grants: [{ resource, actions: [{ action }] }],
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
    sessionUser = { id: 'tools-reader' };
    vi.clearAllMocks();
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await deps.database.destroy();
  });

  /** `name` addresses one tool; without it, the collection. */
  function request(
    name?: string,
    init: RequestInit = {},
    query = '',
  ): Promise<Response> {
    return app.request(
      `/api/aiEmployee/tools${name === undefined ? '' : `/${encodeURIComponent(name)}`}${query ? `?${query}` : ''}`,
      {
        ...init,
        headers: { 'content-type': 'application/json', ...init.headers },
      },
    );
  }

  const settingsActor = (id: string) => ({
    id,
    canReadAllConversations: true,
    canReadAllSkills: true,
    canReadAllTools: true,
    canReadUsageStatistics: true,
  });

  it.each(['tools-reader'])(
    'allows id-only %s with all scopes and static-first deduplication',
    async (id) => {
      sessionUser = { id };
      const list = vi.spyOn(services.toolService, 'list');
      const detail = vi.spyOn(services.toolService, 'get');
      const response = await request();
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        data: summaries,
        meta: { total: summaries.length },
      });
      for (const summary of summaries) {
        const response = await request(summary.name);
        expect(response.status).toBe(200);
        expect((await response.json()).data).toEqual({
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
      expect(list.mock.calls[0][0].actor).toEqual(settingsActor(id));
      expect(detail.mock.calls[0][0].actor).toEqual(settingsActor(id));
      expect(invoke).not.toHaveBeenCalled();
      list.mockRestore();
      detail.mockRestore();
    },
  );

  it('rejects anonymous, ungranted, unrelated grants, wrong actions and spoofed root before initialization or registry reads', async () => {
    const list = vi.spyOn(deps.ai.toolsManager, 'listTools');
    const get = vi.spyOn(deps.ai.toolsManager, 'getTools');
    const listAll = vi.spyOn(services.toolService, 'list');
    const getDetails = vi.spyOn(services.toolService, 'get');
    for (const user of [
      null,
      { id: 'ungranted' },
      { id: 'other-reader' },
      { id: 'all-pages-reader' },
      { id: 'legacy-page-reader' },
      { id: 'ungranted', roles: ['root'], isRoot: true, canReadAllTools: true },
    ]) {
      sessionUser = user;
      for (const name of [undefined, 'general-tool']) {
        const response = await request(
          name,
          {
            headers: {
              'x-user-id': 'tools-reader',
              'x-role': 'root',
              'x-is-root': 'true',
              'x-can-read-all-tools': 'true',
            },
          },
          'isRoot=true&canReadAllTools=true',
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
      permissionSet: 'tools-read',
      subject: { type: 'user', id: sessionUser.id },
    });
    expect((await request()).status).toBe(200);
    expect((await request('general-tool')).status).toBe(200);
    await deps.authorization.permissionSets.revoke(assignment.id);
    expect((await request()).status).toBe(403);
    expect((await request('general-tool')).status).toBe(403);
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
      await expect(services.toolService.list({ actor })).rejects.toMatchObject({
        status: 403,
      });
      await expect(
        services.toolService.get({ actor, name: 'general-tool' }),
      ).rejects.toMatchObject({ status: 403 });
    }
    expect(list).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
    list.mockRestore();
    get.mockRestore();
  });

  it('rejects a blank name, trims whitespace, and answers a missing tool with 404', async () => {
    const get = vi.spyOn(deps.ai.toolsManager, 'getTools');
    expect((await request(' \t')).status).toBe(400);
    expect(get).not.toHaveBeenCalled();
    get.mockRestore();
    const missing = await request('missing-tool');
    expect(missing.status).toBe(404);
    expect((await missing.json()).error.reason).toBe('TOOL_NOT_FOUND');
    expect((await request(' general-tool ')).status).toBe(200);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('returns an empty list for an empty registry', async () => {
    dynamicEnabled = false;
    await deps.ai.toolsManager.unregisterTools(
      tools.map((tool) => tool.definition.name),
    );
    try {
      const response = await request();
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ data: [], meta: { total: 0 } });
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
    expect(await (await request()).json()).toEqual({
      data: [
        {
          name: 'no-source',
          title: 'no-source',
          description: '',
          about: '',
          scope: 'GENERAL',
          source: '',
          defaultPermission: 'ASK',
        },
      ],
      meta: { total: 1 },
    });
    expect(await (await request('no-source')).json()).toEqual({
      data: {
        name: 'no-source',
        title: 'no-source',
        description: '',
        scope: 'GENERAL',
        source: '',
        defaultPermission: 'ASK',
        about: '',
        inputSchema: null,
      },
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
      const response = await request('bad-schema');
      expect(response.status).toBe(200);
      expect((await response.json()).data).toEqual({
        name: 'bad-schema',
        title: 'bad-schema',
        description: '',
        scope: 'GENERAL',
        source: 'loader',
        defaultPermission: 'ASK',
        about: '',
        inputSchema: null,
      });
      expect(schemaFunction).not.toHaveBeenCalled();
      expect(invoke).not.toHaveBeenCalled();
    } finally {
      await deps.ai.toolsManager.unregisterTools('bad-schema');
    }
  });

  it('lets the employee editor list tools without opening one', async () => {
    sessionUser = { id: 'employees-reader' };
    expect((await request()).status).toBe(200);
    expect((await request('general-tool')).status).toBe(403);
  });

  it('offers no way to write a tool, even to a reader', async () => {
    const write = [
      [undefined, 'POST'],
      ['general-tool', 'PATCH'],
      ['general-tool', 'DELETE'],
    ] as const;
    for (const [name, method] of write) {
      const response = await request(name, {
        method,
        body:
          method === 'DELETE'
            ? undefined
            : JSON.stringify({
                definition: { name: 'intruder-tool' },
                execution: 'frontend',
              }),
      });
      expect(response.status, `${method} ${name ?? ''}`).toBe(404);
    }
    expect(
      await deps.ai.toolsManager.getTools('intruder-tool'),
    ).toBeUndefined();
    expect(await deps.ai.toolsManager.getTools('general-tool')).toBeDefined();
  });
});
