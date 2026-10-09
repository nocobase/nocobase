import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202609260001_add_mail_sync_retry_attempts',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('mailSyncRuns', (collection) => {
      collection.integer('retryAttempts', { nullable: false, defaultValue: 0 });
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('mailSyncRuns', (collection) => {
      collection.dropField('retryAttempts');
    });
  },
});

export default migration;
