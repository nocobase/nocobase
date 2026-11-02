import { loggingToken } from '@nocobase/app-server/logging';
import type {
  ChannelContext,
  NotificationI18nText,
} from '@nocobase/app-plugin-notification';
import {
  type NotificationProviderDefinition,
  type ProviderSendResult,
} from '@nocobase/app-plugin-notification';
import { resolveMailSenderFactory } from '@nocobase/app-server/mailers';
import { validateResendProviderConfig } from '@nocobase/mailer';
import { notificationProviderText } from '../../i18n.js';
import { MailSenderChannel, RESEND_CAPABILITIES } from '../sender-channel.js';

import type { PreparedEmailMessage, ResendProviderConfig } from '../types.js';

export function defineResendProviderConfig(
  input: Omit<ResendProviderConfig, 'provider'>,
): ResendProviderConfig {
  return { provider: 'resend', ...input };
}

/** @deprecated Use registerChannelType(ResendChannel) instead. */
export function createResendProviderDefinition(): NotificationProviderDefinition<
  ResendProviderConfig,
  PreparedEmailMessage
> {
  return {
    type: 'resend',
    messageType: 'email',
    label: notificationProviderText('providers.resend', 'Resend'),
    validateConfig: validateResendProviderConfig,
    capabilities: RESEND_CAPABILITIES,

    async createProvider(_context, config) {
      const { type: _type, ...inline } = config as ResendProviderConfig & {
        type?: string;
      };
      // The provider owns this exclusive sender and closes it with itself.
      const sender = resolveMailSenderFactory().createFromConfig(inline);
      return {
        type: 'resend',
        capabilities: RESEND_CAPABILITIES,
        async send({
          message,
          deliveryId,
          signal,
        }): Promise<ProviderSendResult> {
          return sender.send(
            { ...message.content, to: message.to },
            { idempotencyKey: deliveryId, signal },
          );
        },
        close: () => sender.close(),
      };
    },
  };
}

export interface ResendChannelConfig extends Omit<
  ResendProviderConfig,
  'provider'
> {
  readonly type: 'resend';
}

/** Legacy inline channel. It creates its own sender from the application factory and closes it with itself. */
export class ResendChannel extends MailSenderChannel {
  static readonly type = 'resend';
  static readonly label: NotificationI18nText = notificationProviderText(
    'providers.resend',
    'Resend',
  );
  static validateConfig(config: ResendChannelConfig): void {
    validateResendProviderConfig({ ...config, provider: 'resend' });
  }
  constructor(context: ChannelContext, config: ResendChannelConfig) {
    const { type: _type, ...inline } = config;
    super(
      resolveMailSenderFactory(context.container).createFromConfig({
        ...inline,
        provider: 'resend',
      }),
      RESEND_CAPABILITIES,
    );
    if (context.container.has(loggingToken))
      context.container
        .resolve(loggingToken)
        .getLogger('notification')
        .warn(
          {},
          'Legacy inline email channel configuration remains supported. Migrate to mailers and type: email.',
        );
  }
}
