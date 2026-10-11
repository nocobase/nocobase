import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610110001_lifecycle_example_create_invoices',
  async up({ builder }) {
    await builder.createCollection('lifecycleExampleInvoices', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('orderRef').notNull();
      table.string('customerId').notNull();
      table.string('title').notNull();
      table.string('taxNumber').notNull();
      table.integer('amountCents').notNull();
      table.integer('failSubmissions').notNull().defaultTo(0);
      table.string('providerRequestId');
      table.string('invoiceNumber');
      table.text('pdfUrl');
      table.text('lastError');
      table.integer('queryCount').notNull().defaultTo(0);
      table.string('status').notNull();
      table.datetimeTz('statusChangedAt').notNull();
      table.integer('lifecycleVersion').notNull().defaultTo(1);
      table.datetimeTz('createdAt').notNull();
      table.index(['status', 'statusChangedAt']);
      table.unique(['orderRef']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('lifecycleExampleInvoices');
  },
});

export default migration;
