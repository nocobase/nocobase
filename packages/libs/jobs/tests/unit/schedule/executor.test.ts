import { describe, expect, it, vi } from 'vitest';

import {
  BackendScheduleExecutor,
  ScheduleHandlerNotRegisteredError,
  type ScheduleBackend,
  type ScheduleRuleWrite,
  type ScheduleRunner,
  type StoredScheduleRule,
} from '../../../src/schedule/executor.js';
import type {
  ScheduleEvent,
  ScheduleJob,
} from '../../../src/schedule/types.js';

class FakeBackend implements ScheduleBackend {
  public settings = { attempts: 1 };
  public readonly rules = new Map<string, StoredScheduleRule>();
  public readonly writes: ScheduleRuleWrite[] = [];
  public readonly calls: string[] = [];
  public runner: ScheduleRunner | undefined;
  public next = new Date('2030-01-01T00:00:00Z');

  public open = vi.fn(async () => {
    this.calls.push('open');
  });
  public async read(name: string) {
    return this.rules.get(name);
  }
  public async write(rule: ScheduleRuleWrite) {
    this.calls.push(`write:${rule.name}`);
    this.writes.push(rule);
    this.rules.set(rule.name, {
      options: rule.options,
      payload: JSON.parse(JSON.stringify(rule.payload ?? null)),
      settings: rule.settings,
      nextRunAt: this.next,
    });
    return this.next;
  }
  public async remove(name: string) {
    return this.rules.delete(name);
  }
  public async count() {
    return this.rules.size;
  }
  public async list() {
    return [];
  }
  public consume = vi.fn(async (runner: ScheduleRunner) => {
    this.calls.push('consume');
    this.runner = runner;
  });
  public close = vi.fn(async () => {
    this.calls.push('close');
  });
}

function job(
  name = 'job-1',
  payload: unknown = { a: 1, b: [1, 2] },
  execute: ScheduleJob['execute'] = async () => undefined,
): ScheduleJob {
  return { name, options: { cron: '0 * * * *' }, payload, execute };
}

function executor(backend = new FakeBackend(), logger = fakeLogger()) {
  return {
    backend,
    logger,
    executor: new BackendScheduleExecutor(backend, logger),
  };
}

function fakeLogger() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

const run = (jobName: string) => ({
  jobId: `${jobName}:1`,
  jobName,
  scheduledAt: new Date(1),
  runAt: new Date(2),
  signal: new AbortController().signal,
});

