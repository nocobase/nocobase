import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import {
  InMemoryCollectionMetadataStore,
  type DatabaseManager,
} from '@nocobase/db';
import {
  describeMigration,
  inspectCollection,
} from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';

const COLLECTIONS = [
  'mailDraftStates',
  'mailCredentials',
  'mailOutboundAttachments',
  'mailTemplates',
  'mailAuthorizationStates',
  'mailAccounts',
  'mailAccountRemovals',
  'mailPushSubscriptions',
  'mailPushPending',
  'mailIdentities',
  'mailFolders',
  'mailMessages',
  'mailMessageFolders',
  'mailSyncStates',
  'mailSyncRuns',
  'mailSyncTombstones',
  'mailSubmissions',
  'mailOutbox',
  'mailSignatures',
  'mailLabels',
  'mailMessageLabels',
] as const;
const MIGRATIONS = [
  '202609030001_create_mail_tables',
  '202609200001_backfill_mail_conversations',
  '202609210001_normalize_mail_folders',
  '202609260001_add_mail_sync_retry_attempts',
] as const;
const sources = [
  {
    directory: resolve(process.cwd(), 'database/migrations'),
    packageName: '@nocobase/app-plugin-mail',
  },
];

for (const name of MIGRATIONS) {
  describeMigration(name, {
    sources,
    up: async ({ expectCollection }) => {
      await expectCollection('mailAccounts').toHaveField(
        'initialSyncReceivedAfter',
        { type: 'datetimeTz' },
      );
      await expectCollection('mailMessages').toHaveIndex(
        ['accountId', 'providerMessageId'],
        { unique: true },
      );
    },
  });
}

