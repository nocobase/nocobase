import type {
  Job,
  JobClass,
  JobExecutor,
  JobReceipt,
  JobSubscriber,
  Unsubscribe,
} from '@nocobase/jobs';

/**
 * Runs each task inside `addJob`, so a test observes a run's outcome as soon
 * as the call that published it returns, as the queue's `sync` driver did. Like
 * the real executor it refuses submissions before `setup()` and after
 * `shutdown()`, and executes a fresh instance built from a copy of the
 * payload. `tests/queue-adapter.test.ts` and `tests/runtime.test.ts` cover the
 * asynchronous memory backend the application actually runs on.
 */
export class InlineJobExecutor implements JobExecutor {
  readonly registered = new Map<string, JobClass<never>>();
  private state: 'new' | 'ready' | 'closed' = 'new';
  private nextId = 0;

  registerJob<TPayload>(jobClass: JobClass<TPayload>): void {
    this.registered.set(jobClass.jobName, jobClass as JobClass<never>);
  }

  async addJob<TPayload>(job: Job<TPayload>): Promise<JobReceipt> {
    if (this.state !== 'ready')
      throw new Error(`The inline executor is ${this.state}.`);
    const jobClass = job.constructor as JobClass<TPayload>;
    this.registerJob(jobClass);
    const receipt: JobReceipt = {
      jobId: String((this.nextId += 1)),
      jobName: jobClass.jobName,
      enqueuedAt: new Date(),
    };
    const payload = structuredClone(job.payload);
    await new jobClass(payload).execute({
      ...receipt,
      runAt: new Date(),
      attempt: 1,
      signal: new AbortController().signal,
      reportProgress: async () => undefined,
    });
    return receipt;
  }

  subscribe(_subscriber: JobSubscriber): Unsubscribe {
    return () => undefined;
  }

  async setup(): Promise<void> {
    if (this.state === 'closed')
      throw new Error('The inline executor is closed.');
    this.state = 'ready';
  }

  async shutdown(): Promise<void> {
    this.state = 'closed';
  }
}
