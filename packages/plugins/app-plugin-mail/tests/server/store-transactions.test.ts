import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';

import { type DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createDatabaseMailStore } from '../../server/store.js';
import type { MailStore, NormalizedMailMessage } from '../../server/types.js';

const fixtureIds = {
  account: '30000000-0000-4000-8000-000000000001',
  syncRun: '30000000-0000-4000-8000-000000000002',
  submission: '30000000-0000-4000-8000-000000000003',
  identity: '30000000-0000-4000-8000-000000000004',
  outbox: '30000000-0000-4000-8000-000000000005',
  otherSubmission: '30000000-0000-4000-8000-000000000006',
};

describe('Mail persistence transaction ownership', () => {
  let database: DatabaseManager;
  let store: MailStore;

  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    await store.saveAccount({
      id: fixtureIds.account,
      userId: 'user-1',
      provider: { type: 'test', name: 'test' },
      address: 'sender@example.com',
      credentialReference: 'secret:test',
      scopes: [],
      status: 'active',
    });
  });

  afterEach(async () => {
    await destroyMailTestDatabase(database);
  });

  it.each(['lost lease', 'outbox conflict'] as const)(
    'rolls back mailbox changes and checkpoints after a %s',
    async (failure) => {
      await store.commitSyncBatch({
        accountId: fixtureIds.account,
        folders: [],
        messages: [message('existing', 'Original subject')],
        deletedProviderMessageIds: [],
        nextCursor: { value: 'original-cursor' },
      });
      const created = await store.createSyncRun({
        id: fixtureIds.syncRun,
        accountId: fixtureIds.account,
        requestedBy: 'user-1',
        mode: 'incremental',
        policy: { maxMessages: 100, batchSize: 20 },
      });
      const claimed = await store.claimSyncRun(
        created.id,
        0,
        'preparing',
        'current-lease',
        new Date(Date.now() + 60_000).toISOString(),
      );
      expect(claimed).toBeDefined();
      if (!claimed) throw new Error('Expected a claimed sync run.');

      if (failure === 'outbox conflict') {
        // Fail the final write, after message, run, and cursor updates.
        await insertConflictingOutbox(
          `sync:${fixtureIds.syncRun}:1:incremental`,
        );
      }
      const commit = store.commitSyncStep({
        run: {
          ...claimed,
          leaseToken:
            failure === 'lost lease' ? 'stale-lease' : 'current-lease',
        },
        folders: [
          {
            providerFolderId: 'new-folder',
            type: 'inbox',
            kind: 'folder',
            name: 'Inbox',
          },
        ],
        messages: [
          message('existing', 'Changed subject'),
          message('new', 'New mail'),
        ],
        phase: 'incremental',
        status: 'completed',
        changeCursor: { value: 'next-cursor' },
        createNextTask: true,
      });
      if (failure === 'lost lease') {
        await expect(commit).rejects.toThrow('lease was lost before commit');
      } else {
        await expect(commit).rejects.toThrow(/unique/i);
      }

      expect(await store.getSyncRun(created.id)).toEqual(claimed);
      expect(await store.getSyncCursor(fixtureIds.account)).toEqual({
        value: 'original-cursor',
      });
      expect(await store.listFolders(fixtureIds.account)).toEqual([]);
      const mailbox = await store.listMessages('user-1', {});
      expect(mailbox.items).toHaveLength(1);
      expect(mailbox.items[0]).toMatchObject({
        subject: 'Original subject',
        folderIds: ['original-folder'],
      });
    },
  );

  it('does not persist a scheduled submission when its outbox write fails', async () => {
    await insertConflictingOutbox(`scheduled-send:${fixtureIds.submission}`);
    const scheduledAt = new Date(Date.now() + 60_000).toISOString();
    await expect(
      store.createScheduledSubmission(
        {
          id: fixtureIds.submission,
          accountId: fixtureIds.account,
          status: 'pending',
          scheduledAt,
        },
        'send-once',
        'fingerprint',
        'user-1',
        {
          accountId: fixtureIds.account,
          identityId: fixtureIds.identity,
          idempotencyKey: 'send-once',
          to: [{ address: 'recipient@example.com' }],
          subject: 'Scheduled mail',
          text: 'Hello',
          scheduledAt,
        },
        { ...message('local-draft:scheduled', 'Scheduled mail'), draft: true },
      ),
    ).rejects.toThrow(/unique/i);
    expect(
      await store.getScheduledSubmission(fixtureIds.submission),
    ).toBeUndefined();
    expect(
      await store.getSubmissionByIdempotencyKey(
        fixtureIds.account,
        'send-once',
      ),
    ).toBeUndefined();
    expect(await store.listSubmissions('user-1')).toEqual([]);
    expect((await store.listAllMessages({})).items).toEqual([]);
  });

  async function insertConflictingOutbox(
    deduplicationKey: string,
  ): Promise<void> {
    const now = new Date().toISOString();
    await database
      .query()
      .insertInto('mailOutbox')
      .values({
        id: fixtureIds.outbox,
        type: 'sendScheduledMail',
        aggregateId: fixtureIds.otherSubmission,
        deduplicationKey,
        payload: JSON.stringify({
          version: 1,
          submissionId: fixtureIds.otherSubmission,
        }),
        status: 'pending',
        attempts: 0,
        availableAt: now,
        createdAt: now,
      })
      .execute();
  }
});

function message(
  providerMessageId: string,
  subject: string,
): NormalizedMailMessage {
  return {
    providerMessageId,
    providerFolderIds: ['original-folder'],
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    subject,
    read: false,
    starred: false,
    draft: false,
    attachments: [],
  };
}
