import type {
  JsonObject,
  JsonValue,
  LifecycleRecord,
  RecordId,
} from './types.js';

/** One fired transition: the audit trail, and the answer to "how did it get here". */
export interface TransitionEntry {
  readonly id: string;
  readonly lifecycle: string;
  readonly recordId: string;
  readonly transition: string;
  /** Null on the entry `runtime.create()` writes: the record came from nothing. */
  readonly from: string | null;
  readonly to: string;
  readonly actorId: string;
  readonly input: JsonObject;
  readonly at: string;
  /**
   * The record's version after this transition. Unique per record, so a
   * store with a unique index refuses a second entry for the same version
   * even if a conditional update were ever bypassed.
   */
  readonly version: number;
  /**
   * The caller's key for this request, unique per record when present: the
   * same submission sent twice finds this entry instead of firing again.
   */
  readonly requestId: string | null;
}

/**
 * `dead` is a run whose attempts all ended without a result, because the
 * process running them stopped. It continues with nothing: someone looks at
 * it and retries it or gives up.
 */
export type EffectRunStatus =
  'queued' | 'running' | 'succeeded' | 'failed' | 'dead' | 'cancelled';

/**
 * One effect a transition owes. It is written in the same transaction as the
 * transition, so a committed transition never loses its effects; dispatching
 * it is a separate, repeatable step.
 */
export interface EffectRun {
  readonly id: string;
  readonly transitionId: string;
  readonly lifecycle: string;
  readonly recordId: string;
  readonly effect: string;
  /** Whether this run was queued for an onEnter stay; fixed when queued, independent of later definitions. */
  readonly stayBound: boolean;
  readonly status: EffectRunStatus;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly result: JsonValue;
  readonly error: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** When the current attempt started; a stale one is reclaimed by `recover()`. */
  readonly claimedAt: string | null;
  /** Earliest time a queued run may start, for a retry with backoff. */
  readonly runAfter: string | null;
  /**
   * The transition the run's outcome still has to fire, or null when there
   * is none. Set when the effect's `onSuccess` or `onFailure` was refused
   * for a reason time or a deploy can remove — most often a lifecycle call
   * in its `onTransition` or a hook that was refused, such as a parent not
   * ready to move, or a definition this process does not have yet, such as
   * `UNKNOWN_TRANSITION` or `INVALID_SET`: the outcome is recorded and the
   * effect never runs again, while `reclaim()` and `continueRun()` try the
   * continuation again until it fires, the record moves on, or the sweep
   * gives up on it (see {@link PendingContinuation.abandonedAt}).
   */
  readonly continuation: PendingContinuation | null;
}

/** An effect's continuation that has not fired yet; see {@link EffectRun.continuation}. */
export interface PendingContinuation {
  /** The effect's `onSuccess` or `onFailure` when the outcome was recorded. */
  readonly transition: string;
  /** Which outcome it continues: its request id is `$run:<runId>:<outcome>`. */
  readonly outcome: 'succeeded' | 'failed';
  /** What the transition receives: the effect's result, or `{ error, errorCode?, details? }`. */
  readonly input: JsonObject;
  /** Why the last try was refused. */
  readonly error: string;
  /**
   * The `LifecycleError` code of that refusal, or `ERROR` for an exception
   * that was not one.
   */
  readonly code: string;
  /**
   * How many times it has been refused, the first refusal included: what
   * the sweep counts toward giving up. A `CONFLICT` does not count, nor does
   * an error that is not a refusal, which `errorTries` counts instead.
   */
  readonly attempts: number;
  /**
   * How many tries ended in an error that is not a refusal, such as a
   * database failing mid-try. They back off as refusals do, but never lead
   * to giving up: a failing database says nothing about the continuation.
   */
  readonly errorTries: number;
  /** When the last try was refused. */
  readonly failedAt: string;
  /**
   * When the sweep may try it next: `failedAt` plus a backoff that grows
   * with `attempts`. `continueRun()` does not wait for it.
   */
  readonly dueAt: string;
  /**
   * When the sweep gave up on it, after `continuations.maxAttempts` tries,
   * or null while it waits. A continuation given up on is never tried by
   * the sweep again, but still keeps `prune()` from deleting its run, the
   * record of an outcome its record never followed; `continueRun()` still
   * tries it, and clears it once it fires.
   */
  readonly abandonedAt: string | null;
}

