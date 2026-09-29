import {
  chmod,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ResolvedMemoryJobsConfig } from '../../../src/config.js';
import { createMemoryScheduleExecutor } from '../../../src/schedule/memory/index.js';
import type {
  ScheduleEvent,
  ScheduleExecutionContext,
  ScheduleExecutor,
  ScheduleJob,
} from '../../../src/schedule/types.js';

let directory: string;
const executors: ScheduleExecutor[] = [];

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'nocobase-schedule-'));
});

afterEach(async () => {
  vi.useRealTimers();
  await Promise.allSettled(executors.splice(0).map((each) => each.shutdown()));
  await chmod(directory, 0o755).catch(() => undefined);
  await rm(directory, { recursive: true, force: true });
});

function config(
  overrides: Partial<ResolvedMemoryJobsConfig> = {},
): ResolvedMemoryJobsConfig {
  return {
    adapter: 'memory',
    key: 'memory',
    builtIn: false,
    scope: '@nocobase/app-plugin-scheduler',
    namespace: 'crm',
    concurrency: 1,
    attempts: 1,
    persistencePath: directory,
    ...overrides,
  };
}

function fakeLogger() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function create(
  overrides: Partial<ResolvedMemoryJobsConfig> = {},
  options: { logger?: ReturnType<typeof fakeLogger> } = {},
): ScheduleExecutor {
  const executor = createMemoryScheduleExecutor(config(overrides), {
    logger: options.logger ?? fakeLogger(),
  });
  executors.push(executor);
  return executor;
}

function everyJob(
  execute: ScheduleJob['execute'],
  overrides: Partial<ScheduleJob> = {},
): ScheduleJob {
  return {
    name: 'job-1',
    options: { every: 40 },
    payload: { target: 'report' },
    execute,
    ...overrides,
  };
}

function record(executor: ScheduleExecutor): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];
  executor.subscribe(async (event) => {
    events.push(event);
  });
  return events;
}

const stateFile = () =>
  path.join(directory, 'crm.%40nocobase%2Fapp-plugin-scheduler.json');
const readState = async () =>
  JSON.parse(await readFile(stateFile(), 'utf8')) as {
    version: number;
    jobs: Record<string, { fired: number; nextRunAt: number | null }>;
  };

