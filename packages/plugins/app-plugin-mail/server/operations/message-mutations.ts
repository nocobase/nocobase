import { notifyMailMessageChange } from '../realtime.js';
import type {
  MailAccount,
  MailMessage,
  MailOperationContext,
} from '../../shared/mail.js';
import type { MailProviderAdapter } from '../contracts/provider.js';
import type { MailStore } from '../contracts/persistence.js';
import type { DefaultMailServiceDependencies } from '../services/dependencies.js';
import {
  isLocalDraftMessage,
  remoteMessageId,
} from '../services/draft-content.js';
import { assertProviderResult } from '../services/errors.js';
import { closeAdapter } from '../services/provider-lifecycle.js';
import { mailFailedPrecondition, mailNotFound } from '../services/errors.js';
import { ImapSmtpAdapter } from '../adapters/imap-smtp/adapter.js';

/** The built-in IMAP adapter commits each confirmed copy itself. */
function commitsCopies(adapter: MailProviderAdapter): boolean {
  return adapter instanceof ImapSmtpAdapter && adapter.persistsLocations;
}

type MessageMutationStore = Pick<
  MailStore,
  'listFolders' | 'updateMessageState' | 'moveMessage' | 'deleteMessage'
>;

/** Executes mutations after the caller has authorized and resolved the target. */
export class MailMessageMutations {
  public constructor(
    private readonly dependencies: Pick<
      DefaultMailServiceDependencies,
      'adapters' | 'messageChangeNotifier' | 'logger'
    > & { readonly store: MessageMutationStore },
  ) {}
  public async updateMessage(
    context: MailOperationContext,
    account: MailAccount,
    message: MailMessage,
    input: import('../../shared/mail.js').MailUpdateMessageInput,
  ): Promise<MailMessage> {
    if (
      input.read === undefined &&
      input.starred === undefined &&
      input.note === undefined &&
      input.todo === undefined
    )
      return message;
    const providerMessageId = remoteMessageId(message);
    if (
      (input.read === undefined && input.starred === undefined) ||
      !providerMessageId
    ) {
      const updated = await this.dependencies.store.updateMessageState(
        account.id,
        message.id,
        {
          note: input.note,
          todo: input.todo,
          read: input.read,
          starred: input.starred,
        },
      );
      if (!updated) throw new Error('Mail message was not found after update.');
      notifyMailMessageChange(
        this.dependencies.messageChangeNotifier,
        account.userId,
        this.dependencies.logger,
      );
      return updated;
    }
    let adapter = await this.dependencies.adapters.resolve(
      account,
      context.signal,
    );
    const copies = commitsCopies(adapter);
    if (adapter instanceof ImapSmtpAdapter) {
      const base = adapter;
      try {
        adapter = await base.forMessage(message.id, providerMessageId, 'flags');
      } finally {
        await closeAdapter(base);
      }
    }
    try {
      if (input.read !== undefined) {
        if (!adapter.setRead)
          throw mailFailedPrecondition(
            'MAIL_PROVIDER_OPERATION_UNSUPPORTED',
            'The selected Mail Provider cannot change read state.',
          );
        assertProviderResult(
          await adapter.setRead(providerMessageId, input.read, context.signal),
        );
      }
      if (input.starred !== undefined) {
        if (!adapter.setStarred)
          throw mailFailedPrecondition(
            'MAIL_PROVIDER_OPERATION_UNSUPPORTED',
            'The selected Mail Provider cannot change starred state.',
          );
        assertProviderResult(
          await adapter.setStarred(
            providerMessageId,
            input.starred,
            context.signal,
          ),
        );
      }
      // IMAP read and starred state is already aggregated from committed copies.
      const updated = await this.dependencies.store.updateMessageState(
        account.id,
        message.id,
        {
          read: copies ? undefined : input.read,
          starred: copies ? undefined : input.starred,
          note: input.note,
          todo: input.todo,
        },
      );
      if (!updated) throw new Error('Mail message was not found after update.');
      notifyMailMessageChange(
        this.dependencies.messageChangeNotifier,
        account.userId,
        this.dependencies.logger,
      );
      return updated;
    } catch (error) {
      // Copies confirmed before the failure stay committed; show them.
      if (copies)
        notifyMailMessageChange(
          this.dependencies.messageChangeNotifier,
          account.userId,
          this.dependencies.logger,
        );
      throw error;
    } finally {
      await closeAdapter(adapter);
    }
  }

