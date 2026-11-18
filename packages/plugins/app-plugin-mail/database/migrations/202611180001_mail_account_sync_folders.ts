import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
  type QueryAdapter,
} from '@nocobase/db';

// Tables whose rows belong to an account. SQLite drops a column by rebuilding the table, and dropping the old
// `mailAccounts` table cascades into every one of them.
const ACCOUNT_TABLES = [
  'mailFolders',
  'mailMessages',
  'mailMessageFolders',
  'mailMessageLabels',
  'mailMessageParticipants',
  'mailMessageImapLocations',
  'mailLabels',
  'mailIdentities',
  'mailSignatures',
  'mailDraftStates',
  'mailSubmissions',
  'mailSyncStates',
  'mailSyncRuns',
  'mailSyncTombstones',
  'mailPushSubscriptions',
  'mailPushPending',
] as const;

async function assertNoAccountData(query: QueryAdapter): Promise<void> {
  for (const table of ACCOUNT_TABLES) {
    const rows = await query.selectFrom(table).selectAll().limit(1).execute();
    if (rows.length > 0)
      throw new Error(
        `Cannot remove Mail account sync folders while ${table} contains data. Rollback would lose mail business data.`,
      );
  }
}

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
  async down({ builder, query }: MigrationContext): Promise<void> {
    await assertNoAccountData(query);
    await builder.alterCollection('mailAuthorizationStates', (collection) => {
      collection.dropField('syncFolderIds');
    });
    await builder.alterCollection('mailAccounts', (collection) => {
      collection.dropField('syncFolderIds');
    });
  },
});

export default migration;
