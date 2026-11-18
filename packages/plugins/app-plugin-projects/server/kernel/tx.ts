/**
 * Units of work. A transaction collects the domain events its writes emit and publishes them only after it commits, so
 * a listener never sees a change that was rolled back.
 *
 * Hooks registered with `beforeCommit` see those events while the transaction is still open and may write in it: what
 * they write commits or rolls back with the change that caused it (the inbox, for example, turns events into items
 * this way). Events a hook emits are handed to the hooks again, for a bounded number of rounds.
 *
 * A unit (`unit`) makes every service call inside it join one transaction without passing it along. Inside a unit,
 * `run` without `outer` and `read` use the unit's transaction or the current savepoint.
 *
 * Thin stand-in: the database layer's `transaction()` has no commit hooks of its own. Use them once it does.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';

import type { DomainEvent, DomainEventBus } from './events.js';

export interface Tx {
  readonly conn: DatabaseConnection;
  emit(event: DomainEvent): void;
}

export type BeforeCommitHook = (
  tx: Tx,
  events: readonly DomainEvent[],
) => Promise<void>;

export interface TxRunner {
  /**
   * Runs `fn` in a transaction. With `outer`, `fn` joins that unit of work instead, and its events are published when
   * the outermost transaction commits.
   */
  run<T>(fn: (tx: Tx) => Promise<T>, outer?: Tx): Promise<T>;
  /** The connection for reads outside a transaction. */
  read(): DatabaseConnection;
  /** Registers a hook; returns what removes it. */
  beforeCommit(hook: BeforeCommitHook): () => void;
  /** Runs `fn` as one unit of work that every `run` inside it joins. Units do not nest. */
  unit<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
  /**
   * Runs `fn` in a savepoint of `tx`: when it throws, only its own writes roll back and its events are dropped. Inside
   * a unit, the services `fn` calls join the savepoint.
   */
  savepoint<T>(tx: Tx, fn: (tx: Tx) => Promise<T>): Promise<T>;
}

const MAX_HOOK_ROUNDS = 5;

export function createTxRunner(
  database: Pick<DatabaseManager, 'transaction' | 'connection'>,
  bus: Pick<DomainEventBus, 'emit'>,
): TxRunner {
  const hooks = new Set<BeforeCommitHook>();
  // The unit (or its savepoint) the current call runs in, if any.
  const ambient = new AsyncLocalStorage<Tx>();

  async function runHooks(tx: Tx, pending: readonly DomainEvent[]) {
    let handled = 0;
    for (
      let round = 0;
      hooks.size > 0 && handled < pending.length && round < MAX_HOOK_ROUNDS;
      round += 1
    ) {
      const batch = pending.slice(handled);
      handled = pending.length;
      for (const hook of hooks) await hook(tx, batch);
    }
  }

  return {
    async run(fn, outer) {
      if (outer) return fn(outer);
      const joined = ambient.getStore();
      if (joined) return fn(joined);
      const pending: DomainEvent[] = [];
      const result = await database.transaction(async (conn) => {
        const tx: Tx = { conn, emit: (event) => pending.push(event) };
        const value = await fn(tx);
        await runHooks(tx, pending);
        return value;
      });
      for (const event of pending) bus.emit(event);
      return result;
    },
    read: () => ambient.getStore()?.conn ?? database.connection(),
    beforeCommit(hook) {
      hooks.add(hook);
      return () => {
        hooks.delete(hook);
      };
    },
    async unit(fn) {
      if (ambient.getStore()) throw new Error('Units of work do not nest.');
      const pending: DomainEvent[] = [];
      const result = await database.transaction(async (conn) => {
        const tx: Tx = { conn, emit: (event) => pending.push(event) };
        const value = await ambient.run(tx, () => fn(tx));
        await runHooks(tx, pending);
        return value;
      });
      for (const event of pending) bus.emit(event);
      return result;
    },
    async savepoint(tx, fn) {
      const buffered: DomainEvent[] = [];
      const result = await tx.conn.transaction((conn) => {
        const inner: Tx = {
          conn,
          emit: (event) => buffered.push(event),
        };
        return ambient.run(inner, () => fn(inner));
      });
      for (const event of buffered) tx.emit(event);
      return result;
    },
  };
}
