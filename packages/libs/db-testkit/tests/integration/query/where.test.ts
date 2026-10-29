import { expect, it } from 'vitest';
import type { ExpressionBuilder } from '../../../../db/src/index.js';
import { describeIntegrationDatabases } from '../helpers.js';
import { createWhereOrdersCollection, seedWhereOrders } from './helpers.js';

describeIntegrationDatabases('query where', (context) => {
  it('matches mixed-case ASCII text with LOWER on both operands and bound patterns', async () => {
    await context.builder.createCollection('searchTitles', (collection) => {
      collection.increments('id');
      collection.string('displayTitle').nullable();
    });
    await context.database
      .query()
      .insertInto('searchTitles')
      .values([
        { displayTitle: 'Export reports' },
        { displayTitle: 'EXPORT REPORTS' },
        { displayTitle: 'export reports' },
        { displayTitle: 'Other' },
        { displayTitle: null },
      ])
      .execute();
    const base = context.database.query().selectFrom('searchTitles as item');
    for (const pattern of ['%export%', '%ExPoRt%']) {
      const query = base
        .where((eb) =>
          eb(
            eb.fn.lower('item.displayTitle'),
            'like',
            eb.fn.lower(eb.val(pattern)),
          ),
        )
        .orderBy('id');
      expect(query.compile().parameters).toContain(pattern);
      expect(query.compile().sql).not.toContain(pattern);
      await expect(query.pluck<string>('displayTitle')).resolves.toEqual([
        'Export reports',
        'EXPORT REPORTS',
        'export reports',
      ]);
    }
    await expect(
      base
        .where((eb) =>
          eb(
            eb.fn.lower('item.displayTitle'),
            'like',
            eb.fn.lower(eb.val("%' OR 1=1 --%")),
          ),
        )
        .execute(),
    ).resolves.toEqual([]);
    await expect(
      base
        .where((eb) =>
          eb(
            eb.fn.lower('item.displayTitle'),
            'not like',
            eb.fn.lower(eb.val('%EXPORT%')),
          ),
        )
        .pluck<string>('displayTitle'),
    ).resolves.toEqual(['Other']);
  });

  it('supports comparison, list, null, and pattern operators against a real connection', async () => {
    const ordersTable = 'whereOrders';

    await createWhereOrdersCollection(context);
    await seedWhereOrders(context, ordersTable);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .select('orderNo')
        .where('amount', '>', 200)
        .where('amount', '<=', 480)
        .orderBy('amount')
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['SO-002', 'SO-003', 'SO-004']);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .select('orderNo')
        .where('status', '!=', 'draft')
        .where('amount', '<', 500)
        .orderBy('orderNo')
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['PX-001', 'SO-001', 'SO-002', 'SO-004']);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .select('orderNo')
        .where('status', '<>', 'paid')
        .orderBy('orderNo')
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['SO-002', 'SO-003', 'SO-004']);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .select('orderNo')
        .where('type', 'in', ['normal', 'vip'])
        .where('status', 'not in', ['cancelled', 'draft'])
        .orderBy('orderNo')
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['PX-001', 'SO-001', 'SO-002', 'SO-005']);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .where('paidAt', 'is', null)
        .orderBy('orderNo')
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['SO-003', 'SO-004']);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .where('paidAt', 'is not', null)
        .orderBy('orderNo')
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['PX-001', 'SO-001', 'SO-002', 'SO-005']);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .where('orderNo', 'like', 'SO-%')
        .orderBy('orderNo')
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['SO-001', 'SO-002', 'SO-003', 'SO-004', 'SO-005']);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .where('orderNo', 'not like', 'SO-%')
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['PX-001']);
  });

  it('supports Kysely-style expression groups, reusable factories, not, between, and parens', async () => {
    const ordersTable = 'whereOrders';
    const visiblePaidOrders = (eb: ExpressionBuilder) =>
      eb.and([
        eb('tenantId', '=', 'tenant-a'),
        eb('type', 'in', ['normal', 'vip']),
        eb('archivedAt', 'is', null),
        eb.or([
          eb.parens(
            eb.and([eb('status', '=', 'paid'), eb('amount', '>=', 100)]),
          ),
          eb('status', '=', 'completed'),
        ]),
        eb.not(eb.between('amount', 500, 700)),
      ]);

    await createWhereOrdersCollection(context);
    await seedWhereOrders(context, ordersTable);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .select(['orderNo', 'status', 'amount'])
        .where(visiblePaidOrders)
        .where(({ eb, not }) => not(eb('orderNo', 'like', 'PX-%')))
        .orderBy('amount')
        .execute(),
    ).resolves.toEqual([
      { orderNo: 'SO-001', status: 'paid', amount: 120 },
      { orderNo: 'SO-002', status: 'completed', amount: 240 },
    ]);
  });

  it('supports nested or groups and negated portable operators', async () => {
    const ordersTable = 'whereOrders';

    await createWhereOrdersCollection(context);
    await seedWhereOrders(context, ordersTable);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .select('orderNo')
        .where(({ eb, or, not }) =>
          or([
            eb('amount', '<', 100),
            eb.and([
              eb('tenantId', '=', 'tenant-a'),
              not(eb('type', 'in', ['normal', 'vip'])),
            ]),
          ]),
        )
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['SO-004']);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .select('orderNo')
        .where(({ eb, not }) =>
          eb.and([
            eb('tenantId', '=', 'tenant-a'),
            not(eb('orderNo', 'like', 'PX-%')),
            not(eb.between('amount', 200, 500)),
          ]),
        )
        .orderBy('orderNo')
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['SO-001', 'SO-005']);
  });

  it('rejects non-portable comparison operators early', async () => {
    const ordersTable = 'whereOrders';

    await createWhereOrdersCollection(context);

    expect(() =>
      context.database
        .query()
        .selectFrom(ordersTable)
        .where('orderNo', 'ilike' as any, 'SO-%'),
    ).toThrow('Unsupported portable comparison operator "ilike".');
  });

  it('supports object filters, eb.ref, eb.val, whereRef operands, and clearWhere', async () => {
    const ordersTable = 'whereOrders';

    await context.builder.createCollection('whereOrders', (collection) => {
      collection.increments('id');
      collection.string('tenantId');
      collection.string('orderNo');
      collection.string('status');
      collection.integer('amount');
      collection.integer('amountCopy');
      collection.integer('minAmount');
    });

    await context.database
      .query()
      .insertInto(ordersTable)
      .values([
        {
          tenantId: 'tenant-a',
          orderNo: 'SO-001',
          status: 'paid',
          amount: 120,
          amountCopy: 120,
          minAmount: 100,
        },
        {
          tenantId: 'tenant-a',
          orderNo: 'SO-002',
          status: 'paid',
          amount: 240,
          amountCopy: 240,
          minAmount: 300,
        },
        {
          tenantId: 'tenant-a',
          orderNo: 'SO-003',
          status: 'completed',
          amount: 360,
          amountCopy: 300,
          minAmount: 100,
        },
        {
          tenantId: 'tenant-b',
          orderNo: 'SO-004',
          status: 'paid',
          amount: 480,
          amountCopy: 480,
          minAmount: 100,
        },
      ])
      .execute();

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .where((eb) =>
          eb.and({
            tenantId: 'tenant-a',
            amountCopy: eb.ref('amount'),
          }),
        )
        .where((eb) => eb('status', '=', eb.val('paid')))
        .where((eb) => eb('amount', '>=', eb.ref('minAmount')))
        .orderBy('orderNo')
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['SO-001']);

    await expect(
      context.database
        .query()
        .selectFrom(ordersTable)
        .whereRef('amountCopy', '=', 'amount')
        .orderBy('orderNo')
        .pluck<string>('orderNo'),
    ).resolves.toEqual(['SO-001', 'SO-002', 'SO-004']);

    const base = context.database
      .query()
      .selectFrom(ordersTable)
      .select('orderNo')
      .where('status', '=', 'paid')
      .orderBy('orderNo')
      .limit(2);

    await expect(base.pluck<string>('orderNo')).resolves.toEqual([
      'SO-001',
      'SO-002',
    ]);
    await expect(base.clearWhere().pluck<string>('orderNo')).resolves.toEqual([
      'SO-001',
      'SO-002',
    ]);
    await expect(
      base.clearWhere().clearLimit().pluck<string>('orderNo'),
    ).resolves.toEqual(['SO-001', 'SO-002', 'SO-003', 'SO-004']);
    await expect(base.pluck<string>('orderNo')).resolves.toEqual([
      'SO-001',
      'SO-002',
    ]);
  });
});
