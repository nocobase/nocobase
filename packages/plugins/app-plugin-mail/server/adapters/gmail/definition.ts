import type {
  MailProviderAdapter,
  MailProviderAccount,
  MailProviderContext,
  MailProviderDefinition,
} from '../../contracts/provider.js';

import type { GmailMailProviderConfig } from './types.js';
import { GmailMailProviderAdapter } from './adapter.js';
import { createAuthorization } from './auth.js';
import { GMAIL_CAPABILITIES } from './constants.js';
import { invalidPushNotification, record } from './errors.js';

export const gmailMailProviderDefinition: MailProviderDefinition<GmailMailProviderConfig> =
  {
    type: 'gmail',
    label: 'Gmail',
    capabilities: GMAIL_CAPABILITIES,
    validateConfig(config: GmailMailProviderConfig): void {
      if (!config.clientId || !config.clientSecret) {
        throw new Error('Gmail OAuth clientId and clientSecret are required.');
      }
      for (const [name, value] of Object.entries(config.quota ?? {})) {
        if (name === 'projectId') {
          if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(
              'Gmail quota projectId must be a non-empty string.',
            );
          }
          continue;
        }
        if (
          !['unitsPerUserPerMinute', 'unitsPerProjectPerMinute'].includes(
            name,
          ) ||
          typeof value !== 'number' ||
          !Number.isSafeInteger(value) ||
          value <= 0
        ) {
          throw new Error(
            `Gmail quota setting "${name}" must be a positive safe integer.`,
          );
        }
      }
    },
    authorization: createAuthorization(),
    push: {
      parse(input) {
        const message = record(input.body).message;
        const data =
          typeof record(message).data === 'string'
            ? (record(message).data as string)
            : undefined;
        if (!data) return invalidPushNotification();
        try {
          const payload = JSON.parse(
            Buffer.from(data, 'base64url').toString('utf8'),
          ) as { emailAddress?: unknown };
          if (typeof payload.emailAddress !== 'string') {
            return invalidPushNotification();
          }
          return {
            ok: true,
            value: {
              notifications: [{ accountAddress: payload.emailAddress }],
            },
          };
        } catch {
          return invalidPushNotification();
        }
      },
    },
    async createAdapter(
      context: MailProviderContext,
      config: GmailMailProviderConfig,
      account: MailProviderAccount,
    ): Promise<MailProviderAdapter> {
      return new GmailMailProviderAdapter(context, config, account);
    },
  };
