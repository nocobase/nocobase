import type { MailProviderConfig } from '../../../shared/mail.js';

export interface ImapSmtpEndpointConfig {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly rejectUnauthorized?: boolean;
}

export interface ImapSmtpMailProviderConfig extends MailProviderConfig {
  readonly type: 'imap-smtp';
  readonly enabled?: boolean;
  readonly imap: ImapSmtpEndpointConfig;
  readonly smtp: ImapSmtpEndpointConfig;
  /** Use client when the SMTP server does not save sent messages itself. */
  readonly sentCopyMode?: 'server' | 'client';
  readonly sentFolder?: string;
  readonly trashFolder?: string;
  readonly draftsFolder?: string;
}
