import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * System keys, their activity, and the rules for keys.
 *
 * - `apiKeySystemKeys`: one row per system key, keyed by its service account (`identityId`). Only accounts listed here
 *   are this plugin's system keys; other service accounts, such as an application's own, are never listed or changed.
 *   An imported key keeps what its import asked for, apart from the activity it brought along.
 * - `apiKeyEvents`: what was done to a system key, by whom (none for the system itself), with what changed.
 * - `apiKeyRules`: the one row of rules an administrator sets; without it the application's configuration applies.
 * - `apiKeyPrefixExemptions`: Permission Sets an application had named in the `system-key-` prefix before it was
 *   reserved, listed once by the upgrade's seed and never changed, so every process leaves the same ones alone.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202611210003_api_keys_system_keys',

  async up({ builder }) {
    await builder.createCollection('apiKeySystemKeys', (collection) => {
      collection.string('identityId', { length: 64 }).notNull();
      collection.string('keyId', { length: 64 }).notNull();
      collection.string('ownerId', { length: 64 }).nullable();
      collection.json('managedBy').nullable();
      collection.string('createdById', { length: 64 }).nullable();
      collection.datetime('remindedAt').nullable();
      // What an import asked for (`SystemApiKeys.adopt`), to tell a repeat of it from another; null for a key made here.
      collection.text('importRequest').nullable();
      collection.datetime('createdAt').notNull();
      collection.datetime('updatedAt').notNull();
      collection.primary('identityId', { name: 'pk_api_key_system_keys' });
      collection.index(['keyId'], { name: 'idx_api_key_system_keys_key' });
    });
    await builder.createCollection('apiKeyEvents', (collection) => {
      collection.string('id', { length: 64 }).notNull();
      collection.string('identityId', { length: 64 }).notNull();
      collection.string('action', { length: 32 }).notNull();
      collection.string('actorId', { length: 64 }).nullable();
      collection.json('details').nullable();
      collection.datetime('createdAt').notNull();
      collection.primary('id', { name: 'pk_api_key_events' });
      collection.index(['identityId', 'createdAt'], {
        name: 'idx_api_key_events_identity_created',
      });
    });
    await builder.createCollection('apiKeyRules', (collection) => {
      collection.string('id', { length: 32 }).notNull();
      collection.boolean('allowSameAsMe').nullable();
      collection.integer('personalMaxDays').nullable();
      collection.integer('personalDefaultDays').nullable();
      collection.integer('idleDisableDays').nullable();
      collection.datetime('idleSince').nullable();
      collection.string('updatedById', { length: 64 }).nullable();
      collection.datetime('updatedAt').notNull();
      collection.primary('id', { name: 'pk_api_key_rules' });
    });
    await builder.createCollection('apiKeyPrefixExemptions', (collection) => {
      collection.string('permissionSetKey', { length: 255 }).notNull();
      collection.datetime('createdAt').notNull();
      collection.primary('permissionSetKey', {
        name: 'pk_api_key_prefix_exemptions',
      });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('apiKeyPrefixExemptions');
    await builder.dropCollection('apiKeyRules');
    await builder.dropCollection('apiKeyEvents');
    await builder.dropCollection('apiKeySystemKeys');
  },
});

export default migration;
