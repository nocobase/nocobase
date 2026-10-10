import type { MailOperationContext } from '../../shared/mail.js';
import type {
  MailListMessageSyncEventsInput,
  MailMessageSyncEventsPage,
} from '../contracts/message-sync-events.js';
import { requireOwnedAccount } from './access.js';
import type { MailServiceDependencies } from './dependencies.js';
import { mailAccountNotFound, mailAccountRemoving } from './errors.js';

export class MailMessageSyncEventsService {
  public constructor(
    private readonly dependencies: MailServiceDependencies<
      'getAccount' | 'listMessageSyncEvents',
      never
    >,
  ) {}

  public async listMessageSyncEvents(
    context: MailOperationContext,
    input: MailListMessageSyncEventsInput,
  ): Promise<MailMessageSyncEventsPage> {
    await requireOwnedAccount(
      this.dependencies.store,
      context,
      input.accountId,
    );
    return this.dependencies.store.listMessageSyncEvents(input);
  }

  /** Trusted management entry: callers must authorize mail.management access. */
  public async listManagedMessageSyncEvents(
    _context: MailOperationContext,
    input: MailListMessageSyncEventsInput,
  ): Promise<MailMessageSyncEventsPage> {
    const account = await this.dependencies.store.getAccount(input.accountId);
    if (!account) throw mailAccountNotFound();
    if (account.status === 'removing') throw mailAccountRemoving();
    return this.dependencies.store.listMessageSyncEvents(input);
  }
}
