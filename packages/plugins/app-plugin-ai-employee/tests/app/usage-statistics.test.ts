import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
import { createTestAIEmployeeFixture } from './test-context.js';

const HOUR_IN_MS = 3_600_000;
const SESSION_ID = '123e4567-e89b-12d3-a456-426614174000';
/** Anchors every fixture instant; buckets are asserted relative to it. */
const ANCHOR = Date.parse('2026-09-20T12:00:00Z');

type UsageFixture = {
  offsetHours: number;
  model: string;
  aiEmployeeUsername: string;
  userId: string;
  inputTokens: number;
  outputTokens: number;
  provider?: string;
};

const fixtures: readonly UsageFixture[] = [
  {
    offsetHours: 0,
    model: 'gpt-5.2',
    aiEmployeeUsername: 'nathan',
    userId: 'root-user',
    inputTokens: 100,
    outputTokens: 10,
  },
  {
    offsetHours: 1,
    model: 'gpt-5.2',
    aiEmployeeUsername: 'nathan',
    userId: 'root-user',
    inputTokens: 200,
    outputTokens: 20,
  },
  {
    offsetHours: 13,
    model: 'claude-opus-5',
    aiEmployeeUsername: 'nathan',
    userId: 'member-user',
    inputTokens: 400,
    outputTokens: 40,
  },
  {
    offsetHours: 30,
    model: 'claude-opus-5',
    aiEmployeeUsername: 'alice',
    userId: 'member-user',
    inputTokens: 800,
    outputTokens: 80,
    provider: 'anthropic',
  },
  // Before the queried range; only the previous-period totals may see it.
  {
    offsetHours: -40,
    model: 'gpt-5.2',
    aiEmployeeUsername: 'nathan',
    userId: 'root-user',
    inputTokens: 1,
    outputTokens: 1,
  },
];

const rangeStart = ANCHOR;
const rangeEnd = ANCHOR + 47 * HOUR_IN_MS;

