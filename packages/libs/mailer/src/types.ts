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

export type MailResult =
  | { readonly status: 'accepted'; readonly providerMessageId?: string }
  | {
      readonly status: 'failed';
      readonly error: MailError;
      readonly disposition: 'never' | 'same_provider';
    }
  | { readonly status: 'submission_unknown'; readonly error: MailError };

export interface MailError {
  readonly category:
    | 'authentication'
    | 'configuration'
    | 'content'
    | 'network'
    | 'provider'
    | 'recipient'
    | 'rate_limit'
    | 'timeout';
  readonly code?: string;
  readonly message: string;
}
export interface MailTransport {
  send(message: EmailMessage, options?: MailSendOptions): Promise<MailResult>;
  close(): Promise<void>;
}
export interface MailSendOptions {
  readonly signal?: AbortSignal;
  readonly idempotencyKey?: string;
}

/** Opt in to bounded SMTP connection reuse without changing existing channel behavior. */
export interface MailTransportOptions {
  readonly reuseConnections?: boolean;
}
