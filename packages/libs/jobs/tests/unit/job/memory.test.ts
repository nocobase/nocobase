import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createJobExecutorService,
  Job,
  type JobEvent,
  type JobExecutionContext,
  type ManagedJobExecutorService,
} from '../../../src/index.js';

let directory: string;
const services: ManagedJobExecutorService[] = [];
beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'ordinary-memory-'));
});
afterEach(async () => {
  await Promise.allSettled(
    services.splice(0).map((service) => service.shutdown()),
  );
  await rm(directory, { recursive: true, force: true });
});
function create(attempts = 1, concurrency = 1) {
  const service = createJobExecutorService(
    {
      default: 'm',
      m: { adapter: 'memory', attempts, concurrency },
      other: { adapter: 'memory', attempts, concurrency },
    },
    { appName: 'app', storagePath: directory },
  );
  services.push(service);
  return service;
}

describe('ordinary memory queue', () => {
  it('claims waiting tasks FIFO within the concurrency limit and preserves waiting work on close', async () => {
    const started: number[] = [];
    const finished: number[] = [];
    let active = 0;
    let peak = 0;
    class Task extends Job<number> {
      static readonly jobName: string = 'task';
      async execute({ signal }: JobExecutionContext): Promise<void> {
        started.push(this.payload);
        active += 1;
        peak = Math.max(peak, active);
        await new Promise<void>((resolve) =>
          signal.addEventListener('abort', () => resolve(), { once: true }),
        );
        active -= 1;
        finished.push(this.payload);
      }
    }
    const first = create(1, 2).getJobExecutor('scope');
    first.registerJob(Task);
    await first.setup();
    for (const value of [1, 2, 3, 4]) await first.addJob(new Task(value));
    await vi.waitFor(() => expect(started).toEqual([1, 2]));
    expect(peak).toBe(2);
    await first.shutdown();
    expect(finished).toEqual([1, 2]);
    const remaining: number[] = [];
    class Consumer extends Job<number> {
      static readonly jobName: string = 'task';
      async execute(): Promise<void> {
        remaining.push(this.payload);
      }
    }
    const second = create().getJobExecutor('scope');
    second.registerJob(Consumer);
    await second.setup();
    await vi.waitFor(() => expect(remaining).toEqual([3, 4]));
    await second.shutdown();
    const third = create().getJobExecutor('scope');
    third.registerJob(Consumer);
    await third.setup();
    await third.shutdown();
    expect(remaining).toEqual([3, 4]);
  });

  it('retains producer attempt settings, reports each failure, and does not replay exhausted tasks', async () => {
    class Task extends Job<null> {
      static readonly jobName: string = 'task';
      async execute(): Promise<void> {
        throw new Error('failure');
      }
    }
    const producer = create(3).getJobExecutor('scope');
    await producer.setup({ consume: false });
    await producer.addJob(new Task(null));
    await producer.shutdown();
    const events: JobEvent[] = [];
    const consumer = create(1).getJobExecutor('scope');
    consumer.registerJob(Task);
    consumer.subscribe((event) => {
      events.push(event);
    });
    await consumer.setup();
    await vi.waitFor(() => expect(events).toHaveLength(6));
    expect(
      events
        .filter((event) => event.name === 'JobError')
        .map((event) => event.attempt),
    ).toEqual([1, 2, 3]);
    await consumer.shutdown();
    const next = create(7).getJobExecutor('scope');
    next.registerJob(Task);
    next.subscribe((event) => {
      events.push(event);
    });
    await next.setup();
    await next.shutdown();
    expect(events).toHaveLength(6);
  });

  it('fails a missing handler once regardless of attempts and preserves no failed history', async () => {
    class Task extends Job<null> {
      static readonly jobName: string = 'missing';
      async execute(): Promise<void> {}
    }
    const producer = create(5).getJobExecutor('scope');
    await producer.setup({ consume: false });
    const receipt = await producer.addJob(new Task(null));
    await producer.shutdown();
    const consumer = create(5).getJobExecutor('scope');
    const events: JobEvent[] = [];
    consumer.subscribe((event) => {
      events.push(event);
    });
    await consumer.setup();
    await vi.waitFor(() => expect(events).toHaveLength(2));
    expect(events[1]).toMatchObject({
      name: 'JobError',
      reason: 'handler-not-registered',
      jobId: receipt.jobId,
      error: expect.objectContaining({
        jobName: 'missing',
        jobId: receipt.jobId,
      }),
    });
    await consumer.shutdown();
    const file = (await readdir(directory))[0]!;
    expect(
      JSON.parse(await readFile(path.join(directory, file), 'utf8')),
    ).toMatchObject({ jobs: [] });
  });

  it('keeps pending tasks when the configuration key changes', async () => {
    class Task extends Job<number> {
      static readonly jobName: string = 'task';
      async execute(): Promise<void> {}
    }
    // The built-in default, then the explicit `jobs.default: memory` the
    // README recommends, then a renamed key: all read the same pending tasks.
    const builtIn = createJobExecutorService(undefined, {
      appName: 'app',
      storagePath: directory,
    });
    services.push(builtIn);
    const producer = builtIn.getJobExecutor('scope');
    await producer.setup({ consume: false });
    const receipt = await producer.addJob(new Task(1));
    await builtIn.shutdown();

    const executed = Promise.withResolvers<string>();
    class Recovered extends Job<number> {
      static readonly jobName: string = 'task';
      async execute({ jobId }: JobExecutionContext): Promise<void> {
        executed.resolve(jobId);
      }
    }
    const explicit = createJobExecutorService(
      { default: 'memory', memory: { adapter: 'memory' } },
      { appName: 'app', storagePath: directory },
    );
    services.push(explicit);
    const consumer = explicit.getJobExecutor('scope');
    consumer.registerJob(Recovered);
    await consumer.setup();
    await expect(executed.promise).resolves.toBe(receipt.jobId);
    await explicit.shutdown();
    expect(await readdir(directory)).toHaveLength(1);
  });

  it('shares one executor between memory keys naming the same file', async () => {
    const service = create();
    const executor = service.getJobExecutor('scope', 'm');
    expect(service.getJobExecutor('scope', 'other')).toBe(executor);
    expect(service.getJobExecutor('other-scope', 'other')).not.toBe(executor);
    await executor.setup({ consume: false });
    await service.shutdown();
    expect(await readdir(directory)).toHaveLength(1);
  });

  it('rejects memory keys that share a file with different settings', () => {
    const service = createJobExecutorService(
      {
        default: 'm',
        m: { adapter: 'memory', attempts: 1 },
        other: { adapter: 'memory', attempts: 3 },
        elsewhere: { adapter: 'memory', attempts: 3, namespace: 'second' },
      },
      { appName: 'app', storagePath: directory },
    );
    services.push(service);
    service.getJobExecutor('scope', 'm');
    expect(() => service.getJobExecutor('scope', 'other')).toThrow(
      /"m" and "other" share the memory task file/u,
    );
    expect(() => service.getJobExecutor('scope', 'elsewhere')).not.toThrow();
  });

  it('rejects malformed metadata and mismatched identities without overwriting the snapshot', async () => {
    const initial = create().getJobExecutor('scope');
    await initial.setup({ consume: false });
    await initial.shutdown();
    const file = path.join(directory, (await readdir(directory))[0]!);
    const valid: unknown = JSON.parse(await readFile(file, 'utf8'));
    if (typeof valid !== 'object' || valid === null)
      throw new Error('Expected a state object');
    for (const data of [
      { ...valid, version: 99 },
      { ...valid, scope: 'other' },
      { ...valid, jobs: [{}] },
      {
        ...valid,
        jobs: [
          {
            jobId: 'a',
            jobName: 'task',
            payload: null,
            enqueuedAt: 0,
            attempts: 1,
            started: 1,
            failures: 1,
          },
        ],
      },
    ]) {
      const text = JSON.stringify(data);
      await writeFile(file, text);
      const executor = create().getJobExecutor('scope');
      await expect(executor.setup()).rejects.toThrow(/Invalid job state file/u);
      await executor.shutdown();
      expect(await readFile(file, 'utf8')).toBe(text);
    }
  });
});
