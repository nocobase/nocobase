import { loggingToken } from '@nocobase/app-server/logging';
import type {
  ChannelCapabilities,
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
import { validateResendProviderConfig } from '@nocobase/mailer';
import { notificationProviderText } from '../../i18n.js';
import { prepareEmailMessage, validateEmailMessage } from '../channel.js';
import type { EmailMessage, EmailRecipient } from '../types.js';

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
    capabilities: {
      idempotency: { supported: true, retentionMs: 24 * 60 * 60 * 1000 },
    },
    async createProvider(context, config) {
      if (!context.container)
        throw new Error('Application mailer container is required.');
      const { type: _type, ...inline } = config as ResendProviderConfig & {
        type?: string;
      };
      const transport = context.container
        .resolve(applicationMailerToken)
        .bindInline({}, inline);
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
    'providers.resend',
    'Resend',
  );
  static validateConfig(config: ResendChannelConfig): void {
    validateResendProviderConfig({ ...config, provider: 'resend' });
  }
  private readonly transport: ApplicationMailSender;
  readonly capabilities: ChannelCapabilities = {
    idempotency: { supported: true, retentionMs: 24 * 60 * 60 * 1000 },
  };
  constructor(context: ChannelContext, config: ResendChannelConfig) {
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
      .bindInline({}, { ...inline, provider: 'resend' });
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
