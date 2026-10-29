import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import type { ScheduleJob } from '@nocobase/jobs';
import { afterEach, expect, it, vi } from 'vitest';
import { DemoDataProvider } from '../../server/providers/demo-data.js';
import { demoConfigurationRuntimeToken } from '../../server/configuration/runtime-token.js';
import { demoDataToken } from '../../server/tokens.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

let app: TestApp;
afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  await app?.close();
});
async function fixture() {
  let job!: ScheduleJob;
  const ready = DemoDataProvider.prototype.ready;
  vi.spyOn(DemoDataProvider.prototype, 'ready').mockImplementation(
    async function (this: DemoDataProvider) {
      const executor = this.app.container
        .resolve(jobExecutorServiceToken)
        .getScheduleExecutor('@nocobase/app-plugin-demo-mode');
      const add = executor.addJob.bind(executor);
      vi.spyOn(executor, 'addJob').mockImplementation(async (value, only) => {
        job = value;
        return add(value, only);
      });
      await ready.call(this);
    },
  );
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { enabled: true } },
  });
  const warning = vi.fn();
  app.application.container.instance(loggingToken, {
    getLogger: () => ({ warn: warning, info: () => {} }),
  } as never);
  const data = app.application.container.resolve(demoDataToken);
  const config = app.application.container.resolve(
    demoConfigurationRuntimeToken,
  );
  let failure: 'generate' | 'clear' | undefined;
  let generations = 0;
  data.register({
    id: 'daily',
    languages: ['en-US'],
    accounts: () => [],
    steps: () => [
      {
        key: 'people-and-projects',
        run: async () => {
          generations++;
          if (failure === 'generate')
            throw new Error('fixed upstream unavailable');
        },
      },
    ],
    clear: async () => {
      if (failure === 'clear') throw new Error('fixed cleanup unavailable');
    },
  });
  await data.importNow('admin');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-29T03:00:00Z'));
  const run = () =>
    job.execute({
      jobId: 'test',
      scheduledAt: new Date(),
      runAt: new Date(),
      signal: new AbortController().signal,
    });
  const row = () =>
    app.connection.query
      .selectFrom('demoModeDailyResets')
      .selectAll()
      .executeTakeFirst();
  return {
    data,
    config,
    warning,
    run,
    row,
    fail: (value?: typeof failure) => {
      failure = value;
    },
    generations: () => generations,
  };
}

it.each(['generate', 'clear'] as const)(
  'retries settled %s failures once recovered and never repeats success',
  async (phase) => {
    const f = await fixture();
    f.fail(phase);
    await expect(f.run()).rejects.toThrow('unavailable');
    expect(await f.row()).toMatchObject({ state: 'retry', attempt: 1 });
    expect((await f.data.status()).failure?.message).toContain('unavailable');
    expect(f.warning).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      expect.any(String),
    );
    await f.run();
    expect((await f.row())?.attempt).toBe(1);
    f.fail();
    vi.setSystemTime(new Date('2026-10-29T03:05:00Z'));
    await Promise.all([f.run(), f.run()]);
    expect(await f.row()).toMatchObject({ state: 'succeeded', attempt: 2 });
    const count = f.generations();
    await f.run();
    expect(f.generations()).toBe(count);
    expect(
      await app.connection.query
        .selectFrom('demoModeConfiguration')
        .select('lastDay')
        .executeTakeFirst(),
    ).toEqual({ lastDay: '2026-10-29' });
  },
);

it('caps persistent failures at three attempts and does not retry invalid language', async () => {
  const f = await fixture();
  f.fail('generate');
  for (let attempt = 0; attempt < 3; attempt++) {
    vi.setSystemTime(new Date(Date.UTC(2026, 9, 29, 3, attempt * 5)));
    await expect(f.run()).rejects.toThrow();
  }
  expect(await f.row()).toMatchObject({ state: 'failed', attempt: 3 });
  vi.setSystemTime(new Date('2026-10-29T04:00:00Z'));
  await f.run();
  expect((await f.row())?.attempt).toBe(3);
  f.fail();
  f.data.register({
    id: 'daily',
    languages: ['zh-CN'],
    accounts: () => [],
    steps: () => [],
    clear: async () => {},
  });
  vi.setSystemTime(new Date('2026-10-30T03:00:00Z'));
  await expect(f.run()).rejects.toMatchObject({ reason: 'DEMO_DATA_LANGUAGE' });
  expect(
    await app.connection.query
      .selectFrom('demoModeDailyResets')
      .select('state')
      .where('day', '=', '2026-10-30')
      .executeTakeFirst(),
  ).toEqual({ state: 'failed' });
});

it('logs a claim failure without running the reset or consuming the day', async () => {
  const f = await fixture();
  const claim = vi
    .spyOn(f.config, 'claimDaily')
    .mockRejectedValueOnce(new Error('database unavailable'));
  await expect(f.run()).rejects.toThrow('database unavailable');
  expect(await f.row()).toBeUndefined();
  expect(f.generations()).toBe(1);
  expect(f.warning).toHaveBeenCalledWith(
    expect.objectContaining({ err: expect.any(Error) }),
    expect.any(String),
  );
  claim.mockRestore();
  vi.setSystemTime(new Date('2026-10-29T03:01:00Z'));
  await f.run();
  expect(await f.row()).toMatchObject({ state: 'succeeded', attempt: 1 });
});

it('does not take over an expired claim, including a crash after reset before acknowledgement', async () => {
  const f = await fixture();
  const claim = await f.config.claimDaily(new Date());
  await f.data.reset(undefined, undefined, { wait: true });
  vi.setSystemTime(new Date('2026-10-29T03:11:00Z'));
  await f.run();
  expect(await f.row()).toMatchObject({ state: 'interrupted', attempt: 1 });
  expect(f.generations()).toBe(2);
  // A late acknowledgement can settle only its own token; it cannot trigger another reset.
  await f.config.finishDaily(claim!);
  await f.run();
  expect(await f.row()).toMatchObject({ state: 'succeeded' });
  expect(f.generations()).toBe(2);
});

it('retries admission contention without concurrent clearing', async () => {
  const f = await fixture();
  let release!: () => void;
  let entered!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  let calls = 0;
  f.data.register({
    id: 'daily',
    languages: ['en-US'],
    accounts: () => [],
    steps: () => [],
    clear: async () => {
      calls++;
      entered();
      await held;
    },
  });
  const manual = f.data.reset('admin', undefined, { wait: true });
  await started;
  try {
    await expect(f.run()).rejects.toMatchObject({ reason: 'DEMO_DATA_BUSY' });
    expect(await f.row()).toMatchObject({ state: 'retry', attempt: 1 });
    expect(calls).toBe(1);
  } finally {
    release();
    await manual;
  }
  vi.setSystemTime(new Date('2026-10-29T03:05:00Z'));
  await f.run();
  expect(await f.row()).toMatchObject({ state: 'succeeded', attempt: 2 });
  expect(calls).toBe(2);
});

it('blocks later days after an uncertain owner and resumes only after manual recovery', async () => {
  const f = await fixture();
  await f.config.claimDaily(new Date());
  vi.setSystemTime(new Date('2026-10-30T03:00:00Z'));
  await expect(f.run()).rejects.toThrow('unresolved');
  expect(await f.row()).toMatchObject({ state: 'interrupted' });
  expect(f.generations()).toBe(1);
  // The operator has stopped the previous process before using the normal manual reset path.
  await f.data.reset('admin', undefined, { wait: true });
  expect(await f.row()).toMatchObject({ state: 'recovered' });
  await f.run();
  expect(f.generations()).toBe(3);
});
