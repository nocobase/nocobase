import type { ImapFlow } from 'imapflow';
import type { MailAccount } from '../../shared/mail.js';
import type { MailCredentialVault } from '../contracts/provider.js';
import type { ImapSmtpMailProviderConfig } from '../adapters/imap-smtp/config.js';
import type { ImapSmtpCredential } from '../adapters/imap-smtp/types.js';
import { createImapClient } from '../adapters/imap-smtp/connection.js';
import { writeMailLog, type MailLogger } from '../logging.js';

interface Watch {
  readonly key: string;
  readonly account: MailAccount;
  readonly config: ImapSmtpMailProviderConfig;
  client?: ImapFlow;
  timer?: NodeJS.Timeout;
  failures: number;
}

/** One dedicated INBOX listener per active IMAP account in this application instance. */
export class MailImapIdle {
  private readonly watches = new Map<string, Watch>();
  private readonly pending = new Set<Promise<void>>();
  private closed = false;

  public constructor(
    private readonly options: {
      readonly credentials: MailCredentialVault;
      readonly resolveConfig: (
        account: MailAccount,
      ) => ImapSmtpMailProviderConfig;
      readonly schedulePushSync: (accountId: string) => Promise<unknown>;
      readonly logger?: MailLogger;
      readonly createClient?: typeof createImapClient;
    },
  ) {}

  public reconcile(accounts: readonly MailAccount[]): void {
    const ids = new Set(accounts.map((account) => account.id));
    for (const id of this.watches.keys()) if (!ids.has(id)) this.stop(id);
    for (const account of accounts) this.update(account);
  }

  public update(account: MailAccount): void {
    if (this.closed) return;
    if (account.status !== 'active' || account.provider.type !== 'imap-smtp') {
      this.stop(account.id);
      return;
    }
    let config: ImapSmtpMailProviderConfig;
    try {
      config = this.options.resolveConfig(account);
    } catch {
      this.stop(account.id);
      writeMailLog(
        this.options.logger,
        'error',
        { event: 'mail.imap.idle.configuration_failed', accountId: account.id },
        'Mail INBOX IDLE configuration could not be resolved.',
      );
      return;
    }
    const key = JSON.stringify([account.credentialReference, config.imap]);
    if (this.watches.get(account.id)?.key === key) return;
    this.stop(account.id);
    const watch: Watch = { key, account, config, failures: 0 };
    this.watches.set(account.id, watch);
    this.connect(watch);
  }

  private current(watch: Watch): boolean {
    return !this.closed && this.watches.get(watch.account.id) === watch;
  }

  private connect(watch: Watch): void {
    const pending = this.open(watch)
      .catch(() => {
        this.retry(watch);
      })
      .finally(() => {
        this.pending.delete(pending);
      });
    this.pending.add(pending);
  }

  private async open(watch: Watch): Promise<void> {
    const credential = await this.options.credentials.get<ImapSmtpCredential>(
      watch.account.credentialReference,
    );
    if (!this.current(watch)) return;
    const client = (this.options.createClient ?? createImapClient)(
      watch.config.imap,
      credential,
      true,
    );
    watch.client = client;
    client.on('error', () => client.close());
    client.on('close', () => {
      if (watch.client === client) this.retry(watch);
    });
    await client.connect();
    if (!this.current(watch)) {
      client.close();
      return;
    }
    if (!client.capabilities.has('IDLE')) {
      // Do not use ImapFlow's NOOP polling fallback on a server without IDLE.
      watch.client = undefined;
      client.close();
      writeMailLog(
        this.options.logger,
        'warn',
        { event: 'mail.imap.idle.unsupported', accountId: watch.account.id },
        'The IMAP server does not support IDLE. Automatic synchronization remains available.',
      );
      return;
    }
    await client.mailboxOpen('INBOX', { readOnly: true });
    if (!this.current(watch)) {
      client.close();
      return;
    }
    watch.failures = 0;
    client.on('exists', (event) => {
      if (
        this.current(watch) &&
        watch.client === client &&
        event.path === 'INBOX' &&
        event.count > event.prevCount
      )
        this.notify(watch);
    });
    // Also catch messages delivered while disconnected, before SELECT's baseline.
    this.notify(watch);
    writeMailLog(
      this.options.logger,
      'info',
      { event: 'mail.imap.idle.connected', accountId: watch.account.id },
      'Mail INBOX IDLE listener connected.',
    );
    const ended = (): void => {
      if (watch.client === client) this.retry(watch);
    };
    void client.idle().then(ended, ended);
  }

  private notify(watch: Watch): void {
    void this.options.schedulePushSync(watch.account.id).catch(() => {
      writeMailLog(
        this.options.logger,
        'error',
        {
          event: 'mail.imap.idle.schedule_failed',
          accountId: watch.account.id,
        },
        'IMAP IDLE could not schedule Mail synchronization.',
      );
    });
  }

  private retry(watch: Watch): void {
    if (!this.current(watch) || watch.timer) return;
    const client = watch.client;
    watch.client = undefined;
    // Set the timer first: closing may synchronously emit another close event.
    const delay = Math.min(60_000, 1_000 * 2 ** Math.min(watch.failures++, 6));
    watch.timer = setTimeout(() => {
      watch.timer = undefined;
      this.connect(watch);
    }, delay);
    watch.timer.unref();
    client?.close();
    writeMailLog(
      this.options.logger,
      'warn',
      {
        event: 'mail.imap.idle.reconnect',
        accountId: watch.account.id,
        delayMs: delay,
      },
      'Mail INBOX IDLE listener will reconnect.',
    );
  }

  private stop(accountId: string): void {
    const watch = this.watches.get(accountId);
    if (!watch) return;
    this.watches.delete(accountId);
    clearTimeout(watch.timer);
    watch.client?.close();
  }

  public async close(): Promise<void> {
    this.closed = true;
    for (const id of this.watches.keys()) this.stop(id);
    await Promise.allSettled([...this.pending]);
  }
}
