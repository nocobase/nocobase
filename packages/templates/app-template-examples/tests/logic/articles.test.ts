// @vitest-environment node
import path from 'node:path';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import {
  ServiceContainer,
  type ServiceToken,
} from '@nocobase/service-provider';
import { Hono, type MiddlewareHandler } from 'hono';
import { beforeEach, afterEach, expect, it } from 'vitest';
import { articlesRoutes } from '../../server/routes/articles.ts';

let testDatabase: TestDatabase;
let db: DatabaseManager;
let router: Hono;
let app: Application;
beforeEach(async () => {
  testDatabase = await createTestDatabase({
    migrations: [
      {
        packageName: 'articles',
        directory: path.resolve(
          import.meta.dirname,
          '../../database/main/migrations',
        ),
      },
    ],
  });
  db = testDatabase.database;
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, db);
  const required = (): MiddlewareHandler => async (c, next) => {
    const user = c.req.header('x-test-user');
    if (!user) return c.json({ error: 'unauthenticated' }, 401);
    c.set('auth', { user: { id: user } });
    await next();
  };
  container.instance(authenticationToken, {
    required,
  } as unknown as typeof authenticationToken extends ServiceToken<infer T>
    ? T
    : never);
  app = { container } as Application;
  router = await articlesRoutes.createRouter(app);
  router.get('/unrelated', (c) => c.text('public'));
});
afterEach(async () => {
  await testDatabase?.destroy();
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
  user: string | null = 'alice',
) =>
  router.request(url, {
    method,
    headers: {
      ...(user ? { 'x-test-user': user } : {}),
      ...(input ? { 'content-type': 'application/json' } : {}),
    },
    ...(input ? { body: JSON.stringify(input) } : {}),
  });
it('requires sign-in without permission sets or leaking middleware', async () => {
  expect((await request('/articles', 'GET', undefined, null)).status).toBe(401);
  expect((await request('/articles')).status).toBe(200);
  expect((await request('/articles', 'POST', body)).status).toBe(201);
  expect((await request('/articles', 'POST', body, null)).status).toBe(401);
  expect(
    (await request('/articles/1', 'PATCH', { title: 'x' }, null)).status,
  ).toBe(401);
  expect((await request('/articles/1', 'PUT', body)).status).toBe(404);
  expect((await request('/unrelated', 'GET', undefined, null)).status).toBe(
    200,
  );
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
it('seeds six articles once and preserves user edits', async () => {
  const seeder = db.createSeeder({
    directory: path.resolve(import.meta.dirname, '../../database/main/seeds'),
    packageName: 'articles',
  });
  await seeder.run();
  await db
    .query()
    .updateTable('articles')
    .set({ content: 'User edit' })
    .where('title', '=', '欢迎来到文章中心')
    .execute();
  expect(await seeder.run()).toMatchObject({ executed: [] });
  const rows = await db.query().selectFrom('articles').selectAll().execute();
  expect(rows).toHaveLength(6);
  expect(rows.filter((row) => row.status === 'draft')).toHaveLength(2);
  expect(rows.find((row) => row.title === '欢迎来到文章中心')?.content).toBe(
    'User edit',
  );
});
