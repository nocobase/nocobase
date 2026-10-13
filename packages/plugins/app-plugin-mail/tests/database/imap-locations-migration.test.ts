import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import {
  createDatabaseTest,
  describeMigration,
  inspectCollection,
} from '@nocobase/app-testing/server';
import type { DatabaseConnection, MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const name = '202610250001_mail_imap_message_locations';
const previous = '202610090001_mail_create_message_participants';
const sources: readonly MigrationSource[] = [
  {
    directory: resolve(import.meta.dirname, '../../database/migrations'),
    packageName: '@nocobase/app-plugin-mail',
  },
];
const now = '2026-10-12T00:00:00.000Z';

async function seedAccount(connection: DatabaseConnection): Promise<string> {
  const id = randomUUID();
  await connection.query
    .insertInto('mailAccounts')
    .values({
      id,
      userId: id,
      providerType: 'imap-smtp',
      providerName: 'imap',
      authorizationSubject: id,
      address: `${id}@example.com`,
      credentialReference: 'unused',
      scopes: '[]',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
    .execute();
  return id;
}

async function seedMessage(
  connection: DatabaseConnection,
  accountId: string,
  values: Record<string, unknown> = {},
): Promise<string> {
  const id = randomUUID();
  await connection.query
    .insertInto('mailMessages')
    .values({
      id,
      accountId,
      providerMessageId: `<${id}@example.com>`,
      recipients: JSON.stringify({ to: [], cc: [], bcc: [] }),
      replyTo: '[]',
      references: '[]',
      subject: 'Subject',
      attachments: '[]',
      sortAt: now,
      createdAt: now,
      updatedAt: now,
      ...values,
    })
    .execute();
  return id;
}

function location(
  accountId: string,
  messageId: string,
  uid: number,
  folder = 'INBOX',
): Record<string, unknown> {
  return {
    id: randomUUID(),
    accountId,
    messageId,
    providerFolderId: folder,
    uidValidity: '4294967295',
    uid,
    status: 'valid',
    read: false,
    starred: false,
    createdAt: now,
    updatedAt: now,
  };
}

let accounts: Record<string, unknown>[];
let previousMessageIdField: unknown;
describeMigration(name, {
  sources,
  before: async ({ connection }) => {
    previousMessageIdField = (
      await connection.collections.get('mailMessages')
    )?.fields?.find((field) => field.name === 'internetMessageId');
    // Accounts without messages may stay: only message data blocks the change.
    await seedAccount(connection);
    accounts = await connection.query
      .selectFrom('mailAccounts')
      .selectAll()
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    const locations = expectCollection('mailMessageImapLocations');
    const schema = await locations.toExist();
    expect(schema.primaryKey).toEqual(['id']);
    await locations.toHaveField('uid', { type: 'bigInt', nullable: false });
    await locations.toHaveField('uidValidity', {
      type: 'string',
      length: 10,
      nullable: false,
    });
    await locations.toHaveField('providerFolderId', {
      type: 'string',
      length: 500,
      nullable: false,
    });
    await locations.toHaveIndex(
      ['accountId', 'providerFolderId', 'uidValidity', 'uid'],
      { unique: true },
    );
    await locations.toHaveIndex(['accountId', 'messageId']);
    await locations.toHaveForeignKey(
      ['accountId', 'messageId'],
      'mailMessages',
      { referencedFields: ['accountId', 'id'], onDelete: 'cascade' },
    );
    expect(schema.foreignKeys).toHaveLength(1);
    const messages = expectCollection('mailMessages');
    await messages.toHaveIndex(['accountId', 'id'], { unique: true });
    await messages.toHaveField('internetMessageId', { type: 'text' });
    const metadata = await connection.collections.get('mailMessages');
    const field = metadata?.fields?.find(
      (field) => field.name === 'internetMessageId',
    );
    expect(field?.db?.nativeType?.toLowerCase()).toBe(
      connection.dialect === 'mysql' ? 'longtext' : 'text',
    );
    for (const field of [
      'imapIdSource',
      'providerDraftMessageIdSource',
      'imapOrphanRunId',
    ])
      await messages.toHaveField(field, { nullable: true });
    expect(
      await connection.query.selectFrom('mailAccounts').selectAll().execute(),
    ).toEqual(accounts);
  },
  down: async ({ connection, expectCollection }) => {
    await expectCollection('mailMessageImapLocations').not.toExist();
    const messages = expectCollection('mailMessages');
    await messages.toHaveField('internetMessageId', {
      type: 'string',
      length: 1000,
    });
    const metadata = await connection.collections.get('mailMessages');
    expect(
      metadata?.fields?.find((field) => field.name === 'internetMessageId'),
    ).toEqual(previousMessageIdField);
    await messages.not.toHaveField('imapIdSource');
    await messages.not.toHaveIndex(['accountId', 'id']);
  },
});

const test = createDatabaseTest();

test('refuses existing mail before changing any structure', async ({
  database,
  connection,
}) => {
  const migrator = database.createMigrator({ sources });
  await migrator.upTo(previous);
  await seedMessage(connection, await seedAccount(connection));
  const before = await inspectCollection(connection, 'mailMessages');
  await expect(migrator.latest()).rejects.toThrow('mailMessages contains data');
  expect(await inspectCollection(connection, 'mailMessages')).toEqual(before);
  expect(
    await inspectCollection(connection, 'mailMessageImapLocations'),
  ).toBeUndefined();
});

test('refuses to roll back while messages exist', async ({
  database,
  connection,
}) => {
  const migrator = database.createMigrator({ sources });
  await migrator.latest();
  await seedMessage(connection, await seedAccount(connection), {
    internetMessageId: `<${'x'.repeat(1200)}@example.com>`,
  });
  await expect(migrator.rollback()).rejects.toThrow('contains data');
  expect(
    await inspectCollection(connection, 'mailMessageImapLocations'),
  ).toBeDefined();
});

test('keeps copies account-scoped, unique per tuple and removed with their message', async ({
  database,
  connection,
}) => {
  await database.createMigrator({ sources }).latest();
  const accountId = await seedAccount(connection);
  const otherAccountId = await seedAccount(connection);
  const messageId = await seedMessage(connection, accountId, {
    // This exceeds MySQL TEXT's byte capacity and must use LONGTEXT.
    internetMessageId: `<${'m'.repeat(70000)}@example.com>`,
  });
  const stored = await connection.query
    .selectFrom('mailMessages')
    .select('internetMessageId')
    .where('id', '=', messageId)
    .executeTakeFirst<{ internetMessageId: string }>();
  expect(stored?.internetMessageId).toHaveLength(70014);

  // The full uint32 range fits, and one message may own several UIDs in a folder.
  await connection.query
    .insertInto('mailMessageImapLocations')
    .values([
      location(accountId, messageId, 4294967295),
      location(accountId, messageId, 1),
      location(accountId, messageId, 1, 'Archive'),
    ])
    .execute();
  const uids = await connection.query
    .selectFrom('mailMessageImapLocations')
    .select('uid')
    .where('messageId', '=', messageId)
    .orderBy('uid', 'desc')
    .execute<{ uid: number | string }>();
  expect(uids.map((row) => Number(row.uid))).toEqual([4294967295, 1, 1]);

  await expect(
    connection.query
      .insertInto('mailMessageImapLocations')
      .values(location(accountId, messageId, 1))
      .execute(),
  ).rejects.toThrow();
  // Another account cannot point a copy at this message.
  await expect(
    connection.query
      .insertInto('mailMessageImapLocations')
      .values(location(otherAccountId, messageId, 7))
      .execute(),
  ).rejects.toThrow();

  await connection.query
    .deleteFrom('mailMessages')
    .where('id', '=', messageId)
    .execute();
  expect(
    await connection.query
      .selectFrom('mailMessageImapLocations')
      .selectAll()
      .execute(),
  ).toEqual([]);
});

const businessRows: Record<
  string,
  (accountId: string) => Record<string, unknown>
> = {
  mailPushPending: (accountId) => ({
    accountId,
    requestToken: 'pending',
    requestedAt: now,
  }),
  mailAccountRemovals: (accountId) => ({
    accountId,
    failed: false,
    availableAt: now,
  }),
  mailDraftStates: (accountId) => ({
    id: randomUUID(),
    accountId,
    providerMessageId: 'closed-draft',
    closed: true,
  }),
  mailSubmissions: (accountId) => ({
    id: randomUUID(),
    accountId,
    idempotencyKey: 'key',
    requestFingerprint: 'fingerprint',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }),
  mailOutboundAttachments: () => ({
    id: randomUUID(),
    userId: 'owner',
    disk: 'local',
    key: 'key',
    fileName: 'test',
    contentType: 'text/plain',
    size: 1,
    createdAt: now,
    expiresAt: now,
  }),
  mailSyncStates: (accountId) => ({
    accountId,
    cursor: '{}',
    lastSyncedAt: now,
  }),
  mailSyncRuns: (accountId) => ({
    id: randomUUID(),
    accountId,
    requestedBy: 'owner',
    mode: 'initial',
    phase: 'preparing',
    status: 'queued',
    policy: '{}',
    createdAt: now,
    updatedAt: now,
  }),
  mailOutbox: () => ({
    id: randomUUID(),
    type: 'syncMailbox',
    aggregateId: randomUUID(),
    deduplicationKey: 'task',
    payload: '{}',
    status: 'pending',
    availableAt: now,
    createdAt: now,
  }),
};

for (const [table, values] of Object.entries(businessRows)) {
  for (const action of ['up', 'down'] as const) {
    test(`refuses ${action} before any structure or metadata change when only ${table} contains business data`, async ({
      database,
      connection,
    }) => {
      const migrator = database.createMigrator({ sources });
      if (action === 'up') await migrator.upTo(previous);
      else await migrator.latest();
      await connection.query
        .insertInto(table)
        .values(values(await seedAccount(connection)))
        .execute();
      const structure = await inspectCollection(connection, 'mailMessages');
      const metadata = await connection.collections.get('mailMessages');
      const locations = await inspectCollection(
        connection,
        'mailMessageImapLocations',
      );
      await expect(
        action === 'up' ? migrator.latest() : migrator.rollback(),
      ).rejects.toThrow(`${table} contains data`);
      expect(await inspectCollection(connection, 'mailMessages')).toEqual(
        structure,
      );
      expect(await connection.collections.get('mailMessages')).toEqual(
        metadata,
      );
      expect(
        await inspectCollection(connection, 'mailMessageImapLocations'),
      ).toEqual(locations);
    });
  }
}
