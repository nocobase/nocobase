import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610270001_recovery_loans',
  async up({ builder }) {
    await builder.createCollection('recoveryLoans', (c) => {
      c.string('id', { length: 64 }).notNull();
      c.primary('id');
      c.string('name', { length: 100 }).notNull();
      c.string('status', { length: 16 }).notNull();
      c.string('costCenter', { length: 32 }).notNull();
      c.string('approvalState', { length: 32 }).notNull();
      c.boolean('protected').notNull();
      c.boolean('deleted').notNull();
      c.integer('deleteEvents').notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('recoveryLoans');
  },
});
