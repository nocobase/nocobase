import { mailerToken, type Mailer } from '@nocobase/app-server/mailer';
import type {
  ChannelCapabilities,
  ChannelContext,
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  ProviderSendResult,
  ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification';
import { prepareEmailMessage, validateEmailMessage } from '../channel.js';
import type {
  EmailMessage,
  EmailRecipient,
  PreparedEmailMessage,
} from '../types.js';

export interface EmailNotificationChannelConfig {
  readonly type: 'email';
  readonly enabled?: boolean;
  readonly mailer?: string;
}

/** Notification delivery retains its records/retries; only transport ownership belongs to the host. */
export class EmailChannel implements ChannelInstance<
  EmailMessage,
  EmailRecipient,
  PreparedEmailMessage
> {
  static readonly type = 'email';
  static validateConfig(config: EmailNotificationChannelConfig): void {
    if (
      config.mailer !== undefined &&
      (typeof config.mailer !== 'string' || !config.mailer.trim())
    )
      throw new Error('Email mailer must be a non-empty string.');
  }
  private readonly mailer: Mailer;
  private readonly name: string;
  readonly capabilities?: ChannelCapabilities;
  constructor(context: ChannelContext, config: EmailNotificationChannelConfig) {
    this.mailer = context.container.resolve(mailerToken);
    this.name = config.mailer ?? 'default';
    if (!this.mailer.available(this.name))
      throw new Error(
        'Email mailer unavailable. Configure mail.<name>, or mail.default when mailer is omitted.',
      );
    // Idempotency is determined by the selected transport, never advertised for SMTP.
    if (this.mailer.provider?.(this.name) === 'resend')
      this.capabilities = {
        idempotency: { supported: true, retentionMs: 24 * 60 * 60 * 1000 },
      };
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
      this.name,
      { ...message.content, to: message.to },
      { idempotencyKey: deliveryId, signal },
    );
  }
}
