import { randomUUID } from 'node:crypto';
import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
  type QueryAdapter,
} from '@nocobase/db';

// Rollback cannot discard mail business data or its location ownership.
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
        `Cannot ${action} IMAP message locations while ${table} contains data. Rollback would lose mail business data.`,
      );
  }
}

interface LegacyMessage {
  id: string;
  accountId: string;
  ownerId: string | null;
  providerType: string | null;
  providerMessageId: string;
  providerDraftMessageId: string | null;
  read: boolean;
  starred: boolean;
  receivedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface LegacyCopy {
  message: LegacyMessage;
  sourceField: 'imapIdSource' | 'providerDraftMessageIdSource';
  folder: string;
  uidValidity: string;
  uid: number;
}

function legacyCopy(message: LegacyMessage): LegacyCopy | undefined {
  const mirror = message.providerMessageId.startsWith('local-draft:');
  const identity = mirror
    ? message.providerDraftMessageId
    : message.providerMessageId;
  // SMTP accepted RFC IDs and local-only drafts have no recorded remote tuple.
  if (!identity?.startsWith('imap:')) return undefined;
  const fail = (reason: string): never => {
    throw new Error(
      `Cannot upgrade legacy IMAP message ${message.id}: ${reason}.`,
    );
  };
  if (!message.ownerId) fail('missing owning account');
  if (message.providerType !== 'imap-smtp') return undefined;
  if (identity.length > 500) fail('locator exceeds identity capacity');
  let parsed: Record<string, unknown>;
  try {
    const encoded = identity.slice(5);
    const bytes = Buffer.from(encoded, 'base64url');
    if (!encoded || bytes.toString('base64url') !== encoded)
      return fail('invalid locator encoding');
    if (!Buffer.from(bytes.toString('utf8'), 'utf8').equals(bytes))
      return fail('invalid locator encoding');
    const value: unknown = JSON.parse(bytes.toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return fail('invalid locator object');
    parsed = value as Record<string, unknown>;
  } catch {
    return fail('invalid locator encoding');
  }
  const { folder, uidValidity, uid } = parsed;
  if (
    typeof folder !== 'string' ||
    !folder.length ||
    folder.length > 500 ||
    folder.includes('\0')
  )
    return fail('invalid folder path');
  if (
    typeof uidValidity !== 'string' ||
    !/^[1-9]\d{0,9}$/.test(uidValidity) ||
    BigInt(uidValidity) > 4294967295n
  )
    return fail('invalid UIDVALIDITY');
  if (
    typeof uid !== 'number' ||
    !Number.isSafeInteger(uid) ||
    uid < 1 ||
    uid > 4294967295
  )
    return fail('invalid UID');
  return {
    message,
    sourceField: mirror ? 'providerDraftMessageIdSource' : 'imapIdSource',
    folder,
    uidValidity,
    uid,
  };
}

/** Two bounded scans: preflight before DDL, then copy only recorded local facts. */
async function legacyCopies(
  query: QueryAdapter,
  visit: (copies: readonly LegacyCopy[]) => Promise<void>,
): Promise<void> {
  let last: Pick<LegacyMessage, 'accountId' | 'id'> | undefined;
  for (;;) {
    let selection = query
      .selectFrom('mailMessages')
      .leftJoin('mailAccounts', 'mailAccounts.id', 'mailMessages.accountId')
      .select([
        'mailMessages.id',
        'mailMessages.accountId',
        'mailAccounts.id as ownerId',
        'mailAccounts.providerType',
        'mailMessages.providerMessageId',
        'mailMessages.providerDraftMessageId',
        'mailMessages.read',
        'mailMessages.starred',
        'mailMessages.receivedAt',
        'mailMessages.createdAt',
        'mailMessages.updatedAt',
      ])
      .orderBy('mailMessages.accountId')
      .orderBy('mailMessages.id')
      .limit(100);
    if (last) {
      const cursor = last;
      selection = selection.where((builder) =>
        builder.or([
          builder('mailMessages.accountId', '>', cursor.accountId),
          builder.and([
            builder('mailMessages.accountId', '=', cursor.accountId),
            builder('mailMessages.id', '>', cursor.id),
          ]),
        ]),
      );
    }
    const rows = await selection.execute<LegacyMessage>();
    if (!rows.length) return;
    await visit(
      rows.flatMap((row) => {
        const copy = legacyCopy(row);
        return copy ? [copy] : [];
      }),
    );
    last = rows.at(-1)!;
  }
}

const migration: MigrationDefinition = defineMigration({
  name: '202610250001_mail_imap_message_locations',
  async up({ builder, query, connection }: MigrationContext): Promise<void> {
    let accountId: string | undefined;
    const owners = new Map<string, string>();
    await legacyCopies(query, async (copies) => {
      for (const copy of copies) {
        if (accountId !== copy.message.accountId) {
          owners.clear();
          accountId = copy.message.accountId;
        }
        const tuple = JSON.stringify([copy.folder, copy.uidValidity, copy.uid]);
        const owner = owners.get(tuple);
        if (owner && owner !== copy.message.id)
          throw new Error(
            `Cannot upgrade legacy IMAP message ${copy.message.id}: tuple belongs to message ${owner}.`,
          );
        owners.set(tuple, copy.message.id);
      }
    });
    // SQLite rebuilds a table when changing its column type. Detach only the
    // incoming Mail foreign keys so that dropping that table cannot cascade.
    // The migration transaction restores both schema and data on any failure.
    const incoming = [
      [
        'mailMessageFolders',
        'fk_mail_message_folders_message_id_mail_messages',
        'messageId',
        'mailMessages',
      ],
      [
        'mailMessageLabels',
        'fk_mail_message_labels_message_id_mail_messages',
        'messageId',
        'mailMessages',
      ],
      // Restore both label constraints in their original order as well.
      [
        'mailMessageLabels',
        'fk_mail_message_labels_label_id_mail_labels',
        'labelId',
        'mailLabels',
      ],
      [
        'mailMessageParticipants',
        'fk_mail_message_participants_message_id_mail_messages',
        'messageId',
        'mailMessages',
      ],
    ] as const;
    const detach =
      connection.dialect === 'sqlite' &&
      (await query.selectFrom('mailMessages').select('id').limit(1).execute())
        .length > 0;
    if (detach) {
      for (const [table, name] of incoming) {
        await builder.alterCollection(table, (collection) =>
          collection.dropConstraint(name),
        );
      }
    }
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
    if (detach) {
      for (const [table, name, field, target] of incoming) {
        await builder.alterCollection(table, (collection) =>
          collection.foreignKey(field, {
            name,
            references: { collection: target, fields: ['id'] },
            onDelete: 'cascade',
          }),
        );
      }
    }
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
    const now = new Date().toISOString();
    await legacyCopies(query, async (copies) => {
      if (!copies.length) return;
      await query
        .insertInto('mailMessageImapLocations')
        .values(
          copies.map((copy) => ({
            id: randomUUID(),
            accountId: copy.message.accountId,
            messageId: copy.message.id,
            providerFolderId: copy.folder,
            uidValidity: copy.uidValidity,
            uid: copy.uid,
            status: 'valid',
            invalidationReason: null,
            read: copy.message.read,
            starred: copy.message.starred,
            receivedAt: copy.message.receivedAt,
            createdAt: copy.message.createdAt ?? now,
            updatedAt: copy.message.updatedAt ?? now,
          })),
        )
        .execute();
      for (const field of [
        'imapIdSource',
        'providerDraftMessageIdSource',
      ] as const) {
        const ids = copies
          .filter((copy) => copy.sourceField === field)
          .map((copy) => copy.message.id);
        if (ids.length)
          await query
            .updateTable('mailMessages')
            .set({ [field]: 'locator' })
            .where('id', 'in', ids)
            .execute();
      }
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
