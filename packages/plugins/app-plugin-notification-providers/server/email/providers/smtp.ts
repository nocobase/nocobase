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
import { validateSmtpProviderConfig } from '@nocobase/mailer';
import { notificationProviderText } from '../../i18n.js';
import { MailSenderChannel } from '../sender-channel.js';

import type { PreparedEmailMessage, SmtpProviderConfig } from '../types.js';

export function defineSmtpProviderConfig(
  input: Omit<SmtpProviderConfig, 'provider'>,
): SmtpProviderConfig {
  return { provider: 'smtp', ...input };
}

/** @deprecated Use registerChannelType(SmtpChannel) instead. */
export function createSmtpProviderDefinition(): NotificationProviderDefinition<
  SmtpProviderConfig,
  PreparedEmailMessage
> {
  return {
    type: 'smtp',
    messageType: 'email',
    label: notificationProviderText('providers.smtp', 'SMTP'),
    validateConfig: validateSmtpProviderConfig,

    async createProvider(_context, config) {
      const { type: _type, ...inline } = config as SmtpProviderConfig & {
        type?: string;
      };
      // The provider owns this exclusive sender and closes it with itself.
      const sender = resolveMailSenderFactory().createFromConfig(inline);
      return {
        type: 'smtp',
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

export interface SmtpChannelConfig extends Omit<
  SmtpProviderConfig,
  'provider'
> {
  readonly type: 'smtp';
}

/** Legacy inline channel. It creates its own sender from the application factory and closes it with itself. */
export class SmtpChannel extends MailSenderChannel {
  static readonly type = 'smtp';
  static readonly label: NotificationI18nText = notificationProviderText(
    'providers.smtp',
    'SMTP',
  );
  static validateConfig(config: SmtpChannelConfig): void {
    validateSmtpProviderConfig({ ...config, provider: 'smtp' });
  }
  constructor(context: ChannelContext, config: SmtpChannelConfig) {
    const { type: _type, ...inline } = config;
    super(
      resolveMailSenderFactory(context.container).createFromConfig({
        ...inline,
        provider: 'smtp',
      }),
      undefined,
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
