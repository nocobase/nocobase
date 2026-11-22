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
  'downloadOriginal',
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
  'downloadOriginal',
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
  readonly downloadOriginal?: boolean;
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
  /**
   * Provider folder IDs this account synchronizes. Absent means every folder, including folders created later; an
   * empty list means the folders have not been chosen yet and no messages are imported.
   */
  readonly syncFolderIds?: readonly string[];
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

/**
 * One member's account on the Mail settings page: who owns it, its Provider, its status and when it last
 * synchronized. It carries no scopes, folders or other mailbox detail.
 */
export interface MailAdminAccountView {
  readonly id: string;
  readonly userId: string;
  readonly ownerName?: string;
  readonly address: string;
  readonly displayName?: string;
  readonly provider: MailProviderIdentity;
  readonly status: MailAccountStatus;
  readonly removalFailed?: boolean;
  /** When the account last finished a synchronization. */
  readonly lastSyncedAt?: string;
}

/** Narrows the Mail settings account list; every condition given must match. */
export interface MailAdminAccountFilter {
  readonly statuses?: readonly string[];
  /** The configured Provider name. */
  readonly providerName?: string;
  readonly userId?: string;
  /** Part of the address, the display name or the owner's name. */
  readonly q?: string;
}

/** One member's account as Team mail offers it in its filters: who owns it and its address. */
export interface MailTeamAccountView {
  readonly id: string;
  readonly userId: string;
  readonly ownerName?: string;
  readonly address: string;
  readonly displayName?: string;
  readonly canMoveMessages?: boolean;
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
  /** Whether the account synchronizes this folder; only reported when unsynchronized folders are requested. */
  readonly synced?: boolean;
}

/** Every folder of an account for choosing its synchronized folders, and whether that list is complete. */
export interface MailFolderChoices {
  readonly folders: readonly MailFolder[];
  /** False until a synchronization run has read the whole folder list from the mail server. */
  readonly complete: boolean;
  /** No folder listing completed and none is running; start a synchronization to list the folders again. */
  readonly failed: boolean;
  /**
   * True once an initial synchronization saved its cursor, so a synchronization that keeps the folder selection runs
   * incrementally; false means it imports from the initial sync date.
   */
  readonly initialSyncCompleted: boolean;
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
  /** The account's folder selection when the run was created; absent means every folder. */
  readonly syncFolderIds?: readonly string[];
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

/** An account after `updateAccount`, with the initial run a changed folder selection scheduled. */
export interface MailUpdatedAccountView extends MailAccountView {
  /** The initial run that replaced the active one because `syncFolderIds` changed; absent otherwise. */
  readonly syncRun?: MailSyncRunView;
}

export interface MailStartSyncInput {
  readonly accountId: string;
  readonly mode?: MailSyncMode;
  readonly receivedAfter?: string;
}

export interface MailUpdateAccountInput {
  readonly accountId: string;
  readonly status?: 'active' | 'suspended';
  /**
   * The folders to synchronize, at least one; `null` synchronizes every folder, including folders created later. A
   * change restarts the initial synchronization and deletes local messages left in no selected folder.
   */
  readonly syncFolderIds?: readonly string[] | null;
}

/** What changing an account's synchronized folders would do to its local messages. */
export interface MailSyncFolderPreview {
  /** Local messages that would be deleted because they belong to no selected folder. */
  readonly removedMessageCount: number;
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

/** Narrows every member's sync runs or submissions; every condition given must match. */
export interface MailManagedLogFilter {
  /** Runs or submissions of this member's accounts. */
  readonly userId?: string;
  readonly accountId?: string;
  /** Any of these statuses. */
  readonly statuses?: readonly string[];
  /** Created at or after this RFC 3339 time. */
  readonly createdFrom?: string;
  /** Created before this RFC 3339 time. */
  readonly createdBefore?: string;
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
  /** Pass an empty list to choose the folders after connecting; omitted or `null` synchronizes every folder. */
  readonly syncFolderIds?: readonly [] | null;
}

export interface MailConnectAccountInput {
  readonly provider: MailProviderIdentity;
  readonly address: string;
  readonly displayName?: string;
  readonly username?: string;
  readonly password: string;
  readonly initialSyncReceivedAfter: string;
  /** Pass an empty list to choose the folders after connecting; omitted or `null` synchronizes every folder. */
  readonly syncFolderIds?: readonly [] | null;
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
  /** Exact From/To/Cc mailbox or @domain; full thread details and conversation counts are unchanged. */
  readonly participant?: string;
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
  readonly sourceProviderFolderId?: string;
  readonly accountId: string;
  readonly messageId: string;
  readonly providerFolderId: string;
}

export interface MailDeleteMessageInput {
  readonly sourceProviderFolderId?: string;
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

/**
 * One member's submission on the Mail settings page: its account, how many recipients, the result and why it failed.
 * It never carries the subject, the body, the addresses or the attachments.
 */
export interface MailManagedSubmissionView {
  readonly id: string;
  readonly accountId: string;
  readonly status: MailSubmissionStatus;
  readonly recipientCount: number;
  readonly bulk?: boolean;
  readonly batchId?: string;
  readonly scheduledAt?: string;
  readonly error?: MailPublicError;
  /** Whether the caller may retry it now. */
  readonly canRetry?: boolean;
  /** Whether the caller may cancel it now. */
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

/**
 * Where a Mail setting's value comes from: an `MAIL_*` environment variable, the `mail` section of the application's
 * configuration, the built-in default, or code the application registered.
 */
/** Where a setting's value comes from; `unknown` when the configuration cannot tell. */
export type MailSettingSource =
  'environment' | 'config' | 'default' | 'code' | 'unknown';

export interface MailSettingValue<T> {
  readonly value: T;
  readonly source: MailSettingSource;
}

/** One Provider members can connect, with how many accounts use it. */
export interface MailSettingsProviderView {
  /** The configured name, or the type for a Provider registered in code without configuration. */
  readonly name: string;
  readonly type: string;
  readonly label: string;
  readonly connection?: 'oauth' | 'credentials';
  readonly capabilities: MailProviderCapabilities;
  /** `config` when `mail.providers` names it; `code` when it is only registered with `mailProviderRegistryToken`. */
  readonly source: 'config' | 'code';
  readonly accountCount: number;
  /** Accounts that need their owner's attention: reauthorization required or revoked. */
  readonly attentionCount: number;
}

/**
 * The Mail settings page's overview: Providers, account totals and the runtime configuration with where each value
 * comes from. It never carries a secret: the push webhook secret is only reported as configured or not, and Provider
 * credentials are not read at all.
 */
export interface MailSettingsOverview {
  readonly providers: readonly MailSettingsProviderView[];
  readonly accounts: {
    readonly total: number;
    readonly reauthorizationRequired: number;
    readonly suspended: number;
    readonly removing: number;
  };
  readonly runtime: {
    readonly automaticSyncIntervalMinutes: MailSettingValue<number>;
    readonly syncBatchSize: MailSettingValue<number>;
    readonly oauthCallbackUrl: MailSettingValue<string>;
    readonly oauthReturnUrl: MailSettingValue<string>;
    readonly pushWebhookUrl: MailSettingValue<string | null>;
    readonly pushWebhookSecretConfigured: MailSettingValue<boolean>;
    /** The `jobs` configuration Mail runs on; `null` follows `jobs.default`. */
    readonly jobs: MailSettingValue<string | null>;
    readonly logRetentionDays: MailSettingValue<number>;
    /** `builtin` stores credentials in the application database; `application` is a vault the application registered. */
    readonly credentialVault: MailSettingValue<'builtin' | 'application'>;
  };
}
