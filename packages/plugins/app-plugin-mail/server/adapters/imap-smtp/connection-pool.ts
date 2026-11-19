import { createHash } from 'node:crypto';
import type { ImapFlow } from 'imapflow';

import { createImapClient } from './connection.js';
import type { ImapSmtpEndpointConfig } from './config.js';
import type { ImapSmtpCredential } from './types.js';

interface Connection {
  readonly accountId: string;
  readonly key: string;
  readonly client: ImapFlow;
  timer?: ReturnType<typeof setTimeout>;
}

/** Each borrower owns its connection; only one idle connection per account is retained. */
export class ImapConnectionPool {
  private readonly idle = new Map<string, Connection>();
  private readonly connections = new Map<ImapFlow, Connection>();
  private closed = false;

  public constructor(
    private readonly createClient: typeof createImapClient = createImapClient,
  ) {}

  public async acquire(
    accountId: string,
    endpoint: ImapSmtpEndpointConfig,
    credential: ImapSmtpCredential,
  ): Promise<ImapFlow> {
    if (this.closed) throw new Error('The IMAP connection pool is closed.');
    const key = createHash('sha256')
      .update(
        JSON.stringify([
          accountId,
          endpoint.host,
          endpoint.port,
          endpoint.secure,
          endpoint.rejectUnauthorized ?? true,
          credential.username,
          credential.password,
        ]),
      )
      .digest('hex');
    const cached = this.idle.get(accountId);
    if (cached) {
      clearTimeout(cached.timer);
      this.idle.delete(accountId);
      cached.timer = undefined;
      if (cached.key === key && cached.client.usable) return cached.client;
      this.destroy(cached.client);
    }
    const client = this.createClient(endpoint, credential);
    this.connections.set(client, { accountId, key, client });
    try {
      await client.connect();
      if (this.closed) throw new Error('The IMAP connection pool is closed.');
      return client;
    } catch (error) {
      this.destroy(client);
      throw error;
    }
  }

  public async release(client: ImapFlow): Promise<void> {
    const connection = this.connections.get(client);
    if (!connection) return;
    if (connection.timer) return;
    if (this.closed || !client.usable || this.idle.has(connection.accountId)) {
      await this.retire(client);
      return;
    }
    this.idle.set(connection.accountId, connection);
    connection.timer = setTimeout(() => {
      void this.retire(client);
    }, 60_000);
    connection.timer.unref();
  }

  public destroy(client: ImapFlow): void {
    this.forget(client);
    client.close();
  }

  public async closeAll(): Promise<void> {
    this.closed = true;
    await Promise.all(
      [...this.connections.keys()].map((client) => this.retire(client)),
    );
  }

  private forget(client: ImapFlow): void {
    const connection = this.connections.get(client);
    if (!connection) return;
    clearTimeout(connection.timer);
    if (this.idle.get(connection.accountId) === connection)
      this.idle.delete(connection.accountId);
    this.connections.delete(client);
  }

  private async retire(client: ImapFlow): Promise<void> {
    this.forget(client);
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }
}
