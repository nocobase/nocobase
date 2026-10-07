import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * The `deviceCode` table an application creates when it enables `deviceAuthorization()`, as the templates' own
 * migration does; the plugin owns no table of a Better Auth plugin the application chooses.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610060001_test_create_device_code',

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
