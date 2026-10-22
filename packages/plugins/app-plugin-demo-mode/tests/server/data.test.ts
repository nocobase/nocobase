import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { generateText, jsonSchema, stepCountIs, streamText, tool } from 'ai';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { demoDataToken, type DemoDataService } from '../../server/tokens.js';
import type { DemoDataset } from '../../shared/data.js';
import { createDemoClock } from '../../server/data/clock.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

const names = async (app: TestApp): Promise<string[]> =>
  (
    await app.connection.query
      .selectFrom('demoitems')
      .select(['name'])
      .execute<{ name: string }>()
  )
    .map((row) => row.name)
    .sort();

/** A dataset that writes rows of the fixture table, failing on request. */
function dataset(options: { fail?: boolean } = {}): DemoDataset {
  return {
    id: 'fixture',
    languages: ['zh-CN', 'en-US'],
    accounts: (language) => [
      {
        username: language === 'zh-CN' ? 'zhangsan' : 'johnson',
        name: language === 'zh-CN' ? '张三' : 'Ann Johnson',
        role: 'demo',
        password: 'demo1234',
      },
    ],
    steps: () => [
      {
        key: 'items',
        run: async (context) => {
          const name = `item-${context.language}`;
          await app.connection.query
            .insertInto('demoitems')
            .values({ name })
            .execute();
          await context.track('demoitems', name, { key: 'name' });
          await context.setData({ wrote: name });
        },
      },
      {
        key: 'more',
        weight: 2,
        run: async (context) => {
          await app.connection.query
            .insertInto('demoitems')
            .values({ name: 'second' })
            .execute();
          await context.track('demoitems', ['second'], { key: 'name' });
          await context.progress(0.5);
          if (options.fail) throw new Error('boom');
        },
      },
    ],
    clear: async (context) => {
      cleared.push(String(context.data.wrote));
      await app.connection.query
        .deleteFrom('demoitems')
        .allowAllRows()
        .execute();
    },
  };
}

let app: TestApp;
let service: DemoDataService;
let cleared: string[] = [];

beforeAll(async () => {
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { mode: 'observe' } },
  });
  service = app.application.container.resolve(demoDataToken);
});
afterAll(() => app.close());

