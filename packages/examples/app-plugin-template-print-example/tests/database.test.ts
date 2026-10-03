// @vitest-environment node
import { describeMigration } from '@nocobase/db-testing/vitest';
import { expect } from 'vitest';
import { migrations } from './fixtures.js';

describeMigration('202609290001_template_print_example_invoices', {
  sources: migrations,
  up: async ({ connection, expectCollection }) => {
    const invoices = await connection.collections.get(
      'templatePrintExampleInvoices',
    );
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
    await expectCollection('templatePrintExampleInvoices').toHaveField(
      'sourceQuoteId',
      { nullable: false },
    );
    await expectCollection('templatePrintExampleInvoices').toHaveIndex(
      ['number'],
      { unique: true },
    );
    await expectCollection('templatePrintExampleInvoiceLines').toHaveForeignKey(
      ['invoiceId'],
      'templatePrintExampleInvoices',
      { onDelete: 'cascade' },
    );
  },
  down: async ({ connection, expectCollection }) => {
    await expect(
      connection.collections.get('templatePrintExampleInvoices'),
    ).resolves.toBeUndefined();
    await expectCollection('templatePrintExampleInvoiceLines').not.toExist();
  },
});
