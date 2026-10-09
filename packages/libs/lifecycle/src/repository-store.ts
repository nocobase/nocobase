import type {
  DatabaseConnection,
  DatabaseManager,
  Repository,
  RepositoryRecord,
  Row,
} from '@nocobase/db';

import { LIFECYCLE_COLLECTIONS } from './collections.js';
import type {
  EffectRun,
  EffectRunChanges,
  EffectRunCondition,
  EffectRunPruneQuery,
  EffectRunQuery,
  EffectRunStatus,
  IdleRecordQuery,
  LifecycleStore,
  NewEffectRun,
  NewTransitionEntry,
  PendingContinuation,
  RecordCondition,
  TransactionOptions,
  TransitionEntry,
  TransitionListOptions,
} from './store.js';
import { abandonedAt, transitionRequestKey, waitingDueAt } from './store.js';
import type {
  JsonObject,
  JsonValue,
  LifecycleRecord,
  RecordId,
} from './types.js';

export interface RepositoryLifecycleStoreOptions {
  /** The connection holding the records and the lifecycle collections. */
  readonly connection?: string;
  /** Collection names for the log and the effect runs; see {@link LIFECYCLE_COLLECTIONS}. */
  readonly collections?: {
    readonly transitions: string;
    readonly effectRuns: string;
  };
}

interface CollectionNames {
  readonly transitions: string;
  readonly effectRuns: string;
}

type RepositoryOf = (collection: string) => Repository;

/**
 * A `bigInt` filter takes a JavaScript number, while ids travel as strings;
 * a key that is not a safe integer is used as it is.
 */
function key(id: RecordId): RecordId {
  if (typeof id === 'number') return id;
  const numeric = Number(id);
  return /^\d+$/.test(id) && Number.isSafeInteger(numeric) ? numeric : id;
}

function text(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function json<T extends JsonValue>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    // A JSON string scalar arrives already decoded.
    return value as T;
  }
}

/** Lifecycle values are JSON-shaped; the Repository encodes them per field. */
function asRow(input: Readonly<Record<string, unknown>>): RepositoryRecord {
  return input as RepositoryRecord;
}

/** What the driver client of a connection says about the transaction it runs in. */
interface TransactionClient {
  readonly isTransaction?: unknown;
  readonly isCompleted?: () => unknown;
}

/**
 * What `within` must be here: a `@nocobase/db` transaction connection on the
 * connection this store writes to, still running. Anything else would only
 * look like joining: a root connection opens a transaction of its own that
 * commits whatever the caller then does — and on SQLite waits for the only
 * connection, which the caller's transaction holds — and a connection of
 * another name writes to that database's collections of the same name.
 */
async function joinable(
  handle: unknown,
  root: DatabaseConnection,
): Promise<DatabaseConnection> {
  const candidate = handle as Partial<DatabaseConnection> | null;
  if (
    typeof candidate?.transaction !== 'function' ||
    typeof candidate.afterCommit !== 'function' ||
    typeof candidate.repository !== 'function' ||
    typeof candidate.client !== 'function'
  )
    throw new Error(
      'A Repository lifecycle store nests a transaction only within a @nocobase/db connection, such as the one a transaction received.',
    );
  const connection = handle as DatabaseConnection;
  if (connection.name !== root.name)
    throw new Error(
      `The transaction to join runs on connection "${connection.name}", but this lifecycle store writes to "${root.name}"; pass a transaction of "${root.name}".`,
    );
  if (connection === root)
    throw new Error(
      `The connection "${root.name}" itself is not a transaction: pass the connection your transaction callback received, not the one it was opened on.`,
    );
  // `@nocobase/db` does not say whether a connection is a transaction, but
  // its driver client does: a Knex transaction marks itself, and knows when
  // it has completed. This also catches a policy-bound root connection.
  const client = await connection.client<TransactionClient | null>();
  if (client?.isTransaction !== true)
    throw new Error(
      `The connection passed to join is not a transaction on "${root.name}": pass the connection your transaction callback received.`,
    );
  if (typeof client.isCompleted === 'function' && client.isCompleted() === true)
    throw new Error(
      'Transaction query already complete: the transaction to join has already committed or rolled back. Join it from inside its callback.',
    );
  return connection;
}

function toTransition(row: Row): TransitionEntry {
  return {
    id: String(row.id),
    lifecycle: String(row.lifecycle),
    recordId: String(row.recordId),
    transition: String(row.transition),
    from: text(row.from),
    to: String(row.to),
    actorId: String(row.actorId),
    input: json<JsonObject>(row.input, {}),
    at: text(row.at) ?? '',
    version: Number(row.version ?? 0),
    requestId: text(row.requestId),
  };
}

