import { AsyncLocalStorage } from 'node:async_hooks';

/** Diagnostic correlation only; never consulted by scheduling or persistence. */
export interface MailPushTiming {
  readonly notificationId: string;
  readonly receivedAt: string;
  readonly source: 'exists' | 'connect';
}

export const mailPushTiming: AsyncLocalStorage<MailPushTiming> =
  new AsyncLocalStorage<MailPushTiming>();
