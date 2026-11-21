import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * `apiKeyManagerNotices`: what a managed system key's manager has yet to be told — that an administrator disabled or
 * deleted the key — kept until the manager takes it, so a notice that fails is delivered again, even after the key is
 * gone.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202611210004_api_keys_manager_notices',

  async up({ builder }) {
    await builder.createCollection('apiKeyManagerNotices', (collection) => {
      collection.string('id', { length: 64 }).notNull();
      collection.string('identityId', { length: 64 }).notNull();
      collection.json('managedBy').notNull();
      collection.string('actorId', { length: 64 }).nullable();
      collection.string('how', { length: 16 }).notNull();
      collection.integer('attempts').notNull();
      collection.datetime('createdAt').notNull();
      collection.primary('id', { name: 'pk_api_key_manager_notices' });
      collection.index(['identityId', 'createdAt'], {
        name: 'idx_api_key_manager_notices_identity_created',
      });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('apiKeyManagerNotices');
  },
});

export default migration;
