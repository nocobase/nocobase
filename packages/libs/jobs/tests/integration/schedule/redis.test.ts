import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

import { Queue } from 'bullmq';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createJobExecutorService,
  type ManagedJobExecutorService,
  type RedisJobsAdapterConfig,
  type ScheduleEvent,
  type ScheduleExecutionContext,
  type ScheduleExecutor,
  type ScheduleJob,
} from '../../../src/index.js';

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT ?? 6379),
};
const SCOPE = '@nocobase/app-plugin-scheduler';

const services: ManagedJobExecutorService[] = [];
const queues: Queue[] = [];

afterEach(async () => {
  await Promise.allSettled(services.splice(0).map((each) => each.shutdown()));
  await Promise.allSettled(queues.splice(0).map((each) => each.close()));
});

/** One application instance: its own service, and so its own Queue and Worker connections. */
function instance(
  namespace: string,
  overrides: Partial<RedisJobsAdapterConfig> = {},
): ScheduleExecutor {
  const service = createJobExecutorService(
    {
      default: 'redis',
      redis: { adapter: 'redis', connection, namespace, ...overrides },
    },
    { appName: 'unused', storagePath: '/nonexistent' },
  );
  services.push(service);
  return service.getScheduleExecutor(SCOPE);
}

/** A raw BullMQ queue on the same queue, to show what BullMQ itself does. */
function rawQueue(namespace: string): Queue {
  const queue = new Queue(SCOPE, { connection, prefix: namespace });
  queues.push(queue);
  return queue;
}

function newNamespace(): string {
  return `schedule-test-${randomUUID()}`;
}

function job(
  execute: ScheduleJob['execute'],
  options: ScheduleJob['options'],
  payload: unknown = { target: 'report' },
  name = 'job-1',
): ScheduleJob {
  return { name, options, payload, execute };
}

function record(executor: ScheduleExecutor): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];
  executor.subscribe(async (event) => {
    events.push(event);
  });
  return events;
}

const until = (assertion: () => void, timeout = 10_000) =>
  vi.waitFor(assertion, { timeout, interval: 50 });

function expectNear(actual: Date | undefined, expected: number): void {
  expect(actual).toBeInstanceOf(Date);
  expect(Math.abs(actual!.getTime() - expected)).toBeLessThanOrEqual(50);
}

/** The next instant at the given second boundary, at least `margin` ms away. */
function nextSecondBoundary(every: number, margin: number): number {
  let at = Math.ceil(Date.now() / 1000) * 1000;
  while (at % every !== 0 || at - Date.now() < margin) at += 1000;
  return at;
}

