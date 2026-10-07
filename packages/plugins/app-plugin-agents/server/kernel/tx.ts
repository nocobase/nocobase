/**
 * Units of work. A transaction collects the events its writes announce and publishes them only after it commits, so a
 * listener never sees a change that was rolled back.
 */
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';

import type { AgentsEvent, AgentsEventBus } from './events.js';

export interface Tx {
  readonly conn: DatabaseConnection;
  readonly emit: (event: AgentsEvent) => void;
}

export interface TxRunner {
  /** Runs `fn` in a transaction; with `outer`, joins that unit of work and publishes when it commits. */
  run<T>(fn: (tx: Tx) => Promise<T>, outer?: Tx): Promise<T>;
  /** The connection for reads outside a transaction. */
  read(): DatabaseConnection;
}

export function createTxRunner(
  database: Pick<DatabaseManager, 'transaction' | 'connection'>,
  bus: Pick<AgentsEventBus, 'emit'>,
): TxRunner {
  return {
    async run(fn, outer) {
      if (outer) return fn(outer);
      const pending: AgentsEvent[] = [];
      const result = await database.transaction((conn) =>
        fn({ conn, emit: (event) => pending.push(event) }),
      );
      for (const event of pending) bus.emit(event);
      return result;
    },
    read: () => database.connection(),
  };
}
