import type { Unsubscribe } from '../types.js';

/** A payload-only job. Subclasses declare their own stable static jobName. */
export abstract class Job<TPayload = unknown> {
  public constructor(public readonly payload: TPayload) {}
  public abstract execute(context: JobExecutionContext): Promise<void>;
}

/** Constructors must be side-effect free and require no dependencies beyond payload. */
export interface JobClass<
  TPayload = unknown,
  TJob extends Job<TPayload> = Job<TPayload>,
> {
  readonly jobName: string;
  new (payload: TPayload): TJob;
}

export interface JobExecutor {
  registerJob<TPayload>(jobClass: JobClass<TPayload>): void;
  /** Snapshots payload immediately; resolves only after backend acceptance. */
  addJob<TPayload>(job: Job<TPayload>): Promise<JobReceipt>;
  subscribe(subscriber: JobSubscriber): Unsubscribe;
  setup(options?: JobSetupOptions): Promise<void>;
  shutdown(): Promise<void>;
}

export interface JobSetupOptions {
  /** False opens a producer only. The first setup call fixes this choice. */
  readonly consume?: boolean;
}

export interface JobReceipt {
  readonly jobId: string;
  readonly jobName: string;
  readonly enqueuedAt: Date;
}

export interface JobExecutionContext extends JobReceipt {
  readonly runAt: Date;
  /** One-based execution starts, including starts after interruption or stalled recovery. */
  readonly attempt: number;
  readonly signal: AbortSignal;
  /**
   * Reports how far this attempt has come, from 0 to 100. Resolves once the
   * backend has stored it and emits a local `JobProgress` event. Progress
   * belongs to one attempt: a retry or recovered start reports from scratch.
   */
  readonly reportProgress: (progress: number) => Promise<void>;
}

export type JobEventName = 'JobStart' | 'JobProgress' | 'JobEnd' | 'JobError';
export type JobErrorReason =
  'handler-not-registered' | 'execute-failed' | 'interrupted';

interface JobEventBase extends JobReceipt {
  readonly runAt: Date;
  readonly attempt: number;
}

/** Local execution notifications, not durable backend acknowledgements or final task state. */
export type JobEvent =
  | (JobEventBase & { readonly name: 'JobStart' })
  | (JobEventBase & { readonly name: 'JobProgress'; readonly progress: number })
  | (JobEventBase & { readonly name: 'JobEnd' })
  | (JobEventBase & {
      readonly name: 'JobError';
      readonly reason: JobErrorReason;
      readonly error: Error;
    });

export type JobSubscriber = (event: JobEvent) => void | Promise<void>;

export class JobHandlerNotRegisteredError extends Error {
  public constructor(
    public readonly jobName: string,
    public readonly jobId: string,
  ) {
    super(
      `No handler is registered for job "${jobName}" (${jobId}) on this instance.`,
    );
    this.name = 'JobHandlerNotRegisteredError';
  }
}

/** Throw only when an aborted attempt has not finished its work. */
export class JobInterruptedError extends Error {
  public constructor(message: string = 'The job execution was interrupted.') {
    super(message);
    this.name = 'JobInterruptedError';
  }
}
