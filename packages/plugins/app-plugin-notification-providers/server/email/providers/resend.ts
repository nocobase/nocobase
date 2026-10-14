import {
  createResendTransport,
  validateResendProviderConfig,
} from '@nocobase/mailer';
import {
  type NotificationProviderDefinition,
  type ProviderSendResult,
} from '@nocobase/app-plugin-notification';
import { notificationProviderText } from '../../i18n.js';

import type { PreparedEmailMessage, ResendProviderConfig } from '../types.js';

export function defineResendProviderConfig(
  input: Omit<ResendProviderConfig, 'provider'>,
): ResendProviderConfig {
  return { provider: 'resend', ...input };
}

export function createResendProviderDefinition(): NotificationProviderDefinition<
  ResendProviderConfig,
  PreparedEmailMessage
> {
  return {
    type: 'resend',
    messageType: 'email',
    label: notificationProviderText('test.providers.resend', 'Resend'),
    validateConfig: validateResendProviderConfig,
    capabilities: {
      idempotency: { supported: true, retentionMs: 24 * 60 * 60 * 1000 },
    },
    async createProvider(_context, config) {
      const transport = createResendTransport(config);
      return {
        type: 'resend',
        capabilities: {
          idempotency: { supported: true, retentionMs: 24 * 60 * 60 * 1000 },
        },
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
