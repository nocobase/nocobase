import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import { type DatabaseManager } from '@nocobase/db';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createDatabaseMailStore } from '../../server/store.js';
import { DefaultMailService } from '../../server/service.js';
import { SendMailOperation } from '../../server/operations/send-mail.js';
import { MAIL_LOCAL_DRAFT_FOLDER_ID } from '../../shared/mail.js';
import type {
  MailComposeInput,
  MailProviderAdapter,
  MailStore,
} from '../../server/types.js';

describe('scheduled draft lifecycle', () => {
  let database: DatabaseManager;
  let store: MailStore;
  let service: DefaultMailService;
  let operation: SendMailOperation;
  let send: ReturnType<
    typeof vi.fn<NonNullable<MailProviderAdapter['sendMessage']>>
  >;
  const actor = { actorId: 'user' };
  const input: MailComposeInput = {
    accountId: 'account',
    identityId: 'identity',
    idempotencyKey: 'first',
    to: [{ address: 'to@example.com' }],
    cc: [{ address: 'cc@example.com' }],
    bcc: [{ address: 'bcc@example.com' }],
    subject: 'Later',
    text: 'Body',
    html: '<p>Body</p>',
    scheduledAt: '2099-01-01T10:00:00Z',
  };
  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    await store.saveAccount({
      id: 'account',
      userId: 'user',
      provider: { type: 'test', name: 'test' },
      address: 'me@example.com',
      credentialReference: 'test',
      scopes: [],
      status: 'active',
    });
    await store.replaceIdentities('account', [
      {
        id: 'identity',
        accountId: 'account',
        address: 'me@example.com',
        isPrimary: true,
        canSend: true,
      },
    ]);
    await store.commitSyncBatch({
      accountId: 'account',
      folders: [
        {
          providerFolderId: 'sent',
          type: 'sent',
          kind: 'folder',
          name: 'Sent',
        },
      ],
      messages: [],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'initial' },
    });
    send = vi.fn(async () => ({
      status: 'accepted' as const,
      providerMessageId: 'sent-message',
    }));
    const adapter: MailProviderAdapter = {
      identity: { type: 'test', name: 'test' },
      capabilities: {
        receive: true,
        send: true,
        incrementalSync: false,
        pushNotifications: false,
        folders: true,
        labels: false,
        drafts: false,
        moveMessage: false,
        aliases: false,
      },
      sendMessage: send,
    };
    const deps = {
      store,
      adapters: { resolve: async () => adapter },
      outbox: { kick: vi.fn() },
    };
    service = new DefaultMailService(deps);
    operation = new SendMailOperation(deps);
  });
  afterEach(async () => {
    await destroyMailTestDatabase(database);
  });
  const drafts = () =>
    store.listMessages('user', { folderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID] });
  async function deliver(id: string) {
    const scheduled = await store.getScheduledSubmission(id);
    if (!scheduled) throw new Error('Missing scheduled input');
    return operation.execute(actor, scheduled.input, {
      scheduledDelivery: true,
    });
  }

  it('keeps a single locked draft with time, recipients and body, then cancels and reschedules it', async () => {
    const submission = await service.sendMessage(actor, input);
    await expect(service.sendMessage(actor, input)).resolves.toMatchObject({
      id: submission.id,
    });
    expect(send).not.toHaveBeenCalled();
    await store.commitSyncBatch({
      accountId: 'account',
      folders: [
        {
          providerFolderId: 'provider-drafts',
          type: 'drafts',
          kind: 'folder',
          name: 'Drafts',
        },
      ],
      messages: [],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'next' },
    });
    expect(
      (
        await store.listMessages('user', {
          accountIds: ['account'],
          folderIds: ['provider-drafts'],
        })
      ).items,
    ).toEqual([
      expect.objectContaining({
        scheduledSend: expect.objectContaining({ id: submission.id }),
      }),
    ]);
    const page = await drafts();
    expect(page.items).toHaveLength(1);
    const id = page.items[0].id;
    expect(page.items[0]).toMatchObject({
      draft: true,
      subject: 'Later',
      scheduledSend: {
        id: submission.id,
        status: 'pending',
        scheduledAt: '2099-01-01T10:00:00.000Z',
      },
    });
    expect(await store.getMessage('user', 'account', id)).toMatchObject({
      text: 'Body',
      html: '<p>Body</p>',
      cc: input.cc,
      bcc: input.bcc,
    });
    await expect(
      service.saveDraft(actor, {
        ...input,
        scheduledAt: undefined,
        draftMessageId: id,
      }),
    ).rejects.toThrow(/Cancel/);
    await expect(
      service.sendMessage(actor, {
        ...input,
        scheduledAt: undefined,
        draftMessageId: id,
        idempotencyKey: 'duplicate',
      }),
    ).rejects.toThrow(/Cancel/);
    await expect(store.deleteMessage('account', id)).rejects.toThrow(/Cancel/);
    await expect(
      service.cancelSubmission({ actorId: 'another-user' }, submission.id),
    ).rejects.toThrow(/not found/);
    await service.cancelSubmission(actor, submission.id);
    expect((await drafts()).items[0].scheduledSend).toBeUndefined();
    await expect(deliver(submission.id)).resolves.toMatchObject({
      status: 'cancelled',
    });
    expect(send).not.toHaveBeenCalled();
    const edited = await service.saveDraft(actor, {
      ...input,
      draftMessageId: id,
      scheduledAt: undefined,
      subject: 'Changed',
    });
    expect(edited.id).toBe(id);
    const next = await service.sendMessage(actor, {
      ...input,
      draftMessageId: id,
      subject: 'Changed',
      idempotencyKey: 'second',
    });
    expect((await drafts()).items).toHaveLength(1);
    await deliver(next.id);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({ subject: 'Changed' }),
      }),
    );
    expect((await drafts()).items).toEqual([]);
    expect(
      (await store.listMessages('user', { folderIds: ['sent'] })).items,
    ).toEqual([expect.objectContaining({ subject: 'Changed', draft: false })]);
  });

  it('updates the same draft with the latest content and blocks stale autosaves', async () => {
    const original = await service.saveDraft(actor, {
      ...input,
      scheduledAt: undefined,
      subject: 'Autosaved version',
    });
    const queued = await service.sendMessage(actor, {
      ...input,
      draftMessageId: original.id,
      subject: 'Latest edits',
    });
    expect((await drafts()).items).toEqual([
      expect.objectContaining({
        id: original.id,
        subject: 'Latest edits',
        scheduledSend: expect.objectContaining({ id: queued.id }),
      }),
    ]);
    await expect(
      service.sendMessage(actor, {
        ...input,
        draftMessageId: original.id,
        idempotencyKey: 'second-schedule',
      }),
    ).rejects.toThrow(/Cancel/);
    await expect(
      store.saveMessage('account', {
        providerMessageId: original.providerMessageId,
        providerFolderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID],
        to: input.to,
        cc: [],
        bcc: [],
        replyTo: [],
        references: [],
        subject: 'Stale autosave',
        text: 'Stale',
        read: true,
        starred: false,
        draft: true,
        attachments: [],
      }),
    ).rejects.toThrow(/Cancel/);
    await service.cancelSubmission(actor, queued.id);
    expect(
      (await store.getMessage('user', 'account', original.id))?.subject,
    ).toBe('Latest edits');
  });

  it('cancels while a stale worker is preparing the send, so its claim cannot deliver', async () => {
    const submission = await service.sendMessage(actor, input);
    const prepare = operation.prepareProviderMessage.bind(operation);
    vi.spyOn(operation, 'prepareProviderMessage').mockImplementationOnce(
      async (...args) => {
        const message = await prepare(...args);
        await service.cancelSubmission(actor, submission.id);
        return message;
      },
    );
    await expect(deliver(submission.id)).resolves.toMatchObject({
      status: 'cancelled',
    });
    expect(send).not.toHaveBeenCalled();
    expect((await drafts()).items[0].scheduledSend).toBeUndefined();
  });

  it('rejects cancellation after sending starts and consumes failed drafts', async () => {
    const submission = await service.sendMessage(actor, input);
    send.mockImplementationOnce(async () => {
      await expect(
        service.cancelSubmission(actor, submission.id),
      ).rejects.toThrow(/current state/);
      expect((await drafts()).items[0].scheduledSend?.status).toBe(
        'submitting',
      );
      return {
        status: 'failed',
        error: {
          code: 'TEST_REJECTED',
          category: 'content',
          message: 'Rejected',
          retryable: false,
        },
      };
    });
    await expect(deliver(submission.id)).resolves.toMatchObject({
      status: 'failed',
    });
    expect((await drafts()).items).toEqual([]);
    expect(
      (await store.getScheduledSubmission(submission.id))?.input.text,
    ).toBe(input.text);
    await service.retrySubmission(actor, submission.id);
    expect((await drafts()).items).toEqual([]);
    await expect(deliver(submission.id)).resolves.toMatchObject({
      status: 'accepted',
    });
  });

  it('preserves uncertain outgoing content without a draft or unsafe retry', async () => {
    const submission = await service.sendMessage(actor, input);
    send.mockResolvedValueOnce({
      status: 'submission_unknown',
      error: {
        code: 'UNKNOWN',
        category: 'unknown',
        message: 'Unknown',
        retryable: false,
      },
    });
    await deliver(submission.id);
    expect((await drafts()).items).toEqual([]);
    expect(
      (await store.getScheduledSubmission(submission.id))?.submission.status,
    ).toBe('unknown');
    await expect(
      service.cancelSubmission(actor, submission.id),
    ).rejects.toThrow(/current state/);
    await expect(service.retrySubmission(actor, submission.id)).rejects.toThrow(
      /current state/,
    );
  });

  it('preserves uploaded attachments through cancellation and edited resubmission', async () => {
    await store.createOutboundAttachment({
      id: 'upload',
      userId: 'user',
      fileName: 'file.txt',
      contentType: 'text/plain',
      size: 4,
      disk: 'test',
      key: 'file',
      createdAt: '2026-01-01T00:00:00Z',
      expiresAt: '2099-01-02T00:00:00Z',
    });
    const deps = {
      store,
      adapters: {
        resolve: async () => ({
          identity: { type: 'test', name: 'test' },
          capabilities: {
            receive: true,
            send: true,
            incrementalSync: false,
            pushNotifications: false,
            folders: false,
            labels: false,
            drafts: false,
            moveMessage: false,
            aliases: false,
          },
          sendMessage: send,
        }),
      },
      outboundAttachments: {
        open: async () => ({
          attachment: (await store.getOutboundAttachment('user', 'upload'))!,
          stream: new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('data'));
              controller.close();
            },
          }),
        }),
      },
    };
    // The operation only needs the read side of attachment storage for this scenario.
    const attachedOperation = new SendMailOperation({
      ...deps,
      outboundAttachments: { ...deps.outboundAttachments, create: vi.fn() },
    });
    const queued = await attachedOperation.execute(actor, {
      ...input,
      attachmentIds: ['upload'],
    });
    const scheduled = await store.getScheduledSubmission(queued.id);
    const id = scheduled!.input.draftMessageId!;
    const draft = await store.getMessage('user', 'account', id);
    expect(draft?.attachments).toEqual([
      expect.objectContaining({
        outboundAttachmentId: 'upload',
        fileName: 'file.txt',
      }),
    ]);
    await service.cancelSubmission(actor, queued.id);
    await expect(
      store.listExpiredOutboundAttachments('2100-01-01T00:00:00Z', 20),
    ).resolves.toEqual([]);
    await attachedOperation.execute(actor, {
      ...input,
      draftMessageId: id,
      attachmentIds: [],
      scheduledAt: undefined,
      idempotencyKey: 'send-now',
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          attachments: [expect.objectContaining({ fileName: 'file.txt' })],
        }),
      }),
    );
  });
});
