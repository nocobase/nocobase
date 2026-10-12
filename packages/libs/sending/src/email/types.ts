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

export interface SmtpProviderConfig {
  readonly provider: 'smtp';
  readonly enabled?: boolean;
  readonly host: string;
  readonly port: number;
  readonly secure?: boolean;
  readonly auth?: { readonly user: string; readonly pass: string };
  readonly from?: string;
  readonly replyTo?: string;
}

export interface ResendProviderConfig {
  readonly provider: 'resend';
  readonly enabled?: boolean;
  readonly apiKey: string;
  readonly from: string;
  readonly replyTo?: string;
}

export type EmailChannelConfig = SmtpProviderConfig | ResendProviderConfig;

export interface PreparedEmailMessage {
  readonly to: string;
  readonly content: EmailMessage;
}
