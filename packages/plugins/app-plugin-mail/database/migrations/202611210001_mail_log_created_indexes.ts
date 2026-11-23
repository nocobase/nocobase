import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Every member's sync runs and submissions are listed newest first across all accounts, and finished ones are deleted
// after the retention period by creation time; the existing indexes all start with `accountId` or `status`.
const migration: MigrationDefinition = defineMigration({
  name: '202611210001_mail_log_created_indexes',
  async up({ builder }) {
    await builder.alterCollection('mailSyncRuns', (collection) => {
      collection.index(['createdAt', 'id'], {
        name: 'mail_sync_runs_created_id_idx',
      });
    });
    await builder.alterCollection('mailSubmissions', (collection) => {
      collection.index(['createdAt', 'id'], {
        name: 'mail_submissions_created_id_idx',
      });
    });
  },
  async down({ builder }) {
    await builder.dropIndex(
      'mailSubmissions',
      'mail_submissions_created_id_idx',
    );
    await builder.dropIndex('mailSyncRuns', 'mail_sync_runs_created_id_idx');
  },
});

export default migration;
