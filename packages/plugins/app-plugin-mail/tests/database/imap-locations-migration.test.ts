import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import {
  createDatabaseTest,
  describeMigration,
  inspectCollection,
} from '@nocobase/app-testing/server';
import type { DatabaseConnection, MigrationSource } from '@nocobase/db';
import { expect, vi } from 'vitest';

const name = '202610250001_mail_imap_message_locations';
const previous = '202610090001_mail_create_message_participants';
const sources: readonly MigrationSource[] = [
  {
    directory: resolve(import.meta.dirname, '../../database/migrations'),
    packageName: '@nocobase/app-plugin-mail',
  },
];
const now = '2026-10-12T00:00:00.000Z';

async function seedAccount(
  connection: DatabaseConnection,
  providerType = 'imap-smtp',
): Promise<string> {
  const id = randomUUID();
  await connection.query
    .insertInto('mailAccounts')
    .values({
      id,
      userId: id,
      providerType,
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
  const id = typeof values.id === 'string' ? values.id : randomUUID();
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
    // Empty accounts are preserved through up/down/reapply.
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

function locator(value: Record<string, unknown>): string {
  return `imap:${Buffer.from(JSON.stringify(value)).toString('base64url')}`;
}

test('upgrades populated legacy schema offline without changing business data', async ({
  database,
  connection,
}) => {
  const migrator = database.createMigrator({ sources });
  await migrator.upTo(previous);
  const accountId = await seedAccount(connection);
  const other = await seedAccount(connection);
  const gmail = await seedAccount(connection, 'gmail');
  const tuple = {
    folder: 'Archive/中文 & +',
    uidValidity: '4294967295',
    uid: 4294967295,
  };
  const ordinary = await seedMessage(connection, accountId, {
    providerMessageId: locator(tuple),
    read: true,
    starred: true,
    receivedAt: now,
    text: 'Complete body',
    html: '<p>Complete body</p>',
    note: 'Keep note',
    todo: true,
    attachments: JSON.stringify([
      { id: 'attachment', providerAttachmentId: 'old-attachment' },
    ]),
  });
  await seedMessage(connection, other, { providerMessageId: locator(tuple) });
  const remoteDraft = await seedMessage(connection, accountId, {
    providerMessageId: locator({ folder: 'Drafts', uidValidity: '1', uid: 1 }),
    draft: true,
  });
  const mirror = await seedMessage(connection, accountId, {
    providerMessageId: 'local-draft:mirror',
    providerDraftMessageId: locator({
      folder: 'Drafts',
      uidValidity: '1',
      uid: 2,
    }),
    draft: true,
  });
  const scheduled = await seedMessage(connection, accountId, {
    providerMessageId: 'local-draft:scheduled',
    providerDraftMessageId: locator({
      folder: 'Drafts',
      uidValidity: '1',
      uid: 3,
    }),
    draft: true,
    scheduledSubmissionId: randomUUID(),
    draftSource: 'authored locally',
  });
  await seedMessage(connection, accountId, {
    providerMessageId: 'local-draft:pure',
    draft: true,
  });
  await seedMessage(connection, accountId, {
    providerMessageId: 'local-draft:no-mirror',
    draft: true,
    scheduledSubmissionId: randomUUID(),
  });
  await seedMessage(connection, accountId); // SMTP accepted RFC ID has no remote tuple.
  await seedMessage(connection, gmail, { providerMessageId: locator(tuple) });
  // Exercise more than one bounded page, without relying on ID insertion order.
  for (let uid = 1; uid <= 105; uid++)
    await seedMessage(connection, accountId, {
      providerMessageId: locator({ folder: 'INBOX', uidValidity: '7', uid }),
    });
  await connection.query
    .insertInto('mailMessageFolders')
    .values({
      accountId,
      messageId: ordinary,
      providerFolderId: 'unrelated-folder-link',
    })
    .execute();
  await connection.query
    .insertInto('mailMessageParticipants')
    .values({
      accountId,
      messageId: ordinary,
      role: 'from',
      address: 'old@example.com',
      domain: 'example.com',
    })
    .execute();
  const labelId = randomUUID();
  await connection.query
    .insertInto('mailLabels')
    .values({
      id: labelId,
      ownerId: accountId,
      name: 'Keep label',
      createdAt: now,
      updatedAt: now,
    })
    .execute();
  await connection.query
    .insertInto('mailMessageLabels')
    .values({ messageId: ordinary, labelId })
    .execute();
  for (const [table, values] of Object.entries(businessRows))
    await connection.query
      .insertInto(table)
      .values(values(accountId))
      .execute();
  const before = await connection.query
    .selectFrom('mailMessages')
    .selectAll()
    .orderBy('id')
    .execute();
  const tables = [
    'mailAccounts',
    'mailMessageFolders',
    'mailMessageParticipants',
    'mailLabels',
    'mailMessageLabels',
    ...Object.keys(businessRows),
  ];
  const snapshots = [];
  for (const table of tables)
    snapshots.push(
      await connection.query.selectFrom(table).selectAll().execute(),
    );
  const network = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
    throw new Error('Migration must not access the network');
  });
  try {
    await migrator.latest();
    expect(network).not.toHaveBeenCalled();
  } finally {
    network.mockRestore();
  }
  const after = await connection.query
    .selectFrom('mailMessages')
    .selectAll()
    .orderBy('id')
    .execute();
  expect(
    after.map(
      ({
        imapIdSource: _source,
        providerDraftMessageIdSource: _mirror,
        imapOrphanRunId: _orphan,
        ...row
      }) => row,
    ),
  ).toEqual(before);
  for (const [index, table] of tables.entries())
    expect(
      await connection.query.selectFrom(table).selectAll().execute(),
    ).toEqual(snapshots[index]);
  const copies = await connection.query
    .selectFrom('mailMessageImapLocations')
    .selectAll()
    .execute();
  expect(copies).toHaveLength(110);
  const copy = copies.find((row) => row.messageId === ordinary)!;
  expect({
    ...copy,
    uid: Number(copy.uid),
    read: Boolean(copy.read),
    starred: Boolean(copy.starred),
  }).toMatchObject({
    accountId,
    providerFolderId: tuple.folder,
    uidValidity: tuple.uidValidity,
    uid: tuple.uid,
    status: 'valid',
    invalidationReason: null,
    read: true,
    starred: true,
    receivedAt: before.find((row) => row.id === ordinary)!.receivedAt,
  });
  for (const row of after) {
    expect(row.imapOrphanRunId).toBeNull();
    const hasCopy = copies.some((copy) => copy.messageId === row.id);
    expect(row.imapIdSource).toBe(
      hasCopy && row.id !== mirror && row.id !== scheduled ? 'locator' : null,
    );
    expect(row.providerDraftMessageIdSource).toBe(
      row.id === mirror || row.id === scheduled ? 'locator' : null,
    );
  }
  expect(copies.some((row) => row.messageId === remoteDraft)).toBe(true);
  // The original cascades were restored after SQLite's parent-table rebuild.
  await connection.query
    .deleteFrom('mailMessages')
    .where('id', '=', ordinary)
    .execute();
  for (const table of [
    'mailMessageFolders',
    'mailMessageLabels',
    'mailMessageParticipants',
    'mailMessageImapLocations',
  ])
    expect(
      await connection.query
        .selectFrom(table)
        .selectAll()
        .where('messageId', '=', ordinary)
        .execute(),
    ).toEqual([]);
});

for (const value of [
  { folder: 'INBOX', uid: 1 },
  { folder: 'INBOX', uidValidity: '0', uid: 1 },
  { folder: 'INBOX', uidValidity: '01', uid: 1 },
  { folder: 'INBOX', uidValidity: '4294967296', uid: 1 },
  { folder: 'INBOX', uidValidity: '1', uid: 0 },
  { folder: 'INBOX', uidValidity: '1', uid: 4294967296 },
  { folder: 'INBOX', uidValidity: '1', uid: 1.5 },
  { folder: '', uidValidity: '1', uid: 1 },
  { folder: 'INBOX\0', uidValidity: '1', uid: 1 },
  null,
]) {
  test(`rejects only an unsafe locator before DDL: ${JSON.stringify(value)}`, async ({
    database,
    connection,
  }) => {
    const migrator = database.createMigrator({ sources });
    await migrator.upTo(previous);
    const id = await seedMessage(connection, await seedAccount(connection), {
      providerMessageId: value ? locator(value) : 'imap:invalid!',
    });
    const before = await inspectCollection(connection, 'mailMessages');
    await expect(migrator.latest()).rejects.toThrow(
      `Cannot upgrade legacy IMAP message ${id}:`,
    );
    expect(await inspectCollection(connection, 'mailMessages')).toEqual(before);
    expect(
      await inspectCollection(connection, 'mailMessageImapLocations'),
    ).toBeUndefined();
    expect(
      await connection.query.selectFrom('mailMessages').select('id').execute(),
    ).toEqual([{ id }]);
  });
}

test('refuses competing UUIDs across batches for the same account tuple without merging them', async ({
  database,
  connection,
}) => {
  const migrator = database.createMigrator({ sources });
  await migrator.upTo(previous);
  const account = await seedAccount(connection);
  await seedMessage(connection, account, {
    id: '00000000-0000-4000-8000-000000000001',
    providerMessageId: locator({ folder: 'INBOX', uidValidity: '1', uid: 1 }),
  });
  const id = await seedMessage(connection, account, {
    id: 'ffffffff-ffff-4fff-bfff-ffffffffffff',
    providerMessageId: 'local-draft:conflict',
    providerDraftMessageId: locator({
      uid: 1,
      uidValidity: '1',
      folder: 'INBOX',
    }),
  });
  for (let uid = 2; uid <= 106; uid++)
    await seedMessage(connection, account, {
      providerMessageId: locator({ folder: 'INBOX', uidValidity: '1', uid }),
    });
  const before = await connection.query
    .selectFrom('mailMessages')
    .selectAll()
    .orderBy('id')
    .execute();
  await expect(migrator.latest()).rejects.toThrow(/tuple belongs to message/);
  expect(before.some((row) => row.id === id)).toBe(true);
  expect(
    await connection.query
      .selectFrom('mailMessages')
      .selectAll()
      .orderBy('id')
      .execute(),
  ).toEqual(before);
  expect(
    await inspectCollection(connection, 'mailMessageImapLocations'),
  ).toBeUndefined();
});

test('never truncates an identity exceeding the supported capacity', async ({
  database,
  connection,
}) => {
  const migrator = database.createMigrator({ sources });
  await migrator.upTo(previous);
  const accountId = await seedAccount(connection);
  const identity = locator({
    folder: 'x'.repeat(400),
    uidValidity: '1',
    uid: 1,
  });
  expect(identity.length).toBeGreaterThan(500);
  if (connection.dialect !== 'sqlite') {
    // These historical VARCHAR schemas enforce the bound before migration.
    await expect(
      seedMessage(connection, accountId, { providerMessageId: identity }),
    ).rejects.toThrow();
    return;
  }
  const id = await seedMessage(connection, accountId, {
    providerMessageId: identity,
  });
  await expect(migrator.latest()).rejects.toThrow(
    'locator exceeds identity capacity',
  );
  expect(
    await connection.query
      .selectFrom('mailMessages')
      .select('providerMessageId')
      .where('id', '=', id)
      .executeTakeFirst(),
  ).toEqual({ providerMessageId: identity });
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
    requestedBy: 'owner',
    scheduledAt: '2099-01-01T00:00:00.000Z',
    composeInput: JSON.stringify({
      accountId,
      idempotencyKey: 'key',
      to: [{ address: 'recipient@example.com' }],
      subject: 'Scheduled',
      text: 'Keep authored body',
      deliverySnapshot: {
        text: 'Keep delivery body',
        attachments: [{ providerAttachmentId: 'keep-snapshot-attachment' }],
      },
    }),
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
    test(`${action === 'up' ? 'preserves existing' : 'refuses destructive rollback for'} ${table} business data`, async ({
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
      if (action === 'up') {
        const rows = await connection.query
          .selectFrom(table)
          .selectAll()
          .execute();
        await migrator.latest();
        expect(
          await connection.query.selectFrom(table).selectAll().execute(),
        ).toEqual(rows);
        return;
      }
      await expect(migrator.rollback()).rejects.toThrow(
        `${table} contains data`,
      );
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
