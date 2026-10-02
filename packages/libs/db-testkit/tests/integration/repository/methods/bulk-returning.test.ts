import { expect, it } from 'vitest';
import { describeIntegrationDatabases } from '../../helpers.js';
import { createOrders } from '../fixtures/scalar.js';

/** `createMany` takes a non-empty tuple; generated rows are checked into one. */
function nonEmpty<T>(items: T[]): [T, ...T[]] {
  const [first, ...rest] = items;
  if (first === undefined) throw new Error('Expected at least one row.');
  return [first, ...rest];
}

describeIntegrationDatabases('Repository methods/bulk-returning', (context) => {
  it('returns selected records from bulk mutations in stable order', async () => {
    await createOrders(context);
    const repository = context.database.repository('repositoryOrders');

    await expect(
      repository.createMany({
        values: [
          { orderNo: 'SO-003', status: 'draft', amount: 30 },
          { orderNo: 'SO-001', status: 'draft', amount: 10 },
          { orderNo: 'SO-002', status: 'paid', amount: 20 },
        ],
        select: (select) => select.fields('id', 'orderNo', 'version'),
      }),
    ).resolves.toEqual({
      createdCount: 3,
      records: [
        { id: 1, orderNo: 'SO-003', version: 1 },
        { id: 2, orderNo: 'SO-001', version: 1 },
        { id: 3, orderNo: 'SO-002', version: 1 },
      ],
    });

    await expect(
      repository.updateMany({
        filter: { status: 'draft' },
        values: { status: 'paid' },
        select: (select) => select.fields('id', 'orderNo', 'status', 'version'),
      }),
    ).resolves.toEqual({
      updatedCount: 2,
      records: [
        { id: 1, orderNo: 'SO-003', status: 'paid', version: 2 },
        { id: 2, orderNo: 'SO-001', status: 'paid', version: 2 },
      ],
    });

    await expect(
      repository.deleteMany({
        all: true,
        select: (select) => select.fields('id', 'orderNo', 'version'),
      }),
    ).resolves.toEqual({
      deletedCount: 3,
      records: [
        { id: 1, orderNo: 'SO-003', version: 2 },
        { id: 2, orderNo: 'SO-001', version: 2 },
        { id: 3, orderNo: 'SO-002', version: 1 },
      ],
    });

    await expect(
      repository.updateMany({
        filter: { status: 'missing' },
        values: { status: 'paid' },
        select: (select) => select.fields('id'),
      }),
    ).resolves.toEqual({ updatedCount: 0, records: [] });
    await expect(
      repository.deleteMany({
        filter: { status: 'missing' },
        select: (select) => select.fields('id'),
      }),
    ).resolves.toEqual({ deletedCount: 0, records: [] });
  });

  // One statement per locked row set used to OR every key together, which
  // SQLite refuses past about a thousand rows ("Expression tree is too large").
  it('updates, checks scope for, reloads and deletes more rows than one statement can address', async () => {
    await createOrders(context);
    const repository = context.database.repository('repositoryOrders');
    const total = 1200;
    for (let start = 0; start < total; start += 200) {
      await repository.createMany({
        values: nonEmpty(
          Array.from({ length: 200 }, (_, offset) => ({
            orderNo: `SO-${String(start + offset).padStart(5, '0')}`,
            status: 'draft',
            amount: start + offset,
          })),
        ),
      });
    }

    const updated = await repository.updateMany({
      filter: { status: 'draft' },
      values: { status: 'paid' },
      select: (select) => select.fields('id', 'status'),
    });
    expect(updated.updatedCount).toBe(total);
    expect(updated.records.map((record) => record.id)).toEqual(
      Array.from({ length: total }, (_, index) => index + 1),
    );
    expect(updated.records.every((record) => record.status === 'paid')).toBe(
      true,
    );

    const scoped = repository.withPolicy({
      read: { scope: { status: 'paid' }, fields: ['id', 'status'] },
      create: { scope: { status: 'paid' }, fields: ['status'] },
      update: { scope: { status: 'paid' }, fields: ['status'] },
      delete: { scope: { status: 'paid' } },
    });
    await expect(
      scoped.updateMany({ all: true, values: { status: 'paid' } }),
    ).resolves.toEqual({ updatedCount: total });
    await expect(
      scoped.updateMany({ all: true, values: { status: 'void' } }),
    ).rejects.toMatchObject({ code: 'SCOPE_VIOLATION' });
    await expect(
      repository.count({ filter: { status: 'paid' } }),
    ).resolves.toBe(total);

    const deleted = await repository.deleteMany({
      all: true,
      select: (select) => select.fields('id'),
    });
    expect(deleted.deletedCount).toBe(total);
    expect(deleted.records).toHaveLength(total);
    await expect(repository.count()).resolves.toBe(0);
  });

  // Batching the delete must not mistake rows a database cascade already
  // removed, from an earlier batch, for rows that could not be deleted.
  it('deletes selected rows that an earlier batch removed by cascade', async () => {
    // SQL Server refuses a self-referencing ON DELETE CASCADE.
    if (context.spec.dialect === 'mssql') return;
    await context.builder.createCollection('cascadeNodes', (collection) => {
      collection.string('id').primary().notNull();
      collection.string('parentId').nullable();
      collection.foreignKey('parentId', {
        references: { collection: 'cascadeNodes', fields: ['id'] },
        onDelete: 'cascade',
      });
    });
    const repository = context.database.repository('cascadeNodes');
    const id = (index: number): string => `n${String(index).padStart(3, '0')}`;
    // Rows 201-250 are children of rows 1-50, so their parents fall in the
    // first batch of 200 and the children in the second.
    await repository.createMany({
      values: nonEmpty(
        Array.from({ length: 200 }, (_, index) => ({
          id: id(index + 1),
        })),
      ),
    });
    await repository.createMany({
      values: nonEmpty(
        Array.from({ length: 50 }, (_, index) => ({
          id: id(index + 201),
          parentId: id(index + 1),
        })),
      ),
    });

    const deleted = await repository.deleteMany({
      all: true,
      select: (select) => select.fields('id'),
    });

    expect(deleted.deletedCount).toBe(250);
    expect(deleted.records).toHaveLength(250);
    await expect(repository.count()).resolves.toBe(0);
  });
});
