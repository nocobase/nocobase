import {
  validateEmailChannelReference,
  type EmailChannelReferenceConfig,
} from './reference-config.js';
export type { EmailChannelReferenceConfig } from './reference-config.js';
import {
  applicationMailerToken,
  acquireApplicationMailer,
  type ApplicationMailerLease,
  type ApplicationMailer,
} from '@nocobase/app-server/mailers';
import type {
  ChannelCapabilities,
  ChannelContext,
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  ProviderSendResult,
  ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification';
import { prepareEmailMessage, validateEmailMessage } from './channel.js';
import type {
  EmailMessage,
  EmailRecipient,
  PreparedEmailMessage,
} from './types.js';

/** Notification owns messages and delivery identity; the application owns sending resources. */
export class EmailChannel implements ChannelInstance<
  EmailMessage,
  EmailRecipient,
  PreparedEmailMessage
> {
  static readonly type = 'email';
  static validateConfig(config: EmailChannelReferenceConfig): void {
    validateEmailChannelReference(config);
  }
  private readonly mailer: ApplicationMailer;
  private readonly mailerLease: ApplicationMailerLease;
  private readonly name?: string;
  readonly capabilities?: ChannelCapabilities;
  constructor(context: ChannelContext, config: EmailChannelReferenceConfig) {
    EmailChannel.validateConfig(config);
    this.mailer = context.container.resolve(applicationMailerToken);
    this.name = config.mailer ?? this.mailer.defaultMailer;
    this.mailer.assertReference(
      this.name,
      `notification.channels.${context.channelName}.mailer`,
    );
    this.mailerLease = acquireApplicationMailer(context.container);
    if (this.mailer.provider(this.name) === 'resend')
      this.capabilities = {
        idempotency: { supported: true, retentionMs: 24 * 60 * 60 * 1000 },
      };
  }
  close(): Promise<void> {
    return this.mailerLease.release();
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
    return this.mailer.send(
      { ...message.content, to: message.to },
      { mailer: this.name, signal, idempotencyKey: deliveryId },
    );
  }
}
