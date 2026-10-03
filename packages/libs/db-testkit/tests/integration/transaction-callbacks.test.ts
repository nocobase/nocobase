import { afterEach, expect, it, vi } from 'vitest';
import { describeIntegrationDatabases } from './helpers.js';

describeIntegrationDatabases('transaction callbacks', (context) => {
  class ExpectedRollback extends Error {}

  async function createOrders(): Promise<void> {
    await context.builder.createCollection('callbackOrders', (collection) => {
      collection.string('id').primary().notNull();
      collection.string('status').notNull();
    });
  }

  function countOrders(): Promise<number> {
    return context.database
      .connection(context.spec.name)
      .repository('callbackOrders')
      .count();
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs commit callbacks after the commit, in order, before transaction() resolves', async () => {
    await createOrders();
    const seen: Array<{ step: string; orders: number }> = [];

    await context.database.transaction(async (connection) => {
      connection.afterCommit(async () => {
        seen.push({ step: 'first', orders: await countOrders() });
      });
      await connection
        .repository('callbackOrders')
        .createOne({ values: { id: 'order-1', status: 'paid' } });
      connection.afterCommit(() => {
        seen.push({ step: 'second', orders: -1 });
      });
      expect(seen).toEqual([]);
    }, context.spec.name);

    expect(seen).toEqual([
      { step: 'first', orders: 1 },
      { step: 'second', orders: -1 },
    ]);
  });

  it('drops commit callbacks and runs rollback callbacks when the transaction fails', async () => {
    await createOrders();
    const committed = vi.fn();
    const rolledBack = vi.fn();
    const cause = new ExpectedRollback('quota exceeded');

    await expect(
      context.database.transaction(async (connection) => {
        connection.afterCommit(committed);
        connection.afterRollback(rolledBack);
        await connection
          .repository('callbackOrders')
          .createOne({ values: { id: 'order-1', status: 'paid' } });
        throw cause;
      }, context.spec.name),
    ).rejects.toBe(cause);

    expect(committed).not.toHaveBeenCalled();
    expect(rolledBack).toHaveBeenCalledExactlyOnceWith(cause);
    await expect(countOrders()).resolves.toBe(0);
  });

  it('scopes callbacks to a savepoint and hands released ones to the outer commit', async () => {
    await createOrders();
    const order: string[] = [];

    await context.database.transaction(async (connection) => {
      connection.afterCommit(() => {
        order.push('outer');
      });

      await connection.transaction(async (inner) => {
        inner.afterCommit(() => {
          order.push('inner-ok');
        });
      });
      expect(order).toEqual([]);

      await expect(
        connection.transaction(async (inner) => {
          inner.afterCommit(() => {
            order.push('inner-failed');
          });
          inner.afterRollback(() => {
            order.push('inner-rolled-back');
          });
          throw new ExpectedRollback('skip this step');
        }),
      ).rejects.toBeInstanceOf(ExpectedRollback);
      expect(order).toEqual(['inner-rolled-back']);
    }, context.spec.name);

    expect(order).toEqual(['inner-rolled-back', 'outer', 'inner-ok']);
  });

  it('runs rollback callbacks of a released savepoint when the outer transaction fails', async () => {
    await createOrders();
    const order: string[] = [];

    await expect(
      context.database.transaction(async (connection) => {
        await connection.transaction(async (inner) => {
          inner.afterCommit(() => {
            order.push('inner-commit');
          });
          inner.afterRollback(() => {
            order.push('inner-rollback');
          });
        });
        throw new ExpectedRollback('outer failed');
      }, context.spec.name),
    ).rejects.toBeInstanceOf(ExpectedRollback);

    expect(order).toEqual(['inner-rollback']);
  });

  it('reports a failing callback without changing the outcome', async () => {
    await createOrders();
    const warning = vi
      .spyOn(process, 'emitWarning')
      .mockImplementation(() => undefined);
    const failure = new Error('realtime is down');
    const after = vi.fn();

    await expect(
      context.database.transaction(async (connection) => {
        await connection
          .repository('callbackOrders')
          .createOne({ values: { id: 'order-1', status: 'paid' } });
        connection.afterCommit(() => {
          throw failure;
        });
        connection.afterCommit(after);
        return 'done';
      }, context.spec.name),
    ).resolves.toBe('done');

    expect(after).toHaveBeenCalledOnce();
    expect(warning).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'TRANSACTION_CALLBACK_FAILED',
        detail: 'phase: afterCommit',
        cause: failure,
      }),
    );
    await expect(countOrders()).resolves.toBe(1);
  });

  it('starts a commit callback at once outside a transaction and ignores rollback callbacks', async () => {
    const connection = context.database.connection(context.spec.name);
    const committed = vi.fn();
    const rolledBack = vi.fn();

    connection.afterCommit(committed);
    connection.afterRollback(rolledBack);

    expect(committed).toHaveBeenCalledOnce();
    expect(rolledBack).not.toHaveBeenCalled();
  });

  it('applies Collection metadata changes before commit callbacks run', async () => {
    await createOrders();
    const connection = context.database.connection(context.spec.name);
    await connection.collections.get('callbackOrders');
    let fieldsSeen: string[] = [];

    await connection.transaction(async (transaction) => {
      await transaction.builder.addField('callbackOrders', {
        name: 'note',
        type: 'string',
        title: 'Note',
      });
      transaction.afterCommit(async () => {
        const collection = await connection.collections.get('callbackOrders');
        fieldsSeen = collection?.fields?.map((field) => field.name) ?? [];
      });
    });

    expect(fieldsSeen).toContain('note');
  });

  it("applies a savepoint's metadata changes before the outer commit callbacks run", async () => {
    await createOrders();
    const connection = context.database.connection(context.spec.name);
    await connection.collections.get('callbackOrders');
    let fieldsSeen: string[] = [];

    await connection.transaction(async (transaction) => {
      await transaction.transaction(async (savepoint) => {
        await savepoint.builder.addField('callbackOrders', {
          name: 'note',
          type: 'string',
          title: 'Note',
        });
      });
      transaction.afterCommit(async () => {
        const collection = await connection.collections.get('callbackOrders');
        fieldsSeen = collection?.fields?.map((field) => field.name) ?? [];
      });
    });

    expect(fieldsSeen).toContain('note');
  });

  it('forwards callbacks through a policy-bound connection', async () => {
    await createOrders();
    const committed = vi.fn();
    const scoped = context.database
      .connection(context.spec.name)
      .withPolicies({}, undefined);

    await scoped.transaction(async (connection) => {
      connection.afterCommit(committed);
      expect(committed).not.toHaveBeenCalled();
    });

    expect(committed).toHaveBeenCalledOnce();
  });
});
