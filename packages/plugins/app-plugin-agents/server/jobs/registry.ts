/**
 * The job kinds the application registers. A kind names what the job is for in the application's terms (a preview
 * build, a release build) and which of the runner's executors runs it (`build`); the plugin knows nothing more of it. Only registered kinds can be enqueued.
 */
import { JOB_KINDS, type JobKind } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import type { Job, JobEventView } from '../../shared/jobs.js';
import type { Runner } from '../../shared/runners.js';
import { invalid } from '../kernel/errors.js';
import type { Tx } from '../kernel/tx.js';
import type { JobSpecInput } from './spec.js';

/** What the claim hands a kind's `prepare`. */
export interface JobPrepareContext<Spec> {
  /** The claim's transaction: read only what the job needs, and call no network. */
  readonly conn: DatabaseConnection;
  readonly job: Job;
  /** The spec as `validate` returned it at enqueue. */
  readonly spec: Spec;
  readonly runner: Runner;
}

export interface JobKindRegistration<Spec = unknown> {
  /** What the runner executes; the kind's own name when that is an executor (`build`). */
  readonly executor?: JobKind;
  /**
   * Checks what the application enqueues and returns what is stored (JSON). Throw `ProtocolError('INVALID_REQUEST')`
   * (or any error) to refuse it. Without `prepare`, the result must be the executor's spec (`JobSpecInputs`), which the
   * plugin checks too.
   */
  validate?(spec: unknown): Spec;
  /**
   * At claim, in the claim's transaction: the spec the runner gets, such as with an upload ticket minted now rather
   * than when the job was queued. Throwing leaves the job queued, and three failures fail it `setupFailed`. Without
   * it, the stored spec goes as it is.
   */
  prepare?(context: JobPrepareContext<Spec>): Promise<JobSpecInput>;
  /** Events the runner reported were stored; after the commit, best effort. */
  onEvent?(job: Job, events: readonly JobEventView[]): void | Promise<void>;
  /**
   * The job ended (completed, failed or cancelled), in the transaction that ended it: write what must stay consistent
   * with it here, and start anything slow or remote after the commit (`jobs.watch`). Throwing rolls the ending back.
   */
  onDone?(tx: Tx, job: Job): Promise<void>;
}

export interface RegisteredJobKind extends JobKindRegistration {
  readonly kind: string;
  readonly executor: JobKind;
}

export interface JobKindRegistry {
  register<Spec>(kind: string, registration: JobKindRegistration<Spec>): void;
  get(kind: string): RegisteredJobKind | undefined;
  list(): RegisteredJobKind[];
}

const KIND_PATTERN = /^[a-z][a-z0-9-]*(?:[.:][a-z][a-z0-9-]*)*$/u;

export function createJobKindRegistry(): JobKindRegistry {
  const kinds = new Map<string, RegisteredJobKind>();
  return {
    register(kind, registration) {
      if (!KIND_PATTERN.test(kind) || kind.length > 64)
        throw invalid(
          `A job kind is lower-case words joined by dots or colons, up to 64 characters: "${kind}".`,
        );
      const executor =
        registration.executor ??
        ((JOB_KINDS as readonly string[]).includes(kind)
          ? (kind as JobKind)
          : undefined);
      if (!executor)
        throw invalid(
          `Job kind "${kind}" names no executor; give one of ${JOB_KINDS.join(', ')}.`,
        );
      if (kinds.has(kind))
        throw invalid(`Job kind "${kind}" is already registered.`);
      kinds.set(kind, {
        ...(registration as JobKindRegistration),
        kind,
        executor,
      });
    },
    get: (kind) => kinds.get(kind),
    list: () => [...kinds.values()],
  };
}
