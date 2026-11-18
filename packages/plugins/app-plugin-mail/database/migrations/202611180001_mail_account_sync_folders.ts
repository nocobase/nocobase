import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

// `null` synchronizes every folder; a list names the Provider folders an account synchronizes.
const migration: MigrationDefinition = defineMigration({
  name: '202611180001_mail_account_sync_folders',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('mailAccounts', (collection) => {
      collection.json('syncFolderIds');
    });
    await builder.alterCollection('mailAuthorizationStates', (collection) => {
      collection.json('syncFolderIds');
    });
  },
  // On SQLite, dropping a column rebuilds `mailAccounts`, which cascades into account-owned tables; that data
  // loss on rollback is accepted.
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('mailAuthorizationStates', (collection) => {
      collection.dropField('syncFolderIds');
    });
    await builder.alterCollection('mailAccounts', (collection) => {
      collection.dropField('syncFolderIds');
    });
  },
});

export default migration;
