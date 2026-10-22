import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610230001_demo_mode_account_credentials',
  async up({ builder }) {
    await builder.alterCollection('demoModeAccounts', (collection) => {
      // Older accounts establish their snapshot on the next generation/reset.
      collection.string('passwordHash', { length: 128 });
    });
  },
  async down({ builder }) {
    await builder.alterCollection('demoModeAccounts', (collection) => {
      collection.dropField('passwordHash');
    });
  },
});

export default migration;
