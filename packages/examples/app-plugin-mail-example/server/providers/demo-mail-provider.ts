import type {
  MailAttachmentContent,
  MailProviderAdapter,
  MailProviderCapabilities,
  MailProviderChangePage,
  MailProviderConfig,
  MailProviderContext,
  MailProviderDefinition,
  MailProviderFolderPage,
  MailProviderListChangesInput,
  MailProviderListFoldersInput,
  MailProviderListMessagesInput,
  MailProviderMessagePage,
  MailProviderAccount,
  MailProviderResult,
  MailProviderSendInput,
  MailProviderSendResult,
  MailSyncCursor,
} from '@nocobase/app-plugin-mail/server';

import {
  DEMO_MAIL_INBOX_ID,
  DEMO_MAIL_SENT_ID,
  DemoMailboxes,
} from './demo-mailboxes.js';

export type MailExampleProviderConfig = MailProviderConfig;

const DEMO_MAIL_CAPABILITIES: MailProviderCapabilities = {
  receive: true,
  send: true,
  incrementalSync: true,
  pushNotifications: false,
  folders: true,
  labels: false,
  drafts: false,
  moveMessage: false,
  aliases: false,
};

const DEMO_SYNC_CURSOR: MailSyncCursor = { value: 'mail-example-v1' };

export function createDemoMailProviderDefinition(
  mailboxes: DemoMailboxes,
  type: string = 'mail-example',
  label: string = 'Gmail Demo Mail',
): MailProviderDefinition<MailExampleProviderConfig> {
  return {
    type,
    label,
    capabilities: DEMO_MAIL_CAPABILITIES,
    connection: {
      async connect(context, _config, input) {
        const address = input.address.trim().toLowerCase();
        if (!/^[^@\s]+@example\.test$/u.test(address)) {
          return providerFailure(
            'MAIL_EXAMPLE_ADDRESS_REQUIRED',
            'Use a demo mailbox address ending in @example.test.',
            'configuration',
          );
        }
        const credentialReference = await context.credentials.put(
          { provider: type },
          { purpose: 'account' },
        );
        mailboxes.ensureAccount(address);
        const displayName = input.displayName?.trim() || 'Demo Mailbox';
        return {
          ok: true,
          value: {
            address,
            displayName,
            authorizationSubject: address,
            credentialReference,
            scopes: [],
            identities: [
              {
                address,
                displayName,
                isPrimary: true,
                canSend: true,
              },
            ],
          },
        };
      },
    },
    async createAdapter(
      _context: MailProviderContext,
      _config: MailExampleProviderConfig,
      account: MailProviderAccount,
    ): Promise<MailProviderAdapter> {
      mailboxes.ensureAccount(account.address);
      return createDemoMailProviderAdapter(mailboxes, account);
    },
  };
}