describe('BackendScheduleExecutor', () => {
  it('registers jobs added before setup and writes them before consuming', async () => {
    const { backend, executor: subject } = executor();

    await expect(subject.addJob(job())).resolves.toEqual({
      jobName: 'job-1',
      code: 1000,
      message: 'Job upserted',
    });
    expect(backend.calls).toEqual([]);

    await subject.setup();

    expect(backend.calls).toEqual(['open', 'write:job-1', 'consume']);
    expect(backend.runner?.hasHandler('job-1')).toBe(true);
  });

  it('writes immediately after setup and returns the planned firing', async () => {
    const { backend, executor: subject } = executor();
    await subject.setup();

    await expect(subject.addJob(job())).resolves.toEqual({
      jobName: 'job-1',
      code: 1000,
      message: 'Job upserted',
      scheduledAt: backend.next,
    });
  });

  it('skips the write when rule, payload and settings are unchanged', async () => {
    const { backend, executor: subject } = executor();
    await subject.setup();
    await subject.addJob(job('job-1', { b: [1, 2], a: 1 }));
    const planned = backend.rules.get('job-1')!.nextRunAt;
    backend.next = new Date('2031-01-01T00:00:00Z');

    const receipt = await subject.addJob(job('job-1', { a: 1, b: [1, 2] }));

    expect(backend.writes).toHaveLength(1);
    expect(receipt).toMatchObject({ code: 1000, scheduledAt: planned });
  });

  it.each([
    ['payload', job('job-1', { a: 2, b: [1, 2] }), undefined],
    ['rule', { ...job(), options: { cron: '0 0 * * *' } }, undefined],
    [
      'time zone',
      { ...job(), options: { cron: '0 * * * *', tz: 'Asia/Shanghai' } },
      undefined,
    ],
    ['settings', job(), { attempts: 3 }],
  ] as const)(
    'rewrites when the %s changed',
    async (_label, next, settings) => {
      const { backend, executor: subject } = executor();
      await subject.setup();
      await subject.addJob(job());
      if (settings) backend.settings = settings;

      await subject.addJob(next);

      expect(backend.writes).toHaveLength(2);
    },
  );

  it('treats an omitted cron time zone as UTC', async () => {
    const { backend, executor: subject } = executor();
    await subject.setup();
    await subject.addJob(job());

    await subject.addJob({
      ...job(),
      options: { cron: '0 * * * *', tz: 'UTC' },
    });

    expect(backend.writes).toHaveLength(1);
  });

  it('passes immediately only when the backend holds no such rule', async () => {
    const { backend, executor: subject } = executor();
    await subject.setup();
    const immediate = {
      ...job(),
      options: { cron: '0 * * * *', immediately: true },
    };

    await subject.addJob(immediate);
    await subject.addJob({ ...immediate, payload: { changed: true } });

    expect(backend.writes.map((write) => write.immediately)).toEqual([
      true,
      false,
    ]);
    expect(backend.writes[0]!.options).toEqual({ cron: '0 * * * *' });
  });

  it('registers only the handler with registerOnly, before or after setup', async () => {
    const { backend, executor: subject } = executor();

    await expect(subject.addJob(job('a'), true)).resolves.toEqual({
      jobName: 'a',
      code: 4000,
      message: 'Handler registered',
    });
    await subject.setup();
    await expect(subject.addJob(job('b'), true)).resolves.toMatchObject({
      code: 4000,
    });

    expect(backend.writes).toEqual([]);
    expect(backend.runner?.hasHandler('a')).toBe(true);
    expect(backend.runner?.hasHandler('b')).toBe(true);
  });

  it('keeps the handler registered after removeJob', async () => {
    const { backend, executor: subject } = executor();
    const execute = vi.fn(async () => undefined);
    await subject.setup();
    await subject.addJob(job('job-1', {}, execute));

    await expect(subject.removeJob('job-1')).resolves.toEqual({
      jobName: 'job-1',
      code: 2000,
      message: 'Job removed',
    });
    await expect(subject.removeJob('job-1')).resolves.toEqual({
      jobName: 'job-1',
      code: 3000,
      message: 'Job not existed',
    });
    await backend.runner!.run(run('job-1'));

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('rejects firings of a job without a handler', async () => {
    const { backend, executor: subject } = executor();
    await subject.setup();

    await expect(backend.runner!.run(run('unknown'))).rejects.toBeInstanceOf(
      ScheduleHandlerNotRegisteredError,
    );
  });

  it('passes the firing to the handler as its context', async () => {
    const { backend, executor: subject } = executor();
    const execute = vi.fn(async () => undefined);
    await subject.addJob(job('job-1', {}, execute));
    await subject.setup();

    await backend.runner!.run({ ...run('job-1'), nextRunAt: new Date(3) });

    expect(execute).toHaveBeenCalledWith({
      jobId: 'job-1:1',
      scheduledAt: new Date(1),
      runAt: new Date(2),
      nextRunAt: new Date(3),
      signal: expect.any(AbortSignal),
    });
  });

  it('requires setup before reading or removing rules', async () => {
    const { executor: subject } = executor();

    await expect(subject.getJob('job-1')).rejects.toThrow(/setup\(\)/u);
    await expect(subject.removeJob('job-1')).rejects.toThrow(/setup\(\)/u);
    await expect(subject.countJob()).rejects.toThrow(/setup\(\)/u);
    await expect(subject.listJob(0, -1)).rejects.toThrow(/setup\(\)/u);
  });

  it('writes rules without consuming when consume is false', async () => {
    const { backend, executor: subject } = executor();
    await subject.addJob(job());

    await subject.setup({ consume: false });

    expect(backend.calls).toEqual(['open', 'write:job-1']);
    await expect(subject.countJob()).resolves.toBe(1);
  });

  it('delivers events in order and logs a failing subscriber', async () => {
    const { backend, logger, executor: subject } = executor();
    await subject.setup();
    const seen: string[] = [];
    subject.subscribe(async () => {
      throw new Error('subscriber failed');
    });
    const unsubscribe = subject.subscribe(async (event) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      seen.push(event.name);
    });
    const event = (name: ScheduleEvent['name']): ScheduleEvent => ({
      name,
      jobId: 'j',
      jobName: 'job-1',
      scheduledAt: new Date(1),
      runAt: new Date(2),
    });

    backend.runner!.emit(event('ScheduleStart'));
    backend.runner!.emit(event('ScheduleEnd'));
    await subject.shutdown();

    expect(seen).toEqual(['ScheduleStart', 'ScheduleEnd']);
    expect(logger.error).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('shuts down once, closes the backend and refuses further use', async () => {
    const { backend, executor: subject } = executor();
    await subject.setup();

    await Promise.all([subject.shutdown(), subject.shutdown()]);
    await subject.shutdown();

    expect(backend.close).toHaveBeenCalledTimes(1);
    await expect(subject.addJob(job())).rejects.toThrow(/shut down/u);
    expect(() => subject.setup()).toThrow(/shut down/u);
  });

  it('releases the backend after a failed setup and allows a retry', async () => {
    const backend = new FakeBackend();
    backend.consume.mockRejectedValueOnce(new Error('consume failed'));
    const { executor: subject } = executor(backend);
    await subject.addJob(job());

    await expect(subject.setup()).rejects.toThrow('consume failed');
    expect(backend.close).toHaveBeenCalledTimes(1);

    await subject.setup();
    expect(backend.open).toHaveBeenCalledTimes(2);
  });

  it('closes a backend whose setup was still running at shutdown', async () => {
    const backend = new FakeBackend();
    let release!: () => void;
    backend.open.mockImplementationOnce(
      () => new Promise<void>((resolve) => (release = resolve)),
    );
    const { executor: subject } = executor(backend);

    const setup = subject.setup();
    const shutdown = subject.shutdown();
    release();
    await setup;
    await shutdown;

    expect(backend.close).toHaveBeenCalledTimes(1);
    await expect(subject.countJob()).rejects.toThrow(/shut down/u);
  });
});
