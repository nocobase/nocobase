import type {
  MailProviderAdapter,
  MailProviderDefinition,
} from '../../contracts/provider.js';

import type { MicrosoftMailProviderConfig } from './types.js';
import { MICROSOFT_CAPABILITIES } from './constants.js';
import { MicrosoftMailProviderAdapter } from './adapter.js';
import { createAuthorization } from './auth.js';
import { invalidPushNotification, record } from './errors.js';

export const microsoftMailProviderDefinition: MailProviderDefinition<MicrosoftMailProviderConfig> =
  {
    type: 'microsoft',
    label: 'Microsoft 365',
    capabilities: MICROSOFT_CAPABILITIES,
    validateConfig(config: MicrosoftMailProviderConfig): void {
      if (!config.clientId || !config.clientSecret) {
        throw new Error(
          'Microsoft OAuth clientId and clientSecret are required.',
        );
      }
    },
    authorization: createAuthorization(),
    push: {
      parse(input) {
        const validationToken = input.query.validationToken;
        if (validationToken !== undefined) {
          return {
            ok: true,
            value: { challengeResponse: validationToken, notifications: [] },
          };
        }
        const value = record(input.body).value;
        if (!Array.isArray(value)) return invalidPushNotification();
        const notifications = value.flatMap((item) => {
          const notification = record(item);
          return typeof notification.subscriptionId === 'string' &&
            typeof notification.clientState === 'string'
            ? [
                {
                  providerSubscriptionId: notification.subscriptionId,
                  clientState: notification.clientState,
                },
              ]
            : [];
        });
        return notifications.length === value.length
          ? { ok: true, value: { notifications } }
          : invalidPushNotification();
      },
    },
    async createAdapter(
      context,
      config,
      account,
    ): Promise<MailProviderAdapter> {
      return new MicrosoftMailProviderAdapter(context, config, account);
    },
  };
