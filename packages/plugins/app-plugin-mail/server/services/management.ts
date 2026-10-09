import { MailMessageMutations } from '../operations/message-mutations.js';
import {
  type MailFolder,
  type MailListMessagesInput,
  type MailManagedAccountView,
  type MailManagementMessageActionInput,
  type MailManagementMessageActionItemResult,
  type MailManagementMessageActionResult,
  type MailMessage,
  type MailMessageSummary,
  type MailOffsetPage,
  type MailOperationContext,
  type MailPage,
  type MailSubmissionLogView,
  type MailSyncRunView,
} from '../../shared/mail.js';
import {
  toMailAccountView,
  toSubmissionLogView,
  toSyncRunView,
} from '../views.js';
import { type MailServiceDependencies } from './dependencies.js';
import { mailAccountNotFound, toManagementActionError } from './errors.js';

/** Trusted management entry: callers must authorize mail.management access. */
export class MailManagementService {
  private readonly mutations: MailMessageMutations;
  public constructor(
    private readonly dependencies: MailServiceDependencies<
      | 'deleteMessage'
      | 'getAccount'
      | 'getMessageForAccount'
      | 'listAllAccounts'
      | 'listAllMessages'
      | 'listAllSubmissions'
      | 'listAllSyncRuns'
      | 'listFolders'
      | 'moveMessage'
      | 'updateMessageState',
      'adapters' | 'messageChangeNotifier' | 'logger' | 'registry' | 'users'
    >,
  ) {
    this.mutations = new MailMessageMutations(dependencies);
  }

  public async listManagedAccounts(
    context: MailOperationContext,
  ): Promise<readonly MailManagedAccountView[]> {
    const accounts = await this.dependencies.store.listAllAccounts();
    const ownerNames = new Map<string, string>();
    if (this.dependencies.users) {
      const userIds = [...new Set(accounts.map((account) => account.userId))];
      for (let offset = 0; offset < userIds.length; offset += 100) {
        const { items } = await this.dependencies.users.list({
          userIds: userIds.slice(offset, offset + 100),
          pageSize: 100,
        });
        for (const user of items) {
          ownerNames.set(user.id, user.username?.trim() || user.name);
        }
      }
    }
    return accounts.map((account) => ({
      ...toMailAccountView(account),
      ownerName: ownerNames.get(account.userId),
      canSync: account.userId === context.actorId,
      canMoveMessages:
        this.dependencies.registry?.definition(account.provider.type)
          ?.capabilities.moveMessage ?? false,
    }));
  }

  public async listManagedSyncRunsPage(
    context: MailOperationContext,
    offset: number,
    limit: number,
  ): Promise<MailOffsetPage<MailSyncRunView>> {
    const page = await this.dependencies.store.listAllSyncRuns(offset, limit);
    const owners = new Map<string, string | undefined>();
    for (const accountId of new Set(page.items.map((run) => run.accountId))) {
      owners.set(
        accountId,
        (await this.dependencies.store.getAccount(accountId))?.userId,
      );
    }
    return {
      items: page.items.map((run) => ({
        ...toSyncRunView(run),
        canManage: owners.get(run.accountId) === context.actorId,
      })),
      total: page.total,
    };
  }

  public async listManagedSubmissionsPage(
    _context: MailOperationContext,
    offset: number,
    limit: number,
  ): Promise<MailOffsetPage<MailSubmissionLogView>> {
    const page = await this.dependencies.store.listAllSubmissions(
      offset,
      limit,
    );
    return { items: page.items.map(toSubmissionLogView), total: page.total };
  }

  public async listManagedFolders(
    _context: MailOperationContext,
    accountId: string,
  ): Promise<readonly MailFolder[]> {
    if (!(await this.dependencies.store.getAccount(accountId))) {
      throw mailAccountNotFound();
    }
    return this.dependencies.store.listFolders(accountId);
  }

  public listManagedMessages(
    _context: MailOperationContext,
    input: MailListMessagesInput,
  ): Promise<MailPage<MailMessageSummary>> {
    return this.dependencies.store.listAllMessages(input);
  }

  public getManagedMessage(
    _context: MailOperationContext,
    accountId: string,
    messageId: string,
  ): Promise<MailMessage | undefined> {
    return this.dependencies.store.getMessageForAccount(accountId, messageId);
  }

  public async manageMessages(
    context: MailOperationContext,
    input: MailManagementMessageActionInput,
  ): Promise<MailManagementMessageActionResult> {
    const items: MailManagementMessageActionItemResult[] = [];
    for (const target of input.items) {
      try {
        await this.executeManagedMessageAction(context, target, input);
        items.push({ ...target, status: 'succeeded' });
      } catch (cause) {
        items.push({
          ...target,
          status: 'failed',
          error: toManagementActionError(cause),
        });
      }
    }
    return {
      items,
      succeeded: items.filter((item) => item.status === 'succeeded').length,
      failed: items.filter((item) => item.status === 'failed').length,
    };
  }

  private async executeManagedMessageAction(
    context: MailOperationContext,
    target: MailManagementMessageActionInput['items'][number],
    input: MailManagementMessageActionInput,
  ): Promise<void> {
    const account = await this.dependencies.store.getAccount(target.accountId);
    if (!account) throw new Error('Mail account was not found.');
    if (account.status !== 'active') {
      throw new Error('Mail account is not active.');
    }
    const message = await this.dependencies.store.getMessageForAccount(
      account.id,
      target.messageId,
    );
    if (!message) throw new Error('Mail message was not found.');
    const targetInput = { accountId: account.id, messageId: message.id };
    switch (input.action) {
      case 'markRead':
      case 'markUnread':
        await this.mutations.updateMessage(context, account, message, {
          ...targetInput,
          read: input.action === 'markRead',
        });
        return;
      case 'star':
      case 'unstar':
        await this.mutations.updateMessage(context, account, message, {
          ...targetInput,
          starred: input.action === 'star',
        });
        return;
      case 'archive':
      case 'move': {
        const destination = (
          await this.dependencies.store.listFolders(account.id)
        ).find((folder) =>
          input.action === 'archive'
            ? folder.type === 'archive'
            : folder.providerFolderId === input.providerFolderId,
        );
        if (!destination)
          throw new Error('Mail destination folder was not found.');
        await this.mutations.moveMessage(context, account, message, {
          ...targetInput,
          providerFolderId: destination.providerFolderId,
        });
        return;
      }
      case 'delete':
        await this.mutations.deleteMessage(context, account, message, {
          ...targetInput,
          permanently: input.permanently,
        });
    }
  }
}
