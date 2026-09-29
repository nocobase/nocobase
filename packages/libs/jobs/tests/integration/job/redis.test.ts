import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { once } from 'node:events';

import { Queue, Worker } from 'bullmq';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createJobExecutorService,
  Job,
  type JobEvent,
  JobInterruptedError,
  type ManagedJobExecutorService,
} from '../../../src/index.js';
import type { ResolvedRedisJobsConfig } from '../../../src/config.js';
import { jobQueueName } from '../../../src/job/backend.js';
import { BackendJobExecutor } from '../../../src/job/executor.js';
import {
  RedisJobBackend,
  defaultRedisJobFactories,
} from '../../../src/job/redis/backend.js';

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT ?? 6379),
};
const services: ManagedJobExecutorService[] = [];

class WorkJob extends Job<{ value: number }> {
  static readonly jobName: string = 'ordinary-integration-work';
  public static runs: Array<{ value: number; attempt: number }> = [];
  public static failUntilAttempt = 0;

  public async execute({
    attempt,
  }: {
    readonly attempt: number;
  }): Promise<void> {
    WorkJob.runs.push({ value: this.payload.value, attempt });
    if (attempt <= WorkJob.failUntilAttempt) throw new Error('retry');
  }
}

class IsolatedJob extends Job<{ marker: string }> {
  static readonly jobName: string = 'ordinary-integration-isolated';
  public static markers: string[] = [];

  public async execute(): Promise<void> {
    IsolatedJob.markers.push(this.payload.marker);
  }
}

function service(namespace: string, attempts = 1): ManagedJobExecutorService {
  const created = createJobExecutorService(
    {
      primary: { adapter: 'redis', connection, namespace, attempts },
      secondary: { adapter: 'redis', connection, namespace, attempts },
    },
    { appName: 'ordinary-integration', storagePath: '/nonexistent' },
  );
  services.push(created);
  return created;
}

const until = (assertion: () => void) =>
  vi.waitFor(assertion, { timeout: 10_000, interval: 50 });

afterEach(async () => {
  WorkJob.runs = [];
  WorkJob.failUntilAttempt = 0;
  IsolatedJob.markers = [];
  await Promise.allSettled(services.splice(0).map((each) => each.shutdown()));
});

