import { expect, it, vi } from 'vitest';
import { CollectionNamingIndex } from '../../../../db/src/collection/registry/naming-index.js';
import { DatabaseCollectionMetadataStore } from '../../../../db/src/metadata/internal/database-document-store.js';
import { invalidateMetadataNamingSnapshot } from '../../../../db/src/metadata/internal/naming-snapshot.js';
import { describeIntegrationDatabases } from '../helpers.js';

describeIntegrationDatabases('Collection metadata naming cache', (context) => {
  function store(): DatabaseCollectionMetadataStore {
    return new DatabaseCollectionMetadataStore({
      resolveClient: async () => context.db,
      tableName: context.identifier('cachedMetadata'),
    });
  }

  it('initializes caching for an existing metadata table without rewriting its documents', async () => {
    const root = store();
    await context.db.schema.createTable(root.tableName, (table) => {
      table.string('name', 191).primary();
      table.text('document').notNullable();
      table.bigInteger('revision').notNullable();
      table.dateTime('created_at').notNullable();
      table.dateTime('updated_at').notNullable();
    });
    await context.db(root.tableName).insert({
      name: 'orders',
      document: JSON.stringify({
        version: 1,
        name: 'orders',
        title: 'Existing',
      }),
      revision: 7,
      created_at: new Date(),
      updated_at: new Date(),
    });
    const index = await CollectionNamingIndex.create(root);
    expect(index.metadata('orders')).toMatchObject({
      title: 'Existing',
      revision: 7,
    });
    expect(await root.get('orders')).toEqual({
      document: { version: 1, name: 'orders', title: 'Existing' },
      revision: 7,
    });
  });

  it('shares validated indexes across transaction clients and separates naming options', async () => {
    const root = store();
    await root.put(
      { version: 1, name: 'orders', title: 'Orders' },
      { expectedRevision: null },
    );
    const original = await CollectionNamingIndex.create(root);
    await context.db.transaction(async (transaction) => {
      const child = root.withClient(async () => transaction);
      const list = vi.spyOn(child, 'list');
      expect(await CollectionNamingIndex.create(child)).toBe(original);
      const prefixed = await CollectionNamingIndex.create(child, {
        tablePrefix: 'app_',
      });
      expect(prefixed.resolveLogicalCollection('orders').tableName).toBe(
        'app_orders',
      );
      expect(list).not.toHaveBeenCalled();
    });
  });

  it('isolates savepoint versions and restores the committed index after rollback', async () => {
    const root = store();
    await root.put(
      { version: 1, name: 'orders', title: 'Original' },
      { expectedRevision: null },
    );
    const original = await CollectionNamingIndex.create(root);
    const rollback = new Error('Expected rollback');
    await expect(
      context.db.transaction(async (transaction) => {
        const child = root.withClient(async () => transaction);
        await child.put(
          { version: 1, name: 'orders', title: 'Outer' },
          { expectedRevision: 1 },
        );
        expect(
          (await CollectionNamingIndex.create(child)).metadata('orders')?.title,
        ).toBe('Outer');
        await expect(
          transaction.transaction(async (savepoint) => {
            const inner = child.withClient(async () => savepoint);
            await inner.put(
              { version: 1, name: 'orders', title: 'Inner' },
              { expectedRevision: 2 },
            );
            expect(
              (await CollectionNamingIndex.create(inner)).metadata('orders')
                ?.title,
            ).toBe('Inner');
            throw rollback;
          }),
        ).rejects.toBe(rollback);
        expect(
          (await CollectionNamingIndex.create(child)).metadata('orders')?.title,
        ).toBe('Outer');
        throw rollback;
      }),
    ).rejects.toBe(rollback);
    expect(
      (await CollectionNamingIndex.create(root)).metadata('orders'),
    ).toEqual(original.metadata('orders'));
  });

  it('detects updates, deletion, and revision reuse from another store', async () => {
    const root = store();
    const other = store();
    await root.put(
      { version: 1, name: 'orders', title: 'Original' },
      { expectedRevision: null },
    );
    await CollectionNamingIndex.create(root);
    await other.delete('orders', { expectedRevision: 1 });
    await other.put(
      { version: 1, name: 'orders', title: 'Recreated' },
      { expectedRevision: null },
    );
    expect(
      (await CollectionNamingIndex.create(root)).metadata('orders')?.title,
    ).toBe('Recreated');
    await other.put(
      { version: 1, name: 'orders', title: 'Updated' },
      { expectedRevision: 1 },
    );
    expect(
      (await CollectionNamingIndex.create(root)).metadata('orders')?.title,
    ).toBe('Updated');
    await other.delete('orders', { expectedRevision: 2 });
    expect(
      (await CollectionNamingIndex.create(root)).metadata('orders'),
    ).toBeUndefined();
  });

  it('reloads after explicit invalidation of an out-of-band document edit', async () => {
    const root = store();
    await root.put(
      { version: 1, name: 'orders', title: 'Original' },
      { expectedRevision: null },
    );
    await CollectionNamingIndex.create(root);
    await context
      .db(root.tableName)
      .where({ name: 'orders' })
      .update({
        document: JSON.stringify({
          version: 1,
          name: 'orders',
          title: 'Raw edit',
        }),
      });
    invalidateMetadataNamingSnapshot(root);
    expect(
      (await CollectionNamingIndex.create(root)).metadata('orders')?.title,
    ).toBe('Raw edit');
  });

  it('does not cache a failed validation and can recover after repair', async () => {
    const root = store();
    await root.put(
      { version: 1, name: 'orders', title: 'Original' },
      { expectedRevision: null },
    );
    await context
      .db(root.tableName)
      .where({ name: 'orders' })
      .update({ document: '{}' });
    await expect(CollectionNamingIndex.create(root)).rejects.toThrow();
    await context
      .db(root.tableName)
      .where({ name: 'orders' })
      .update({
        document: JSON.stringify({
          version: 1,
          name: 'orders',
          title: 'Repaired',
        }),
      });
    expect(
      (await CollectionNamingIndex.create(root)).metadata('orders')?.title,
    ).toBe('Repaired');
  });

  it('retries a snapshot if metadata changes while its pages are loading', async () => {
    const root = store();
    const other = store();
    await root.put(
      { version: 1, name: 'orders', title: 'Before' },
      { expectedRevision: null },
    );
    const list = root.list.bind(root);
    const spy = vi
      .spyOn(root, 'list')
      .mockImplementationOnce(async (options) => {
        const page = await list(options);
        await other.put(
          { version: 1, name: 'orders', title: 'After' },
          { expectedRevision: 1 },
        );
        return page;
      });
    expect(
      (await CollectionNamingIndex.create(root)).metadata('orders')?.title,
    ).toBe('After');
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it('does not republish an explicitly invalidated in-flight snapshot', async () => {
    const root = store();
    await root.put(
      { version: 1, name: 'orders', title: 'Before' },
      { expectedRevision: null },
    );
    const list = root.list.bind(root);
    const spy = vi
      .spyOn(root, 'list')
      .mockImplementationOnce(async (options) => {
        const page = await list(options);
        await context
          .db(root.tableName)
          .where({ name: 'orders' })
          .update({
            document: JSON.stringify({
              version: 1,
              name: 'orders',
              title: 'After',
            }),
          });
        invalidateMetadataNamingSnapshot(root);
        return page;
      });
    expect(
      (await CollectionNamingIndex.create(root)).metadata('orders')?.title,
    ).toBe('After');
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