function toEffectRun(row: Row): EffectRun {
  return {
    id: String(row.id),
    transitionId: String(row.transitionId),
    lifecycle: String(row.lifecycle),
    recordId: String(row.recordId),
    effect: String(row.effect),
    stayBound: Boolean(row.stayBound),
    status: String(row.status) as EffectRunStatus,
    attempts: Number(row.attempts),
    maxAttempts: Number(row.maxAttempts),
    result: json<JsonValue>(row.result, null),
    error: text(row.error),
    createdAt: text(row.createdAt) ?? '',
    updatedAt: text(row.updatedAt) ?? '',
    claimedAt: text(row.claimedAt),
    runAfter: text(row.runAfter),
    continuation: toContinuation(row.continuation),
  };
}

/** A pending continuation as stored, or null; a value of another shape reads as none. */
function toContinuation(value: unknown): PendingContinuation | null {
  const stored = json<JsonValue>(value, null);
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored))
    return null;
  const {
    transition,
    outcome,
    input,
    error,
    code,
    attempts,
    errorTries,
    failedAt,
    dueAt,
    abandonedAt: abandoned,
  } = stored;
  if (
    typeof transition !== 'string' ||
    (outcome !== 'succeeded' && outcome !== 'failed') ||
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input)
  )
    return null;
  return {
    transition,
    outcome,
    input,
    error: typeof error === 'string' ? error : '',
    code: typeof code === 'string' ? code : '',
    attempts: typeof attempts === 'number' ? attempts : 0,
    errorTries: typeof errorTries === 'number' ? errorTries : 0,
    failedAt: typeof failedAt === 'string' ? failedAt : '',
    dueAt:
      typeof dueAt === 'string'
        ? dueAt
        : typeof failedAt === 'string'
          ? failedAt
          : '',
    abandonedAt: typeof abandoned === 'string' ? abandoned : null,
  };
}

/**
 * The columns a run's continuation is written to: the continuation itself;
 * `continuationDueAt`, its `dueAt` as a plain timestamp that is null
 * exactly when nothing waits — no continuation, or one the sweep gave up on
 * — so a query finds the waiting runs, and the due ones in the order they
 * fell due; and `continuationAbandonedAt`, its `abandonedAt`, null unless
 * the sweep gave up on it, so a query finds those too. Both work on every
 * dialect without filtering on JSON, which no portable filter can test for
 * being set.
 */
function continuationColumns(
  continuation: PendingContinuation | null,
): Record<string, unknown> {
  return {
    continuation,
    continuationDueAt: waitingDueAt(continuation),
    continuationAbandonedAt: abandonedAt(continuation),
  };
}

function toRecord(row: Row): LifecycleRecord {
  const values: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(row))
    values[field] = value instanceof Date ? value.toISOString() : value;
  return Object.freeze(values) as LifecycleRecord;
}

class RepositoryLifecycleStore implements LifecycleStore {
  public constructor(
    private readonly names: CollectionNames,
    private readonly repository: RepositoryOf,
    private readonly begin: <R>(
      work: (store: LifecycleStore) => Promise<R>,
    ) => Promise<R>,
    private readonly nest: <R>(
      within: unknown,
      work: (store: LifecycleStore) => Promise<R>,
    ) => Promise<R>,
    public readonly transactionHandle?: DatabaseConnection,
  ) {}

  public transaction<R>(
    work: (store: LifecycleStore) => Promise<R>,
    options: TransactionOptions = {},
  ): Promise<R> {
    return options.within === undefined
      ? this.begin(work)
      : this.nest(options.within, work);
  }

  public afterCommit(callback: () => void | Promise<void>): void {
    if (!this.transactionHandle)
      throw new Error(
        'afterCommit is only available inside a transaction, on the store its work receives.',
      );
    this.transactionHandle.afterCommit(callback);
  }

  public async findRecord(
    collection: string,
    id: RecordId,
  ): Promise<LifecycleRecord | undefined> {
    const row = await this.repository(collection).findOne({
      filter: { id: key(id) },
    });
    return row ? toRecord(row) : undefined;
  }

  public async createRecord(
    collection: string,
    values: Readonly<Record<string, unknown>>,
  ): Promise<LifecycleRecord> {
    const created = await this.repository(collection).createOne({
      values: asRow(values),
    });
    return toRecord(created.record);
  }

  public async updateRecordIf(
    collection: string,
    id: RecordId,
    condition: RecordCondition,
    values: Readonly<Record<string, unknown>>,
  ): Promise<boolean> {
    const result = await this.repository(collection).updateMany({
      // A null version filters as IS NULL, for rows written before it existed.
      filter: {
        id: key(id),
        [condition.stateField]: condition.state,
        [condition.versionField]: condition.version,
      },
      values: asRow(values),
    });
    return result.updatedCount > 0;
  }