describe('demo data lifecycle', () => {
  beforeEach(async () => {
    cleared = [];
    await app.connection.query.deleteFrom('demoitems').allowAllRows().execute();
  });

  it('reports no dataset before one is registered', async () => {
    const status = await service.status();
    expect(status).toMatchObject({
      available: false,
      present: false,
      state: null,
    });
  });

  it('imports, reports, and clears all application business data', async () => {
    service.register(dataset());
    await app.connection.query
      .insertInto('demoitems')
      .values({ name: 'mine' })
      .execute();
    const before = await service.status();
    expect(before.accountsByLanguage['en-US']?.[0]?.username).toBe('johnson');

    const status = await service.importNow('1', 'en-US');
    expect(status).toMatchObject({
      present: true,
      state: 'ready',
      language: 'en-US',
      records: 2,
      counts: { demoitems: 2 },
      importing: null,
      failure: null,
    });
    expect(await names(app)).toEqual(['item-en-US', 'mine', 'second']);

    await expect(service.importNow('1')).rejects.toMatchObject({
      reason: 'DEMO_DATA_EXISTS',
    });

    const after = await service.clear('1');
    expect(after).toMatchObject({ present: false, state: null, records: 0 });
    expect(cleared).toEqual(['item-en-US']);
    expect(await names(app)).toEqual([]);
  });

  it('takes a failed import back and lets the next one start over', async () => {
    service.register(dataset({ fail: true }));
    await expect(service.importNow('1', 'zh-CN')).rejects.toThrow('boom');
    const failed = await service.status();
    expect(failed).toMatchObject({
      present: false,
      state: 'failed',
      failure: { message: 'boom' },
      records: 0,
    });
    expect(await names(app)).toEqual([]);
    expect(cleared).toEqual(['item-zh-CN']);

    service.register(dataset());
    await service.importNow('1', 'zh-CN');
    expect(await names(app)).toEqual(['item-zh-CN', 'second']);
    await service.clear('1');
  });

  it('starts an import in the background and reports its progress', async () => {
    const started = await service.start('1');
    expect(started.state).toBe('importing');
    expect(started.importing).not.toBeNull();
    await expect(service.start('1')).rejects.toMatchObject({
      reason: 'DEMO_DATA_BUSY',
    });
    await service.whenIdle();
    expect((await service.status()).present).toBe(true);
  });

  it('resets as the account that imported last', async () => {
    const status = await service.reset(undefined, 'en-US', { wait: true });
    expect(status).toMatchObject({ present: true, language: 'en-US' });
    expect(await names(app)).toEqual(['item-en-US', 'second']);
    await service.clear('1');
  });

  it('refuses an unknown language', async () => {
    await expect(service.importNow('1', 'fr-FR')).rejects.toMatchObject({
      reason: 'DEMO_DATA_LANGUAGE',
    });
  });

  it('validates the reset language before deleting the current dataset', async () => {
    await service.importNow('1', 'en-US');
    await expect(service.reset('1', 'fr-FR')).rejects.toMatchObject({
      reason: 'DEMO_DATA_LANGUAGE',
    });
    expect(await names(app)).toEqual(['item-en-US', 'second']);
    await service.clear('1');
  });

  it('allows only one concurrent clear to change the dataset', async () => {
    await service.importNow('1');
    const results = await Promise.allSettled([
      service.clear('1'),
      service.clear('1'),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === 'rejected'),
    ).toMatchObject({
      reason: { reason: 'DEMO_DATA_BUSY' },
    });
    expect(await names(app)).toEqual([]);
  });

  it('cleans an interrupted import before retrying it', async () => {
    await service.importNow('1', 'zh-CN');
    await app.connection.query
      .updateTable('demoModeDatasets')
      .set({
        state: 'importing',
        updatedAt: new Date(Date.now() - 20 * 60_000),
      })
      .where('id', '=', 'fixture')
      .execute();
    expect((await service.status()).failure?.code).toBe(
      'DEMO_DATA_INTERRUPTED',
    );
    await service.importNow('1', 'en-US');
    expect(await names(app)).toEqual(['item-en-US', 'second']);
    await service.clear('1');
  });
});

it('lets scheduled or CLI resets write outside HTTP while read-only mode is enabled', async () => {
  const readonly = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { mode: 'read-only' } },
  });
  try {
    const demo = readonly.application.container.resolve(demoDataToken);
    demo.register({
      id: 'scheduled',
      clear: async () => {
        await readonly.connection.query
          .deleteFrom('demoitems')
          .allowAllRows()
          .execute();
      },
      languages: ['en-US'],
      accounts: () => [],
      steps: () => [
        {
          key: 'row',
          run: async (context) => {
            await readonly.connection.query
              .insertInto('demoitems')
              .values({ name: 'scheduled' })
              .execute();
            await context.track('demoitems', 'scheduled', { key: 'name' });
          },
        },
      ],
    });
    await demo.importNow('1');
    expect(
      await demo.reset(undefined, undefined, { wait: true }),
    ).toMatchObject({
      present: true,
      mode: 'read-only',
      language: 'en-US',
    });
    expect(await names(readonly)).toEqual(['scheduled']);
  } finally {
    await readonly.close();
  }
});

describe('demo clock', () => {
  it('places days in the dataset time zone and never in the future', () => {
    const now = new Date('2026-10-20T03:00:00Z');
    const clock = createDemoClock(now, 'Asia/Shanghai');
    expect(clock.dateAgo(0)).toBe('2026-10-20');
    expect(clock.dateAgo(1)).toBe('2026-10-19');
    expect(clock.isoAgo(1, 10)).toBe('2026-10-19T02:00:00.000Z');
    // 15:00 today in Shanghai is after 11:00 local, the time of the import.
    expect(clock.daysAgo(0, 15).getTime()).toBeLessThan(now.getTime());
  });
});

