import type {
  MailProviderConfig,
  MailProviderError,
  NormalizedMailMessage,
} from '../../types.js';

export interface MicrosoftMailProviderConfig extends MailProviderConfig {
  readonly type: 'microsoft';
  readonly clientId: string;
  readonly clientSecret: string;
  readonly tenant?: string;
  readonly scopes?: readonly string[];
  readonly authorityBaseUrl?: string;
  readonly graphBaseUrl?: string;
}

export interface MicrosoftCredential {
  readonly provider: 'microsoft';
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: string;
  readonly scopes: readonly string[];
  readonly tokenType: string;
}

export interface MicrosoftTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export interface GraphEmailAddress {
  emailAddress?: { name?: string; address?: string };
}

export interface GraphMessage {
  id?: string;
  internetMessageId?: string;
  conversationId?: string;
  parentFolderId?: string;
  from?: GraphEmailAddress;
  toRecipients?: readonly GraphEmailAddress[];
  ccRecipients?: readonly GraphEmailAddress[];
  bccRecipients?: readonly GraphEmailAddress[];
  replyTo?: readonly GraphEmailAddress[];
  subject?: string;
  bodyPreview?: string;
  body?: { contentType?: string; content?: string };
  receivedDateTime?: string;
  sentDateTime?: string;
  isRead?: boolean;
  isDraft?: boolean;
  hasAttachments?: boolean;
  flag?: { flagStatus?: string };
  '@removed'?: { reason?: string };
}

export interface GraphPage<T> {
  value?: readonly T[];
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
}

export interface GraphFolder {
  id?: string;
  displayName?: string;
  wellKnownName?: string;
  childFolderCount?: number;
  unreadItemCount?: number;
}

export interface GraphProfile {
  id?: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  proxyAddresses?: readonly string[];
}

export interface GraphAttachment {
  id?: string;
  name?: string;
  contentType?: string;
  size?: number;
  isInline?: boolean;
  contentId?: string;
  contentBytes?: string;
}

export interface GraphSubscription {
  id?: string;
  expirationDateTime?: string;
}

export interface GraphUploadSession {
  readonly uploadUrl?: string;
}

export interface FolderCursor {
  readonly pending: readonly string[];
  readonly providerFolderIds: readonly string[];
}

export interface InitialCursor {
  readonly phase: 'baseline' | 'history';
  readonly folders: readonly string[];
  readonly folderIndex: number;
  readonly checkpoints: Readonly<Record<string, string>>;
  readonly nextLink?: string;
  readonly receivedAfter?: string;
}

export interface ChangeCursor {
  readonly checkpoints: Readonly<Record<string, string>>;
  readonly folders?: readonly string[];
  readonly folderIndex?: number;
  readonly nextLink?: string;
}

export interface GraphFileAttachment {
  readonly '@odata.type': '#microsoft.graph.fileAttachment';
  readonly name: string;
  readonly contentType: string;
  readonly contentBytes: string;
  readonly isInline: boolean;
  readonly contentId?: string;
}

export interface PageNormalizationResult {
  readonly message?: NormalizedMailMessage;
  readonly deletedProviderMessageId?: string;
  readonly error?: MailProviderError;
}
