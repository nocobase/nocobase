import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Creates the `deviceCode` table Better Auth's `deviceAuthorization()` plugin reads and writes: a CLI's sign-in
 * through the browser (RFC 8628). The shape is the plugin's schema in better-auth 1.7.5, spelled out here so a later
 * release cannot change what this migration did; when that schema gains a field, add it in a new migration.
 *
 * `pollingInterval` is milliseconds. A row lives until its code is redeemed, denied or found expired.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610060001_create_device_code',

  async up({ builder }) {
    await builder.createCollection('deviceCode', (collection) => {
      collection.string('id', { length: 64 }).notNull();
      collection.string('deviceCode', { length: 191 }).notNull();
      collection.string('userCode', { length: 191 }).notNull();
      collection.string('userId', { length: 64 }).nullable();
      collection.datetime('expiresAt').notNull();
      collection.string('status', { length: 32 }).notNull();
      collection.datetime('lastPolledAt').nullable();
      collection.integer('pollingInterval').nullable();
      collection.string('clientId', { length: 255 }).nullable();
      collection.text('scope').nullable();

      collection.primary('id', { name: 'pk_device_code' });
      collection.unique('deviceCode', { name: 'uq_device_code_device_code' });
      collection.unique('userCode', { name: 'uq_device_code_user_code' });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('deviceCode');
  },
});

export default migration;
