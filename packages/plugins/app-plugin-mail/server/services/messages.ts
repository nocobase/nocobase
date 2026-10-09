import { MailMessageMutations } from '../operations/message-mutations.js';
import { notifyMailMessageChange } from '../realtime.js';
import {
  type MailFolder,
  type MailListConversationMessagesInput,
  type MailListMessagesInput,
  type MailMessage,
  type MailMessageSummary,
  type MailOperationContext,
  type MailPage,
} from '../../shared/mail.js';
import { requireOwnedAccount, requireOwnedMessage } from './access.js';
import { type MailServiceDependencies } from './dependencies.js';
import { assertProviderResult } from './errors.js';
import { closeAdapter } from './provider-lifecycle.js';
import { mailFailedPrecondition, mailNotFound } from './errors.js';

export class MailMessagesService {
  private readonly mutations: MailMessageMutations;
  public constructor(
    private readonly dependencies: MailServiceDependencies<
      | 'countUnreadMessages'
      | 'deleteMessage'
      | 'getAccount'
      | 'getMessage'
      | 'listConversationMessages'
      | 'listFolders'
      | 'listLabels'
      | 'listMessages'
      | 'moveMessage'
      | 'saveMessageContent'
      | 'updateMessageLabels'
      | 'updateMessageState',
      'messageChangeNotifier' | 'logger' | 'adapters'
    >,
  ) {
    this.mutations = new MailMessageMutations(dependencies);
  }

  public async listFolders(
    context: MailOperationContext,
    accountId: string,
  ): Promise<readonly MailFolder[]> {
    await requireOwnedAccount(this.dependencies.store, context, accountId);
    return this.dependencies.store.listFolders(accountId);
  }

  public async updateMessageLabels(
    context: MailOperationContext,
    input: import('../../shared/mail.js').MailUpdateMessageLabelsInput,
  ): Promise<MailMessage> {
    const { message } = await requireOwnedMessage(
      this.dependencies.store,
      context,
      input.accountId,
      input.messageId,
    );
    const add = [...new Set(input.addLabelIds ?? [])];
    const remove = [...new Set(input.removeLabelIds ?? [])].filter(
      (id) => !add.includes(id),
    );
    const labels = new Set(
      (await this.dependencies.store.listLabels(context.actorId)).map(
        (label) => label.id,
      ),
    );
    if ([...add, ...remove].some((id) => !labels.has(id))) {
      throw mailNotFound(
        'MAIL_LABEL_NOT_FOUND',
        'Mail label was not found.',
        'addLabelIds',
      );
    }
    if (add.length === 0 && remove.length === 0) return message;
    const updated = await this.dependencies.store.updateMessageLabels(
      input.accountId,
      message.id,
      add,
      remove,
    );
    if (!updated) throw new Error('Mail message was not found after update.');
    notifyMailMessageChange(
      this.dependencies.messageChangeNotifier,
      context.actorId,
      this.dependencies.logger,
    );
    return updated;
  }

  public getUnreadCount(context: MailOperationContext): Promise<number> {
    return this.dependencies.store.countUnreadMessages(context.actorId);
  }

  public listMessages(
    context: MailOperationContext,
    input: MailListMessagesInput,
  ): Promise<MailPage<MailMessageSummary>> {
    return this.dependencies.store.listMessages(context.actorId, input);
  }

  public async retryMessageContent(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
  ): Promise<MailMessage> {
    const { account, message } = await requireOwnedMessage(
      this.dependencies.store,
      context,
      accountId,
      messageId,
    );
    if (!message.contentStatus || message.contentStatus === 'complete')
      return message;
    const adapter = await this.dependencies.adapters.resolve(
      account,
      context.signal,
    );
    try {
      if (!adapter.getMessage)
        throw mailFailedPrecondition(
          'MAIL_PROVIDER_OPERATION_UNSUPPORTED',
          'The mail Provider cannot load message content.',
        );
      const refreshed = assertProviderResult(
        await adapter.getMessage(message.providerMessageId, context.signal),
      );
      const saved = await this.dependencies.store.saveMessageContent(
        accountId,
        messageId,
        refreshed,
      );
      notifyMailMessageChange(
        this.dependencies.messageChangeNotifier,
        context.actorId,
        this.dependencies.logger,
      );
      return saved;
    } finally {
      await closeAdapter(adapter);
    }
  }

  public getMessage(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
  ): Promise<MailMessage | undefined> {
    return this.dependencies.store.getMessage(
      context.actorId,
      accountId,
      messageId,
    );
  }

  public async listConversationMessages(
    context: MailOperationContext,
    accountId: string,
    conversationId: string,
    input: MailListConversationMessagesInput = {},
  ): Promise<MailPage<MailMessage>> {
    await requireOwnedAccount(this.dependencies.store, context, accountId);
    return this.dependencies.store.listConversationMessages(
      context.actorId,
      accountId,
      conversationId,
      input,
    );
  }

  public async updateMessage(
    context: MailOperationContext,
    input: import('../../shared/mail.js').MailUpdateMessageInput,
  ): Promise<MailMessage> {
    const { account, message } = await requireOwnedMessage(
      this.dependencies.store,
      context,
      input.accountId,
      input.messageId,
    );
    return this.mutations.updateMessage(context, account, message, input);
  }
  public async moveMessage(
    context: MailOperationContext,
    input: import('../../shared/mail.js').MailMoveMessageInput,
  ): Promise<MailMessage> {
    const { account, message } = await requireOwnedMessage(
      this.dependencies.store,
      context,
      input.accountId,
      input.messageId,
    );
    return this.mutations.moveMessage(context, account, message, input);
  }
  public async deleteMessage(
    context: MailOperationContext,
    input: import('../../shared/mail.js').MailDeleteMessageInput,
  ): Promise<void> {
    const { account, message } = await requireOwnedMessage(
      this.dependencies.store,
      context,
      input.accountId,
      input.messageId,
    );
    return this.mutations.deleteMessage(context, account, message, input);
  }
}
