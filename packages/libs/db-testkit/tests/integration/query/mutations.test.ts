import { expect, it } from 'vitest';
import { describeIntegrationDatabases } from '../helpers.js';
import { createQueryOrdersCollection, seedQueryOrders } from './helpers.js';

describeIntegrationDatabases('query mutations', (context) => {
  it('inserts, updates, and deletes rows against a real connection', async () => {
    const ordersTable = 'queryOrders';

    await createQueryOrdersCollection(context);

    const insertResult = await context.database
      .query()
      .insertInto(ordersTable)
      .values([
        {
          orderNo: 'SO-001',
          status: 'draft',
          amount: 50,
          sort: 1,
          paidAt: null,
        },
        {
          orderNo: 'SO-002',
          status: 'paid',
          amount: 120,
          sort: 2,
          paidAt: '2026-08-14T10:00:00',
        },
        {
          orderNo: 'SO-003',
          status: 'paid',
          amount: 240,
          sort: 3,
          paidAt: '2026-08-14T11:00:00',
        },
      ])
      .execute();

    expect(insertResult.insertedCount).toBe(3);

    await expect(
      context.database
        .query()
        .updateTable(ordersTable)
        .set({ status: 'archived' })
        .where('status', '=', 'paid')
        .execute(),
    ).resolves.toEqual({ updatedCount: 2 });

    await expect(
      context.database
        .query()
        .deleteFrom(ordersTable)
        .where('status', '=', 'draft')
        .execute(),
    ).resolves.toEqual({ deletedCount: 1 });

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .select(['orderNo', 'status'])
        .orderBy('orderNo')
        .execute(),
    ).resolves.toEqual([
      { orderNo: 'SO-002', status: 'archived' },
      { orderNo: 'SO-003', status: 'archived' },
    ]);
  });

  it('requires values, set data, or allowAllRows where appropriate', async () => {
    const ordersTable = 'queryOrders';

    await context.builder.createCollection('queryOrders', (collection) => {
      collection.increments('id');
      collection.string('status');
    });
    await context.database
      .query()
      .insertInto(ordersTable)
      .values([{ status: 'draft' }, { status: 'paid' }])
      .execute();

    await expect(
      context.database.query().insertInto(ordersTable).execute(),
    ).rejects.toThrow('insertInto().values() is required before execute().');

    await expect(
      context.database
        .query()
        .updateTable(ordersTable)
        .where('status', '=', 'paid')
        .execute(),
    ).rejects.toThrow('updateTable().set() is required before execute().');

    await expect(
      context.database
        .query()
        .updateTable(ordersTable)
        .set({ status: 'archived' })
        .execute(),
    ).rejects.toThrow(
      'updateTable().execute() requires where() or allowAllRows().',
    );

    await expect(
      context.database
        .query()
        .updateTable(ordersTable)
        .set({ status: 'archived' })
        .allowAllRows()
        .execute(),
    ).resolves.toEqual({ updatedCount: 2 });

    await expect(
      context.database.query().deleteFrom(ordersTable).execute(),
    ).rejects.toThrow(
      'deleteFrom().execute() requires where() or allowAllRows().',
    );

    await expect(
      context.database.query().deleteFrom(ordersTable).allowAllRows().execute(),
    ).resolves.toEqual({ deletedCount: 2 });
  });

  it('updates and deletes with expression callbacks and immutable clearWhere', async () => {
    const ordersTable = 'queryOrders';

    await createQueryOrdersCollection(context);
    await seedQueryOrders(context, ordersTable);

    const updatePaid = context.database
      .query()
      .updateTable(ordersTable)
      .set({ status: 'settled' })
      .where('status', '=', 'draft')
      .clearWhere()
      .where(({ eb }) =>
        eb.and([
          eb('status', '=', 'paid'),
          eb('amount', '>=', 100),
          eb('paidAt', 'is not', null),
        ]),
      );

    await expect(updatePaid.execute()).resolves.toEqual({ updatedCount: 2 });

    const deleteDrafts = context.database
      .query()
      .deleteFrom(ordersTable)
      .where('status', '=', 'settled')
      .clearWhere()
      .where(({ not }) => not((eb) => eb('status', '=', 'settled')));

    await expect(deleteDrafts.execute()).resolves.toEqual({ deletedCount: 1 });

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .select(['orderNo', 'status'])
        .orderBy('orderNo')
        .execute(),
    ).resolves.toEqual([
      { orderNo: 'SO-002', status: 'settled' },
      { orderNo: 'SO-003', status: 'settled' },
    ]);
  });

  it('maps qualified references in update and delete predicates', async () => {
    const ordersTable = 'namingMutations';

    await context.builder.createCollection(ordersTable, (collection) => {
      collection.increments('id');
      collection.string('orderNo');
      collection.integer('expectedAmount');
      collection.integer('actualAmount');
      collection.string('status');
    });
    await context.database
      .query()
      .insertInto(ordersTable)
      .values([
        {
          orderNo: 'SO-001',
          expectedAmount: 100,
          actualAmount: 100,
          status: 'pending',
        },
        {
          orderNo: 'SO-002',
          expectedAmount: 100,
          actualAmount: 80,
          status: 'pending',
        },
      ])
      .execute();

    await expect(
      context.database
        .query()
        .updateTable(ordersTable)
        .set({ status: 'matched' })
        .whereRef(
          `${ordersTable}.expectedAmount`,
          '=',
          `${ordersTable}.actualAmount`,
        )
        .execute(),
    ).resolves.toEqual({ updatedCount: 1 });

    await expect(
      context.database
        .query()
        .deleteFrom(ordersTable)
        .whereRef(
          `${ordersTable}.expectedAmount`,
          '!=',
          `${ordersTable}.actualAmount`,
        )
        .execute(),
    ).resolves.toEqual({ deletedCount: 1 });

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .select(['orderNo', 'status'])
        .execute(),
    ).resolves.toEqual([{ orderNo: 'SO-001', status: 'matched' }]);
  });
  it('binds compared instants and booleans in update and delete predicates the way writes bind them', async () => {
    const table = 'temporalMutations';
    await context.builder.createCollection(table, (collection) => {
      collection.increments('id');
      collection.string('key');
      collection.datetimeTz('dueAt').nullable();
      collection.boolean('active');
    });
    await context.database
      .query()
      .insertInto(table)
      .values([
        { key: 'early', dueAt: '2026-08-14T10:00:00.000Z', active: true },
        { key: 'late', dueAt: '2026-08-14T12:00:00.000Z', active: false },
      ])
      .execute();

    // The instants are compared as callers hold them, ISO strings with a zone. Bound verbatim, MySQL rejects one
    // compared with a DATETIME column although the same string is accepted as a written value.
    await expect(
      context.database
        .query()
        .updateTable(table)
        .set({ key: 'early-due' })
        .where('dueAt', '<=', '2026-08-14T11:00:00.000Z')
        .execute(),
    ).resolves.toEqual({ updatedCount: 1 });
    await expect(
      context.database
        .query()
        .updateTable(table)
        .set({ key: 'late-inactive' })
        .where(({ eb }) =>
          eb.and([
            eb('active', '=', false),
            eb('dueAt', '>', '2026-08-14T11:00:00.000Z'),
          ]),
        )
        .execute(),
    ).resolves.toEqual({ updatedCount: 1 });
    await expect(
      context.database
        .query()
        .deleteFrom(table)
        .where('dueAt', '<', '2026-08-14T11:00:00.000Z')
        .where('active', '=', true)
        .execute(),
    ).resolves.toEqual({ deletedCount: 1 });

    await expect(
      context.database.query().selectFrom(table).select(['key']).execute(),
    ).resolves.toEqual([{ key: 'late-inactive' }]);

    // What a database makes of a value the Field could not store is its own business; the contract is only that
    // the value reaches it as given instead of being refused the way a write refuses it. A date without a time
    // is read as that day's midnight everywhere but on Oracle, whose session timestamp format requires the time.
    const readsDateAsMidnight = context.spec.dialect !== 'oracle';
    // A pattern is never a stored value, so `like` binds it verbatim; the PostgreSQL family has no `like` for a
    // timestamp, and Oracle spells one by its session format.
    const comparesTimestampAsText = ![
      'postgres',
      'kingbase',
      'oracle',
    ].includes(context.spec.dialect);
    const remaining = readsDateAsMidnight
      ? 'late-inactive-today'
      : 'late-inactive';
    if (readsDateAsMidnight) {
      await expect(
        context.database
          .query()
          .selectFrom(table)
          .select(['key'])
          .where('dueAt', '>=', '2026-08-13')
          .where('dueAt', '<', '2026-08-16')
          .execute(),
      ).resolves.toEqual([{ key: 'late-inactive' }]);
      await expect(
        context.database
          .query()
          .updateTable(table)
          .set({ key: remaining })
          .where('dueAt', '>=', '2026-08-13')
          .execute(),
      ).resolves.toEqual({ updatedCount: 1 });
    }
    if (comparesTimestampAsText) {
      await expect(
        context.database
          .query()
          .selectFrom(table)
          .select(['key'])
          .where('dueAt', 'like', '2026-08-1%')
          .execute(),
      ).resolves.toEqual([{ key: remaining }]);
      await expect(
        context.database
          .query()
          .deleteFrom(table)
          .where('dueAt', 'like', '2026-08-1%')
          .execute(),
      ).resolves.toEqual({ deletedCount: 1 });
    }
  });
});
