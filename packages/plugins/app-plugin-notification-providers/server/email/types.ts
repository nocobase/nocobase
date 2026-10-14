export interface EmailRecipient {
  readonly address: string;
}

export interface EmailMessage {
  readonly subject: string;
  readonly to: string | readonly [string, ...string[]];
  readonly text?: string;
  readonly html?: string;
  readonly from?: string;
  readonly replyTo?: string;
}

export type {
  SmtpProviderConfig,
  ResendProviderConfig,
  EmailChannelConfig,
} from '@nocobase/mailer';

export interface PreparedEmailMessage {
  readonly to: string;
  readonly content: EmailMessage;
}