describe('mail database migration', () => {
  let database: DatabaseManager;
  let metadataStore: InMemoryCollectionMetadataStore;
  beforeEach(async () => {
    metadataStore = new InMemoryCollectionMetadataStore();
    database = await createMailTestDatabase({ migrate: false, metadataStore });
  });
  afterEach(async () => {
    await destroyMailTestDatabase(database);
  });

  it('creates the complete mail schema, indexes and metadata', async () => {
    expect((await migrateUp(database)).executed).toEqual(MIGRATIONS);
    const connection = database.connection();
    for (const name of COLLECTIONS)
      expect(await inspectCollection(connection, name)).toBeDefined();
    const accounts = await inspectCollection(connection, 'mailAccounts');
    expect(accounts?.fields).toMatchObject({
      initialSyncReceivedAfter: { type: 'datetimeTz' },
      automaticSyncIntervalMinutes: { type: 'integer', nullable: false },
    });
    expect(accounts?.fields.defaultForUserId).toBeUndefined();
    expect(
      (await metadataStore.get('mailAccounts'))?.document.fields
        .automaticSyncIntervalMinutes,
    ).toMatchObject({ type: 'integer' });
    const messages = await inspectCollection(connection, 'mailMessages');
    expect(messages?.fields).toMatchObject({
      contentStatus: { type: 'string', nullable: false },
      contentError: { type: 'string' },
      size: { type: 'integer' },
      note: { type: 'text' },
      todo: { type: 'boolean' },
      providerDraftMessageId: { type: 'string' },
      remoteDraftFingerprint: { type: 'string' },
      draftConflict: { type: 'json' },
      senderSearch: { type: 'text' },
      recipientsSearch: { type: 'text' },
      draftSource: { type: 'text' },
      scheduledSubmissionId: { type: 'string' },
    });
    expect(
      (await metadataStore.get('mailMessages'))?.document.fields.contentStatus,
    ).toMatchObject({ type: 'string' });
    const runs = await inspectCollection(connection, 'mailSyncRuns');
    expect(runs?.fields).toMatchObject({
      historyStartedAt: { type: 'datetimeTz' },
      historyComplete: { type: 'boolean', nullable: false },
      recovering: { type: 'boolean', nullable: false },
      pendingMessages: { type: 'integer', nullable: false },
    });
    const runFields = (await metadataStore.get('mailSyncRuns'))?.document
      .fields;
    expect(runFields?.historyComplete).toMatchObject({ type: 'boolean' });
    expect(runFields?.recovering).toMatchObject({ type: 'boolean' });
    expect(runFields?.pendingMessages).toMatchObject({ type: 'integer' });
    const indexes: readonly [string, readonly string[], boolean][] = [
      ['mailAccounts', ['providerType', 'providerName', 'address'], true],
      [
        'mailAccounts',
        ['providerType', 'providerName', 'authorizationSubject'],
        true,
      ],
      ['mailMessages', ['accountId', 'providerMessageId'], true],
      ['mailMessages', ['accountId', 'sortAt', 'id'], false],
      ['mailMessages', ['accountId', 'contentStatus'], false],
      ['mailMessages', ['accountId', 'todo', 'sortAt'], false],
      [
        'mailMessages',
        ['accountId', 'providerConversationId', 'sortAt', 'id'],
        false,
      ],
      ['mailMessages', ['accountId', 'read', 'sortAt', 'id'], false],
      ['mailMessages', ['accountId', 'starred', 'sortAt', 'id'], false],
      ['mailMessages', ['scheduledSubmissionId'], false],
      ['mailCredentials', ['expiresAt'], false],
      ['mailSignatures', ['accountId', 'name'], true],
      ['mailSignatures', ['identityId', 'name'], true],
      ['mailSignatures', ['defaultForAccountId'], true],
      ['mailSignatures', ['defaultForIdentityId'], true],
      ['mailSyncRuns', ['accountId', 'status'], false],
      ['mailSyncRuns', ['accountId', 'createdAt'], false],
      ['mailSyncRuns', ['status', 'updatedAt', 'id'], false],
      ['mailSubmissions', ['status', 'leaseExpiresAt'], false],
      ['mailSubmissions', ['accountId', 'createdAt'], false],
      ['mailLabels', ['ownerId', 'name'], true],
      ['mailMessageLabels', ['labelId', 'messageId'], false],
      ['mailOutbox', ['aggregateId'], false],
      ['mailAccountRemovals', ['availableAt'], false],
    ];
    for (const [name, fields, unique] of indexes) {
      expect(
        (await inspectCollection(connection, name))?.indexes,
      ).toContainEqual({ fields, unique });
    }
    expect(accounts?.indexes).not.toContainEqual({
      fields: ['defaultForUserId'],
      unique: true,
    });
    expect(
      await inspectCollection(connection, 'mailSyncTombstones'),
    ).toMatchObject({ primaryKey: ['runId', 'providerMessageId'] });
    const foreignKeys = [
      ['mailSyncTombstones', 'runId', 'mailSyncRuns'],
      ['mailMessageLabels', 'messageId', 'mailMessages'],
      ['mailMessageLabels', 'labelId', 'mailLabels'],
      ['mailSignatures', 'accountId', 'mailAccounts'],
      ['mailSignatures', 'identityId', 'mailIdentities'],
    ];
    for (const [name, field, target] of foreignKeys) {
      expect(
        (await inspectCollection(connection, name))?.foreignKeys,
      ).toContainEqual(
        expect.objectContaining({
          fields: [field],
          collection: target,
          onDelete: 'cascade',
        }),
      );
    }
    expect(
      (await inspectCollection(connection, 'mailAccountRemovals'))?.foreignKeys,
    ).toEqual([]);
    expect(
      (await inspectCollection(connection, 'mailAccountRemovals'))?.fields,
    ).toMatchObject({
      accountId: { type: 'uuid' },
      failed: { type: 'boolean' },
      availableAt: { type: 'datetimeTz' },
    });
    expect(
      (await inspectCollection(connection, 'mailLabels'))?.fields,
    ).toMatchObject({
      ownerId: { type: 'string' },
      name: { type: 'string' },
      color: { type: 'string' },
    });
  });

  it('applies database defaults when callers omit optional fields', async () => {
    await migrateUp(database);
    const accountId = randomUUID();
    const now = new Date().toISOString();
    await database
      .query()
      .insertInto('mailAccounts')
      .values({
        id: accountId,
        userId: 'user',
        providerType: 'test',
        providerName: 'test',
        address: 'sender@example.test',
        credentialReference: 'test',
        scopes: [],
        status: 'active',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await database
      .query()
      .insertInto('mailMessages')
      .values({
        id: randomUUID(),
        accountId,
        providerMessageId: 'message',
        recipients: [],
        replyTo: [],
        references: [],
        subject: 'Defaults',
        attachments: [],
        sortAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await database
      .query()
      .insertInto('mailSyncRuns')
      .values({
        id: randomUUID(),
        accountId,
        requestedBy: 'user',
        mode: 'full',
        phase: 'history',
        status: 'pending',
        policy: {},
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await database
      .query()
      .insertInto('mailDraftStates')
      .values({
        id: randomUUID(),
        accountId,
        providerMessageId: 'draft',
      })
      .execute();
    expect(
      await database
        .query()
        .selectFrom('mailAccounts')
        .selectAll()
        .executeTakeFirst(),
    ).toMatchObject({ automaticSyncIntervalMinutes: 5 });
    expect(
      await database
        .query()
        .selectFrom('mailMessages')
        .selectAll()
        .executeTakeFirst(),
    ).toMatchObject({
      contentStatus: 'complete',
      read: false,
      starred: false,
      draft: false,
      todo: false,
    });
    expect(
      await database
        .query()
        .selectFrom('mailSyncRuns')
        .selectAll()
        .executeTakeFirst(),
    ).toMatchObject({
      historyComplete: false,
      recovering: false,
      pendingMessages: 0,
    });
    expect(
      await database
        .query()
        .selectFrom('mailDraftStates')
        .selectAll()
        .executeTakeFirst(),
    ).toMatchObject({ revision: 0, closed: false });
  });

  it('creates, reverses and restores draft state constraints and metadata', async () => {
    const verify = async () => {
      const snapshot = await inspectCollection(
        database.connection(),
        'mailDraftStates',
      );
      expect(snapshot).toMatchObject({
        primaryKey: ['id'],
        fields: {
          accountId: { type: 'uuid', nullable: false },
          providerMessageId: { type: 'string', nullable: false },
          revision: { type: 'integer', nullable: false },
          closed: { type: 'boolean', nullable: false },
        },
      });
      expect(snapshot?.indexes).toContainEqual({
        fields: ['accountId', 'providerMessageId'],
        unique: true,
      });
      expect(snapshot?.foreignKeys).toContainEqual(
        expect.objectContaining({
          fields: ['accountId'],
          collection: 'mailAccounts',
          referencedFields: ['id'],
          onDelete: 'cascade',
        }),
      );
      const fields = (await metadataStore.get('mailDraftStates'))?.document
        .fields;
      expect(fields?.revision).toMatchObject({ type: 'integer' });
      expect(fields?.closed).toMatchObject({ type: 'boolean' });
    };
    await migrateUp(database);
    await verify();
    await migrateDown(database);
    expect(
      await inspectCollection(database.connection(), 'mailDraftStates'),
    ).toBeUndefined();
    expect(await metadataStore.get('mailDraftStates')).toBeUndefined();
    await migrateUp(database);
    await verify();
  });

  it('drops all Mail schema and metadata and reapplies exactly once', async () => {
    await migrateUp(database);
    await migrateDown(database);
    for (const name of COLLECTIONS) {
      expect(
        await inspectCollection(database.connection(), name),
      ).toBeUndefined();
      expect(await metadataStore.get(name)).toBeUndefined();
    }
    expect((await migrateUp(database)).executed).toEqual(MIGRATIONS);
    for (const name of COLLECTIONS)
      expect(
        await inspectCollection(database.connection(), name),
      ).toBeDefined();
    expect((await migrateUp(database)).executed).toEqual([]);
  });
});

async function migrateUp(database: DatabaseManager) {
  return database.createMigrator(sources[0]).latest();
}
async function migrateDown(database: DatabaseManager) {
  return database.createMigrator(sources[0]).rollback();
}
