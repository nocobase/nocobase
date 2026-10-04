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
    about: 'Not the description',
    scope: 'GENERAL',
    source: 'loader',
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
    about: '',
    scope: 'SPECIFIED',
    source: 'loader',
    tools: [],
  },
  {
    name: 'custom-skill',
    title: 'custom-skill',
    description: 'Custom description',
    about: '',
    scope: 'CUSTOM',
    source: 'loader',
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

  /** `name` addresses one skill; without it, the collection. */
  function request(
    name?: string,
    init: RequestInit = {},
    query = '',
  ): Promise<Response> {
    return app.request(
      `/api/aiEmployee/skills${name === undefined ? '' : `/${encodeURIComponent(name)}`}${query ? `?${query}` : ''}`,
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

  it.each(['wildcard-reader', 'exact-reader'])(
    'allows id-only %s and projects all scopes with exact ordered tool associations',
    async (id) => {
      sessionUser = { id };
      const list = vi.spyOn(services.skillService, 'list');
      const details = vi.spyOn(services.skillService, 'get');
      const listResponse = await request();
      expect(listResponse.status).toBe(200);
      expect(await listResponse.json()).toEqual({
        data: [...summaries].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
        meta: { total: summaries.length },
      });
      for (const [index, skill] of skills.entries()) {
        const response = await request(skill.name);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          data: { ...summaries[index], content: skill.content },
        });
      }
      expect(list.mock.calls[0][0].actor).toEqual(settingsActor(id));
      expect(details.mock.calls[0][0].actor).toEqual(settingsActor(id));
      expect(invoke).not.toHaveBeenCalled();
      list.mockRestore();
      details.mockRestore();
    },
  );

  it('rejects anonymous, ungranted, unrelated grants and spoofed root before initialization or reads', async () => {
    const list = vi.spyOn(deps.ai.skillsManager, 'listSkills');
    const get = vi.spyOn(deps.ai.skillsManager, 'getSkills');
    const getTool = vi.spyOn(deps.ai.toolsManager, 'getTools');
    const listAll = vi.spyOn(services.skillService, 'list');
    const getDetails = vi.spyOn(services.skillService, 'get');
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
      for (const name of [undefined, 'general-skill']) {
        const response = await request(
          name,
          {
            headers: {
              'x-user-id': 'wildcard-reader',
              'x-role': 'root',
              'x-is-root': 'true',
              'x-can-read-all-skills': 'true',
            },
          },
          'isRoot=true&canReadAllSkills=true',
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
    expect((await request()).status).toBe(200);
    expect((await request('general-skill')).status).toBe(200);
    await deps.authorization.permissionSets.revoke(assignment.id);
    expect((await request()).status).toBe(403);
    expect((await request('general-skill')).status).toBe(403);
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
      await expect(services.skillService.list({ actor })).rejects.toMatchObject(
        { status: 403 },
      );
      await expect(
        services.skillService.get({ actor, name: 'general-skill' }),
      ).rejects.toMatchObject({ status: 403 });
    }
    expect(list).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
    list.mockRestore();
    get.mockRestore();
  });

  it('rejects a blank name, and answers an unknown skill with 404', async () => {
    const get = vi.spyOn(deps.ai.skillsManager, 'getSkills');
    expect((await request(' \t')).status).toBe(400);
    expect(get).not.toHaveBeenCalled();
    get.mockRestore();
    const missing = await request('missing-skill');
    expect(missing.status).toBe(404);
    expect((await missing.json()).error).toMatchObject({
      reason: 'SKILL_NOT_FOUND',
      domain: 'aiEmployees',
    });
    expect(invoke).not.toHaveBeenCalled();
  });

  it('returns an empty list for an empty registry', async () => {
    for (const skill of skills)
      await deps.ai.skillsManager.deleteSkills(skill.name);
    try {
      const response = await request();
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ data: [], meta: { total: 0 } });
    } finally {
      for (const skill of skills)
        await deps.ai.skillsManager.registerSkills(skill);
    }
  });

  it('creates, updates and deletes a skill with the standard methods and statuses', async () => {
    const post = (body: unknown) =>
      request(undefined, { method: 'POST', body: JSON.stringify(body) });
    const created = await post({
      name: 'drafted-skill',
      description: 'Drafted',
      content: '# Drafted',
      tools: ['general-tool'],
    });
    expect(created.status).toBe(201);
    expect((await created.json()).data).toMatchObject({
      name: 'drafted-skill',
      content: '# Drafted',
      tools: [expect.objectContaining({ name: 'general-tool' })],
    });

    const duplicate = await post({ name: 'drafted-skill' });
    expect(duplicate.status).toBe(409);
    expect((await duplicate.json()).error.reason).toBe('SKILL_ALREADY_EXISTS');

    const unknownField = await post({ name: 'other-skill', title: 'Nope' });
    expect(unknownField.status).toBe(400);
    expect((await unknownField.json()).error.fieldViolations).toEqual([
      expect.objectContaining({ field: '' }),
    ]);

    const updated = await request('drafted-skill', {
      method: 'PATCH',
      body: JSON.stringify({ content: '# Revised' }),
    });
    expect(updated.status).toBe(200);
    expect((await updated.json()).data).toMatchObject({
      description: 'Drafted',
      content: '# Revised',
    });
    expect(
      (
        await request('missing-skill', {
          method: 'PATCH',
          body: JSON.stringify({ content: '#' }),
        })
      ).status,
    ).toBe(404);

    const removed = await request('drafted-skill', { method: 'DELETE' });
    expect(removed.status).toBe(204);
    expect(await removed.text()).toBe('');
    expect((await request('drafted-skill', { method: 'DELETE' })).status).toBe(
      404,
    );
    expect(invoke).not.toHaveBeenCalled();
  });
});
