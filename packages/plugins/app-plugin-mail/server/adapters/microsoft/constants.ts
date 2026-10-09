import type { MailProviderDefinition } from '../../contracts/provider.js';

export const DEFAULT_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'https://graph.microsoft.com/User.Read',
  'https://graph.microsoft.com/Mail.ReadWrite',
  'https://graph.microsoft.com/Mail.Send',
] as const;

export const MESSAGE_SELECT: string = [
  'id',
  'internetMessageId',
  'conversationId',
  'parentFolderId',
  'from',
  'toRecipients',
  'ccRecipients',
  'bccRecipients',
  'replyTo',
  'subject',
  'bodyPreview',
  'body',
  'receivedDateTime',
  'sentDateTime',
  'isRead',
  'isDraft',
  'flag',
  'hasAttachments',
].join(',');

export const SIMPLE_ATTACHMENT_LIMIT: number = 3 * 1024 * 1024;
export const UPLOAD_CHUNK_SIZE: number = 10 * 320 * 1024;
export const HTTP_TIMEOUT_MS: number = 30 * 1_000;
export const MESSAGE_NORMALIZATION_CONCURRENCY: number = 8;
export const MAX_PROVIDER_JSON_BYTES: number = 32 * 1024 * 1024;

export const MICROSOFT_CAPABILITIES: MailProviderDefinition['capabilities'] = {
  receive: true,
  send: true,
  incrementalSync: true,
  pushNotifications: true,
  folders: true,
  labels: false,
  drafts: true,
  moveMessage: true,
  aliases: true,
};
