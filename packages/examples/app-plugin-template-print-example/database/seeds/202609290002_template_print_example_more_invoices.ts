import { defineSeed, type SeedDefinition } from '@nocobase/db';

const seed: SeedDefinition = defineSeed({
  name: '202609290002_template_print_example_more_invoices',
  transaction: true,
  async run({ query }) {
    const invoice = await query
      .selectFrom('templatePrintExampleInvoices')
      .select('id')
      .where('id', '=', 'print-invoice-2')
      .executeTakeFirst();
    if (invoice) return;

    await query
      .insertInto('templatePrintExampleInvoices')
      .values({
        id: 'print-invoice-2',
        number: 'INV-2026-004',
        customerName: 'Hill Studio',
        issuedOn: '2026-09-24',
        sourceQuoteId: 'quote-7',
        totalCents: 86000,
      })
      .execute();

    await query
      .insertInto('templatePrintExampleInvoiceLines')
      .values([
        {
          id: 'print-invoice-line-3',
          invoiceId: 'print-invoice-2',
          description: 'Handover workshop',
          quantity: 1,
          unitPriceCents: 36000,
        },
        {
          id: 'print-invoice-line-4',
          invoiceId: 'print-invoice-2',
          description: 'Planning and delivery',
          quantity: 2,
          unitPriceCents: 25000,
        },
      ])
      .execute();
  },
});

export default seed;
