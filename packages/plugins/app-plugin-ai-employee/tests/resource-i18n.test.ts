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
      key: 'ai-catalog',
      grants: [
        {
          resource: { type: 'settings', id: 'ai.tools' },
          actions: [{ action: 'read' }],
        },
        {
          resource: { type: 'settings', id: 'ai.skills' },
          actions: [{ action: 'read' }],
        },
      ],
    });
    await deps.authorization.permissionSets.assign({
      permissionSet: 'ai-catalog',
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

  /** `resource` is `tools` or `skills`; `name` addresses one of them. */
  async function get(resource: string, name?: string) {
    const response = await app.request(
      `/api/aiEmployee/${resource}${name ? `/${encodeURIComponent(name)}` : ''}`,
      { headers: { 'x-locale': 'zh-CN' } },
    );
    expect(response.status).toBe(200);
    return (await response.json()).data;
  }

  it('reads independent i18n metadata back in list and detail', async () => {
    const invoke = async () => ({ status: 'success' as const, content: '' });
    for (const [name, i18n] of [
      ['localized-tool', { namespace: 'tool-owner' }],
      ['legacy-tool', undefined],
    ] as const)
      await deps.ai.toolsManager.registerTools({
        scope: 'SPECIFIED',
        execution: 'frontend',
        definition: { name, description: toolDescription },
        introduction: { title: 'Tool title', about: 'Tool documentation' },
        i18n,
        invoke,
      });
    for (const [name, i18n] of [
      ['localized-skill', { namespace: 'skill-owner' }],
      ['legacy-skill', undefined],
    ] as const)
      await deps.ai.skillsManager.registerSkills({
        name,
        scope: 'SPECIFIED',
        description: skillDescription,
        introduction: { title: 'Skill title' },
        content: 'Original skill body.',
        tools: ['localized-tool', 'legacy-tool', 'missing-tool'],
        i18n,
      });

    for (const [resource, name, namespace] of [
      ['tools', 'localized-tool', 'tool-owner'],
      ['skills', 'localized-skill', 'skill-owner'],
    ]) {
      expect(await get(resource, name)).toMatchObject({ i18n: { namespace } });
      expect(await get(resource)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name, i18n: { namespace } }),
        ]),
      );
    }
    expect(await get('tools', 'localized-tool')).toMatchObject({
      title: 'Tool title',
      description: toolDescription,
      about: 'Tool documentation',
      i18n: { namespace: 'tool-owner' },
    });
    const skill = await get('skills', 'localized-skill');
    expect(skill).toMatchObject({
      title: 'Skill title',
      description: skillDescription,
      about: '',
      content: 'Original skill body.',
      i18n: { namespace: 'skill-owner' },
    });
    expect(skill.tools[0]).toMatchObject({
      name: 'localized-tool',
      i18n: { namespace: 'tool-owner' },
      description: toolDescription,
    });
    expect(skill.tools[1]).not.toHaveProperty('i18n');
    expect(skill.tools[2]).not.toHaveProperty('i18n');
    const legacy = await get('skills', 'legacy-skill');
    expect(legacy).not.toHaveProperty('i18n');
    expect(legacy.tools[0].i18n).toEqual({ namespace: 'tool-owner' });
    expect(await get('tools', 'legacy-tool')).not.toHaveProperty('i18n');
  });
});
