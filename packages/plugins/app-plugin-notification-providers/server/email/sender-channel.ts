import type { MailSender } from '@nocobase/app-server/mailers';
import type {
  ChannelCapabilities,
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

/** Resend keeps a submission's idempotency key for 24 hours; SMTP has no server-side equivalent. */
export const RESEND_CAPABILITIES: ChannelCapabilities = {
  idempotency: { supported: true, retentionMs: 24 * 60 * 60 * 1000 },
};

/**
 * Email message handling over an injected exclusive sender. The channel owns that sender and closes it with itself;
 * channel classes choose and create it in their constructors, the assembly boundary of registerChannelType().
 */
export class MailSenderChannel implements ChannelInstance<
  EmailMessage,
  EmailRecipient,
  PreparedEmailMessage
> {
  public readonly capabilities?: ChannelCapabilities;
  public constructor(
    private readonly sender: MailSender,
    capabilities: ChannelCapabilities | undefined,
  ) {
    if (capabilities) this.capabilities = capabilities;
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
    return this.sender.send(
      { ...message.content, to: message.to },
      { idempotencyKey: deliveryId, signal },
    );
  }
  close(): Promise<void> {
    return this.sender.close();
  }
}
