import {
  type MailAccount,
  type MailMessage,
  type MailOperationContext,
} from '../../shared/mail.js';
import { type MailStore } from '../contracts/persistence.js';
import {
  mailAccountInactive,
  mailAccountNotFound,
  mailAccountRemoving,
  mailMessageNotFound,
} from './errors.js';

export async function requireOwnedAccount(
  store: Pick<MailStore, 'getAccount'>,
  context: MailOperationContext,
  accountId: string,
): Promise<void> {
  const account = await store.getAccount(accountId);
  if (!account || account.userId !== context.actorId) {
    throw mailAccountNotFound();
  }
  if (account.status === 'removing') throw mailAccountRemoving();
}

export async function requireOwnedMessage(
  store: Pick<MailStore, 'getAccount' | 'getMessage'>,
  context: MailOperationContext,
  accountId: string,
  messageId: string,
): Promise<OwnedMailMessage> {
  const account = await store.getAccount(accountId);
  if (!account || account.userId !== context.actorId) {
    throw mailAccountNotFound();
  }
  if (account.status !== 'active') {
    throw mailAccountInactive();
  }
  const message = await store.getMessage(context.actorId, accountId, messageId);
  if (!message) throw mailMessageNotFound();
  return { account, message };
}

export async function requireActiveAccount(
  store: Pick<MailStore, 'getAccount'>,
  context: MailOperationContext,
  accountId: string,
): Promise<MailAccount> {
  const account = await store.getAccount(accountId);
  if (!account || account.userId !== context.actorId) {
    throw mailAccountNotFound();
  }
  if (account.status !== 'active') {
    throw mailAccountInactive();
  }
  return account;
}

export interface OwnedMailMessage {
  readonly account: MailAccount;
  readonly message: MailMessage;
}
