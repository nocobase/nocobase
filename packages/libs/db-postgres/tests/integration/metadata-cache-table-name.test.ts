import { DatabaseCollectionMetadataStore } from '@nocobase/db/testing';
import { describeIntegrationDatabases } from '@nocobase/db-testkit';
import { expect, it } from 'vitest';

describeIntegrationDatabases(
  'PostgreSQL metadata cache table names',
  (context) => {
    it.each([
      ['ASCII', 'm'.repeat(54)],
      ['two-byte characters', 'é'.repeat(27)],
      ['three-byte characters', '数据'.repeat(9)],
      ['four-byte characters', '🗃'.repeat(13)],
    ])(
      'initializes and reopens metadata tables with %s',
      async (_label, tableName) => {
        const schema = context.identifier('metadataNames');
        await context.db.schema.createSchema(schema);
        const store = () =>
          new DatabaseCollectionMetadataStore({
            resolveClient: async () => context.db,
            tableName,
            schema,
          });

        try {
          const first = store();
          await first.put(
            { version: 1, name: 'orders', title: 'Before' },
            { expectedRevision: null },
          );
          const second = store();
          expect((await second.get('orders'))?.document.title).toBe('Before');
          await second.put(
            { version: 1, name: 'orders', title: 'After' },
            { expectedRevision: 1 },
          );
          expect(await first.get('orders')).toMatchObject({
            document: { title: 'After' },
            revision: 2,
          });

          const tables = await context.db
            .withSchema('information_schema')
            .table<{ table_name: string; table_schema: string }>('tables')
            .select('table_name')
            .where({ table_schema: schema });
          expect(tables).toHaveLength(2);
          const cacheTable = tables.find(
            (table) => table.table_name !== tableName,
          )!.table_name;
          expect(Buffer.byteLength(cacheTable)).toBeLessThanOrEqual(63);
          expect(cacheTable).not.toContain('\uFFFD');
          expect(cacheTable).toMatch(/_cache_[a-f0-9]{8}$/);
          expect(
            first.isInternalPhysicalCollection({
              tableName: cacheTable,
              schema,
            }),
          ).toBe(true);
        } finally {
          await context.db.schema.dropSchema(schema, true);
        }
      },
    );
  },
);
