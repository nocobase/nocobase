import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202611020002_create_mutation_receipts',
  async up({ builder }) {
    await builder.createCollection('mutationReceipts', (collection) => {
      collection.string('id', { length: 64 }).notNull();
      collection.string('digest', { length: 64 }).notNull();
      collection.json('result').nullable();
      collection.datetime('expiresAt').notNull();
      collection.primary('id', { name: 'pk_mutation_receipts' });
      collection.index('expiresAt', { name: 'ix_mutation_receipts_expiry' });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('mutationReceipts');
  },
});
export default migration;
