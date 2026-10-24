import { expect, it } from 'vitest';
import { describeIntegrationDatabases } from '../helpers.js';
import { createQueryOrdersCollection, seedQueryOrders } from './helpers.js';

describeIntegrationDatabases('query select', (context) => {
  it('maps aliases, nulls and timestamps across rows and first-row reads', async () => {
    await createQueryOrdersCollection(context);
    await seedQueryOrders(context, 'queryOrders');
    const query = context.database
      .query()
      .selectFrom('queryOrders')
      .select([
        'status as status_alias',
        'orderNo as orderNumber',
        'paidAt as payment_time',
      ])
      .orderBy('sort');
    const rows = await query.execute();
    expect(rows).toEqual([
      { status_alias: 'draft', orderNumber: 'SO-001', payment_time: null },
      {
        status_alias: 'paid',
        orderNumber: 'SO-002',
        payment_time: '2026-08-14T10:00:00.000',
      },
      {
        status_alias: 'paid',
        orderNumber: 'SO-003',
        payment_time: '2026-08-14T11:00:00.000',
      },
    ]);
    expect(await query.executeTakeFirst()).toEqual(rows[0]);
  });

  it('selects rows and uses Kysely-style terminal methods', async () => {
    const ordersTable = 'queryOrders';

    await createQueryOrdersCollection(context);
    await seedQueryOrders(context, ordersTable);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .select(['orderNo', 'status', 'amount'])
        .where('status', '=', 'paid')
        .orderBy('sort')
        .execute(),
    ).resolves.toEqual([
      { orderNo: 'SO-002', status: 'paid', amount: 120 },
      { orderNo: 'SO-003', status: 'paid', amount: 240 },
    ]);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .where('status', '=', 'missing')
        .executeTakeFirst(),
    ).resolves.toBeUndefined();

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .where('status', '=', 'missing')
        .executeTakeFirstOrThrow(),
    ).rejects.toThrow('No row found.');
  });

  it('supports value, pluck, exists, distinct, selectAll, and immutable clear methods', async () => {
    const ordersTable = 'queryOrders';

    await createQueryOrdersCollection(context);
    await seedQueryOrders(context, ordersTable);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .where('orderNo', '=', 'SO-002')
        .value<string>('status'),
    ).resolves.toBe('paid');

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .where('status', '=', 'paid')
        .orderBy('sort')
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['SO-002', 'SO-003']);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .where('status', '=', 'paid')
        .exists(),
    ).resolves.toBe(true);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .select('status')
        .distinct()
        .orderBy('status')
        .pluck<string>('status'),
    ).resolves.toEqual(['draft', 'paid']);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .selectAll()
        .where('orderNo', '=', 'SO-002')
        .executeTakeFirst(),
    ).resolves.toMatchObject({
      orderNo: 'SO-002',
      status: 'paid',
      amount: 120,
    });

    const base = context.database
      .query()
      .selectFrom(ordersTable)
      .select('status')
      .where('status', '=', 'paid')
      .orderBy('sort')
      .limit(1);

    await expect(base.pluck<string>('status')).resolves.toEqual(['paid']);
    await expect(
      base
        .clearSelect()
        .select('orderNo')
        .clearWhere()
        .clearLimit()
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['SO-001', 'SO-002', 'SO-003']);
    await expect(base.pluck<string>('status')).resolves.toEqual(['paid']);
  });

  it('requires orderBy when offset is used for portable pagination', async () => {
    const ordersTable = 'queryOrders';

    await createQueryOrdersCollection(context);
    await seedQueryOrders(context, ordersTable);

    expect(() =>
      context.database
        .query()
        .selectFrom(ordersTable)
        .select('orderNo')
        .offset(1)
        .compile(),
    ).toThrow('offset() requires orderBy() for portable pagination.');

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .select('orderNo')
        .orderBy('orderNo')
        .offset(1)
        .limit(2)
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['SO-002', 'SO-003']);
  });
});
