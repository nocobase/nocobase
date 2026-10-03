import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { SkillsEntity } from '@nocobase/ai-employee';
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

import { aiEmployeeApiRoutes } from '../../server/route/plugin.js';
import type {
  ManagedSkillSummary,
  SkillsManagementActor,
} from '../../server/types.js';
import { createTestAIEmployeeFixture } from './test-context.js';

const skills: SkillsEntity[] = [
  {
    name: 'general-skill',
    scope: 'GENERAL',
    description: 'General skill description',
    content: '# General skill\n\nPrivate Markdown instructions.',
    introduction: {
      title: 'General skill title',
      about: 'Not the description',
    },
    tools: [
      'specified-tool',
      'missing-tool',
      'general-tool',
      'specified-tool',
      'custom-tool',
      'dynamic-tool',
      'missing-tool',
    ],
  },
  {
    name: 'specified-skill',
    scope: 'SPECIFIED',
    description: 'Specified description',
    content: '# Specified',
    tools: [],
  },
  {
    name: 'custom-skill',
    scope: 'CUSTOM',
    description: 'Custom description',
    content: '# Custom',
    introduction: { title: '' },
  },
];

const summaries: ManagedSkillSummary[] = [
  {
    name: 'general-skill',
    title: 'General skill title',
    description: 'General skill description',
    tools: [
      {
        name: 'specified-tool',
        title: 'Specified tool title',
        description: 'Specified tool description',
        about: 'Not the description',
        available: true,
      },
      {
        name: 'missing-tool',
        title: 'missing-tool',
        description: '',
        about: '',
        available: false,
      },
      {
        name: 'general-tool',
        title: 'general-tool',
        description: 'General tool description',
        about: '',
        available: true,
      },
      {
        name: 'custom-tool',
        title: 'Custom tool title',
        description: 'Custom tool description',
        about: '',
        available: true,
      },
      {
        name: 'dynamic-tool',
        title: 'Dynamic tool title',
        description: 'Dynamic tool description',
        about: '',
        available: true,
      },
    ],
  },
  {
    name: 'specified-skill',
    title: 'specified-skill',
    description: 'Specified description',
    tools: [],
  },
  {
    name: 'custom-skill',
    title: 'custom-skill',
    description: 'Custom description',
    tools: [],
  },
];

