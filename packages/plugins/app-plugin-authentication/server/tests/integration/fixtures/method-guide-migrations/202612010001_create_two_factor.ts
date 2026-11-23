// The twoFactor() schema in better-auth 1.7.21.
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202612010001_create_two_factor',

  async up({ builder }) {
    await builder.alterCollection('user', (collection) => {
      collection.boolean('twoFactorEnabled').nullable().defaultTo(false);
    });
    await builder.createCollection('twoFactor', (collection) => {
      collection.string('id', { length: 64 }).notNull();
      collection.string('secret', { length: 255 }).notNull();
      collection.text('backupCodes').notNull();
      collection.string('userId', { length: 64 }).notNull();
      collection.boolean('verified').nullable().defaultTo(true);
      collection.integer('failedVerificationCount').nullable().defaultTo(0);
      collection.datetime('lockedUntil').nullable();

      collection.primary('id', { name: 'pk_two_factor' });
      collection.index('secret', { name: 'idx_two_factor_secret' });
      collection.index('userId', { name: 'idx_two_factor_user' });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('twoFactor');
    await builder.alterCollection('user', (collection) => {
      collection.dropField('twoFactorEnabled');
    });
  },
});

export default migration;