/**
 * When the sweep is due to try a run's continuation: its `dueAt` while it
 * waits, and null when the run has none or it was given up on. A store
 * keeps it where a query and a conditional write can compare it, such as
 * the Repository store's `continuationDueAt` column.
 */
export function waitingDueAt(
  continuation: PendingContinuation | null,
): string | null {
  return continuation && !continuation.abandonedAt ? continuation.dueAt : null;
}

/**
 * When the sweep gave up on a run's continuation, and null when the run has
 * none or it still waits. A store keeps it where a query can find it, such
 * as the Repository store's `continuationAbandonedAt` column.
 */
export function abandonedAt(
  continuation: PendingContinuation | null,
): string | null {
  return continuation?.abandonedAt ?? null;
}

export type NewTransitionEntry = Omit<TransitionEntry, 'id'>;

/**
 * The key a store deduplicates log entries by: the entry's `requestId`, or
 * `$v:<version>` when it has none. It is never null, so one unique index on
 * `(lifecycle, recordId, requestKey)` behaves the same on every dialect,
 * whether that dialect lets a unique index hold several NULLs, counts NULL
 * as a value, or treats rows whose other columns match as duplicates.
 * Request ids starting with `$` are reserved — the runtime refuses them from
 * callers and itself uses only `$run:` — so the derived key never collides
 * with one.
 */
export function transitionRequestKey(
  entry: Pick<NewTransitionEntry, 'requestId' | 'version'>,
): string {
  return entry.requestId ?? `$v:${String(entry.version)}`;
}
/** A run as written for a transition; it has no pending continuation unless it says so. */
export type NewEffectRun = Omit<EffectRun, 'id' | 'continuation'> & {
  readonly continuation?: PendingContinuation | null;
};
export type EffectRunChanges = Partial<
  Omit<
    EffectRun,
    'id' | 'transitionId' | 'lifecycle' | 'recordId' | 'effect' | 'stayBound'
  >
>;

/**
 * What a record must still be for a transition to write it. The version is
 * what makes a self-transition safe: the state alone would not change.
 */
export interface RecordCondition {
  readonly stateField: string;
  readonly state: string;
  readonly versionField: string;
  /** Null matches a record written before it had a version. */
  readonly version: number | null;
}

/**
 * What an effect run must still be for a write to it. `attempts` fences an
 * attempt: once `recover()` takes a run back and another worker claims it,
 * the first worker's writes no longer match and are dropped.
 */
export interface EffectRunCondition {
  readonly status: EffectRunStatus;
  readonly attempts?: number;
  /**
   * The run's waiting continuation must still be due at this instant, or,
   * for null, none may wait (see {@link waitingDueAt}). A write that clears
   * or rewrites a continuation names the one it read, so one acting on an
   * older read — another sweep's, before that sweep's refusal pushed the due
   * time back or dropped it — writes nothing.
   */
  readonly continuationDueAt?: string | null;
}

export interface EffectRunQuery {
  readonly lifecycle?: string;
  readonly recordId?: string;
  readonly effect?: string;
  readonly status?: EffectRunStatus;
  readonly claimedBefore?: string;
  /** Runs last changed before this instant. */
  readonly updatedBefore?: string;
  /**
   * True for the runs whose continuation waits to be tried again, false for
   * the others: those with none, and those whose continuation the sweep
   * gave up on, which have one with `abandonedAt` set.
   */
  readonly continuationPending?: boolean;
  /**
   * True for the runs whose continuation the sweep gave up on, false for
   * the others: those with none, and those whose continuation waits. With
   * `continuationPending: false`, false lists the runs with no continuation
   * at all.
   */
  readonly continuationAbandoned?: boolean;
  /**
   * Only runs whose pending continuation is due at or before this instant,
   * the earliest due first rather than by id, so `limit` takes the ones that
   * have waited longest.
   */
  readonly continuationDueBy?: string;
  readonly limit?: number;
}

/**
 * Which finished runs `deleteEffectRuns` removes. A run that holds a
 * continuation is never removed, whether it waits or was given up on: its
 * outcome has yet to move the record, and the run is the only record of it.
 */
export interface EffectRunPruneQuery {
  readonly statuses: readonly EffectRunStatus[];
  /** Runs last changed before this instant. */
  readonly updatedBefore: string;
}

