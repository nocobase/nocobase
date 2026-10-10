import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202609270001_app_plugin_mail_create_message_sync_events',
  async up({ builder }) {
    await builder.createCollection(
      'mailMessageSyncEventStates',
      (collection) => {
        collection.uuid('accountId').primary();
        collection.bigInt('lastSequence', { nullable: false });
        collection.datetimeTz('lastSyncedAt', { nullable: false });
        collection
          .belongsTo('account', 'mailAccounts', { index: false })
          .targetKey('id')
          .foreignKey('accountId')
          .constraints(true)
          .onDelete('cascade');
      },
    );
    await builder.createCollection('mailMessageSyncEvents', (collection) => {
      collection.uuid('id').primary();
      collection.uuid('accountId', { nullable: false });
      collection.bigInt('sequence', { nullable: false });
      collection.string('ownerId', { length: 255, nullable: false });
      // A completed run may be removed without removing its event history.
      collection.uuid('syncRunId', { nullable: false });
      collection.string('phase', { length: 20, nullable: false });
      collection.datetimeTz('syncedAt', { nullable: false });
      collection.json('messageIds', { nullable: false });
      collection
        .belongsTo('account', 'mailAccounts', { index: false })
        .targetKey('id')
        .foreignKey('accountId')
        .constraints(true)
        .onDelete('cascade');
      collection.unique(['accountId', 'sequence'], {
        name: 'mail_msg_sync_events_sequence_uq',
      });
      collection.index(['accountId', 'syncedAt', 'sequence'], {
        name: 'mail_msg_sync_events_time_idx',
      });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('mailMessageSyncEvents');
    await builder.dropCollection('mailMessageSyncEventStates');
  },
});

export default migration;
