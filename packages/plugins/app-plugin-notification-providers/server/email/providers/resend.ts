import type { MailTransport } from '@nocobase/mailer';
import type {
  ChannelContext,
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  ChannelCapabilities,
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

export interface ResendChannelConfig extends Omit<
  ResendProviderConfig,
  'provider'
> {
  readonly type: 'resend';
}

export class ResendChannel implements ChannelInstance<
  EmailMessage,
  EmailRecipient,
  PreparedEmailMessage
> {
  static readonly type = 'resend';
  static readonly label: NotificationI18nText = notificationProviderText(
    'test.providers.resend',
    'Resend',
  );
  static readonly test: NotificationTestAdapter = emailTestAdapter;
  static validateConfig(config: ResendChannelConfig): void {
    validateResendProviderConfig({ ...config, provider: 'resend' });
  }
  private readonly transport: MailTransport;
  readonly capabilities: ChannelCapabilities = {
    idempotency: { supported: true, retentionMs: 24 * 60 * 60 * 1000 },
  };
  constructor(_context: ChannelContext, config: ResendChannelConfig) {
    this.transport = createResendTransport({ ...config, provider: 'resend' });
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
