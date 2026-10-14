import { expect, it } from 'vitest';
import { CollectionNamingIndex } from '../../../../db/src/collection/registry/naming-index.js';
import { DatabaseCollectionMetadataStore } from '../../../../db/src/metadata/internal/database-document-store.js';
import { describeIntegrationDatabases } from '../helpers.js';

describeIntegrationDatabases(
  'Collection metadata cache initialization',
  (context) => {
    async function legacyTable(): Promise<string> {
      const name = context.identifier('legacyMetadata');
      await context.db.schema.createTable(name, (table) => {
        table.string('name', 191).primary();
        table.text('document').notNullable();
        table.bigInteger('revision').notNullable();
        table.dateTime('created_at').notNullable();
        table.dateTime('updated_at').notNullable();
      });
      await context.db(name).insert({
        name: 'orders',
        document: JSON.stringify({
          version: 1,
          name: 'orders',
          title: 'Original',
        }),
        revision: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });
      return name;
    }

    it('reads legacy metadata in concurrent transactions without executing DDL', async () => {
      const tableName = await legacyTable();
      const ddl: string[] = [];
      const record = (query: { sql: string }): void => {
        if (/^create\s+table/i.test(query.sql)) ddl.push(query.sql);
      };
      context.db.on('query', record);
      try {
        await Promise.all(
          Array.from({ length: 2 }, () =>
            context.db.transaction(async (transaction) => {
              const store = new DatabaseCollectionMetadataStore({
                resolveClient: async () => transaction,
                tableName,
              });
              expect(
                (await CollectionNamingIndex.create(store)).metadata('orders')
                  ?.title,
              ).toBe('Original');
              expect((await store.get('orders'))?.revision).toBe(1);
            }),
          ),
        );
        expect(ddl).toEqual([]);
      } finally {
        context.db.off('query', record);
      }
    });

    it('preserves caller rollback when reading legacy metadata', async () => {
      const tableName = await legacyTable();
      const dataTable = context.identifier('rollbackData');
      await context.db.schema.createTable(dataTable, (table) =>
        table.integer('id').primary(),
      );
      const rollback = new Error('Expected rollback');
      await expect(
        context.db.transaction(async (transaction) => {
          await transaction(dataTable).insert({ id: 1 });
          const store = new DatabaseCollectionMetadataStore({
            resolveClient: async () => transaction,
            tableName,
          });
          expect(
            (await CollectionNamingIndex.create(store)).metadata('orders')
              ?.title,
          ).toBe('Original');
          throw rollback;
        }),
      ).rejects.toBe(rollback);
      expect(await context.db(dataTable).select('*')).toEqual([]);
    });

    it('requires preparation before metadata writes in an externally opened transaction', async () => {
      const tableName = await legacyTable();
      await context.db.transaction(async (transaction) => {
        const store = new DatabaseCollectionMetadataStore({
          resolveClient: async () => transaction,
          tableName,
        });
        await expect(
          store.put(
            { version: 1, name: 'orders', title: 'After' },
            { expectedRevision: 1 },
          ),
        ).rejects.toThrow('before opening a transaction');
        expect((await store.get('orders'))?.document.title).toBe('Original');
      });
      const root = new DatabaseCollectionMetadataStore({
        resolveClient: async () => context.db,
        tableName,
      });
      await root.initialize();
      await context.db.transaction(async (transaction) => {
        await root
          .withClient(async () => transaction)
          .put(
            { version: 1, name: 'orders', title: 'After' },
            { expectedRevision: 1 },
          );
      });
      expect((await root.get('orders'))?.document.title).toBe('After');
    });

    it('converges concurrent root initializers before opening their transactions', async () => {
      const tableName = await legacyTable();
      const roots = Array.from(
        { length: 2 },
        () =>
          new DatabaseCollectionMetadataStore({
            resolveClient: async () => context.db,
            tableName,
          }),
      );
      await Promise.all(roots.map((root) => root.initialize()));
      for (const root of roots) {
        const index = await CollectionNamingIndex.create(root);
        await context.db.transaction(async (transaction) => {
          expect(
            await CollectionNamingIndex.create(
              root.withClient(async () => transaction),
            ),
          ).toBe(index);
        });
      }
    });
  },
);
