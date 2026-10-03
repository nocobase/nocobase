import { describe, expect, it } from 'vitest';
import { CollectionBuilder } from '../../../src/collection/builder/builder.js';

describe('CollectionBuilder alterCollection', () => {
  it('collects fluent alter operations', async () => {
    const builder = new CollectionBuilder();

    const result = await builder.alterCollection(
      'orders',
      (collection) => {
        collection.datetime('paidAt').nullable();
        collection.string('paymentStatus', { length: 32 }).defaultTo('pending');
        collection.alterField('amount', {
          precision: 14,
          scale: 2,
          nullable: false,
        });
        collection.dropFields('legacyStatus', 'legacyCode');
        collection.index(['paymentStatus', 'paidAt'], {
          name: 'idx_orders_payment_paid',
        });
        collection.unique(['paymentStatus', 'paidAt'], {
          name: 'uk_orders_payment_paid',
        });
        collection.dropConstraint('uk_orders_old_constraint');
      },
      { dryRun: true },
    );

    expect(result.operations).toEqual([
      {
        type: 'alterCollection',
        collection: 'orders',
        changes: {
          addFields: [
            { name: 'paidAt', type: 'datetime', nullable: true },
            {
              name: 'paymentStatus',
              type: 'string',
              length: 32,
              defaultValue: 'pending',
            },
          ],
          alterFields: [
            {
              name: 'amount',
              changes: { precision: 14, scale: 2, nullable: false },
            },
          ],
          dropFields: ['legacyStatus', 'legacyCode'],
          addIndexes: [
            {
              fields: ['paymentStatus', 'paidAt'],
              name: 'idx_orders_payment_paid',
            },
          ],
          addConstraints: [
            {
              type: 'unique',
              fields: ['paymentStatus', 'paidAt'],
              name: 'uk_orders_payment_paid',
            },
          ],
          dropConstraints: ['uk_orders_old_constraint'],
        },
      },
    ]);
    const schemaOperation = result.schemaOperations?.[0];
    expect(schemaOperation?.type).toBe('alterTable');
    if (!schemaOperation || schemaOperation.type !== 'alterTable') {
      throw new Error('Expected an alterTable schema operation.');
    }
    expect(schemaOperation.tableName).toBe('orders');
    expect(schemaOperation.operations).toEqual(
      expect.arrayContaining([
        {
          type: 'addColumn',
          column: { name: 'paid_at', type: 'datetime', nullable: true },
        },
        { type: 'dropColumn', column: 'legacy_status' },
        { type: 'dropColumn', column: 'legacy_code' },
        { type: 'dropConstraint', name: 'uk_orders_old_constraint' },
      ]),
    );
  });

  it('supports field, index, and constraint shortcut methods', async () => {
    const builder = new CollectionBuilder();

    const addField = await builder.addField(
      'orders',
      {
        name: 'paidAt',
        type: 'datetime',
        nullable: true,
      },
      { dryRun: true },
    );
    const alterField = await builder.alterField(
      'orders',
      'amount',
      { precision: 14 },
      { dryRun: true },
    );
    const dropField = await builder.dropField('orders', 'legacyStatus', {
      dryRun: true,
    });
    const addIndex = await builder.addIndex(
      'orders',
      { fields: ['paidAt'] },
      { dryRun: true },
    );
    const dropIndex = await builder.dropIndex('orders', 'idx_orders_paid_at', {
      dryRun: true,
    });
    const addConstraint = await builder.addConstraint(
      'orders',
      { type: 'unique', fields: ['paidAt'], name: 'uk_orders_paid_at' },
      { dryRun: true },
    );
    const dropConstraint = await builder.dropConstraint(
      'orders',
      'uk_orders_paid_at',
      { dryRun: true },
    );

    expect(addField.operations[0]).toMatchObject({
      type: 'addField',
      collection: 'orders',
    });
    expect(alterField.operations[0]).toMatchObject({
      type: 'alterField',
      field: 'amount',
    });
    expect(dropField.schemaOperations?.[0]).toMatchObject({
      type: 'alterTable',
      operations: [{ type: 'dropColumn', column: 'legacy_status' }],
    });
    expect(addIndex.schemaOperations?.[0]).toMatchObject({
      operations: [{ type: 'addIndex', index: { columns: ['paid_at'] } }],
    });
    expect(dropIndex.schemaOperations?.[0]).toMatchObject({
      operations: [{ type: 'dropIndex', name: 'idx_orders_paid_at' }],
    });
    expect(addConstraint.schemaOperations?.[0]).toMatchObject({
      operations: [
        {
          type: 'addConstraint',
          constraint: { type: 'unique', columns: ['paid_at'] },
        },
      ],
    });
    expect(dropConstraint.schemaOperations?.[0]).toMatchObject({
      operations: [
        {
          type: 'dropConstraint',
          name: 'uk_orders_paid_at',
          constraintType: undefined,
        },
      ],
    });
  });

  it('drops a unique constraint with a predicate as the partial index it is', async () => {
    const builder = new CollectionBuilder();
    await builder.createCollection('dispatches', {
      fields: [
        { name: 'id', type: 'increments', primaryKey: true },
        { name: 'idempotencyKey', type: 'string', nullable: true },
        { name: 'number', type: 'string' },
      ],
      constraints: [
        {
          type: 'unique',
          name: 'uk_dispatches_idempotency_key',
          fields: ['idempotencyKey'],
          predicate: { idempotencyKey: { $notNull: true } },
        },
        { type: 'unique', name: 'uk_dispatches_number', fields: ['number'] },
      ],
    });

    const partial = await builder.dropConstraint(
      'dispatches',
      'uk_dispatches_idempotency_key',
      { dryRun: true },
    );
    const plain = await builder.dropConstraint(
      'dispatches',
      'uk_dispatches_number',
      { dryRun: true },
    );

    expect(partial.schemaOperations?.[0]).toMatchObject({
      operations: [
        { type: 'dropIndex', name: 'uk_dispatches_idempotency_key' },
      ],
    });
    expect(plain.schemaOperations?.[0]).toMatchObject({
      operations: [
        {
          type: 'dropConstraint',
          name: 'uk_dispatches_number',
          constraintType: 'unique',
        },
      ],
    });
  });

  it('resolves relation keys through fields added in the same alter operation', async () => {
    const builder = new CollectionBuilder();

    await builder.createCollection('users', {
      naming: { tablePrefix: 'app_' },
      fields: [{ name: 'userId', type: 'integer', primaryKey: true }],
    });
    await builder.createCollection('orders', {
      fields: [{ name: 'id', type: 'increments', primaryKey: true }],
    });

    const result = await builder.alterCollection(
      'orders',
      (collection) => {
        collection.bigInt('createdById');
        collection
          .belongsTo('createdBy', 'users')
          .foreignKey('createdById')
          .targetKey('userId')
          .constraints(true);
      },
      { dryRun: true },
    );

    expect(result.schemaOperations?.[0]).toMatchObject({
      type: 'alterTable',
      tableName: 'orders',
      operations: expect.arrayContaining([
        expect.objectContaining({
          type: 'addColumn',
          column: expect.objectContaining({
            name: 'created_by_id',
            type: 'bigInt',
          }),
        }),
        expect.objectContaining({
          type: 'addIndex',
          index: expect.objectContaining({
            columns: ['created_by_id'],
            name: 'idx_orders_created_by_id',
          }),
        }),
        expect.objectContaining({
          type: 'addConstraint',
          constraint: expect.objectContaining({
            type: 'foreignKey',
            columns: ['created_by_id'],
            references: {
              table: 'app_users',
              columns: ['user_id'],
            },
          }),
        }),
      ]),
    });
    expect(result.schemaOperations?.[0]).not.toMatchObject({
      operations: expect.arrayContaining([
        { type: 'addColumn', column: { name: 'created_by_id' } },
      ]),
    });
  });

  it('deduplicates relation indexes added through field and collection definitions', async () => {
    const builder = new CollectionBuilder();

    await builder.createCollection('orders', {
      fields: [{ name: 'id', type: 'increments', primaryKey: true }],
    });

    const result = await builder.alterCollection(
      'orders',
      (collection) => {
        collection.string('productId');
        collection
          .belongsTo('product', 'products')
          .foreignKey('productId')
          .targetKey('id')
          .foreignKeyType('string')
          .index();
        collection.index('productId');
      },
      { dryRun: true },
    );

    const schemaOperation = result.schemaOperations?.[0];
    expect(schemaOperation?.type).toBe('alterTable');
    if (!schemaOperation || schemaOperation.type !== 'alterTable') {
      throw new Error('Expected an alterTable schema operation.');
    }
    expect(
      schemaOperation.operations.filter(
        (operation) => operation.type === 'addIndex',
      ),
    ).toEqual([
      {
        type: 'addIndex',
        index: {
          columns: ['product_id'],
          name: 'idx_orders_product_id',
        },
      },
    ]);
  });
});
