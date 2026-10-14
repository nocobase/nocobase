import { expect, it } from 'vitest';
import { CollectionMetadataConflictError } from '@nocobase/db';
import { CollectionNamingIndex } from '../../../../db/src/collection/registry/naming-index.js';
import { DatabaseCollectionMetadataStore } from '../../../../db/src/metadata/internal/database-document-store.js';
import { describeIntegrationDatabases } from '../helpers.js';

describeIntegrationDatabases(
  'Collection metadata cache concurrent writes',
  (context) => {
    function store(): DatabaseCollectionMetadataStore {
      return new DatabaseCollectionMetadataStore({
        resolveClient: async () => context.db,
        tableName: context.identifier('concurrentMetadata'),
      });
    }

    it.each([false, true])(
      'serializes competing inserts across separate Stores: %s',
      async (separateStores) => {
        const root = store();
        await root.initialize();
        await context.db.transaction(async (transaction) => {
          const first = root.withClient(async () => transaction);
          const second = separateStores
            ? store().withClient(async () => transaction)
            : first;
          await second.initialize();
          const results = await Promise.allSettled([
            first.put(
              { version: 1, name: 'orders', title: 'First' },
              { expectedRevision: null },
            ),
            second.put(
              { version: 1, name: 'orders', title: 'Second' },
              { expectedRevision: null },
            ),
            second.put(
              { version: 1, name: 'accounts' },
              { expectedRevision: null },
            ),
          ]);
          expect(results[0].status).toBe('fulfilled');
          expect(results[1]).toMatchObject({
            status: 'rejected',
            reason: new CollectionMetadataConflictError('orders', null, 1),
          });
          if (results[1].status === 'rejected') {
            expect(results[1].reason).toBeInstanceOf(
              CollectionMetadataConflictError,
            );
            expect(results[1].reason).toMatchObject({
              code: 'METADATA_CONFLICT',
              expectedRevision: null,
              actualRevision: 1,
            });
          }
          expect(results[2].status).toBe('fulfilled');
          // A conflict neither aborts the database transaction nor poisons its queue.
          expect((await second.get('accounts'))?.revision).toBe(1);
          await first.put(
            { version: 1, name: 'orders', title: 'Updated' },
            { expectedRevision: 1 },
          );
        });
        expect((await root.get('orders'))?.document.title).toBe('Updated');
        expect((await root.get('accounts'))?.revision).toBe(1);
      },
    );

    it.each(['insert', 'update', 'delete'] as const)(
      'does not retain an intermediate snapshot after a concurrent %s',
      async (operation) => {
        const root = store();
        await root.initialize();
        if (operation !== 'insert') {
          await root.put(
            { version: 1, name: 'orders', title: 'Before' },
            { expectedRevision: null },
          );
        }
        await CollectionNamingIndex.create(root);
        const expected = operation === 'delete' ? undefined : 'After';
        await context.db.transaction(async (transaction) => {
          const child = root.withClient(async () => transaction);
          await Promise.all([
            operation === 'delete'
              ? child.delete('orders', { expectedRevision: 1 })
              : child.put(
                  { version: 1, name: 'orders', title: 'After' },
                  { expectedRevision: operation === 'insert' ? null : 1 },
                ),
            CollectionNamingIndex.create(child),
          ]);
          expect(
            (await CollectionNamingIndex.create(child)).metadata('orders')
              ?.title,
          ).toBe(expected);
          await transaction.transaction(async (savepoint) => {
            expect(
              (
                await CollectionNamingIndex.create(
                  child.withClient(async () => savepoint),
                )
              ).metadata('orders')?.title,
            ).toBe(expected);
          });
        });
        expect((await root.get('orders'))?.document.title).toBe(expected);
        expect(
          (await CollectionNamingIndex.create(root)).metadata('orders')?.title,
        ).toBe(expected);
      },
    );

    it.each([false, true])(
      'isolates overlapping writes when rollback is %s',
      async (rollback) => {
        const root = store();
        for (const name of ['orders', 'accounts']) {
          await root.put(
            { version: 1, name, title: 'Before' },
            { expectedRevision: null },
          );
        }
        await CollectionNamingIndex.create(root);
        const failure = new Error('Expected rollback');
        const run = context.db.transaction(async (transaction) => {
          const child = root.withClient(async () => transaction);
          await Promise.all([
            ...['orders', 'accounts'].map((name) =>
              child.put(
                { version: 1, name, title: 'After' },
                { expectedRevision: 1 },
              ),
            ),
            CollectionNamingIndex.create(child),
          ]);
          const index = await CollectionNamingIndex.create(child);
          for (const name of ['orders', 'accounts'])
            expect(index.metadata(name)?.title).toBe('After');
          if (rollback) throw failure;
        });
        if (rollback) await expect(run).rejects.toBe(failure);
        else await run;
        const index = await CollectionNamingIndex.create(root);
        for (const name of ['orders', 'accounts']) {
          expect(index.metadata(name)?.title).toBe(
            rollback ? 'Before' : 'After',
          );
        }
      },
    );
  },
);
