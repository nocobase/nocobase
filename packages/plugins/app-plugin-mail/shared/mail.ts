export const MAIL_PROVIDER_CAPABILITIES: readonly [
  'receive',
  'send',
  'incrementalSync',
  'pushNotifications',
  'folders',
  'labels',
  'drafts',
  'moveMessage',
  'aliases',
] = [
  'receive',
  'send',
  'incrementalSync',
  'pushNotifications',
  'folders',
  'labels',
  'drafts',
  'moveMessage',
  'aliases',
];

/** Folder relation used for drafts that are owned by Mail rather than a Provider. */
export const MAIL_LOCAL_DRAFT_FOLDER_ID = '__nocobase_local_drafts__';

export type MailProviderCapability =
  (typeof MAIL_PROVIDER_CAPABILITIES)[number] | (string & {});

export interface MailProviderCapabilities {
  /** Unknown capabilities are preserved, but Mail only acts on capabilities it understands. */
  readonly [capability: string]: boolean | undefined;
  readonly receive?: boolean;
  readonly send?: boolean;
  readonly incrementalSync?: boolean;
  readonly pushNotifications?: boolean;
  readonly folders?: boolean;
  readonly labels?: boolean;
  readonly drafts?: boolean;
  readonly moveMessage?: boolean;
  readonly aliases?: boolean;
}

export const MAIL_LABEL_COLORS = [
  'slate',
  'red',
  'orange',
  'amber',
  'green',
  'sky',
  'blue',
  'violet',
  'pink',
] as const;

export type MailLabelColor = (typeof MAIL_LABEL_COLORS)[number];

export const DEFAULT_MAIL_LABEL_COLOR: MailLabelColor = 'blue';

export function isMailLabelColor(value: unknown): value is MailLabelColor {
  return (
    typeof value === 'string' &&
    (MAIL_LABEL_COLORS as readonly string[]).includes(value)
  );
}

export interface MailProviderIdentity {
  /** Provider implementation type, for example `gmail` or `microsoft`. */
  readonly type: string;
  /** Host-defined configuration name, for example `company-google`. */
  readonly name: string;
}

export interface MailProviderConfig extends MailProviderIdentity {
  readonly enabled?: boolean;
}

export type KnownMailAccountStatus =
  | 'connecting'
  | 'active'
  | 'reauthorizationRequired'
  | 'suspended'
  | 'revoked'
  | 'removing';

/** Account status received from a newer server may be unknown to this client. */
export type MailAccountStatus = KnownMailAccountStatus | (string & {});

export interface MailSyncCursor {
  /** Opaque, Provider-owned cursor. Mail core must persist but not parse it. */
  readonly value: string | Readonly<Record<string, string>>;
  readonly version?: string;
}

export interface MailAccount {
  readonly id: string;
  readonly userId: string;
  readonly provider: MailProviderIdentity;
  readonly address: string;
  readonly displayName?: string;
  readonly credentialReference: string;
  readonly authorizationSubject?: string;
  readonly scopes: readonly string[];
  readonly status: MailAccountStatus;
  readonly removalFailed?: boolean;
  /** Date boundary recorded when the account was first connected. */
  readonly initialSyncReceivedAfter?: string;
  /** Minimum time between automatic synchronization sweeps for this account. */
  readonly automaticSyncIntervalMinutes?: number;
  readonly syncCursor?: MailSyncCursor;
}

/** API-safe account metadata. Credential references remain inside mail core. */
export type MailAccountView = Omit<
  MailAccount,
  'credentialReference' | 'authorizationSubject' | 'syncCursor'
>;

export interface MailManagedAccountView extends MailAccountView {
  readonly ownerName?: string;
  readonly canMoveMessages?: boolean;
  readonly canSync: boolean;
}

export interface MailIdentity {
  readonly id: string;
  readonly accountId: string;
  readonly address: string;
  readonly displayName?: string;
  readonly isPrimary: boolean;
  readonly canSend: boolean;
}

