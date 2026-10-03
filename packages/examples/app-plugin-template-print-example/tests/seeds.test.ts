// @vitest-environment node
import { createDatabaseTest } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { migrations, seeds } from './fixtures.js';

const test = createDatabaseTest({ migrations });

test('seeds two stable invoices with lines and records task history', async ({
  database,
}) => {
  const seeder = database.createSeeder({ sources: seeds });

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
});
