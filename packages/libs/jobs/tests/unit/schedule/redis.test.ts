import { UnrecoverableError, type Job, type JobSchedulerJson } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import type { ResolvedRedisJobsConfig } from '../../../src/config.js';
import { ScheduleHandlerNotRegisteredError } from '../../../src/schedule/executor.js';
import type {
  RedisScheduleBackendFactories,
  ScheduleProcessor,
  ScheduleQueue,
  ScheduleWorker,
} from '../../../src/schedule/redis/backend.js';
import { createRedisScheduleExecutor } from '../../../src/schedule/redis/index.js';
import type {
  ScheduleEvent,
  ScheduleExecutionContext,
  ScheduleJob,
} from '../../../src/schedule/types.js';

type Listener = (...args: unknown[]) => void;

/** A double of the public Queue methods, keeping schedulers in a map. */
class FakeQueue {
  public readonly schedulers = new Map<string, JobSchedulerJson>();
  public readonly calls: unknown[][] = [];
  public now = Date.parse('2030-01-01T00:00:00Z');
  public planned = Date.parse('2030-01-01T01:00:00Z');
  public upsertResult: 'job' | 'none' = 'job';
  public readonly listeners = new Map<string, Listener>();

  public upsertJobScheduler = vi.fn(
    async (
      id: string,
      repeat: Record<string, unknown>,
      template: { name: string; data: unknown; opts: Record<string, unknown> },
    ) => {
      this.calls.push(['upsert', id, repeat, template]);
      if (this.upsertResult === 'none') {
        this.schedulers.delete(id);
        return undefined;
      }
      this.schedulers.set(id, {
        key: id,
        name: template.name,
        ...(repeat.pattern ? { pattern: repeat.pattern as string } : {}),
        ...(repeat.every ? { every: repeat.every as number } : {}),
        ...(repeat.limit ? { limit: repeat.limit as number } : {}),
        ...(repeat.tz ? { tz: repeat.tz as string } : {}),
        ...(repeat.startDate
          ? { startDate: (repeat.startDate as Date).getTime() }
          : {}),
        ...(repeat.endDate
          ? { endDate: (repeat.endDate as Date).getTime() }
          : {}),
        next: this.planned,
        template: {
          data: JSON.parse(JSON.stringify(template.data ?? null)),
          opts: JSON.parse(JSON.stringify(template.opts)),
        },
      });
      return {
        id: `opaque-${id}`,
        timestamp: this.now,
        delay: this.planned - this.now,
        opts: { delay: this.planned - this.now },
      } as unknown as Job;
    },
  );
  public getJobScheduler = vi.fn(async (id: string) => this.schedulers.get(id));
  public getJobSchedulers = vi.fn(
    async (start: number, end: number, asc: boolean) => {
      this.calls.push(['list', start, end, asc]);
      return [...this.schedulers.values()];
    },
  );
  public getJobSchedulersCount = vi.fn(async () => this.schedulers.size);
  public removeJobScheduler = vi.fn(async (id: string) =>
    this.schedulers.delete(id),
  );
  public waitUntilReady = vi.fn(async () => undefined);
  public close = vi.fn(async () => {
    this.calls.push(['queue:close']);
  });
  public on = vi.fn((event: string, listener: Listener) => {
    this.listeners.set(event, listener);
    return this;
  });
}

/** A double of the public Worker methods that fires jobs on demand. */
class FakeWorker {
  public readonly listeners = new Map<string, Listener>();
  public readonly calls: string[] = [];
  public readonly abort = new AbortController();

  public constructor(public readonly processor: ScheduleProcessor) {}

  public waitUntilReady = vi.fn(async () => undefined);
  public cancelAllJobs = vi.fn(() => {
    this.calls.push('cancel');
    this.abort.abort();
  });
  public close = vi.fn(async () => {
    this.calls.push('close');
  });
  public on = vi.fn((event: string, listener: Listener) => {
    this.listeners.set(event, listener);
    return this;
  });

  /** Runs a job the way BullMQ does: `active`, the processor, then `completed` or `failed`. */
  public async fire(job: Job): Promise<unknown> {
    this.listeners.get('active')?.(job, 'waiting');
    try {
      await this.processor(job, 'token', this.abort.signal);
      this.listeners.get('completed')?.(job, undefined, 'active');
      return undefined;
    } catch (error) {
      this.listeners.get('failed')?.(job, error, 'active');
      return error;
    }
  }
}