  public async moveMessage(
    context: MailOperationContext,
    account: MailAccount,
    message: MailMessage,
    input: import('../../shared/mail.js').MailMoveMessageInput,
  ): Promise<MailMessage> {
    if (message.scheduledSend)
      throw mailFailedPrecondition(
        'MAIL_DRAFT_SCHEDULED',
        'Cancel the scheduled delivery before moving or deleting this draft.',
      );
    const providerMessageId = remoteMessageId(message);
    if (!providerMessageId)
      throw mailFailedPrecondition(
        'MAIL_DRAFT_LOCAL_ONLY',
        'A local-only draft cannot be moved to a provider folder.',
      );
    const folder = (await this.dependencies.store.listFolders(account.id)).find(
      (item) => item.providerFolderId === input.providerFolderId,
    );
    if (!folder)
      throw mailNotFound(
        'MAIL_FOLDER_NOT_FOUND',
        'Mail destination folder was not found.',
        'providerFolderId',
      );
    const adapter = await this.dependencies.adapters.resolve(
      account,
      context.signal,
    );
    try {
      if (!adapter.capabilities.moveMessage || !adapter.moveMessage) {
        throw mailFailedPrecondition(
          'MAIL_PROVIDER_OPERATION_UNSUPPORTED',
          'The selected Mail Provider cannot move messages.',
        );
      }
      const moved = assertProviderResult(
        await adapter.moveMessage(
          providerMessageId,
          input.providerFolderId,
          context.signal,
        ),
      );
      const updated = await this.dependencies.store.moveMessage(
        account.id,
        message.id,
        moved.providerMessageId,
        input.providerFolderId,
      );
      if (!updated) throw new Error('Mail message was not found after move.');
      notifyMailMessageChange(
        this.dependencies.messageChangeNotifier,
        account.userId,
        this.dependencies.logger,
      );
      return updated;
    } finally {
      await closeAdapter(adapter);
    }
  }

  public async deleteMessage(
    context: MailOperationContext,
    account: MailAccount,
    message: MailMessage,
    input: import('../../shared/mail.js').MailDeleteMessageInput,
  ): Promise<void> {
    if (message.scheduledSend)
      throw mailFailedPrecondition(
        'MAIL_DRAFT_SCHEDULED',
        'Cancel the scheduled delivery before moving or deleting this draft.',
      );
    if (isLocalDraftMessage(message)) {
      let adapter: MailProviderAdapter | undefined;
      try {
        if (message.providerDraftMessageId) {
          adapter = await this.dependencies.adapters.resolve(
            account,
            context.signal,
          );
          if (adapter instanceof ImapSmtpAdapter) {
            const base = adapter;
            try {
              adapter = await base.forMessage(
                message.id,
                message.providerDraftMessageId,
                'delete',
              );
            } finally {
              await closeAdapter(base);
            }
          }
          if (adapter.deleteMessage) {
            await adapter.deleteMessage(
              message.providerDraftMessageId,
              true,
              context.signal,
            );
          }
        }
      } catch {
        // Remote draft cleanup is best effort; local deletion remains authoritative.
      } finally {
        if (adapter) await closeAdapter(adapter);
      }
      const deleted = await this.dependencies.store.deleteMessage(
        account.id,
        message.id,
      );
      if (deleted) {
        notifyMailMessageChange(
          this.dependencies.messageChangeNotifier,
          account.userId,
          this.dependencies.logger,
        );
      }
      return;
    }
    let adapter = await this.dependencies.adapters.resolve(
      account,
      context.signal,
    );
    try {
      if (
        !input.permanently &&
        adapter.capabilities.moveMessage &&
        adapter.moveMessage
      ) {
        const trash = (
          await this.dependencies.store.listFolders(account.id)
        ).find((folder) => folder.type === 'trash');
        if (trash) {
          const moved = assertProviderResult(
            await adapter.moveMessage(
              message.providerMessageId,
              trash.providerFolderId,
              context.signal,
            ),
          );
          const updated = await this.dependencies.store.moveMessage(
            account.id,
            message.id,
            moved.providerMessageId,
            trash.providerFolderId,
          );
          if (!updated)
            throw new Error('Mail message was not found after delete.');
          notifyMailMessageChange(
            this.dependencies.messageChangeNotifier,
            account.userId,
            this.dependencies.logger,
          );
          return;
        }
      }
      if (adapter instanceof ImapSmtpAdapter) {
        const base = adapter;
        try {
          adapter = await base.forMessage(
            message.id,
            message.providerMessageId,
            'delete',
          );
        } finally {
          await closeAdapter(base);
        }
      }
      if (!adapter.deleteMessage) {
        throw mailFailedPrecondition(
          'MAIL_PROVIDER_OPERATION_UNSUPPORTED',
          'The selected Mail Provider cannot delete messages.',
        );
      }
      const copies = commitsCopies(adapter);
      let result;
      try {
        result = await adapter.deleteMessage(
          message.providerMessageId,
          input.permanently ?? false,
          context.signal,
        );
      } finally {
        if (copies)
          notifyMailMessageChange(
            this.dependencies.messageChangeNotifier,
            account.userId,
            this.dependencies.logger,
          );
      }
      assertProviderResult(result);
      // IMAP removes the message only after its last copy is confirmed gone.
      if (copies) return;
      const deleted = await this.dependencies.store.deleteMessage(
        account.id,
        message.id,
      );
      if (deleted) {
        notifyMailMessageChange(
          this.dependencies.messageChangeNotifier,
          account.userId,
          this.dependencies.logger,
        );
      }
    } finally {
      await closeAdapter(adapter);
    }
  }
}
