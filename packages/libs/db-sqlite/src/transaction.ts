import { createRequire } from 'node:module';
import type { Knex } from 'knex';

const require = createRequire(import.meta.url);

interface NativeConnection {
  readonly inTransaction: boolean;
  exec(sql: string): unknown;
  // Knex sets this to the owning transaction's id while that transaction
  // holds the connection, and deletes it when the connection is released.
  __knexTxId?: string;
  // Knex's pool validation destroys a connection carrying this flag instead
  // of handing it out again.
  __knex__disposed?: unknown;
}
interface KnexTransaction {
  txid: string;
  client: { logger: { warn(message: string): void } };
  trxClient: {
    query(connection: NativeConnection, sql: string): Promise<unknown>;
  };
  _completed: boolean;
  _resolver(value: unknown): void;
  _rejecter(error: unknown): void;
}

const Transaction_Sqlite =
  require('knex/lib/dialects/sqlite3/execution/sqlite-transaction.js') as new (
    client: Knex.Client,
    ...rest: unknown[]
  ) => KnexTransaction;

// Knex turns a failed COMMIT into a rejection and releases the connection
// without rolling back. Servers such as PostgreSQL end the transaction
// themselves when COMMIT fails, but SQLite keeps it open so that the COMMIT
// can be retried — after a deferred foreign key violation, or SQLITE_BUSY
// while another connection reads the file. Knex never retries, so the pooled
// connection would go on running every later query inside that transaction.
class SqliteTransaction extends Transaction_Sqlite {
  commit(connection: NativeConnection, value: unknown): Promise<unknown> {
    const query = this.trxClient.query(connection, 'COMMIT;').then(
      (response) => {
        this._resolver(value);
        return response;
      },
      (error: unknown) => {
        try {
          this.rollbackFailedCommit(connection);
        } finally {
          this._rejecter(error);
        }
      },
    );
    this._completed = true;
    return query;
  }

  // Runs synchronously on the native connection, before the rejection lets
  // Knex release the connection to the next caller.
  private rollbackFailedCommit(connection: NativeConnection): void {
    // The COMMIT is also rejected, without running, when the transaction was
    // already completed: the container called `trx.commit()` itself and Knex
    // then commits again. By then the connection has been released, and a
    // transaction it is now open for belongs to the next caller.
    if (connection.__knexTxId !== this.txid) return;
    if (!connection.inTransaction) return;
    try {
      connection.exec('ROLLBACK');
    } catch (error) {
      // Knex 3.1 has no `_logAndDispose`, so the connection is marked here.
      connection.__knex__disposed = error;
      this.client.logger.warn(
        `Failed to roll back after a failed COMMIT, discarding the connection: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

export function rollbackFailedCommits(client: typeof Knex.Client): void {
  // Knex's own declaration of `transaction` describes the public transactor,
  // not the internal Transaction class a client returns from it.
  const prototype = client.prototype as unknown as {
    transaction(this: Knex.Client, ...args: unknown[]): KnexTransaction;
  };
  prototype.transaction = function (...args) {
    return new SqliteTransaction(this, ...args);
  };
}
