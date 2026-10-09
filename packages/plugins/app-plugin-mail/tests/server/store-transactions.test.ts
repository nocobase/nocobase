import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';

import { type DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createDatabaseMailStore } from '../../server/store.js';
import type { MailStore, NormalizedMailMessage } from '../../server/types.js';

describe('Mail persistence transaction ownership', () => {
  let database: DatabaseManager;
  let store: MailStore;

  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    await store.saveAccount({
      id: 'account-1',
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
        accountId: 'account-1',
        folders: [],
        messages: [message('existing', 'Original subject')],
        deletedProviderMessageIds: [],
        nextCursor: { value: 'original-cursor' },
      });
      const created = await store.createSyncRun({
        id: 'sync-1',
        accountId: 'account-1',
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
        await insertConflictingOutbox('sync:sync-1:1:incremental');
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
      expect(await store.getSyncCursor('account-1')).toEqual({
        value: 'original-cursor',
      });
      expect(await store.listFolders('account-1')).toEqual([]);
      const mailbox = await store.listMessages('user-1', {});
      expect(mailbox.items).toHaveLength(1);
      expect(mailbox.items[0]).toMatchObject({
        subject: 'Original subject',
        folderIds: ['original-folder'],
      });
    },
  );

  it('does not persist a scheduled submission when its outbox write fails', async () => {
    await insertConflictingOutbox('scheduled-send:submission-1');
    const scheduledAt = new Date(Date.now() + 60_000).toISOString();
    await expect(
      store.createScheduledSubmission(
        {
          id: 'submission-1',
          accountId: 'account-1',
          status: 'pending',
          scheduledAt,
        },
        'send-once',
        'fingerprint',
        'user-1',
        {
          accountId: 'account-1',
          identityId: 'identity-1',
          idempotencyKey: 'send-once',
          to: [{ address: 'recipient@example.com' }],
          subject: 'Scheduled mail',
          text: 'Hello',
          scheduledAt,
        },
        { ...message('local-draft:scheduled', 'Scheduled mail'), draft: true },
      ),
    ).rejects.toThrow(/unique/i);
    expect(await store.getScheduledSubmission('submission-1')).toBeUndefined();
    expect(
      await store.getSubmissionByIdempotencyKey('account-1', 'send-once'),
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
        id: 'conflicting-outbox',
        type: 'sendScheduledMail',
        aggregateId: 'other-submission',
        deduplicationKey,
        payload: JSON.stringify({
          version: 1,
          submissionId: 'other-submission',
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
