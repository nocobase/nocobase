// @vitest-environment node
import path from 'node:path';
import sqlite from '@nocobase/db-sqlite';
import { createDatabaseManager } from '@nocobase/db';
import { expect, it } from 'vitest';

it('creates the invoice schema and rolls it back through the Migrator', async () => {
  const database = createDatabaseManager({
    drivers: { sqlite },
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  });
  const migrator = database.createMigrator({
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
    packageName: '@nocobase/app-plugin-template-print-example',
  });

  try {
    await migrator.latest();
    const collections = database.connection().collections;
    const invoices = await collections.get('templatePrintExampleInvoices');
    expect(invoices?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'number', type: 'string' }),
        expect.objectContaining({
          name: 'lines',
          type: 'hasMany',
          target: 'templatePrintExampleInvoiceLines',
        }),
      ]),
    );
    expect(
      await collections.getPhysical('templatePrintExampleInvoices'),
    ).toMatchObject({
      tableName: 'template_print_example_invoices',
      columns: expect.arrayContaining([
        expect.objectContaining({
          columnName: 'source_quote_id',
          nullable: false,
        }),
      ]),
      indexes: expect.arrayContaining([
        expect.objectContaining({ unique: true }),
      ]),
    });
    expect(
      (await collections.getPhysical('templatePrintExampleInvoiceLines'))
        ?.foreignKeys,
    ).toContainEqual(
      expect.objectContaining({
        columns: ['invoice_id'],
        onDelete: 'cascade',
      }),
    );

    await migrator.rollback();
    expect(
      await collections.get('templatePrintExampleInvoices'),
    ).toBeUndefined();
    expect(
      await collections.getPhysical('templatePrintExampleInvoiceLines'),
    ).toBeUndefined();
  } finally {
    await database.destroy();
  }
});
