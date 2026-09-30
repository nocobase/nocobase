import { Job, type JobExecutionContext } from '@nocobase/jobs';

export interface __NOCOBASE_SYMBOL_NAME__JobPayload {
  readonly requestedAt: string;
}

/**
 * One-off background work. The constructor takes only the payload, which must be strict JSON: a queued task is
 * rebuilt from it for every attempt, in whichever process runs it. A job that calls a Service receives it by closure:
 * wrap the class in a factory that the provider calls with the Service, and register what the factory returns.
 */
export class __NOCOBASE_SYMBOL_NAME__Job extends Job<__NOCOBASE_SYMBOL_NAME__JobPayload> {
  // Stored with every queued task: keep it stable across class and file renames.
  public static readonly jobName: string = __NOCOBASE_JOB_NAME_LITERAL__;

  public async execute({ signal }: JobExecutionContext): Promise<void> {
    signal.throwIfAborted();
    // Orchestrate retryable, idempotent work here; keep domain behavior in a Service.
  }
}
