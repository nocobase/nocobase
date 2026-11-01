import { loggingToken } from '@nocobase/app-server/logging';
import type {
  ChannelContext,
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  NotificationI18nText,
  ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification';
import {
  type NotificationProviderDefinition,
  type ProviderSendResult,
} from '@nocobase/app-plugin-notification';
import {
  applicationMailerToken,
  type ApplicationMailSender,
} from '@nocobase/app-server/mailers';
import { validateSmtpProviderConfig } from '@nocobase/mailer';
import { notificationProviderText } from '../../i18n.js';
import { prepareEmailMessage, validateEmailMessage } from '../channel.js';
import type { EmailMessage, EmailRecipient } from '../types.js';

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

    async createProvider(context, config) {
      if (!context.container)
        throw new Error('Application mailer container is required.');
      const { type: _type, ...inline } = config as SmtpProviderConfig & {
        type?: string;
      };
      const transport = context.container
        .resolve(applicationMailerToken)
        .bindInline({}, inline);
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

export class SmtpChannel implements ChannelInstance<
  EmailMessage,
  EmailRecipient,
  PreparedEmailMessage
> {
  static readonly type = 'smtp';
  static readonly label: NotificationI18nText = notificationProviderText(
    'providers.smtp',
    'SMTP',
  );
  static validateConfig(config: SmtpChannelConfig): void {
    validateSmtpProviderConfig({ ...config, provider: 'smtp' });
  }
  private readonly transport: ApplicationMailSender;
  constructor(context: ChannelContext, config: SmtpChannelConfig) {
    if (context.container.has(loggingToken))
      context.container
        .resolve(loggingToken)
        .getLogger('notification')
        .warn(
          {},
          'Legacy inline email channel configuration remains supported. Migrate to mailers and type: email.',
        );
    const { type: _type, ...inline } = config;
    this.transport = context.container
      .resolve(applicationMailerToken)
      .bindInline({}, { ...inline, provider: 'smtp' });
  }
  validateMessage(
    input: unknown,
  ): ValidatedChannelMessage<EmailMessage, EmailRecipient> {
    return validateEmailMessage(input);
  }
  prepare(
    input: ChannelPreparationInput<EmailMessage, EmailRecipient>,
  ): Promise<PreparedEmailMessage> {
    return prepareEmailMessage(input);
  }
  send({
    message,
    deliveryId,
    signal,
  }: ChannelSendInput<PreparedEmailMessage>): Promise<ProviderSendResult> {
    return this.transport.send(
      { ...message.content, to: message.to },
      { idempotencyKey: deliveryId, signal },
    );
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
}
