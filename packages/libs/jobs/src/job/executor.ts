import type { JobBackend, JobRun, JobRunner } from './backend.js';
import {
  Job,
  JobHandlerNotRegisteredError,
  JobInterruptedError,
  type JobClass,
  type JobEvent,
  type JobExecutor,
  type JobReceipt,
  type JobSetupOptions,
  type JobSubscriber,
} from './types.js';
import {
  assertJobClass,
  assertJobProgress,
  copyJobPayload,
} from './validation.js';
import type { JobsLogger, Unsubscribe } from '../types.js';

type State = 'created' | 'setting-up' | 'ready' | 'closed';

export class BackendJobExecutor implements JobExecutor {
  private state: State = 'created';
  private readonly classes = new Map<string, JobClass>();
  private readonly methods = new Map<string, Job['execute']>();
  private readonly instances = new WeakSet<Job>();
  private readonly subscribers = new Set<JobSubscriber>();
  private readonly submissions = new Set<Promise<JobReceipt>>();
  private delivery: Promise<void> = Promise.resolve();
  private setupPromise: Promise<void> | undefined;
  private shutdownPromise: Promise<void> | undefined;
  private opened = false;

  public constructor(
    private readonly backend: JobBackend,
    private readonly logger: JobsLogger | undefined,
  ) {}

  public registerJob<TPayload>(jobClass: JobClass<TPayload>): void {
    this.assertOpen();
    this.register(jobClass);
  }

  private register(value: unknown): JobClass {
    assertJobClass(value);
    const previous = this.classes.get(value.jobName);
    if (previous && previous !== value) {
      throw new Error(
        `A different class is already registered for job "${value.jobName}".`,
      );
    }
    // A mutable static name must not silently create a second identity.
    for (const [name, registered] of this.classes) {
      if (registered === value && name !== value.jobName) {
        throw new Error('A registered job class must not change its jobName.');
      }
    }
    const prototype: unknown = value.prototype;
    if (!(prototype instanceof Job))
      throw new TypeError('A job class must extend Job.');
    if (!previous) {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- Called with each fresh instance via execute.call(instance, context).
      this.methods.set(value.jobName, prototype.execute);
    }
    this.classes.set(value.jobName, value);
    return value;
  }

  public async addJob<TPayload>(job: Job<TPayload>): Promise<JobReceipt> {
    this.assertOpen();
    if (this.state === 'created')
      throw new Error(
        'Call setup() before addJob(): the job backend is not open yet.',
      );
    if (!(job instanceof Job))
      throw new TypeError('addJob() requires a Job instance.');
    const prototype: unknown = Object.getPrototypeOf(job);
    if (
      typeof prototype !== 'object' ||
      prototype === null ||
      !('constructor' in prototype) ||
      job.constructor !== prototype.constructor
    ) {
      throw new TypeError('A job must use its class constructor.');
    }
    const jobClass = this.register(prototype.constructor);
    const jobName = jobClass.jobName;
    const payload = copyJobPayload(job.payload);
    this.instances.add(job);
    if (this.state === 'setting-up') await this.setupPromise;
    this.assertOpen();
    if (this.state !== 'ready')
      throw new Error('The job backend is not ready.');
    const submission = this.backend.enqueue({ jobName, payload });
    this.submissions.add(submission);
    try {
      return await submission;
    } finally {
      this.submissions.delete(submission);
    }
  }

