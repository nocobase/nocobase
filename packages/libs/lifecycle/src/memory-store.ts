import type {
  EffectRun,
  EffectRunChanges,
  EffectRunCondition,
  EffectRunPruneQuery,
  EffectRunQuery,
  RecordCondition,
  IdleRecordQuery,
  LifecycleStore,
  NewEffectRun,
  NewTransitionEntry,
  TransactionOptions,
  TransitionEntry,
  TransitionListOptions,
} from './store.js';
import { abandonedAt, transitionRequestKey, waitingDueAt } from './store.js';
import type { LifecycleRecord, RecordId } from './types.js';

/** The sweep order: oldest change first, then by id, as a database index would. */
function compareIdle(
  changedAtField: string,
): (a: LifecycleRecord, b: LifecycleRecord) => number {
  return (a, b) => {
    const left = String(a[changedAtField]);
    const right = String(b[changedAtField]);
    if (left !== right) return left < right ? -1 : 1;
    return compareIds(a.id, b.id);
  };
}

function compareIds(a: RecordId, b: RecordId): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const left = String(a);
  const right = String(b);
  return left === right ? 0 : left < right ? -1 : 1;
}

function isDueBy(dueAt: string | null, by: string): boolean {
  return dueAt !== null && dueAt <= by;
}

interface MemoryState {
  records: Map<string, Map<string, LifecycleRecord>>;
  transitions: TransitionEntry[];
  effectRuns: Map<string, EffectRun>;
  sequence: number;
}

/** Puts back what one write replaced; see {@link MemoryLifecycleStore.transaction}. */
type Undo = () => void;

/** What one transaction, or one transaction nested in it, has to undo or run after commit. */
interface Scope {
  readonly journal: Undo[];
  readonly commits: (() => void | Promise<void>)[];
  /** Set once the scope has committed, been released to its parent, or rolled back. */
  finished: boolean;
}

/** What `@nocobase/db` answers for a transaction connection used after it ended. */
const FINISHED =
  'Transaction query already complete: this memory store transaction has already committed or rolled back. Use the store itself, or a transaction that is still running.';

function openScope(): Scope {
  return { journal: [], commits: [], finished: false };
}

/**
 * Sets or removes `key`, and returns how to put back what was there — unless
 * something else has written the key since, which a rollback must not undo.
 */
function write<V>(
  map: Map<string, V>,
  key: string,
  value: V | undefined,
): Undo {
  const previous = map.get(key);
  if (value === undefined) map.delete(key);
  else map.set(key, value);
  return (): void => {
    if (map.get(key) !== value) return;
    if (previous === undefined) map.delete(key);
    else map.set(key, previous);
  };
}

/**
 * Writes `values` over a record, and returns the record written and how to
 * undo it. The undo works field by field, as a database rollback would after
 * a write made outside the transaction waited for the row's lock: a field
 * still holding the value written here gets its previous value back, and
 * every other field — one an outside write changed meanwhile — keeps what
 * it holds now.
 */
function update(
  rows: Map<string, LifecycleRecord>,
  key: string,
  current: LifecycleRecord,
  values: Readonly<Record<string, unknown>>,
): [LifecycleRecord, Undo] {
  const written = Object.freeze({
    ...current,
    ...values,
    id: current.id,
  }) as LifecycleRecord;
  rows.set(key, written);
  const undo = (): void => {
    const now = rows.get(key);
    if (!now) return;
    // Nothing has written the row since: put back the record exactly, so an
    // earlier undo of this transaction still recognizes it as its own.
    if (now === written) {
      rows.set(key, current);
      return;
    }
    const restored: Record<string, unknown> = { ...now };
    let changed = false;
    for (const field of Object.keys(values)) {
      if (field === 'id' || !Object.is(now[field], written[field])) continue;
      if (Object.hasOwn(current, field)) restored[field] = current[field];
      else delete restored[field];
      changed = true;
    }
    if (changed) rows.set(key, Object.freeze(restored) as LifecycleRecord);
  };
  return [written, undo];
}

/** Rows a second layer reads and writes through an open memory handle. */
export interface MemoryRows {
  /** Adds a row, the way a create form or a seed would. */
  insertRecord(
    collection: string,
    values: Readonly<Record<string, unknown>>,
  ): LifecycleRecord;
  /** Changes fields of a row, the way an edit form would. */
  patchRecord(
    collection: string,
    id: RecordId,
    values: Readonly<Record<string, unknown>>,
  ): LifecycleRecord;
  /** The row as it is now, read synchronously. */
  record(collection: string, id: RecordId): LifecycleRecord | undefined;
  /** Every row of a collection, in the order they were added. */
  records(collection: string): LifecycleRecord[];
}

/**
 * One transaction of a {@link MemoryLifecycleStore}: the store's methods,
 * with every write remembered so a failure can take back exactly what this
 * transaction wrote. It is also the transaction's `transactionHandle`.
 */
