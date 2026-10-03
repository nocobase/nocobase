import type { Knex } from 'knex';
import { afterEach, describe, expect, it, vi } from 'vitest';
import sqlite from '../src/index.js';
import {
  createDatabaseManager,
  InMemoryCollectionMetadataStore,
  type DatabaseManager,
  type TransactionCallbackPhase,
} from '@nocobase/db';

const databases: DatabaseManager[] = [];

function createDatabase(
  onTransactionCallbackError?: (
    error: unknown,
    phase: TransactionCallbackPhase,
  ) => void,
): DatabaseManager {
  const database = createDatabaseManager({
    drivers: { sqlite },
    metadataStore: new InMemoryCollectionMetadataStore(),
    connections: {
      main: {
        dialect: 'sqlite',
        filename: ':memory:',
        ...(onTransactionCallbackError ? { onTransactionCallbackError } : {}),
      },
    },
  });
  databases.push(database);
  return database;
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(databases.splice(0).map((database) => database.destroy()));
});

describe('transaction callbacks on SQLite', () => {
  it('drops commit callbacks and runs rollback callbacks when the commit itself fails', async () => {
    const database = createDatabase();
    const client = await database.connection().client<Knex>();
    await client.raw('pragma foreign_keys = on');
    await client.raw('create table parents (id integer primary key)');
    await client.raw(
      'create table children (id integer primary key, parent_id integer references parents (id) deferrable initially deferred)',
    );
    const committed = vi.fn();
    const rolledBack = vi.fn();

    const outcome = await database
      .transaction(async (connection) => {
        const transaction = await connection.client<Knex>();
        // The deferred foreign key is only checked at COMMIT, so the body
        // succeeds and the commit is what fails.
        await transaction.raw(
          'insert into children (id, parent_id) values (1, 404)',
        );
        connection.afterCommit(committed);
        connection.afterRollback(rolledBack);
      })
      .then(
        () => undefined,
        (error: unknown) => error,
      );

    expect(outcome).toBeInstanceOf(Error);
    expect(committed).not.toHaveBeenCalled();
    expect(rolledBack).toHaveBeenCalledExactlyOnceWith(outcome);
    await expect(client('children').count({ total: '*' })).resolves.toEqual([
      { total: 0 },
    ]);
  });

  it('hands a callback failure to onTransactionCallbackError with its phase', async () => {
    const reported: Array<[unknown, TransactionCallbackPhase]> = [];
    const database = createDatabase((error, phase) =>
      reported.push([error, phase]),
    );
    const failure = new Error('realtime is down');
    const cause = new Error('rollback');

    await database.transaction(async (connection) => {
      connection.afterCommit(() => {
        throw failure;
      });
    });
    await expect(
      database.transaction(async (connection) => {
        connection.afterRollback(() => {
          throw failure;
        });
        throw cause;
      }),
    ).rejects.toBe(cause);

    expect(reported).toEqual([
      [failure, 'afterCommit'],
      [failure, 'afterRollback'],
    ]);
  });

  it('keeps the outcome when onTransactionCallbackError itself throws', async () => {
    const warning = vi
      .spyOn(process, 'emitWarning')
      .mockImplementation(() => undefined);
    const handlerFailure = new Error('logger is down');
    const database = createDatabase(() => {
      throw handlerFailure;
    });
    const failure = new Error('realtime is down');
    const after = vi.fn();
    const cause = new Error('rollback');

    await expect(
      database.transaction(async (connection) => {
        connection.afterCommit(() => {
          throw failure;
        });
        connection.afterCommit(after);
        return 'done';
      }),
    ).resolves.toBe('done');
    await expect(
      database.transaction(async (connection) => {
        connection.afterRollback(() => {
          throw failure;
        });
        throw cause;
      }),
    ).rejects.toBe(cause);

    expect(after).toHaveBeenCalledOnce();
    expect(warning).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'TRANSACTION_CALLBACK_FAILED',
        detail: 'phase: handler',
        cause: handlerFailure,
      }),
    );
    expect(warning).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'TRANSACTION_CALLBACK_FAILED',
        detail: 'phase: afterCommit',
        cause: failure,
      }),
    );
  });

  it('emits a warning whose code a process listener can read', async () => {
    const database = createDatabase();
    const failure = new Error('realtime is down');
    const warnings: Error[] = [];
    const onWarning = (warning: Error): void => {
      warnings.push(warning);
    };
    process.on('warning', onWarning);
    try {
      await database.transaction(async (connection) => {
        connection.afterCommit(() => {
          throw failure;
        });
      });
      // Node hands the warning to listeners on the next tick.
      await new Promise((resolve) => setImmediate(resolve));
    } finally {
      process.off('warning', onWarning);
    }

    // Observed through the event rather than a spy on emitWarning: Node drops
    // the code and detail options when it is handed an Error, so only the
    // emitted warning shows what a listener gets.
    expect(warnings).toContainEqual(
      expect.objectContaining({
        name: 'Warning',
        message: 'realtime is down',
        code: 'TRANSACTION_CALLBACK_FAILED',
        detail: 'phase: afterCommit',
        cause: failure,
      }),
    );
  });
});