describe('AI usage statistics', () => {
  const fixture = createTestAIEmployeeFixture();
  const { deps, services, repositories, container } = fixture;
  let app: Hono;
  let sessionUser: { id: string } | null = { id: 'root-user' };

  beforeAll(async () => {
    await deps.database.connect();
    await deps.database.builder().createCollection('user', (collection) => {
      collection.string('id').notNull();
      collection.string('name').nullable();
      collection.string('username').nullable();
      collection.primary('id');
    });
    await deps.database.builder().createCollection('roles', (collection) => {
      collection.string('name').notNull();
      collection.boolean('allowNewAiEmployee').nullable();
      collection.primary('name');
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
    for (const [key, page, userId] of [
      ['system-administrator', '*', 'root-user'],
      ['other-settings-reader', 'users.settings', 'member-user'],
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
        subject: { type: 'user', id: userId },
      });
    }
    await deps.database
      .connection()
      .query.insertInto('user')
      .values([
        { id: 'root-user', name: 'Root Admin', username: 'root' },
        { id: 'member-user', name: '', username: 'member' },
      ])
      .execute();
    await repositories.aiEmployees.create({
      values: [
        {
          username: 'nathan',
          nickname: 'Nathan',
          enabled: true,
          builtIn: false,
          category: 'business',
          deprecated: false,
          enableKnowledgeBase: false,
        },
        {
          username: 'alice',
          enabled: true,
          builtIn: false,
          category: 'business',
          deprecated: false,
          enableKnowledgeBase: false,
        },
      ],
    });
    await repositories.aiConversations.create({
      values: { sessionId: SESSION_ID, read: true, thread: 0 },
    });
    let messageId = 1000;
    for (const item of fixtures) {
      const occurredAt = ANCHOR + item.offsetHours * HOUR_IN_MS;
      messageId += 1;
      await repositories.aiUsageEvents.create({
        values: {
          occurredAt: new Date(occurredAt),
          occurredHour: Math.floor(occurredAt / HOUR_IN_MS),
          sessionId: SESSION_ID,
          messageId: String(messageId),
          userId: item.userId,
          aiEmployeeUsername: item.aiEmployeeUsername,
          from: 'main-agent',
          category: 'chat',
          eventType: 'llm_message',
          role: 'assistant',
          provider: item.provider ?? 'openai',
          llmService: 'primary',
          model: item.model,
          inputTokens: item.inputTokens,
          outputTokens: item.outputTokens,
          totalTokens: item.inputTokens + item.outputTokens,
          cachedTokens: 0,
          reasoningTokens: 0,
          toolCallCount: 1,
          autoToolCallCount: 0,
          status: 'success',
        },
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
  });

  beforeEach(() => {
    sessionUser = { id: 'root-user' };
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await deps.database.destroy();
  });

  function request(action: string, query: Record<string, string> = {}) {
    const search = new URLSearchParams({
      start: String(rangeStart),
      end: String(rangeEnd),
      ...query,
    });
    return app.request(`/api/ai/aiUsage:${action}?${search.toString()}`);
  }

  it('refuses a user without AI settings access', async () => {
    sessionUser = { id: 'member-user' };
    for (const action of ['summary', 'series', 'breakdown', 'filterOptions']) {
      const response = await request(action, { dimension: 'model' });
      expect([action, response.status]).toEqual([action, 403]);
    }
  });

  it('refuses an anonymous request', async () => {
    sessionUser = null;
    const response = await request('summary');
    expect(response.status).toBe(401);
  });

  it('totals the range and the preceding one of equal length', async () => {
    const response = await request('summary');
    expect(response.status).toBe(200);
    // Without a shift the comparison is the equally long window that just
    // ended, which here reaches back to the -40h event.
    expect(await response.json()).toMatchObject({
      totals: {
        eventCount: 4,
        inputTokens: 1500,
        outputTokens: 150,
        totalTokens: 1650,
        toolCallCount: 4,
      },
      previous: { eventCount: 1, totalTokens: 2 },
      previousRange: {
        start: rangeStart - 48 * HOUR_IN_MS,
        end: rangeStart - 1,
      },
    });
  });

  it('moves the comparison window back by a whole period when asked', async () => {
    const response = await request('summary', { compareShiftHours: '24' });
    const body = (await response.json()) as {
      previousRange: { start: number; end: number };
      previous: { eventCount: number; totalTokens: number };
      range: { start: number; end: number };
    };
    expect(body.previousRange.start).toBe(body.range.start - 24 * HOUR_IN_MS);
    expect(body.previousRange.end).toBe(body.range.end - 24 * HOUR_IN_MS);
    // A day earlier the window covers the +0h, +1h and +13h events only.
    expect(body.previous).toMatchObject({ eventCount: 3, totalTokens: 770 });
  });

  it('rejects a comparison shift that is not a positive whole number of hours', async () => {
    for (const compareShiftHours of ['0', '-24', '1.5', 'day']) {
      const response = await request('summary', { compareShiftHours });
      expect([compareShiftHours, response.status]).toEqual([
        compareShiftHours,
        400,
      ]);
    }
  });

  it('applies dimension filters to the totals', async () => {
    const response = await request('summary', { model: 'gpt-5.2' });
    expect(await response.json()).toMatchObject({
      totals: { eventCount: 2, totalTokens: 330 },
    });
  });

  it('buckets the series by UTC day and reports empty days as zero', async () => {
    const response = await request('series', { granularity: 'day' });
    const body = (await response.json()) as {
      granularity: string;
      buckets: { start: number; totalTokens: number; eventCount: number }[];
    };
    expect(body.granularity).toBe('day');
    expect(body.buckets.map((bucket) => bucket.start)).toEqual([
      Date.parse('2026-09-20T00:00:00Z'),
      Date.parse('2026-09-21T00:00:00Z'),
      Date.parse('2026-09-22T00:00:00Z'),
    ]);
    // In UTC the 01:00Z and 18:00Z events share 2026-09-21, and nothing falls
    // on 2026-09-22 — the offset test below splits the same events differently.
    expect(body.buckets.map((bucket) => bucket.totalTokens)).toEqual([
      330, 1320, 0,
    ]);
  });

  it('moves the day boundary with the requested timezone offset', async () => {
    const response = await request('series', {
      granularity: 'day',
      timezoneOffset: '480',
    });
    const body = (await response.json()) as {
      range: { timezoneOffsetHours: number };
      buckets: { start: number; totalTokens: number }[];
    };
    expect(body.range.timezoneOffsetHours).toBe(8);
    // In UTC+8 the 12:00Z and 13:00Z events fall on 2026-09-20 local, the
    // 01:00Z event on 2026-09-21 local, and the 18:00Z event on 2026-09-22.
    expect(body.buckets.map((bucket) => bucket.start)).toEqual([
      Date.parse('2026-09-19T16:00:00Z'),
      Date.parse('2026-09-20T16:00:00Z'),
      Date.parse('2026-09-21T16:00:00Z'),
    ]);
    expect(body.buckets.map((bucket) => bucket.totalTokens)).toEqual([
      330, 440, 880,
    ]);
  });

  it('breaks usage down by model, ordered by tokens', async () => {
    const response = await request('breakdown', { dimension: 'model' });
    expect(await response.json()).toMatchObject({
      dimension: 'model',
      rows: [
        { key: 'claude-opus-5', label: 'claude-opus-5', totalTokens: 1320 },
        { key: 'gpt-5.2', label: 'gpt-5.2', totalTokens: 330 },
      ],
      totals: { totalTokens: 1650 },
    });
  });

  it('labels an employee breakdown with the nickname and falls back to the username', async () => {
    const response = await request('breakdown', {
      dimension: 'aiEmployeeUsername',
    });
    expect(await response.json()).toMatchObject({
      rows: [
        { key: 'alice', label: 'alice', totalTokens: 880 },
        { key: 'nathan', label: 'Nathan', totalTokens: 770 },
      ],
    });
  });

  it('labels a user breakdown with the account name', async () => {
    const response = await request('breakdown', { dimension: 'userId' });
    expect(await response.json()).toMatchObject({
      rows: [
        { key: 'member-user', label: 'member', totalTokens: 1320 },
        { key: 'root-user', label: 'Root Admin', totalTokens: 330 },
      ],
    });
  });

  it('rejects an unknown breakdown dimension', async () => {
    const response = await request('breakdown', { dimension: 'sessionId' });
    expect(response.status).toBe(400);
  });

  it('offers the models and employees present in the range', async () => {
    const response = await request('filterOptions');
    expect(await response.json()).toMatchObject({
      models: [{ value: 'claude-opus-5' }, { value: 'gpt-5.2' }],
      aiEmployees: [
        { value: 'alice', label: 'alice' },
        { value: 'nathan', label: 'Nathan' },
      ],
    });
  });

  it('rejects a range longer than a year', async () => {
    const response = await app.request(
      `/api/ai/aiUsage:summary?start=${rangeStart - 400 * 24 * HOUR_IN_MS}&end=${rangeEnd}`,
    );
    expect(response.status).toBe(400);
  });
});
