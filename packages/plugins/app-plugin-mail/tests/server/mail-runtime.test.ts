import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import { MailAccountRemovals } from '../../server/runtime/account-removals.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';

import { type DatabaseManager } from '@nocobase/db';
import { createJobExecutorService, Job } from '@nocobase/jobs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createDatabaseMailCredentialVault } from '../../server/credentials.js';
import { responseError } from '../../server/adapters/gmail/http.js';
import { SendMailOperation } from '../../server/operations/send-mail.js';
import { SyncMailboxOperation } from '../../server/operations/sync-mailbox.js';
import { createMailProviderRegistry } from '../../server/registry.js';
import {
  createMailRuntime,
  isAutomaticSyncDue,
  type MailRuntime,
} from '../../server/runtime.js';
import { DefaultMailService } from '../../server/service.js';
import { createDatabaseMailStore } from '../../server/store.js';
import { MAIL_LOCAL_DRAFT_FOLDER_ID } from '../../server/types.js';
import type {
  MailAccount,
  MailCredentialVault,
  MailProviderConfig,
  MailProviderAdapter,
  MailProviderAdapterResolver,
  MailProviderDefinition,
  MailStore,
  NormalizedMailMessage,
} from '../../server/types.js';
import { InlineJobExecutor } from '../helpers/inline-job-executor.js';

