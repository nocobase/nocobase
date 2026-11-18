import { notifyMailMessageChange } from '../realtime.js';
import {
  type MailAccount,
  type MailAccountView,
  type MailOperationContext,
  type MailSyncFolderPreview,
} from '../../shared/mail.js';
import { requireActiveAccount } from './access.js';
import { type MailSyncService } from './sync.js';
import { toMailAccountView } from '../views.js';
import { type MailServiceDependencies } from './dependencies.js';
import {
  mailAccountInactive,
  mailAccountNotFound,
  mailAccountRemoving,
  mailFailedPrecondition,
  mailInvalidArgument,
} from './errors.js';

export class MailAccountsService {
  public constructor(
    private readonly dependencies: MailServiceDependencies<
      | 'cancelSyncRun'
      | 'findActiveSyncRun'
      | 'getAccount'
      | 'listAccounts'
      | 'markAccountRemoving'
      | 'updateAccountStatus'
      | 'listFolders'
      | 'updateAccountSyncFolders'
      | 'countMessagesOutsideSyncFolders',
      'outbox' | 'messageChangeNotifier' | 'logger'
    >,
    private readonly sync: Pick<MailSyncService, 'restartInitialSync'>,
  ) {}

  public async listAccounts(
    context: MailOperationContext,
  ): Promise<readonly MailAccountView[]> {
    return (await this.dependencies.store.listAccounts(context.actorId)).map(
      toMailAccountView,
    );
  }

  public async updateAccount(
    context: MailOperationContext,
    input: import('../../shared/mail.js').MailUpdateAccountInput,
  ): Promise<MailAccountView> {
    const account = await this.dependencies.store.getAccount(input.accountId);
    if (!account || account.userId !== context.actorId) {
      throw mailAccountNotFound();
    }

    if (account.status === 'removing') throw mailAccountRemoving();
    let updated = account;
    if (input.status) {
      if (
        input.status === 'active' &&
        !['active', 'suspended'].includes(updated.status)
      ) {
        throw mailFailedPrecondition(
          'MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED',
          'This Mail account must be reauthorized.',
        );
      }
    }
    if (
      input.syncFolderIds !== undefined &&
      (input.status ?? updated.status) !== 'active'
    )
      throw mailAccountInactive();
    const selection =
      input.syncFolderIds === undefined
        ? undefined
        : { value: await this.validSyncFolders(account, input.syncFolderIds) };
    if (input.status !== undefined) {
      await this.dependencies.store.updateAccountStatus(
        account.id,
        input.status,
      );
      updated = { ...account, status: input.status };
      this.dependencies.outbox.accountChanged?.(updated);
      if (updated.status !== account.status) {
        notifyMailMessageChange(
          this.dependencies.messageChangeNotifier,
          context.actorId,
          this.dependencies.logger,
        );
      }
    }
    if (selection)
      updated = await this.updateSyncFolders(context, updated, selection.value);
    return toMailAccountView(updated);
  }

  /** What saving a folder selection would delete locally; selecting every folder deletes nothing. */
  public async previewSyncFolders(
    context: MailOperationContext,
    accountId: string,
    syncFolderIds: readonly string[] | null,
  ): Promise<MailSyncFolderPreview> {
    const account = await requireActiveAccount(
      this.dependencies.store,
      context,
      accountId,
    );
    const selection = await this.validSyncFolders(account, syncFolderIds);
    return {
      removedMessageCount: selection
        ? await this.dependencies.store.countMessagesOutsideSyncFolders(
            account.id,
            selection,
          )
        : 0,
    };
  }

  private async updateSyncFolders(
    context: MailOperationContext,
    account: MailAccount,
    selection: readonly string[] | undefined,
  ): Promise<MailAccount> {
    if (sameSelection(account.syncFolderIds, selection)) return account;
    if (
      !(await this.dependencies.store.updateAccountSyncFolders(
        account.id,
        selection,
      ))
    )
      throw mailAccountInactive();
    const { syncFolderIds: _previous, ...rest } = account;
    const updated: MailAccount = selection
      ? { ...rest, syncFolderIds: selection }
      : rest;
    this.dependencies.outbox.accountChanged?.(updated);
    await this.sync.restartInitialSync(context, updated);
    return updated;
  }

  private async validSyncFolders(
    account: MailAccount,
    syncFolderIds: readonly string[] | null,
  ): Promise<readonly string[] | undefined> {
    if (syncFolderIds === null) return undefined;
    const selection = [...new Set(syncFolderIds)];
    if (selection.length === 0)
      throw mailInvalidArgument(
        'Select at least one folder to synchronize.',
        'syncFolderIds',
      );
    const known = new Set(
      (await this.dependencies.store.listFolders(account.id)).map(
        (folder) => folder.providerFolderId,
      ),
    );
    if (selection.some((id) => !known.has(id)))
      throw mailInvalidArgument(
        'Every selected folder must be a folder of this account.',
        'syncFolderIds',
      );
    return selection;
  }

  public async removeAccount(
    context: MailOperationContext,
    accountId: string,
  ): Promise<MailAccountView | undefined> {
    const account = await this.dependencies.store.getAccount(accountId);
    if (!account || account.userId !== context.actorId) {
      throw mailAccountNotFound();
    }
    if (
      !(await this.dependencies.store.markAccountRemoving(
        account.id,
        context.actorId,
      ))
    ) {
      throw mailAccountNotFound();
    }
    this.dependencies.outbox.accountChanged?.({
      ...account,
      status: 'removing',
    });
    const activeSyncRun =
      await this.dependencies.store.findActiveSyncRun(accountId);
    if (activeSyncRun) {
      // Removing the account also cancels its queued or running local sync.
      // Marking the account first prevents another sync from being scheduled
      // while the account's records are being deleted.
      await this.dependencies.store.cancelSyncRun(activeSyncRun.id);
    }
    // Read the account back before waking the outbox, so the answer shows its `removing` state rather than racing
    // the background deletion.
    const removing = await this.dependencies.store.getAccount(account.id);
    this.dependencies.outbox.kick();
    notifyMailMessageChange(
      this.dependencies.messageChangeNotifier,
      context.actorId,
      this.dependencies.logger,
    );
    return removing ? toMailAccountView(removing) : undefined;
  }
}

function sameSelection(
  current: readonly string[] | undefined,
  next: readonly string[] | undefined,
): boolean {
  if (current === undefined || next === undefined) return current === next;
  const selected = new Set(current);
  return (
    current.length === next.length && next.every((id) => selected.has(id))
  );
}