describe('Skills management API', async () => {
  const { deps, services, container } = await createTestAIEmployeeFixture();
  const invoke = vi.fn(async () => ({
    status: 'success',
    content: 'Never execute',
  }));
  let sessionUser: { id: string; [key: string]: unknown } | null;
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
    for (const [key, page, id] of [
      ['all-settings', '*', 'wildcard-reader'],
      ['ai-settings', 'ai.settings', 'exact-reader'],
      ['other-settings', 'users.settings', 'other-reader'],
    ]) {
      await deps.authorization.permissionSets.create({
        key,
        grants: [
          {
            resource: { type: 'page', id: page },
            actions: [{ action: 'access' }],
          },
        ],
      });
      await deps.authorization.permissionSets.assign({
        permissionSet: key,
        subject: { type: 'user', id },
      });
    }
    for (const skill of skills)
      await deps.ai.skillsManager.registerSkills(skill);
    await deps.ai.toolsManager.registerTools([
      {
        scope: 'SPECIFIED',
        definition: {
          name: 'specified-tool',
          description: 'Specified tool description',
        },
        introduction: {
          title: 'Specified tool title',
          about: 'Not the description',
        },
        invoke,
      },
      {
        scope: 'GENERAL',
        definition: {
          name: 'general-tool',
          description: 'General tool description',
        },
        invoke,
      },
      {
        scope: 'CUSTOM',
        definition: {
          name: 'custom-tool',
          description: 'Custom tool description',
        },
        introduction: { title: 'Custom tool title' },
        invoke,
      },
      {
        scope: 'GENERAL',
        definition: {
          name: 'unrelated-tool',
          description: 'Must not be included',
        },
        invoke,
      },
    ]);
    deps.ai.toolsManager.registerDynamicTools(async (registration) => {
      await registration.registerTools([
        {
          scope: 'CUSTOM',
          definition: {
            name: 'dynamic-tool',
            description: 'Dynamic tool description',
          },
          introduction: { title: 'Dynamic tool title' },
          invoke,
        },
        {
          scope: 'GENERAL',
          definition: {
            name: 'specified-tool',
            description: 'Must not override static registration',
          },
          invoke,
        },
        {
          scope: 'GENERAL',
          definition: {
            name: 'unrelated-dynamic-tool',
            description: 'Must not be included',
          },
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
    return app.request(
      `/api/ai/aiSkills:${action}${query ? `?${query}` : ''}`,
      { headers },
    );
  }

  it.each(['wildcard-reader', 'exact-reader'])(
    'allows id-only %s and projects all scopes with exact ordered tool associations',
    async (id) => {
      sessionUser = { id };
      const list = vi.spyOn(services.skillService, 'listAll');
      const details = vi.spyOn(services.skillService, 'getDetails');
      const listResponse = await request('listAll');
      expect(listResponse.status).toBe(200);
      expect(await listResponse.json()).toEqual({
        rows: [...summaries].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      });
      for (const [index, skill] of skills.entries()) {
        const response = await request('getDetails', `name=${skill.name}`);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          ...summaries[index],
          content: skill.content,
        });
      }
      expect(list.mock.calls[0][0].actor).toEqual({
        id,
        canReadAllSkills: true,
      });
      expect(details.mock.calls[0][0].actor).toEqual({
        id,
        canReadAllSkills: true,
      });
      expect(invoke).not.toHaveBeenCalled();
      list.mockRestore();
      details.mockRestore();
    },
  );

  it('rejects anonymous, ungranted, unrelated grants and spoofed root before initialization or reads', async () => {
    const list = vi.spyOn(deps.ai.skillsManager, 'listSkills');
    const get = vi.spyOn(deps.ai.skillsManager, 'getSkills');
    const getTool = vi.spyOn(deps.ai.toolsManager, 'getTools');
    const listAll = vi.spyOn(services.skillService, 'listAll');
    const getDetails = vi.spyOn(services.skillService, 'getDetails');
    for (const user of [
      null,
      { id: 'ungranted' },
      { id: 'other-reader' },
      {
        id: 'ungranted',
        roles: ['root'],
        isRoot: true,
        canReadAllSkills: true,
        canReadAllConversations: true,
      },
    ]) {
      sessionUser = user;
      for (const action of ['listAll', 'getDetails']) {
        const response = await request(
          action,
          'name=general-skill&isRoot=true&canReadAllSkills=true',
          {
            'x-user-id': 'wildcard-reader',
            'x-role': 'root',
            'x-is-root': 'true',
            'x-can-read-all-skills': 'true',
          },
        );
        expect(response.status).toBe(user ? 403 : 401);
      }
    }
    for (const spy of [list, get, getTool, listAll, getDetails]) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    }
    expect(services.ready).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('rechecks real permission assignments for each request', async () => {
    sessionUser = { id: 'temporary-reader' };
    const assignment = await deps.authorization.permissionSets.assign({
      permissionSet: 'ai-settings',
      subject: { type: 'user', id: sessionUser.id },
    });
    expect((await request('listAll')).status).toBe(200);
    expect((await request('getDetails', 'name=general-skill')).status).toBe(
      200,
    );
    await deps.authorization.permissionSets.revoke(assignment.id);
    expect((await request('listAll')).status).toBe(403);
    expect((await request('getDetails', 'name=general-skill')).status).toBe(
      403,
    );
  });

  it('requires a dedicated capability on direct service calls before reading the registries', async () => {
    const list = vi.spyOn(deps.ai.skillsManager, 'listSkills');
    const get = vi.spyOn(deps.ai.skillsManager, 'getSkills');
    const actors: SkillsManagementActor[] = [
      { id: 'exact-reader' },
      { id: 'exact-reader', canReadAllSkills: false },
      { id: 'anonymous', canReadAllSkills: true },
      { id: '', canReadAllSkills: true },
      { id: ' ', canReadAllSkills: true },
    ];
    const root = { id: 'root', isRoot: true, roles: ['root'] };
    const conversationReader = {
      id: 'exact-reader',
      canReadAllConversations: true,
    };
    for (const actor of [...actors, root, conversationReader]) {
      await expect(
        services.skillService.listAll({ actor }),
      ).rejects.toMatchObject({ status: 403 });
      await expect(
        services.skillService.getDetails({ actor, name: 'general-skill' }),
      ).rejects.toMatchObject({ status: 403 });
    }
    expect(list).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
    list.mockRestore();
    get.mockRestore();
  });

  it('rejects missing, blank and ambiguous names, and returns 404 for unknown skills', async () => {
    const get = vi.spyOn(deps.ai.skillsManager, 'getSkills');
    for (const query of [
      '',
      'name=',
      'name=%20%09',
      'key=general-skill',
      'name=general-skill&name=custom-skill',
    ]) {
      expect((await request('getDetails', query)).status, query).toBe(400);
    }
    expect(get).not.toHaveBeenCalled();
    get.mockRestore();
    expect((await request('getDetails', 'name=missing-skill')).status).toBe(
      404,
    );
    expect(invoke).not.toHaveBeenCalled();
  });

  it('returns an empty rows envelope for an empty registry', async () => {
    for (const skill of skills)
      await deps.ai.skillsManager.deleteSkills(skill.name);
    try {
      const response = await request('listAll');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ rows: [] });
    } finally {
      for (const skill of skills)
        await deps.ai.skillsManager.registerSkills(skill);
    }
  });

  it('refuses the legacy list and get without AI settings access', async () => {
    sessionUser = { id: 'ungranted' };
    expect((await request('list')).status).toBe(403);
    expect((await request('get', 'key=general-skill')).status).toBe(403);
  });

  it('preserves the legacy list and key-based get response contracts for AI settings access', async () => {
    sessionUser = { id: 'exact-reader' };
    const list = await request('list');
    expect(list.status).toBe(200);
    expect(await list.json()).toEqual(
      [...skills]
        .sort((left, right) => left.name.localeCompare(right.name))
        .map(({ content: _content, ...skill }) => ({
          ...skill,
          tools: skill.tools ?? [],
          from: 'loader',
        })),
    );
    const detail = await request('get', 'key=general-skill');
    expect(detail.status).toBe(200);
    expect(await detail.json()).toEqual({ ...skills[0], from: 'loader' });
    expect((await request('get', 'name=general-skill')).status).toBe(400);
    expect(invoke).not.toHaveBeenCalled();
  });
});
