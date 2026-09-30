// @vitest-environment node
import path from 'node:path';
import sqlite from '@nocobase/db-sqlite';
import { createDatabaseManager } from '@nocobase/db';
import { expect, it } from 'vitest';

it('seeds two stable invoices with lines and records task history', async () => {
  const database = createDatabaseManager({
    drivers: { sqlite },
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  });

  try {
    await database
      .createMigrator({
        directory: path.resolve(import.meta.dirname, '../database/migrations'),
        packageName: '@nocobase/app-plugin-template-print-example',
      })
      .latest();
    const seeder = database.createSeeder({
      directory: path.resolve(import.meta.dirname, '../database/seeds'),
      packageName: '@nocobase/app-plugin-template-print-example',
    });

    expect(await seeder.run()).toMatchObject({
      executed: [
        '202609290001_template_print_example_demo',
        '202609290002_template_print_example_more_invoices',
      ],
    });
    expect(
      await database
        .repository('templatePrintExampleInvoices')
        .findOne({ filter: { id: 'print-invoice-1' } }),
    ).toMatchObject({
      number: 'INV-2026-003',
      sourceQuoteId: 'quote-3',
      totalCents: 175000,
    });
    expect(
      await database.repository('templatePrintExampleInvoiceLines').findMany({
        filter: { invoiceId: 'print-invoice-1' },
        sort: (sort) => sort.field('id').asc(),
      }),
    ).toEqual([
      expect.objectContaining({
        id: 'print-invoice-line-1',
        quantity: 1,
        unitPriceCents: 125000,
      }),
      expect.objectContaining({
        id: 'print-invoice-line-2',
        quantity: 2,
        unitPriceCents: 25000,
      }),
    ]);
    expect(
      await database
        .repository('templatePrintExampleInvoices')
        .findOne({ filter: { id: 'print-invoice-2' } }),
    ).toMatchObject({
      number: 'INV-2026-004',
      sourceQuoteId: 'quote-7',
      totalCents: 86000,
    });
    expect(
      await database.repository('templatePrintExampleInvoiceLines').findMany({
        filter: { invoiceId: 'print-invoice-2' },
        sort: (sort) => sort.field('id').asc(),
      }),
    ).toEqual([
      expect.objectContaining({
        id: 'print-invoice-line-3',
        quantity: 1,
        unitPriceCents: 36000,
      }),
      expect.objectContaining({
        id: 'print-invoice-line-4',
        quantity: 2,
        unitPriceCents: 25000,
      }),
    ]);
    expect(await seeder.run()).toMatchObject({
      executed: [],
      skipped: [
        '202609290001_template_print_example_demo',
        '202609290002_template_print_example_more_invoices',
      ],
    });
  } finally {
    await database.destroy();
  }
});