export interface MailSignature {
  readonly id: string;
  /** Signatures are shared by every sending address in the account. */
  readonly accountId: string;
  readonly name: string;
  readonly text: string;
  readonly html?: string;
  readonly isDefault: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** A NocoBase-owned label that is independent of any mail Provider. */
export interface MailLabel {
  readonly id: string;
  readonly name: string;
  readonly color: MailLabelColor;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MailSaveLabelInput {
  readonly id?: string;
  readonly name: string;
  readonly color?: MailLabelColor;
}

/** A partial label update: omitted fields keep their stored values. */
export interface MailUpdateLabelInput {
  readonly id: string;
  readonly name?: string;
  readonly color?: MailLabelColor;
}

export interface MailSaveSignatureInput {
  readonly id?: string;
  readonly accountId: string;
  readonly name: string;
  readonly text: string;
  readonly html?: string | null;
  readonly isDefault?: boolean;
}

/** A partial signature update: omitted fields keep their stored values. */
export interface MailUpdateSignatureInput {
  readonly id: string;
  readonly accountId: string;
  readonly name?: string;
  readonly text?: string;
  readonly html?: string | null;
  readonly isDefault?: boolean;
}

export interface MailUpdateIdentityInput {
  readonly accountId: string;
  readonly identityId: string;
  readonly displayName?: string | null;
}

export type KnownMailFolderType =
  'inbox' | 'sent' | 'drafts' | 'trash' | 'junk' | 'archive' | 'custom';

/** Provider folder kinds may be extended without changing Mail's core folders. */
export type MailFolderType = KnownMailFolderType | (string & {});

/** Stable query identifiers for standard folders spanning one or more accounts. */
export const MAIL_VIRTUAL_FOLDER_IDS: Readonly<
  Record<Exclude<KnownMailFolderType, 'custom'>, string>
> = {
  inbox: '__nocobase_default_inbox__',
  sent: '__nocobase_default_sent__',
  drafts: '__nocobase_default_drafts__',
  trash: '__nocobase_default_trash__',
  junk: '__nocobase_default_junk__',
  archive: '__nocobase_default_archive__',
};

export interface MailFolder {
  readonly id: string;
  readonly accountId: string;
  readonly providerFolderId: string;
  readonly type: MailFolderType;
  readonly name: string;
  readonly unreadCount?: number;
  /** Gmail labels and Outlook folders share this model without sharing semantics. */
  readonly kind: 'folder' | 'label';
}

export interface MailAddress {
  readonly address: string;
  readonly name?: string;
}

export interface MailAttachment {
  /** Local upload backing a draft attachment; never a Provider identifier. */
  readonly outboundAttachmentId?: string;
  readonly id: string;
  readonly messageId: string;
  readonly providerAttachmentId: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly size: number;
  readonly contentId?: string;
  readonly inline: boolean;
  readonly fileReference?: string;
}

export interface MailMessageSummary {
  /** Local scheduled delivery; cancel it before editing this draft. */
  readonly scheduledSend?: MailSubmissionView;
  readonly contentStatus?: 'complete' | 'deferred' | 'failed';
  readonly contentError?: string;
  readonly size?: number;
  readonly id: string;
  readonly accountId: string;
  readonly providerMessageId: string;
  readonly providerDraftId?: string;
  /** Provider message identifier for an optional remote draft mirror. */
  readonly providerDraftMessageId?: string;
  readonly internetMessageId?: string;
  readonly conversationId?: string;
  readonly folderIds: readonly string[];
  /** User-owned labels stored in NocoBase, never synchronized to a Provider. */
  readonly labelIds: readonly string[];
  readonly from?: MailAddress;
  readonly to: readonly MailAddress[];
  readonly cc: readonly MailAddress[];
  readonly bcc: readonly MailAddress[];
  readonly subject: string;
  /** Number of messages in the corresponding Provider conversation. */
  readonly subjectCount?: number;
  readonly preview?: string;
  readonly receivedAt?: string;
  readonly sentAt?: string;
  readonly read: boolean;
  readonly starred: boolean;
  readonly draft: boolean;
  readonly draftConflict?: MailDraftConflict;
  readonly draftRevision?: number;
  readonly hasAttachments: boolean;
  /** User-owned metadata that is never synchronized to the Provider. */
  readonly note?: string;
  readonly todo: boolean;
}

export interface MailMessage extends MailMessageSummary {
  readonly updatedAt?: string;
  /** Original message relationships retained across draft editing sessions. */
  readonly draftSource?: {
    readonly replyToMessageId?: string;
    readonly forwardOfMessageId?: string;
  };
  /** Fingerprint of the last synchronized Provider draft content. */
  readonly remoteDraftFingerprint?: string;
  readonly replyTo: readonly MailAddress[];
  readonly inReplyTo?: string;
  readonly references: readonly string[];
  readonly text?: string;
  readonly html?: string;
  readonly attachments: readonly MailAttachment[];
}

export interface MailDraftRemoteVersion {
  readonly providerMessageId: string;
  readonly providerDraftId?: string;
  readonly providerConversationId?: string;
  readonly from?: MailAddress;
  readonly to: readonly MailAddress[];
  readonly cc: readonly MailAddress[];
  readonly bcc: readonly MailAddress[];
  readonly subject: string;
  readonly text?: string;
  readonly html?: string;
  readonly attachments: readonly NormalizedMailAttachment[];
}

export interface MailDraftConflict {
  readonly detectedAt: string;
  readonly remote: MailDraftRemoteVersion;
}

export interface MailConversation {
  readonly id: string;
  readonly accountId: string;
  readonly providerConversationId?: string;
  readonly participants: readonly MailAddress[];
  readonly latestMessageAt: string;
  readonly unread: boolean;
  readonly messageIds: readonly string[];
}

export interface MailTemplate {
  readonly id: string;
  readonly name: string;
  readonly subject: string;
  readonly text?: string;
  readonly html: string;
  readonly ownerId?: string;
}

export interface MailSaveTemplateInput {
  readonly id?: string;
  readonly name: string;
  readonly subject: string;
  readonly text?: string;
  readonly html?: string;
}

/** A partial template update: omitted fields keep their stored values. */
export interface MailUpdateTemplateInput {
  readonly id: string;
  readonly name?: string;
  readonly subject?: string;
  readonly text?: string;
  readonly html?: string;
}

export type MailJobType = 'sync' | 'scheduledSend' | 'bulkSend';
export type MailJobStatus =
  'pending' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled';

export interface MailJob {
  readonly id: string;
  readonly type: MailJobType;
  readonly accountId: string;
  readonly status: MailJobStatus;
  readonly completed: number;
  readonly total: number;
  readonly errorCode?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type MailSyncMode = 'initial' | 'incremental';
export type KnownMailSyncPhase =
  'preparing' | 'history' | 'catchUp' | 'incremental' | 'completed';
export type MailSyncPhase = KnownMailSyncPhase | (string & {});
export type KnownMailSyncRunStatus =
  'pending' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled';
export type MailSyncRunStatus = KnownMailSyncRunStatus | (string & {});

export interface MailInitialSyncPolicy {
  readonly receivedAfter?: string;
  /** @deprecated Historical imports no longer have a total message limit. */
  readonly maxMessages?: number;
  readonly batchSize: number;
}

export interface MailSyncRun {
  readonly historyStartedAt?: string;
  readonly historyComplete?: boolean;
  readonly recovering?: boolean;
  readonly pendingMessages?: number;
  /** Consecutive retryable failures since the last committed sync step. */
  readonly retryAttempts?: number;
  readonly id: string;
  readonly accountId: string;
  readonly requestedBy: string;
  readonly mode: MailSyncMode;
  readonly phase: MailSyncPhase;
  readonly status: MailSyncRunStatus;
  readonly revision: number;
  readonly policy: MailInitialSyncPolicy;
  readonly processedMessages: number;
  readonly processedPages: number;
  readonly historyCursor?: string;
  readonly folderCursor?: string;
  readonly baselineCursor?: MailSyncCursor;
  readonly changeCursor?: MailSyncCursor;
  readonly leaseToken?: string;
  readonly leaseExpiresAt?: string;
  readonly error?: MailProviderError;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
}

/** API-safe progress view. Provider cursors and leases never leave mail core. */
export interface MailSyncRunView {
  readonly historyComplete?: boolean;
  readonly recovering?: boolean;
  readonly pendingMessages?: number;
  readonly id: string;
  readonly accountId: string;
  readonly mode: MailSyncMode;
  readonly phase: MailSyncPhase;
  readonly status: MailSyncRunStatus;
  readonly policy: MailInitialSyncPolicy;
  readonly processedMessages: number;
  readonly processedPages: number;
  readonly error?: MailPublicError;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
  /** Management views use this to avoid exposing actions for another user. */
  readonly canManage?: boolean;
}

export interface MailStartSyncInput {
  readonly accountId: string;
  readonly mode?: MailSyncMode;
  readonly receivedAfter?: string;
}

export interface MailUpdateAccountInput {
  readonly accountId: string;
  readonly status?: 'active' | 'suspended';
}

export type MailCommandType =
  'setRead' | 'setStarred' | 'move' | 'delete' | 'saveDraft' | 'send';

export interface MailCommand {
  readonly id: string;
  readonly accountId: string;
  readonly messageId?: string;
  readonly type: MailCommandType;
  readonly status: 'pending' | 'confirmed' | 'failed';
  readonly errorCode?: string;
  readonly createdAt: string;
}

/** A bounded offset page. For grouped submissions, total counts batches. */
export interface MailOffsetPage<T> {
  readonly items: readonly T[];
  readonly total: number;
}

export interface MailPage<T> {
  /** Total matching messages before cursor or offset pagination. */
  readonly total?: number;
  readonly items: readonly T[];
  readonly nextCursor?: string;
}

export interface MailOperationContext {
  readonly actorId: string;
  readonly locale?: string;
  readonly signal?: AbortSignal;
}

export interface MailAuthorizationStartInput {
  readonly provider: MailProviderIdentity;
  readonly redirectUri: string;
  readonly state: string;
  readonly codeChallenge: string;
  readonly scopes?: readonly string[];
}

export interface MailAuthorizationStartResult {
  readonly authorizationUrl: string;
  readonly state: string;
  readonly expiresAt?: string;
}

export interface MailStartAuthorizationInput {
  readonly provider: MailProviderIdentity;
  readonly redirectUri: string;
  readonly scopes?: readonly string[];
  readonly initialSyncReceivedAfter: string;
}

export interface MailConnectAccountInput {
  readonly provider: MailProviderIdentity;
  readonly address: string;
  readonly displayName?: string;
  readonly username: string;
  readonly password: string;
  readonly initialSyncReceivedAfter: string;
}

export interface MailCompleteAuthorizationInput {
  readonly state: string;
  readonly code?: string;
  readonly error?: string;
  readonly errorDescription?: string;
}

export interface MailAuthorizationCallbackInput {
  readonly provider: MailProviderIdentity;
  readonly redirectUri: string;
  readonly state: string;
  readonly code: string;
}

export interface MailListMessagesInput {
  /** Include the total matching message count for numbered pagination. */
  readonly withTotal?: boolean;
  /** Zero-based row offset for direct page selection; mutually exclusive with cursor. */
  readonly offset?: number;
  readonly accountIds?: readonly string[];
  readonly folderIds?: readonly string[];
  readonly labelIds?: readonly string[];
  readonly conversationId?: string;
  readonly query?: string;
  readonly unread?: boolean;
  readonly starred?: boolean;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface MailListConversationsInput {
  readonly accountIds?: readonly string[];
  readonly folderIds?: readonly string[];
  readonly query?: string;
  readonly unread?: boolean;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface MailListConversationMessagesInput {
  readonly cursor?: string;
  readonly limit?: number;
}

export interface MailListJobsInput {
  readonly accountIds?: readonly string[];
  readonly types?: readonly MailJobType[];
  readonly statuses?: readonly MailJobStatus[];
  readonly cursor?: string;
  readonly limit?: number;
}

export interface MailComposeInput {
  readonly accountId: string;
  readonly identityId: string;
  /** Undefined selects the default signature; null preserves the supplied body without signature processing. */
  readonly signatureId?: string | null;
  readonly to: readonly MailAddress[];
  readonly cc?: readonly MailAddress[];
  readonly bcc?: readonly MailAddress[];
  readonly subject: string;
  readonly text: string;
  readonly html?: string;
  readonly attachmentIds?: readonly string[];
  /** Existing draft attachments that should remain after an update. */
  readonly retainedAttachmentIds?: readonly string[];
  readonly inReplyToMessageId?: string;
  readonly forwardOfMessageId?: string;
  /** The supplied body includes the editable forwarded content; do not append it again. */
  readonly forwardBodyIncluded?: boolean;
  /** The supplied reply already contains the original message. */
  readonly replyBodyIncluded?: boolean;
  readonly scheduledAt?: string;
  readonly draftMessageId?: string;
  readonly draftKey?: string;
  readonly draftRevision?: number;
  readonly deliverySnapshot?: MailMessage;
  /** Internal prepared context; never accepted from HTTP input. */
  readonly deliveryContext?: {
    readonly inReplyTo?: string;
    readonly references: readonly string[];
    readonly providerConversationId?: string;
  };
  /** Internal batch lifecycle metadata, persisted with scheduled deliveries. */
  readonly sourceDraft?: {
    readonly messageId: string;
    readonly updatedAt: string;
    readonly submissionKeys: readonly string[];
  };
  readonly idempotencyKey: string;
}

export type MailDraftConflictAction = 'useRemote' | 'keepLocal';

export interface MailResolveDraftConflictInput {
  readonly accountId: string;
  readonly messageId: string;
  readonly action: MailDraftConflictAction;
}

export interface MailBulkComposeInput extends Omit<
  MailComposeInput,
  'to' | 'cc' | 'bcc'
> {
  readonly recipients: readonly MailAddress[];
  readonly sourceDraftMessageId?: string;
}

export interface MailUpdateMessageInput {
  readonly accountId: string;
  readonly messageId: string;
  readonly read?: boolean;
  readonly starred?: boolean;
  readonly note?: string | null;
  readonly todo?: boolean;
}

export interface MailUpdateMessageLabelsInput {
  readonly accountId: string;
  readonly messageId: string;
  readonly addLabelIds?: readonly string[];
  readonly removeLabelIds?: readonly string[];
}

export interface MailMoveMessageInput {
  readonly accountId: string;
  readonly messageId: string;
  readonly providerFolderId: string;
}

export interface MailDeleteMessageInput {
  readonly accountId: string;
  readonly messageId: string;
  readonly permanently?: boolean;
}

export type MailManagementMessageAction =
  'markRead' | 'markUnread' | 'star' | 'unstar' | 'archive' | 'move' | 'delete';

export interface MailManagementMessageTarget {
  readonly accountId: string;
  readonly messageId: string;
}

export interface MailManagementMessageActionInput {
  readonly action: MailManagementMessageAction;
  readonly items: readonly MailManagementMessageTarget[];
  readonly providerFolderId?: string;
  readonly permanently?: boolean;
}

export interface MailManagementMessageActionItemResult {
  readonly accountId: string;
  readonly messageId: string;
  readonly status: 'succeeded' | 'failed';
  readonly error?: MailPublicError;
}

export interface MailManagementMessageActionResult {
  readonly items: readonly MailManagementMessageActionItemResult[];
  readonly succeeded: number;
  readonly failed: number;
}

export interface MailDraftResult {
  readonly message: MailMessage;
  readonly command: MailCommand;
}

export type KnownMailSubmissionStatus =
  'pending' | 'submitting' | 'accepted' | 'failed' | 'unknown' | 'cancelled';
export type MailSubmissionStatus = KnownMailSubmissionStatus | (string & {});

export interface MailSubmission {
  readonly id: string;
  readonly accountId: string;
  readonly status: MailSubmissionStatus;
  readonly providerMessageId?: string;
  readonly scheduledAt?: string;
  readonly error?: MailProviderError;
}

export type MailPublicError = Omit<MailProviderError, 'message'>;

export interface MailSubmissionView {
  readonly id: string;
  readonly accountId: string;
  readonly status: MailSubmissionStatus;
  readonly providerMessageId?: string;
  readonly scheduledAt?: string;
  readonly error?: MailPublicError;
}

export interface MailSubmissionLogView extends MailSubmissionView {
  readonly text?: string;
  readonly html?: string;
  readonly cc?: readonly MailAddress[];
  readonly bcc?: readonly MailAddress[];
  readonly attachmentIds?: readonly string[];
  readonly attachmentContentIds?: Readonly<Record<string, string>>;
  readonly recipients?: readonly MailAddress[];
  readonly subject?: string;
  readonly bulk?: boolean;
  readonly batchId?: string;
  readonly canRetry?: boolean;
  readonly canCancel?: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MailAttachmentContent {
  readonly fileName: string;
  readonly contentType: string;
  readonly size?: number;
  readonly stream: ReadableStream<Uint8Array>;
}

export interface MailOutboundAttachment {
  readonly id: string;
  readonly userId: string;
  readonly disk: string;
  readonly key: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly size: number;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export type MailOutboundAttachmentView = Pick<
  MailOutboundAttachment,
  'id' | 'fileName' | 'contentType' | 'size' | 'expiresAt'
>;

export interface MailUploadAttachmentInput {
  readonly fileName: string;
  readonly contentType: string;
  readonly size: number;
  readonly stream: ReadableStream<Uint8Array>;
}

export interface MailOutboundAttachmentStorage {
  create(
    userId: string,
    input: MailUploadAttachmentInput,
  ): Promise<MailOutboundAttachmentView>;
  open(
    userId: string,
    attachmentId: string,
  ): Promise<{
    readonly attachment: MailOutboundAttachment;
    readonly stream: ReadableStream<Uint8Array>;
  }>;
  cleanupExpired?(now: string): Promise<number>;
}

export const MAIL_PROVIDER_ERROR_CATEGORIES: readonly [
  'authentication',
  'configuration',
  'recipient',
  'content',
  'rate_limit',
  'network',
  'timeout',
  'provider',
  'unknown',
] = [
  'authentication',
  'configuration',
  'recipient',
  'content',
  'rate_limit',
  'network',
  'timeout',
  'provider',
  'unknown',
];

export type KnownMailProviderErrorCategory =
  (typeof MAIL_PROVIDER_ERROR_CATEGORIES)[number];
export type MailProviderErrorCategory =
  KnownMailProviderErrorCategory | (string & {});

export type KnownMailProviderReasonCode =
  | 'gmailRateLimitExceeded'
  | 'gmailUserRateLimitExceeded'
  | 'gmailDailyLimitExceeded'
  | 'gmailDomainPolicy'
  | 'gmailInsufficientPermissions'
  | 'gmailAuthError'
  | 'gmailApiNotEnabled';
export type MailProviderReasonCode =
  KnownMailProviderReasonCode | (string & {});

export interface MailProviderError {
  readonly code: string;
  readonly message: string;
  readonly category: MailProviderErrorCategory;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;
  /** Safe, allowlisted provider reason used to show actionable UI guidance. */
  readonly reasonCode?: MailProviderReasonCode;
  /** SMTP envelope results after a message was accepted for some recipients. */
  readonly recipients?: {
    readonly accepted: readonly string[];
    readonly rejected: readonly string[];
  };
}

export type MailProviderResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: MailProviderError };

export interface MailProviderView {
  readonly type: string;
  readonly name: string;
  readonly label: string;
  readonly capabilities: MailProviderCapabilities;
  readonly connection?: 'oauth' | 'credentials';
  /** False when the Provider is registered but has no mail.providers entry. */
  readonly configured?: boolean;
}

export interface NormalizedMailAttachment {
  /** Set by Mail Core for local draft uploads. */
  readonly outboundAttachmentId?: string;
  readonly providerAttachmentId: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly size: number;
  readonly contentId?: string;
  readonly inline: boolean;
}