/**
 * Records idle in one of `states` since before `changedBefore`, oldest first
 * and then by id, so a sweep can page through them: `after` names the last
 * record of the previous page, and only records sorting after it are
 * returned.
 */
export interface IdleRecordQuery {
  readonly stateField: string;
  readonly states: readonly string[];
  readonly changedAtField: string;
  readonly changedBefore: string;
  readonly limit: number;
  readonly after?: IdleRecordCursor;
}

/** Where the previous page of {@link IdleRecordQuery} ended. */
export interface IdleRecordCursor {
  readonly changedAt: string;
  readonly id: RecordId;
}

export interface TransitionListOptions {
  /** The id of an entry of the same record: only those logged after it. */
  readonly after?: string;
}

export interface TransactionOptions {
  /**
   * The `transactionHandle` of a transaction still running, such as the
   * `@nocobase/db` connection a caller's own transaction received, to nest
   * this one in. It must belong to the same store, or be a transaction on
   * the same database connection the store writes to; a root connection, a
   * connection of another name, or a transaction that has already committed
   * or rolled back is refused rather than silently written outside it.
   */
  readonly within?: unknown;
}

/**
 * Everything the runtime persists. Two implementations ship: one over
 * `@nocobase/db` Repositories and one in memory for tests. Each method is a
 * single statement, so an implementation needs nothing beyond ordinary reads,
 * inserts and conditional updates — which every supported dialect has.
 */
export interface LifecycleStore {
  /**
   * What a transaction runs on, such as a `@nocobase/db` connection, for
   * services that read other collections from a guard, and for a lifecycle
   * call that joins this transaction. Absent outside a transaction.
   */
  readonly transactionHandle?: unknown;
  /**
   * Runs `work` in one transaction; inside it, `store` is that transaction.
   * With `within`, the work is nested in a transaction the caller already
   * holds, as a savepoint: a failure undoes only what the work wrote, and
   * nothing it registered with `afterCommit` runs before the outermost
   * transaction commits.
   */
  transaction<R>(
    work: (store: LifecycleStore) => Promise<R>,
    options?: TransactionOptions,
  ): Promise<R>;
  /**
   * Only on the store a transaction's work receives: runs `callback` once
   * the outermost transaction has committed, and never if it rolls back.
   * The transaction `transaction()` was called for resolves once its
   * callbacks have finished.
   */
  afterCommit(callback: () => void | Promise<void>): void;

  findRecord(
    collection: string,
    id: RecordId,
  ): Promise<LifecycleRecord | undefined>;
  /** Inserts a record and returns it as stored, its id included. */
  createRecord(
    collection: string,
    values: Readonly<Record<string, unknown>>,
  ): Promise<LifecycleRecord>;
  /**
   * Writes `values` only while the record still matches `condition`.
   * Returns whether it did: the condition is what makes two concurrent
   * transitions of one record safe without a lock.
   */
  updateRecordIf(
    collection: string,
    id: RecordId,
    condition: RecordCondition,
    values: Readonly<Record<string, unknown>>,
  ): Promise<boolean>;
  findIdleRecords(
    collection: string,
    query: IdleRecordQuery,
  ): Promise<LifecycleRecord[]>;

  appendTransition(entry: NewTransitionEntry): Promise<TransitionEntry>;
  findTransition(id: string): Promise<TransitionEntry | undefined>;
  /** The entry a request already wrote on a record, if it did. */
  findTransitionByRequest(
    lifecycle: string,
    recordId: string,
    requestId: string,
  ): Promise<TransitionEntry | undefined>;
  /**
   * Oldest first: in the order they were logged, which is the order of
   * their ids. With `after`, only the entries logged after the entry with
   * that id.
   */
  listTransitions(
    lifecycle: string,
    recordId: string,
    options?: TransitionListOptions,
  ): Promise<TransitionEntry[]>;

  createEffectRun(run: NewEffectRun): Promise<EffectRun>;
  findEffectRun(id: string): Promise<EffectRun | undefined>;
  /** Writes `changes` only while the run still matches `condition`; the same guard as records. */
  updateEffectRun(
    id: string,
    condition: EffectRunCondition,
    changes: EffectRunChanges,
  ): Promise<boolean>;
  /** Oldest first. */
  listEffectRuns(query: EffectRunQuery): Promise<EffectRun[]>;
  /** Removes finished runs that hold no continuation; returns how many. */
  deleteEffectRuns(query: EffectRunPruneQuery): Promise<number>;
}