  public async findIdleRecords(
    collection: string,
    query: IdleRecordQuery,
  ): Promise<LifecycleRecord[]> {
    const { after } = query;
    const rows = await this.repository(collection).findMany({
      filter: (filter) =>
        filter.and([
          filter.or(
            query.states.map((state) =>
              filter.string(query.stateField).eq(state),
            ),
          ),
          filter.date(query.changedAtField).before(query.changedBefore),
          // The page after the cursor, in the order below. A non-numeric id
          // cannot be compared through the filter, so records sharing the
          // cursor's instant are left to the next sweep.
          ...(after === undefined
            ? []
            : [
                typeof key(after.id) === 'number'
                  ? filter.or([
                      filter.date(query.changedAtField).after(after.changedAt),
                      filter.and([
                        filter
                          .date(query.changedAtField)
                          .notBefore(after.changedAt),
                        filter
                          .date(query.changedAtField)
                          .notAfter(after.changedAt),
                        filter.number('id').gt(key(after.id) as number),
                      ]),
                    ])
                  : filter.date(query.changedAtField).after(after.changedAt),
              ]),
        ]),
      sort: (sort) => [
        sort.field(query.changedAtField).asc(),
        sort.field('id').asc(),
      ],
      limit: query.limit,
    });
    return rows.map(toRecord);
  }

  public async appendTransition(
    entry: NewTransitionEntry,
  ): Promise<TransitionEntry> {
    const created = await this.repository(this.names.transitions).createOne({
      values: asRow({ ...entry, requestKey: transitionRequestKey(entry) }),
    });
    return toTransition(created.record);
  }

  public async findTransition(
    id: string,
  ): Promise<TransitionEntry | undefined> {
    const row = await this.repository(this.names.transitions).findOne({
      filter: { id: key(id) },
    });
    return row ? toTransition(row) : undefined;
  }

  public async findTransitionByRequest(
    lifecycle: string,
    recordId: string,
    requestId: string,
  ): Promise<TransitionEntry | undefined> {
    // By the unique key, which equals the request id wherever there is one.
    const row = await this.repository(this.names.transitions).findOne({
      filter: { lifecycle, recordId, requestKey: requestId, requestId },
    });
    return row ? toTransition(row) : undefined;
  }

  public async listTransitions(
    lifecycle: string,
    recordId: string,
    options: TransitionListOptions = {},
  ): Promise<TransitionEntry[]> {
    const { after } = options;
    const rows = await this.repository(this.names.transitions).findMany({
      filter: (filter) =>
        filter.and([
          filter.string('lifecycle').eq(lifecycle),
          filter.string('recordId').eq(recordId),
          ...(after === undefined ? [] : [filter.number('id').gt(key(after))]),
        ]),
      sort: (sort) => sort.field('id').asc(),
    });
    return rows.map(toTransition);
  }

  public async createEffectRun(run: NewEffectRun): Promise<EffectRun> {
    const created = await this.repository(this.names.effectRuns).createOne({
      values: asRow({
        ...run,
        transitionId: key(run.transitionId),
        ...continuationColumns(run.continuation ?? null),
      }),
    });
    return toEffectRun(created.record);
  }

  public async findEffectRun(id: string): Promise<EffectRun | undefined> {
    const row = await this.repository(this.names.effectRuns).findOne({
      filter: { id: key(id) },
    });
    return row ? toEffectRun(row) : undefined;
  }

  public async updateEffectRun(
    id: string,
    condition: EffectRunCondition,
    changes: EffectRunChanges,
  ): Promise<boolean> {
    const due = condition.continuationDueAt;
    const result = await this.repository(this.names.effectRuns).updateMany({
      filter: (filter) =>
        filter.and([
          filter.number('id').eq(key(id)),
          filter.string('status').eq(condition.status),
          ...(condition.attempts === undefined
            ? []
            : [filter.number('attempts').eq(condition.attempts)]),
          // A timestamp takes no equality filter of its own: equal is
          // neither before nor after. Null means nothing waits.
          ...(due === undefined
            ? []
            : due === null
              ? [filter.date('continuationDueAt').empty()]
              : [
                  filter.date('continuationDueAt').notBefore(due),
                  filter.date('continuationDueAt').notAfter(due),
                ]),
        ]),
      values: asRow({
        ...changes,
        ...(changes.continuation === undefined
          ? {}
          : continuationColumns(changes.continuation)),
      }),
    });
    return result.updatedCount > 0;
  }

