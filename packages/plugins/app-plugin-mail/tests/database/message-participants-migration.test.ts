import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import {
  createDatabaseTest,
  describeMigration,
  inspectCollection,
} from '@nocobase/app-testing/server';
import type { DatabaseConnection, MigrationSource } from '@nocobase/db';
import { expect, vi } from 'vitest';
import { normalizeMailParticipantAddress } from '../../shared/participant.js';
import { collectMessageParticipants } from '../../server/store/message-participants.js';

const name = '202610090001_mail_create_message_participants';
const sources: readonly MigrationSource[] = [
  {
    directory: resolve(import.meta.dirname, '../../database/migrations'),
    packageName: '@nocobase/app-plugin-mail',
  },
];
const previous = '202609260001_add_mail_sync_retry_attempts';
const accountId = randomUUID();
const otherAccountId = randomUUID();
const now = '2026-10-01T00:00:00.000Z';

function messageRow(
  id: string,
  sender: unknown,
  recipients: unknown,
  owner: string = accountId,
): Record<string, unknown> {
  return {
    id,
    accountId: owner,
    providerMessageId: id,
    sender: JSON.stringify(sender),
    recipients: JSON.stringify(recipients),
    replyTo: JSON.stringify([{ address: 'reply-only@example.com' }]),
    references: '[]',
    subject: 'Original',
    text: 'Unchanged body',
    attachments: '[]',
    sortAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

async function seedAccounts(connection: DatabaseConnection): Promise<void> {
  for (const id of [accountId, otherAccountId]) {
    await connection.query
      .insertInto('mailAccounts')
      .values({
        id,
        userId: id,
        providerType: 'test',
        providerName: 'test',
        authorizationSubject: id,
        address: `${id}@example.com`,
        credentialReference: 'unused',
        scopes: '[]',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  }
}

let originals: Record<string, unknown>[];
let expected: Record<string, unknown>[];
describeMigration(name, {
  sources,
  before: async ({ connection }) => {
    await seedAccounts(connection);
    expected = [];
    // Cross the keyset page boundary; each message keeps its own IMAP-copy index.
    for (let i = 0; i < 105; i += 1) {
      const id = randomUUID();
      const owner = i % 2 ? accountId : otherAccountId;
      const address = `person${i}@example.com`;
      await connection.query
        .insertInto('mailMessages')
        .values(
          messageRow(
            id,
            { address: ` Person${i}@EXAMPLE.COM `, name: 'Ignored' },
            {
              to: [{ address }, { address: address.toUpperCase() }],
              cc: [{ address }],
              bcc: [{ address: 'bcc-only@example.com' }],
            },
            owner,
          ),
        )
        .execute();
      for (const role of ['from', 'to', 'cc'])
        expected.push({
          messageId: id,
          accountId: owner,
          role,
          address,
          domain: 'example.com',
        });
    }
    const cases: unknown[] = [
      ' Alice+tag@EXAMPLE.COM ',
      'dots.name@example.com',
      "a'b@example.com",
      'alice@sub.example.com',
      'alice@notexample.com',
      'alice@example.com.evil',
      'bad',
      'a@@example.com',
      'a..b@example.com',
      'a@-bad.com',
      'a@bad-.com',
      'a@localhost',
      '"quoted"@example.com',
      'a@例子.com',
      `${'x'.repeat(65)}@example.com`,
      `${'x'.repeat(321)}@example.com`,
      null,
      12,
      'bad\nheader@example.com',
      'a@bad..com',
    ];
    const id = randomUUID();
    await connection.query
      .insertInto('mailMessages')
      .values(
        messageRow(id, null, {
          to: cases.map((address) => ({ address })),
          cc: [],
          bcc: [],
        }),
      )
      .execute();
    for (const address of cases) {
      const valid = normalizeMailParticipantAddress(address);
      if (valid)
        expected.push({ messageId: id, accountId, role: 'to', ...valid });
    }
    // JSON scalars, arrays and malformed embedded JSON are valid stored JSON,
    // but are not valid structured sender/recipient values on any dialect.
    for (const [sender, recipients] of [
      [null, {}],
      ['{', []],
      [false, { to: 'not-an-array', cc: [{ address: 'valid@example.com' }] }],
    ] as const) {
      const malformedId = randomUUID();
      await connection.query
        .insertInto('mailMessages')
        .values(messageRow(malformedId, sender, recipients))
        .execute();
      if (
        typeof recipients === 'object' &&
        !Array.isArray(recipients) &&
        'cc' in recipients
      )
        expected.push({
          messageId: malformedId,
          accountId,
          role: 'cc',
          address: 'valid@example.com',
          domain: 'example.com',
        });
    }
    const largeId = randomUUID();
    const many = Array.from({ length: 1205 }, (_, i) => ({
      address: `group${i}@example.com`,
    }));
    await connection.query
      .insertInto('mailMessages')
      .values(messageRow(largeId, null, { to: many, cc: [], bcc: [] }))
      .execute();
    for (const { address } of many)
      expected.push({
        messageId: largeId,
        accountId,
        role: 'to',
        address,
        domain: 'example.com',
      });
    originals = await connection.query
      .selectFrom('mailMessages')
      .selectAll()
      .orderBy('id')
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    const collection = expectCollection('mailMessageParticipants');
    const schema = await collection.toExist();
    expect(schema.primaryKey).toEqual(['messageId', 'role', 'address']);
    await collection.toHaveField('address', {
      type: 'string',
      length: 320,
      nullable: false,
    });
    await collection.toHaveField('domain', {
      type: 'string',
      length: 253,
      nullable: false,
    });
    await collection.toHaveField('role', {
      type: 'string',
      length: 4,
      nullable: false,
    });
    await collection.toHaveField('messageId', {
      type: 'uuid',
      nullable: false,
    });
    await collection.toHaveField('accountId', {
      type: 'uuid',
      nullable: false,
    });
    await collection.toHaveIndex(['accountId', 'address', 'messageId']);
    await collection.toHaveIndex(['accountId', 'domain', 'messageId']);
    await collection.toHaveForeignKey(['messageId'], 'mailMessages', {
      referencedFields: ['id'],
      onDelete: 'cascade',
    });
    expect(schema.foreignKeys).toHaveLength(1);
    const rows = await connection.query
      .selectFrom('mailMessageParticipants')
      .selectAll()
      .execute();
    const sort = (values: Record<string, unknown>[]) =>
      values.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    // Select a fixed projection, independent of driver object-key ordering.
    const project = (row: Record<string, unknown>) => ({
      messageId: row.messageId,
      accountId: row.accountId,
      role: row.role,
      address: row.address,
      domain: row.domain,
    });
    expect(sort(rows.map(project))).toEqual(sort(expected.map(project)));
    const runtimeRows = originals.flatMap(
      (row) =>
        collectMessageParticipants({
          id: row.id as string,
          accountId: row.accountId as string,
          sender: row.sender,
          recipients: row.recipients,
        }).rows,
    );
    expect(sort(runtimeRows.map(project))).toEqual(sort(expected.map(project)));
    expect(
      await connection.query
        .selectFrom('mailMessages')
        .selectAll()
        .orderBy('id')
        .execute(),
    ).toEqual(originals);
  },
  down: async ({ connection, expectCollection }) => {
    await expectCollection('mailMessageParticipants').not.toExist();
    expect(
      await connection.query
        .selectFrom('mailMessages')
        .selectAll()
        .orderBy('id')
        .execute(),
    ).toEqual(originals);
  },
});

const test = createDatabaseTest();
test('cleans up a failed partial backfill and succeeds on retry without modifying source rows', async ({
  database,
  connection,
}) => {
  const migrator = database.createMigrator({ sources });
  await migrator.upTo(previous);
  await seedAccounts(connection);
  const id = randomUUID();
  await connection.query
    .insertInto('mailMessages')
    .values(
      messageRow(id, null, {
        to: Array.from({ length: 201 }, (_, i) => ({
          address: `retry${i}@example.com`,
        })),
        cc: [],
        bcc: [],
      }),
    )
    .execute();
  const before = await connection.query
    .selectFrom('mailMessages')
    .selectAll()
    .execute();
  const failing = database.createMigrator({
    directory: resolve(
      import.meta.dirname,
      '../fixtures/participant-failure-migration',
    ),
    packageName: '@nocobase/app-plugin-mail',
    tableName: '__nocobase_participant_failure',
    lockTableName: '__nocobase_participant_failure_lock',
  });
  await expect(failing.latest()).rejects.toThrow(
    'Injected participant insert failure',
  );
  expect(
    await inspectCollection(connection, 'mailMessageParticipants'),
  ).toBeUndefined();
  expect(
    await connection.query.selectFrom('mailMessages').selectAll().execute(),
  ).toEqual(before);
  const result = await migrator.latest();
  expect(result.executed).toEqual([name]);
  expect(
    await connection.query
      .selectFrom('mailMessageParticipants')
      .selectAll()
      .execute(),
  ).toHaveLength(201);
  expect((await migrator.latest()).executed).toEqual([]);
  expect(
    await connection.query.selectFrom('mailMessages').selectAll().execute(),
  ).toEqual(before);
});

test('fresh installation enforces uniqueness and cascades on message deletion', async ({
  database,
  connection,
}) => {
  await database.createMigrator({ sources }).latest();
  await seedAccounts(connection);
  const id = randomUUID();
  await connection.query
    .insertInto('mailMessages')
    .values(messageRow(id, null, {}))
    .execute();
  const row = {
    messageId: id,
    accountId,
    role: 'to',
    address: 'x@example.com',
    domain: 'example.com',
  };
  await connection.query
    .insertInto('mailMessageParticipants')
    .values(row)
    .execute();
  await expect(
    connection.query
      .insertInto('mailMessageParticipants')
      .values(row)
      .execute(),
  ).rejects.toThrow();
  await connection.query
    .deleteFrom('mailMessages')
    .where('id', '=', id)
    .execute();
  expect(
    await connection.query
      .selectFrom('mailMessageParticipants')
      .selectAll()
      .execute(),
  ).toEqual([]);
});
test('preserves full-width keys and distinct ASCII punctuation under the database collation', async ({
  database,
  connection,
}) => {
  await database.createMigrator({ sources }).latest();
  await seedAccounts(connection);
  const id = randomUUID();
  await connection.query
    .insertInto('mailMessages')
    .values(messageRow(id, null, {}))
    .execute();
  const addresses = [
    "a'b@example.com",
    'a_b@example.com',
    'a-b@example.com',
    'a+b@example.com',
    'a%b@example.com',
    'a.b@example.com',
    'ab@example.com',
    'x'.repeat(320),
  ];
  for (const address of addresses) {
    await connection.query
      .insertInto('mailMessageParticipants')
      .values({
        messageId: id,
        accountId,
        role: 'to',
        address,
        domain: 'd'.repeat(253),
      })
      .execute();
  }
  for (const address of addresses) {
    const rows = await connection.query
      .selectFrom('mailMessageParticipants')
      .selectAll()
      .where('accountId', '=', accountId)
      .where('address', '=', address)
      .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.address).toBe(address);
    expect(rows[0]?.domain).toHaveLength(253);
  }
});

test('backfill diagnostics disclose only aggregate counts', async ({
  database,
  connection,
}) => {
  const migrator = database.createMigrator({ sources });
  await migrator.upTo(previous);
  await seedAccounts(connection);
  await connection.query
    .insertInto('mailMessages')
    .values(
      messageRow(
        randomUUID(),
        { address: 'secret-invalid' },
        { to: [{ address: 'ok@example.com' }], cc: [] },
      ),
    )
    .execute();
  const warning = vi.spyOn(process, 'emitWarning').mockImplementation(() => {});
  try {
    await migrator.latest();
    expect(warning).toHaveBeenCalledWith(
      'Mail participant backfill skipped 1 invalid addresses and 0 malformed values.',
      { code: 'MAIL_PARTICIPANT_BACKFILL_SKIPPED' },
    );
    expect(JSON.stringify(warning.mock.calls)).not.toContain('secret-invalid');
    expect(JSON.stringify(warning.mock.calls)).not.toContain('ok@example.com');
  } finally {
    warning.mockRestore();
  }
});
