import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
  type QueryAdapter,
} from '@nocobase/db';

// IMAP message identities change shape here; existing mail is never converted.
const MESSAGE_TABLES = [
  'mailMessages',
  'mailMessageFolders',
  'mailMessageLabels',
  'mailMessageParticipants',
  'mailSyncTombstones',
  'mailDraftStates',
  'mailSubmissions',
  'mailOutboundAttachments',
  'mailSyncStates',
  'mailSyncRuns',
  'mailOutbox',
  'mailPushPending',
  'mailAccountRemovals',
] as const;

async function assertNoMessages(
  query: QueryAdapter,
  action: string,
): Promise<void> {
  for (const table of MESSAGE_TABLES) {
    const row = await query.selectFrom(table).selectAll().limit(1).execute();
    if (row.length > 0)
      throw new Error(
        `Cannot ${action} IMAP message locations while ${table} contains data. This migration supports only a new mail store without mail business data.`,
      );
  }
}

const migration: MigrationDefinition = defineMigration({
  name: '202610250001_mail_imap_message_locations',
  async up({ builder, query, connection }: MigrationContext): Promise<void> {
    // Refuse before any structural change, so a rejected run leaves no trace.
    await assertNoMessages(query, 'add');
    await builder.alterCollection('mailMessages', (collection) => {
      collection.string('imapIdSource', { length: 20 });
      collection.string('providerDraftMessageIdSource', { length: 20 });
      collection.uuid('imapOrphanRunId');
      // A complete RFC Message-ID header can exceed the previous 1000 characters.
      collection.alterField('internetMessageId', {
        type: 'text',
        db: connection.dialect === 'mysql' ? { nativeType: 'longtext' } : {},
      });
      // Target of the locations' account-scoped foreign key.
      collection.unique(['accountId', 'id'], {
        name: 'mail_messages_account_id_unique',
      });
    });
    await builder.createCollection('mailMessageImapLocations', (collection) => {
      collection.uuid('id').primary();
      collection.uuid('accountId', { nullable: false });
      collection.uuid('messageId', { nullable: false });
      collection.string('providerFolderId', { length: 500, nullable: false });
      // Canonical decimal UIDVALIDITY, 1 to 4294967295.
      collection.string('uidValidity', { length: 10, nullable: false });
      // Signed 64-bit holds every uint32 UID on every dialect.
      collection.bigInt('uid', { nullable: false });
      collection.string('status', { length: 10, nullable: false });
      collection.string('invalidationReason', { length: 40 });
      collection.boolean('read', { nullable: false, defaultValue: false });
      collection.boolean('starred', { nullable: false, defaultValue: false });
      collection.datetimeTz('receivedAt');
      collection.datetimeTz('createdAt', { nullable: false });
      collection.datetimeTz('updatedAt', { nullable: false });
      collection.unique(
        ['accountId', 'providerFolderId', 'uidValidity', 'uid'],
        {
          name: 'mail_imap_locations_tuple_unique',
        },
      );
      collection.index(['accountId', 'messageId'], {
        name: 'mail_imap_locations_message_idx',
      });
      // One cascade path only: the owning message already belongs to the account.
      collection.foreignKey(['accountId', 'messageId'], {
        name: 'mail_imap_locations_message_fk',
        references: {
          collection: 'mailMessages',
          fields: ['accountId', 'id'],
        },
        onDelete: 'cascade',
      });
    });
  },
  async down({ builder, query }: MigrationContext): Promise<void> {
    // Restoring the 1000-character Message-ID column must not cut stored values.
    await assertNoMessages(query, 'remove');
    if (
      (
        await query
          .selectFrom('mailMessageImapLocations')
          .selectAll()
          .limit(1)
          .execute()
      ).length
    )
      throw new Error(
        'Cannot remove IMAP message locations while location business data exists.',
      );
    await builder.dropCollection('mailMessageImapLocations');
    await builder.alterCollection('mailMessages', (collection) => {
      collection.dropConstraint('mail_messages_account_id_unique');
      collection.alterField('internetMessageId', {
        type: 'string',
        length: 1000,
        db: {},
      });
      collection.dropFields(
        'imapIdSource',
        'providerDraftMessageIdSource',
        'imapOrphanRunId',
      );
    });
  },
});

export default migration;
