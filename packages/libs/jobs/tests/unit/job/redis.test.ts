import { UnrecoverableError, WaitingError, type JobsOptions } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import type { ResolvedRedisJobsConfig } from '../../../src/config.js';
import type { JobRun } from '../../../src/job/backend.js';
import {
  JobHandlerNotRegisteredError,
  JobInterruptedError,
} from '../../../src/job/types.js';
import {
  RedisJobBackend,
  type JobProcessor,
  type RedisJobBackendFactories,
  type RedisJobData,
  type RedisJobQueue,
  type RedisJobWorker,
  type RedisProcessingJob,
} from '../../../src/job/redis/backend.js';

const config: ResolvedRedisJobsConfig = {
  adapter: 'redis',
  key: 'primary',
  builtIn: false,
  scope: 'reports',
  namespace: '{application}',
  concurrency: 2,
  attempts: 3,
  connection: { host: '127.0.0.1', port: 6379 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { age: 604_800 },
};

class FakeQueue implements RedisJobQueue {
  public readonly errors: ((error: Error) => void)[] = [];
  public readonly add = vi.fn(
    async (_name: string, _data: RedisJobData, options: JobsOptions) => ({
      id: options.jobId,
    }),
  );
  public readonly waitUntilReady = vi.fn(async () => undefined);
  public readonly close = vi.fn(async () => undefined);
  public on(_event: 'error', listener: (error: Error) => void): void {
    this.errors.push(listener);
  }
}

class FakeWorker implements RedisJobWorker {
  public readonly errors: ((error: Error) => void)[] = [];
  public readonly controller = new AbortController();
  public readonly waitUntilReady = vi.fn(async () => undefined);
  public readonly cancelAllJobs = vi.fn((_reason?: string) => {
    this.controller.abort();
  });
  public readonly close = vi.fn(async () => undefined);
  public on(_event: 'error', listener: (error: Error) => void): void {
    this.errors.push(listener);
  }
}

function harness(overrides: Partial<ResolvedRedisJobsConfig> = {}) {
  const queue = new FakeQueue();
  const worker = new FakeWorker();
  const processors: JobProcessor[] = [];
  const factories: RedisJobBackendFactories = {
    queue: vi.fn(() => queue),
    worker: vi.fn((_config, processor) => {
      processors.push(processor);
      return worker;
    }),
  };
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const backend = new RedisJobBackend(
    { ...config, ...overrides },
    logger,
    factories,
  );
  return {
    backend,
    queue,
    worker,
    factories,
    logger,
    process: (
      job: RedisProcessingJob,
      token: string | undefined = 'lock-token',
    ) => {
      const processor = processors[0];
      if (!processor) throw new Error('No processor was installed.');
      return processor(job, token, worker.controller.signal);
    },
    processors,
  };
}

function firing(
  overrides: Partial<RedisProcessingJob> = {},
): RedisProcessingJob {
  return {
    id: 'opaque-id',
    data: {
      jobName: 'report',
      payload: { nested: { count: 1 } },
      enqueuedAt: Date.parse('2030-01-01T00:00:00Z'),
    },
    processedOn: Date.parse('2030-01-01T00:00:01Z'),
    attemptsStarted: 4,
    moveToWait: vi.fn(async (_token?: string) => 0),
    updateProgress: vi.fn(async (_progress: unknown) => undefined),
    ...overrides,
  };
}

describe('Redis job backend', () => {
  it('awaits queue readiness without creating a producer worker', async () => {
    const { backend, queue, factories } = harness();
    const ready = Promise.withResolvers<void>();
    queue.waitUntilReady.mockImplementationOnce(() => ready.promise);
    let opened = false;
    const opening = backend.open().then(() => {
      opened = true;
    });
    await Promise.resolve();
    expect(opened).toBe(false);
    expect(factories.worker).not.toHaveBeenCalled();
    ready.resolve();
    await opening;
    await backend.close();
    expect(queue.close).toHaveBeenCalledOnce();
  });

  it('adds each submission separately with stored metadata and configured policies', async () => {
    const { backend, queue } = harness();
    await backend.open();
    const payload = Object.freeze({ value: 42 });
    const first = await backend.enqueue({ jobName: 'report', payload });
    const second = await backend.enqueue({ jobName: 'report', payload });
    expect(first.jobId).not.toBe(second.jobId);
    expect(first.jobName).toBe('report');
    expect(first.enqueuedAt).toBeInstanceOf(Date);
    expect(queue.add).toHaveBeenNthCalledWith(
      1,
      'report',
      {
        jobName: 'report',
        payload,
        enqueuedAt: first.enqueuedAt.getTime(),
      },
      {
        jobId: first.jobId,
        attempts: 3,
        removeOnComplete: { count: 1000 },
        removeOnFail: { age: 604_800 },
      },
    );
    await backend.close();
  });

  it('awaits enqueue acknowledgement and propagates rejected submissions', async () => {
    const { backend, queue } = harness();
    await backend.open();
    const added = Promise.withResolvers<{ id: string | undefined }>();
    queue.add.mockImplementationOnce(() => added.promise);
    let accepted = false;
    const pending = backend
      .enqueue({ jobName: 'report', payload: null })
      .then(() => {
        accepted = true;
      });
    await Promise.resolve();
    expect(accepted).toBe(false);
    added.resolve({ id: queue.add.mock.calls[0]?.[2].jobId });
    await pending;
    queue.add.mockRejectedValueOnce(new Error('write rejected'));
    await expect(
      backend.enqueue({ jobName: 'report', payload: null }),
    ).rejects.toThrow('write rejected');
    await backend.close();
  });

  it('passes stored metadata, execution starts, and payload without rewriting data', async () => {
    const { backend, process, processors, factories } = harness();
    const runs: JobRun[] = [];
    await backend.open();
    await backend.consume({
      run: async (run) => {
        runs.push(run);
      },
    });
    const job = firing();
    Object.freeze(job.data);
    await process(job);
    expect(runs).toEqual([
      {
        jobId: 'opaque-id',
        jobName: 'report',
        payload: job.data.payload,
        enqueuedAt: new Date(job.data.enqueuedAt),
        runAt: new Date(job.processedOn!),
        attempt: 4,
        signal: expect.any(AbortSignal),
        reportProgress: expect.any(Function),
      },
    ]);
    expect(processors[0]?.length).toBe(3);
    expect(factories.worker).toHaveBeenCalledWith(config, processors[0]);
    expect(job.moveToWait).not.toHaveBeenCalled();
    await backend.close();
  });

  it('stores reported progress on the BullMQ job', async () => {
    const { backend, process } = harness();
    await backend.open();
    await backend.consume({
      run: async (run) => {
        await run.reportProgress(40);
      },
    });
    const job = firing();
    await process(job);
    expect(job.updateProgress).toHaveBeenCalledExactlyOnceWith(40);
    await backend.close();
  });

  it('waits until the consumer is ready', async () => {
    const { backend, worker } = harness();
    await backend.open();
    const ready = Promise.withResolvers<void>();
    worker.waitUntilReady.mockImplementationOnce(() => ready.promise);
    let consuming = false;
    const pending = backend.consume({ run: async () => undefined }).then(() => {
      consuming = true;
    });
    await Promise.resolve();
    expect(consuming).toBe(false);
    ready.resolve();
    await pending;
    await backend.close();
  });

  it('makes an unknown handler unrecoverable but leaves normal errors retryable', async () => {
    const { backend, process } = harness();
    const run = vi.fn<(run: JobRun) => Promise<void>>();
    await backend.open();
    await backend.consume({ run });
    run.mockRejectedValueOnce(
      new JobHandlerNotRegisteredError('report', 'opaque-id'),
    );
    await expect(process(firing())).rejects.toBeInstanceOf(UnrecoverableError);
    const ordinary = new Error('handler failed');
    run.mockRejectedValueOnce(ordinary);
    await expect(process(firing())).rejects.toBe(ordinary);
    await backend.close();
  });

  it('moves an explicitly interrupted aborted attempt back to wait with its lock token', async () => {
    const { backend, process, worker } = harness();
    const job = firing();
    await backend.open();
    await backend.consume({
      run: async () => {
        throw new JobInterruptedError();
      },
    });
    worker.controller.abort();
    await expect(process(job)).rejects.toBeInstanceOf(WaitingError);
    expect(job.moveToWait).toHaveBeenCalledExactlyOnceWith('lock-token');
    await backend.close();
  });

  it('does not turn an interruption without abortion into an unbounded retry', async () => {
    const { backend, process } = harness();
    const interruption = new JobInterruptedError();
    const job = firing();
    await backend.open();
    await backend.consume({
      run: async () => {
        throw interruption;
      },
    });
    await expect(process(job)).rejects.toBe(interruption);
    expect(job.moveToWait).not.toHaveBeenCalled();
    await backend.close();
  });

  it('completes normal returns after abort and preserves ordinary thrown errors', async () => {
    const { backend, process, worker } = harness();
    const run = vi
      .fn<(run: JobRun) => Promise<void>>()
      .mockResolvedValue(undefined);
    const job = firing();
    await backend.open();
    await backend.consume({ run });
    worker.controller.abort();
    await expect(process(job)).resolves.toBeUndefined();
    const failure = new Error('ordinary failure after abort');
    run.mockRejectedValueOnce(failure);
    await expect(process(job)).rejects.toBe(failure);
    expect(job.moveToWait).not.toHaveBeenCalled();
    await backend.close();
  });

  it('propagates a failed public waiting transition instead of claiming it succeeded', async () => {
    const { backend, process, worker } = harness();
    const transitionError = new Error('lock no longer owned');
    const job = firing({
      moveToWait: vi.fn(async () => {
        throw transitionError;
      }),
    });
    await backend.open();
    await backend.consume({
      run: async () => {
        throw new JobInterruptedError();
      },
    });
    worker.controller.abort();
    await expect(process(job)).rejects.toBe(transitionError);
    await backend.close();
  });

  it('releases the queue when readiness fails', async () => {
    const { backend, queue } = harness();
    queue.waitUntilReady.mockRejectedValueOnce(new Error('queue not ready'));
    queue.close.mockRejectedValueOnce(new Error('queue close failed'));
    await expect(backend.open()).rejects.toThrow('queue not ready');
    await expect(backend.close()).rejects.toThrow('queue close failed');
    expect(queue.close).toHaveBeenCalledOnce();
  });

  it('releases both resources when worker readiness fails', async () => {
    const { backend, queue, worker } = harness();
    await backend.open();
    worker.waitUntilReady.mockRejectedValueOnce(new Error('worker not ready'));
    await expect(
      backend.consume({ run: async () => undefined }),
    ).rejects.toThrow('worker not ready');
    await backend.close();
    expect(worker.close).toHaveBeenCalledOnce();
    expect(queue.close).toHaveBeenCalledOnce();
  });

  it('releases the queue when worker construction fails', async () => {
    const { backend, queue, factories } = harness();
    await backend.open();
    vi.mocked(factories.worker).mockImplementationOnce(() => {
      throw new Error('worker construction failed');
    });
    await expect(
      backend.consume({ run: async () => undefined }),
    ).rejects.toThrow('worker construction failed');
    await backend.close();
    expect(queue.close).toHaveBeenCalledOnce();
  });

  it('aborts before closing and still closes the queue after worker close fails', async () => {
    const { backend, queue, worker } = harness();
    await backend.open();
    await backend.consume({ run: async () => undefined });
    worker.close.mockImplementationOnce(async () => {
      expect(worker.controller.signal.aborted).toBe(true);
      throw new Error('worker close failed');
    });
    await expect(backend.close()).rejects.toThrow('worker close failed');
    await expect(backend.close()).rejects.toThrow('worker close failed');
    expect(worker.cancelAllJobs).toHaveBeenCalledOnce();
    expect(worker.close).toHaveBeenCalledOnce();
    expect(queue.close).toHaveBeenCalledOnce();
  });

  it('attempts every cleanup even when cancellation itself throws', async () => {
    const { backend, queue, worker } = harness();
    await backend.open();
    await backend.consume({ run: async () => undefined });
    worker.cancelAllJobs.mockImplementationOnce(() => {
      throw new Error('cancel failed');
    });
    worker.close.mockRejectedValueOnce(new Error('worker close failed'));
    queue.close.mockRejectedValueOnce(new Error('queue close failed'));
    await expect(backend.close()).rejects.toBeInstanceOf(AggregateError);
    expect(worker.close).toHaveBeenCalledOnce();
    expect(queue.close).toHaveBeenCalledOnce();
  });

  it.each([
    true,
    false,
    0,
    10,
    { count: 0 },
    { age: 20 },
    { count: 5, age: 30 },
    {},
  ])(
    'passes the configured retention policy %j through public job options',
    async (policy) => {
      const { backend, queue } = harness({
        removeOnComplete: policy,
        removeOnFail: policy,
      });
      await backend.open();
      await backend.enqueue({ jobName: 'report', payload: null });
      const expected =
        typeof policy === 'object' && Object.keys(policy).length === 0
          ? false
          : policy;
      expect(queue.add.mock.calls[0]?.[2]).toMatchObject({
        removeOnComplete: expected,
        removeOnFail: expected,
      });
      await backend.close();
    },
  );

  it('requeues late-start processors after shutdown without calling user code', async () => {
    const { backend, worker, process } = harness();
    const run = vi.fn(async (_run: JobRun) => undefined);
    const closed = Promise.withResolvers<void>();
    worker.close.mockImplementationOnce(() => closed.promise);
    await backend.open();
    await backend.consume({ run });
    const closing = backend.close();
    expect(backend.close()).toBe(closing);
    const job = firing();
    await expect(process(job)).rejects.toBeInstanceOf(WaitingError);
    expect(job.moveToWait).toHaveBeenCalledExactlyOnceWith('lock-token');
    expect(run).not.toHaveBeenCalled();
    closed.resolve();
    await closing;
  });

  it('signals in-flight work even when BullMQ cancellation throws', async () => {
    const { backend, worker, process } = harness();
    const aborted = Promise.withResolvers<void>();
    await backend.open();
    await backend.consume({
      run: async ({ signal }) => {
        signal.addEventListener('abort', () => aborted.resolve(), {
          once: true,
        });
        await aborted.promise;
      },
    });
    const active = process(firing());
    worker.cancelAllJobs.mockImplementationOnce(() => {
      throw new Error('cancel failed');
    });
    worker.close.mockImplementationOnce(() => active);
    await expect(backend.close()).rejects.toThrow('cancel failed');
    await active;
  });

  it('observes queue and worker errors without taking over runner events', async () => {
    const { backend, queue, worker, logger } = harness();
    await backend.open();
    await backend.consume({ run: async () => undefined });
    const error = new Error('connection error');
    queue.errors[0]?.(error);
    worker.errors[0]?.(error);
    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error, scope: config.scope, key: config.key }),
      expect.any(String),
    );
    await backend.close();
  });
});