const config: ResolvedRedisJobsConfig = {
  adapter: 'redis',
  key: 'redis-1',
  builtIn: false,
  scope: '@nocobase/app-plugin-scheduler',
  namespace: '{crm}',
  concurrency: 2,
  attempts: 1,
  connection: { host: '127.0.0.1', port: 6379 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { age: 604_800 },
};

function harness(overrides: Partial<ResolvedRedisJobsConfig> = {}) {
  const queue = new FakeQueue();
  let worker: FakeWorker | undefined;
  const queueConfigs: ResolvedRedisJobsConfig[] = [];
  const workerConfigs: ResolvedRedisJobsConfig[] = [];
  const factories: RedisScheduleBackendFactories = {
    queue: (resolved) => {
      queueConfigs.push(resolved);
      return queue as unknown as ScheduleQueue;
    },
    worker: (resolved, processor) => {
      workerConfigs.push(resolved);
      worker = new FakeWorker(processor);
      return worker as unknown as ScheduleWorker;
    },
  };
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const executor = createRedisScheduleExecutor(
    { ...config, ...overrides },
    { logger },
    factories,
  );
  return {
    executor,
    queue,
    logger,
    queueConfigs,
    workerConfigs,
    worker: () => worker!,
  };
}

function job(
  execute: ScheduleJob['execute'] = async () => undefined,
  overrides: Partial<ScheduleJob> = {},
): ScheduleJob {
  return {
    name: 'job-1',
    options: { cron: '0 * * * *' },
    payload: { target: 'report' },
    execute,
    ...overrides,
  };
}

/** A firing as BullMQ hands it to a worker: its own `delay` is zeroed once it left the delayed set. */
function firing(name = 'job-1', id = 'opaque-id'): Job {
  return {
    id,
    name,
    timestamp: Date.parse('2030-01-01T00:00:00Z'),
    delay: 0,
    opts: { delay: 3_600_000 },
    processedOn: Date.parse('2030-01-01T01:00:02Z'),
  } as unknown as Job;
}

describe('redis adapter', () => {
  it('opens a queue named by scope and prefixed by namespace', async () => {
    const { executor, queueConfigs, queue } = harness();

    await executor.setup({ consume: false });

    expect(queueConfigs).toEqual([
      expect.objectContaining({
        scope: '@nocobase/app-plugin-scheduler',
        namespace: '{crm}',
        connection: { host: '127.0.0.1', port: 6379 },
      }),
    ]);
    expect(queue.waitUntilReady).toHaveBeenCalled();
    expect(queue.listeners.has('error')).toBe(true);
  });

  it('maps a job to an upserted job scheduler and returns its planned time', async () => {
    const { executor, queue } = harness();
    await executor.setup({ consume: false });
    const startDate = new Date('2030-02-01T00:00:00Z');
    const endDate = new Date('2031-01-01T00:00:00Z');

    const receipt = await executor.addJob(
      job(undefined, {
        options: { cron: '0 * * * *', limit: 5, startDate, endDate },
      }),
    );

    expect(queue.calls[0]).toEqual([
      'upsert',
      'job-1',
      { pattern: '0 * * * *', tz: 'UTC', limit: 5, startDate, endDate },
      {
        name: 'job-1',
        data: { target: 'report' },
        opts: {
          attempts: 1,
          removeOnComplete: { count: 1000 },
          removeOnFail: { age: 604_800 },
        },
      },
    ]);
    expect(receipt).toEqual({
      jobName: 'job-1',
      code: 1000,
      message: 'Job upserted',
      scheduledAt: new Date('2030-01-01T01:00:00Z'),
    });
  });

  it('reports the planned firing BullMQ stored rather than the clock readings of the returned job', async () => {
    const { executor, queue } = harness();
    await executor.setup({ consume: false });
    // BullMQ derives the returned job's timestamp and delay from two clock
    // readings, so their sum can miss the planned time by a millisecond.
    queue.upsertJobScheduler.mockImplementationOnce(
      async (id, repeat, template) => {
        const job = await queue.upsertJobScheduler.getMockImplementation()!(
          id,
          repeat,
          template,
        );
        return {
          ...job,
          opts: { delay: queue.planned - queue.now - 1 },
        } as Job;
      },
    );

    const receipt = await executor.addJob(job());

    expect(receipt.scheduledAt).toEqual(new Date(queue.planned));
  });

  it('maps an interval rule and keeps its time zone out of the pattern', async () => {
    const { executor, queue } = harness();
    await executor.setup({ consume: false });

    await executor.addJob(job(undefined, { options: { every: 60_000 } }));

    expect(queue.calls[0]![2]).toEqual({ every: 60_000 });
  });

  it('passes immediately only when the scheduler does not exist yet', async () => {
    const { executor, queue } = harness();
    await executor.setup({ consume: false });
    const immediate = job(undefined, {
      options: { cron: '0 * * * *', immediately: true },
    });

    await executor.addJob(immediate);
    await executor.addJob({ ...immediate, payload: { changed: true } });

    expect(queue.calls.map((call) => (call[2] as object) ?? {})).toEqual([
      { pattern: '0 * * * *', tz: 'UTC', immediately: true },
      { pattern: '0 * * * *', tz: 'UTC' },
    ]);
  });

  it('skips the upsert when the stored scheduler is unchanged', async () => {
    const { executor, queue } = harness();
    await executor.setup({ consume: false });
    await executor.addJob(job());
    queue.schedulers.get('job-1')!.next = Date.parse('2030-01-01T02:00:00Z');

    const receipt = await executor.addJob(job());

    expect(queue.upsertJobScheduler).toHaveBeenCalledTimes(1);
    expect(receipt.scheduledAt).toEqual(new Date('2030-01-01T02:00:00Z'));
  });

  it.each([
    ['attempts', { attempts: 3 }],
    ['retention', { removeOnComplete: true }],
  ] as const)(
    'rewrites a scheduler whose %s changed',
    async (_label, overrides) => {
      const first = harness();
      await first.executor.setup({ consume: false });
      await first.executor.addJob(job());

      const second = harness(overrides);
      second.queue.schedulers.set(
        'job-1',
        first.queue.schedulers.get('job-1')!,
      );
      await second.executor.setup({ consume: false });
      await second.executor.addJob(job());

      expect(second.queue.upsertJobScheduler).toHaveBeenCalledTimes(1);
    },
  );

  it('returns no planned time when BullMQ plans no further job', async () => {
    const { executor, queue } = harness();
    await executor.setup({ consume: false });
    queue.upsertResult = 'none';

    await expect(executor.addJob(job())).resolves.toEqual({
      jobName: 'job-1',
      code: 1000,
      message: 'Job upserted',
    });
  });

  it('removes instead of upserting a rule whose end date has passed', async () => {
    const { executor, queue } = harness();
    await executor.setup({ consume: false });
    await executor.addJob(job());

    const receipt = await executor.addJob(
      job(undefined, {
        options: { cron: '0 * * * *', endDate: new Date(Date.now() - 1000) },
      }),
    );

    expect(receipt).not.toHaveProperty('scheduledAt');
    expect(queue.upsertJobScheduler).toHaveBeenCalledTimes(1);
    expect(queue.removeJobScheduler).toHaveBeenCalledWith('job-1');
    await expect(executor.getJob('job-1')).resolves.toBeUndefined();
  });

  it('reports no next firing once BullMQ has nothing after the current one', async () => {
    const { executor, queue, worker } = harness();
    const contexts: ScheduleExecutionContext[] = [];
    await executor.addJob(
      job(async (context) => {
        contexts.push(context);
      }),
    );
    await executor.setup();
    // A spent limit leaves the last planned time behind as `next`.
    queue.schedulers.get('job-1')!.next = Date.parse('2030-01-01T01:00:00Z');

    await worker().fire(firing());

    expect(contexts[0]).not.toHaveProperty('nextRunAt');
  });

  it('neither reads nor writes the queue for registerOnly', async () => {
    const { executor, queue } = harness();
    await executor.setup({ consume: false });

    await expect(executor.addJob(job(), true)).resolves.toMatchObject({
      code: 4000,
    });

    expect(queue.getJobScheduler).not.toHaveBeenCalled();
    expect(queue.upsertJobScheduler).not.toHaveBeenCalled();
  });

  it('removes, counts, gets and lists through job scheduler methods', async () => {
    const { executor, queue } = harness();
    await executor.setup({ consume: false });
    await executor.addJob(job(undefined, { options: { every: 1000 } }));

    await expect(executor.countJob()).resolves.toBe(1);
    await expect(executor.getJob('job-1')).resolves.toEqual({
      jobName: 'job-1',
      options: { every: 1000 },
      payload: { target: 'report' },
      nextRunAt: new Date(queue.planned),
    });
    await expect(executor.listJob(0, 9)).resolves.toEqual([
      {
        jobName: 'job-1',
        options: { every: 1000 },
        payload: { target: 'report' },
        nextRunAt: new Date(queue.planned),
      },
    ]);
    expect(queue.calls).toContainEqual(['list', 0, 9, true]);
    await expect(executor.removeJob('job-1')).resolves.toMatchObject({
      code: 2000,
    });
    await expect(executor.removeJob('job-1')).resolves.toMatchObject({
      code: 3000,
    });
  });

  it('starts no worker when consume is false', async () => {
    const { executor, workerConfigs } = harness();

    await executor.setup({ consume: false });

    expect(workerConfigs).toEqual([]);
  });

  it('runs a firing with its context and reports worker events', async () => {
    const { executor, queue, worker, workerConfigs } = harness();
    const contexts: ScheduleExecutionContext[] = [];
    const events: ScheduleEvent[] = [];
    executor.subscribe(async (event) => {
      events.push(event);
    });
    await executor.addJob(
      job(async (context) => {
        contexts.push(context);
      }),
    );
    await executor.setup();
    // By the time a firing runs, BullMQ has planned the one after it.
    queue.schedulers.get('job-1')!.next = Date.parse('2030-01-01T02:00:00Z');

    await worker().fire(firing());
    await executor.shutdown();

    expect(workerConfigs).toEqual([
      expect.objectContaining({ concurrency: 2, scope: config.scope }),
    ]);
    const expected = {
      jobId: 'opaque-id',
      scheduledAt: new Date('2030-01-01T01:00:00Z'),
      runAt: new Date('2030-01-01T01:00:02Z'),
      nextRunAt: new Date('2030-01-01T02:00:00Z'),
    };
    expect(contexts).toEqual([
      { ...expected, signal: expect.any(AbortSignal) },
    ]);
    expect(events).toEqual([
      { name: 'ScheduleStart', jobName: 'job-1', ...expected },
      { name: 'ScheduleEnd', jobName: 'job-1', ...expected },
    ]);
  });

  it('reports a failing handler as execute-failed', async () => {
    const { executor, worker } = harness();
    const events: ScheduleEvent[] = [];
    executor.subscribe(async (event) => {
      events.push(event);
    });
    await executor.addJob(
      job(async () => {
        throw new Error('boom');
      }),
    );
    await executor.setup();

    const error = await worker().fire(firing());
    await executor.shutdown();

    expect(error).not.toBeInstanceOf(UnrecoverableError);
    expect(events.map((event) => [event.name, event.reason])).toEqual([
      ['ScheduleStart', undefined],
      ['ScheduleError', 'execute-failed'],
    ]);
    expect(events[1]!.error?.message).toBe('boom');
  });

  it('fails a firing without a handler as unrecoverable', async () => {
    const { executor, worker } = harness();
    const events: ScheduleEvent[] = [];
    executor.subscribe(async (event) => {
      events.push(event);
    });
    await executor.setup();

    const error = await worker().fire(firing('removed-from-code'));
    await executor.shutdown();

    expect(error).toBeInstanceOf(UnrecoverableError);
    expect(events.map((event) => [event.name, event.reason])).toEqual([
      ['ScheduleStart', undefined],
      ['ScheduleError', 'handler-not-registered'],
    ]);
    expect(events[1]!.error).toBeInstanceOf(ScheduleHandlerNotRegisteredError);
  });

  it('aborts running handlers, then closes the worker and the queue once', async () => {
    const { executor, queue, worker } = harness();
    await executor.setup();
    const created = worker();

    await Promise.all([executor.shutdown(), executor.shutdown()]);

    expect(created.calls).toEqual(['cancel', 'close']);
    expect(created.abort.signal.aborted).toBe(true);
    expect(queue.close).toHaveBeenCalledTimes(1);
  });

  it('closes the queue when the worker cannot start', async () => {
    const { executor, queue } = harness();
    const failing: RedisScheduleBackendFactories = {
      queue: () => queue as unknown as ScheduleQueue,
      worker: () => {
        throw new Error('no redis');
      },
    };
    const subject = createRedisScheduleExecutor(config, {}, failing);

    await expect(subject.setup()).rejects.toThrow('no redis');
    expect(queue.close).toHaveBeenCalledTimes(1);
    await executor.shutdown();
  });
});
