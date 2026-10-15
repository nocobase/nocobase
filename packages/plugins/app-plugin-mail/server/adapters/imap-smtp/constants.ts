import type { MailProviderDefinition } from '../../contracts/provider.js';

export const IMAP_SMTP_CAPABILITIES: MailProviderDefinition['capabilities'] = {
  receive: true,
  send: true,
  incrementalSync: true,
  pushNotifications: false,
  folders: true,
  labels: false,
  drafts: false,
  moveMessage: false,
  aliases: false,
};

export const CONNECTION_TIMEOUT_MS: number = 30 * 1_000;
export const SOCKET_TIMEOUT_MS: number = 60 * 1_000;

export const MAX_IMAP_BODY_BYTES: number = 2 * 1024 * 1024;

export const MAX_IMAP_DETAIL_BODY_BYTES: number = 16 * 1024 * 1024;

/** Raw MIME bytes compared to reuse an RFC Message-ID identity. */
export const MAX_IMAP_RAW_COMPARE_BYTES: number = 2 * 1024 * 1024;
export const MAX_IMAP_RAW_COMPARE_BUDGET: number = 8 * 1024 * 1024;
export const MAX_IMAP_PROVIDER_ID_LENGTH: number = 500;
export const MAX_IMAP_VERIFY_STATE_BYTES: number = 1024 * 1024;
export const MAX_IMAP_VERIFY_ATTEMPTS: number = 5;
