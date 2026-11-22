// The passkey() schema in @better-auth/passkey 1.7.21, with credentialID stored as
// credentialId: an all-caps suffix does not survive the snake_case column names.
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202612010002_create_passkey',

  async up({ builder }) {
    await builder.createCollection('passkey', (collection) => {
      collection.string('id', { length: 64 }).notNull();
      collection.string('name', { length: 255 }).nullable();
      collection.text('publicKey').notNull();
      collection.string('userId', { length: 64 }).notNull();
      collection.string('credentialId', { length: 255 }).notNull();
      collection.integer('counter').notNull();
      collection.string('deviceType', { length: 32 }).notNull();
      collection.boolean('backedUp').notNull();
      collection.string('transports', { length: 255 }).nullable();
      collection.datetime('createdAt').nullable();
      collection.string('aaguid', { length: 64 }).nullable();

      collection.primary('id', { name: 'pk_passkey' });
      collection.index('userId', { name: 'idx_passkey_user' });
      collection.index('credentialId', { name: 'idx_passkey_credential' });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('passkey');
  },
});

export default migration;