export interface MemoryTransaction extends LifecycleStore, MemoryRows {}

/**
 * A store in process memory, for tests and examples. A transaction keeps a
 * log of what its own writes replaced and puts it back when the work fails,
 * so a refused transition leaves nothing behind here either, while a write
 * made outside the transaction meanwhile — a worker claiming an effect run,
 * an edit to another field of a record the transaction changed — survives
 * the rollback, as it would on a database. Unlike a database, a write
 * outside the transaction does not wait for it, and sees what it has not
 * committed yet.
 */
export class MemoryLifecycleStore implements LifecycleStore, MemoryRows {
  private state: MemoryState = {
    records: new Map(),
    transitions: [],
    effectRuns: new Map(),
    sequence: 0,
  };
  private queue: Promise<unknown> = Promise.resolve();
  /** Set on the view a transaction's work receives, and only there. */
  private readonly scope: Scope | undefined = undefined;
  /** The store every view was made from. */
  private readonly root: MemoryLifecycleStore = this;

  /**
   * Inside a transaction, the view its work received: pass it as `within`
   * to nest another transaction in this one, or as a lifecycle call's
   * `transaction`. Undefined outside a transaction.
   */
  public get transactionHandle(): unknown {
    return this.scope ? this : undefined;
  }

  /** Adds a record directly, the way a create form or a seed would. */
  public insertRecord(
    collection: string,
    values: Readonly<Record<string, unknown>>,
  ): LifecycleRecord {
    this.assertOpen();
    const id = (values.id as RecordId | undefined) ?? this.next();
    const record = Object.freeze({ ...values, id }) as LifecycleRecord;
    this.log(write(this.rows(collection), String(id), record));
    return record;
  }

  /** Changes fields outside any transition, the way an edit form would. */
  public patchRecord(
    collection: string,
    id: RecordId,
    values: Readonly<Record<string, unknown>>,
  ): LifecycleRecord {
    this.assertOpen();
    const rows = this.rows(collection);
    const current = rows.get(String(id));
    if (!current) throw new Error(`No ${collection} record "${String(id)}".`);
    const [record, undo] = update(rows, String(id), current, values);
    this.log(undo);
    return record;
  }

  /** The record as it is now, read synchronously. */
  public record(collection: string, id: RecordId): LifecycleRecord | undefined {
    this.assertOpen();
    return this.rows(collection).get(String(id));
  }

  /** Every row of a collection, in insertion order, through this open handle. */
  public records(collection: string): LifecycleRecord[] {
    this.assertOpen();
    return [...this.rows(collection).values()];
  }

  /**
   * Transactions run one after another, the way a database serializes
   * writers of one row. The work receives a view of this store that logs
   * what each of its writes replaced; a failure undoes those writes, newest
   * first, and leaves every other write alone. A field of a record that a
   * write made outside the transaction changed keeps that write's value,
   * and the fields only the transaction wrote get their previous values
   * back, which is what a database leaves once the rollback releases the
   * row's lock and the waiting outside write applies its own columns.
   *
   * Once a transaction has committed or rolled back, its view refuses to
   * read, write, register `afterCommit` callbacks or be nested `within`, as a
   * `@nocobase/db` transaction connection does.
   *
   * With `within` — the `transactionHandle` of a transaction still running
   * — the work runs inside that one instead, as a savepoint would: a failure
   * undoes only the nested writes and drops its `afterCommit` callbacks, and
   * success hands both to the enclosing transaction. Only the outermost
   * transaction runs the callbacks, once it has committed and released the
   * next transaction to start, so a callback may open one of its own;
   * `transaction()` resolves once they have finished. Opening a transaction
   * without `within` from inside another waits for it forever.
   */
  public async transaction<R>(
    work: (store: LifecycleStore) => Promise<R>,
    options: TransactionOptions = {},
  ): Promise<R> {
    const { root } = this;
    if (options.within !== undefined) {
      const parent = root.scopeOf(options.within);
      const scope = openScope();
      try {
        const result = await work(root.view(scope));
        // The enclosing transaction may have ended while this one ran.
        if (parent.finished) throw new Error(FINISHED);
        parent.journal.push(...scope.journal);
        parent.commits.push(...scope.commits);
        return result;
      } catch (error) {
        for (const undo of scope.journal.reverse()) undo();
        throw error;
      } finally {
        scope.finished = true;
      }
    }
    const scope = openScope();
    const run = root.queue.then(async () => {
      try {
        return await work(root.view(scope));
      } catch (error) {
        for (const undo of scope.journal.reverse()) undo();
        throw error;
      } finally {
        scope.finished = true;
      }
    });
    root.queue = run.catch(() => undefined);
    const result = await run;
    for (const callback of scope.commits)
      try {
        await callback();
      } catch (error) {
        // The transaction has committed, so the caller is not told it
        // failed; the error surfaces where a test sees it.
        queueMicrotask(() => {
          throw error;
        });
      }
    return result;
  }

