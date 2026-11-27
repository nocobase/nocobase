import { syncedFolders } from './sync-folders.js';
import { MailMessageMutations } from '../operations/message-mutations.js';
import {
  type MailAccount,
  type MailAdminAccountFilter,
  type MailAdminAccountView,
  type MailFolder,
  type MailManagedLogFilter,
  type MailManagedSubmissionView,
  type MailTeamAccountView,
  type MailListMessagesInput,
  type MailManagedAccountView,
  type MailManagementMessageActionInput,
  type MailManagementMessageActionItemResult,
  type MailManagementMessageActionResult,
  type MailMessage,
  type MailMessageSummary,
  type MailOperationContext,
  type MailPage,
  type MailSyncRunView,
} from '../../shared/mail.js';
import { type MailProviderAccountCount } from '../contracts/persistence.js';
import {
  toManagedSubmissionView,
  toManagedSyncRunView,
  toMailAccountView,
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
      | 'getMessage'
      | 'getMessageForAccount'
      | 'listAccounts'
      | 'listAllAccounts'
      | 'listAllMessages'
      | 'listAllSubmissions'
      | 'listAllSyncRuns'
      | 'listLastSyncedAt'
      | 'countAccountsByProvider'
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
    const ownerNames = await this.ownerNames(accounts);
    return accounts.map((account) => ({
      ...toMailAccountView(account),
      ownerName: ownerNames.get(account.userId),
      canSync: account.userId === context.actorId,
      canMoveMessages: this.canMoveMessages(account),
    }));
  }

  /** Every member's accounts for the Mail settings page, without scopes, folders or other mailbox detail. */
  public async listAdminAccounts(
    _context: MailOperationContext,
    filter: MailAdminAccountFilter = {},
  ): Promise<readonly MailAdminAccountView[]> {
    const [accounts, lastSyncedAt] = await Promise.all([
      this.dependencies.store.listAllAccounts(),
      this.dependencies.store.listLastSyncedAt?.() ??
        Promise.resolve(new Map<string, string>()),
    ]);
    const ownerNames = await this.ownerNames(accounts);
    const query = filter.q?.trim().toLowerCase();
    return accounts
      .filter(
        (account) =>
          (!filter.statuses?.length ||
            filter.statuses.includes(account.status)) &&
          (filter.providerName === undefined ||
            account.provider.name === filter.providerName) &&
          (filter.userId === undefined || account.userId === filter.userId) &&
          (!query ||
            [
              account.address,
              account.displayName,
              ownerNames.get(account.userId),
            ].some((value) => value?.toLowerCase().includes(query))),
      )
      .map((account) => ({
        id: account.id,
        userId: account.userId,
        ownerName: ownerNames.get(account.userId),
        address: account.address,
        displayName: account.displayName,
        provider: { type: account.provider.type, name: account.provider.name },
        status: account.status,
        removalFailed: account.removalFailed,
        lastSyncedAt: lastSyncedAt.get(account.id),
      }));
  }

  /** Every member's accounts as Team mail's filters offer them: owner and address only. */
  public async listTeamAccounts(
    _context: MailOperationContext,
  ): Promise<readonly MailTeamAccountView[]> {
    const accounts = await this.dependencies.store.listAllAccounts();
    const ownerNames = await this.ownerNames(accounts);
    return accounts.map((account) => ({
      id: account.id,
      userId: account.userId,
      ownerName: ownerNames.get(account.userId),
      address: account.address,
      displayName: account.displayName,
      canMoveMessages: this.canMoveMessages(account),
    }));
  }

  /**
   * Every member's sync runs, newest first, continuing after `pageToken`. `canManage` is whether the caller holds
   * `settings:mail.admin/manage`, the permission the settings retry and cancel routes require; a run of the caller's own
   * is managed from their Mail accounts page instead. Failures carry only their code and category.
   */
  public async listManagedSyncRunsPage(
    _context: MailOperationContext,
    pageToken: string | undefined,
    limit: number,
    filter: MailManagedLogFilter = {},
    canManage = false,
  ): Promise<MailPage<MailSyncRunView>> {
    const page = await this.dependencies.store.listAllSyncRuns(
      pageToken,
      limit,
      filter,
    );
    return {
      ...page,
      items: page.items.map((run) =>
        toManagedSyncRunView(toSyncRunView(run), canManage),
      ),
    };
  }

  /**
   * Every member's submissions, newest first, as the Mail settings page shows them: account, recipient count, result
   * and failure, never the subject, body or addresses. `canManage` as for sync runs.
   */
  public async listManagedSubmissionsPage(
    _context: MailOperationContext,
    pageToken: string | undefined,
    limit: number,
    filter: MailManagedLogFilter = {},
    canManage = false,
  ): Promise<MailPage<MailManagedSubmissionView>> {
    const page = await this.dependencies.store.listAllSubmissions(
      pageToken,
      limit,
      filter,
    );
    return {
      ...page,
      items: page.items.map((submission) =>
        toManagedSubmissionView(submission, canManage),
      ),
    };
  }

  /** How many accounts each configured Provider has in each status. */
  public countAccountsByProvider(): Promise<
    readonly MailProviderAccountCount[]
  > {
    return (
      this.dependencies.store.countAccountsByProvider?.() ?? Promise.resolve([])
    );
  }

  private canMoveMessages(account: MailAccount): boolean {
    return (
      this.dependencies.registry?.definition(account.provider.type)
        ?.capabilities.moveMessage ?? false
    );
  }

  private async ownerNames(
    accounts: readonly MailAccount[],
  ): Promise<ReadonlyMap<string, string>> {
    const ownerNames = new Map<string, string>();
    if (!this.dependencies.users) return ownerNames;
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
    return ownerNames;
  }

  public async listManagedFolders(
    _context: MailOperationContext,
    accountId: string,
  ): Promise<readonly MailFolder[]> {
    const account = await this.dependencies.store.getAccount(accountId);
    if (!account) throw mailAccountNotFound();
    return syncedFolders(
      account,
      await this.dependencies.store.listFolders(accountId),
    );
  }

  /** Every member's messages; `userId` narrows them to one member's accounts. */
  public async listManagedMessages(
    _context: MailOperationContext,
    input: MailListMessagesInput,
    userId?: string,
  ): Promise<MailPage<MailMessageSummary>> {
    if (userId === undefined)
      return this.dependencies.store.listAllMessages(input);
    const memberAccountIds = (
      await this.dependencies.store.listAccounts(userId)
    )
      .map((account) => account.id)
      .filter(
        (id) => input.accountIds === undefined || input.accountIds.includes(id),
      );
    if (memberAccountIds.length === 0)
      return { items: [], ...(input.withTotal ? { total: 0 } : {}) };
    return this.dependencies.store.listAllMessages({
      ...input,
      accountIds: memberAccountIds,
    });
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
        const destination = syncedFolders(
          account,
          await this.dependencies.store.listFolders(account.id),
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
