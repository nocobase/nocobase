import {
  Queue,
  UnrecoverableError,
  WaitingError,
  Worker,
  type BackendFactory,
  type ConnectionOptions,
  type IQueueBackend,
  type Job,
  type JobsOptions,
} from 'bullmq';

import type { DispatchOutcome } from '../consumer.js';
import {
  decodeEnvelope,
  encodeEnvelope,
  type PreparedJob,
  type QueueMessageEnvelope,
} from '../message.js';
import { redisQueueIdentity } from '../naming.js';
import type { QueueRuntime, QueueRuntimeContext } from '../runtime.js';
import type { RateLimitOptions } from '../types.js';

type EnvelopeQueue = Queue<
  QueueMessageEnvelope,
  void,
  string,
  QueueMessageEnvelope,
  void,
  string,
  IQueueBackend
>;
type EnvelopeWorker = Worker<QueueMessageEnvelope, void, string, IQueueBackend>;
type EnvelopeJob = Job<QueueMessageEnvelope, void, string>;

/**
 * One logical queue on BullMQ, through public Queue and Worker APIs only.
 * Both are built with the configuration's backend factory, passed
 * explicitly: no process-wide default factory is involved.
 */
export class RedisQueueRuntime implements QueueRuntime {
  private queue: EnvelopeQueue | undefined;
  private worker: EnvelopeWorker | undefined;
  private workerClosing: Promise<void> | undefined;
  private concurrency: number;
  private readonly prefix: string;
  private readonly name: string;

  public constructor(
    private readonly context: QueueRuntimeContext,
    private readonly factory: BackendFactory,
  ) {
    const identity = redisQueueIdentity(
      context.config.namespace,
      context.queue,
    );
    this.prefix = identity.prefix;
    this.name = identity.name;
    this.concurrency = context.config.concurrency;
  }

  public async open(): Promise<void> {
    const queue: EnvelopeQueue = new Queue(
      this.name,
      { connection: this.connection(), prefix: this.prefix },
      this.factory,
    );
    // Assigned first, so close() reaches a queue whose initialization failed.
    this.queue = queue;
    queue.on('error', (error: Error) => this.report(error, 'queue'));
    await queue.waitUntilReady();
  }

  public async add(jobs: readonly PreparedJob[]): Promise<string[]> {
    const queue = this.requireQueue();
    if (jobs.length === 1) {
      const [job] = jobs;
      const added = await queue.add(
        job.channel,
        encodeEnvelope(job.text),
        jobOptions(job),
      );
      return [requireJobId(added)];
    }
    const added = await queue.addBulk(
      jobs.map((job) => ({
        name: job.channel,
        data: encodeEnvelope(job.text),
        opts: jobOptions(job),
      })),
    );
    return added.map(requireJobId);
  }

  public async startConsuming(concurrency: number): Promise<void> {
    this.concurrency = concurrency;
    if (this.workerClosing) return;
    if (this.worker) {
      if (this.worker.isPaused()) await this.worker.resume();
      return;
    }
    const worker: EnvelopeWorker = new Worker(
      this.name,
      // BullMQ passes its AbortSignal only to processors declaring three parameters.
      (job: EnvelopeJob, token: string | undefined, signal?: AbortSignal) =>
        this.process(job, token, signal),
      {
        connection: this.connection(),
        prefix: this.prefix,
        concurrency: this.concurrency,
      },
      this.factory,
    );
    this.worker = worker;
    worker.on('error', (error: Error) => this.report(error, 'worker'));
    await worker.waitUntilReady();
  }

  public async pauseConsuming(): Promise<void> {
    if (!this.worker || this.workerClosing || this.worker.isPaused()) return;
    // Running jobs go on; a job fetched in the meantime finds no handler and returns to waiting.
    await this.worker.pause(true);
  }

  public setConcurrency(concurrency: number): void {
    this.concurrency = concurrency;
    if (this.worker) this.worker.concurrency = concurrency;
  }

  public async setRateLimit(rateLimit: RateLimitOptions | null): Promise<void> {
    const queue = this.requireQueue();
    if (rateLimit === null) await queue.removeGlobalRateLimit();
    else await queue.setGlobalRateLimit(rateLimit.max, rateLimit.duration);
  }

  public async drain(delayed: boolean): Promise<void> {
    await this.requireQueue().drain(delayed);
  }

  public stopConsuming(): Promise<void> {
    // Graceful close stops fetching, waits for running processors, then closes the worker's connections.
    this.workerClosing ??= this.worker?.close() ?? Promise.resolve();
    return this.workerClosing;
  }

  public async close(): Promise<void> {
    const errors: unknown[] = [];
    if (this.worker && !this.workerClosing) {
      try {
        await this.stopConsuming();
      } catch (error) {
        errors.push(error);
      }
    }
    try {
      await this.queue?.close();
    } catch (error) {
      errors.push(error);
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) {
      throw new AggregateError(
        errors,
        `Failed to close queue "${this.context.queue}".`,
      );
    }
  }

  private async process(
    job: EnvelopeJob,
    token: string | undefined,
    signal: AbortSignal | undefined,
  ): Promise<void> {
    let outcome: DispatchOutcome;
    try {
      if (!job.id) throw new Error('The queued job has no ID.');
      outcome = await this.context.dispatcher.dispatch(
        { id: job.id, channel: job.name, text: decodeEnvelope(job.data) },
        signal,
      );
    } catch (error) {
      // Data this package did not write cannot succeed on a retry.
      throw new UnrecoverableError(
        `Queue job ${job.id ?? '(no ID)'} cannot be read: ${errorMessage(error)}`,
      );
    }
    switch (outcome.kind) {
      case 'completed':
        return;
      case 'failed':
        throw outcome.error instanceof Error
          ? outcome.error
          : new Error(errorMessage(outcome.error));
      case 'cancelled':
        throw new UnrecoverableError(outcome.reason);
      case 'requeue':
        // Never transition without the processor's lock token.
        if (!token) throw new Error('The queue job holds no lock token.');
        await job.moveToWait(token);
        // The public sentinel keeps BullMQ from completing or failing the job.
        throw new WaitingError();
    }
  }

  private connection(): ConnectionOptions {
    // Validated as an object for `redis`; a registered factory interprets its own connection.
    return this.context.config.connection as ConnectionOptions;
  }

  private requireQueue(): EnvelopeQueue {
    if (!this.queue) {
      throw new Error(`Queue "${this.context.queue}" is not open.`);
    }
    return this.queue;
  }

  private report(error: Error, resource: 'queue' | 'worker'): void {
    this.context.logger.error(
      {
        error,
        queue: this.context.queue,
        namespace: this.context.config.namespace,
      },
      `The ${resource} of queue "${this.context.queue}" reported an error.`,
    );
  }
}

function jobOptions(job: PreparedJob): JobsOptions {
  const { options } = job;
  return {
    ...(job.jobId !== undefined ? { jobId: job.jobId } : {}),
    ...(options.priority > 0 ? { priority: options.priority } : {}),
    ...(options.delay > 0 ? { delay: options.delay } : {}),
    attempts: options.attempts,
    ...(options.backoff !== undefined ? { backoff: options.backoff } : {}),
    removeOnComplete: options.removeOnComplete,
    removeOnFail: options.removeOnFail,
  };
}

function requireJobId(job: { readonly id?: string }): string {
  if (!job.id) throw new Error('BullMQ returned a job without an ID.');
  return job.id;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