describe('InMemoryScheduler', () => {
  it('names its state file by namespace and scope and writes it only on shutdown', async () => {
    const executor = create();
    await executor.addJob(everyJob(async () => undefined));
    await executor.setup({ consume: false });
    await executor.addJob(everyJob(async () => undefined, { name: 'job-2' }));

    expect(await readdir(directory)).toEqual([]);

    await executor.shutdown();
    expect(await readdir(directory)).toEqual([path.basename(stateFile())]);
    await expect(readState()).resolves.toMatchObject({
      version: 1,
      jobs: { 'job-1': { fired: 0 }, 'job-2': { fired: 0 } },
    });
  });

  it('runs a job with its context and reports start and end events', async () => {
    const contexts: ScheduleExecutionContext[] = [];
    const executor = create();
    const events = record(executor);
    await executor.addJob(
      everyJob(async (context) => {
        contexts.push(context);
      }),
    );

    await executor.setup();
    await vi.waitFor(() => expect(contexts.length).toBeGreaterThanOrEqual(2));
    await executor.shutdown();

    const [first, second] = contexts;
    expect(first!.jobId).not.toBe(second!.jobId);
    expect(second!.scheduledAt.getTime() - first!.scheduledAt.getTime()).toBe(
      40,
    );
    expect(first!.nextRunAt).toEqual(second!.scheduledAt);
    expect(first!.runAt.getTime()).toBeGreaterThanOrEqual(
      first!.scheduledAt.getTime(),
    );
    expect(first!.signal).toBeInstanceOf(AbortSignal);
    expect(events.slice(0, 2)).toEqual([
      expect.objectContaining({
        name: 'ScheduleStart',
        jobId: first!.jobId,
        jobName: 'job-1',
        scheduledAt: first!.scheduledAt,
        nextRunAt: first!.nextRunAt,
      }),
      expect.objectContaining({ name: 'ScheduleEnd', jobId: first!.jobId }),
    ]);
  });

  it('derives the same jobId from the same job and planned time', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    const ids: string[] = [];
    const executor = create();
    await executor.addJob(
      everyJob(
        async (context) => {
          ids.push(context.jobId);
        },
        { options: { every: 3_600_000 } },
      ),
    );
    await executor.setup();
    await vi.waitFor(() => expect(ids).toHaveLength(1));
    await executor.shutdown();

    const state = await readState();
    const planned = Date.parse('2030-01-01T00:00:00Z');
    expect(ids[0]).toBe(`job-1:${planned}`);
    expect(state.jobs['job-1']).toMatchObject({
      fired: 1,
      nextRunAt: planned + 3_600_000,
    });
  });

  it('returns the planned firing in receipts and skips unchanged writes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-01T00:00:30Z'));
    const executor = create();
    await executor.setup({ consume: false });
    const hourly: ScheduleJob = {
      name: 'hourly',
      options: { cron: '0 * * * *', tz: 'Asia/Shanghai' },
      payload: { a: 1 },
      execute: async () => undefined,
    };

    const created = await executor.addJob(hourly);
    vi.setSystemTime(new Date('2030-01-01T00:30:00Z'));
    const repeated = await executor.addJob({ ...hourly, payload: { a: 1 } });

    expect(created).toEqual({
      jobName: 'hourly',
      code: 1000,
      message: 'Job upserted',
      scheduledAt: new Date('2030-01-01T01:00:00Z'),
    });
    expect(repeated).toEqual(created);
    await expect(executor.getJob('hourly')).resolves.toEqual({
      jobName: 'hourly',
      options: { cron: '0 * * * *', tz: 'Asia/Shanghai' },
      payload: { a: 1 },
      nextRunAt: new Date('2030-01-01T01:00:00Z'),
    });
    await executor.shutdown();
    expect((await readState()).jobs.hourly).toMatchObject({
      nextRunAt: Date.parse('2030-01-01T01:00:00Z'),
      fired: 0,
    });
  });

  it('fires immediately only when the job is created', async () => {
    const runs: ScheduleExecutionContext[] = [];
    const job: ScheduleJob = {
      name: 'daily',
      options: { cron: '0 0 * * *', immediately: true },
      payload: {},
      execute: async (context) => {
        runs.push(context);
      },
    };
    const first = create();
    await first.addJob(job);
    await first.setup();
    await vi.waitFor(() => expect(runs).toHaveLength(1));
    await first.shutdown();

    const second = create();
    await second.addJob(job);
    await second.setup();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await second.shutdown();

    expect(runs).toHaveLength(1);
    expect(runs[0]!.nextRunAt!.getUTCHours()).toBe(0);
  });

  it('stops after limit firings and restarts the count when the rule changes', async () => {
    const runs: string[] = [];
    const executor = create();
    const job = everyJob(
      async (context) => {
        runs.push(context.jobId);
      },
      { options: { every: 20, limit: 2 } },
    );
    await executor.addJob(job);
    await executor.setup();
    await vi.waitFor(() => expect(runs).toHaveLength(2));
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(runs).toHaveLength(2);
    await expect(executor.getJob('job-1')).resolves.not.toHaveProperty(
      'nextRunAt',
    );

    await executor.addJob({ ...job, options: { every: 20, limit: 1 } });
    await vi.waitFor(() => expect(runs).toHaveLength(3));
  });

  it('does not fire before startDate or after endDate', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    const executor = create();
    await executor.setup({ consume: false });

    await expect(
      executor.addJob(
        everyJob(async () => undefined, {
          name: 'later',
          options: {
            cron: '*/10 * * * *',
            startDate: new Date('2030-01-02T00:00:00Z'),
          },
        }),
      ),
    ).resolves.toMatchObject({
      scheduledAt: new Date('2030-01-02T00:10:00Z'),
    });
    await expect(
      executor.addJob(
        everyJob(async () => undefined, {
          name: 'ended',
          options: {
            cron: '*/10 * * * *',
            startDate: new Date('2029-01-01T00:00:00Z'),
            endDate: new Date('2029-12-31T00:00:00Z'),
          },
        }),
      ),
    ).resolves.not.toHaveProperty('scheduledAt');
    await expect(executor.getJob('ended')).resolves.toBeUndefined();
  });

  it('lists jobs by next firing and counts them', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    const executor = create();
    await executor.setup({ consume: false });
    for (const [name, cron] of [
      ['c', '0 3 * * *'],
      ['a', '0 1 * * *'],
      ['b', '0 2 * * *'],
    ] as const) {
      await executor.addJob({
        name,
        options: { cron },
        payload: null,
        execute: async () => undefined,
      });
    }

    await expect(executor.countJob()).resolves.toBe(3);
    expect((await executor.listJob(0, -1)).map((each) => each.jobName)).toEqual(
      ['a', 'b', 'c'],
    );
    expect((await executor.listJob(1, 1)).map((each) => each.jobName)).toEqual([
      'b',
    ]);
  });

  it('removes the rule and its planned firing', async () => {
    const runs: string[] = [];
    const executor = create();
    await executor.addJob(
      everyJob(
        async (context) => {
          runs.push(context.jobId);
        },
        { options: { every: 30 } },
      ),
    );
    await executor.setup();
    await vi.waitFor(() => expect(runs.length).toBeGreaterThanOrEqual(1));

    await expect(executor.removeJob('job-1')).resolves.toMatchObject({
      code: 2000,
    });
    const count = runs.length;
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(runs).toHaveLength(count);
    await expect(executor.getJob('job-1')).resolves.toBeUndefined();
    await executor.shutdown();
    expect((await readState()).jobs).toEqual({});
  });

  it('runs a missed firing once after a restart, then plans from now', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-01T00:00:30Z'));
    const first = create();
    await first.addJob({
      name: 'minutely',
      options: { cron: '* * * * *' },
      payload: {},
      execute: async () => undefined,
    });
    await first.setup({ consume: false });
    await first.shutdown();

    vi.setSystemTime(new Date('2030-01-01T00:10:30Z'));
    const runs: ScheduleExecutionContext[] = [];
    const second = create();
    await second.addJob({
      name: 'minutely',
      options: { cron: '* * * * *' },
      payload: {},
      execute: async (context) => {
        runs.push(context);
      },
    });
    await second.setup();
    await vi.waitFor(() => expect(runs).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(runs).toHaveLength(1);
    expect(runs[0]!.scheduledAt).toEqual(new Date('2030-01-01T00:01:00Z'));
    expect(runs[0]!.nextRunAt).toEqual(new Date('2030-01-01T00:11:00Z'));
  });

  it('keeps an interval rule on its phase after a restart', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    const hour = 3_600_000;
    const first = create();
    await first.addJob(
      everyJob(async () => undefined, { options: { every: hour } }),
    );
    await first.setup({ consume: false });
    await first.shutdown();

    vi.setSystemTime(new Date('2030-01-01T05:30:00Z'));
    const runs: ScheduleExecutionContext[] = [];
    const second = create();
    await second.addJob(
      everyJob(
        async (context) => {
          runs.push(context);
        },
        { options: { every: hour } },
      ),
    );
    await second.setup();
    await vi.waitFor(() => expect(runs).toHaveLength(1));

    expect(runs[0]!.scheduledAt).toEqual(new Date('2030-01-01T00:00:00Z'));
    expect(runs[0]!.nextRunAt).toEqual(new Date('2030-01-01T06:00:00Z'));
  });

  it('retries a failing firing up to attempts and reports each failure', async () => {
    const attempts: string[] = [];
    const executor = create({ attempts: 3 });
    const events = record(executor);
    await executor.addJob(
      everyJob(
        async (context) => {
          attempts.push(context.jobId);
          if (attempts.length < 3)
            throw new Error(`failure ${attempts.length}`);
        },
        { options: { every: 3_600_000 } },
      ),
    );
    await executor.setup();
    await vi.waitFor(() => expect(attempts).toHaveLength(3));
    await executor.shutdown();

    expect(new Set(attempts).size).toBe(1);
    expect(events.map((event) => [event.name, event.reason])).toEqual([
      ['ScheduleStart', undefined],
      ['ScheduleError', 'execute-failed'],
      ['ScheduleStart', undefined],
      ['ScheduleError', 'execute-failed'],
      ['ScheduleStart', undefined],
      ['ScheduleEnd', undefined],
    ]);
    expect(events[1]!.error?.message).toBe('failure 1');
  });

  it('fails a firing without a handler once, without retrying', async () => {
    const first = create();
    await first.addJob(
      everyJob(async () => undefined, { options: { every: 3_600_000 } }),
    );
    await first.setup({ consume: false });
    await first.shutdown();

    const second = create({ attempts: 3 });
    const events = record(second);
    await second.setup();
    await vi.waitFor(() => expect(events).toHaveLength(2));
    await new Promise((resolve) => setTimeout(resolve, 30));
    await second.shutdown();

    expect(events.map((event) => [event.name, event.reason])).toEqual([
      ['ScheduleStart', undefined],
      ['ScheduleError', 'handler-not-registered'],
    ]);
  });

  it('runs a disabled job registered with registerOnly when its rule fires', async () => {
    const first = create();
    await first.addJob(
      everyJob(async () => undefined, { options: { every: 3_600_000 } }),
    );
    await first.setup({ consume: false });
    await first.shutdown();

    const runs: string[] = [];
    const second = create();
    await expect(
      second.addJob(
        everyJob(
          async (context) => {
            runs.push(context.jobId);
          },
          { payload: { changed: true } },
        ),
        true,
      ),
    ).resolves.toMatchObject({ code: 4000 });
    await second.setup();
    await vi.waitFor(() => expect(runs).toHaveLength(1));

    await expect(second.getJob('job-1')).resolves.toMatchObject({
      payload: { target: 'report' },
    });
  });

  it('limits handlers running at once to the concurrency', async () => {
    let active = 0;
    let peak = 0;
    const slow = async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 40));
      active -= 1;
    };
    for (const concurrency of [1, 2]) {
      peak = 0;
      const executor = create({ concurrency, scope: `scope-${concurrency}` });
      for (const name of ['a', 'b', 'c']) {
        await executor.addJob({
          name,
          options: { every: 3_600_000 },
          payload: null,
          execute: slow,
        });
      }
      await executor.setup();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await executor.shutdown();
      expect(peak).toBe(concurrency);
    }
  });

  it('aborts running handlers on shutdown and waits for them', async () => {
    let finished = false;
    const executor = create();
    await executor.addJob(
      everyJob(
        async ({ signal }) => {
          await new Promise<void>((resolve) =>
            signal.addEventListener('abort', () => resolve()),
          );
          await new Promise((resolve) => setTimeout(resolve, 20));
          finished = true;
        },
        { options: { every: 3_600_000 } },
      ),
    );
    await executor.setup();
    await new Promise((resolve) => setTimeout(resolve, 30));

    await executor.shutdown();

    expect(finished).toBe(true);
    await executor.shutdown();
  });

  it('fires a firing planned further out than a timer can wait', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    const runs: ScheduleExecutionContext[] = [];
    const executor = create();
    const startDate = new Date('2030-02-15T00:00:00Z');
    await executor.addJob(
      everyJob(
        async (context) => {
          runs.push(context);
        },
        { options: { every: 3_600_000, startDate } },
      ),
    );
    await executor.setup();

    // 2^31 ms is about 24.8 days; this firing is 45 days away.
    await vi.advanceTimersByTimeAsync(44 * 86_400_000);
    expect(runs).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(86_400_000);
    await vi.waitFor(() => expect(runs).toHaveLength(1));
    expect(runs[0]!.scheduledAt).toEqual(startDate);
  });

  it('keeps rules across shutdown and setup', async () => {
    const first = create();
    await first.addJob(
      everyJob(async () => undefined, { options: { every: 3_600_000 } }),
    );
    await first.setup({ consume: false });
    await first.shutdown();

    const second = create();
    await second.setup({ consume: false });

    await expect(second.countJob()).resolves.toBe(1);
  });

  it('refuses a state file of an unknown version', async () => {
    await writeFile(stateFile(), JSON.stringify({ version: 99, jobs: {} }));
    const executor = create();

    await expect(executor.setup()).rejects.toThrow(/format version 99/u);
    // A refused setup leaves the file it could not read alone.
    await executor.shutdown();
    expect(JSON.parse(await readFile(stateFile(), 'utf8'))).toEqual({
      version: 99,
      jobs: {},
    });
  });

  it('refuses a state file that is not JSON', async () => {
    await writeFile(stateFile(), '{');

    await expect(create().setup()).rejects.toThrow(/not valid JSON/u);
  });

  it('fails shutdown when the state cannot be written, after stopping', async () => {
    let runs = 0;
    const executor = create();
    await executor.addJob(
      everyJob(
        async () => {
          runs += 1;
        },
        { options: { every: 3_600_000 } },
      ),
    );
    await executor.setup();
    await vi.waitFor(() => expect(runs).toBe(1));
    await chmod(directory, 0o500);

    await expect(executor.shutdown()).rejects.toThrow(
      /Failed to write schedule state file/u,
    );
    await chmod(directory, 0o755);
    expect(await readdir(directory)).toEqual([]);
  });

  it('fails setup when the persistence path is not a directory', async () => {
    const blocked = path.join(directory, 'not-a-directory');
    await writeFile(blocked, '');
    const executor = create({ persistencePath: blocked });
    await executor.addJob(everyJob(async () => undefined));

    await expect(executor.setup()).rejects.toThrow();
  });

  describe('the state file', () => {
    it('loses what changed since startup when the process ends without shutting down', async () => {
      const first = create();
      await first.addJob(everyJob(async () => undefined));
      await first.setup({ consume: false });
      await first.shutdown();

      // A process that is killed never reaches shutdown().
      const killed = create();
      await killed.setup({ consume: false });
      await killed.addJob(everyJob(async () => undefined, { name: 'job-2' }));
      await killed.removeJob('job-1');

      const next = create();
      await next.setup({ consume: false });
      expect((await next.listJob(0, -1)).map((job) => job.jobName)).toEqual([
        'job-1',
      ]);
    });

    it('is overwritten whole by the process that shuts down last', async () => {
      const seed = create();
      await seed.addJob(everyJob(async () => undefined));
      await seed.setup({ consume: false });
      await seed.shutdown();

      const earlier = create();
      const later = create();
      await earlier.setup({ consume: false });
      await later.setup({ consume: false });
      await earlier.addJob(
        everyJob(async () => undefined, { name: 'from-earlier' }),
      );
      await earlier.shutdown();
      await later.shutdown();

      expect(Object.keys((await readState()).jobs)).toEqual(['job-1']);
    });
  });
});