  public subscribe(subscriber: JobSubscriber): Unsubscribe {
    this.assertOpen();
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  public setup(options: JobSetupOptions = {}): Promise<void> {
    this.assertOpen();
    if (!this.setupPromise) {
      this.state = 'setting-up';
      const consume = options.consume ?? true;
      this.setupPromise = Promise.resolve().then(() => this.runSetup(consume));
    }
    return this.setupPromise;
  }

  public shutdown(): Promise<void> {
    if (!this.shutdownPromise) {
      this.state = 'closed';
      this.shutdownPromise = Promise.resolve().then(() => this.runShutdown());
    }
    return this.shutdownPromise;
  }

  private async runSetup(consume: boolean): Promise<void> {
    try {
      await this.backend.open();
      this.opened = true;
      if (this.state !== 'closed' && consume)
        await this.backend.consume(this.runner);
      if (this.state !== 'closed') this.state = 'ready';
    } catch (error) {
      this.opened = false;
      try {
        await this.backend.close();
      } catch (cleanupError) {
        this.state = 'closed';
        throw new AggregateError(
          [error, cleanupError],
          'Job setup and resource cleanup failed.',
          { cause: cleanupError },
        );
      }
      if (this.state !== 'closed') {
        this.state = 'created';
        this.setupPromise = undefined;
      }
      throw error;
    }
  }

  private async runShutdown(): Promise<void> {
    try {
      await this.setupPromise?.catch(() => undefined);
      await Promise.allSettled([...this.submissions]);
      if (this.opened) {
        this.opened = false;
        await this.backend.close();
      }
    } finally {
      await this.delivery;
      this.classes.clear();
      this.methods.clear();
      this.subscribers.clear();
    }
  }

  private assertOpen(): void {
    if (this.state === 'closed')
      throw new Error('The job executor has been shut down.');
  }

  private emit(event: JobEvent): void {
    const subscribers = [...this.subscribers];
    this.delivery = this.delivery.then(async () => {
      for (const subscriber of subscribers) {
        try {
          await subscriber(event);
        } catch (error) {
          // Diagnostics must not break delivery to the remaining subscribers.
          try {
            this.logger?.error(
              { error, event: event.name, jobId: event.jobId },
              'A job event subscriber failed',
            );
          } catch {
            /* The logger is an external dependency. */
          }
        }
      }
    });
  }

  private async execute(run: JobRun): Promise<void> {
    const base = {
      jobId: run.jobId,
      jobName: run.jobName,
      enqueuedAt: new Date(run.enqueuedAt),
      runAt: new Date(run.runAt),
      attempt: run.attempt,
    };
    let settled = false;
    this.emit({ name: 'JobStart', ...base });
    try {
      const jobClass = this.classes.get(run.jobName);
      if (!jobClass)
        throw new JobHandlerNotRegisteredError(run.jobName, run.jobId);
      assertJobClass(jobClass);
      if (jobClass.jobName !== run.jobName)
        throw new Error('A registered job class changed its jobName.');
      const instance = new jobClass(copyJobPayload(run.payload));
      if (
        !(instance instanceof Job) ||
        Object.getPrototypeOf(instance) !== jobClass.prototype ||
        this.instances.has(instance)
      ) {
        throw new TypeError(
          'A job constructor must return a fresh instance of its registered class.',
        );
      }
      this.instances.add(instance);
      const execute = this.methods.get(run.jobName);
      if (!execute)
        throw new JobHandlerNotRegisteredError(run.jobName, run.jobId);
      await execute.call(instance, {
        ...base,
        enqueuedAt: new Date(base.enqueuedAt),
        runAt: new Date(base.runAt),
        signal: run.signal,
        reportProgress: async (progress: number): Promise<void> => {
          assertJobProgress(progress);
          // A report after the attempt settled would reach subscribers after
          // its JobEnd or JobError, describing work that is already over.
          if (settled) throw new Error('The job attempt has already finished.');
          await run.reportProgress(progress);
          if (!settled) this.emit({ name: 'JobProgress', ...base, progress });
        },
      });
      settled = true;
      this.emit({ name: 'JobEnd', ...base });
    } catch (caught) {
      settled = true;
      const interrupted =
        run.signal.aborted &&
        (caught instanceof JobInterruptedError || caught === run.signal.reason);
      const error = interrupted
        ? new JobInterruptedError()
        : caught instanceof JobInterruptedError
          ? new Error(caught.message, { cause: caught })
          : caught instanceof Error
            ? caught
            : new Error(String(caught));
      this.emit({
        name: 'JobError',
        ...base,
        reason: interrupted
          ? 'interrupted'
          : error instanceof JobHandlerNotRegisteredError
            ? 'handler-not-registered'
            : 'execute-failed',
        error,
      });
      throw error;
    }
  }

  private readonly runner: JobRunner = { run: (run) => this.execute(run) };
}
