import { describeIntegrationDatabases } from '@nocobase/db-testkit';
import { expect, it } from 'vitest';

describeIntegrationDatabases('PostgreSQL inspection query cost', (context) => {
  it('reads all schema aspects and expression keys in one statement', async () => {
    const tableName = context.table('inspection');
    const indexName = context.identifier('inspection_expressions');
    await context.db.schema.createTable(tableName, (table) => {
      table.increments('id');
      table.string('label').notNullable().unique();
      table.integer('priority');
    });
    await context.db.raw(
      'create index ?? on ?? (lower(label) desc nulls first, (priority + 1) asc nulls last) include (id) where priority > 0',
      [indexName, tableName],
    );
    const statements: string[] = [];
    const record = (query: { sql: string }): void => {
      statements.push(query.sql);
    };
    context.db.on('query', record);
    try {
      const physical = await context.database
        .connection()
        .schemaInspector.getPhysicalCollection({ tableName });
      expect(statements).toHaveLength(1);
      expect(physical?.primaryKey?.columns).toEqual(['id']);
      expect(physical?.uniqueConstraints).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ columns: ['label'] }),
        ]),
      );
      expect(physical?.indexes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: indexName,
            keys: [
              {
                expression: expect.stringContaining('lower('),
                order: 'desc',
                nulls: 'first',
              },
              {
                expression: expect.stringContaining('priority + 1'),
                order: 'asc',
                nulls: 'last',
              },
            ],
            includeColumns: ['id'],
            predicate: expect.stringContaining('priority > 0'),
          }),
        ]),
      );
    } finally {
      context.db.off('query', record);
    }
  });

  it('inspects raw DDL through the transaction and discards rolled-back schema', async () => {
    await context.builder.createCollection('inspection', (collection) => {
      collection.increments('id');
    });
    const root = context.database.connection();
    const tableName = context.table('inspection');
    await root.collections.get('inspection');
    const rollback = new Error('Expected rollback');
    await expect(
      root.transaction(async (transaction) => {
        const client = await transaction.client<typeof context.db>();
        await client.schema.table(tableName, (table) => {
          table.string('note');
        });
        expect(
          (await transaction.collections.get('inspection'))?.fields,
        ).toContainEqual(expect.objectContaining({ name: 'note' }));
        throw rollback;
      }),
    ).rejects.toBe(rollback);
    await root.transaction(async (transaction) => {
      expect(
        (await transaction.collections.get('inspection'))?.fields?.map(
          (field) => field.name,
        ),
      ).toEqual(['id']);
    });
  });
});
