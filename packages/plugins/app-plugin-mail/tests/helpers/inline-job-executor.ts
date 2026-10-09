import type {
  Job,
  JobClass,
  JobExecutor,
  JobReceipt,
  JobSubscriber,
  Unsubscribe,
} from '@nocobase/jobs';

/**
 * Runs each task inside `addJob`, so a test observes a task's outcome as soon as the outbox relay publishes it. Like
 * the real executor it refuses submissions before `setup()` and after `shutdown()`, and executes a fresh instance built
 * from a copy of the payload.
 */
export class InlineJobExecutor implements JobExecutor {
  public readonly registered: Map<string, JobClass<never>> = new Map();
  private state: 'new' | 'ready' | 'closed' = 'new';
  private nextId = 0;

  /** Creates an executor that already accepts tasks, for tests that publish without starting the runtime. */
  public static async ready(): Promise<InlineJobExecutor> {
    const executor = new InlineJobExecutor();
    await executor.setup();
    return executor;
  }

  public registerJob<TPayload>(jobClass: JobClass<TPayload>): void {
    if (this.state === 'closed')
      throw new Error('The inline executor is closed.');
    this.registered.set(jobClass.jobName, jobClass as JobClass<never>);
  }

  public async addJob<TPayload>(job: Job<TPayload>): Promise<JobReceipt> {
    if (this.state !== 'ready')
      throw new Error(`The inline executor is ${this.state}.`);
    const jobClass = job.constructor as JobClass<TPayload>;
    if (this.registered.get(jobClass.jobName) !== jobClass)
      throw new Error(`Job "${jobClass.jobName}" is not registered.`);
    const receipt: JobReceipt = {
      jobId: String((this.nextId += 1)),
      jobName: jobClass.jobName,
      enqueuedAt: new Date(),
    };
    await new jobClass(structuredClone(job.payload)).execute({
      ...receipt,
      runAt: new Date(),
      attempt: 1,
      signal: new AbortController().signal,
      reportProgress: async () => undefined,
    });
    return receipt;
  }

  public subscribe(_subscriber: JobSubscriber): Unsubscribe {
    return () => undefined;
  }

  public async setup(): Promise<void> {
    if (this.state === 'closed')
      throw new Error('The inline executor is closed.');
    this.state = 'ready';
  }

  public async shutdown(): Promise<void> {
    this.state = 'closed';
  }
}
