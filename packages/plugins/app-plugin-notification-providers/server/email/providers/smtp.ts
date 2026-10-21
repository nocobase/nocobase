import type { MailTransport } from '@nocobase/mailer';
import type {
  ChannelContext,
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  NotificationTestAdapter,
  NotificationI18nText,
  ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification';
import {
  emailTestAdapter,
  validateEmailMessage,
  prepareEmailMessage,
} from '../channel.js';
import type { EmailMessage, EmailRecipient } from '../types.js';
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

/** @deprecated Use registerChannelType(SmtpChannel) instead. */
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
    'test.providers.smtp',
    'SMTP',
  );
  static readonly test: NotificationTestAdapter<SmtpChannelConfig> =
    emailTestAdapter;
  static validateConfig(config: SmtpChannelConfig): void {
    validateSmtpProviderConfig({ ...config, provider: 'smtp' });
  }
  private readonly transport: MailTransport;
  constructor(_context: ChannelContext, config: SmtpChannelConfig) {
    this.transport = createSmtpTransport({ ...config, provider: 'smtp' });
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
    return this.transport.close();
  }
}
