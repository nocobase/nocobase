import { fileURLToPath } from 'node:url';
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createMigrator } from '@nocobase/db';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AI_FILE_UPLOAD_MAX_BYTES } from '../../server/route/index.js';
import { aiEmployeeApiRoutes } from '../../server/route/plugin.js';
import { authorizationMigrations } from '../support/migrations.js';
import { createTestAIEmployeeFixture } from './test-context.js';

describe('AI file preview access', async () => {
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
    // One run, so the migrations interleave by name as an application orders them: the authorization plugin's
    // Permission Set table exists before this plugin rewrites its grants.
    await createMigrator({
      database: deps.database,
      sources: [
        ...authorizationMigrations,
        {
          packageName: '@nocobase/app-plugin-ai-employee',
          directory: fileURLToPath(
            new URL('../../database/migrations', import.meta.url),
          ),
        },
      ],
    }).latest();
    await deps.database
      .connection()
      .query.insertInto('user')
      .values([
        { id: 'uploader' },
        { id: 'member' },
        { id: 'settings-admin' },
        { id: 'usage-reader' },
      ])
      .execute();
    // The conversation center shows every user's attachments, so reading it is what lets a user see another user's
    // file. Another AI item, such as usage, does not.
    for (const [key, item, userId] of [
      ['ai-conversations', 'ai.conversations', 'settings-admin'],
      ['ai-usage', 'ai.usage', 'usage-reader'],
    ]) {
      await deps.authorization.permissionSets.create({
        key,
        grants: [
          {
            resource: { type: 'settings', id: item },
            actions: [{ action: 'read' }],
          },
        ],
      });
      await deps.authorization.permissionSets.assign({
        permissionSet: key,
        subject: { type: 'user', id: userId },
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

    sessionUser = { id: 'uploader' };
    const form = new FormData();
    form.set(
      'file',
      new File(['attached'], 'note.txt', { type: 'text/plain' }),
    );
    const uploaded = await app.request('/api/aiEmployee/files', {
      method: 'POST',
      body: form,
    });
    expect(uploaded.status).toBe(201);
    const { data } = (await uploaded.json()) as {
      data: { id: string; preview: string };
    };
    fileId = String(data.id);
    expect(data.preview).toBe(`/api/aiEmployee/files/${fileId}/preview`);
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await deps.database.destroy();
  });

  async function preview(userId: string): Promise<Response> {
    sessionUser = { id: userId };
    return app.request(`/api/aiEmployee/files/${fileId}/preview`);
  }

  it('shows a file to the user who uploaded it', async () => {
    const response = await preview('uploader');
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('attached');
  });

  it.each(['member', 'usage-reader'])(
    "refuses another user's file to %s, who cannot read the conversation center",
    async (userId) => {
      const response = await preview(userId);
      expect(response.status).toBe(403);
      expect((await response.json()).error).toMatchObject({
        reason: 'FILE_ACCESS_DENIED',
        domain: 'aiEmployees',
      });
    },
  );

  it('refuses a missing file to a user who may read only their own, as it refuses one of another user', async () => {
    sessionUser = { id: 'member' };
    const response = await app.request(
      '/api/aiEmployee/files/999999999/preview',
    );
    expect(response.status).toBe(403);
    expect((await response.json()).error).toMatchObject({
      reason: 'FILE_ACCESS_DENIED',
      domain: 'aiEmployees',
    });
  });

  it('reports a missing file only to a user who can read the conversation center', async () => {
    sessionUser = { id: 'settings-admin' };
    const response = await app.request(
      '/api/aiEmployee/files/999999999/preview',
    );
    expect(response.status).toBe(404);
    expect((await response.json()).error).toMatchObject({
      reason: 'FILE_NOT_FOUND',
      domain: 'aiEmployees',
    });
  });

  it('refuses an upload larger than the limit with 413', async () => {
    sessionUser = { id: 'uploader' };
    const form = new FormData();
    form.set(
      'file',
      new File([new Uint8Array(AI_FILE_UPLOAD_MAX_BYTES + 1)], 'big.bin'),
    );
    const response = await app.request('/api/aiEmployee/files', {
      method: 'POST',
      body: form,
    });
    expect(response.status).toBe(413);
    expect((await response.json()).error).toMatchObject({
      status: 'INVALID_ARGUMENT',
      reason: 'BODY_TOO_LARGE',
      domain: 'aiEmployees',
    });
  });

  it('refuses an upload without a content type as an unsupported media type', async () => {
    sessionUser = { id: 'uploader' };
    const response = await app.request('/api/aiEmployee/files', {
      method: 'POST',
      body: new Uint8Array([1, 2, 3]),
    });
    expect(response.status).toBe(415);
    expect((await response.json()).error).toMatchObject({
      reason: 'UNSUPPORTED_MEDIA_TYPE',
      domain: 'aiEmployees',
    });
  });

  it('refuses an upload that is not a multipart form', async () => {
    sessionUser = { id: 'uploader' };
    const response = await app.request('/api/aiEmployee/files', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ file: 'not a file' }),
    });
    expect(response.status).toBe(415);
    expect((await response.json()).error).toMatchObject({
      status: 'INVALID_ARGUMENT',
      reason: 'UNSUPPORTED_MEDIA_TYPE',
    });
  });

  it('keeps a Chinese file name, and sends it in an RFC 6266 header', async () => {
    sessionUser = { id: 'uploader' };
    const form = new FormData();
    form.set('file', new File(['截图'], '客户截图.png', { type: 'image/png' }));
    const uploaded = await app.request('/api/aiEmployee/files', {
      method: 'POST',
      body: form,
    });
    const { data: body } = (await uploaded.json()) as {
      data: { id: string; filename: string; extname: string };
    };
    expect(body).toMatchObject({ filename: '客户截图.png', extname: '.png' });

    const response = await app.request(
      `/api/aiEmployee/files/${body.id}/preview`,
    );
    expect(response.headers.get('content-disposition')).toBe(
      `inline; filename=".png"; filename*=UTF-8''${encodeURIComponent('客户截图.png')}`,
    );
  });

  it("shows another user's file to a user who can read the conversation center", async () => {
    const response = await preview('settings-admin');
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('attached');
  });
});
