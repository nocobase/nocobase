import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import type { ScheduleJob } from '@nocobase/jobs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { demoConfigurationRuntimeToken } from '../../server/configuration/runtime-token.js';
import { DEMO_DATA_RESET_JOB } from '../../server/providers/demo-data.js';
import { demoDataToken } from '../../server/tokens.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

let app: TestApp;
afterEach(async () => app?.close());

async function setup(env: Record<string, string> = {}) {
  app = await createTestApp({
    createServer: createStandaloneServer,
    server: { env },
    config: { demoMode: { enabled: true } },
  });
  const container = app.application.container;
  const data = container.resolve(demoDataToken);
  data.register({
    id: 'test',
    languages: ['en-US', 'zh-CN'],
    timeZone: (language) =>
      language === 'zh-CN' ? 'Asia/Shanghai' : 'America/New_York',
    accounts: () => [],
    steps: () => [],
    clear: async () => {},
  });
  const rule = () =>
    container
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor('@nocobase/app-plugin-demo-mode')
      .getJob(DEMO_DATA_RESET_JOB);
  return {
    config: container.resolve(demoConfigurationRuntimeToken),
    data,
    rule,
  };
}

it('schedules the default reset for a dataset registered after the plugin is ready', async () => {
  const { rule } = await setup();
  await expect
    .poll(async () => (await rule())?.options)
    .toEqual({ cron: '* * * * *', tz: 'UTC' });
});

it('uses the environment schedule independently of the last generated language', async () => {
  const { config, data, rule } = await setup({
    NOCOBASE_DEMO_RESET_HOUR: '4',
    NOCOBASE_DEMO_RESET_MINUTE: '30',
    NOCOBASE_DEMO_RESET_TIMEZONE: 'Asia/Shanghai',
    NOCOBASE_DEMO_RESET_LANGUAGE: 'en-US',
  });
  await data.importNow('1', 'zh-CN');
  await data.whenIdle();
  expect((await rule())?.options).toEqual({
    cron: '* * * * *',
    tz: 'Asia/Shanghai',
  });
  expect((await config.read()).schedule).toEqual({
    enabled: true,
    hour: 4,
    minute: 30,
    timezone: 'Asia/Shanghai',
    language: 'en-US',
  });
});

/** The registered daily handler, with background firings stopped so only the simulated minutes run it. */
async function dailyHandler() {
  const executor = app.application.container
    .resolve(jobExecutorServiceToken)
    .getScheduleExecutor('@nocobase/app-plugin-demo-mode');
  await expect.poll(() => executor.getJob(DEMO_DATA_RESET_JOB)).toBeTruthy();
  const job = (
    executor as unknown as {
      handlers: Map<string, ScheduleJob>;
    }
  ).handlers.get(DEMO_DATA_RESET_JOB)!;
  await executor.shutdown();
  return async (iso: string) => {
    vi.setSystemTime(new Date(iso));
    const runAt = new Date(iso);
    await job.execute({
      jobId: iso,
      scheduledAt: runAt,
      runAt,
      signal: new AbortController().signal,
    });
  };
}

async function interruptSince(iso: string) {
  await app.connection.query
    .updateTable('demoModeDatasets')
    .set({ state: 'importing', updatedAt: new Date(iso) })
    .where('id', '=', 'test')
    .execute();
}

async function dailyRow(day: string) {
  return app.connection.query
    .selectFrom('demoModeDailyResets')
    .select(['state', 'attempt'])
    .where('day', '=', day)
    .executeTakeFirst<{ state: string; attempt: number }>();
}

describe('interrupted operations', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('pauses for a recent interruption and takes over an abandoned daily reset', async () => {
    const { config, data } = await setup();
    const clear = vi.fn(async () => {});
    data.register({
      id: 'test',
      languages: ['en-US'],
      accounts: () => [],
      steps: () => [],
      clear,
    });
    await data.importNow('1');
    await data.whenIdle();
    const run = await dailyHandler();
    vi.useFakeTimers({ toFake: ['Date'] });
    // A daily reset claimed its day, then its process stopped mid-operation.
    vi.setSystemTime(new Date('2026-10-21T03:00:00Z'));
    expect(
      await config.claimDaily(new Date('2026-10-21T03:00:00Z')),
    ).toMatchObject({ attempt: 1 });
    await interruptSince('2026-10-21T03:00:00Z');
    await run('2026-10-21T03:30:00Z');
    await run('2026-10-21T03:59:00Z');
    expect(clear).not.toHaveBeenCalled();
    expect((await data.status()).failure?.code).toBe('DEMO_DATA_INTERRUPTED');
    // An hour without renewal: the schedule takes the operation over as the day's next attempt.
    await run('2026-10-21T04:01:00Z');
    expect(clear).toHaveBeenCalledTimes(1);
    expect((await data.status()).state).toBe('ready');
    expect(await dailyRow('2026-10-21')).toMatchObject({
      state: 'succeeded',
      attempt: 2,
    });
  });

  it('takes over a manual operation abandoned an hour before the scheduled minute', async () => {
    const { data } = await setup();
    const clear = vi.fn(async () => {});
    data.register({
      id: 'test',
      languages: ['en-US'],
      accounts: () => [],
      steps: () => [],
      clear,
    });
    await data.importNow('1');
    await data.whenIdle();
    const run = await dailyHandler();
    vi.useFakeTimers({ toFake: ['Date'] });
    await interruptSince('2026-10-22T02:30:00Z');
    await run('2026-10-22T03:00:00Z');
    expect(clear).not.toHaveBeenCalled();
    expect(await dailyRow('2026-10-22')).toBeUndefined();
    await interruptSince('2026-10-23T01:50:00Z');
    await run('2026-10-23T03:00:00Z');
    expect(clear).toHaveBeenCalledTimes(1);
    expect((await data.status()).state).toBe('ready');
    expect(await dailyRow('2026-10-23')).toMatchObject({ state: 'succeeded' });
  });
});
