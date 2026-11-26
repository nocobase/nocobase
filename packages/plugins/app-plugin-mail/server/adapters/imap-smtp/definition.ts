import type {
  MailProviderAdapter,
  MailProviderAccount,
  MailProviderConnection,
  MailProviderContext,
  MailProviderDefinition,
} from '../../contracts/provider.js';

import type { ImapLocationPersistence, ImapSmtpCredential } from './types.js';
import type { ImapSmtpMailProviderConfig } from './config.js';
import {
  IMAP_SMTP_CAPABILITIES,
  IMAP_SMTP_LOCATION_CAPABILITIES,
} from './constants.js';
import { ImapSmtpAdapter } from './adapter.js';
import { ImapConnectionPool } from './connection-pool.js';
import { validateConfig, verifyConnections } from './connection.js';
import {
  logMailFailure,
  MailConnectionError,
} from '../../connection-diagnostics.js';
import { classifyError, failure } from './errors.js';

/**
 * Mail registers this definition with persistence bound to each account, so
 * every adapter instance reads and commits only its own account's copies.
 */
export function createImapSmtpMailProviderDefinition(
  locations?: (accountId: string) => ImapLocationPersistence,
  pool: ImapConnectionPool = new ImapConnectionPool(),
): MailProviderDefinition<ImapSmtpMailProviderConfig> {
  return {
    type: 'imap-smtp',
    label: 'IMAP / SMTP',
    capabilities: locations
      ? IMAP_SMTP_LOCATION_CAPABILITIES
      : IMAP_SMTP_CAPABILITIES,
    validateConfig,
    connection: createConnection(),
    async createAdapter(
      context: MailProviderContext,
      config: ImapSmtpMailProviderConfig,
      account: MailProviderAccount,
    ): Promise<MailProviderAdapter> {
      const credential = await context.credentials.get<ImapSmtpCredential>(
        account.credentialReference,
      );
      return new ImapSmtpAdapter(
        context,
        config,
        account,
        credential,
        locations?.(account.id),
        undefined,
        undefined,
        undefined,
        pool,
      );
    },
  };
}

/** Protocol-only definition without location persistence. */
export const imapSmtpMailProviderDefinition: MailProviderDefinition<ImapSmtpMailProviderConfig> =
  createImapSmtpMailProviderDefinition();

function createConnection(): MailProviderConnection<ImapSmtpMailProviderConfig> {
  return {
    async connect(context, config, input) {
      if (!input.address.trim()) {
        return failure(
          'IMAP_SMTP_ADDRESS_REQUIRED',
          'A mailbox address is required.',
          'configuration',
          false,
        );
      }
      if (!input.username.trim() || !input.password) {
        return failure(
          'IMAP_SMTP_CREDENTIALS_REQUIRED',
          'An IMAP username and password are required.',
          'authentication',
          false,
        );
      }
      const startedAt = Date.now();
      try {
        await verifyConnections(config, {
          username: input.username,
          password: input.password,
        });
        const credentialReference = await context.credentials.put(
          {
            username: input.username,
            password: input.password,
          } satisfies ImapSmtpCredential,
          { purpose: 'account' },
        );
        return {
          ok: true,
          value: {
            address: input.address.trim().toLowerCase(),
            displayName: input.displayName?.trim() || undefined,
            authorizationSubject: input.username,
            credentialReference,
            scopes: [],
            identities: [
              {
                address: input.address.trim().toLowerCase(),
                displayName: input.displayName?.trim() || undefined,
                isPrimary: true,
                canSend: true,
              },
            ],
          },
        };
      } catch (error) {
        const classified = classifyError(error, 'IMAP_SMTP_CONNECT');
        const protocol =
          error instanceof MailConnectionError && error.protocol === 'smtp'
            ? 'smtp'
            : 'imap';
        logMailFailure(error, classified, {
          logger: context.logger,
          event: 'mail.account.connect_failed',
          provider: 'imap-smtp',
          address: input.address,
          protocol,
          endpoint: config[protocol],
          stage: 'connect',
          startedAt,
          secrets: [input.username, input.password],
        });
        return { ok: false, error: classified };
      }
    },
  };
}