function createDemoMailProviderAdapter(
  mailboxes: DemoMailboxes,
  account: MailProviderAccount,
): MailProviderAdapter {
  return {
    identity: account.provider,
    capabilities: DEMO_MAIL_CAPABILITIES,
    async listFolders(
      input: MailProviderListFoldersInput,
    ): Promise<MailProviderResult<MailProviderFolderPage>> {
      throwIfAborted(input.signal);
      return {
        ok: true,
        value: {
          folders: [
            {
              providerFolderId: DEMO_MAIL_INBOX_ID,
              type: 'inbox',
              name: 'Inbox',
              kind: 'folder',
            },
            {
              providerFolderId: DEMO_MAIL_SENT_ID,
              type: 'sent',
              name: 'Sent',
              kind: 'folder',
            },
          ],
          completeProviderFolderIds: [DEMO_MAIL_INBOX_ID, DEMO_MAIL_SENT_ID],
        },
      };
    },
    async getCurrentSyncCursor(
      signal?: AbortSignal,
    ): Promise<MailProviderResult<MailSyncCursor>> {
      throwIfAborted(signal);
      return { ok: true, value: DEMO_SYNC_CURSOR };
    },
    async listMessages(
      input: MailProviderListMessagesInput,
    ): Promise<MailProviderResult<MailProviderMessagePage>> {
      throwIfAborted(input.signal);
      const filtered = mailboxes
        .listMessages(account.address)
        .filter((message) => {
          const matchesFolders =
            !input.providerFolderIds?.length ||
            message.providerFolderIds.some((folderId) =>
              input.providerFolderIds?.includes(folderId),
            );
          const messageDate = message.receivedAt ?? message.sentAt;
          const matchesDate =
            !input.receivedAfter ||
            !messageDate ||
            messageDate >= input.receivedAfter;
          return matchesFolders && matchesDate;
        });
      const offset = parseHistoryCursor(input.cursor);
      const limit = Math.max(
        1,
        Math.floor(input.limit ?? (filtered.length || 1)),
      );
      const messages = filtered.slice(offset, offset + limit);
      const nextOffset = offset + messages.length;
      const nextCursor =
        nextOffset < filtered.length ? String(nextOffset) : undefined;
      return {
        ok: true,
        value: {
          historyReady: true,
          messages,
          ...(nextCursor ? { nextCursor } : {}),
        },
      };
    },
    async listChanges(
      input: MailProviderListChangesInput,
    ): Promise<MailProviderResult<MailProviderChangePage>> {
      throwIfAborted(input.signal);
      return {
        ok: true,
        value: {
          messages: [],
          deletedProviderMessageIds: [],
          nextCursor: DEMO_SYNC_CURSOR,
          hasMore: false,
        },
      };
    },
    async getAttachment(
      providerMessageId: string,
      providerAttachmentId: string,
      signal?: AbortSignal,
    ): Promise<MailProviderResult<MailAttachmentContent>> {
      throwIfAborted(signal);
      const message = mailboxes.findMessage(account.address, providerMessageId);
      const attachment = message?.attachments.find(
        (item) => item.providerAttachmentId === providerAttachmentId,
      );
      const bytes = mailboxes.readAttachment(
        account.address,
        providerMessageId,
        providerAttachmentId,
      );
      if (!attachment || !bytes) {
        return providerFailure(
          'MAIL_EXAMPLE_ATTACHMENT_NOT_FOUND',
          'The requested demo attachment was not found.',
          'content',
        );
      }
      return {
        ok: true,
        value: {
          fileName: attachment.fileName,
          contentType: attachment.contentType,
          size: bytes.byteLength,
          stream: new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(bytes);
              controller.close();
            },
          }),
        },
      };
    },
    async sendMessage(
      input: MailProviderSendInput,
    ): Promise<MailProviderSendResult> {
      throwIfAborted(input.signal);
      const outboxEntry = mailboxes.recordSent(account.address, input);
      return {
        status: 'accepted',
        providerMessageId: outboxEntry.providerMessageId,
        internetMessageId:
          '<' + outboxEntry.providerMessageId + '@example.test>',
      };
    },
    async setRead(
      providerMessageId: string,
      read: boolean,
      signal?: AbortSignal,
    ): Promise<MailProviderResult<void>> {
      throwIfAborted(signal);
      if (!mailboxes.setRead(account.address, providerMessageId, read)) {
        return providerFailure(
          'MAIL_EXAMPLE_MESSAGE_NOT_FOUND',
          'The requested demo message was not found.',
          'provider',
        );
      }
      return { ok: true, value: undefined };
    },
    async setStarred(
      providerMessageId: string,
      starred: boolean,
      signal?: AbortSignal,
    ): Promise<MailProviderResult<void>> {
      throwIfAborted(signal);
      if (!mailboxes.setStarred(account.address, providerMessageId, starred)) {
        return providerFailure(
          'MAIL_EXAMPLE_MESSAGE_NOT_FOUND',
          'The requested demo message was not found.',
          'provider',
        );
      }
      return { ok: true, value: undefined };
    },
  };
}

function parseHistoryCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const value = Number(cursor);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function providerFailure<T>(
  code: string,
  message: string,
  category: 'configuration' | 'content' | 'provider',
): MailProviderResult<T> {
  return { ok: false, error: { code, message, category, retryable: false } };
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw signal.reason ?? new Error('Operation aborted.');
}
