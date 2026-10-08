import { testDatabaseDialect } from '@nocobase/app-testing/server';
import { createMailRuntime } from '../../server/runtime.js';
import { createDatabaseMailCredentialVault } from '../../server/credentials.js';
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseManager } from '@nocobase/db';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import { createDatabaseMailStore } from '../../server/store.js';
import { toMessageRow } from '../../server/store/mappers.js';
import { MailAccountRemovals } from '../../server/runtime/account-removals.js';
import { DefaultMailService } from '../../server/service.js';
import type { MailStore } from '../../server/contracts/persistence.js';
import type { MailAccount, NormalizedMailMessage } from '../../shared/mail.js';
import type { MailProviderAdapterResolver } from '../../server/contracts/provider.js';
import { InlineJobExecutor } from '../helpers/inline-job-executor.js';

const account: MailAccount = {
  id: 'account',
  userId: 'owner',
  address: 'owner@example.com',
  provider: { type: 'test', name: 'test' },
  credentialReference: 'secret',
  scopes: [],
  status: 'active',
};
const message: NormalizedMailMessage = {
  providerMessageId: 'remote',
  providerFolderIds: [],
  to: [],
  cc: [],
  bcc: [],
  replyTo: [],
  references: [],
  subject: 'Test',
  read: false,
  starred: false,
  draft: false,
  attachments: [],
};
const adapters: MailProviderAdapterResolver = {
  resolve: async () => {
    throw new Error('Provider must not be called.');
  },
};