  /**
   * Inside a transaction, runs `callback` once the outermost transaction has
   * committed; a rollback drops it.
   */
  public afterCommit(callback: () => void | Promise<void>): void {
    if (!this.scope)
      throw new Error(
        'afterCommit is only available inside a transaction, on the store its work receives.',
      );
    this.assertOpen();
    this.scope.commits.push(callback);
  }

  public findRecord(
    collection: string,
    id: RecordId,
  ): Promise<LifecycleRecord | undefined> {
    if (this.scope?.finished) return Promise.reject(new Error(FINISHED));
    return Promise.resolve(this.rows(collection).get(String(id)));
  }

  public createRecord(
    collection: string,
    values: Readonly<Record<string, unknown>>,
  ): Promise<LifecycleRecord> {
    if (this.scope?.finished) return Promise.reject(new Error(FINISHED));
    return Promise.resolve(this.insertRecord(collection, values));
  }

  public updateRecordIf(
    collection: string,
    id: RecordId,
    condition: RecordCondition,
    values: Readonly<Record<string, unknown>>,
  ): Promise<boolean> {
    if (this.scope?.finished) return Promise.reject(new Error(FINISHED));
    const rows = this.rows(collection);
    const current = rows.get(String(id));
    const version = current?.[condition.versionField] ?? null;
    if (
      !current ||
      current[condition.stateField] !== condition.state ||
      (version === null ? null : Number(version)) !== condition.version
    )
      return Promise.resolve(false);
    this.log(update(rows, String(id), current, values)[1]);
    return Promise.resolve(true);
  }

  public findIdleRecords(
    collection: string,
    query: IdleRecordQuery,
  ): Promise<LifecycleRecord[]> {
    if (this.scope?.finished) return Promise.reject(new Error(FINISHED));
    const { after } = query;
    return Promise.resolve(
      [...this.rows(collection).values()]
        .filter(
          (record) =>
            query.states.includes(String(record[query.stateField])) &&
            typeof record[query.changedAtField] === 'string' &&
            (record[query.changedAtField] as string) < query.changedBefore &&
            (after === undefined ||
              (record[query.changedAtField] as string) > after.changedAt ||
              ((record[query.changedAtField] as string) === after.changedAt &&
                compareIds(record.id, after.id) > 0)),
        )
        .sort(compareIdle(query.changedAtField))
        .slice(0, query.limit),
    );
  }

  public appendTransition(entry: NewTransitionEntry): Promise<TransitionEntry> {
    if (this.scope?.finished) return Promise.reject(new Error(FINISHED));
    // The unique indexes a database store declares on (lifecycle, recordId,
    // version) and (lifecycle, recordId, requestKey).
    const requestKey = transitionRequestKey(entry);
    if (
      this.state.transitions.some(
        (other) =>
          other.lifecycle === entry.lifecycle &&
          other.recordId === entry.recordId &&
          (other.version === entry.version ||
            transitionRequestKey(other) === requestKey),
      )
    )
      return Promise.reject(
        new Error(
          `Duplicate transition entry for ${entry.lifecycle}/${entry.recordId} version ${entry.version}.`,
        ),
      );
    const saved = Object.freeze({ ...entry, id: String(this.next()) });
    const { transitions } = this.state;
    transitions.push(saved);
    this.log(() => {
      const index = transitions.indexOf(saved);
      if (index >= 0) transitions.splice(index, 1);
    });
    return Promise.resolve(saved);
  }

  public findTransition(id: string): Promise<TransitionEntry | undefined> {
    if (this.scope?.finished) return Promise.reject(new Error(FINISHED));
    return Promise.resolve(
      this.state.transitions.find((entry) => entry.id === id),
    );
  }

  public findTransitionByRequest(
    lifecycle: string,
    recordId: string,
    requestId: string,
  ): Promise<TransitionEntry | undefined> {
    if (this.scope?.finished) return Promise.reject(new Error(FINISHED));
    return Promise.resolve(
      this.state.transitions.find(
        (entry) =>
          entry.lifecycle === lifecycle &&
          entry.recordId === recordId &&
          entry.requestId === requestId,
      ),
    );
  }

  public listTransitions(
    lifecycle: string,
    recordId: string,
    options: TransitionListOptions = {},
  ): Promise<TransitionEntry[]> {
    if (this.scope?.finished) return Promise.reject(new Error(FINISHED));
    const { after } = options;
    return Promise.resolve(
      this.state.transitions.filter(
        (entry) =>
          entry.lifecycle === lifecycle &&
          entry.recordId === recordId &&
          // Ids come from one sequence, so their order is the log's.
          (after === undefined || Number(entry.id) > Number(after)),
      ),
    );
  }

