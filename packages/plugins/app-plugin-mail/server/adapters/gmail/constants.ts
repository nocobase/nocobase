import type { MailProviderDefinition } from '../../contracts/provider.js';

export const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.settings.basic',
] as const;

export const HTTP_TIMEOUT_MS: number = 30 * 1_000;
export const MAX_PROVIDER_JSON_BYTES: number = 32 * 1024 * 1024;
export const MESSAGE_FETCH_CONCURRENCY: number = 4;

export const GMAIL_CAPABILITIES: MailProviderDefinition['capabilities'] = {
  receive: true,
  send: true,
  incrementalSync: true,
  pushNotifications: true,
  folders: true,
  labels: true,
  drafts: true,
  moveMessage: true,
  aliases: true,
};