describe('durable bounded account removal', () => {
  let database: DatabaseManager;
  let store: MailStore;
  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    await store.saveAccount(account);
  });
  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    await destroyMailTestDatabase(database);
  });

  async function count(table: string): Promise<number> {
    const result = await database
      .query()
      .selectFrom(table)
      .select(({ fn }) => [fn.countAll().as('count')])
      .executeTakeFirst<{ count: number }>();
    return Number(result?.count ?? 0);
  }
  async function drain(worker: MailAccountRemovals): Promise<void> {
    for (
      let index = 0;
      index < 100 && (await store.getAccount(account.id));
      index++
    )
      await worker.runBatch();
    expect(await store.getAccount(account.id)).toBeUndefined();
  }

  it('accepts removal without deleting messages or waiting for the provider', async () => {
    await store.saveMessage(account.id, message);
    const kick = vi.fn();
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick },
    });
    await service.removeAccount({ actorId: account.userId }, account.id);
    expect(await count('mailMessages')).toBe(1);
    expect(await count('mailAccountRemovals')).toBe(1);
    expect(await store.getAccount(account.id)).toMatchObject({
      status: 'removing',
    });
    expect(kick).toHaveBeenCalledOnce();
    await service.removeAccount({ actorId: account.userId }, account.id);
    expect(await count('mailAccountRemovals')).toBe(1);
    await expect(
      service.updateAccount(
        { actorId: account.userId },
        { accountId: account.id, status: 'suspended' },
      ),
    ).rejects.toThrow('removed');
    await expect(
      service.removeAccount({ actorId: 'another-user' }, account.id),
    ).rejects.toThrow('not found');
  });

  it('bounds every message batch, releases its transaction, resumes after restart and isolates other accounts', async () => {
    const other = { ...account, id: 'other', address: 'other@example.com' };
    await store.saveAccount(other);
    await store.saveMessage(other.id, message);
    const now = new Date().toISOString();
    for (let offset = 0; offset < 1201; offset += 20) {
      const rows = Array.from(
        { length: Math.min(20, 1201 - offset) },
        (_, index) =>
          toMessageRow(
            account.id,
            { ...message, providerMessageId: String(offset + index) },
            randomUUID(),
            now,
            now,
          ),
      );
      await database.query().insertInto('mailMessages').values(rows).execute();
    }
    await store.markAccountRemoving(account.id, account.userId);
    let worker = new MailAccountRemovals({ store, adapters });
    await worker.runBatch();
    expect(await count('mailMessages')).toBe(702);
    // A different store/runtime can continue solely from committed database state.
    store = createDatabaseMailStore(database);
    worker = new MailAccountRemovals({ store, adapters });
    await worker.runBatch();
    expect(await count('mailMessages')).toBe(202);
    await drain(worker);
    expect(await count('mailMessages')).toBe(1);
    expect(await store.getAccount(other.id)).toMatchObject({
      status: 'active',
    });
    expect(await count('mailAccountRemovals')).toBe(0);
  });

  it('bounds child associations and outbox history before deleting their parents', async () => {
    const saved = await store.saveMessage(account.id, message);
    const second = await store.saveMessage(account.id, {
      ...message,
      providerMessageId: 'second',
    });
    for (let offset = 0; offset < 1001; offset += 100) {
      await database
        .query()
        .insertInto('mailMessageFolders')
        .values(
          Array.from({ length: Math.min(100, 1001 - offset) }, (_, index) => ({
            accountId: account.id,
            messageId: index % 2 === 0 ? saved.id : second.id,
            providerFolderId: `folder-${offset + index}`,
          })),
        )
        .execute();
    }
    const run = await store.createSyncRun({
      id: 'run',
      accountId: account.id,
      requestedBy: account.userId,
      mode: 'initial',
      policy: { batchSize: 10, maxMessages: 100 },
    });
    const now = new Date().toISOString();
    for (let offset = 0; offset < 1001; offset += 50) {
      const size = Math.min(50, 1001 - offset);
      await database
        .query()
        .insertInto('mailSyncTombstones')
        .values(
          Array.from({ length: size }, (_, index) => ({
            runId: run.id,
            providerMessageId: `deleted-${offset + index}`,
          })),
        )
        .execute();
      await database
        .query()
        .insertInto('mailOutbox')
        .values(
          Array.from({ length: size }, (_, index) => ({
            id: randomUUID(),
            type: 'syncMailbox',
            aggregateId: run.id,
            deduplicationKey: `extra-${offset + index}`,
            payload: '{}',
            status: 'published',
            attempts: 0,
            availableAt: now,
            createdAt: now,
          })),
        )
        .execute();
    }
    await store.markAccountRemoving(account.id, account.userId);
    const worker = new MailAccountRemovals({ store, adapters });
    const client = await database.connection().client<{
      on(
        event: 'query',
        listener: (query: { sql: string; bindings: unknown[] }) => void,
      ): void;
      off(
        event: 'query',
        listener: (query: { sql: string; bindings: unknown[] }) => void,
      ): void;
      raw(sql: string, bindings: unknown[]): Promise<{ detail: string }[]>;
    }>();
    let selection: { sql: string; bindings: unknown[] } | undefined;
    const capture = (query: { sql: string; bindings: unknown[] }) => {
      if (
        query.sql.startsWith('select') &&
        query.sql.includes('mail_message_folders')
      )
        selection = query;
    };
    client.on('query', capture);
    try {
      await worker.runBatch();
    } finally {
      client.off('query', capture);
    }
    expect(selection).toBeDefined();
    if (testDatabaseDialect() === 'sqlite') {
      const plan = await client.raw(
        `EXPLAIN QUERY PLAN ${selection!.sql}`,
        selection!.bindings,
      );
      expect(plan.map((row) => row.detail).join('\n')).toContain(
        'mail_message_folders_account_folder_idx',
      );
      expect(plan.map((row) => row.detail).join('\n')).not.toContain(
        'TEMP B-TREE',
      );
    }
    expect(await count('mailMessageFolders')).toBe(501);
    expect(await count('mailMessages')).toBe(2);
    for (
      let index = 0;
      index < 30 && (await store.getAccount(account.id));
      index++
    ) {
      const before = await Promise.all(
        [
          'mailMessageFolders',
          'mailMessages',
          'mailSyncTombstones',
          'mailOutbox',
        ].map(count),
      );
      await worker.runBatch();
      const after = await Promise.all(
        [
          'mailMessageFolders',
          'mailMessages',
          'mailSyncTombstones',
          'mailOutbox',
        ].map(count),
      );
      expect(
        before.reduce((sum, value, idx) => sum + value - after[idx], 0),
      ).toBeLessThanOrEqual(500);
    }
    expect(await store.getAccount(account.id)).toBeUndefined();
    expect(await count('mailOutbox')).toBe(0);
    expect(await count('mailSyncTombstones')).toBe(0);
  });

  it('fences expired workers and recovers an abandoned lease', async () => {
    await store.saveMessage(account.id, message);
    await store.markAccountRemoving(account.id, account.userId);
    const first = (await store.claimAccountRemoval())!;
    expect(first).toBeDefined();
    expect(await store.claimAccountRemoval()).toBeUndefined();
    await database
      .query()
      .updateTable('mailAccountRemovals')
      .set({ leaseExpiresAt: '2000-01-01T00:00:00.000Z' })
      .where('accountId', '=', account.id)
      .execute();
    const second = (await store.claimAccountRemoval())!;
    expect(second.leaseToken).not.toBe(first.leaseToken);
    expect(await store.deleteAccountBatch(first)).toBe(false);
    expect(await store.finishAccountRemoval(first)).toBe(false);
    await store.releaseAccountRemoval(first, true);
    expect(await store.claimAccountRemoval()).toBeUndefined();
    expect(await count('mailMessages')).toBe(1);
    await store.releaseAccountRemoval(second, false);
    await drain(new MailAccountRemovals({ store, adapters }));
  });

  it('records cleanup failure, backs off, and retries successfully without reactivating the account', async () => {
    await store.markAccountRemoving(account.id, account.userId);
    const failure = vi
      .spyOn(store, 'deleteAccountBatch')
      .mockRejectedValueOnce(new Error('database unavailable'));
    const worker = new MailAccountRemovals({ store, adapters });
    await worker.runBatch();
    expect(await store.listAccounts(account.userId)).toEqual([
      expect.objectContaining({ status: 'removing', removalFailed: true }),
    ]);
    expect(await store.claimAccountRemoval()).toBeUndefined();
    failure.mockRestore();
    await database
      .query()
      .updateTable('mailAccountRemovals')
      .set({ availableAt: '2000-01-01T00:00:00.000Z' })
      .where('accountId', '=', account.id)
      .execute();
    await drain(worker);
  });

  it('rejects late writes and reauthorization throughout removal', async () => {
    await store.replaceIdentities(account.id, [
      {
        id: 'identity',
        accountId: account.id,
        address: account.address,
        isPrimary: true,
        canSend: true,
      },
    ]);
    await store.createSubmission(
      { id: 'pending', accountId: account.id, status: 'pending' },
      'pending',
      'fingerprint',
    );
    await store.markAccountRemoving(account.id, account.userId);
    await expect(
      store.updateIdentity('identity', { displayName: 'late edit' }),
    ).rejects.toThrow('removed');
    expect(
      await store.claimSubmission(
        'pending',
        'lease',
        new Date(Date.now() + 60000).toISOString(),
      ),
    ).toBe(false);
    await expect(store.saveMessage(account.id, message)).rejects.toThrow(
      'removed',
    );
    await expect(
      store.commitSyncBatch({
        accountId: account.id,
        folders: [],
        messages: [message],
        deletedProviderMessageIds: [],
        nextCursor: { value: 'late' },
      }),
    ).rejects.toThrow('removed');
    await expect(
      store.createSubmission(
        { id: 'late', accountId: account.id, status: 'pending' },
        'key',
        'fingerprint',
      ),
    ).rejects.toThrow('removed');
    await expect(
      store.saveAuthorizedAccount(account, [], [], true),
    ).rejects.toThrow('removed');
    await expect(
      store.updateAccountStatus(account.id, 'active'),
    ).rejects.toThrow('removed');
    await drain(new MailAccountRemovals({ store, adapters }));
    await expect(
      store.saveAuthorizedAccount(account, [], [], true),
    ).rejects.toThrow('removed');
    await expect(
      store.updateAccountStatus(account.id, 'active'),
    ).rejects.toThrow('removed');
    expect(await store.getAccount(account.id)).toBeUndefined();
  });

  it('rolls back a deleted batch when its transaction fails, then resumes', async () => {
    const now = new Date().toISOString();
    for (let offset = 0; offset < 201; offset += 20) {
      await database
        .query()
        .insertInto('mailMessages')
        .values(
          Array.from({ length: Math.min(20, 201 - offset) }, (_, index) => {
            const id = `message-${String(offset + index).padStart(3, '0')}`;
            return toMessageRow(
              account.id,
              { ...message, providerMessageId: id },
              id,
              now,
              now,
            );
          }),
        )
        .execute();
    }
    await store.markAccountRemoving(account.id, account.userId);
    const task = (await store.claimAccountRemoval())!;
    const transaction = database.transaction.bind(database);
    const failure = vi
      .spyOn(database, 'transaction')
      .mockImplementationOnce((callback) =>
        transaction(async (context) => {
          await callback(context);
          throw new Error('injected deletion failure');
        }),
      );
    await expect(store.deleteAccountBatch(task)).rejects.toThrow(
      'injected deletion failure',
    );
    expect(await count('mailMessages')).toBe(201);
    failure.mockRestore();
    await store.releaseAccountRemoval(task, false);
    await drain(new MailAccountRemovals({ store, adapters }));
  });

  it('does not enqueue refresh or recreate mail when an in-flight send finishes after removal', async () => {
    const submission = await store.createSubmission(
      { id: 'sending', accountId: account.id, status: 'pending' },
      'key',
      'fingerprint',
    );
    await store.claimSubmission(
      submission.id,
      'sender',
      new Date(Date.now() + 120000).toISOString(),
    );
    await store.markAccountRemoving(account.id, account.userId);
    const accepted = {
      ...submission,
      status: 'accepted' as const,
      providerMessageId: 'sent',
    };
    expect(await store.finishSubmission(accepted, 'sender')).toMatchObject({
      status: 'accepted',
    });
    expect(await count('mailOutbox')).toBe(0);
    await drain(new MailAccountRemovals({ store, adapters }));
    expect(await store.finishSubmission(accepted, 'sender')).toMatchObject({
      status: 'accepted',
    });
    expect(await count('mailSubmissions')).toBe(0);
    expect(await count('mailOutbox')).toBe(0);
  });

  it('automatically resumes durable work when a runtime starts', async () => {
    await store.saveMessage(account.id, message);
    await store.markAccountRemoving(account.id, account.userId);
    const executor = await InlineJobExecutor.ready();
    const runtime = createMailRuntime({
      store,
      adapters,
      executor,
      relayIntervalMs: 10,
    });
    try {
      await runtime.start();
      await vi.waitFor(async () => {
        expect(await store.getAccount(account.id)).toBeUndefined();
      });
      expect(await count('mailAccountRemovals')).toBe(0);
    } finally {
      await runtime.close();
      await executor.shutdown();
    }
  });

  it('renews ownership during slow external cleanup and retries credential failures', async () => {
    await store.markAccountRemoving(account.id, account.userId);
    const credentials = createDatabaseMailCredentialVault(database);
    const entered = Promise.withResolvers<void>();
    const gate = Promise.withResolvers<void>();
    const deletion = vi
      .spyOn(credentials, 'delete')
      .mockImplementationOnce(async () => {
        entered.resolve();
        await gate.promise;
      });
    const worker = new MailAccountRemovals({ store, adapters, credentials });
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    const running = worker.runBatch();
    await entered.promise;
    await vi.advanceTimersByTimeAsync(61_000);
    expect(await store.claimAccountRemoval()).toBeUndefined();
    gate.reject(new Error('vault unavailable'));
    await running;
    expect(await store.getAccount(account.id)).toMatchObject({
      status: 'removing',
    });
    expect(await store.listAccounts(account.userId)).toEqual([
      expect.objectContaining({ removalFailed: true }),
    ]);
    await vi.advanceTimersByTimeAsync(30_001);
    deletion.mockRestore();
    await drain(worker);
  });
});
