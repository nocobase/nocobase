import {
  validateEmailChannelReference,
  type EmailChannelReferenceConfig,
} from './reference-config.js';
export type { EmailChannelReferenceConfig } from './reference-config.js';
import { resolveMailSenderFactory } from '@nocobase/app-server/mailers';
import type { ChannelContext } from '@nocobase/app-plugin-notification';
import { MailSenderChannel, RESEND_CAPABILITIES } from './sender-channel.js';

/** A notification channel that sends through a named application mailer, or `mailers.default`. */
export class EmailChannel extends MailSenderChannel {
  static readonly type = 'email';
  static validateConfig(config: EmailChannelReferenceConfig): void {
    validateEmailChannelReference(config);
  }
  constructor(context: ChannelContext, config: EmailChannelReferenceConfig) {
    EmailChannel.validateConfig(config);
    const factory = resolveMailSenderFactory(context.container);
    const name = config.mailer ?? factory.defaultMailer;
    super(
      factory.create(
        name,
        `notification.channels.${context.channelName}.mailer`,
      ),
      factory.provider(name) === 'resend' ? RESEND_CAPABILITIES : undefined,
    );
  }
}
