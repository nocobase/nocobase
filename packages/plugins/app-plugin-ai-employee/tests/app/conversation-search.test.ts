import { createMigrator } from '@nocobase/db';
import { Hono } from 'hono';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createAIConversationsRouter } from '../../server/route/ai-conversations.js';
import { createTestAIEmployeeFixture } from './test-context.js';

const { deps, services, repositories } = await createTestAIEmployeeFixture();
const app = new Hono();
app.use('*', async (context, next) => {
  context.set('currentUser', { id: 'search-user', scope: 'main', roles: [] });
  await next();
});
createAIConversationsRouter(app, services);

beforeAll(async () => {
  await deps.database.connect();
  const builder = deps.database.builder();
  await builder.createCollection('user', (c) => {
    c.string('id').notNull();
    c.primary('id');
  });
  await builder.createCollection('roles', (c) => {
    c.string('name').notNull();
    c.boolean('allowNewAiEmployee').nullable();
    c.primary('name');
  });
  await createMigrator({
    database: deps.database,
    packageName: '@nocobase/app-plugin-ai-employee',
    directory: fileURLToPath(
      new URL('../../database/migrations', import.meta.url),
    ),
  }).latest();
  await deps.database
    .connection()
    .query.insertInto('user')
    .values([{ id: 'search-user' }, { id: 'another-user' }])
    .execute();
  const entries = [
    { title: 'Say hi', updatedAt: new Date('2026-01-01') },
    { title: 'hi again', updatedAt: new Date('2026-01-02') },
    { title: 'Unrelated conversation' },
    { title: '100% complete' },
    { title: 'under_score' },
    { title: 'bang! and back\\slash' },
    { title: "O'Reilly notes" },
    { title: '你好，知识库' },
    { title: "' OR 1=1 --" },
    { title: null },
    { title: 'hi private', userId: 'another-user' },
    { title: 'hi other scope', scope: 'other' },
    { title: 'hi task', category: 'task' },
    { title: 'hi sub-agent', from: 'sub-agent' },
  ];
  for (const entry of entries) {
    await repositories.aiConversations.create({
      values: {
        userId: 'search-user',
        scope: 'main',
        from: 'main-agent',
        category: 'chat',
        ...entry,
        title: entry.title ?? undefined,
      },
    });
  }
});

afterAll(() => deps.database.destroy());

it('searches titles through the HTTP route with SQLite and preserves ownership, scope, category and order', async () => {
  const response = await app.request('/aiConversations:list?keyword=hi');
  expect(response.status).toBe(200);
  expect(
    ((await response.json()) as { title: string }[]).map((row) => row.title),
  ).toEqual(['hi again', 'Say hi']);
});

it.each([
  ['%', '100% complete'],
  ['_', 'under_score'],
  ['!', 'bang! and back\\slash'],
  ['\\', 'bang! and back\\slash'],
  ["O'Reilly", "O'Reilly notes"],
  ['知识库', '你好，知识库'],
  ["' OR 1=1 --", "' OR 1=1 --"],
])('treats keyword %s as literal text', async (keyword, title) => {
  const response = await app.request(
    `/aiConversations:list?keyword=${encodeURIComponent(keyword)}`,
  );
  expect(response.status).toBe(200);
  expect(
    ((await response.json()) as { title: string }[]).map((row) => row.title),
  ).toEqual([title]);
});

it('returns no rows for an unmatched keyword', async () => {
  const response = await app.request('/aiConversations:list?keyword=not-found');
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([]);
});

it('keeps the unfiltered list scoped and includes untitled conversations', async () => {
  for (const path of [
    '/aiConversations:list',
    '/aiConversations:list?keyword=',
  ]) {
    const response = await app.request(path);
    expect(response.status).toBe(200);
    const rows = (await response.json()) as {
      title: string | null;
      userId: string;
      scope: string;
      category: string;
      from: string;
    }[];
    expect(rows).toHaveLength(10);
    expect(rows.some((row) => row.title === null)).toBe(true);
    for (const row of rows)
      expect(row).toMatchObject({
        userId: 'search-user',
        scope: 'main',
        category: 'chat',
        from: 'main-agent',
      });
  }
});

it('does not mutate supplied filters or let them override ownership and scope', async () => {
  const filter = Object.freeze({
    title: 'ignored exact title',
    userId: 'another-user',
    scope: 'other',
    category: 'task',
  });
  const rows = await services.conversationService.list({
    actorId: 'search-user',
    scope: 'main',
    options: { filter, keyword: 'hi' },
  });
  expect(rows.map((row) => row.title)).toEqual(['hi again', 'Say hi']);
  expect(filter.title).toBe('ignored exact title');
});