  public async listEffectRuns(query: EffectRunQuery): Promise<EffectRun[]> {
    const rows = await this.repository(this.names.effectRuns).findMany({
      filter: (filter) =>
        filter.and([
          ...(query.lifecycle === undefined
            ? []
            : [filter.string('lifecycle').eq(query.lifecycle)]),
          ...(query.recordId === undefined
            ? []
            : [filter.string('recordId').eq(query.recordId)]),
          ...(query.effect === undefined
            ? []
            : [filter.string('effect').eq(query.effect)]),
          ...(query.status === undefined
            ? []
            : [filter.string('status').eq(query.status)]),
          ...(query.claimedBefore === undefined
            ? []
            : [filter.date('claimedAt').before(query.claimedBefore)]),
          ...(query.updatedBefore === undefined
            ? []
            : [filter.date('updatedAt').before(query.updatedBefore)]),
          ...(query.continuationPending === undefined
            ? []
            : [
                query.continuationPending
                  ? filter.date('continuationDueAt').notEmpty()
                  : filter.date('continuationDueAt').empty(),
              ]),
          ...(query.continuationAbandoned === undefined
            ? []
            : [
                query.continuationAbandoned
                  ? filter.date('continuationAbandonedAt').notEmpty()
                  : filter.date('continuationAbandonedAt').empty(),
              ]),
          ...(query.continuationDueBy === undefined
            ? []
            : [
                filter.date('continuationDueAt').notEmpty(),
                filter
                  .date('continuationDueAt')
                  .notAfter(query.continuationDueBy),
              ]),
        ]),
      sort: (sort) =>
        query.continuationDueBy === undefined
          ? sort.field('id').asc()
          : [sort.field('continuationDueAt').asc(), sort.field('id').asc()],
      ...(query.limit === undefined ? {} : { limit: query.limit }),
    });
    return rows.map(toEffectRun);
  }

  public async deleteEffectRuns(query: EffectRunPruneQuery): Promise<number> {
    if (!query.statuses.length) return 0;
    const { deletedCount } = await this.repository(
      this.names.effectRuns,
    ).deleteMany({
      filter: (filter) =>
        filter.and([
          filter.or(
            query.statuses.map((status) => filter.string('status').eq(status)),
          ),
          filter.date('updatedAt').before(query.updatedBefore),
          // Its outcome has yet to move the record, whether its
          // continuation waits or was given up on: keep it.
          filter.date('continuationDueAt').empty(),
          filter.date('continuationAbandonedAt').empty(),
        ]),
    });
    return deletedCount;
  }
}

/**
 * A store over `@nocobase/db` Repositories. Inside a transaction its
 * `transactionHandle` is the transaction's `DatabaseConnection`: a service
 * that reads from a guard must use it, because on SQLite the transaction
 * holds the only connection and a read elsewhere would wait for it forever.
 * A transaction `within` a caller's transaction connection is a savepoint on
 * it, so a lifecycle call can join the caller's transaction; the connection
 * must be a running transaction on the connection this store writes to.
 * Records are read and written through the lifecycle's own collection, so
 * its field types are encoded per dialect the way every other write to that
 * collection is.
 *
 * Each log entry also stores `requestKey`, a non-null string column: its
 * `requestId`, or `$v:<version>` without one (see `transitionRequestKey`).
 * The log collection declares unique indexes on `(lifecycle, recordId,
 * version)` and `(lifecycle, recordId, requestKey)`, the same on every
 * dialect.
 *
 * Each effect run also stores `continuationDueAt`, a nullable `datetimeTz`
 * column alongside the nullable `continuation` (json): the `dueAt` of a
 * waiting continuation, and null when none waits, which is how the sweep
 * finds the waiting runs that are due without filtering on JSON, and what a
 * write that clears or rewrites a continuation is conditioned on. A second
 * nullable `datetimeTz` column, `continuationAbandonedAt`, holds the
 * `abandonedAt` of a continuation the sweep gave up on, so those runs can
 * be listed, and kept from `prune()`, the same way.
 */
export function createRepositoryLifecycleStore(
  database: DatabaseManager,
  options: RepositoryLifecycleStoreOptions = {},
): LifecycleStore {
  const name = options.connection;
  const names: CollectionNames = options.collections ?? LIFECYCLE_COLLECTIONS;
  // A transaction opened on a transaction connection is a savepoint of it,
  // whose afterCommit callbacks wait for the outermost commit.
  const nest = async <R>(
    within: unknown,
    work: (store: LifecycleStore) => Promise<R>,
  ): Promise<R> => {
    const connection = await joinable(within, database.connection(name));
    return connection.transaction((transaction) => {
      const inner: LifecycleStore = new RepositoryLifecycleStore(
        names,
        (collection) => transaction.repository(collection),
        (nested) => nested(inner),
        nest,
        transaction,
      );
      return work(inner);
    });
  };
  return new RepositoryLifecycleStore(
    names,
    (collection) => database.repository(collection, name),
    (work) =>
      database.transaction((connection) => {
        const inner: LifecycleStore = new RepositoryLifecycleStore(
          names,
          (collection) => connection.repository(collection),
          (nested) => nested(inner),
          nest,
          connection,
        );
        return work(inner);
      }, name),
    nest,
  );
}