describe('redis adapter against a real Redis', { timeout: 60_000 }, () => {
  it('runs each firing on exactly one of several instances', async () => {
    const namespace = newNamespace();
    const runs: { instance: number; jobId: string }[] = [];
    const starts: ScheduleEvent[][] = [];
    const executors = [0, 1, 2].map((index) => {
      const executor = instance(namespace);
      starts.push(record(executor));
      return { index, executor };
    });
    for (const { index, executor } of executors) {
      await executor.addJob(
        job(
          async (context) => {
            runs.push({ instance: index, jobId: context.jobId });
          },
          { every: 300 },
        ),
      );
    }
    await Promise.all(executors.map(({ executor }) => executor.setup()));

    await until(() => expect(runs.length).toBeGreaterThanOrEqual(8));
    await Promise.all(services.map((service) => service.shutdown()));

    const ids = runs.map((run) => run.jobId);
    expect(new Set(ids).size).toBe(ids.length);
    const started = starts
      .flat()
      .filter((event) => event.name === 'ScheduleStart');
    expect(started.map((event) => event.jobId).sort()).toEqual([...ids].sort());
    // Each instance hears only what it ran.
    for (const { index } of executors) {
      expect(
        starts[index]!.filter((event) => event.name === 'ScheduleStart')
          .map((event) => event.jobId)
          .sort(),
      ).toEqual(
        runs
          .filter((run) => run.instance === index)
          .map((run) => run.jobId)
          .sort(),
      );
    }
  });

  it('keeps the rule across a shutdown and continues on the next instance', async () => {
    const namespace = newNamespace();
    const first = instance(namespace);
    const firstRuns: string[] = [];
    await first.addJob(
      job(
        async (context) => {
          firstRuns.push(context.jobId);
        },
        { every: 300 },
      ),
    );
    await first.setup();
    await until(() => expect(firstRuns.length).toBeGreaterThanOrEqual(2));
    await services[0]!.shutdown();

    const second = instance(namespace);
    const secondRuns: string[] = [];
    await second.setup({ consume: false });
    await expect(second.getJob('job-1')).resolves.toMatchObject({
      jobName: 'job-1',
      options: { every: 300 },
      payload: { target: 'report' },
      nextRunAt: expect.any(Date),
    });
    const third = instance(namespace);
    await third.addJob(
      job(
        async (context) => {
          secondRuns.push(context.jobId);
        },
        { every: 300 },
      ),
    );
    await third.setup();
    await until(() => expect(secondRuns.length).toBeGreaterThanOrEqual(2));

    expect(secondRuns.some((id) => firstRuns.includes(id))).toBe(false);
  });

  it('reports the planned time of each firing, the receipt, and the next one', async () => {
    const namespace = newNamespace();
    const executor = instance(namespace);
    const contexts: ScheduleExecutionContext[] = [];
    const events = record(executor);
    await executor.setup();

    const receipt = await executor.addJob(
      job(
        async (context) => {
          contexts.push(context);
        },
        { cron: '* * * * * *' },
      ),
    );
    await until(() => expect(contexts.length).toBeGreaterThanOrEqual(3));
    await services[0]!.shutdown();

    expect(contexts[0]!.scheduledAt).toEqual(receipt.scheduledAt);
    for (const context of contexts) {
      expect(context.scheduledAt.getTime() % 1000).toBe(0);
      expect(context.runAt.getTime()).toBeGreaterThanOrEqual(
        context.scheduledAt.getTime(),
      );
    }
    expect(contexts[0]!.nextRunAt).toEqual(contexts[1]!.scheduledAt);
    expect(contexts[1]!.nextRunAt).toEqual(contexts[2]!.scheduledAt);
    const start = events.find(
      (event) =>
        event.name === 'ScheduleStart' && event.jobId === contexts[0]!.jobId,
    );
    expect(start).toMatchObject({
      scheduledAt: contexts[0]!.scheduledAt,
      nextRunAt: contexts[0]!.nextRunAt,
    });
  });

  it('skips an unchanged write and keeps a firing that is already due', async () => {
    const namespace = newNamespace();
    const options = { cron: '*/2 * * * * *' };
    const writer = instance(namespace);
    await writer.setup({ consume: false });
    const written = await writer.addJob(job(async () => undefined, options));
    const planned = written.scheduledAt!.getTime();
    // Nothing consumes, so the firing becomes due and stays queued.
    await sleep(planned - Date.now() + 300);

    // The order an application starts in: register, then setup() writes.
    const consumer = instance(namespace);
    const contexts: ScheduleExecutionContext[] = [];
    const pending = await consumer.addJob(
      job(async (context) => {
        contexts.push(context);
      }, options),
    );
    await consumer.setup();
    await until(() => expect(contexts.length).toBeGreaterThanOrEqual(1));

    // Nothing is written before setup(), so there is no planned time yet.
    expect(pending).not.toHaveProperty('scheduledAt');
    // A rewrite would have dropped the due firing and planned one from now.
    expect(contexts[0]!.scheduledAt).toEqual(new Date(planned));
    const repeated = await consumer.addJob(job(async () => undefined, options));
    expect(repeated.scheduledAt!.getTime()).toBeGreaterThan(planned);
  });

  it('keeps the planned slot of an interval rule rewritten with the same interval', async () => {
    const namespace = newNamespace();
    const writer = instance(namespace);
    await writer.setup({ consume: false });
    const planned = nextSecondBoundary(2000, 600);
    const options = { every: 2000, startDate: new Date(planned) };
    const written = await writer.addJob(job(async () => undefined, options));
    // BullMQ derives an interval job's timestamp and delay from two clock
    // readings, so their sum can be a few milliseconds early.
    expectNear(written.scheduledAt, planned);
    await sleep(planned - Date.now() + 300);

    const rewritten = await writer.addJob(
      job(async () => undefined, options, { target: 'changed' }),
    );

    await expect(writer.getJob('job-1')).resolves.toMatchObject({
      payload: { target: 'changed' },
      nextRunAt: new Date(planned),
    });
    expect(rewritten.scheduledAt).toBeInstanceOf(Date);
  });

  it('replaces a due firing when the rule changes, which is why unchanged writes are skipped', async () => {
    const namespace = newNamespace();
    const writer = instance(namespace);
    await writer.setup({ consume: false });
    const first = await writer.addJob(
      job(async () => undefined, { cron: '*/2 * * * * *' }),
    );
    await sleep(first.scheduledAt!.getTime() - Date.now() + 300);

    const replaced = await writer.addJob(
      job(
        async () => undefined,
        { cron: '*/2 * * * * *' },
        {
          target: 'changed',
        },
      ),
    );
    const consumer = instance(namespace);
    const contexts: ScheduleExecutionContext[] = [];
    await consumer.addJob(
      job(
        async (context) => {
          contexts.push(context);
        },
        { cron: '*/2 * * * * *' },
        { target: 'changed' },
      ),
    );
    await consumer.setup();
    await until(() => expect(contexts.length).toBeGreaterThanOrEqual(1));

    // The due firing was dropped and the next one planned from now.
    expect(replaced.scheduledAt!.getTime()).toBeGreaterThan(
      first.scheduledAt!.getTime(),
    );
    expect(contexts[0]!.scheduledAt).toEqual(replaced.scheduledAt);
    await expect(consumer.getJob('job-1')).resolves.toMatchObject({
      payload: { target: 'changed' },
    });
  });

  it('fires immediately once, not on every later addJob', async () => {
    const namespace = newNamespace();
    const runs: string[] = [];
    const yearly = (id: number) =>
      job(
        async (context) => {
          runs.push(`${id}:${context.jobId}`);
        },
        { cron: '0 0 1 1 *', immediately: true },
      );
    const first = instance(namespace);
    await first.addJob(yearly(1));
    await first.setup();
    await until(() => expect(runs).toHaveLength(1));
    await services[0]!.shutdown();

    const second = instance(namespace);
    await second.addJob(yearly(2));
    await second.setup();
    await sleep(1500);

    expect(runs).toHaveLength(1);
  });

  it('shows that BullMQ itself fires immediately on every upsert', async () => {
    const namespace = newNamespace();
    const queue = rawQueue(namespace);
    const template = { name: 'raw', data: {} };

    const first = await queue.upsertJobScheduler(
      'raw',
      { pattern: '0 0 1 1 *', tz: 'UTC', immediately: true },
      template,
    );
    const second = await queue.upsertJobScheduler(
      'raw',
      { pattern: '0 0 1 1 *', tz: 'UTC', immediately: true },
      template,
    );

    // Both upserts planned a firing for now rather than for 1 January.
    for (const planned of [first!, second!]) {
      expect(planned.timestamp + (planned.opts.delay ?? 0)).toBeLessThan(
        Date.now() + 1000,
      );
    }
    expect(second!.id).not.toBe(first!.id);
  });

  it('lets another instance re-add a removed job and run it on the handler kept by the remover', async () => {
    const namespace = newNamespace();
    const consumer = instance(namespace);
    const runs: string[] = [];
    await consumer.addJob(
      job(
        async (context) => {
          runs.push(context.jobId);
        },
        { cron: '0 0 1 1 *' },
      ),
    );
    await consumer.setup();

    await expect(consumer.removeJob('job-1')).resolves.toMatchObject({
      code: 2000,
    });
    await expect(consumer.getJob('job-1')).resolves.toBeUndefined();
    await expect(consumer.removeJob('job-1')).resolves.toMatchObject({
      code: 3000,
    });

    const writer = instance(namespace);
    await writer.setup({ consume: false });
    await writer.addJob(job(async () => undefined, { every: 300 }));

    await until(() => expect(runs.length).toBeGreaterThanOrEqual(1));
  });

  it('fails a firing without a handler once, without retrying', async () => {
    const namespace = newNamespace();
    const writer = instance(namespace, { attempts: 3 });
    await writer.setup({ consume: false });
    await writer.addJob(
      job(async () => undefined, { cron: '0 0 1 1 *', immediately: true }),
    );

    const consumer = instance(namespace, { attempts: 3 });
    const events = record(consumer);
    await consumer.setup();
    await until(() => expect(events).toHaveLength(2));
    await sleep(1000);

    expect(events.map((event) => [event.name, event.reason])).toEqual([
      ['ScheduleStart', undefined],
      ['ScheduleError', 'handler-not-registered'],
    ]);
  });

  it('retries a failing handler up to attempts on the same firing', async () => {
    const namespace = newNamespace();
    const executor = instance(namespace, { attempts: 3 });
    const ids: string[] = [];
    const events = record(executor);
    await executor.addJob(
      job(
        async (context) => {
          ids.push(context.jobId);
          if (ids.length < 3) throw new Error(`failure ${ids.length}`);
        },
        { cron: '0 0 1 1 *', immediately: true },
      ),
    );
    await executor.setup();
    await until(() => expect(ids).toHaveLength(3));
    await until(() =>
      expect(events.map((event) => event.name)).toContain('ScheduleEnd'),
    );

    expect(new Set(ids).size).toBe(1);
    expect(events.map((event) => [event.name, event.reason])).toEqual([
      ['ScheduleStart', undefined],
      ['ScheduleError', 'execute-failed'],
      ['ScheduleStart', undefined],
      ['ScheduleError', 'execute-failed'],
      ['ScheduleStart', undefined],
      ['ScheduleEnd', undefined],
    ]);
  });

  it('waits for a running handler on shutdown and aborts its signal', async () => {
    const namespace = newNamespace();
    const executor = instance(namespace);
    let started = false;
    let aborted = false;
    let finished = false;
    await executor.addJob(
      job(
        async ({ signal }) => {
          started = true;
          signal.addEventListener('abort', () => {
            aborted = true;
          });
          await sleep(1000);
          finished = true;
        },
        { cron: '0 0 1 1 *', immediately: true },
      ),
    );
    await executor.setup();
    await until(() => expect(started).toBe(true));

    await services[0]!.shutdown();

    expect(aborted).toBe(true);
    expect(finished).toBe(true);
  });

  it('stops after limit firings and restarts the count when the rule is rewritten', async () => {
    const namespace = newNamespace();
    const executor = instance(namespace);
    const runs: string[] = [];
    const contexts: ScheduleExecutionContext[] = [];
    const limited = (payload: unknown) =>
      job(
        async (context) => {
          runs.push(context.jobId);
          contexts.push(context);
        },
        { every: 300, limit: 2 },
        payload,
      );
    await executor.addJob(limited({ version: 1 }));
    await executor.setup();
    await until(() => expect(runs).toHaveLength(2));
    await sleep(1000);
    expect(runs).toHaveLength(2);
    expect(contexts[0]!.nextRunAt).toBeInstanceOf(Date);
    // The last firing allowed by limit has no firing after it.
    expect(contexts[1]).not.toHaveProperty('nextRunAt');
    const exhausted = await executor.getJob('job-1');

    await executor.addJob(limited({ version: 2 }));
    await until(() => expect(runs).toHaveLength(4));
    await sleep(1000);

    expect(runs).toHaveLength(4);
    // Recorded for the plan: what a scheduler looks like once its limit is spent.
    console.info('scheduler after limit', JSON.stringify(exhausted ?? null));
  });

  it('removes a rule whose end date has passed instead of letting BullMQ reject it', async () => {
    const namespace = newNamespace();
    const executor = instance(namespace);
    await executor.setup({ consume: false });
    await executor.addJob(job(async () => undefined, { cron: '0 0 1 1 *' }));
    await expect(
      rawQueue(namespace).upsertJobScheduler(
        'raw',
        { pattern: '0 0 1 1 *', endDate: new Date(Date.now() - 1000) },
        { name: 'raw' },
      ),
    ).rejects.toThrow(/End date must be greater than current timestamp/u);

    const receipt = await executor.addJob(
      job(async () => undefined, {
        cron: '0 0 1 1 *',
        endDate: new Date(Date.now() - 1000),
      }),
    );

    expect(receipt).toMatchObject({ code: 1000 });
    expect(receipt).not.toHaveProperty('scheduledAt');
    await expect(executor.getJob('job-1')).resolves.toBeUndefined();
  });

  it('plans the first interval firing', async () => {
    const namespace = newNamespace();
    const executor = instance(namespace);
    await executor.setup({ consume: false });
    const before = Date.now();

    const receipt = await executor.addJob(
      job(async () => undefined, { every: 60_000 }),
    );

    console.info(
      'first every firing relative to addJob (ms)',
      receipt.scheduledAt!.getTime() - before,
    );
    expect(receipt.scheduledAt).toBeInstanceOf(Date);
  });

  it('counts and lists job schedulers by next firing', async () => {
    const namespace = newNamespace();
    const executor = instance(namespace);
    await executor.setup({ consume: false });
    for (const [name, cron] of [
      ['c', '0 3 1 1 *'],
      ['a', '0 1 1 1 *'],
      ['b', '0 2 1 1 *'],
    ] as const) {
      await executor.addJob(job(async () => undefined, { cron }, null, name));
    }

    await expect(executor.countJob()).resolves.toBe(3);
    expect((await executor.listJob(0, -1)).map((each) => each.jobName)).toEqual(
      ['a', 'b', 'c'],
    );
    expect((await executor.listJob(1, 1)).map((each) => each.jobName)).toEqual([
      'b',
    ]);
  });
});
