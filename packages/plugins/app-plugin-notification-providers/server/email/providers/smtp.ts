import {
  createSmtpTransport,
  validateSmtpProviderConfig,
} from '@nocobase/mailer';
import {
  type NotificationProviderDefinition,
  type ProviderSendResult,
} from '@nocobase/app-plugin-notification';
import { notificationProviderText } from '../../i18n.js';

import type { PreparedEmailMessage, SmtpProviderConfig } from '../types.js';

export function defineSmtpProviderConfig(
  input: Omit<SmtpProviderConfig, 'provider'>,
): SmtpProviderConfig {
  return { provider: 'smtp', ...input };
}

export function createSmtpProviderDefinition(): NotificationProviderDefinition<
  SmtpProviderConfig,
  PreparedEmailMessage
> {
  return {
    type: 'smtp',
    messageType: 'email',
    label: notificationProviderText('test.providers.smtp', 'SMTP'),
    validateConfig: validateSmtpProviderConfig,

    async createProvider(_context, config) {
      const transport = createSmtpTransport(config);
      return {
        type: 'smtp',

        async send({
          message,
          deliveryId,
          signal,
        }): Promise<ProviderSendResult> {
          return transport.send(
            { ...message.content, to: message.to },
            { idempotencyKey: deliveryId, signal },
          );
        },
        close: () => transport.close(),
      };
    },
  };
}
