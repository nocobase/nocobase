import { type Row } from '@nocobase/db';
import {
  type MailAccount,
  type MailAddress,
  type MailComposeInput,
  type MailDraftConflict,
  type MailFolder,
  type MailProviderError,
  type MailSubmission,
  type MailSyncCursor,
  type MailSyncRun,
  type NormalizedMailAttachment,
} from '../../shared/mail.js';
import { type MailOutboxRecord } from '../contracts/persistence.js';

export interface AuthorizationStateRow extends Row {
  stateHash: string;
  userId: string;
  providerType: string;
  providerName: string;
  redirectUri: string;
  verifierCredentialReference: string;
  scopes: readonly string[] | string;
  initialSyncReceivedAfter?: string | null;
  expiresAt: string;
  consumedAt?: string | null;
  createdAt: string;
}

export interface OutboundAttachmentRow extends Row {
  id: string;
  userId: string;
  disk: string;
  key: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
  expiresAt: string;
}

export interface TemplateRow extends Row {
  id: string;
  name: string;
  subject: string;
  text?: string | null;
  html?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabelRow extends Row {
  id: string;
  ownerId: string;
  name: string;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountRow extends Row {
  id: string;
  userId: string;
  providerType: string;
  providerName: string;
  address: string;
  displayName?: string | null;
  credentialReference: string;
  authorizationSubject?: string | null;
  scopes: readonly string[] | string;
  status: MailAccount['status'];
  removalFailed?: boolean;
  initialSyncReceivedAfter?: string | null;
  automaticSyncIntervalMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PushSubscriptionRow extends Row {
  accountId: string;
  providerType: string;
  providerName: string;
  providerSubscriptionId?: string | null;
  configurationFingerprint?: string | null;
  renewAfter?: string | null;
  expiresAt?: string | null;
  leaseToken?: string | null;
  leaseExpiresAt?: string | null;
  updatedAt: string;
}

export interface PushPendingRow extends Row {
  accountId: string;
  requestToken: string;
  requestedAt: string;
}

export interface IdentityRow extends Row {
  id: string;
  accountId: string;
  address: string;
  displayName?: string | null;
  primaryForAccountId?: string | null;
  canSend: boolean | number;
}

export interface SignatureRow extends Row {
  id: string;
  accountId: string;
  /** Retained only for compatibility with the original identity-scoped schema. */
  identityId: string;
  name: string;
  text: string;
  html?: string | null;
  defaultForAccountId?: string | null;
  defaultForIdentityId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderRow extends Row {
  id: string;
  accountId: string;
  providerFolderId: string;
  type: MailFolder['type'];
  name: string;
  unreadCount?: number | null;
  kind: MailFolder['kind'];
}

export interface MessageRow extends Row {
  scheduledSubmissionId?: string | null;
  contentStatus?: 'complete' | 'deferred' | 'failed';
  contentError?: string | null;
  size?: number | null;
  id: string;
  accountId: string;
  providerMessageId: string;
  providerDraftId?: string | null;
  providerDraftMessageId?: string | null;
  internetMessageId?: string | null;
  providerConversationId?: string | null;
  senderSearch?: string | null;
  recipientsSearch?: string | null;
  sender?: MailAddress | string | null;
  recipients:
    | {
        readonly to: readonly MailAddress[];
        readonly cc: readonly MailAddress[];
        readonly bcc: readonly MailAddress[];
      }
    | string;
  replyTo: readonly MailAddress[] | string;
  inReplyTo?: string | null;
  references: readonly string[] | string;
  subject: string;
  preview?: string | null;
  text?: string | null;
  html?: string | null;
  receivedAt?: string | null;
  sentAt?: string | null;
  sortAt: string;
  read: boolean | number;
  starred: boolean | number;
  draft: boolean | number;
  attachments: readonly NormalizedMailAttachment[] | string;
  note?: string | null;
  todo?: boolean | number;
  draftConflict?: MailDraftConflict | string | null;
  draftSource?: string | null;
  remoteDraftFingerprint?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageFolderRow extends Row {
  accountId: string;
  messageId: string;
  providerFolderId: string;
}

export interface MessageLabelRow extends Row {
  messageId: string;
  labelId: string;
}

export interface SyncStateRow extends Row {
  accountId: string;
  cursor: MailSyncCursor | string;
  lastSyncedAt: string;
}

export interface SyncRunRow extends Row {
  historyStartedAt?: string | null;
  historyComplete?: boolean | number;
  recovering?: boolean | number;
  pendingMessages?: number;
  retryAttempts?: number;
  id: string;
  accountId: string;
  requestedBy: string;
  mode: MailSyncRun['mode'];
  phase: MailSyncRun['phase'];
  status: MailSyncRun['status'];
  revision: number;
  activeKey?: string | null;
  policy: MailSyncRun['policy'] | string;
  processedMessages: number;
  processedPages: number;
  historyCursor?: string | null;
  folderCursor?: string | null;
  baselineCursor?: MailSyncCursor | string | null;
  changeCursor?: MailSyncCursor | string | null;
  leaseToken?: string | null;
  leaseExpiresAt?: string | null;
  error?: MailProviderError | string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface SubmissionRow extends Row {
  id: string;
  accountId: string;
  idempotencyKey: string;
  requestFingerprint: string;
  status: MailSubmission['status'];
  providerMessageId?: string | null;
  scheduledAt?: string | null;
  requestedBy?: string | null;
  composeInput?: MailComposeInput | string | null;
  error?: MailProviderError | string | null;
  leaseToken?: string | null;
  leaseExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutboxRow extends Row {
  id: string;
  type: MailOutboxRecord['type'];
  aggregateId: string;
  deduplicationKey: string;
  payload: MailOutboxRecord['payload'] | string;
  status: MailOutboxRecord['status'];
  attempts: number;
  availableAt: string;
  leaseToken?: string | null;
  leaseExpiresAt?: string | null;
  createdAt: string;
  publishedAt?: string | null;
}
