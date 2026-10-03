import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { AppConfig } from '@nocobase/app-server/config';
import { createMigrator } from '@nocobase/db';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestAIEmployeeFixture } from './app/test-context.js';
import { aiEmployeeApiRoutes } from '../server/route/plugin.js';

const toolDescription = 'Original model-facing tool instructions.';
const skillDescription = 'Original model-facing skill instructions.';

describe('Tool and Skill i18n API metadata', async () => {
  const { deps, services, container } = await createTestAIEmployeeFixture();
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
      subject: { type: 'user', id: 'reader' },
    });
    vi.spyOn(deps.auth, 'getSession').mockResolvedValue({
      user: { id: 'reader' },
      session: {},
    } as never);
    vi.spyOn(services, 'ready').mockResolvedValue(undefined);
    container.instance(authenticationToken, deps.auth);
    container.instance(authorizationToken, deps.authorization);
    const routes = await aiEmployeeApiRoutes.createRouter({
      appName: 'main',
      publicBasePath: '/main',
      config: new AppConfig(),
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

  async function get(resource: string, action: string, query = '') {
    const response = await app.request(
      `/api/ai/${resource}:${action}${query}`,
      { headers: { 'x-locale': 'zh-CN' } },
    );
    expect(response.status).toBe(200);
    return response.json();
  }

  async function upsert(resource: string, input: unknown, key?: string) {
    return app.request(
      `/api/ai/${resource}:${key ? `update?key=${key}` : 'create'}`,
      {
        method: key ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
  }

  it('round-trips independent metadata through upsert, legacy lists and management list/detail', async () => {
    for (const [name, i18n] of [
      ['localized-tool', { namespace: 'tool-owner' }],
      ['legacy-tool', undefined],
    ] as const) {
      const response = await upsert('aiTools', {
        execution: 'frontend',
        definition: { name, description: toolDescription },
        introduction: { title: 'Tool title', about: 'Tool documentation' },
        i18n,
      });
      expect(response.status).toBe(200);
      expect((await response.json()).i18n).toEqual(i18n);
    }
    for (const [name, i18n] of [
      ['localized-skill', { namespace: 'skill-owner' }],
      ['legacy-skill', undefined],
    ] as const) {
      const response = await upsert('aiSkills', {
        name,
        description: skillDescription,
        introduction: { title: 'Skill title' },
        content: 'Original skill body.',
        tools: ['localized-tool', 'legacy-tool', 'missing-tool'],
        i18n,
      });
      expect(response.status).toBe(200);
      expect((await response.json()).i18n).toEqual(i18n);
    }
    for (const [resource, name, namespace] of [
      ['aiTools', 'localized-tool', 'tool-owner'],
      ['aiSkills', 'localized-skill', 'skill-owner'],
    ]) {
      const update = await upsert(
        resource,
        { introduction: { title: 'Updated title' } },
        name,
      );
      expect(update.status).toBe(200);
      expect(await update.json()).toMatchObject({ i18n: { namespace } });
      expect(await get(resource, 'get', `?key=${name}`)).toMatchObject({
        i18n: { namespace },
      });
      expect(await get(resource, 'list')).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ i18n: { namespace } }),
        ]),
      );
      expect((await get(resource, 'listAll')).rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name, i18n: { namespace } }),
        ]),
      );
    }
    const tool = await get('aiTools', 'getDetails', '?name=localized-tool');
    expect(tool).toMatchObject({
      title: 'Updated title',
      description: toolDescription,
      about: 'Tool documentation',
      i18n: { namespace: 'tool-owner' },
    });
    const skill = await get('aiSkills', 'getDetails', '?name=localized-skill');
    expect(skill).toMatchObject({
      title: 'Updated title',
      description: skillDescription,
      content: 'Original skill body.',
      i18n: { namespace: 'skill-owner' },
    });
    expect(skill).not.toHaveProperty('about');
    expect(skill.tools[0]).toMatchObject({
      name: 'localized-tool',
      i18n: { namespace: 'tool-owner' },
      description: toolDescription,
    });
    expect(skill.tools[1]).not.toHaveProperty('i18n');
    expect(skill.tools[2]).not.toHaveProperty('i18n');
    const legacy = await get('aiSkills', 'getDetails', '?name=legacy-skill');
    expect(legacy).not.toHaveProperty('i18n');
    expect(legacy.tools[0].i18n).toEqual({ namespace: 'tool-owner' });
    expect(
      await get('aiTools', 'getDetails', '?name=legacy-tool'),
    ).not.toHaveProperty('i18n');
  });

  it.each(['aiTools', 'aiSkills'])(
    'validates and updates %s namespace without dropping existing metadata',
    async (resource) => {
      const name = `validation-${resource}`;
      const initial = await upsert(resource, {
        name,
        execution: 'frontend',
        i18n: { namespace: 'original' },
      });
      expect(initial.status).toBe(200);
      for (const i18n of [
        null,
        'namespace',
        [],
        {},
        { namespace: null },
        { namespace: 12 },
        { namespace: [] },
        { namespace: '' },
        { namespace: ' \t ' },
      ]) {
        const invalid = await upsert(resource, { i18n }, name);
        expect(invalid.status).toBe(400);
        expect((await invalid.json()).error).toMatch(/i18n/);
        expect(await get(resource, 'get', `?key=${name}`)).toMatchObject({
          i18n: { namespace: 'original' },
        });
      }
      const updated = await upsert(
        resource,
        { i18n: { namespace: ' replacement ' } },
        name,
      );
      expect(updated.status).toBe(200);
      expect(await updated.json()).toMatchObject({
        i18n: { namespace: 'replacement' },
      });
    },
  );
});
