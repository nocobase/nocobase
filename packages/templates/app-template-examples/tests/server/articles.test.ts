import { type DatabaseManager } from '@nocobase/db';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import {
  signIn,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';
import type { Application } from '@nocobase/app-server/application';
import { ServiceContainer } from '@nocobase/service-provider';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { articlesRoutes } from '../../server/routes/articles.ts';
import { createStandaloneServer } from '../../server/standalone.js';
import { ArticlesService } from '../../server/providers/articles-service.js';

let testApp: TestApp;
let db: DatabaseManager;
let session: TestSession;
beforeEach(async () => {
  testApp = await createTestApp({
    createServer: createStandaloneServer,
    connections: ['main', 'analytics'],
    config: {
      logging: { enabled: false },
      app: { publicOrigin: 'http://localhost' },
      auth: {
        secret: 'test-auth-secret-at-least-32-characters',
        emailAndPassword: { disableSignUp: false },
      },
    },
  });
  db = testApp.database;
  await testApp.connection.query
    .deleteFrom('articles')
    .allowAllRows()
    .execute();
  const member = {
    name: 'Article author',
    email: 'author@example.test',
    password: 'test-author-password',
  };
  const registered = await testApp.request('/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(member),
  });
  if (!registered.ok)
    throw new Error(`Registration failed: ${await registered.text()}`);
  session = await signIn(testApp, member);
});
afterEach(async () => {
  vi.restoreAllMocks();
  await testApp?.close();
});
it('reaches the database service only after availability, authentication, size and validation gates pass', async () => {
  const list = vi.spyOn(ArticlesService.prototype, 'list');
  const create = vi.spyOn(ArticlesService.prototype, 'create');
  expect((await request('/articles', 'GET', undefined, false)).status).toBe(
    401,
  );
  expect((await request('/articles?page=0')).status).toBe(400);
  expect((await request('/articles', 'POST', { title: '' })).status).toBe(400);
  expect(
    (
      await request('/articles', 'POST', {
        ...body,
        content: 'x'.repeat(513 * 1024),
      })
    ).status,
  ).toBe(413);
  expect(list).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
  const unavailable = await articlesRoutes.createRouter({
    container: new ServiceContainer(),
  } as Application);
  expect((await unavailable.request('/articles')).status).toBe(503);
  expect(list).not.toHaveBeenCalled();
  expect((await request('/articles')).status).toBe(200);
  expect(list).toHaveBeenCalledTimes(1);
});
const body = {
  title: 'A new article',
  summary: 'Summary',
  content: 'Text',
  status: 'draft',
};
const request = (
  url: string,
  method = 'GET',
  input?: object,
  authenticated = true,
) =>
  (authenticated ? session.fetch : testApp.request)(url, {
    method,
    headers: {
      origin: 'http://localhost',
      ...(input ? { 'content-type': 'application/json' } : {}),
    },
    ...(input ? { body: JSON.stringify(input) } : {}),
  });
it('requires sign-in without permission sets or leaking middleware', async () => {
  expect((await request('/articles', 'GET', undefined, false)).status).toBe(
    401,
  );
  expect((await request('/articles')).status).toBe(200);
  expect((await request('/articles', 'POST', body)).status).toBe(201);
  expect((await request('/articles', 'POST', body, false)).status).toBe(401);
  expect(
    (await request('/articles/1', 'PATCH', { title: 'x' }, false)).status,
  ).toBe(401);
  expect((await request('/articles/1', 'PUT', body)).status).toBe(404);
  expect((await request('/example', 'GET', undefined, false)).status).toBe(200);
});
it('creates, filters, edits and publishes articles with server timestamps', async () => {
  const createdResponse = await request('/articles', 'POST', body);
  expect(createdResponse.status).toBe(201);
  const created = (await createdResponse.json()) as {
    data: { id: string; title: string; publishedAt: string | null };
  };
  expect(created.data).toMatchObject({
    id: expect.stringMatching(/^\d+$/),
    title: 'A new article',
    publishedAt: null,
  });
  const invalid = await request('/articles', 'POST', { ...body, title: '' });
  expect(invalid.status).toBe(400);
  expect(await invalid.json()).toMatchObject({
    error: {
      status: 'INVALID_ARGUMENT',
      reason: 'INVALID_INPUT',
      fieldViolations: [expect.objectContaining({ field: 'title' })],
    },
  });
  const unknownField = await request('/articles', 'POST', {
    ...body,
    author: 'x',
  });
  expect(unknownField.status).toBe(400);
  expect(
    ((await unknownField.json()) as { error: { reason: string } }).error.reason,
  ).toBe('INVALID_INPUT');
  expect((await request('/articles?page=0')).status).toBe(400);
  expect((await request('/articles?pageSize=101')).status).toBe(400);
  const response = await request('/articles?q=new&status=draft');
  expect(response.status).toBe(200);
  const result = (await response.json()) as {
    data: { id: string; publishedAt: string | null }[];
    meta: { page: number; pageSize: number; total: number };
  };
  expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
  expect(result.data[0].id).toBe(created.data.id);
  expect(result.data[0].publishedAt).toBeNull();
  const patched = await request(`/articles/${result.data[0].id}`, 'PATCH', {
    status: 'published',
  });
  expect(patched.status).toBe(200);
  expect(await patched.json()).toMatchObject({
    data: {
      id: created.data.id,
      title: 'A new article',
      status: 'published',
      publishedAt: expect.any(String),
    },
  });
  const saved = await db
    .query()
    .selectFrom('articles')
    .selectAll()
    .executeTakeFirst();
  expect(saved?.publishedAt).toBeTruthy();
  expect(await (await request('/articles?status=draft')).json()).toMatchObject({
    data: [],
    meta: { total: 0 },
  });
  const missing = await request('/articles/999', 'PATCH', { title: 'x' });
  expect(missing.status).toBe(404);
  expect(await missing.json()).toMatchObject({
    error: { reason: 'ARTICLE_NOT_FOUND', domain: 'examples' },
  });
  expect((await request('/articles/abc', 'PATCH', { title: 'x' })).status).toBe(
    400,
  );
});
it('pages with page and pageSize', async () => {
  for (let index = 0; index < 3; index += 1)
    await request('/articles', 'POST', { ...body, title: `Article ${index}` });
  const second = (await (
    await request('/articles?page=2&pageSize=2')
  ).json()) as { data: unknown[]; meta: unknown };
  expect(second.data).toHaveLength(1);
  expect(second.meta).toEqual({ page: 2, pageSize: 2, total: 3 });
});
it('answers 503 DATABASE_UNAVAILABLE without a database', async () => {
  const unavailable = await articlesRoutes.createRouter({
    container: new ServiceContainer(),
  } as Application);
  const response = await unavailable.request('/articles');
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({
    error: { status: 'UNAVAILABLE', reason: 'DATABASE_UNAVAILABLE' },
  });
});
