import { describe, expect, it, vi } from 'vitest';
import type {
  JobBackend,
  JobRun,
  JobRunner,
  JobSubmission,
} from '../../../src/job/backend.js';
import { BackendJobExecutor } from '../../../src/job/executor.js';
import {
  Job,
  JobHandlerNotRegisteredError,
  JobInterruptedError,
  type JobEvent,
  type JobExecutionContext,
  type JobReceipt,
} from '../../../src/job/types.js';

class Backend implements JobBackend {
  runner: JobRunner | undefined;
  open = vi.fn(async () => undefined);
  consume = vi.fn(async (runner: JobRunner) => {
    this.runner = runner;
  });
  enqueue = vi.fn(async (submission: JobSubmission): Promise<JobReceipt> => ({
    jobId: 'receipt',
    jobName: submission.jobName,
    enqueuedAt: new Date(0),
  }));
  close = vi.fn(async () => undefined);
  run(input: Partial<JobRun> = {}): Promise<void> {
    if (!this.runner) throw new Error('No consumer');
    return this.runner.run({
      jobId: 'id',
      jobName: 'task',
      enqueuedAt: new Date(0),
      runAt: new Date(1),
      attempt: 1,
      payload: 1,
      signal: new AbortController().signal,
      reportProgress: async () => undefined,
      ...input,
    });
  }
}
class Task extends Job<number> {
  static readonly jobName: string = 'task';
  async execute(): Promise<void> {}
}
function harness() {
  const backend = new Backend();
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const executor = new BackendJobExecutor(backend, logger);
  return { backend, executor, logger };
}

