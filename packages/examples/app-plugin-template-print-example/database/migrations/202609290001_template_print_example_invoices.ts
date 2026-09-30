import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202609290001_template_print_example_invoices',
  async up({ builder }) {
    await builder.createCollection('templatePrintExampleInvoices', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('number', { length: 64 }).notNull();
      c.string('customerName', { length: 160 }).notNull();
      c.string('issuedOn', { length: 32 }).notNull();
      c.string('sourceQuoteId', { length: 64 }).notNull();
      c.integer('totalCents').notNull();
      c.unique(['number']);
      c.index('sourceQuoteId');
      c.hasMany('lines', 'templatePrintExampleInvoiceLines')
        .sourceKey('id')
        .foreignKey('invoiceId')
        .constraints(false);
    });

    await builder.createCollection('templatePrintExampleInvoiceLines', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('invoiceId', { length: 64 }).notNull();
      c.string('description', { length: 255 }).notNull();
      c.integer('quantity').notNull();
      c.integer('unitPriceCents').notNull();
      c.belongsTo('invoice', 'templatePrintExampleInvoices')
        .targetKey('id')
        .foreignKey('invoiceId')
        .constraints(true)
        .onDelete('cascade');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('templatePrintExampleInvoiceLines');
    await builder.dropCollection('templatePrintExampleInvoices');
  },
});

export default migration;
