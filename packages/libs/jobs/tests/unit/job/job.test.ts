import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createJobExecutorService,
  Job,
  JobInterruptedError,
  type JobEvent,
  type JobExecutionContext,
  type ManagedJobExecutorService,
} from '../../../src/index.js';

let directory: string;
const services: ManagedJobExecutorService[] = [];
beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'one-off-jobs-'));
});
afterEach(async () => {
  await Promise.allSettled(
    services.splice(0).map((service) => service.shutdown()),
  );
  await rm(directory, { recursive: true, force: true });
});
function service(attempts = 3, concurrency = 1) {
  const subject = createJobExecutorService(
    { default: 'm', m: { adapter: 'memory', attempts, concurrency } },
    { appName: 'test', storagePath: directory },
  );
  services.push(subject);
  return subject;
}

describe('one-off jobs', () => {
  it('caches by executor type and resolved configuration key', async () => {
    const subject = service();
    const executor = subject.getJobExecutor('scope');
    expect(subject.getJobExecutor('scope', 'm')).toBe(executor);
    expect(subject.getJobExecutor('scope', 'missing')).toBe(executor);
    expect(subject.getJobExecutor('scope', 'default')).toBe(executor);
    expect(subject.getScheduleExecutor('scope')).not.toBe(executor);
    expect(subject.getJobExecutor('another')).not.toBe(executor);
    await subject.shutdown();
    expect(() => subject.getJobExecutor('scope')).toThrow(/shut down/u);
    expect(() => subject.getScheduleExecutor('scope')).toThrow(/shut down/u);
  });

  it('rejects enqueue before setup, registers idempotently, and rejects colliding classes', async () => {
    class Task extends Job<number> {
      static readonly jobName: string = 'task';
      async execute(): Promise<void> {}
    }
    class Collision extends Job<number> {
      static readonly jobName: string = 'task';
      async execute(): Promise<void> {}
    }
    const executor = service().getJobExecutor('scope');
    executor.registerJob(Task);
    executor.registerJob(Task);
    expect(() => executor.registerJob(Collision)).toThrow(
      /already registered/u,
    );
    await expect(executor.addJob(new Task(1))).rejects.toThrow(/setup/u);
  });

  it('auto-registers, snapshots payload, and uses fresh instances on each retry', async () => {
    const instances: Job<{ value: number }>[] = [];
    const values: number[] = [];
    const contexts: JobExecutionContext[] = [];
    class Task extends Job<{ value: number }> {
      static readonly jobName: string = 'task';
      async execute(context: JobExecutionContext): Promise<void> {
        instances.push(this);
        values.push(this.payload.value);
        contexts.push(context);
        this.payload.value = 999;
        if (context.attempt === 1) throw new Error('retry');
      }
    }
    const executor = service().getJobExecutor('scope');
    const events: JobEvent[] = [];
    executor.subscribe(async (event) => {
      events.push(event);
    });
    await executor.setup();
    const original = new Task({ value: 1 });
    const pending = executor.addJob(original);
    original.payload.value = 77;
    const first = await pending;
    const second = await executor.addJob(new Task({ value: 2 }));
    expect(first.jobId).not.toBe(second.jobId);
    await vi.waitFor(() =>
      expect(events.filter((event) => event.name === 'JobEnd')).toHaveLength(2),
    );
    expect(new Set(instances).size).toBe(4);
    expect(instances).not.toContain(original);
    for (const receipt of [first, second]) {
      const attempts = contexts.filter(
        (context) => context.jobId === receipt.jobId,
      );
      expect(attempts.map((context) => context.attempt)).toEqual([1, 2]);
      expect(
        events
          .filter((event) => event.jobId === receipt.jobId)
          .map((event) => event.name),
      ).toEqual(['JobStart', 'JobError', 'JobStart', 'JobEnd']);
    }
    expect(values.sort()).toEqual([1, 1, 2, 2]);
  });

  it('persists producer-only waiting jobs separately from schedule rules', async () => {
    const values: number[] = [];
    class Task extends Job<number> {
      static readonly jobName: string = 'task';
      async execute(): Promise<void> {
        values.push(this.payload);
      }
    }
    const first = service();
    const executor = first.getJobExecutor('scope');
    await executor.setup({ consume: false });
    await executor.addJob(new Task(42));
    const schedule = first.getScheduleExecutor('scope');
    await schedule.setup({ consume: false });
    await schedule.addJob({
      name: 'rule',
      payload: null,
      options: { every: 1000 },
      execute: async () => undefined,
    });
    await first.shutdown();
    expect(values).toEqual([]);
    expect(await readdir(directory)).toContain('test.scope.json');
    const second = service();
    const consumer = second.getJobExecutor('scope');
    consumer.registerJob(Task);
    await consumer.setup();
    await vi.waitFor(() => expect(values).toEqual([42]));
    await second.shutdown();
    const third = service().getJobExecutor('scope');
    third.registerJob(Task);
    await third.setup();
    await third.shutdown();
    expect(values).toEqual([42]);
  });

  it('preserves explicit shutdown interruptions but not successful returns after abort', async () => {
    let started = false;
    const contexts: JobExecutionContext[] = [];
    class Task extends Job<null> {
      static readonly jobName: string = 'task';
      async execute(context: JobExecutionContext): Promise<void> {
        contexts.push(context);
        if (context.attempt > 1) return;
        started = true;
        await new Promise<void>((resolve) => {
          context.signal.addEventListener('abort', () => resolve(), {
            once: true,
          });
        });
        throw new JobInterruptedError();
      }
    }
    const first = service(1).getJobExecutor('scope');
    await first.setup();
    const receipt = await first.addJob(new Task(null));
    await vi.waitFor(() => expect(started).toBe(true));
    await Promise.all([first.shutdown(), first.shutdown()]);
    const second = service(1).getJobExecutor('scope');
    second.registerJob(Task);
    await second.setup();
    await vi.waitFor(() => expect(contexts).toHaveLength(2));
    expect(contexts.map((context) => context.jobId)).toEqual([
      receipt.jobId,
      receipt.jobId,
    ]);
    expect(contexts.map((context) => context.attempt)).toEqual([1, 2]);
  });

  it('does not overwrite a corrupted ordinary state file', async () => {
    const first = service().getJobExecutor('scope');
    await first.setup({ consume: false });
    await first.shutdown();
    const files = await readdir(directory);
    expect(files).toHaveLength(1);
    const file = path.join(directory, files[0]!);
    await writeFile(file, '{broken');
    const second = service().getJobExecutor('scope');
    await expect(second.setup()).rejects.toThrow();
    await second.shutdown();
    expect(await readFile(file, 'utf8')).toBe('{broken');
  });
});
