import type { DatabaseConnection } from '../../database/connection.js';

/** What happened to one row. */
export type RowChangeKind = 'created' | 'updated' | 'deleted';

/**
 * One row a Repository call wrote. A call reports every row it wrote,
 * including the targets, foreign keys and through rows of nested relation
 * writes, so the Collection here may differ from the event's root Collection.
 */
export interface RowChange {
  /** Logical Collection name: the root, a nested target or a through Collection. */
  readonly collection: string;
  readonly kind: RowChangeKind;
  /**
   * The row's identity by logical field name: the primary key, otherwise the
   * unique field set the row was addressed by. A through row is always keyed
   * by its two foreign keys, whether or not the through Collection has a
   * primary key of its own.
   */
  readonly key: Readonly<Record<string, unknown>>;
  /**
   * Logical names of the fields written, for `created` and `updated`. A field
   * written with the value it already held is still listed, and an optimistic
   * lock version that was incremented is listed too.
   */
  readonly fields?: readonly string[];
  /**
   * The logical values written, only for subscriptions with `values: true`.
   * Never a before-image, and never a value the database generated: a
   * database default, an incremented version or the result of an atomic
   * numeric update the call did not read back is absent.
   */
  readonly values?: Readonly<Record<string, unknown>>;
}

/** The Repository write method a mutation event reports. */
export type RepositoryMutationOperation =
  | 'createOne'
  | 'createMany'
  | 'updateOne'
  | 'upsertOne'
  | 'updateMany'
  | 'deleteOne'
  | 'deleteMany';

/** Caller-supplied event metadata by namespace; read it with the handle that defined it. */
export type RepositoryEventMetaBag = Readonly<Record<string, unknown>>;

/** One namespaced metadata value passed to a write method's `meta` option. */
export interface RepositoryEventMetaEntry<T = unknown> {
  readonly kind: 'repositoryEventMeta';
  readonly namespace: string;
  readonly value: T;
}

/** Handle returned by `defineRepositoryEventMeta()`. */
export interface RepositoryEventMeta<T> {
  /** Build the entry a write method's `meta` option accepts. */
  (value: T): RepositoryEventMetaEntry<T>;
  readonly namespace: string;
  /** The value this handle's namespace carries in an event, if the call supplied one. */
  read(source: { readonly meta: RepositoryEventMetaBag }): T | undefined;
}

export interface RepositoryMutationEventBase {
  /** Unique per Repository call. */
  readonly operationId: string;
  /**
   * Set for a write made through the connection a listener received: the
   * `operationId` of the event an `inTransaction` listener was handling, or
   * of the last event in the batch an `afterCommit` listener was handed.
   */
  readonly parentOperationId?: string;
  /** Connection name. */
  readonly connection: string;
  /** Root Collection of the call. */
  readonly collection: string;
  readonly operation: RepositoryMutationOperation;
  /** `transaction` when the call ran in a transaction the caller opened. */
  readonly scope: 'transaction' | 'connection';
  readonly meta: RepositoryEventMetaBag;
}

export interface RepositoryMutationRows {
  readonly granularity: 'rows';
  readonly changes: readonly RowChange[];
}

export interface RepositoryMutationCount {
  readonly granularity: 'count';
  /** Rows the root Collection's bulk statement affected; their keys are unknown. */
  readonly count: number;
}

/**
 * One event per Repository call that wrote at least one row. Check
 * `granularity` before reading `changes`: a bulk write whose matching
 * subscriptions all accept counts, or whose Collection has no row identity,
 * reports only how many rows it affected.
 */
export type RepositoryMutationEvent = RepositoryMutationEventBase &
  (RepositoryMutationRows | RepositoryMutationCount);

export interface RepositoryMutationSubscriptionOptions {
  /** Diagnostic name, shown by `explainRepositoryEvents()` and passed to `onRepositoryEventError`. */
  readonly id?: string;
  /**
   * Collections to observe. An event matches when its root Collection or any
   * of its row changes is in one of them, nested targets and through
   * Collections included; a count event matches by its root Collection. Must
   * not be empty.
   */
  readonly collections: readonly string[];
  /**
   * Whether this subscription needs row keys from bulk writes. Defaults to
   * true, which makes `updateMany` and `deleteMany` lock the matching rows
   * and write them by key. False accepts a count event instead and leaves the
   * bulk write a single statement.
   */
  readonly keys?: boolean;
  /** Whether row changes carry the written values. Defaults to false. */
  readonly values?: boolean;
}

export interface RepositoryMutationListeners {
  /**
   * Runs after the call's writes, inside its transaction, with the
   * transaction connection. Writes made through that connection run in the
   * same transaction and emit events whose `parentOperationId` is this
   * event's `operationId`. Throwing fails the call: an implicit transaction
   * rolls back, and the error reaches the caller unchanged.
   */
  readonly inTransaction?: (
    event: RepositoryMutationEvent,
    connection: DatabaseConnection,
  ) => void | Promise<void>;
  /**
   * Runs once the outermost transaction has committed, with every matching
   * event of that transaction in order and the root connection. Writes made
   * through that connection emit events whose `parentOperationId` is the
   * last event's `operationId` and count one level deeper than the deepest
   * event of the batch towards `repositoryEventMaxDepth`, so a listener that
   * writes the Collection it observes stops with `REPOSITORY_EVENT_RECURSION`
   * instead of running forever. Errors go to `onRepositoryEventError` and
   * never reach the caller.
   */
  readonly afterCommit?: (
    events: readonly RepositoryMutationEvent[],
    connection: DatabaseConnection,
  ) => void | Promise<void>;
}

/** What `onRepositoryEventError` receives along with the error. */
export interface RepositoryEventErrorContext {
  readonly subscriptionId?: string;
  readonly operationIds: readonly string[];
}

export type RepositoryEventPhase = 'inTransaction' | 'afterCommit';

export interface ExplainRepositoryEventsOptions {
  readonly collection: string;
  readonly operation: RepositoryMutationOperation;
}

/**
 * How execution changes because of subscriptions:
 *
 * - `unchanged`: the call runs as it would without subscriptions.
 * - `single-statement`: a bulk write keeps its single statement.
 * - `lock-then-write-by-key`: `updateMany` and `deleteMany` lock the matching
 *   rows, then write them by key.
 * - `insert-returning`: `createMany` inserts all rows in one statement that
 *   returns their keys.
 * - `insert-per-row`: `createMany` inserts row by row to learn their keys.
 *
 * `createMany` rows that all supply their key fields keep a single statement
 * whatever is reported here.
 */
export type RepositoryEventStrategy =
  | 'unchanged'
  | 'single-statement'
  | 'lock-then-write-by-key'
  | 'insert-returning'
  | 'insert-per-row';

export interface RepositoryEventSubscriptionDescription {
  readonly id?: string;
  readonly keys: boolean;
  readonly values: boolean;
  readonly phases: readonly RepositoryEventPhase[];
}

/** What `explainRepositoryEvents()` reports for one Collection and operation. */
export interface RepositoryEventsExplanation {
  /** Subscriptions matching the root Collection. Nested writes may match more. */
  readonly subscriptions: readonly RepositoryEventSubscriptionDescription[];
  readonly strategy: RepositoryEventStrategy;
  /** `none` when no subscription matches and nothing is recorded. */
  readonly granularity: 'none' | 'count' | 'rows';
  /** Whether the call runs in a transaction when the caller has none. */
  readonly implicitTransaction: boolean;
}
