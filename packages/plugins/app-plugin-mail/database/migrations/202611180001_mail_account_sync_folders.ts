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