  public createEffectRun(run: NewEffectRun): Promise<EffectRun> {
    if (this.scope?.finished) return Promise.reject(new Error(FINISHED));
    const saved: EffectRun = Object.freeze({
      ...run,
      continuation: run.continuation ?? null,
      id: String(this.next()),
    });
    this.log(write(this.state.effectRuns, saved.id, saved));
    return Promise.resolve(saved);
  }

  public findEffectRun(id: string): Promise<EffectRun | undefined> {
    if (this.scope?.finished) return Promise.reject(new Error(FINISHED));
    return Promise.resolve(this.state.effectRuns.get(id));
  }

  public updateEffectRun(
    id: string,
    condition: EffectRunCondition,
    changes: EffectRunChanges,
  ): Promise<boolean> {
    if (this.scope?.finished) return Promise.reject(new Error(FINISHED));
    const current = this.state.effectRuns.get(id);
    if (
      !current ||
      current.status !== condition.status ||
      (condition.attempts !== undefined &&
        current.attempts !== condition.attempts) ||
      (condition.continuationDueAt !== undefined &&
        waitingDueAt(current.continuation) !== condition.continuationDueAt)
    )
      return Promise.resolve(false);
    this.log(
      write(
        this.state.effectRuns,
        id,
        Object.freeze({ ...current, ...changes }),
      ),
    );
    return Promise.resolve(true);
  }

  public listEffectRuns(query: EffectRunQuery): Promise<EffectRun[]> {
    if (this.scope?.finished) return Promise.reject(new Error(FINISHED));
    const runs = [...this.state.effectRuns.values()].filter(
      (run) =>
        (query.lifecycle === undefined || run.lifecycle === query.lifecycle) &&
        (query.recordId === undefined || run.recordId === query.recordId) &&
        (query.effect === undefined || run.effect === query.effect) &&
        (query.status === undefined || run.status === query.status) &&
        (query.claimedBefore === undefined ||
          (run.claimedAt !== null && run.claimedAt < query.claimedBefore)) &&
        (query.updatedBefore === undefined ||
          run.updatedAt < query.updatedBefore) &&
        (query.continuationPending === undefined ||
          (waitingDueAt(run.continuation) !== null) ===
            query.continuationPending) &&
        (query.continuationAbandoned === undefined ||
          (abandonedAt(run.continuation) !== null) ===
            query.continuationAbandoned) &&
        (query.continuationDueBy === undefined ||
          isDueBy(waitingDueAt(run.continuation), query.continuationDueBy)),
    );
    if (query.continuationDueBy !== undefined)
      runs.sort((a, b) => {
        const left = waitingDueAt(a.continuation) ?? '';
        const right = waitingDueAt(b.continuation) ?? '';
        return left === right
          ? Number(a.id) - Number(b.id)
          : left < right
            ? -1
            : 1;
      });
    return Promise.resolve(
      query.limit === undefined ? runs : runs.slice(0, query.limit),
    );
  }

  public deleteEffectRuns(query: EffectRunPruneQuery): Promise<number> {
    if (this.scope?.finished) return Promise.reject(new Error(FINISHED));
    let deleted = 0;
    for (const [id, run] of this.state.effectRuns)
      if (
        query.statuses.includes(run.status) &&
        run.updatedAt < query.updatedBefore &&
        run.continuation === null
      ) {
        this.log(write(this.state.effectRuns, id, undefined));
        deleted += 1;
      }
    return Promise.resolve(deleted);
  }

  private rows(collection: string): Map<string, LifecycleRecord> {
    let rows = this.state.records.get(collection);
    if (!rows) {
      rows = new Map();
      this.state.records.set(collection, rows);
    }
    return rows;
  }

  /** A transaction's view is unusable once the transaction has ended. */
  private assertOpen(): void {
    if (this.scope?.finished) throw new Error(FINISHED);
  }

  /** Keeps how to undo a write, when it was made inside a transaction. */
  private log(undo: Undo): void {
    this.scope?.journal.push(undo);
  }

  private view(scope: Scope): MemoryLifecycleStore {
    return Object.create(this, {
      scope: { value: scope },
    }) as MemoryLifecycleStore;
  }

  /** The scope of a running transaction of this store, which `within` names. */
  private scopeOf(handle: unknown): Scope {
    if (
      handle instanceof MemoryLifecycleStore &&
      handle.root === this &&
      handle.scope
    ) {
      if (handle.scope.finished) throw new Error(FINISHED);
      return handle.scope;
    }
    throw new Error(
      'A memory store nests a transaction only within the transactionHandle of one of its own running transactions.',
    );
  }

  /** Ids are never handed out twice, rollback or not, as a database sequence. */
  private next(): number {
    this.state.sequence += 1;
    return this.state.sequence;
  }
}
