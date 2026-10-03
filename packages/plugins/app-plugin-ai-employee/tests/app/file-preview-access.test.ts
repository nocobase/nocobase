import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createMigrator } from '@nocobase/db';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { aiEmployeeApiRoutes } from '../../server/route/plugin.js';
import { createTestAIEmployeeFixture } from './test-context.js';

describe('aiFiles:preview access', async () => {
  const { deps, services, container } = await createTestAIEmployeeFixture();
  let sessionUser: { id: string } | null = null;
  let app: Hono;
  let fileId: string;

  beforeAll(async () => {
    await deps.database.connect();
    await deps.database.builder().createCollection('user', (collection) => {
      collection.string('id').notNull();
      collection.string('username').nullable();
      collection.primary('id');
    });
    await createMigrator({
      database: deps.database,
      packageName: '@nocobase/app-plugin-ai-employee',
      directory: fileURLToPath(
        new URL('../../database/migrations', import.meta.url),
      ),
    }).latest();
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
    await deps.database
      .connection()
      .query.insertInto('user')
      .values([{ id: 'uploader' }, { id: 'member' }, { id: 'settings-admin' }])
      .execute();
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

    sessionUser = { id: 'uploader' };
    const form = new FormData();
    form.set(
      'file',
      new File(['attached'], 'note.txt', { type: 'text/plain' }),
    );
    const uploaded = await app.request('/api/ai/aiFiles:create', {
      method: 'POST',
      body: form,
    });
    expect(uploaded.status).toBe(200);
    fileId = String(((await uploaded.json()) as { id: string }).id);
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await deps.database.destroy();
  });

  async function preview(userId: string): Promise<Response> {
    sessionUser = { id: userId };
    return app.request(`/api/ai/aiFiles:preview?id=${fileId}`);
  }

  it('shows a file to the user who uploaded it', async () => {
    const response = await preview('uploader');
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('attached');
  });

  it("refuses another user's file to a signed-in user without AI settings access", async () => {
    expect((await preview('member')).status).toBe(403);
  });

  it('keeps a Chinese file name, and sends it in an RFC 6266 header', async () => {
    sessionUser = { id: 'uploader' };
    const form = new FormData();
    form.set('file', new File(['截图'], '客户截图.png', { type: 'image/png' }));
    const uploaded = await app.request('/api/ai/aiFiles:create', {
      method: 'POST',
      body: form,
    });
    const body = (await uploaded.json()) as {
      id: string;
      filename: string;
      extname: string;
    };
    expect(body).toMatchObject({ filename: '客户截图.png', extname: '.png' });

    const response = await app.request(`/api/ai/aiFiles:preview?id=${body.id}`);
    expect(response.headers.get('content-disposition')).toBe(
      `inline; filename=".png"; filename*=UTF-8''${encodeURIComponent('客户截图.png')}`,
    );
  });

  it("shows another user's file to a user with AI settings access", async () => {
    const response = await preview('settings-admin');
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('attached');
  });
});
