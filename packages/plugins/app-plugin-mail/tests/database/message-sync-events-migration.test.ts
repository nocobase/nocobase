import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { createDatabaseMailStore } from '../../server/store.js';

describeMigration('202609270001_app_plugin_mail_create_message_sync_events', {
  sources: [
    {
      directory: resolve(import.meta.dirname, '../../database/migrations'),
      packageName: '@nocobase/app-plugin-mail',
    },
  ],
  before: async ({ database }) => {
    const store = createDatabaseMailStore(database);
    const accountId = randomUUID();
    await store.saveAccount({
      id: accountId,
      userId: 'legacy-owner',
      provider: { type: 'test', name: 'test' },
      address: 'legacy@example.test',
      credentialReference: 'test',
      scopes: [],
      status: 'active',
    });
    await store.saveMessage(accountId, {
      providerMessageId: 'before-events',
      providerFolderIds: [],
      to: [],
      cc: [],
      bcc: [],
      replyTo: [],
      references: [],
      subject: 'Already installed',
      read: false,
      starred: false,
      draft: false,
      attachments: [],
    });
  },
  up: async ({ expectCollection, connection }) => {
    expect(
      await expectCollection('mailMessageSyncEventStates').toExist(),
    ).toMatchObject({ primaryKey: ['accountId'] });
    expect(
      await expectCollection('mailMessageSyncEvents').toExist(),
    ).toMatchObject({
      primaryKey: ['id'],
      fields: {
        id: { type: 'uuid' },
        accountId: { type: 'uuid', nullable: false },
        ownerId: { type: 'string', nullable: false },
        syncRunId: { type: 'uuid', nullable: false },
        phase: { type: 'string', nullable: false },
        syncedAt: { type: 'datetimeTz', nullable: false },
      },
    });
    // Installing the new schema never fabricates events for pre-existing mail.
    expect(
      await connection.query
        .selectFrom('mailMessageSyncEvents')
        .selectAll()
        .execute(),
    ).toEqual([]);
    expect(
      await connection.query
        .selectFrom('mailMessageSyncEventStates')
        .selectAll()
        .execute(),
    ).toEqual([]);
    expect(
      await connection.query.selectFrom('mailMessages').select('id').execute(),
    ).toHaveLength(1);
    await expectCollection('mailMessageSyncEventStates').toHaveField(
      'lastSequence',
      { type: 'bigInt', nullable: false },
    );
    await expectCollection('mailMessageSyncEventStates').toHaveField(
      'lastSyncedAt',
      { type: 'datetimeTz', nullable: false },
    );
    await expectCollection('mailMessageSyncEventStates').toHaveForeignKey(
      ['accountId'],
      'mailAccounts',
      { onDelete: 'cascade' },
    );
    await expectCollection('mailMessageSyncEvents').toHaveField('sequence', {
      type: 'bigInt',
      nullable: false,
    });
    await expectCollection('mailMessageSyncEvents').toHaveField('messageIds', {
      type: 'json',
      nullable: false,
    });
    await expectCollection('mailMessageSyncEvents').toHaveIndex(
      ['accountId', 'sequence'],
      { unique: true },
    );
    await expectCollection('mailMessageSyncEvents').toHaveIndex([
      'accountId',
      'syncedAt',
      'sequence',
    ]);
    await expectCollection('mailMessageSyncEvents').toHaveForeignKey(
      ['accountId'],
      'mailAccounts',
      { onDelete: 'cascade' },
    );
    await expectCollection('mailMessageSyncEvents').not.toHaveForeignKey(
      ['syncRunId'],
      'mailSyncRuns',
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('mailMessageSyncEvents').not.toExist();
    await expectCollection('mailMessageSyncEventStates').not.toExist();
  },
});
