import type {
  MailProviderAdapter,
  MailProviderAccount,
  MailProviderConnection,
  MailProviderContext,
  MailProviderDefinition,
} from '../../contracts/provider.js';

import type { ImapSmtpCredential } from './types.js';
import type { ImapSmtpMailProviderConfig } from './config.js';
import { IMAP_SMTP_CAPABILITIES } from './constants.js';
import { ImapSmtpAdapter } from './adapter.js';
import { validateConfig, verifyConnections } from './connection.js';
import { classifyError, failure } from './errors.js';

export const imapSmtpMailProviderDefinition: MailProviderDefinition<ImapSmtpMailProviderConfig> =
  {
    type: 'imap-smtp',
    label: 'IMAP / SMTP',
    capabilities: IMAP_SMTP_CAPABILITIES,
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
      return new ImapSmtpAdapter(context, config, account, credential);
    },
  };

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
        return { ok: false, error: classifyError(error, 'IMAP_SMTP_CONNECT') };
      }
    },
  };
}