describe('ordinary executor lifecycle and class boundary', () => {
  it('registers before setup without constructing jobs', () => {
    let constructions = 0;
    class Registered extends Job<number> {
      static readonly jobName: string = 'task';
      constructor(payload: number) {
        super(payload);
        constructions += 1;
      }
      async execute(): Promise<void> {}
    }
    const { executor, backend } = harness();
    executor.registerJob(Registered);
    executor.registerJob(Registered);
    expect(constructions).toBe(0);
    expect(backend.open).not.toHaveBeenCalled();
  });

  it('rejects nonclasses, missing own names, invalid names, and extra required constructor arguments', () => {
    class Missing extends Job<number> {
      async execute(): Promise<void> {}
    }
    class Inherited extends Task {}
    class Extra extends Job<number> {
      static readonly jobName: string = 'extra';
      constructor(
        payload: number,
        readonly dependency: string,
      ) {
        super(payload);
      }
      async execute(): Promise<void> {}
    }
    const { executor } = harness();
    const register = executor.registerJob.bind(executor);
    for (const value of [
      null,
      undefined,
      {},
      Job,
      () => undefined,
      Missing,
      Inherited,
      Extra,
      class {
        static jobName = 'fake';
        execute() {}
      },
    ]) {
      expect(() => Reflect.apply(register, undefined, [value])).toThrow(
        TypeError,
      );
    }
    for (const name of ['', ' ', 'a:b', 'a b', 'a\nb', 7]) {
      class Invalid extends Task {}
      Object.defineProperty(Invalid, 'jobName', { value: name });
      expect(() => Reflect.apply(register, undefined, [Invalid])).toThrow(
        /jobName/u,
      );
    }
  });

  it('runtime-validates constructors when automatic registration cannot know the static type', async () => {
    class Missing extends Job<number> {
      async execute(): Promise<void> {}
    }
    const { executor, backend } = harness();
    await executor.setup({ consume: false });
    await expect(executor.addJob(new Missing(1))).rejects.toThrow(/jobName/u);
    const forged = new Task(2);
    Object.defineProperty(forged, 'constructor', { value: Missing });
    await expect(executor.addJob(forged)).rejects.toThrow(/constructor/u);
    await expect(
      Reflect.apply(executor.addJob.bind(executor), undefined, [
        { payload: 1, execute: async () => undefined },
      ]),
    ).rejects.toThrow(/Job instance/u);
    expect(backend.enqueue).not.toHaveBeenCalled();
    await executor.shutdown();
  });

  it('captures the class prototype method rather than arbitrary instance handlers', async () => {
    const own = vi.fn(async () => undefined);
    const fixed = vi.fn();
    class Fixed extends Job<number> {
      static readonly jobName: string = 'task';
      constructor(payload: number) {
        super(payload);
        this.execute = own;
      }
      async execute(): Promise<void> {
        fixed(this.payload);
      }
    }
    const { executor, backend } = harness();
    executor.registerJob(Fixed);
    await executor.setup();
    await executor.addJob(new Fixed(3));
    await backend.run({ payload: 3 });
    expect(fixed).toHaveBeenCalledWith(3);
    expect(own).not.toHaveBeenCalled();
    await executor.shutdown();
  });

  it('rejects singleton reconstruction instead of sharing mutable instances', async () => {
    class Singleton extends Job<number> {
      static readonly jobName: string = 'task';
      static instance: Singleton | undefined;
      constructor(payload: number) {
        super(payload);
        if (Singleton.instance) return Singleton.instance;
        Singleton.instance = this;
      }
      async execute(): Promise<void> {}
    }
    const { executor, backend } = harness();
    await executor.setup();
    await executor.addJob(new Singleton(1));
    await expect(backend.run()).rejects.toThrow(/fresh instance/u);
    await executor.shutdown();
  });

  it('waits for setup and consumption readiness while snapshotting before the wait', async () => {
    class PayloadTask extends Job<{ value: number }> {
      static readonly jobName: string = 'payload';
      async execute(): Promise<void> {}
    }
    const { executor, backend } = harness();
    const opened = Promise.withResolvers<void>();
    const consuming = Promise.withResolvers<void>();
    backend.open.mockImplementation(() => opened.promise);
    backend.consume.mockImplementation(async () => consuming.promise);
    const setup = executor.setup();
    expect(executor.setup({ consume: false })).toBe(setup);
    const source = new PayloadTask({ value: 1 });
    const added = executor.addJob(source);
    source.payload.value = 2;
    await Promise.resolve();
    expect(backend.enqueue).not.toHaveBeenCalled();
    opened.resolve();
    await vi.waitFor(() => expect(backend.consume).toHaveBeenCalledOnce());
    expect(backend.enqueue).not.toHaveBeenCalled();
    consuming.resolve();
    await setup;
    await added;
    expect(backend.enqueue).toHaveBeenCalledExactlyOnceWith({
      jobName: 'payload',
      payload: { value: 1 },
    });
    await executor.shutdown();
  });

  it('producer-only setup never begins consumption on a second setup', async () => {
    const { executor, backend } = harness();
    await executor.setup({ consume: false });
    await executor.setup();
    await executor.addJob(new Task(1));
    expect(backend.consume).not.toHaveBeenCalled();
    expect(backend.enqueue).toHaveBeenCalledOnce();
    await executor.shutdown();
  });

  it.each(['open', 'consume'] as const)(
    'cleans a failed %s and permits an explicit setup retry',
    async (operation) => {
      const { executor, backend } = harness();
      backend[operation].mockRejectedValueOnce(new Error('setup failed'));
      const setup = executor.setup();
      const submission = executor.addJob(new Task(1));
      await expect(setup).rejects.toThrow('setup failed');
      await expect(submission).rejects.toThrow('setup failed');
      expect(backend.close).toHaveBeenCalledOnce();
      expect(backend.enqueue).not.toHaveBeenCalled();
      await expect(executor.addJob(new Task(2))).rejects.toThrow(/setup/u);
      await executor.setup();
      await executor.addJob(new Task(2));
      await executor.shutdown();
      expect(backend.close).toHaveBeenCalledTimes(2);
    },
  );

  it('reports both setup and cleanup failures rather than swallowing cleanup', async () => {
    const { executor, backend } = harness();
    backend.open.mockRejectedValue(new Error('open'));
    backend.close.mockRejectedValue(new Error('close'));
    await expect(executor.setup()).rejects.toMatchObject({
      errors: [
        expect.objectContaining({ message: 'open' }),
        expect.objectContaining({ message: 'close' }),
      ],
    });
    expect(() => executor.setup()).toThrow(/shut down/u);
  });

  it('does not consume or accept pending submissions when shutdown races setup', async () => {
    const { executor, backend } = harness();
    const opened = Promise.withResolvers<void>();
    backend.open.mockImplementation(() => opened.promise);
    const setup = executor.setup();
    const submission = executor.addJob(new Task(1));
    const rejection = submission.catch((error: unknown) => error);
    const shutdown = executor.shutdown();
    expect(executor.shutdown()).toBe(shutdown);
    opened.resolve();
    await setup;
    await shutdown;
    await expect(rejection).resolves.toMatchObject({
      message: expect.stringMatching(/shut down/u),
    });
    expect(backend.consume).not.toHaveBeenCalled();
    expect(backend.enqueue).not.toHaveBeenCalled();
    expect(backend.close).toHaveBeenCalledOnce();
  });

  it('drains accepted submissions before closing backend resources', async () => {
    const { executor, backend } = harness();
    const accepted = Promise.withResolvers<JobReceipt>();
    backend.enqueue.mockImplementation(() => accepted.promise);
    await executor.setup();
    const submission = executor.addJob(new Task(1));
    const closing = executor.shutdown();
    await Promise.resolve();
    await Promise.resolve();
    expect(backend.close).not.toHaveBeenCalled();
    accepted.resolve({ jobId: 'id', jobName: 'task', enqueuedAt: new Date(0) });
    await submission;
    await closing;
    expect(backend.close).toHaveBeenCalledOnce();
    await expect(executor.addJob(new Task(2))).rejects.toThrow(/shut down/u);
    expect(() => executor.registerJob(Task)).toThrow(/shut down/u);
  });

  it('delivers events in order and isolates throwing subscribers and loggers', async () => {
    const { executor, backend, logger } = harness();
    const events: JobEvent[] = [];
    const removed = vi.fn();
    executor.subscribe(async () => {
      throw new Error('subscriber');
    });
    executor.subscribe((event) => {
      events.push(event);
    });
    const unsubscribe = executor.subscribe(removed);
    unsubscribe();
    unsubscribe();
    logger.error.mockImplementation(() => {
      throw new Error('logger');
    });
    executor.registerJob(Task);
    await executor.setup();
    await backend.run();
    await expect(backend.run({ jobName: 'missing' })).rejects.toBeInstanceOf(
      JobHandlerNotRegisteredError,
    );
    await executor.shutdown();
    expect(events.map((event) => event.name)).toEqual([
      'JobStart',
      'JobEnd',
      'JobStart',
      'JobError',
    ]);
    expect(events[3]).toMatchObject({
      reason: 'handler-not-registered',
      jobId: 'id',
      error: expect.objectContaining({ jobId: 'id', jobName: 'missing' }),
    });
    expect(logger.error).toHaveBeenCalledTimes(4);
    expect(removed).not.toHaveBeenCalled();
  });

  it.each(['success', 'reason', 'explicit', 'business', 'unaborted'] as const)(
    'classifies shutdown outcome %s without misreporting final task state',
    async (kind) => {
      class AbortTask extends Job<null> {
        static readonly jobName: string = 'task';
        async execute({ signal }: JobExecutionContext): Promise<void> {
          if (kind === 'reason') signal.throwIfAborted();
          if (kind === 'explicit' || kind === 'unaborted')
            throw new JobInterruptedError();
          if (kind === 'business') throw new Error('business');
        }
      }
      const { executor, backend } = harness();
      const events: JobEvent[] = [];
      executor.subscribe((event) => {
        events.push(event);
      });
      executor.registerJob(AbortTask);
      await executor.setup();
      const controller = new AbortController();
      if (kind !== 'unaborted') controller.abort(new Error('closing'));
      const result = backend.run({ signal: controller.signal, payload: null });
      if (kind === 'success') await result;
      else await expect(result).rejects.toThrow();
      await executor.shutdown();
      expect(events[1]).toMatchObject(
        kind === 'success'
          ? { name: 'JobEnd' }
          : {
              name: 'JobError',
              reason: ['reason', 'explicit'].includes(kind)
                ? 'interrupted'
                : 'execute-failed',
            },
      );
    },
  );

  it('reports progress through the backend and as local events between start and end', async () => {
    const stored: number[] = [];
    class Progressing extends Job<number> {
      static readonly jobName: string = 'task';
      async execute({ reportProgress }: JobExecutionContext): Promise<void> {
        await reportProgress(50);
        await reportProgress(100);
      }
    }
    const { executor, backend } = harness();
    const events: JobEvent[] = [];
    executor.subscribe((event) => {
      events.push(event);
    });
    executor.registerJob(Progressing);
    await executor.setup();
    await backend.run({
      reportProgress: async (progress) => {
        stored.push(progress);
      },
    });
    await executor.shutdown();
    expect(stored).toEqual([50, 100]);
    expect(
      events.map((event) =>
        event.name === 'JobProgress'
          ? `${event.name}:${event.progress}`
          : event.name,
      ),
    ).toEqual(['JobStart', 'JobProgress:50', 'JobProgress:100', 'JobEnd']);
  });

  it('rejects invalid progress and progress reported after the attempt ended', async () => {
    let late: JobExecutionContext['reportProgress'] | undefined;
    const invalid: unknown[] = [];
    class Reporter extends Job<number> {
      static readonly jobName: string = 'task';
      async execute({ reportProgress }: JobExecutionContext): Promise<void> {
        for (const value of [-1, 101, Number.NaN, '50'])
          await reportProgress(value as number).catch((error: unknown) => {
            invalid.push(error);
          });
        late = reportProgress;
      }
    }
    const stored = vi.fn(async () => undefined);
    const { executor, backend } = harness();
    const events: JobEvent[] = [];
    executor.subscribe((event) => {
      events.push(event);
    });
    executor.registerJob(Reporter);
    await executor.setup();
    await backend.run({ reportProgress: stored });
    await expect(late!(10)).rejects.toThrow(/already finished/u);
    await executor.shutdown();
    expect(invalid).toHaveLength(4);
    for (const error of invalid) expect(error).toBeInstanceOf(RangeError);
    expect(stored).not.toHaveBeenCalled();
    expect(events.map((event) => event.name)).toEqual(['JobStart', 'JobEnd']);
  });
});