describe('ordinary jobs against a real Redis', { timeout: 60_000 }, () => {
  it('executes each queued job once across multiple instances and emits attempt events', async () => {
    const namespace = `ordinary-${randomUUID()}`;
    const first = service(namespace);
    const second = service(namespace);
    const firstExecutor = first.getJobExecutor('shared', 'primary');
    const secondExecutor = second.getJobExecutor('shared', 'primary');
    const events: JobEvent[] = [];
    firstExecutor.subscribe((event) => {
      events.push(event);
    });
    secondExecutor.subscribe((event) => {
      events.push(event);
    });
    firstExecutor.registerJob(WorkJob);
    secondExecutor.registerJob(WorkJob);
    await Promise.all([firstExecutor.setup(), secondExecutor.setup()]);
    await firstExecutor.addJob(new WorkJob({ value: 1 }));
    await until(() => expect(WorkJob.runs).toHaveLength(1));
    expect(WorkJob.runs).toEqual([{ value: 1, attempt: 1 }]);
    expect(events.map((event) => event.name)).toEqual(['JobStart', 'JobEnd']);
  });

  it('snapshots payloads and retries a failed attempt with a fresh payload instance', async () => {
    const executor = service(`ordinary-${randomUUID()}`, 2).getJobExecutor(
      'retry',
      'primary',
    );
    const events: JobEvent[] = [];
    executor.subscribe((event) => {
      events.push(event);
    });
    executor.registerJob(WorkJob);
    WorkJob.failUntilAttempt = 1;
    await executor.setup();
    const payload = { value: 3 };
    await executor.addJob(new WorkJob(payload));
    payload.value = 99;
    await until(() => expect(WorkJob.runs).toHaveLength(2));
    expect(WorkJob.runs).toEqual([
      { value: 3, attempt: 1 },
      { value: 3, attempt: 2 },
    ]);
    expect(events.map((event) => event.name)).toEqual([
      'JobStart',
      'JobError',
      'JobStart',
      'JobEnd',
    ]);
    expect(
      events.filter((event) => event.name === 'JobError')[0],
    ).toMatchObject({ reason: 'execute-failed' });
  });

  it('consumes under one configuration key what another key with the same identity submitted', async () => {
    const namespace = `ordinary-${randomUUID()}`;
    const producer = service(namespace).getJobExecutor('same-scope', 'primary');
    const consumer = service(namespace).getJobExecutor(
      'same-scope',
      'secondary',
    );
    consumer.registerJob(IsolatedJob);
    await producer.setup({ consume: false });
    await producer.addJob(new IsolatedJob({ marker: 'renamed' }));
    await consumer.setup();
    await until(() => expect(IsolatedJob.markers).toEqual(['renamed']));
  });

  it('keeps ordinary queues separate across namespaces and scopes', async () => {
    const created = service(`ordinary-${randomUUID()}`);
    const other = service(`ordinary-${randomUUID()}`);
    const executors = [
      created.getJobExecutor('same-scope', 'primary'),
      created.getJobExecutor('other-scope', 'primary'),
      other.getJobExecutor('same-scope', 'primary'),
    ];
    const consumed = executors.map(() => [] as string[]);
    executors.forEach((executor, index) => {
      executor.registerJob(IsolatedJob);
      executor.subscribe((event) => {
        if (event.name === 'JobEnd') consumed[index]!.push(event.jobId);
      });
    });
    await Promise.all(executors.map((executor) => executor.setup()));
    const receipts = await Promise.all(
      executors.map((executor, index) =>
        executor.addJob(new IsolatedJob({ marker: String(index) })),
      ),
    );
    await until(() => expect(IsolatedJob.markers).toHaveLength(3));
    expect(consumed).toEqual(receipts.map((receipt) => [receipt.jobId]));
  });

  it('stores reported progress on the queued job and emits it locally', async () => {
    const namespace = `ordinary-${randomUUID()}`;
    const release = Promise.withResolvers<void>();
    const reported = Promise.withResolvers<void>();
    class Progressing extends Job<{ value: number }> {
      static readonly jobName: string = 'progressing';
      async execute({
        reportProgress,
      }: import('../../../src/index.js').JobExecutionContext): Promise<void> {
        await reportProgress(this.payload.value);
        reported.resolve();
        await release.promise;
      }
    }
    const executor = service(namespace).getJobExecutor('progress', 'primary');
    const events: JobEvent[] = [];
    executor.subscribe((event) => {
      events.push(event);
    });
    executor.registerJob(Progressing);
    await executor.setup();
    const receipt = await executor.addJob(new Progressing({ value: 40 }));
    await reported.promise;
    const queue = new Queue(jobQueueName({ scope: 'progress' }), {
      connection,
      prefix: namespace,
    });
    try {
      expect((await queue.getJob(receipt.jobId))?.progress).toBe(40);
    } finally {
      release.resolve();
      await queue.close();
    }
    await until(() =>
      expect(events.map((event) => event.name)).toEqual([
        'JobStart',
        'JobProgress',
        'JobEnd',
      ]),
    );
    expect(events[1]).toMatchObject({ progress: 40, jobId: receipt.jobId });
  });

  it('preserves an explicitly interrupted attempt across graceful shutdown', async () => {
    const namespace = `ordinary-${randomUUID()}`;
    const entered = Promise.withResolvers<void>();
    const attempts: number[] = [];
    class Interrupted extends Job<{ value: number }> {
      static readonly jobName: string = 'interrupted';
      async execute({
        attempt,
        signal,
      }: import('../../../src/index.js').JobExecutionContext): Promise<void> {
        attempts.push(attempt);
        expect(this.payload).toEqual({ value: 7 });
        if (attempt === 1) {
          entered.resolve();
          await new Promise<void>((resolve) => {
            if (signal.aborted) resolve();
            else
              signal.addEventListener('abort', () => resolve(), { once: true });
          });
          throw new JobInterruptedError();
        }
      }
    }
    const firstService = service(namespace);
    const first = firstService.getJobExecutor('interrupt', 'primary');
    const events: JobEvent[] = [];
    first.subscribe((event) => {
      events.push(event);
    });
    first.registerJob(Interrupted);
    await first.setup();
    await first.addJob(new Interrupted({ value: 7 }));
    await entered.promise;
    await firstService.shutdown();
    expect(events.map((event) => event.name)).toEqual(['JobStart', 'JobError']);
    expect(events[1]).toMatchObject({ reason: 'interrupted' });
    const second = service(namespace).getJobExecutor('interrupt', 'primary');
    const recovered: JobEvent[] = [];
    second.subscribe((event) => {
      recovered.push(event);
    });
    second.registerJob(Interrupted);
    await second.setup();
    await until(() =>
      expect(recovered.map((event) => event.name)).toEqual([
        'JobStart',
        'JobEnd',
      ]),
    );
    expect(attempts).toEqual([1, 2]);
    expect(recovered[0]?.jobId).toBe(events[0]?.jobId);
  });

  // A crashed worker needs a second stalled scan: the first marks active jobs,
  // and the next scan moves an expired lock back to waiting.
  it('recovers the same job after the owning process dies and its lock expires', async () => {
    const config: ResolvedRedisJobsConfig = {
      adapter: 'redis',
      key: 'primary',
      builtIn: false,
      scope: 'process-death',
      namespace: `ordinary-${randomUUID()}`,
      connection,
      concurrency: 1,
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: true,
    };
    const producer = new BackendJobExecutor(
      new RedisJobBackend(config, undefined),
      undefined,
    );
    const consumer = new BackendJobExecutor(
      new RedisJobBackend(config, undefined, {
        ...defaultRedisJobFactories,
        worker: (resolved, processor) =>
          new Worker(jobQueueName(resolved), processor, {
            connection,
            prefix: resolved.namespace,
            stalledInterval: 250,
            lockDuration: 500,
            maxStalledCount: 2,
          }),
      }),
      undefined,
    );
    const events: JobEvent[] = [];
    consumer.registerJob(WorkJob);
    consumer.subscribe((event) => {
      events.push(event);
    });
    const child = spawn(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `
      import { Worker } from ${JSON.stringify(createRequire(import.meta.url).resolve('bullmq'))};
      const worker = new Worker(${JSON.stringify(jobQueueName(config))}, async (job) => {
        process.send({ jobId: job.id });
        await new Promise(() => {});
      }, { connection: ${JSON.stringify(connection)}, prefix: ${JSON.stringify(config.namespace)}, lockDuration: 500, stalledInterval: 250, maxStalledCount: 2 });
      await worker.waitUntilReady();
      process.send({ ready: true });
    `,
      ],
      { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] },
    );
    const exited = once(child, 'exit');
    try {
      await once(child, 'message');
      await producer.setup({ consume: false });
      const started = once(child, 'message');
      const receipt = await producer.addJob(new WorkJob({ value: 42 }));
      expect((await started)[0]).toEqual({ jobId: receipt.jobId });
      child.kill('SIGKILL');
      await exited;
      await consumer.setup();
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await until(() =>
        expect(events.map((event) => event.name)).toEqual([
          'JobStart',
          'JobEnd',
        ]),
      );
      expect(events[0]).toMatchObject({ jobId: receipt.jobId, attempt: 2 });
      expect(WorkJob.runs).toEqual([{ value: 42, attempt: 2 }]);
    } finally {
      child.kill('SIGKILL');
      await exited;
      await Promise.all([consumer.shutdown(), producer.shutdown()]);
    }
  });
});