describe('simulated model', () => {
  const provider = () =>
    createOpenAICompatible({
      name: 'demo',
      baseURL: 'http://demo.invalid/main/api/demoMode/models/v1',
      apiKey: 'test-key',
      // The gateway would reach the application over HTTP; the test hands the request to it in process.
      fetch: (input, init) =>
        Promise.resolve(app.fetch(new Request(input as string, init))),
    });

  beforeAll(async () => {
    service.register({
      ...dataset(),
      answers: [
        {
          id: 'traffic',
          match: (request) =>
            request.prompt.includes('流量') && request.toolResults.length === 0,
          reply: () => ({
            toolCalls: [{ name: 'readTraffic', arguments: { days: 7 } }],
          }),
        },
        {
          id: 'traffic-answer',
          match: (request) =>
            request.toolResults.some((result) => result.name === 'readTraffic'),
          reply: (request) =>
            `过去 7 天访问 ${request.toolResults[0]!.content} 次。`,
        },
      ],
    });
    await service.importNow('1');
    await app.connection.query
      .insertInto('demoModeModel')
      .values({
        id: 'default',
        modelService: 'demo-model',
        modelKey: 'test-key',
      })
      .execute();
    await service.load();
  });

  it('refuses a call without the service key', async () => {
    const response = await app.request('/demoMode/models/v1/models');
    expect(response.status).toBe(401);
  });

  it('answers through the OpenAI-compatible client, calling the offered tools', async () => {
    const result = await generateText({
      model: provider().chatModel('demo-chat'),
      prompt: '最近的流量怎么样？',
      tools: {
        readTraffic: tool({
          inputSchema: jsonSchema<{ days: number }>({
            type: 'object',
            properties: { days: { type: 'number' } },
          }),
          execute: ({ days }) => Promise.resolve(days * 100),
        }),
      },
      stopWhen: stepCountIs(3),
    });
    expect(result.steps[0]?.toolCalls[0]).toMatchObject({
      toolName: 'readTraffic',
      input: { days: 7 },
    });
    expect(result.text).toBe('过去 7 天访问 700 次。');
  });

  it('streams the fallback answer in the prompt’s language', async () => {
    const result = streamText({
      model: provider().chatModel('demo-chat'),
      prompt: 'What should we write next?',
    });
    const text = await result.text;
    expect(text).toContain('(Demo model)');
    expect(text).toContain('What should we write next?');
    expect((await result.usage).totalTokens).toBeGreaterThan(0);
  });

  it('answers in-process with a tag for the application’s own calls', async () => {
    service.register({
      ...dataset(),
      answers: [
        {
          id: 'tagged',
          match: (request) => request.tag === 'daily-report',
          reply: () => '{"ok":true}',
        },
      ],
    });
    await expect(
      service.models.complete({ prompt: '{}', tag: 'daily-report' }),
    ).resolves.toBe('{"ok":true}');
  });

  it('reloads model credentials changed by another process', async () => {
    await app.connection.query
      .updateTable('demoModeModel')
      .set({ modelKey: 'rotated-key' })
      .where('id', '=', 'default')
      .execute();
    const old = await app.request('/demoMode/models/v1/models', {
      headers: { authorization: 'Bearer test-key' },
    });
    expect(old.status).toBe(401);
    const current = await app.request('/demoMode/models/v1/models', {
      headers: { authorization: 'Bearer rotated-key' },
    });
    expect(current.status).toBe(200);
    await app.connection.query
      .updateTable('demoModeModel')
      .set({ modelService: null })
      .where('id', '=', 'default')
      .execute();
    const cleared = await app.request('/demoMode/models/v1/models', {
      headers: { authorization: 'Bearer rotated-key' },
    });
    expect(cleared.status).toBe(401);
  });
});
