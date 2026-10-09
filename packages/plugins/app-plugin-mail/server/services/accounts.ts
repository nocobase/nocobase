import { notifyMailMessageChange } from '../realtime.js';
import {
  type MailAccountView,
  type MailOperationContext,
} from '../../shared/mail.js';
import { toMailAccountView } from '../views.js';
import { type MailServiceDependencies } from './dependencies.js';
import {
  mailAccountNotFound,
  mailAccountRemoving,
  mailFailedPrecondition,
} from './errors.js';

export class MailAccountsService {
  public constructor(
    private readonly dependencies: MailServiceDependencies<
      | 'cancelSyncRun'
      | 'findActiveSyncRun'
      | 'getAccount'
      | 'listAccounts'
      | 'markAccountRemoving'
      | 'updateAccountStatus',
      'outbox' | 'messageChangeNotifier' | 'logger'
    >,
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
    if (input.status !== undefined) {
      await this.dependencies.store.updateAccountStatus(
        account.id,
        input.status,
      );
      updated = { ...account, status: input.status };
      if (updated.status !== account.status) {
        notifyMailMessageChange(
          this.dependencies.messageChangeNotifier,
          context.actorId,
          this.dependencies.logger,
        );
      }
    }
    return toMailAccountView(updated);
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