describe('[SRV][DATA] mail runtime, synchronization, sending, and consistency', () => {
  let database: DatabaseManager;
  let store: MailStore;
  let executor: InlineJobExecutor | undefined;
  let runtime: MailRuntime | undefined;

  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    await store.saveAccount(account());
    await store.replaceIdentities('account-1', [
      {
        id: 'identity-1',
        accountId: 'account-1',
        address: 'sender@example.com',
        isPrimary: true,
        canSend: true,
      },
    ]);
  });

  async function drainRemoval(
    accountId: string,
    options: Partial<import('../../server/runtime.js').MailRuntimeOptions> = {},
  ): Promise<void> {
    const remover = new MailAccountRemovals({
      store,
      adapters: resolver(baseAdapter()),
      ...options,
    });
    for (
      let index = 0;
      index < 30 && (await store.getAccount(accountId));
      index++
    )
      await remover.runBatch();
    expect(await store.getAccount(accountId)).toBeUndefined();
  }

  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    await runtime?.close();
    await executor?.shutdown();
    await destroyMailTestDatabase(database);
  });

  it.each(['personal', 'management'] as const)(
    'deletes local drafts through %s without sending local IDs to a Provider',
    async (scope) => {
      const removeRemote = vi.fn<
        NonNullable<MailProviderAdapter['deleteMessage']>
      >(async () => ({
        ok: false,
        error: {
          code: 'OFFLINE',
          category: 'network',
          message: 'offline',
          retryable: true,
        },
      }));
      const close = vi.fn(async () => undefined);
      const adapter = resolver({
        ...baseAdapter(),
        deleteMessage: removeRemote,
        close,
      });
      const resolve = vi.spyOn(adapter, 'resolve');
      const service = new DefaultMailService({
        store,
        adapters: adapter,
        outbox: { kick: vi.fn() },
      });
      for (const remote of [undefined, 'remote-draft']) {
        const draft = await store.saveMessage('account-1', {
          ...message(`local-draft:${remote ?? 'only-local'}`, 'Draft'),
          draft: true,
          providerDraftMessageId: remote,
          providerFolderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID],
        });
        if (scope === 'personal')
          await service.deleteMessage(
            { actorId: 'user-1' },
            { accountId: 'account-1', messageId: draft.id },
          );
        else
          expect(
            await service.manageMessages(
              { actorId: 'admin' },
              {
                action: 'delete',
                items: [{ accountId: 'account-1', messageId: draft.id }],
              },
            ),
          ).toMatchObject({ succeeded: 1, failed: 0 });
        expect(
          await store.getMessageForAccount('account-1', draft.id),
        ).toBeUndefined();
      }
      expect(resolve).toHaveBeenCalledTimes(1);
      expect(removeRemote).toHaveBeenCalledExactlyOnceWith(
        'remote-draft',
        true,
        undefined,
      );
      expect(close).toHaveBeenCalledOnce();
    },
  );

  it.each(['persisting', 'activating'] as const)(
    'drains push work while %s before closing the runtime',
    async (phase) => {
      executor = await InlineJobExecutor.ready();
      runtime = createMailRuntime({
        store,
        adapters: resolver(baseAdapter()),
        executor,
      });
      const entered = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      if (phase === 'persisting') {
        const original = store.markPushSyncPendingBatch.bind(store);
        vi.spyOn(store, 'markPushSyncPendingBatch').mockImplementationOnce(
          async (...args) => {
            entered.resolve();
            await release.promise;
            await original(...args);
          },
        );
      } else {
        const original = store.getAccount.bind(store);
        vi.spyOn(store, 'getAccount').mockImplementationOnce(
          async (...args) => {
            entered.resolve();
            await release.promise;
            return original(...args);
          },
        );
      }
      const scheduled = runtime.schedulePushSyncBatch([account()]);
      await entered.promise;
      let closed = false;
      const closing = runtime.close().then(() => {
        closed = true;
      });
      await Promise.resolve();
      expect(closed).toBe(false);
      release.resolve();
      await scheduled;
      await closing;
      expect(closed).toBe(true);
      const getAccount = vi.spyOn(store, 'getAccount');
      getAccount.mockClear();
      expect(await runtime.schedulePushSync('account-1')).toBe(false);
      expect(await runtime.createAutomaticSyncRuns()).toBe(0);
      await runtime.publishPending();
      expect(getAccount).not.toHaveBeenCalled();
    },
  );

  it.each(['accepted', 'failed', 'submission_unknown'] as const)(
    'consumes drafts for %s and rejects late autosaves with the same key',
    async (status) => {
      const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(async () =>
        status === 'accepted'
          ? { status, providerMessageId: 'sent' }
          : {
              status,
              error: {
                code: 'TEST',
                category: 'network',
                message: 'Result unavailable',
                retryable: false,
              },
            },
      );
      const service = new DefaultMailService({
        store,
        adapters: resolver({ ...baseAdapter(), sendMessage }),
      });
      const input = {
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [{ address: 'recipient@example.com' }],
        subject: 'Latest',
        text: 'Latest body',
        draftKey: 'stable-compose-key',
        idempotencyKey: 'send-once',
      };
      const result = await service.sendMessage({ actorId: 'user-1' }, input);
      expect(result.status).toBe(
        status === 'submission_unknown' ? 'unknown' : status,
      );
      await expect(
        service.saveDraft(
          { actorId: 'user-1' },
          {
            ...input,
            idempotencyKey: 'save-late',
            draftRevision: 1,
            text: 'Old autosave',
          },
        ),
      ).rejects.toThrow(/not found/);
      expect(
        (
          await store.listMessages('user-1', {
            folderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID],
          })
        ).items,
      ).toEqual([]);
      expect(
        (await store.getScheduledSubmission(result.id))?.input,
      ).toMatchObject({ subject: 'Latest', text: 'Latest body' });
      await service.sendMessage({ actorId: 'user-1' }, input);
      expect(sendMessage).toHaveBeenCalledTimes(1);
    },
  );

  it('keeps increasing revisions across reopening and cannot resurrect a deleted draft', async () => {
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
    });
    const input = {
      accountId: 'account-1',
      identityId: 'identity-1',
      to: [],
      subject: 'Draft',
      text: 'First',
      draftKey: 'revision-key',
      idempotencyKey: 'revision-key',
    };
    const first = await service.saveDraft(
      { actorId: 'user-1' },
      { ...input, draftRevision: 1 },
    );
    const latest = await service.saveDraft(
      { actorId: 'user-1' },
      { ...input, draftMessageId: first.id, draftRevision: 3, text: 'Latest' },
    );
    expect(latest.draftRevision).toBe(3);
    await expect(
      service.saveDraft(
        { actorId: 'user-1' },
        { ...input, draftRevision: 2, text: 'Stale' },
      ),
    ).rejects.toThrow(/revision is outdated/);
    await expect(
      service.saveDraft(
        { actorId: 'user-1' },
        {
          ...input,
          draftMessageId: first.id,
          draftRevision: 3,
          text: 'Same revision with other edits',
        },
      ),
    ).rejects.toThrow(/revision is outdated/);
    expect(
      (await store.getMessage('user-1', 'account-1', first.id))?.text,
    ).toBe('Latest');
    await store.deleteMessage('account-1', first.id);
    await expect(
      service.saveDraft({ actorId: 'user-1' }, { ...input, draftRevision: 4 }),
    ).rejects.toThrow(/not found/);
    expect(
      (
        await store.listMessages('user-1', {
          folderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID],
        })
      ).items,
    ).toEqual([]);
  });

  it('excludes suspended mail before pagination and counting while retaining management access', async () => {
    await store.saveAccount({
      ...account(),
      id: 'paused',
      address: 'paused@example.com',
    });
    const visible = await store.saveMessage(
      'account-1',
      message('visible', 'Visible mail'),
    );
    const hidden = await store.saveMessage('paused', {
      ...message('hidden', 'Paused mail'),
      receivedAt: '2026-09-04T00:00:00.000Z',
    });
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
      outbox: { kick: vi.fn() },
    });
    await service.updateAccount(
      { actorId: 'user-1' },
      { accountId: 'paused', status: 'suspended' },
    );
    const page = await store.listMessages('user-1', {
      limit: 1,
      withTotal: true,
    });
    expect(page.items.map((item) => item.id)).toEqual([visible.id]);
    expect(page.total).toBe(1);
    expect(page.nextCursor).toBeUndefined();
    expect(
      (await store.listMessages('user-1', { accountIds: ['paused'] })).items,
    ).toEqual([]);
    expect(await service.getUnreadCount({ actorId: 'user-1' })).toBe(1);
    expect(
      (
        await service.listManagedMessages(
          { actorId: 'user-1' },
          { accountIds: ['paused'] },
        )
      ).items.map((item) => item.id),
    ).toEqual([hidden.id]);
    expect(
      await service.getManagedMessage(
        { actorId: 'user-1' },
        'paused',
        hidden.id,
      ),
    ).toMatchObject({ id: hidden.id });
    await service.updateAccount(
      { actorId: 'user-1' },
      { accountId: 'paused', status: 'active' },
    );
    expect((await store.listMessages('user-1', {})).items).toHaveLength(2);
    expect(await service.getUnreadCount({ actorId: 'user-1' })).toBe(2);
  });

  it('resolves account owner usernames in batches with name and missing-user fallbacks', async () => {
    for (let index = 0; index < 102; index += 1) {
      await store.saveAccount({
        ...account(),
        id: `owned-${index}`,
        userId: `owner-${index}`,
        address: `owned-${index}@example.com`,
      });
    }
    await store.saveAccount({
      ...account(),
      id: 'same-owner',
      userId: 'owner-0',
      address: 'same-owner@example.com',
    });
    const list = vi.fn<UserAdministrationService['list']>(async (input) => ({
      items: (input?.userIds ?? [])
        .filter((id) => id !== 'owner-101')
        .map((id) => ({
          id,
          name: `Name ${id}`,
          username: id === 'owner-0' ? 'alice' : undefined,
          email: `${id}@private.example.com`,
          emailVerified: true,
          disabledAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      total: input?.userIds?.length ?? 0,
      page: 1,
      pageSize: 100,
    }));
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
      outbox: { kick: vi.fn() },
      users: { list },
    });
    const accounts = await service.listManagedAccounts({
      actorId: 'administrator',
    });
    expect(accounts.find((item) => item.id === 'owned-0')?.ownerName).toBe(
      'alice',
    );
    expect(accounts.find((item) => item.id === 'same-owner')?.ownerName).toBe(
      'alice',
    );
    expect(accounts.find((item) => item.id === 'owned-100')?.ownerName).toBe(
      'Name owner-100',
    );
    expect(
      accounts.find((item) => item.id === 'owned-101')?.ownerName,
    ).toBeUndefined();
    expect(list).toHaveBeenCalledTimes(2);
    const ids = list.mock.calls.flatMap(([input]) => input?.userIds ?? []);
    expect(ids).toHaveLength(103);
    expect(new Set(ids).size).toBe(103);
    expect(JSON.stringify(accounts)).not.toContain('private.example.com');
  });

  it('paginates delivery history beyond the recent-record limit without crossing owners', async () => {
    await store.saveAccount({
      ...account(),
      id: 'other-account',
      userId: 'other-user',
      address: 'other@example.com',
    });
    for (let index = 0; index < 125; index += 1) {
      await store.createSubmission(
        {
          id: `paged-${String(index).padStart(3, '0')}`,
          accountId: 'account-1',
          status: 'accepted',
        },
        `paged-${index}`,
        'fingerprint',
      );
    }
    await store.createSubmission(
      {
        id: 'other-submission',
        accountId: 'other-account',
        status: 'accepted',
      },
      'other-submission',
      'fingerprint',
    );
    await database
      .query()
      .updateTable('mailSubmissions')
      .set({ createdAt: '2026-09-01T00:00:00.000Z' })
      .allowAllRows()
      .execute();
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
    });
    const pages = [];
    for (let offset = 0; offset < 125; offset += 20) {
      const page = await service.listSubmissions(
        { actorId: 'user-1' },
        false,
        offset,
        false,
        20,
      );
      expect(page).toHaveLength(Math.min(20, 125 - offset));
      pages.push(...page);
    }
    expect(pages.map((row) => row.id)).toEqual(
      Array.from(
        { length: 125 },
        (_, index) => `paged-${String(124 - index).padStart(3, '0')}`,
      ),
    );
    const counted = await service.listSubmissionsPage(
      { actorId: 'user-1' },
      false,
      120,
      false,
      20,
    );
    expect(counted.total).toBe(125);
    expect(counted.items).toHaveLength(5);
    expect(
      (await service.listSubmissionsPage({ actorId: 'other-user' })).total,
    ).toBe(1);
    expect(
      (await service.listSubmissionsPage({ actorId: 'unknown-user' })).total,
    ).toBe(0);
    await expect(
      service.listSubmissions({ actorId: 'user-1' }, false, 140, false, 20),
    ).resolves.toEqual([]);
    await expect(
      store.listSubmissions('user-1', false, -1, false, 20),
    ).rejects.toThrow('offset');
    await expect(
      store.listSubmissions('user-1', false, 0, false, 101),
    ).rejects.toThrow('limit');
  });

  it('paginates synchronization logs stably when creation times match', async () => {
    for (let index = 0; index < 25; index += 1) {
      const id = `paged-sync-${String(index).padStart(2, '0')}`;
      await store.createSyncRun({
        id,
        accountId: 'account-1',
        requestedBy: 'user-1',
        mode: 'incremental',
        policy: {},
      });
      await store.cancelSyncRun(id);
    }
    await database
      .query()
      .updateTable('mailSyncRuns')
      .set({ createdAt: '2026-09-01T00:00:00.000Z' })
      .allowAllRows()
      .execute();
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
    });
    const first = await service.listSyncRuns({ actorId: 'user-1' }, 0, 20);
    const second = await service.listSyncRuns({ actorId: 'user-1' }, 20, 20);
    expect(first).toHaveLength(20);
    expect(second).toHaveLength(5);
    const counted = await service.listSyncRunsPage(
      { actorId: 'user-1' },
      20,
      20,
    );
    expect(counted.total).toBe(25);
    expect(counted.items).toEqual(second);
    expect(
      (await service.listSyncRunsPage({ actorId: 'other-user' })).total,
    ).toBe(0);
    expect([...first, ...second].map((row) => row.id)).toEqual(
      Array.from(
        { length: 25 },
        (_, index) => `paged-sync-${String(24 - index).padStart(2, '0')}`,
      ),
    );
    await expect(
      service.listSyncRuns({ actorId: 'other-user' }, 0, 20),
    ).resolves.toEqual([]);
    await expect(store.listSyncRuns('user-1', 0, 0)).rejects.toThrow('limit');
  });

  it('paginates whole batches while preserving all recipient rows and a lookahead batch', async () => {
    for (let batch = 0; batch < 22; batch += 1) {
      for (let recipient = 0; recipient < 3; recipient += 1) {
        const key = `bulk:page-${String(batch).padStart(2, '0')}:${recipient}`;
        await store.createSubmission(
          { id: key, accountId: 'account-1', status: 'accepted' },
          key,
          'fingerprint',
        );
      }
    }
    await database
      .query()
      .updateTable('mailSubmissions')
      .set({ createdAt: '2026-09-01T00:00:00.000Z' })
      .allowAllRows()
      .execute();
    const first = await store.listSubmissions('user-1', true, 0, true, 21);
    const second = await store.listSubmissions('user-1', true, 20, true, 21);
    expect(await store.countSubmissions('user-1', true, true)).toBe(22);
    expect(await store.countSubmissions('user-1', true, false)).toBe(66);
    expect(await store.countSubmissions('other-user', true, true)).toBe(0);
    expect(first).toHaveLength(63);
    expect(second).toHaveLength(6);
    expect(first.slice(0, 3).map((row) => row.id)).toEqual([
      'bulk:page-21:0',
      'bulk:page-21:1',
      'bulk:page-21:2',
    ]);
    expect(
      new Set([...first.slice(0, 60), ...second].map((row) => row.id)).size,
    ).toBe(66);
  });

  it('logs delivery results without message payloads and preserves accepted delivery on cleanup and logger failures', async () => {
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(async () => ({
      status: 'accepted',
      providerMessageId: 'sent',
    }));
    const cleanupError = new Error('cleanup unavailable');
    const service = new DefaultMailService({
      store,
      logger,
      adapters: resolver({ ...baseAdapter(), sendMessage }),
      outbox: {
        kick: () => {
          throw cleanupError;
        },
      },
    });
    const input = {
      accountId: 'account-1',
      identityId: 'identity-1',
      to: [{ address: 'private@example.com' }],
      subject: 'private subject',
      text: 'private body',
      idempotencyKey: 'logged-send',
    };
    const result = await service.sendMessage({ actorId: 'user-1' }, input);
    expect(result.status).toBe('accepted');
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'mail.send.result',
        accountId: 'account-1',
        submissionId: result.id,
        status: 'accepted',
        durationMs: expect.any(Number),
      }),
      'Mail submission result.',
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'mail.send.sync_kick_failed',
        submissionId: result.id,
        err: {
          type: 'Error',
          message: cleanupError.message,
          stack: cleanupError.stack,
        },
      }),
      expect.any(String),
    );
    const serialized = JSON.stringify([
      logger.info.mock.calls,
      logger.error.mock.calls,
    ]);
    for (const value of [
      'private@example.com',
      'private subject',
      'private body',
      'secret:test',
    ])
      expect(serialized).not.toContain(value);
    logger.info.mockImplementation(() => {
      throw new Error('transport failed');
    });
    logger.error.mockImplementation(() => {
      throw new Error('transport failed');
    });
    expect(
      (
        await service.sendMessage(
          { actorId: 'user-1' },
          { ...input, idempotencyKey: 'logged-send-2' },
        )
      ).status,
    ).toBe('accepted');
    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  it.each(['failed', 'submission_unknown', 'throw'] as const)(
    'logs provider send outcome %s with its submission identity',
    async (outcome) => {
      const logger = { error: vi.fn() };
      const failure = new Error('SMTP unavailable');
      const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(
        async () => {
          if (outcome === 'throw') throw failure;
          return {
            status: outcome,
            error: {
              code: 'SMTP_FAILED',
              category: 'network',
              message: failure.message,
              retryable: false,
            },
          };
        },
      );
      const service = new DefaultMailService({
        store,
        logger,
        adapters: resolver({ ...baseAdapter(), sendMessage }),
        outbox: { kick: vi.fn() },
      });
      const result = await service.sendMessage(
        { actorId: 'user-1' },
        {
          accountId: 'account-1',
          identityId: 'identity-1',
          to: [{ address: 'recipient@example.com' }],
          subject: 'Test',
          text: 'Body',
          idempotencyKey: 'failed-send',
        },
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'mail.send.result',
          submissionId: result.id,
          status: outcome === 'failed' ? 'failed' : 'unknown',
          errorCode:
            outcome === 'throw' ? 'MAIL_SEND_RESULT_UNKNOWN' : 'SMTP_FAILED',
        }),
        expect.any(String),
      );
      if (outcome === 'throw')
        expect(logger.error).toHaveBeenCalledWith(
          expect.objectContaining({
            event: 'mail.send.exception',
            err: {
              type: 'Error',
              message: failure.message,
              stack: failure.stack,
            },
          }),
          expect.any(String),
        );
    },
  );

  it.each([true, false])(
    'logs synchronization failure with retryable=%s after saving its state',
    async (retryable) => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
      const provider = {
        ...baseAdapter(),
        getCurrentSyncCursor: async () => ({
          ok: false as const,
          error: {
            code: 'SYNC_FAILED',
            category: 'network' as const,
            message: 'Provider unavailable',
            retryable,
            retryAfterMs: 1234,
          },
        }),
        listMessages: async () => ({
          ok: true as const,
          value: { messages: [] },
        }),
      };
      const run = await store.createSyncRun({
        id: 'logged-sync',
        accountId: 'account-1',
        requestedBy: 'user-1',
        mode: 'initial',
        policy: {
          receivedAfter: '2026-09-01T00:00:00.000Z',
          batchSize: 10,
        },
      });
      const operation = new SyncMailboxOperation({
        store,
        adapters: resolver(provider),
        logger,
      });
      await operation.execute({
        syncRunId: run.id,
        expectedRevision: run.revision,
        expectedPhase: run.phase,
      });
      expect(await store.getSyncRun(run.id)).toMatchObject({
        status: retryable ? 'pending' : 'failed',
      });
      expect(logger[retryable ? 'warn' : 'error']).toHaveBeenCalledWith(
        expect.objectContaining({
          event: retryable ? 'mail.sync.retry_scheduled' : 'mail.sync.failed',
          accountId: 'account-1',
          syncRunId: run.id,
          errorCode: 'SYNC_FAILED',
          retryable,
          durationMs: expect.any(Number),
          ...(retryable ? { retryAfterMs: 1234 } : {}),
        }),
        expect.any(String),
      );
    },
  );

  it('logs persisted synchronization completion with counts', async () => {
    const logger = { info: vi.fn(), warn: vi.fn() };
    const provider: MailProviderAdapter = {
      ...baseAdapter(),
      getCurrentSyncCursor: async () => ({
        ok: true,
        value: { value: 'initial' },
      }),
      listMessages: async () => ({
        ok: true,
        value: { messages: [message('logged-message', 'Secret subject')] },
      }),
      listChanges: async () => ({
        ok: true,
        value: {
          messages: [],
          deletedProviderMessageIds: [],
          nextCursor: { value: 'next' },
          hasMore: false,
        },
      }),
    };
    let run = await store.createSyncRun({
      id: 'completed-sync',
      accountId: 'account-1',
      requestedBy: 'user-1',
      mode: 'initial',
      policy: {
        receivedAfter: '2026-09-01T00:00:00.000Z',
        batchSize: 10,
      },
    });
    const operation = new SyncMailboxOperation({
      store,
      adapters: resolver(provider),
      logger,
    });
    for (let step = 0; step < 3; step += 1) {
      await operation.execute({
        syncRunId: run.id,
        expectedRevision: run.revision,
        expectedPhase: run.phase,
      });
      run = (await store.getSyncRun(run.id))!;
    }
    expect(run.status).toBe('completed');
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'mail.sync.completed',
        syncRunId: run.id,
        status: 'completed',
        processedMessages: 1,
      }),
      expect.any(String),
    );
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain(
      'Secret subject',
    );
  });

  it('preserves background exception details even if the logging transport fails', async () => {
    const error = new Error('outbox database unavailable');
    const logger = { error: vi.fn() };
    vi.spyOn(store, 'claimOutbox').mockRejectedValue(error);
    executor = await InlineJobExecutor.ready();
    runtime = createMailRuntime({
      store,
      adapters: resolver(baseAdapter()),
      executor,
      logger,
    });
    runtime.kick();
    await vi.waitFor(() =>
      expect(logger.error).toHaveBeenCalledWith(
        { err: { type: 'Error', message: error.message, stack: error.stack } },
        'Mail Outbox Relay failed.',
      ),
    );
    logger.error.mockImplementation(() => {
      throw new Error('transport failed');
    });
    runtime.kick();
    await vi.waitFor(() => expect(logger.error).toHaveBeenCalledTimes(2));
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  // MAIL-SEND-009/010 and MAIL-BULK-003: idempotent and scheduled delivery.
  it('sends once for a repeated idempotency key', async () => {
    const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(async () => ({
      status: 'accepted',
      providerMessageId: 'provider-sent-1',
    }));
    const adapters = resolver({ ...baseAdapter(), sendMessage });
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick: vi.fn() },
    });
    const input = {
      accountId: 'account-1',
      identityId: 'identity-1',
      to: [{ address: 'recipient@example.com' }],
      subject: 'Hello',
      text: 'Mail body',
      idempotencyKey: 'request-1',
    } as const;

    const first = await service.sendMessage({ actorId: 'user-1' }, input);
    const second = await service.sendMessage({ actorId: 'user-1' }, input);
    const accounts = await service.listAccounts({ actorId: 'user-1' });

    expect(first).toMatchObject({
      status: 'accepted',
      providerMessageId: 'provider-sent-1',
    });
    expect(second).toEqual(first);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(accounts[0]).not.toHaveProperty('credentialReference');
    await expect(
      service.listSubmissions({ actorId: 'user-1' }),
    ).resolves.toMatchObject([
      {
        id: first.id,
        accountId: 'account-1',
        status: 'accepted',
        providerMessageId: 'provider-sent-1',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    ]);
  });

  it('persists partial acceptance in scheduled-send history and never resends accepted recipients', async () => {
    const recipientError = {
      code: 'SMTP_RECIPIENTS_REJECTED',
      message: 'Private server detail',
      category: 'recipient' as const,
      retryable: false,
      recipients: {
        accepted: ['first@example.com'],
        rejected: ['second@example.com'],
      },
    };
    const sendMessage = vi
      .fn<NonNullable<MailProviderAdapter['sendMessage']>>()
      .mockResolvedValue({
        status: 'accepted',
        providerMessageId: 'partial-id',
        recipientError,
      });
    const adapters = resolver({ ...baseAdapter(), sendMessage });
    const service = new DefaultMailService({ store, adapters });
    const input = {
      accountId: 'account-1',
      identityId: 'identity-1',
      to: [{ address: 'first@example.com' }, { address: 'second@example.com' }],
      subject: 'Partial',
      text: 'Body',
      idempotencyKey: 'partial',
      scheduledAt: '2099-01-01T00:00:00Z',
    };
    const queued = await service.sendMessage({ actorId: 'user-1' }, input);
    const scheduled = await store.getScheduledSubmission(queued.id);
    await new SendMailOperation({ store, adapters }).execute(
      { actorId: 'user-1' },
      scheduled!.input,
      { scheduledDelivery: true },
    );
    const retried = await service.sendMessage({ actorId: 'user-1' }, input);
    expect(retried).toMatchObject({
      status: 'accepted',
      error: {
        code: 'SMTP_RECIPIENTS_REJECTED',
        recipients: recipientError.recipients,
      },
    });
    expect(retried.error).not.toHaveProperty('message');
    expect(sendMessage).toHaveBeenCalledTimes(1);
    const [log] = await service.listSubmissions({ actorId: 'user-1' });
    expect(log).toMatchObject({
      status: 'accepted',
      canRetry: false,
      error: { retryable: false, recipients: recipientError.recipients },
    });
    await expect(
      service.retrySubmission({ actorId: 'user-1' }, queued.id),
    ).rejects.toThrow();
  });

  it.each(['accepted', 'failed', 'unknown', 'edited'] as const)(
    'consumes the source draft when the batch is queued (%s)',
    async (outcome) => {
      const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(
        async () => ({ status: 'accepted', providerMessageId: 'sent-first' }),
      );
      const adapters = resolver({
        ...baseAdapter(),
        capabilities: { ...baseAdapter().capabilities, drafts: false },
        sendMessage,
      });
      const service = new DefaultMailService({
        store,
        adapters,
        outbox: { kick: vi.fn() },
      });
      const base = {
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [{ address: 'one@example.com' }],
        subject: 'Batch',
        text: 'Body',
        idempotencyKey: 'draft-batch',
      };
      const draft = await service.saveDraft({ actorId: 'user-1' }, base);
      const input = {
        ...base,
        recipients: [...base.to, { address: 'two@example.com' }],
        sourceDraftMessageId: draft.id,
        idempotencyKey: 'batch',
      };
      const tasks = await service.sendBulk({ actorId: 'user-1' }, input);
      expect(await service.sendBulk({ actorId: 'user-1' }, input)).toEqual(
        tasks,
      );
      const operation = new SendMailOperation({ store, adapters });
      const first = await store.getScheduledSubmission(tasks[0].id);
      await operation.execute({ actorId: 'user-1' }, first!.input, {
        scheduledDelivery: true,
      });
      expect(
        await store.getMessage('user-1', 'account-1', draft.id),
      ).toBeUndefined();
      if (outcome === 'edited')
        await expect(
          service.saveDraft(
            { actorId: 'user-1' },
            { ...base, draftMessageId: draft.id, text: 'New edits' },
          ),
        ).rejects.toThrow(/not found/);
      if (outcome === 'failed' || outcome === 'unknown')
        sendMessage.mockResolvedValue({
          status: outcome,
          error: {
            code: 'TEST',
            message: 'Delivery unavailable',
            category: 'network',
            retryable: false,
          },
        });
      const second = await store.getScheduledSubmission(tasks[1].id);
      await operation.execute({ actorId: 'user-1' }, second!.input, {
        scheduledDelivery: true,
      });
      const remaining = await store.getMessage('user-1', 'account-1', draft.id);
      expect(remaining).toBeUndefined();
    },
  );

  it('restores reply headers after saving and reopening a draft twice', async () => {
    const parent = await store.saveMessage('account-1', {
      ...message('parent', 'Original'),
      internetMessageId: '<parent@example.com>',
      references: ['<root@example.com>'],
      providerConversationId: 'thread-1',
    });
    const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(async () => ({
      status: 'accepted',
      providerMessageId: 'sent-reply',
    }));
    const adapters = resolver({
      ...baseAdapter(),
      capabilities: { ...baseAdapter().capabilities, drafts: false },
      sendMessage,
    });
    const service = new DefaultMailService({ store, adapters });
    const base = {
      accountId: 'account-1',
      identityId: 'identity-1',
      to: [{ address: 'recipient@example.com' }],
      subject: 'Re: Original',
      text: 'Reply',
      idempotencyKey: 'reply-draft',
    };
    const first = await service.saveDraft(
      { actorId: 'user-1' },
      { ...base, inReplyToMessageId: parent.id },
    );
    const reopened = await service.saveDraft(
      { actorId: 'user-1' },
      { ...base, draftMessageId: first.id, text: 'Edited reply' },
    );
    expect(reopened.draftSource?.replyToMessageId).toBe(parent.id);
    await service.sendMessage(
      { actorId: 'user-1' },
      { ...base, draftMessageId: reopened.id, text: 'Final reply' },
    );
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          text: 'Final reply',
          inReplyTo: '<parent@example.com>',
          references: ['<root@example.com>', '<parent@example.com>'],
          replyToProviderMessageId: 'parent',
        }),
      }),
    );
    expect(
      await store.getMessage('user-1', 'account-1', first.id),
    ).toBeUndefined();
  });

  it('preserves a reopened forward source without requesting duplicate quoted content', async () => {
    const parent = await store.saveMessage(
      'account-1',
      message('forward-parent', 'Original'),
    );
    const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(async () => ({
      status: 'accepted',
      providerMessageId: 'sent-forward',
    }));
    const adapters = resolver({
      ...baseAdapter(),
      capabilities: { ...baseAdapter().capabilities, drafts: false },
      sendMessage,
    });
    const service = new DefaultMailService({ store, adapters });
    const input = {
      accountId: 'account-1',
      identityId: 'identity-1',
      to: [{ address: 'recipient@example.com' }],
      subject: 'Fwd: Original',
      text: 'Comment and quoted body',
      forwardOfMessageId: parent.id,
      forwardBodyIncluded: true,
      idempotencyKey: 'forward-draft',
    };
    const first = await service.saveDraft({ actorId: 'user-1' }, input);
    const { forwardOfMessageId: _source, ...reopenedInput } = input;
    const reopened = await service.saveDraft(
      { actorId: 'user-1' },
      { ...reopenedInput, draftMessageId: first.id },
    );
    expect(reopened.draftSource?.forwardOfMessageId).toBe(parent.id);
    await service.sendMessage(
      { actorId: 'user-1' },
      {
        ...reopenedInput,
        forwardBodyIncluded: undefined,
        draftMessageId: first.id,
      },
    );
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          forwardOfProviderMessageId: 'forward-parent',
          forwardBodyIncluded: true,
          text: input.text,
        }),
      }),
    );
  });

  it('reuses persisted schedule times when a bulk request is retried', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-08T00:00:00.000Z'));
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
      outbox: { kick: vi.fn() },
    });
    const input = {
      accountId: 'account-1',
      identityId: 'identity-1',
      recipients: [
        { address: 'first@example.com' },
        { address: 'second@example.com' },
      ],
      subject: 'Private update',
      text: 'Mail body',
      idempotencyKey: 'bulk-request-1',
    } as const;

    const first = await service.sendBulk({ actorId: 'user-1' }, input);
    vi.setSystemTime(new Date('2026-09-08T00:01:00.000Z'));
    const second = await service.sendBulk({ actorId: 'user-1' }, input);

    expect(second).toEqual(first);
    expect(first).toHaveLength(2);
    expect(first.every((submission) => submission.status === 'pending')).toBe(
      true,
    );
  });

  it('persists a scheduled message and sends it only after its due time', async () => {
    const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(async () => ({
      status: 'accepted',
      providerMessageId: 'provider-scheduled-1',
    }));
    const adapters = resolver({ ...baseAdapter(), sendMessage });
    executor = await InlineJobExecutor.ready();
    runtime = createMailRuntime({
      store,
      adapters,
      executor,
    });
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: runtime,
    });
    const signature = await service.saveSignature(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        name: 'Scheduled',
        text: 'Original signature',
      },
    );
    const scheduledAt = new Date(Date.now() + 60_000).toISOString();

    const submission = await service.sendMessage(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        identityId: 'identity-1',
        signatureId: signature.id,
        to: [{ address: 'recipient@example.com' }],
        subject: 'Later',
        text: 'Scheduled body',
        scheduledAt,
        idempotencyKey: 'scheduled-request-1',
      },
    );

    expect(submission).toMatchObject({ status: 'pending', scheduledAt });
    await service.saveSignature(
      { actorId: 'user-1' },
      {
        id: signature.id,
        accountId: 'account-1',
        name: signature.name,
        text: 'Changed after scheduling',
      },
    );
    await runtime.publishPending();
    expect(sendMessage).not.toHaveBeenCalled();
    const due = await store.claimOutbox(
      new Date(Date.now() + 61_000).toISOString(),
      'due-lease',
      new Date(Date.now() + 90_000).toISOString(),
      1,
    );
    expect(due).toHaveLength(1);
    expect(due[0]).toMatchObject({
      type: 'sendScheduledMail',
      aggregateId: submission.id,
    });
    await store.releaseOutbox(
      due[0].id,
      due[0].leaseToken ?? '',
      new Date().toISOString(),
    );
    await runtime.publishPending();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          text: 'Scheduled body\n\n-- \nOriginal signature',
        }),
      }),
    );
    await expect(
      service.listSubmissions({ actorId: 'user-1' }),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: submission.id,
          status: 'accepted',
          providerMessageId: 'provider-scheduled-1',
        }),
      ]),
    );
  });

  it('runs a due scheduled message on the memory jobs backend once started', async () => {
    const storagePath = await mkdtemp(join(tmpdir(), 'mail-jobs-'));
    const jobs = createJobExecutorService(undefined, {
      appName: 'mail-test',
      storagePath,
    });
    const memoryExecutor = jobs.getJobExecutor('@nocobase/app-plugin-mail');
    try {
      const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(
        async () => ({
          status: 'accepted',
          providerMessageId: 'provider-memory-jobs-1',
        }),
      );
      const adapters = resolver({ ...baseAdapter(), sendMessage });
      runtime = createMailRuntime({
        store,
        adapters,
        executor: memoryExecutor,
        relayIntervalMs: 10,
      });
      const service = new DefaultMailService({
        store,
        adapters,
        outbox: runtime,
      });
      await runtime.start();
      const submission = await service.sendMessage(
        { actorId: 'user-1' },
        {
          accountId: 'account-1',
          identityId: 'identity-1',
          to: [{ address: 'recipient@example.com' }],
          subject: 'Later',
          text: 'Scheduled body',
          scheduledAt: new Date(Date.now() + 60_000).toISOString(),
          idempotencyKey: 'scheduled-memory-jobs-1',
        },
      );
      const due = await store.claimOutbox(
        new Date(Date.now() + 61_000).toISOString(),
        'due-lease',
        new Date(Date.now() + 90_000).toISOString(),
        1,
      );
      expect(due).toHaveLength(1);
      await store.releaseOutbox(
        due[0].id,
        due[0].leaseToken ?? '',
        new Date().toISOString(),
      );

      // The relay only submits the task; the executor runs it after publishing returns.
      await vi.waitFor(async () => {
        expect(sendMessage).toHaveBeenCalledTimes(1);
        await expect(
          service.listSubmissions({ actorId: 'user-1' }),
        ).resolves.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: submission.id,
              status: 'accepted',
            }),
          ]),
        );
      });

      await runtime.close();
      await expect(
        memoryExecutor.addJob(
          new (class extends Job<null> {
            public static readonly jobName: string = 'after-close';
            public async execute(): Promise<void> {}
          })(null),
        ),
      ).rejects.toThrow('shut down');
    } finally {
      await runtime?.close();
      await jobs.shutdown();
      await rm(storagePath, { recursive: true, force: true });
    }
  });

  // MAIL-SYNC-003/004/012/013/014: automatic synchronization and Push.
  it('schedules automatic mailbox sync without duplicating an active run', async () => {
    executor = await InlineJobExecutor.ready();
    runtime = createMailRuntime({
      store,
      adapters: resolver(baseAdapter()),
      executor,
      syncBatchSize: 37,
    });

    await expect(runtime.createAutomaticSyncRuns()).resolves.toBe(1);
    await expect(runtime.createAutomaticSyncRuns()).resolves.toBe(0);

    await expect(store.findActiveSyncRun('account-1')).resolves.toMatchObject({
      accountId: 'account-1',
      requestedBy: 'user-1',
      mode: 'initial',
      policy: { batchSize: 37 },
    });
  });

  it.each([
    'recoverSyncRuns',
    'cleanupExpiredAttachments',
    'deleteExpiredAuthorizationTransactions',
    'deleteExpiredCredentials',
    'deletePublishedOutbox',
  ] as const)(
    'continues maintenance and automatic sync after %s fails',
    async (failedTask) => {
      const credentials = createDatabaseMailCredentialVault(database);
      const outboundAttachments = {
        create: vi.fn(),
        open: vi.fn(),
        cleanupExpired: vi.fn(async () => 0),
      };
      const tasks = {
        recoverSyncRuns: vi
          .spyOn(store, 'recoverSyncRuns')
          .mockResolvedValue(0),
        cleanupExpiredAttachments: outboundAttachments.cleanupExpired,
        deleteExpiredAuthorizationTransactions: vi
          .spyOn(store, 'deleteExpiredAuthorizationTransactions')
          .mockResolvedValue(0),
        deleteExpiredCredentials: vi
          .spyOn(credentials, 'deleteExpired')
          .mockResolvedValue(0),
        deletePublishedOutbox: vi
          .spyOn(store, 'deletePublishedOutboxBefore')
          .mockResolvedValue(0),
      };
      const error = new Error('maintenance unavailable');
      tasks[failedTask].mockRejectedValueOnce(error);
      const logger = { error: vi.fn() };
      executor = await InlineJobExecutor.ready();
      runtime = createMailRuntime({
        store,
        adapters: resolver(baseAdapter()),
        executor,
        credentials,
        outboundAttachments,
        logger,
      });
      // Keep created runs pending so we can inspect scheduling independently of delivery.
      vi.spyOn(runtime, 'kick').mockImplementation(() => {});
      const sweep = vi.spyOn(runtime, 'createAutomaticSyncRuns');
      runtime.scheduleAutomaticSync();
      await vi.waitFor(() => expect(sweep).toHaveBeenCalledTimes(1));
      await sweep.mock.results[0]!.value;
      await expect(store.findActiveSyncRun('account-1')).resolves.toMatchObject(
        { accountId: 'account-1' },
      );
      for (const task of Object.values(tasks))
        expect(task).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'mail.maintenance.failed',
          task: failedTask,
          err: expect.objectContaining({ message: error.message }),
        }),
        'Mail maintenance task failed.',
      );
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      runtime.scheduleAutomaticSync();
      await vi.waitFor(() => expect(sweep).toHaveBeenCalledTimes(2));
      await sweep.mock.results[1]!.value;
      for (const task of Object.values(tasks))
        expect(task).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledTimes(1);
    },
  );

  it('continues with other accounts when reading one account sync time fails', async () => {
    const second = {
      ...account(),
      id: 'account-2',
      address: 'second@example.com',
    };
    await store.saveAccount(second);
    vi.spyOn(store, 'listAllAccounts').mockResolvedValue([account(), second]);
    const readSyncTime = vi
      .spyOn(store, 'getLastSyncedAt')
      .mockImplementation(async (accountId) => {
        if (accountId === 'account-1')
          throw new Error('account sync time unavailable');
        return undefined;
      });
    const logger = { error: vi.fn() };
    executor = await InlineJobExecutor.ready();
    runtime = createMailRuntime({
      store,
      adapters: resolver(baseAdapter()),
      executor,
      logger,
    });
    vi.spyOn(runtime, 'kick').mockImplementation(() => {});
    await expect(runtime.createAutomaticSyncRuns()).resolves.toBe(1);
    await expect(store.findActiveSyncRun(second.id)).resolves.toMatchObject({
      accountId: second.id,
    });
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: 'account-1' }),
      'Automatic Mail synchronization could not be scheduled.',
    );
    readSyncTime.mockResolvedValue(undefined);
    await expect(runtime.createAutomaticSyncRuns()).resolves.toBe(1);
    await expect(store.findActiveSyncRun('account-1')).resolves.toMatchObject({
      accountId: 'account-1',
    });
  });

  it('only schedules an automatic sync after the configured interval elapses', () => {
    const now = Date.parse('2026-09-15T00:00:00.000Z');
    expect(
      isAutomaticSyncDue('2026-09-15T00:00:00.000Z', 30 * 60_000, now),
    ).toBe(false);
    expect(
      isAutomaticSyncDue('2026-09-14T23:30:00.000Z', 30 * 60_000, now),
    ).toBe(true);
    expect(isAutomaticSyncDue(undefined, 30 * 60_000, now)).toBe(true);
  });

  it.each([
    {
      intervalMs: 30 * 60_000,
      legacyMinutes: 1,
      elapsedMs: 10 * 60_000,
      expected: 0,
    },
    {
      intervalMs: 60_000,
      legacyMinutes: 45,
      elapsedMs: 2 * 60_000,
      expected: 1,
    },
    {
      intervalMs: undefined,
      legacyMinutes: 1,
      elapsedMs: 2 * 60_000,
      expected: 0,
    },
    {
      intervalMs: undefined,
      legacyMinutes: 45,
      elapsedMs: 6 * 60_000,
      expected: 1,
    },
    { intervalMs: 90_001, legacyMinutes: 45, elapsedMs: 90_000, expected: 0 },
    { intervalMs: 90_001, legacyMinutes: 45, elapsedMs: 90_001, expected: 1 },
  ])(
    'uses config interval $intervalMs instead of the stored account interval $legacyMinutes',
    async ({ intervalMs, legacyMinutes, elapsedMs, expected }) => {
      const now = Date.parse('2026-09-15T00:00:00.000Z');
      vi.spyOn(Date, 'now').mockReturnValue(now);
      await store.saveAccount({
        ...account(),
        automaticSyncIntervalMinutes: legacyMinutes,
      });
      vi.spyOn(store, 'getLastSyncedAt').mockResolvedValue(
        new Date(now - elapsedMs).toISOString(),
      );
      executor = await InlineJobExecutor.ready();
      runtime = createMailRuntime({
        store,
        adapters: resolver(baseAdapter()),
        executor,
        automaticSyncIntervalMs: intervalMs,
      });

      await expect(runtime.createAutomaticSyncRuns()).resolves.toBe(expected);
    },
  );

  it('updates account status without changing its legacy sync interval', async () => {
    await store.saveAccount({ ...account(), automaticSyncIntervalMinutes: 45 });
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
      outbox: { kick: vi.fn() },
    });

    await expect(
      service.updateAccount(
        { actorId: 'user-1' },
        { accountId: 'account-1', status: 'suspended' },
      ),
    ).resolves.toMatchObject({ status: 'suspended' });
    await expect(store.getAccount('account-1')).resolves.toMatchObject({
      automaticSyncIntervalMinutes: 45,
    });
  });

  it.each([false, true])(
    'imports provider signatures without a default and schedules initial sync (signature=%s)',
    async (hasSignature) => {
      const values = new Map<string, unknown>();
      let nextReference = 0;
      const credentials: MailCredentialVault = {
        put: async (value) => {
          const reference = `mail-credential-${++nextReference}`;
          values.set(reference, value);
          return reference;
        },
        get: async <T>(reference: string) => {
          const value = values.get(reference);
          if (value === undefined)
            throw new Error('Mail credential not found.');
          return value as T;
        },
        replace: async (reference, value) => {
          values.set(reference, value);
        },
        getOrRefresh: async <T>(reference, isFresh, refresh) => {
          const value = await credentials.get<T>(reference);
          return isFresh(value) ? value : refresh(value);
        },
        delete: async (reference) => {
          values.delete(reference);
        },
      };
      const microsoft: MailProviderDefinition = {
        type: 'microsoft',
        label: 'Microsoft 365',
        capabilities: baseAdapter().capabilities,
        authorization: {
          start: async () => ({
            ok: true,
            value: {
              authorizationUrl: 'https://login.microsoftonline.com/authorize',
              state: 'provider-state',
            },
          }),
          complete: async () => ({
            ok: true,
            value: {
              address: 'outlook@example.com',
              authorizationSubject: 'outlook-subject',
              identities: hasSignature
                ? [
                    {
                      address: 'outlook@example.com',
                      isPrimary: true,
                      canSend: true,
                      signatureText: 'Provider regards',
                      signatureHtml: '<p>Provider regards</p>',
                    },
                  ]
                : undefined,
              credentialReference: 'mail-account-credential',
              scopes: ['Mail.ReadWrite'],
            },
          }),
        },
        createAdapter: vi.fn(),
      };
      const kick = vi.fn();
      const service = new DefaultMailService({
        store,
        adapters: resolver(baseAdapter()),
        outbox: { kick },
        credentials,
        providerContext: { publicBasePath: '/main', credentials },
        registry: createMailProviderRegistry().register(microsoft),
        resolveProviderConfig: (provider): MailProviderConfig => provider,
      });

      const authorization = await service.startAuthorization(
        { actorId: 'user-1' },
        {
          provider: { type: 'microsoft', name: 'work' },
          redirectUri: 'https://app.example.com/main/mail/oauth/callback',
          initialSyncReceivedAfter: '2026-09-01T00:00:00.000Z',
        },
      );
      const account = await service.completeAuthorization({
        state: authorization.state,
        code: 'authorization-code',
      });

      expect(await store.findActiveSyncRun(account.id)).toMatchObject({
        accountId: account.id,
        requestedBy: 'user-1',
        mode: 'initial',
        policy: { receivedAfter: '2026-09-01T00:00:00.000Z' },
      });
      expect(kick).toHaveBeenCalledTimes(1);
      expect(await store.listSignatures(account.id)).toEqual(
        hasSignature
          ? [
              expect.objectContaining({
                text: 'Provider regards',
                isDefault: false,
              }),
            ]
          : [],
      );
    },
  );

  it('creates and renews push subscriptions during the automatic sweep', async () => {
    const upsertPushSubscription = vi
      .fn<NonNullable<MailProviderAdapter['upsertPushSubscription']>>()
      .mockResolvedValueOnce({
        ok: true,
        value: {
          providerSubscriptionId: 'provider-subscription-1',
          renewAfter: '2099-01-01T00:00:00.000Z',
          expiresAt: '2099-01-02T00:00:00.000Z',
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        value: {
          providerSubscriptionId: 'provider-subscription-1',
          renewAfter: '2099-01-03T00:00:00.000Z',
          expiresAt: '2099-01-04T00:00:00.000Z',
        },
      });
    const close = vi.fn(async () => undefined);
    const deletePushSubscription = vi.fn<
      NonNullable<MailProviderAdapter['deletePushSubscription']>
    >(async () => ({ ok: true, value: undefined }));
    executor = await InlineJobExecutor.ready();
    runtime = createMailRuntime({
      store,
      adapters: resolver({
        ...baseAdapter(),
        capabilities: {
          ...baseAdapter().capabilities,
          pushNotifications: true,
        },
        upsertPushSubscription,
        deletePushSubscription,
        close,
      }),
      executor,
      pushWebhookUrl: 'https://mail.example.com/main/mail/webhooks',
      pushWebhookSecret: 'a'.repeat(32),
    });

    await runtime.createAutomaticSyncRuns();
    expect(upsertPushSubscription).toHaveBeenCalledWith({
      notificationUrl: `https://mail.example.com/main/mail/webhooks/test/test/${'a'.repeat(32)}`,
      clientState: 'a'.repeat(32),
      providerSubscriptionId: undefined,
    });
    await expect(store.getPushSubscription('account-1')).resolves.toMatchObject(
      {
        providerSubscriptionId: 'provider-subscription-1',
        renewAfter: '2099-01-01T00:00:00.000Z',
      },
    );

    await store.savePushSubscription({
      accountId: 'account-1',
      provider: account().provider,
      providerSubscriptionId: 'provider-subscription-1',
      configurationFingerprint: 'stale-fingerprint',
      renewAfter: '2000-01-01T00:00:00.000Z',
      expiresAt: '2000-01-02T00:00:00.000Z',
      updatedAt: '2000-01-01T00:00:00.000Z',
    });
    await runtime.createAutomaticSyncRuns();

    expect(upsertPushSubscription).toHaveBeenLastCalledWith(
      expect.objectContaining({
        providerSubscriptionId: undefined,
      }),
    );
    expect(upsertPushSubscription).toHaveBeenCalledTimes(2);
    expect(deletePushSubscription).toHaveBeenCalledExactlyOnceWith(
      'provider-subscription-1',
    );
    expect(deletePushSubscription.mock.invocationCallOrder[0]).toBeLessThan(
      upsertPushSubscription.mock.invocationCallOrder[1],
    );
    expect(close.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('stops a recreated same-ID watch when the account is removed during rotation', async () => {
    await store.savePushSubscription({
      accountId: 'account-1',
      provider: account().provider,
      providerSubscriptionId: 'user@example.com',
      configurationFingerprint: 'stale-fingerprint',
      renewAfter: '2000-01-01T00:00:00.000Z',
      expiresAt: '2000-01-02T00:00:00.000Z',
      updatedAt: '2000-01-01T00:00:00.000Z',
    });
    const deletePushSubscription = vi.fn<
      NonNullable<MailProviderAdapter['deletePushSubscription']>
    >(async () => ({ ok: true, value: undefined }));
    const upsertPushSubscription = vi.fn<
      NonNullable<MailProviderAdapter['upsertPushSubscription']>
    >(async () => {
      await store.markAccountRemoving('account-1', 'user-1');
      await drainRemoval('account-1');
      return {
        ok: true,
        value: {
          providerSubscriptionId: 'user@example.com',
          renewAfter: '2099-01-01T00:00:00.000Z',
          expiresAt: '2099-01-02T00:00:00.000Z',
        },
      };
    });
    executor = await InlineJobExecutor.ready();
    runtime = createMailRuntime({
      store,
      adapters: resolver({
        ...baseAdapter(),
        capabilities: {
          ...baseAdapter().capabilities,
          pushNotifications: true,
        },
        upsertPushSubscription,
        deletePushSubscription,
      }),
      executor,
      pushWebhookUrl: 'https://mail.example.com/main/mail/webhooks',
      pushWebhookSecret: 'a'.repeat(32),
    });

    await runtime.createAutomaticSyncRuns();

    expect(deletePushSubscription).toHaveBeenCalledTimes(2);
    expect(deletePushSubscription).toHaveBeenNthCalledWith(
      1,
      'user@example.com',
    );
    expect(deletePushSubscription).toHaveBeenNthCalledWith(
      2,
      'user@example.com',
    );
    await expect(
      store.getPushSubscription('account-1'),
    ).resolves.toBeUndefined();
  });

  it('preserves a complete subscription for remote cleanup while removal starts', async () => {
    await store.savePushSubscription({
      accountId: 'account-1',
      provider: account().provider,
      providerSubscriptionId: 'subscription-before-removal',
      configurationFingerprint: 'removal-fingerprint',
      renewAfter: '2000-01-01T00:00:00.000Z',
      expiresAt: '2099-01-01T00:00:00.000Z',
      updatedAt: '2000-01-01T00:00:00.000Z',
    });
    await store.markAccountRemoving('account-1', 'user-1');

    await expect(
      store.claimPushSubscriptionMaintenance(
        account(),
        'removal-race-lease',
        new Date().toISOString(),
        new Date(Date.now() + 60_000).toISOString(),
      ),
    ).resolves.toBeUndefined();
    await expect(store.getPushSubscription('account-1')).resolves.toMatchObject(
      {
        providerSubscriptionId: 'subscription-before-removal',
      },
    );
  });

  it('deduplicates push-triggered synchronization', async () => {
    executor = await InlineJobExecutor.ready();
    runtime = createMailRuntime({
      store,
      adapters: resolver(baseAdapter()),
      executor,
    });

    const active = await store.createSyncRun({
      id: 'active-push-sync',
      accountId: 'account-1',
      requestedBy: 'user-1',
      mode: 'incremental',
      policy: { maxMessages: 10_000, batchSize: 200 },
    });
    await expect(runtime.schedulePushSync('account-1')).resolves.toBe(false);
    await store.clearPushSyncPending('account-1', 'stale-request-token');

    const claimed = await store.claimSyncRun(
      active.id,
      active.revision,
      active.phase,
      'push-race-lease',
      new Date(Date.now() + 30_000).toISOString(),
    );
    if (!claimed) throw new Error('Expected to claim push synchronization.');
    const committed = await store.commitSyncStep({
      run: claimed,
      messages: [],
      phase: 'completed',
      status: 'completed',
      changeCursor: { value: 'after-first-push' },
      createNextTask: false,
    });

    expect(committed).toMatchObject({
      status: 'running',
      phase: 'preparing',
      revision: 1,
    });
    const next = await store.claimOutbox(
      new Date().toISOString(),
      'push-follow-up-outbox',
      new Date(Date.now() + 30_000).toISOString(),
      10,
    );
    expect(next).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          aggregateId: active.id,
          payload: expect.objectContaining({
            expectedRevision: 1,
            expectedPhase: 'preparing',
          }),
        }),
      ]),
    );
  });

  // MAIL-SEND-007, MAIL-CENTER-008/010, and MAIL-ACTION-001/005/007: messages.
  it('resolves a reply against the owned stored message', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [],
      messages: [
        {
          ...message('provider-parent', 'Original'),
          internetMessageId: '<parent@example.com>',
          providerConversationId: 'thread-1',
          references: ['<root@example.com>'],
        },
      ],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'reply-test' },
    });
    const stored = await store.listMessages('user-1', {});
    const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(async () => ({
      status: 'accepted',
      providerMessageId: 'provider-reply',
    }));
    const service = new DefaultMailService({
      store,
      adapters: resolver({ ...baseAdapter(), sendMessage }),
      outbox: { kick: vi.fn() },
    });

    await service.sendMessage(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [{ address: 'recipient@example.com' }],
        subject: 'Re: Original',
        text: 'Reply body',
        inReplyToMessageId: stored.items[0].id,
        idempotencyKey: 'reply-request-1',
      },
    );

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          inReplyTo: '<parent@example.com>',
          references: ['<root@example.com>', '<parent@example.com>'],
          providerConversationId: 'thread-1',
          replyToProviderMessageId: 'provider-parent',
        }),
      }),
    );
  });

  it('passes the editable forward body to the provider and fingerprints its mode', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [],
      messages: [message('provider-parent', 'Original')],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'forward-test' },
    });
    const stored = await store.listMessages('user-1', {});
    const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(async () => ({
      status: 'accepted',
      providerMessageId: 'provider-forward',
    }));
    const service = new DefaultMailService({
      store,
      adapters: resolver({ ...baseAdapter(), sendMessage }),
      outbox: { kick: vi.fn() },
    });
    const input = {
      accountId: 'account-1',
      identityId: 'identity-1',
      to: [{ address: 'recipient@example.com' }],
      subject: 'Fwd: Original',
      text: 'Edited original',
      forwardOfMessageId: stored.items[0].id,
      forwardBodyIncluded: true,
      idempotencyKey: 'forward-1',
    };
    await service.sendMessage({ actorId: 'user-1' }, input);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          text: 'Edited original',
          forwardOfProviderMessageId: 'provider-parent',
          forwardBodyIncluded: true,
        }),
      }),
    );
    await expect(
      service.sendMessage(
        { actorId: 'user-1' },
        { ...input, forwardBodyIncluded: false },
      ),
    ).rejects.toThrow();
  });

  it('loads only summary fields for the mailbox list', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [],
      messages: [
        {
          ...message('provider-summary', 'Summary'),
          text: 'A large message body that the mailbox list does not need.',
          html: '<p>A large message body</p>',
          attachments: [
            {
              providerAttachmentId: 'provider-summary-attachment',
              fileName: 'report.pdf',
              contentType: 'application/pdf',
              size: 10,
              inline: false,
            },
          ],
        },
      ],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'summary-test' },
    });

    const result = await store.listMessages('user-1', {});

    expect(result.items[0]).toMatchObject({
      providerMessageId: 'provider-summary',
      hasAttachments: true,
    });
    expect(result.items[0]).not.toHaveProperty('text');
    expect(result.items[0]).not.toHaveProperty('html');
    expect(result.items[0]).not.toHaveProperty('attachments');
  });

  it('updates Provider and local message state, then deletes the message', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [],
      messages: [message('provider-mutable', 'Mutable')],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'mutation-test' },
    });
    const stored = await store.listMessages('user-1', {});
    const setRead = vi.fn<NonNullable<MailProviderAdapter['setRead']>>(
      async () => ({ ok: true, value: undefined }),
    );
    const setStarred = vi.fn<NonNullable<MailProviderAdapter['setStarred']>>(
      async () => ({ ok: true, value: undefined }),
    );
    const deleteMessage = vi.fn<
      NonNullable<MailProviderAdapter['deleteMessage']>
    >(async () => ({ ok: true, value: undefined }));
    const service = new DefaultMailService({
      store,
      adapters: resolver({
        ...baseAdapter(),
        setRead,
        setStarred,
        deleteMessage,
      }),
      outbox: { kick: vi.fn() },
    });

    const updated = await service.updateMessage(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        messageId: stored.items[0].id,
        read: true,
        starred: true,
      },
    );
    expect(updated).toMatchObject({ read: true, starred: true });
    expect(setRead).toHaveBeenCalledWith('provider-mutable', true, undefined);
    expect(setStarred).toHaveBeenCalledWith(
      'provider-mutable',
      true,
      undefined,
    );

    await service.deleteMessage(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        messageId: stored.items[0].id,
        permanently: true,
      },
    );
    expect(deleteMessage).toHaveBeenCalledWith(
      'provider-mutable',
      true,
      undefined,
    );
    await expect(store.listMessages('user-1', {})).resolves.toMatchObject({
      items: [],
    });
  });

  it('reads managed details across owners while preserving personal ownership and account scoping', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [],
      messages: [message('managed-detail', 'Managed detail')],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'details' },
    });
    const stored = await store.listMessages('user-1', {});
    const id = stored.items[0].id;
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
      outbox: { kick: vi.fn() },
    });
    await expect(
      service.getManagedMessage({ actorId: 'other-user' }, 'account-1', id),
    ).resolves.toMatchObject({ subject: 'Managed detail' });
    await expect(
      service.getMessage({ actorId: 'other-user' }, 'account-1', id),
    ).resolves.toBeUndefined();
    await expect(
      service.getManagedMessage({ actorId: 'other-user' }, 'wrong-account', id),
    ).resolves.toBeUndefined();
    await expect(
      service.getManagedAttachment(
        { actorId: 'other-user' },
        'wrong-account',
        id,
        'missing',
      ),
    ).rejects.toThrow('Mail account was not found.');
    await expect(
      service.getManagedAttachment(
        { actorId: 'other-user' },
        'account-1',
        id,
        'missing',
      ),
    ).rejects.toThrow('Mail attachment was not found.');
  });

  it('executes management actions per message and preserves partial failures', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [],
      messages: [
        message('provider-management-success', 'Success'),
        message('provider-management-failure', 'Failure'),
      ],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'management-action-test' },
    });
    const stored = await store.listMessages('user-1', {});
    const setRead = vi.fn<NonNullable<MailProviderAdapter['setRead']>>(
      async (providerMessageId) =>
        providerMessageId === 'provider-management-failure'
          ? {
              ok: false,
              error: {
                code: 'MAIL_PROVIDER_TEMPORARY_FAILURE',
                message: 'Provider unavailable',
                category: 'network',
                retryable: true,
              },
            }
          : { ok: true, value: undefined },
    );
    const service = new DefaultMailService({
      store,
      adapters: resolver({ ...baseAdapter(), setRead }),
      outbox: { kick: vi.fn() },
    });

    const result = await service.manageMessages(
      { actorId: 'admin-1' },
      {
        action: 'markRead',
        items: [...stored.items]
          .sort((left, right) =>
            right.providerMessageId.localeCompare(left.providerMessageId),
          )
          .map((item) => ({
            accountId: item.accountId,
            messageId: item.id,
          })),
      },
    );

    expect(result).toMatchObject({ succeeded: 1, failed: 1 });
    expect(result.items).toEqual([
      expect.objectContaining({
        status: 'succeeded',
        messageId: expect.any(String),
      }),
      expect.objectContaining({
        status: 'failed',
        error: {
          code: 'MAIL_PROVIDER_TEMPORARY_FAILURE',
          category: 'network',
          retryable: true,
        },
      }),
    ]);
    const updated = await store.listMessages('user-1', {});
    expect(updated.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          providerMessageId: 'provider-management-success',
          read: true,
        }),
        expect.objectContaining({
          providerMessageId: 'provider-management-failure',
          read: false,
        }),
      ]),
    );
  });

  it('stores private notes and todo state without losing them on Provider sync', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [],
      messages: [message('provider-note', 'Remember this')],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'note-test-1' },
    });
    const stored = (await store.listMessages('user-1', {})).items[0];
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
      outbox: { kick: vi.fn() },
    });

    await expect(
      service.updateMessage(
        { actorId: 'user-1' },
        {
          accountId: 'account-1',
          messageId: stored.id,
          note: 'Follow up on Friday',
          todo: true,
        },
      ),
    ).resolves.toMatchObject({ note: 'Follow up on Friday', todo: true });
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [],
      messages: [
        { ...message('provider-note', 'Updated subject'), read: true },
      ],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'note-test-2' },
    });

    await expect(store.listMessages('user-1', {})).resolves.toMatchObject({
      items: [
        expect.objectContaining({
          note: 'Follow up on Friday',
          todo: true,
          subject: 'Updated subject',
        }),
      ],
    });
    await expect(service.getUnreadCount({ actorId: 'user-1' })).resolves.toBe(
      0,
    );
  });

  it('creates and applies NocoBase labels without calling a Provider', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [],
      messages: [message('provider-label', 'Label me')],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'label-test' },
    });
    const stored = (await store.listMessages('user-1', {})).items[0];
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
      outbox: { kick: vi.fn() },
    });

    const label = await service.createLabel(
      { actorId: 'user-1' },
      { name: 'Project', color: 'violet' },
    );
    expect(label).toMatchObject({ name: 'Project', color: 'violet' });
    await expect(
      service.updateLabel(
        { actorId: 'user-1' },
        { id: label.id, name: 'Projects', color: 'red' },
      ),
    ).resolves.toMatchObject({ name: 'Projects', color: 'red' });
    await expect(
      service.updateMessageLabels(
        { actorId: 'user-1' },
        {
          accountId: 'account-1',
          messageId: stored.id,
          addLabelIds: [label.id],
        },
      ),
    ).resolves.toMatchObject({
      folderIds: ['inbox'],
      labelIds: [label.id],
    });
    await expect(store.listLabels('user-1')).resolves.toEqual([
      expect.objectContaining({
        id: label.id,
        name: 'Projects',
        color: 'red',
      }),
    ]);
    await service.deleteLabel({ actorId: 'user-1' }, label.id);
    await expect(store.listMessages('user-1', {})).resolves.toMatchObject({
      items: [expect.objectContaining({ labelIds: [] })],
    });
  });

  it('selects a managed signature and supports cancelling and retrying sync', async () => {
    await store.replaceIdentities('account-1', [
      {
        id: 'identity-1',
        accountId: 'account-1',
        address: 'sender@example.com',
        isPrimary: true,
        canSend: true,
      },
      {
        id: 'identity-2',
        accountId: 'account-1',
        address: 'support@example.com',
        isPrimary: false,
        canSend: true,
      },
    ]);
    const setupService = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
      outbox: { kick: vi.fn() },
    });
    const signature = await setupService.saveSignature(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        name: 'Sales',
        text: 'Sales team',
      },
    );
    expect(signature).toMatchObject({
      isDefault: false,
      createdAt: expect.any(String),
    });
    const sendMessage = vi.fn<NonNullable<MailProviderAdapter['sendMessage']>>(
      async () => ({ status: 'accepted' }),
    );
    const service = new DefaultMailService({
      store,
      adapters: resolver({ ...baseAdapter(), sendMessage }),
      outbox: { kick: vi.fn() },
    });
    await service.sendMessage(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        identityId: 'identity-2',
        signatureId: signature.id,
        to: [{ address: 'reader@example.com' }],
        subject: 'Signed',
        text: 'Hello',
        idempotencyKey: 'signed-message',
      },
    );
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({ text: 'Hello\n\n-- \nSales team' }),
      }),
    );
    const alternate = await service.saveSignature(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        name: 'Support',
        text: 'Support team',
      },
    );
    await service.sendMessage(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        identityId: 'identity-1',
        signatureId: alternate.id,
        to: [{ address: 'reader@example.com' }],
        subject: 'Switched signature',
        text: 'Hello\n\n-- \nSales team',
        idempotencyKey: 'switched-signature',
      },
    );
    expect(sendMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          text: 'Hello\n\n-- \nSupport team',
        }),
      }),
    );
    await store.replaceIdentities('account-1', [
      {
        id: 'identity-1',
        accountId: 'account-1',
        address: 'sender@example.com',
        isPrimary: true,
        canSend: true,
      },
    ]);
    await expect(store.listSignatures('account-1')).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: signature.id, accountId: 'account-1' }),
        expect.objectContaining({ id: alternate.id, accountId: 'account-1' }),
      ]),
    );

    const run = await service.startSync(
      { actorId: 'user-1' },
      { accountId: 'account-1' },
    );
    await expect(
      service.cancelSyncRun({ actorId: 'user-1' }, run.id),
    ).resolves.toMatchObject({ status: 'cancelled' });
    await expect(
      service.retrySyncRun({ actorId: 'user-1' }, run.id),
    ).resolves.toMatchObject({ status: 'pending', accountId: 'account-1' });
  });

  it('moves a soft-deleted message to the local trash folder', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [
        {
          providerFolderId: 'trash',
          type: 'trash',
          name: 'Trash',
          kind: 'folder',
        },
      ],
      messages: [message('provider-soft-delete', 'Soft delete')],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'soft-delete-test' },
    });
    const stored = await store.listMessages('user-1', {});
    const moveMessage = vi.fn<NonNullable<MailProviderAdapter['moveMessage']>>(
      async () => ({
        ok: true,
        value: { providerMessageId: 'provider-soft-delete-moved' },
      }),
    );
    const deleteMessage = vi.fn<
      NonNullable<MailProviderAdapter['deleteMessage']>
    >(async () => ({ ok: true, value: undefined }));
    const service = new DefaultMailService({
      store,
      adapters: resolver({
        ...baseAdapter(),
        capabilities: { ...baseAdapter().capabilities, moveMessage: true },
        moveMessage,
        deleteMessage,
      }),
      outbox: { kick: vi.fn() },
    });

    await service.deleteMessage(
      { actorId: 'user-1' },
      { accountId: 'account-1', messageId: stored.items[0].id },
    );

    expect(moveMessage).toHaveBeenCalledWith(
      'provider-soft-delete',
      'trash',
      undefined,
    );
    expect(deleteMessage).not.toHaveBeenCalled();
    await expect(
      store.listMessages('user-1', { folderIds: ['trash'] }),
    ).resolves.toMatchObject({
      items: [
        expect.objectContaining({
          providerMessageId: 'provider-soft-delete-moved',
          folderIds: ['trash'],
        }),
      ],
    });
  });

  it.each(['personal', 'management'] as const)(
    'downloads only an attachment belonging to the %s message',
    async (scope) => {
      await store.commitSyncBatch({
        accountId: 'account-1',
        folders: [],
        messages: [
          {
            ...message('provider-with-attachment', 'Attachment'),
            attachments: [
              {
                providerAttachmentId: 'provider-attachment-1',
                fileName: 'report.pdf',
                contentType: 'application/pdf',
                size: 3,
                inline: false,
              },
            ],
          },
        ],
        deletedProviderMessageIds: [],
        nextCursor: { value: 'attachment-test' },
      });
      const stored = await store.listMessages('user-1', {});
      const messageDetails = await store.getMessage(
        'user-1',
        'account-1',
        stored.items[0].id,
      );
      const getAttachment = vi.fn<
        NonNullable<MailProviderAdapter['getAttachment']>
      >(async () => ({
        ok: true,
        value: {
          fileName: 'provider-name',
          contentType: 'application/octet-stream',
          size: 3,
          stream: streamOf('pdf'),
        },
      }));
      const close = vi.fn(async () => undefined);
      const service = new DefaultMailService({
        store,
        adapters: resolver({ ...baseAdapter(), getAttachment, close }),
        outbox: { kick: vi.fn() },
      });

      const getContent =
        scope === 'management'
          ? service.getManagedAttachment.bind(service)
          : service.getAttachment.bind(service);
      const actorId = scope === 'management' ? 'admin-user' : 'user-1';
      await expect(
        service.getAttachment(
          { actorId: 'admin-user' },
          'account-1',
          stored.items[0].id,
          messageDetails?.attachments[0].id ?? '',
        ),
      ).rejects.toThrow('Mail account was not found.');
      const content = await getContent(
        { actorId },
        'account-1',
        stored.items[0].id,
        messageDetails?.attachments[0].id ?? '',
      );

      expect(content).toMatchObject({
        fileName: 'report.pdf',
        contentType: 'application/pdf',
        size: 3,
      });
      expect(close).not.toHaveBeenCalled();
      expect(await new Response(content.stream).text()).toBe('pdf');
      expect(close).toHaveBeenCalledTimes(1);
      expect(getAttachment).toHaveBeenCalledWith(
        'provider-with-attachment',
        'provider-attachment-1',
        undefined,
      );
      await expect(
        getContent(
          { actorId },
          'account-1',
          stored.items[0].id,
          'other-attachment',
        ),
      ).rejects.toThrow('not found');
    },
  );

  // MAIL-DRAFT-001A/001B and MAIL-DRAFT-SRV-001/002: local-first drafts.
  it('saves a local draft without writing to the provider', async () => {
    const saveDraft = vi.fn<NonNullable<MailProviderAdapter['saveDraft']>>(
      async (input) => ({
        ok: true,
        value: {
          providerMessageId: 'provider-draft-1',
          providerFolderIds: ['drafts'],
          from: input.identity,
          to: input.message.to,
          cc: input.message.cc,
          bcc: input.message.bcc,
          replyTo: [],
          references: [],
          subject: input.message.subject,
          text: input.message.text,
          read: true,
          starred: false,
          draft: true,
          attachments: [],
        },
      }),
    );
    const service = new DefaultMailService({
      store,
      adapters: resolver({
        ...baseAdapter(),
        capabilities: { ...baseAdapter().capabilities, drafts: true },
        saveDraft,
      }),
      outbox: { kick: vi.fn() },
    });

    const draft = await service.saveDraft(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [],
        subject: 'Draft subject',
        text: 'Draft body',
        idempotencyKey: 'draft-request-1',
      },
    );

    expect(draft).toMatchObject({
      providerMessageId: expect.stringMatching(/^local-draft:/u),
      providerDraftMessageId: undefined,
      subject: 'Draft subject',
      draft: true,
    });
    await expect(store.listMessages('user-1', {})).resolves.toEqual({
      items: [],
    });
    await expect(
      store.listMessages('user-1', { folderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID] }),
    ).resolves.toMatchObject({
      items: [
        expect.objectContaining({
          providerDraftMessageId: undefined,
          providerMessageId: expect.stringMatching(/^local-draft:/u),
        }),
      ],
    });
  });

  it.each([undefined, ['account-1']])(
    'excludes local and synchronized drafts before paginating personal all mail (accounts: %j)',
    async (accountIds) => {
      await store.commitSyncBatch({
        accountId: 'account-1',
        folders: [
          {
            providerFolderId: 'drafts',
            type: 'drafts',
            name: 'Drafts',
            kind: 'folder',
          },
        ],
        messages: [],
        deletedProviderMessageIds: [],
        nextCursor: { value: 'cursor-1' },
      });
      for (const [id, day, draft, folder] of [
        ['received', '01', false, 'inbox'],
        ['sent', '02', false, 'sent'],
        ['remote-draft', '03', true, 'drafts'],
        ['local-draft:local', '04', true, MAIL_LOCAL_DRAFT_FOLDER_ID],
      ] as const) {
        await store.saveMessage('account-1', {
          ...message(id, id),
          providerFolderIds: [folder],
          conversationId: 'conversation-with-draft',
          receivedAt: `2026-09-03T00:00:${day}.000Z`,
          draft,
        });
      }

      const first = await store.listMessages('user-1', {
        accountIds,
        limit: 1,
      });
      expect(first.items.map((item) => item.providerMessageId)).toEqual([
        'sent',
      ]);
      expect(first.nextCursor).toBeDefined();
      const second = await store.listMessages('user-1', {
        accountIds,
        limit: 1,
        cursor: first.nextCursor,
      });
      expect(second.items.map((item) => item.providerMessageId)).toEqual([
        'received',
      ]);
      expect(second.nextCursor).toBeUndefined();
      const drafts = await store.listMessages('user-1', {
        folderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID],
      });
      expect(drafts.items.map((item) => item.providerMessageId)).toEqual([
        'local-draft:local',
        'remote-draft',
      ]);
      const providerDrafts = await store.listMessages('user-1', {
        folderIds: ['drafts'],
      });
      expect(
        providerDrafts.items.map((item) => item.providerMessageId).sort(),
      ).toEqual(['local-draft:local', 'remote-draft']);
      expect((await store.listAllMessages({})).items).toHaveLength(4);
    },
  );

  it.each(
    [
      ['inbox'],
      ['sent'],
      ['trash'],
      ['junk'],
      ['archive'],
      ['custom'],
      ['inbox', 'sent'],
      ['__nocobase_default_inbox__'],
      ['__nocobase_default_sent__'],
      ['__nocobase_default_trash__'],
      ['__nocobase_default_junk__'],
      ['__nocobase_default_archive__'],
    ].map((folderIds) => ({ folderIds })),
  )(
    'excludes drafts from non-draft folders before pagination ($folderIds)',
    async ({ folderIds }) => {
      const types = [
        'inbox',
        'sent',
        'trash',
        'junk',
        'archive',
        'custom',
      ] as const;
      await store.commitSyncBatch({
        accountId: 'account-1',
        folders: types.map((type) => ({
          providerFolderId: type,
          type,
          name: type,
          kind: 'folder',
        })),
        messages: [
          { ...message('received', 'Received'), providerFolderIds: types },
          {
            ...message('remote-draft', 'Draft'),
            providerFolderIds: types,
            draft: true,
            receivedAt: '2026-09-04T00:00:00.000Z',
          },
          {
            ...message('local-draft:local', 'Local draft'),
            providerFolderIds: types,
            draft: true,
            receivedAt: '2026-09-05T00:00:00.000Z',
          },
        ],
        deletedProviderMessageIds: [],
        nextCursor: { value: 'cursor-1' },
      });

      const page = await store.listMessages('user-1', {
        folderIds,
        limit: 1,
        withTotal: true,
      });
      expect(page.total).toBe(1);
      const managed = await store.listAllMessages({
        folderIds,
        limit: 1,
        withTotal: true,
      });
      expect(managed.total).toBe(3);
      expect(page.items.map((item) => item.providerMessageId)).toEqual([
        'received',
      ]);
      expect(page.nextCursor).toBeUndefined();
    },
  );

  it('allows drafts only through a matching draft folder in the same account', async () => {
    await store.saveAccount({
      ...account(),
      id: 'account-2',
      address: 'second@example.com',
    });
    for (const accountId of ['account-1', 'account-2']) {
      await store.commitSyncBatch({
        accountId,
        folders: [
          {
            providerFolderId: 'shared-folder',
            type: accountId === 'account-1' ? 'drafts' : 'custom',
            name: 'Shared',
            kind: 'folder',
          },
          {
            providerFolderId: 'inbox',
            type: 'inbox',
            name: 'Inbox',
            kind: 'folder',
          },
        ],
        messages: [
          {
            ...message('draft-in-both', 'Draft'),
            draft: true,
            providerFolderIds: ['shared-folder', 'inbox'],
          },
          { ...message('draft-in-inbox', 'Draft'), draft: true },
          message('received', 'Received'),
        ],
        deletedProviderMessageIds: [],
        nextCursor: { value: 'cursor-1' },
      });
    }

    const page = await store.listMessages('user-1', {
      folderIds: ['shared-folder', 'inbox'],
    });
    expect(page.items.filter((item) => item.draft)).toMatchObject([
      { accountId: 'account-1', providerMessageId: 'draft-in-both' },
    ]);
    expect(page.items.filter((item) => !item.draft)).toHaveLength(2);
    expect(
      (
        await store.listMessages('user-1', {
          folderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID],
        })
      ).items,
    ).toHaveLength(4);
    expect((await store.listAllMessages({})).items).toHaveLength(6);
  });

  it('keeps a local draft when the Provider has no draft capability', async () => {
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
      outbox: { kick: vi.fn() },
    });

    const draft = await service.saveDraft(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [],
        subject: 'Local draft',
        text: 'Saved locally',
        idempotencyKey: 'local-draft-request-1',
      },
    );

    expect(draft.providerMessageId).toMatch(/^local-draft:/u);
    expect(draft.folderIds).toEqual([MAIL_LOCAL_DRAFT_FOLDER_ID]);
    await expect(
      store.listMessages('user-1', { folderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID] }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ id: draft.id })],
    });
  });

  it.each([
    { scheduled: false, legacy: false, inline: false },
    { scheduled: false, legacy: false, inline: true },
    { scheduled: true, legacy: false, inline: true },
    { scheduled: true, legacy: false },
    { scheduled: false, legacy: true },
    { scheduled: true, legacy: true },
  ])(
    'sends retained local draft attachment bytes (scheduled: $scheduled, legacy: $legacy)',
    async ({ scheduled, legacy, inline = false }) => {
      const content = new TextEncoder().encode('draft attachment');
      const metadata = {
        id: 'upload-1',
        userId: 'user-1',
        disk: 'local',
        key: 'mail/upload-1',
        fileName: 'note.txt',
        contentType: inline ? 'image/png' : 'text/plain',
        size: content.length,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      await store.createOutboundAttachment(metadata);
      const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(
        async () => ({
          status: 'accepted',
        }),
      );
      const attachmentStorage = {
        create: vi.fn(),
        cleanupExpired: vi.fn(),
        open: vi.fn(async () => ({
          attachment: metadata,
          stream: new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(content);
              controller.close();
            },
          }),
        })),
      };
      const service = new DefaultMailService({
        store,
        adapters: resolver({ ...baseAdapter(), sendMessage }),
        outboundAttachments: attachmentStorage,
      });
      const input = {
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [{ address: 'recipient@example.com' }],
        subject: 'Attachment',
        text: 'Body',
        html: inline
          ? '<img src="cid:nocobase-upload-1@mail.inline" width="320" height="160">'
          : undefined,
        idempotencyKey: 'draft-with-attachment',
        attachmentIds: ['upload-1'],
      };
      const draft = await service.saveDraft({ actorId: 'user-1' }, input);
      expect(draft.attachments).toHaveLength(1);
      expect(draft.attachments[0].inline).toBe(inline);
      if (inline) expect(draft.html).toBe(input.html);
      if (legacy) {
        await store.saveMessage('account-1', {
          ...message(draft.providerMessageId, draft.subject),
          draft: true,
          attachments: draft.attachments.map(
            ({ outboundAttachmentId: _outboundAttachmentId, ...attachment }) =>
              attachment,
          ),
        });
      }
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.now() + 86400000 + 1000);
      expect(
        await store.getOutboundAttachment('user-1', 'upload-1'),
      ).toBeDefined();
      expect(
        await store.listExpiredOutboundAttachments(
          new Date().toISOString(),
          100,
        ),
      ).toEqual([]);
      const reopened = await store.getMessage('user-1', 'account-1', draft.id);
      const downloaded = await service.getAttachment(
        { actorId: 'user-1' },
        'account-1',
        draft.id,
        reopened!.attachments[0].id,
      );
      expect(await new Response(downloaded.stream).text()).toBe(
        'draft attachment',
      );
      let result = await service.sendMessage(
        { actorId: 'user-1' },
        {
          ...input,
          scheduledAt: scheduled
            ? new Date(Date.now() + 2 * 86400000).toISOString()
            : undefined,
          idempotencyKey: 'send-draft-with-attachment',
          draftMessageId: draft.id,
          attachmentIds: [],
          retainedAttachmentIds: reopened!.attachments.map((item) => item.id),
        },
      );
      if (scheduled) {
        expect(result.status).toBe('pending');
        expect(sendMessage).not.toHaveBeenCalled();
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(Date.now() + 2 * 86400000 + 1000);
        const persisted = await store.getScheduledSubmission(result.id);
        result = await new SendMailOperation({
          store,
          adapters: resolver({ ...baseAdapter(), sendMessage }),
          outboundAttachments: attachmentStorage,
        }).execute({ actorId: 'user-1' }, persisted!.input, {
          scheduledDelivery: true,
        });
      }
      expect(result.status).toBe('accepted');
      const sent = sendMessage.mock.calls[0][0].message;
      expect(sent.attachments).toHaveLength(1);
      expect(sent.attachments[0].inline).toBe(inline);
      if (inline) expect(sent.html).toContain('width="320" height="160"');
      if (inline)
        expect(sent.attachments[0].contentId).toBe(
          'nocobase-upload-1@mail.inline',
        );
      expect(sent.retainedProviderAttachmentIds).toEqual([]);
      expect(await new Response(await sent.attachments[0].open()).text()).toBe(
        'draft attachment',
      );
    },
  );

  it('pages cleanup past retained uploads and releases them when the draft is deleted', async () => {
    const now = new Date().toISOString();
    const upload = {
      id: 'upload-a',
      userId: 'user-1',
      disk: 'local',
      key: 'a',
      fileName: 'a.txt',
      contentType: 'text/plain',
      size: 1,
      createdAt: now,
      expiresAt: now,
    };
    await store.createOutboundAttachment(upload);
    await store.createOutboundAttachment({
      ...upload,
      id: 'upload-b',
      key: 'b',
    });
    const draft = await store.saveMessage('account-1', {
      ...message('local-draft:cleanup', 'Retained upload'),
      draft: true,
      attachments: [
        {
          providerAttachmentId: upload.id,
          outboundAttachmentId: upload.id,
          fileName: upload.fileName,
          contentType: upload.contentType,
          size: upload.size,
          inline: false,
        },
      ],
    });
    expect(
      await store.getOutboundAttachment('user-1', upload.id),
    ).toBeDefined();
    expect(
      await store.getOutboundAttachment('other-user', upload.id),
    ).toBeUndefined();
    expect(await store.listExpiredOutboundAttachments(now, 1)).toEqual([
      expect.objectContaining({ id: 'upload-b' }),
    ]);
    await store.deleteMessage('account-1', draft.id);
    expect(
      await store.getOutboundAttachment('user-1', upload.id),
    ).toBeUndefined();
    expect(await store.listExpiredOutboundAttachments(now, 1)).toEqual([
      expect.objectContaining({ id: 'upload-a' }),
    ]);
  });

  it('saves locally even when provider draft operations are unavailable', async () => {
    const saveDraft = vi.fn<NonNullable<MailProviderAdapter['saveDraft']>>(
      async () => ({
        ok: false,
        error: {
          code: 'TEST_DRAFT_MIRROR_FAILED',
          message: 'Remote drafts are temporarily unavailable.',
          category: 'network',
          retryable: true,
        },
      }),
    );
    const adapter = {
      ...baseAdapter(),
      capabilities: { ...baseAdapter().capabilities, drafts: true },
      saveDraft,
    };
    const service = new DefaultMailService({
      store,
      adapters: resolver(adapter),
      outbox: { kick: vi.fn() },
    });

    const draft = await service.saveDraft(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [],
        subject: 'Mirror failure',
        text: 'Keep this locally',
        idempotencyKey: 'local-draft-request-2',
      },
    );

    expect(draft.providerMessageId).toMatch(/^local-draft:/u);
    expect(draft.text).toBe('Keep this locally');
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it('uses remote draft IDs for mutations and keeps local-only draft state local', async () => {
    const setStarred = vi.fn<NonNullable<MailProviderAdapter['setStarred']>>(
      async () => ({ ok: true, value: undefined }),
    );
    const moveMessage = vi.fn<NonNullable<MailProviderAdapter['moveMessage']>>(
      async () => ({ ok: true, value: { providerMessageId: 'moved-remote' } }),
    );
    const adapters = resolver({
      ...baseAdapter(),
      setStarred,
      moveMessage,
      capabilities: { ...baseAdapter().capabilities, moveMessage: true },
    });
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick: vi.fn() },
    });
    for (const remote of [undefined, 'current-remote']) {
      const draft = await store.saveMessage('account-1', {
        ...message(`local-draft:${remote ?? 'new'}`, 'Draft'),
        draft: true,
        providerDraftMessageId: remote,
      });
      const updated = await service.updateMessage(
        { actorId: 'user-1' },
        { accountId: 'account-1', messageId: draft.id, starred: true },
      );
      expect(updated.starred).toBe(true);
      if (remote) {
        expect(setStarred).toHaveBeenCalledWith(remote, true, undefined);
        await store.saveFolder('account-1', {
          providerFolderId: 'drafts',
          name: 'Drafts',
          type: 'drafts',
          kind: 'folder',
        });
        const moved = await service.moveMessage(
          { actorId: 'user-1' },
          {
            accountId: 'account-1',
            messageId: draft.id,
            providerFolderId: 'drafts',
          },
        );
        expect(moveMessage).toHaveBeenCalledWith(remote, 'drafts', undefined);
        expect(moved.providerMessageId).toBe(draft.providerMessageId);
        expect(moved.providerDraftMessageId).toBe('moved-remote');
      } else expect(setStarred).not.toHaveBeenCalled();
    }
  });

  it('localizes imported Gmail drafts without remote writes or duplicate sync copies', async () => {
    let remote: NormalizedMailMessage = {
      ...message('gmail-0', 'Original'),
      from: { address: 'sender@example.com' },
      draft: true,
      providerDraftId: 'stable-draft',
      attachments: [
        {
          providerAttachmentId: 'part-0',
          fileName: 'file.txt',
          contentType: 'text/plain',
          size: 3,
          inline: false,
        },
      ],
    };
    const initial = await store.saveMessage('account-1', remote);
    let revision = 0;
    const updateDraft = vi.fn<NonNullable<MailProviderAdapter['updateDraft']>>(
      async (draftId, input) => {
        expect(draftId).toBe('stable-draft');
        expect(input.message.draftProviderMessageId).toBe(
          remote.providerMessageId,
        );
        expect(input.message.retainedProviderAttachmentIds).toEqual([
          `part-${revision}`,
        ]);
        revision += 1;
        remote = {
          ...remote,
          providerMessageId: `gmail-${revision}`,
          subject: input.message.subject,
          text: input.message.text,
          attachments: [
            {
              ...remote.attachments[0],
              providerAttachmentId: `part-${revision}`,
            },
          ],
        };
        return { ok: true, value: remote };
      },
    );
    const getMessage = vi.fn<NonNullable<MailProviderAdapter['getMessage']>>(
      async (id) => {
        expect(id).toBe(remote.providerMessageId);
        return { ok: true, value: remote };
      },
    );
    const getAttachment = vi.fn<
      NonNullable<MailProviderAdapter['getAttachment']>
    >(async (id, part) => {
      expect(id).toBe(remote.providerMessageId);
      expect(part).toBe(`part-${revision}`);
      return {
        ok: true,
        value: {
          fileName: 'file.txt',
          contentType: 'text/plain',
          size: 3,
          stream: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('abc'));
              controller.close();
            },
          }),
        },
      };
    });
    const sendMessage = vi.fn<NonNullable<MailProviderAdapter['sendMessage']>>(
      async (input) => {
        expect(input.message.draftProviderMessageId).toBeUndefined();
        expect(input.message.retainedProviderAttachmentIds).toEqual([]);
        expect(
          await new Response(await input.message.attachments[0].open()).text(),
        ).toBe('abc');
        return { status: 'accepted', providerMessageId: 'sent-message' };
      },
    );
    const adapters = resolver({
      ...baseAdapter(),
      capabilities: { ...baseAdapter().capabilities, drafts: true },
      saveDraft: async () => ({ ok: true, value: remote }),
      updateDraft,
      sendMessage,
      getMessage,
      getAttachment,
    });
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick: vi.fn() },
    });
    const input = {
      accountId: 'account-1',
      identityId: 'identity-1',
      to: remote.to,
      subject: 'Edited',
      text: 'Body',
      draftMessageId: initial.id,
      idempotencyKey: 'edit',
    };
    for (let index = 1; index <= 2; index++) {
      const saved = await service.saveDraft({ actorId: 'user-1' }, input);
      expect(updateDraft).not.toHaveBeenCalled();
      expect(saved.id).toBe(initial.id);
      expect(saved.providerDraftMessageId).toBe('gmail-0');
      expect(saved.attachments[0].providerAttachmentId).toBe('part-0');
      await store.commitSyncBatch({
        accountId: 'account-1',
        folders: [],
        messages: [remote],
        deletedProviderMessageIds: [`gmail-${index - 1}`],
        nextCursor: { value: String(index) },
      });
      expect(
        (
          await store.listMessages('user-1', {
            folderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID],
          })
        ).items.map((item) => item.id),
      ).toEqual([initial.id]);
      expect(
        await store.getMessage('user-1', 'account-1', initial.id),
      ).toBeDefined();
    }
    const content = await service.getAttachment(
      { actorId: 'user-1' },
      'account-1',
      initial.id,
      'part-0',
    );
    expect(await new Response(content.stream).text()).toBe('abc');
    const prepared = await new SendMailOperation({
      store,
      adapters,
    }).prepareProviderMessage({ actorId: 'user-1' }, input);
    expect(prepared.draftProviderMessageId).toBe('gmail-0');
    expect(prepared.retainedProviderAttachmentIds).toEqual(['part-0']);
    const sent = await new SendMailOperation({
      store,
      adapters,
      outboundAttachments: {
        create: async (_userId, file) => {
          const upload = {
            id: 'copied-import',
            userId: 'user-1',
            fileName: file.fileName,
            contentType: file.contentType,
            size: file.size,
            disk: 'local',
            key: 'copied-import',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          };
          await store.createOutboundAttachment(upload);
          return upload;
        },
        open: async () => ({
          attachment: (await store.getOutboundAttachment(
            'user-1',
            'copied-import',
          ))!,
          stream: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('abc'));
              controller.close();
            },
          }),
        }),
        cleanupExpired: async () => 0,
      },
    }).execute(
      { actorId: 'user-1' },
      {
        ...input,
        to: [{ address: 'recipient@example.com' }],
        idempotencyKey: 'send-revised-draft',
      },
    );
    expect(sent.status).toBe('accepted');
    expect(sendMessage).toHaveBeenCalledOnce();
    expect(
      await store.getMessage('user-1', 'account-1', initial.id),
    ).toBeUndefined();
  });

  it.each(['html', 'signature'] as const)(
    'saves a %s draft locally without remote conflict checks',
    async (kind) => {
      let remote: NormalizedMailMessage;
      const write = vi.fn<NonNullable<MailProviderAdapter['saveDraft']>>(
        async (input) => {
          remote = {
            ...message('remote-draft-1', input.message.subject),
            from: { address: input.identity.address },
            to: input.message.to,
            cc: input.message.cc,
            bcc: input.message.bcc,
            text: kind === 'html' ? undefined : input.message.text,
            html: input.message.html,
            draft: true,
            providerDraftId: 'remote-draft-1',
          };
          return { ok: true, value: remote };
        },
      );
      const updateDraft = vi.fn<
        NonNullable<MailProviderAdapter['updateDraft']>
      >(async (_id, input) => write(input));
      const adapters = resolver({
        ...baseAdapter(),
        capabilities: { ...baseAdapter().capabilities, drafts: true },
        saveDraft: write,
        updateDraft,
        getMessage: async () => ({ ok: true, value: remote }),
      });
      const service = new DefaultMailService({
        store,
        adapters,
        outbox: { kick: vi.fn() },
      });
      if (kind === 'signature')
        await service.saveSignature(
          { actorId: 'user-1' },
          {
            accountId: 'account-1',
            name: 'Default',
            text: 'Signature',
            isDefault: true,
          },
        );
      const input = {
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [],
        subject: 'Local',
        text: 'Body',
        html: kind === 'html' ? '<p>Body</p>' : undefined,
        idempotencyKey: 'draft',
      };
      const initial = await service.saveDraft({ actorId: 'user-1' }, input);
      // Recreate both the service and store to prove the baseline survives a restart.
      const resumed = new DefaultMailService({
        store: createDatabaseMailStore(database),
        adapters,
        outbox: { kick: vi.fn() },
      });
      const edited = await resumed.saveDraft(
        { actorId: 'user-1' },
        {
          ...input,
          text: 'Edited',
          html: kind === 'html' ? '<p>Edited</p>' : undefined,
          draftMessageId: initial.id,
        },
      );
      expect(edited.draftConflict).toBeUndefined();
      expect(updateDraft).not.toHaveBeenCalled();
      remote = { ...remote!, subject: 'External edit' };
      const conflicted = await resumed.saveDraft(
        { actorId: 'user-1' },
        { ...input, draftMessageId: initial.id },
      );
      expect(conflicted.draftConflict).toBeUndefined();
      expect(updateDraft).not.toHaveBeenCalled();
      const resolved = await resumed.saveDraft(
        { actorId: 'user-1' },
        { ...input, draftMessageId: initial.id },
      );
      expect(resolved.draftConflict).toBeUndefined();
      expect(updateDraft).not.toHaveBeenCalled();
    },
  );

  it('keeps editing locally when the provider draft changes', async () => {
    const saveDraft = vi.fn<NonNullable<MailProviderAdapter['saveDraft']>>(
      async (input) => ({
        ok: true,
        value: {
          providerMessageId: 'remote-draft-message-1',
          providerDraftId: 'remote-draft-1',
          providerFolderIds: ['drafts'],
          from: input.identity,
          to: input.message.to,
          cc: input.message.cc,
          bcc: input.message.bcc,
          replyTo: [],
          references: [],
          subject: input.message.subject,
          text: input.message.text,
          read: true,
          starred: false,
          draft: true,
          attachments: [],
        },
      }),
    );
    const updateDraft = vi.fn<NonNullable<MailProviderAdapter['updateDraft']>>(
      async () => {
        throw new Error('should not overwrite the remote conflict');
      },
    );
    const getMessage = vi.fn<NonNullable<MailProviderAdapter['getMessage']>>(
      async () => ({
        ok: true,
        value: {
          ...message('remote-draft-message-1', 'Remote subject'),
          providerDraftId: 'remote-draft-1',
          draft: true,
          text: 'Remote body',
        },
      }),
    );
    const adapter = {
      ...baseAdapter(),
      capabilities: { ...baseAdapter().capabilities, drafts: true },
      saveDraft,
      updateDraft,
      getMessage,
    };
    const service = new DefaultMailService({
      store,
      adapters: resolver(adapter),
      outbox: { kick: vi.fn() },
    });
    const initial = await service.saveDraft(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [],
        subject: 'Local subject',
        text: 'Local body',
        idempotencyKey: 'conflict-initial',
      },
    );

    const conflicted = await service.saveDraft(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [],
        subject: 'New local subject',
        text: 'New local body',
        draftMessageId: initial.id,
        idempotencyKey: 'conflict-update',
      },
    );

    expect(conflicted.subject).toBe('New local subject');
    expect(conflicted.draftConflict).toBeUndefined();
    expect(updateDraft).not.toHaveBeenCalled();
    expect(conflicted.subject).toBe('New local subject');
  });

  // MAIL-ACCOUNT-013/015/016/017 and MAIL-MANAGE-001/005: account lifecycle.
  it('updates account lifecycle and removes an account without account defaults', async () => {
    await store.saveAccount({
      ...account(),
      id: 'account-2',
      address: 'secondary@example.com',
      credentialReference: 'secret:secondary',
    });
    const deleteCredential = vi.fn(async () => undefined);
    const deletePushSubscription = vi.fn<
      NonNullable<MailProviderAdapter['deletePushSubscription']>
    >(async () => ({ ok: true, value: undefined }));
    const credentials = {
      delete: deleteCredential,
    } as unknown as MailCredentialVault;
    const service = new DefaultMailService({
      store,
      adapters: resolver({ ...baseAdapter(), deletePushSubscription }),
      outbox: { kick: vi.fn() },
      credentials,
    });

    await expect(
      service.updateAccount(
        { actorId: 'user-1' },
        { accountId: 'account-1', status: 'suspended' },
      ),
    ).resolves.toMatchObject({ status: 'suspended' });
    await expect(
      service.updateAccount(
        { actorId: 'user-1' },
        { accountId: 'account-1', status: 'active' },
      ),
    ).resolves.toMatchObject({ status: 'active' });
    await store.saveAccount({
      ...account(),
      initialSyncReceivedAfter: '2026-02-01T00:00:00.000Z',
    });
    const accountSync = await service.startSync(
      { actorId: 'user-1' },
      { accountId: 'account-1' },
    );
    expect(accountSync.policy.receivedAfter).toBe('2026-02-01T00:00:00.000Z');
    await store.savePushSubscription({
      accountId: 'account-2',
      provider: account().provider,
      providerSubscriptionId: 'push-account-2',
      configurationFingerprint: 'disconnect-fingerprint',
      renewAfter: '2099-01-01T00:00:00.000Z',
      expiresAt: '2099-01-02T00:00:00.000Z',
      updatedAt: '2026-09-07T00:00:00.000Z',
    });

    await service.removeAccount({ actorId: 'user-1' }, 'account-2');
    await drainRemoval('account-2', {
      credentials,
      adapters: resolver({ ...baseAdapter(), deletePushSubscription }),
    });

    expect(deletePushSubscription).toHaveBeenCalledWith(
      'push-account-2',
      expect.any(AbortSignal),
    );
    expect(deleteCredential).toHaveBeenCalledWith('secret:secondary');
    await expect(service.listAccounts({ actorId: 'user-1' })).resolves.toEqual([
      expect.objectContaining({ id: 'account-1' }),
    ]);
  });

  it('removes an account while cancelling its pending synchronization', async () => {
    const run = await store.createSyncRun({
      id: 'remove-account-sync',
      accountId: 'account-1',
      requestedBy: 'user-1',
      mode: 'initial',
      policy: { maxMessages: 100, batchSize: 10 },
    });
    const cancelSyncRun = vi.spyOn(store, 'cancelSyncRun');
    const deleteCredential = vi.fn(async () => undefined);
    const credentials = {
      delete: deleteCredential,
    } as unknown as MailCredentialVault;
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
      outbox: { kick: vi.fn() },
      credentials,
    });

    await expect(
      service.removeAccount({ actorId: 'user-1' }, 'account-1'),
    ).resolves.toMatchObject({ id: 'account-1', status: 'removing' });

    await drainRemoval('account-1', { credentials });
    expect(cancelSyncRun).toHaveBeenCalledWith(run.id);
    const cancellation = cancelSyncRun.mock.results[0];
    expect(cancellation?.type).toBe('return');
    if (cancellation?.type === 'return') {
      await expect(cancellation.value).resolves.toMatchObject({
        status: 'cancelled',
      });
    }
    await expect(store.getAccount('account-1')).resolves.toBeUndefined();
    await expect(store.getSyncRun(run.id)).resolves.toBeUndefined();
    expect(deleteCredential).toHaveBeenCalledWith('secret:test');
  });

  it('does not schedule synchronization after account removal starts', async () => {
    await expect(
      store.markAccountRemoving('account-1', 'user-1'),
    ).resolves.toBe(true);
    await expect(
      store.markAccountRemoving('account-1', 'user-1'),
    ).resolves.toBe(true);

    await expect(
      store.createSyncRun({
        id: 'sync-after-removal',
        accountId: 'account-1',
        requestedBy: 'user-1',
        mode: 'initial',
        policy: { maxMessages: 100, batchSize: 10 },
      }),
    ).rejects.toThrow('Mail account is not active.');
  });

  it('lets an in-flight synchronization finish quietly after account removal', async () => {
    const entered = Promise.withResolvers<void>();
    const providerGate = Promise.withResolvers<void>();
    const adapters = resolver({
      ...baseAdapter(),
      getCurrentSyncCursor: async () => {
        entered.resolve();
        await providerGate.promise;
        return { ok: true, value: { value: 'watermark-after-removal' } };
      },
      listMessages: async () => ({ ok: true, value: { messages: [] } }),
    });
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick: vi.fn() },
    });
    const created = await service.startSync(
      { actorId: 'user-1' },
      { accountId: 'account-1' },
    );
    const outbox = await store.claimOutbox(
      new Date().toISOString(),
      'remove-in-flight-lease',
      new Date(Date.now() + 10_000).toISOString(),
      1,
    );
    await store.markOutboxPublished(
      outbox[0].id,
      outbox[0].leaseToken ?? '',
      new Date().toISOString(),
    );
    const operation = new SyncMailboxOperation({ store, adapters });
    const running = operation.execute(outbox[0].payload);

    await entered.promise;
    await service.removeAccount({ actorId: 'user-1' }, 'account-1');
    await drainRemoval('account-1');
    providerGate.resolve();

    await expect(running).resolves.toBeUndefined();
    await expect(store.getAccount('account-1')).resolves.toBeUndefined();
    await expect(store.getSyncRun(created.id)).resolves.toBeUndefined();
  });

  it('does not resurrect a removed account after an in-flight auth failure', async () => {
    const entered = Promise.withResolvers<void>();
    const providerGate = Promise.withResolvers<void>();
    const adapters = resolver({
      ...baseAdapter(),
      getCurrentSyncCursor: async () => {
        entered.resolve();
        await providerGate.promise;
        return {
          ok: false,
          error: {
            code: 'TEST_OAUTH_INVALID_GRANT',
            message: 'The refresh token was revoked.',
            category: 'authentication',
            retryable: false,
          },
        } as const;
      },
      listMessages: async () => ({ ok: true, value: { messages: [] } }),
    });
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick: vi.fn() },
    });
    const created = await service.startSync(
      { actorId: 'user-1' },
      { accountId: 'account-1' },
    );
    const outbox = await store.claimOutbox(
      new Date().toISOString(),
      'remove-auth-failure-lease',
      new Date(Date.now() + 10_000).toISOString(),
      1,
    );
    await store.markOutboxPublished(
      outbox[0].id,
      outbox[0].leaseToken ?? '',
      new Date().toISOString(),
    );
    const operation = new SyncMailboxOperation({ store, adapters });
    const running = operation.execute(outbox[0].payload);

    await entered.promise;
    await service.removeAccount({ actorId: 'user-1' }, 'account-1');
    await drainRemoval('account-1');
    providerGate.resolve();

    await expect(running).resolves.toBeUndefined();
    await expect(store.getAccount('account-1')).resolves.toBeUndefined();
    await expect(store.getSyncRun(created.id)).resolves.toBeUndefined();
  });

  it('lists every account for management without granting cross-user sync', async () => {
    await store.saveAccount({
      ...account(),
      id: 'account-2',
      userId: 'user-2',
      address: 'other@example.com',
    });
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
      outbox: { kick: vi.fn() },
    });
    await store.createSyncRun({
      id: 'sync-account-2',
      accountId: 'account-2',
      requestedBy: 'user-2',
      mode: 'initial',
      policy: { maxMessages: 100, batchSize: 20 },
    });
    await store.createSubmission(
      {
        id: 'submission-account-2',
        accountId: 'account-2',
        status: 'accepted',
      },
      'operation-log-test',
      'operation-log-test-fingerprint',
    );

    await expect(
      service.listManagedAccounts({ actorId: 'user-1' }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'account-1',
        userId: 'user-1',
        canSync: true,
      }),
      expect.objectContaining({
        id: 'account-2',
        userId: 'user-2',
        canSync: false,
      }),
    ]);
    await expect(
      service.listManagedSyncRunsPage({ actorId: 'user-1' }, 0, 20),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({ accountId: 'account-2', canManage: false }),
      ],
      total: 1,
    });
    await expect(
      service.listManagedSubmissionsPage({ actorId: 'user-1' }, 0, 20),
    ).resolves.toEqual({
      items: [expect.objectContaining({ accountId: 'account-2' })],
      total: 1,
    });
    // A page past the end is empty but still reports the total, rather than truncating silently.
    await expect(
      service.listManagedSubmissionsPage({ actorId: 'user-1' }, 1, 20),
    ).resolves.toEqual({ items: [], total: 1 });
    await expect(
      service.listManagedFolders({ actorId: 'user-1' }, 'missing-account'),
    ).rejects.toMatchObject({
      status: 'NOT_FOUND',
      reason: 'MAIL_ACCOUNT_NOT_FOUND',
    });
  });

  // MAIL-SEND-SRV-001/002, MAIL-API-008/009, and MAIL-DATA-004: recovery fences.
  it('resumes a pending submission after interruption before claiming', async () => {
    const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(async () => ({
      status: 'accepted',
      providerMessageId: 'provider-sent-after-resume',
    }));
    const claim = vi.spyOn(store, 'claimSubmission');
    claim.mockResolvedValueOnce(false);
    const service = new DefaultMailService({
      store,
      adapters: resolver({ ...baseAdapter(), sendMessage }),
      outbox: { kick: vi.fn() },
    });
    const input = {
      accountId: 'account-1',
      identityId: 'identity-1',
      to: [{ address: 'recipient@example.com' }],
      subject: 'Resume me',
      text: 'Mail body',
      idempotencyKey: 'interrupted-before-claim',
    } as const;

    const interrupted = await service.sendMessage({ actorId: 'user-1' }, input);
    const resumed = await service.sendMessage({ actorId: 'user-1' }, input);

    expect(interrupted.status).toBe('pending');
    expect(resumed).toMatchObject({
      status: 'accepted',
      providerMessageId: 'provider-sent-after-resume',
    });
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it('rejects reuse of an idempotency key for different content', async () => {
    const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(async () => ({
      status: 'accepted',
      providerMessageId: 'provider-sent-1',
    }));
    const service = new DefaultMailService({
      store,
      adapters: resolver({ ...baseAdapter(), sendMessage }),
      outbox: { kick: vi.fn() },
    });
    const input = {
      accountId: 'account-1',
      identityId: 'identity-1',
      to: [{ address: 'recipient@example.com' }],
      subject: 'First content',
      text: 'Mail body',
      idempotencyKey: 'request-conflict',
    } as const;

    await service.sendMessage({ actorId: 'user-1' }, input);

    await expect(
      service.sendMessage(
        { actorId: 'user-1' },
        { ...input, subject: 'Different content' },
      ),
    ).rejects.toThrow('idempotency key');
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it('treats a changed signature as different idempotent content', async () => {
    const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(async () => ({
      status: 'accepted',
      providerMessageId: 'provider-sent-1',
    }));
    const service = new DefaultMailService({
      store,
      adapters: resolver({ ...baseAdapter(), sendMessage }),
      outbox: { kick: vi.fn() },
    });
    const input = {
      accountId: 'account-1',
      identityId: 'identity-1',
      signatureId: null,
      to: [{ address: 'recipient@example.com' }],
      subject: 'Same content',
      text: 'Mail body',
      idempotencyKey: 'signature-conflict',
    } as const;

    await service.sendMessage({ actorId: 'user-1' }, input);

    await expect(
      service.sendMessage(
        { actorId: 'user-1' },
        { ...input, signatureId: 'signature-1' },
      ),
    ).rejects.toThrow('idempotency key');
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it('distinguishes the default signature from explicitly selecting none', async () => {
    const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(async () => ({
      status: 'accepted',
      providerMessageId: 'provider-sent-1',
    }));
    const service = new DefaultMailService({
      store,
      adapters: resolver({ ...baseAdapter(), sendMessage }),
      outbox: { kick: vi.fn() },
    });
    const input = {
      accountId: 'account-1',
      identityId: 'identity-1',
      to: [{ address: 'recipient@example.com' }],
      subject: 'Same content',
      text: 'Mail body',
      idempotencyKey: 'default-signature-conflict',
    } as const;

    await service.sendMessage({ actorId: 'user-1' }, input);
    await expect(
      service.sendMessage(
        { actorId: 'user-1' },
        { ...input, signatureId: null },
      ),
    ).rejects.toThrow('idempotency key');
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it('does not allow an expired sender lease to overwrite recovery', async () => {
    const created = await store.createSubmission(
      { id: 'submission-1', accountId: 'account-1', status: 'pending' },
      'lease-test',
      'fingerprint',
    );
    await store.claimSubmission(
      created.id,
      'expired-sender',
      new Date(Date.now() - 1_000).toISOString(),
    );
    await store.recoverExpiredSubmissions(new Date().toISOString());

    const finished = await store.finishSubmission(
      { ...created, status: 'accepted', providerMessageId: 'too-late' },
      'expired-sender',
    );

    expect(finished).toMatchObject({ status: 'unknown' });
    expect(finished.providerMessageId).toBeUndefined();
  });

  it('rejects sending and synchronization for an inactive account', async () => {
    await store.saveAccount({ ...account(), status: 'revoked' });
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
      outbox: { kick: vi.fn() },
    });

    await expect(
      service.sendMessage(
        { actorId: 'user-1' },
        {
          accountId: 'account-1',
          identityId: 'identity-1',
          to: [{ address: 'recipient@example.com' }],
          subject: 'Hello',
          text: 'Mail body',
          idempotencyKey: 'inactive-account',
        },
      ),
    ).rejects.toThrow('not active');
    await expect(
      service.startSync({ actorId: 'user-1' }, { accountId: 'account-1' }),
    ).rejects.toThrow('not active');
  });

  // MAIL-SYNC-001/005/006/007/008/009/011: resumable sync consistency.
  it('imports history in pages and catches up from the starting watermark', async () => {
    const listMessages = vi
      .fn<NonNullable<MailProviderAdapter['listMessages']>>()
      .mockResolvedValueOnce({
        ok: true,
        value: {
          messages: [message('history-1', 'First')],
          nextCursor: 'page-2',
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        value: { messages: [message('history-2', 'Second')] },
      });
    const listChanges = vi.fn<NonNullable<MailProviderAdapter['listChanges']>>(
      async (_input) => ({
        ok: true,
        value: {
          messages: [
            message('history-2', 'Second, updated'),
            message('new-1', 'New'),
          ],
          deletedProviderMessageIds: [],
          nextCursor: { value: 'watermark-2' },
          hasMore: false,
        },
      }),
    );
    const adapters = resolver({
      ...baseAdapter(),
      getCurrentSyncCursor: async () => ({
        ok: true,
        value: { value: 'watermark-1' },
      }),
      listMessages,
      listChanges,
    });
    executor = await InlineJobExecutor.ready();
    runtime = createMailRuntime({
      store,
      adapters,
      executor,
    });
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick: vi.fn() },
      syncBatchSize: 1,
    });
    const created = await service.startSync(
      { actorId: 'user-1' },
      { accountId: 'account-1' },
    );

    for (let step = 0; step < 5; step += 1) {
      await runtime.publishPending();
    }

    const completed = await store.getSyncRun(created.id);
    const messages = await service.listMessages(
      { actorId: 'user-1' },
      { accountIds: ['account-1'], limit: 20 },
    );
    expect(completed).toMatchObject({
      status: 'completed',
      phase: 'completed',
      processedMessages: 6,
      changeCursor: { value: 'watermark-2' },
    });
    expect(messages.items).toHaveLength(3);
    expect(messages.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          providerMessageId: 'history-2',
          subject: 'Second, updated',
        }),
      ]),
    );
    expect(listMessages).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ cursor: 'page-2', limit: 1 }),
    );
    expect(listChanges).toHaveBeenCalledWith({
      cursor: { value: 'watermark-1' },
      limit: 1,
      signal: expect.any(AbortSignal),
    });
    expect(await store.getSyncCursor('account-1')).toEqual({
      value: 'watermark-2',
    });
    await expect(
      service.listSyncRuns({ actorId: 'user-1' }),
    ).resolves.toMatchObject([
      {
        id: created.id,
        accountId: 'account-1',
        status: 'completed',
      },
    ]);

    const next = await service.startSync(
      { actorId: 'user-1' },
      { accountId: 'account-1' },
    );
    expect(next.mode).toBe('incremental');
  });

  it('rescans history before catching up when an initial cursor expires', async () => {
    const getCurrentSyncCursor = vi
      .fn<NonNullable<MailProviderAdapter['getCurrentSyncCursor']>>()
      .mockResolvedValueOnce({
        ok: true,
        value: { value: 'watermark-before-import' },
      })
      .mockResolvedValueOnce({
        ok: true,
        value: { value: 'watermark-after-import' },
      });
    const listChanges = vi
      .fn<NonNullable<MailProviderAdapter['listChanges']>>()
      .mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'TEST_SYNC_CURSOR_INVALID',
          message: 'The cursor expired.',
          category: 'provider',
          retryable: false,
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        value: {
          messages: [],
          deletedProviderMessageIds: [],
          nextCursor: { value: 'watermark-after-import' },
          hasMore: false,
        },
      });
    const adapters = resolver({
      ...baseAdapter(),
      getCurrentSyncCursor,
      listMessages: vi.fn(async () => ({
        ok: true as const,
        value: { messages: [message('rescanned', 'Recovered')] },
      })),
      listChanges,
    });
    executor = await InlineJobExecutor.ready();
    runtime = createMailRuntime({
      store,
      adapters,
      executor,
    });
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick: vi.fn() },
      syncBatchSize: 100,
    });
    const created = await service.startSync(
      { actorId: 'user-1' },
      { accountId: 'account-1' },
    );

    for (let step = 0; step < 6; step += 1) {
      await runtime.publishPending();
    }

    expect(await store.getSyncRun(created.id)).toMatchObject({
      status: 'completed',
      phase: 'completed',
      changeCursor: { value: 'watermark-after-import' },
    });
    expect(getCurrentSyncCursor).toHaveBeenCalledTimes(2);
    expect(listChanges).toHaveBeenNthCalledWith(1, {
      cursor: { value: 'watermark-before-import' },
      limit: 100,
      signal: expect.any(AbortSignal),
    });
    expect(listChanges).toHaveBeenNthCalledWith(2, {
      cursor: { value: 'watermark-after-import' },
      limit: 100,
      signal: expect.any(AbortSignal),
    });
  });

  it('filters synchronized messages by folder and provider conversation', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [
        {
          providerFolderId: 'inbox',
          type: 'inbox',
          name: 'Inbox',
          kind: 'folder',
        },
        {
          providerFolderId: 'sent',
          type: 'sent',
          name: 'Sent',
          kind: 'folder',
        },
      ],
      messages: [
        {
          ...message('thread-message-1', 'Project update'),
          providerConversationId: 'conversation-1',
        },
        {
          ...message('thread-message-2', 'Re: Project update'),
          providerConversationId: 'conversation-1',
          providerFolderIds: ['sent'],
          receivedAt: '2026-09-04T00:00:00.000Z',
        },
        {
          ...message('thread-message-3', 'Re: Project update'),
          providerConversationId: 'conversation-1',
          providerFolderIds: ['sent'],
          receivedAt: '2026-09-05T00:00:00.000Z',
        },
        message('standalone-message', 'Standalone'),
      ],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'cursor-1' },
    });

    const inbox = await store.listMessages('user-1', {
      accountIds: ['account-1'],
      folderIds: ['inbox'],
    });
    const syntheticInbox = await store.listMessages('user-1', {
      accountIds: ['account-1'],
      folderIds: ['__nocobase_default_inbox__'],
    });
    const conversation = await store.listConversationMessages(
      'user-1',
      'account-1',
      'conversation-1',
    );

    expect(inbox.items.map((item) => item.providerMessageId)).toEqual(
      expect.arrayContaining(['thread-message-1', 'standalone-message']),
    );
    expect(inbox.items).toHaveLength(2);
    expect(syntheticInbox.items.map((item) => item.providerMessageId)).toEqual(
      expect.arrayContaining(['thread-message-1', 'standalone-message']),
    );
    expect(
      inbox.items.find((item) => item.providerMessageId === 'thread-message-1')
        ?.subjectCount,
    ).toBe(3);
    expect(conversation.items.map((item) => item.providerMessageId)).toEqual([
      'thread-message-1',
      'thread-message-2',
      'thread-message-3',
    ]);
  });

  it('searches subject, preview, sender, and recipient fields without searching the body', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [
        {
          providerFolderId: 'inbox',
          type: 'inbox',
          name: 'Inbox',
          kind: 'folder',
        },
      ],
      messages: [
        {
          ...message('sender-fields', 'Ordinary subject'),
          from: { name: 'Alice Sender', address: 'alice@example.com' },
          text: 'secret-body-only',
        },
        {
          ...message('recipient-fields', 'Recipient subject'),
          to: [{ name: 'Bob Recipient', address: 'bob@example.com' }],
        },
      ],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'cursor-search-fields' },
    });

    await expect(
      store.listMessages('user-1', { query: 'Alice Sender' }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ providerMessageId: 'sender-fields' })],
    });
    await expect(
      store.listMessages('user-1', { query: 'alice@example.com' }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ providerMessageId: 'sender-fields' })],
    });
    await expect(
      store.listMessages('user-1', { query: 'Bob Recipient' }),
    ).resolves.toMatchObject({
      items: [
        expect.objectContaining({ providerMessageId: 'recipient-fields' }),
      ],
    });
    await expect(
      store.listMessages('user-1', { query: 'bob@example.com' }),
    ).resolves.toMatchObject({
      items: [
        expect.objectContaining({ providerMessageId: 'recipient-fields' }),
      ],
    });
    await expect(
      store.listMessages('user-1', { query: 'secret-body-only' }),
    ).resolves.toMatchObject({ items: [] });
  });

  it('uses stable keyset cursors for mailbox and conversation pages', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [],
      messages: [
        {
          ...message('thread-message-1', 'Project update'),
          providerConversationId: 'conversation-1',
          receivedAt: '2026-09-01T00:00:00.000Z',
        },
        {
          ...message('thread-message-2', 'Re: Project update'),
          providerConversationId: 'conversation-1',
          receivedAt: '2026-09-02T00:00:00.000Z',
        },
        {
          ...message('thread-message-3', 'Re: Project update'),
          providerConversationId: 'conversation-1',
          receivedAt: '2026-09-03T00:00:00.000Z',
        },
      ],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'cursor-1' },
    });

    const mailboxFirst = await store.listMessages('user-1', {
      accountIds: ['account-1'],
      limit: 1,
    });
    const mailboxSecond = await store.listMessages('user-1', {
      accountIds: ['account-1'],
      cursor: mailboxFirst.nextCursor,
      limit: 1,
    });
    const conversationFirst = await store.listConversationMessages(
      'user-1',
      'account-1',
      'conversation-1',
      { limit: 1 },
    );
    const conversationSecond = await store.listConversationMessages(
      'user-1',
      'account-1',
      'conversation-1',
      { cursor: conversationFirst.nextCursor, limit: 1 },
    );

    expect([
      mailboxFirst.items[0].providerMessageId,
      mailboxSecond.items[0].providerMessageId,
    ]).toEqual(['thread-message-3', 'thread-message-2']);
    const mailboxThird = await store.listMessages('user-1', {
      accountIds: ['account-1'],
      offset: 2,
      limit: 1,
    });
    expect(mailboxThird.items.map((item) => item.providerMessageId)).toEqual([
      'thread-message-1',
    ]);
    expect(mailboxThird.nextCursor).toBeUndefined();
    expect(mailboxFirst.total).toBeUndefined();
    const counted = await store.listAllMessages({
      offset: 2,
      limit: 1,
      withTotal: true,
    });
    expect(counted.total).toBe(3);
    expect(
      await store.listAllMessages({
        accountIds: ['missing-account'],
        withTotal: true,
      }),
    ).toEqual({ items: [], total: 0 });
    expect(counted.items).toEqual(mailboxThird.items);
    expect(
      (await store.listMessages('another-user', { withTotal: true })).total,
    ).toBe(0);
    expect(
      (await store.listMessages('user-1', { query: 'Re:', withTotal: true }))
        .total,
    ).toBe(2);
    expect(
      (
        await store.listMessages('user-1', {
          cursor: mailboxFirst.nextCursor,
          withTotal: true,
        })
      ).total,
    ).toBe(3);
    const allSecond = await store.listAllMessages({ offset: 1, limit: 1 });
    expect(allSecond.items.map((item) => item.id)).toEqual(
      mailboxSecond.items.map((item) => item.id),
    );
    expect(
      (await store.listMessages('another-user', { offset: 1, limit: 1 })).items,
    ).toEqual([]);
    for (const offset of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
      await expect(
        store.listMessages('user-1', { offset }),
      ).rejects.toMatchObject({
        status: 'INVALID_ARGUMENT',
        reason: 'INVALID_MAIL_REQUEST',
      });
    }
    await expect(
      store.listMessages('user-1', {
        offset: 0,
        cursor: mailboxFirst.nextCursor,
      }),
    ).rejects.toMatchObject({ status: 'INVALID_ARGUMENT' });
    expect(mailboxFirst.items[0].subjectCount).toBe(3);
    expect(mailboxSecond.items[0].subjectCount).toBe(3);
    expect([
      conversationFirst.items[0].providerMessageId,
      conversationSecond.items[0].providerMessageId,
    ]).toEqual(['thread-message-3', 'thread-message-2']);
    await expect(
      store.listMessages('user-1', { cursor: 'not-a-cursor' }),
    ).rejects.toMatchObject({
      status: 'INVALID_ARGUMENT',
      reason: 'INVALID_MAIL_REQUEST',
      field: 'pageToken',
    });
  });

  it('keeps message folder JSON aligned after folder reconciliation', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [
        {
          providerFolderId: 'inbox',
          type: 'inbox',
          name: 'Inbox',
          kind: 'folder',
        },
        {
          providerFolderId: 'archive',
          type: 'archive',
          name: 'Archive',
          kind: 'folder',
        },
      ],
      messages: [
        {
          ...message('message-1', 'Project update'),
          providerFolderIds: ['inbox', 'archive'],
        },
      ],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'cursor-1' },
    });
    const pending = await store.createSyncRun({
      id: 'sync-folder-reconciliation',
      accountId: 'account-1',
      requestedBy: 'user-1',
      mode: 'initial',
      policy: { maxMessages: 100, batchSize: 10 },
    });
    const running = await store.claimSyncRun(
      pending.id,
      pending.revision,
      pending.phase,
      'folder-reconciliation-lease',
      new Date(Date.now() + 10_000).toISOString(),
    );
    expect(running).toBeDefined();
    await store.commitSyncStep({
      run: running!,
      folders: [],
      completeProviderFolderIds: ['inbox'],
      messages: [],
      phase: 'history',
      status: 'running',
      createNextTask: false,
    });

    const stored = await store.listMessages('user-1', {
      accountIds: ['account-1'],
    });
    expect(stored.items[0].folderIds).toEqual(['inbox']);
  });

  it('persists a retry Outbox without advancing the failed page checkpoint', async () => {
    const adapters = resolver({
      ...baseAdapter(),
      getCurrentSyncCursor: async () => ({
        ok: false,
        error: {
          code: 'PROVIDER_RATE_LIMITED',
          message: 'Try again later.',
          category: 'rate_limit',
          retryable: true,
          retryAfterMs: 1_000,
        },
      }),
      listMessages: async () => ({ ok: true, value: { messages: [] } }),
    });
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick: vi.fn() },
    });
    const created = await service.startSync(
      { actorId: 'user-1' },
      { accountId: 'account-1' },
    );
    const original = await store.claimOutbox(
      new Date().toISOString(),
      'original-lease',
      new Date(Date.now() + 10_000).toISOString(),
      10,
    );
    await Promise.all(
      original.map((record) =>
        store.markOutboxPublished(
          record.id,
          record.leaseToken ?? '',
          new Date().toISOString(),
        ),
      ),
    );
    const operation = new SyncMailboxOperation({ store, adapters });

    await operation.execute(original[0].payload);

    const run = await store.getSyncRun(created.id);
    expect(run).toMatchObject({
      status: 'pending',
      phase: 'preparing',
      processedPages: 0,
      error: { code: 'PROVIDER_RATE_LIMITED' },
    });
    expect(await store.getAccount('account-1')).toMatchObject({
      status: 'active',
    });
    const claimed = await store.claimOutbox(
      new Date(Date.now() + 2_000).toISOString(),
      'test-lease',
      new Date(Date.now() + 10_000).toISOString(),
      10,
    );
    expect(claimed).toHaveLength(1);
    expect(claimed[0].deduplicationKey).toContain(':retry:');
  });

  it.each([
    {
      reason: 'rateLimitExceeded',
      status: 403,
      category: 'rate_limit',
      runStatus: 'pending',
      accountStatus: 'active',
    },
    {
      reason: 'userRateLimitExceeded',
      status: 403,
      category: 'rate_limit',
      runStatus: 'pending',
      accountStatus: 'active',
    },
    {
      reason: 'dailyLimitExceeded',
      status: 403,
      category: 'provider',
      runStatus: 'failed',
      accountStatus: 'active',
    },
    {
      reason: 'domainPolicy',
      status: 403,
      category: 'provider',
      runStatus: 'failed',
      accountStatus: 'active',
    },
    {
      reason: 'accessNotConfigured',
      status: 403,
      category: 'provider',
      runStatus: 'failed',
      accountStatus: 'active',
    },
    {
      reason: 'authError',
      status: 401,
      category: 'authentication',
      runStatus: 'failed',
      accountStatus: 'reauthorizationRequired',
    },
    {
      reason: 'insufficientPermissions',
      status: 403,
      category: 'authentication',
      runStatus: 'failed',
      accountStatus: 'reauthorizationRequired',
    },
    {
      reason: undefined,
      status: 429,
      category: 'rate_limit',
      runStatus: 'pending',
      accountStatus: 'active',
    },
    {
      reason: undefined,
      status: 503,
      category: 'provider',
      runStatus: 'pending',
      accountStatus: 'active',
    },
  ] as const)(
    'applies Gmail $status $reason to synchronization and account state',
    async ({ reason, status, category, runStatus, accountStatus }) => {
      const providerError = await responseError(
        'GMAIL',
        Response.json(
          {
            error: {
              ...(reason ? { errors: [{ reason }] } : {}),
              message: 'Private provider diagnostic',
            },
          },
          { status, headers: { 'retry-after': '1' } },
        ),
      );
      const adapters = resolver({
        ...baseAdapter(),
        getCurrentSyncCursor: async () => ({
          ok: false,
          error: providerError,
        }),
        listMessages: async () => ({ ok: true, value: { messages: [] } }),
      });
      const service = new DefaultMailService({
        store,
        adapters,
        outbox: { kick: vi.fn() },
      });
      const created = await service.startSync(
        { actorId: 'user-1' },
        { accountId: 'account-1' },
      );
      const original = await store.claimOutbox(
        new Date().toISOString(),
        'gmail-error-original-lease',
        new Date(Date.now() + 10_000).toISOString(),
        1,
      );
      expect(original).toHaveLength(1);
      await store.markOutboxPublished(
        original[0].id,
        original[0].leaseToken ?? '',
        new Date().toISOString(),
      );

      await new SyncMailboxOperation({ store, adapters }).execute(
        original[0].payload,
      );

      const run = await store.getSyncRun(created.id);
      expect(run).toMatchObject({
        status: runStatus,
        processedPages: 0,
        error: { code: `GMAIL_HTTP_${status}`, category },
      });
      expect(run?.error?.reasonCode).toBe(providerError.reasonCode);
      expect(await store.getAccount('account-1')).toMatchObject({
        status: accountStatus,
      });
      const retryJobs = await store.claimOutbox(
        new Date(Date.now() + 60_000).toISOString(),
        'gmail-error-retry-lease',
        new Date(Date.now() + 70_000).toISOString(),
        1,
      );
      expect(retryJobs).toHaveLength(runStatus === 'pending' ? 1 : 0);
    },
  );

  it('renews the sync-run lease while a Provider request is still running', async () => {
    const entered = Promise.withResolvers<void>();
    const providerGate = Promise.withResolvers<void>();
    const adapters = resolver({
      ...baseAdapter(),
      getCurrentSyncCursor: async () => {
        entered.resolve();
        await providerGate.promise;
        return { ok: true, value: { value: 'watermark-1' } };
      },
      listMessages: async () => ({ ok: true, value: { messages: [] } }),
    });
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick: vi.fn() },
    });
    await service.startSync({ actorId: 'user-1' }, { accountId: 'account-1' });
    const outbox = await store.claimOutbox(
      new Date().toISOString(),
      'heartbeat-outbox-lease',
      new Date(Date.now() + 10_000).toISOString(),
      1,
    );
    await store.markOutboxPublished(
      outbox[0].id,
      outbox[0].leaseToken ?? '',
      new Date().toISOString(),
    );
    const renew = vi.spyOn(store, 'renewSyncRunLease');
    vi.useFakeTimers({ now: new Date() });
    const operation = new SyncMailboxOperation({
      store,
      adapters,
      leaseMs: 3_000,
    });

    const running = operation.execute(outbox[0].payload);
    await entered.promise;
    await vi.advanceTimersByTimeAsync(1_000);

    expect(renew).toHaveBeenCalledTimes(1);
    providerGate.resolve();
    await running;
  });

  it('clears an expired Provider cursor so the next sync can rebootstrap', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [],
      messages: [],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'expired-cursor' },
    });
    const adapters = resolver({
      ...baseAdapter(),
      listFolders: async () => ({
        ok: true,
        value: { folders: [], completeProviderFolderIds: [] },
      }),
      listChanges: async () => ({
        ok: false,
        error: {
          code: 'TEST_SYNC_CURSOR_INVALID',
          message: 'The cursor expired.',
          category: 'provider',
          retryable: false,
        },
      }),
    });
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick: vi.fn() },
    });
    const created = await service.startSync(
      { actorId: 'user-1' },
      { accountId: 'account-1' },
    );
    const task = await store.claimOutbox(
      new Date().toISOString(),
      'cursor-outbox-lease',
      new Date(Date.now() + 10_000).toISOString(),
      1,
    );
    await store.markOutboxPublished(
      task[0].id,
      task[0].leaseToken ?? '',
      new Date().toISOString(),
    );
    const operation = new SyncMailboxOperation({ store, adapters });

    await operation.execute(task[0].payload);
    const nextTask = await store.claimOutbox(
      new Date().toISOString(),
      'cursor-next-outbox-lease',
      new Date(Date.now() + 10_000).toISOString(),
      1,
    );
    await operation.execute(nextTask[0].payload);

    expect(await store.getSyncRun(created.id)).toMatchObject({
      status: 'running',
      phase: 'preparing',
      recovering: true,
      mode: 'initial',
    });
    expect(await store.getSyncCursor('account-1')).toBeUndefined();
    const restarted = await service.startSync(
      { actorId: 'user-1' },
      { accountId: 'account-1' },
    );
    expect(restarted.mode).toBe('initial');
  });

  it('marks an account for reauthorization after a terminal auth failure', async () => {
    const sendMessage = vi.fn<MailProviderAdapter['sendMessage']>(async () => ({
      status: 'failed',
      error: {
        code: 'TEST_OAUTH_INVALID_GRANT',
        message: 'The refresh token was revoked.',
        category: 'authentication',
        retryable: false,
      },
    }));
    const service = new DefaultMailService({
      store,
      adapters: resolver({ ...baseAdapter(), sendMessage }),
      outbox: { kick: vi.fn() },
    });

    await service.sendMessage(
      { actorId: 'user-1' },
      {
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [{ address: 'recipient@example.com' }],
        subject: 'Authentication failure',
        text: 'Mail body',
        idempotencyKey: 'auth-failure',
      },
    );

    expect(await store.getAccount('account-1')).toMatchObject({
      status: 'reauthorizationRequired',
    });
  });

  it('ignores a redelivered task after its sync step advanced', async () => {
    const listMessages = vi.fn<
      NonNullable<MailProviderAdapter['listMessages']>
    >(async () => ({ ok: true, value: { messages: [] } }));
    const adapters = resolver({
      ...baseAdapter(),
      getCurrentSyncCursor: async () => ({
        ok: true,
        value: { value: 'watermark-1' },
      }),
      listMessages,
      listChanges: async () => ({
        ok: true,
        value: {
          messages: [],
          deletedProviderMessageIds: [],
          nextCursor: { value: 'watermark-1' },
          hasMore: false,
        },
      }),
    });
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick: vi.fn() },
    });
    const created = await service.startSync(
      { actorId: 'user-1' },
      { accountId: 'account-1' },
    );
    const first = await store.claimOutbox(
      new Date().toISOString(),
      'first-outbox-lease',
      new Date(Date.now() + 10_000).toISOString(),
      1,
    );
    await store.markOutboxPublished(
      first[0].id,
      first[0].leaseToken ?? '',
      new Date().toISOString(),
    );
    const operation = new SyncMailboxOperation({ store, adapters });

    await operation.execute(first[0].payload);
    await operation.execute(first[0].payload);

    expect(listMessages).not.toHaveBeenCalled();
    expect(await store.getSyncRun(created.id)).toMatchObject({
      phase: 'history',
      revision: 1,
      processedPages: 1,
    });
  });

  it('fences Outbox completion by lease token', async () => {
    const service = new DefaultMailService({
      store,
      adapters: resolver(baseAdapter()),
      outbox: { kick: vi.fn() },
    });
    await service.startSync({ actorId: 'user-1' }, { accountId: 'account-1' });
    const first = await store.claimOutbox(
      new Date().toISOString(),
      'old-lease',
      new Date(Date.now() - 1_000).toISOString(),
      1,
    );
    const second = await store.claimOutbox(
      new Date().toISOString(),
      'new-lease',
      new Date(Date.now() + 10_000).toISOString(),
      1,
    );

    expect(
      await store.markOutboxPublished(
        first[0].id,
        'old-lease',
        new Date().toISOString(),
      ),
    ).toBe(false);
    expect(
      await store.markOutboxPublished(
        second[0].id,
        'new-lease',
        new Date().toISOString(),
      ),
    ).toBe(true);
  });
});

function account(): MailAccount {
  return {
    id: 'account-1',
    userId: 'user-1',
    provider: { type: 'test', name: 'test' },
    address: 'sender@example.com',
    credentialReference: 'secret:test',
    scopes: [],
    status: 'active',
    initialSyncReceivedAfter: '2026-09-01T00:00:00.000Z',
  };
}

function resolver(adapter: MailProviderAdapter): MailProviderAdapterResolver {
  return { resolve: async () => adapter };
}

function baseAdapter(): MailProviderAdapter {
  return {
    identity: { type: 'test', name: 'test' },
    capabilities: {
      receive: true,
      send: true,
      incrementalSync: true,
      pushNotifications: false,
      folders: false,
      labels: false,
      drafts: false,
      moveMessage: false,
      aliases: false,
    },
  };
}

function message(
  providerMessageId: string,
  subject: string,
): NormalizedMailMessage {
  return {
    providerMessageId,
    providerFolderIds: ['inbox'],
    to: [{ address: 'sender@example.com' }],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    subject,
    receivedAt: '2026-09-03T00:00:00.000Z',
    read: false,
    starred: false,
    draft: false,
    attachments: [],
  };
}

function streamOf(value: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(value));
      controller.close();
    },
  });
}
