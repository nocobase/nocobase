import { defineSeed, type SeedDefinition } from '@nocobase/db';

const seed: SeedDefinition = defineSeed({
  name: '202609290001_template_print_example_demo',
  transaction: true,
  async run({ query }) {
    const invoice = await query
      .selectFrom('templatePrintExampleInvoices')
      .select('id')
      .where('id', '=', 'print-invoice-1')
      .executeTakeFirst();
    if (invoice) return;

    await query
      .insertInto('templatePrintExampleInvoices')
      .values({
        id: 'print-invoice-1',
        number: 'INV-2026-003',
        customerName: 'Hill Studio',
        issuedOn: '2026-09-22',
        sourceQuoteId: 'quote-3',
        totalCents: 175000,
      })
      .execute();

    await query
      .insertInto('templatePrintExampleInvoiceLines')
      .values([
        {
          id: 'print-invoice-line-1',
          invoiceId: 'print-invoice-1',
          description: 'Design and planning',
          quantity: 1,
          unitPriceCents: 125000,
        },
        {
          id: 'print-invoice-line-2',
          invoiceId: 'print-invoice-1',
          description: 'Installation support',
          quantity: 2,
          unitPriceCents: 25000,
        },
      ])
      .execute();
  },
});

export default seed;
