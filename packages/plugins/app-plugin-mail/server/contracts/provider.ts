import type { NormalizedMailAttachment } from '../../shared/mail.js';
import type {
  MailAccount,
  MailAddress,
  MailAttachmentContent,
  MailAuthorizationStartInput,
  MailAuthorizationStartResult,
  MailDraftConflict,
  MailFolderType,
  MailIdentity,
  MailProviderCapabilities,
  MailProviderConfig,
  MailProviderError,
  MailProviderIdentity,
  MailProviderResult,
  MailSyncCursor,
} from '../../shared/mail.js';

/** Server-only account context passed to a registered Provider adapter. */
export interface MailProviderAccount {
  readonly id: string;
  readonly address: string;
  readonly provider: MailProviderIdentity;
  /** Opaque vault reference; resolve credentials through MailProviderContext.credentials. */
  readonly credentialReference: string;
}

export interface MailAuthorizedAccount {
  readonly address: string;
  readonly displayName?: string;
  readonly authorizationSubject?: string;
  readonly credentialReference: string;
  readonly scopes: readonly string[];
  readonly identities?: readonly MailAuthorizedIdentity[];
}

export interface MailAuthorizedIdentity {
  readonly address: string;
  readonly displayName?: string;
  readonly signatureText?: string;
  readonly signatureHtml?: string;
  readonly isPrimary: boolean;
  readonly canSend: boolean;
}

export interface MailProviderAuthorizationCallbackInput {
  readonly redirectUri: string;
  readonly state: string;
  readonly code: string;
  readonly codeVerifier: string;
  readonly scopes: readonly string[];
  readonly signal?: AbortSignal;
}

export interface MailProviderConnectInput {
  readonly address: string;
  readonly displayName?: string;
  readonly username: string;
  readonly password: string;
  readonly signal?: AbortSignal;
}

export interface MailProviderChangePage {
  readonly messages: readonly NormalizedMailMessage[];
  readonly removedFromFolders?: readonly MailProviderFolderRemoval[];
  readonly deletedProviderMessageIds: readonly string[];
  readonly nextCursor: MailSyncCursor;
  readonly hasMore: boolean;
}

export interface MailProviderFolderRemoval {
  readonly providerMessageId: string;
  readonly providerFolderId: string;
}

export interface MailProviderListChangesInput {
  readonly cursor?: MailSyncCursor;
  /** Existing IMAP-backed message IDs used for provider-side deletion reconciliation. */
  readonly knownProviderMessageIds?: readonly string[];
  readonly limit: number;
  readonly signal?: AbortSignal;
}

export interface MailProviderListFoldersInput {
  readonly cursor?: string;
  readonly limit: number;
  readonly signal?: AbortSignal;
}

export interface MailProviderFolderPage {
  readonly folders: readonly NormalizedMailFolder[];
  readonly nextCursor?: string;
  /** Exact Provider folder scope, present only on the final page. */
  readonly completeProviderFolderIds?: readonly string[];
}

export interface MailProviderListMessagesInput {
  readonly providerFolderIds?: readonly string[];
  readonly receivedAfter?: string;
  /** Provider baseline seed captured before the initial history pass starts. */
  readonly baselineCursor?: MailSyncCursor;
  readonly cursor?: string;
  readonly limit?: number;
  readonly signal?: AbortSignal;
}

export interface MailProviderMessagePage {
  /** False while the Provider is still establishing its history baseline. */
  readonly historyReady?: boolean;
  readonly messages: readonly NormalizedMailMessage[];
  readonly nextCursor?: string;
  /**
   * Pre-history checkpoint. A Provider may return empty preparation pages while
   * establishing this checkpoint before it returns bounded history pages.
   */
  readonly syncCursor?: MailSyncCursor;
}

export interface MailProviderSendInput {
  readonly trackingId: string;
  readonly identity: MailIdentity;
  readonly message: MailProviderMessageInput;
  readonly signal?: AbortSignal;
}

export interface MailProviderPushSubscription {
  readonly accountId: string;
  readonly provider: MailProviderIdentity;
  readonly providerSubscriptionId: string;
  readonly configurationFingerprint: string;
  readonly renewAfter: string;
  readonly expiresAt: string;
  readonly updatedAt: string;
}

export interface MailPushSubscriptionMaintenanceLease {
  readonly leaseToken: string;
  readonly subscription?: MailProviderPushSubscription;
}

export interface MailProviderUpsertPushSubscriptionInput {
  readonly notificationUrl: string;
  readonly clientState: string;
  readonly providerSubscriptionId?: string;
  readonly signal?: AbortSignal;
}

export interface MailProviderUpsertPushSubscriptionResult {
  readonly providerSubscriptionId: string;
  readonly renewAfter: string;
  readonly expiresAt: string;
}

export interface MailProviderPushNotification {
  readonly providerSubscriptionId?: string;
  readonly accountAddress?: string;
  readonly clientState?: string;
}

export interface MailProviderPushNotificationInput {
  readonly query: Readonly<Record<string, string>>;
  readonly body: unknown;
}

export interface MailProviderPushNotificationResult {
  readonly challengeResponse?: string;
  readonly notifications: readonly MailProviderPushNotification[];
}

export interface MailProviderPushNotifications {
  parse(
    input: MailProviderPushNotificationInput,
  ): MailProviderResult<MailProviderPushNotificationResult>;
}

/** Provider-normalized message before mail core assigns local identifiers. */
export interface NormalizedMailMessage {
  readonly draftRevision?: number;
  readonly contentStatus?: 'complete' | 'deferred' | 'failed';
  readonly contentError?: string;
  readonly size?: number;
  readonly draftSource?: {
    readonly replyToMessageId?: string;
    readonly forwardOfMessageId?: string;
  };
  readonly remoteDraftFingerprint?: string;
  readonly providerMessageId: string;
  readonly providerDraftId?: string;
  readonly providerDraftMessageId?: string;
  readonly internetMessageId?: string;
  readonly providerConversationId?: string;
  readonly providerFolderIds: readonly string[];
  readonly from?: MailAddress;
  readonly to: readonly MailAddress[];
  readonly cc: readonly MailAddress[];
  readonly bcc: readonly MailAddress[];
  readonly replyTo: readonly MailAddress[];
  readonly inReplyTo?: string;
  readonly references: readonly string[];
  readonly subject: string;
  readonly preview?: string;
  readonly text?: string;
  readonly html?: string;
  readonly receivedAt?: string;
  readonly sentAt?: string;
  readonly read: boolean;
  readonly starred: boolean;
  readonly draft: boolean;
  readonly draftConflict?: MailDraftConflict;
  readonly attachments: readonly NormalizedMailAttachment[];
}

export interface NormalizedMailFolder {
  readonly providerFolderId: string;
  readonly type: MailFolderType;
  readonly name: string;
  readonly unreadCount?: number;
  readonly kind: 'folder' | 'label';
}

export interface MailProviderUpdateLabelsInput {
  readonly addLabelIds: readonly string[];
  readonly removeLabelIds: readonly string[];
  readonly signal?: AbortSignal;
}

export interface MailProviderAttachmentInput {
  readonly fileName: string;
  readonly contentType: string;
  readonly size: number;
  readonly contentId?: string;
  readonly inline: boolean;
  open(): Promise<ReadableStream<Uint8Array>>;
}

/** Immutable snapshot prepared by mail core for one Provider submission. */
export interface MailProviderMessageInput {
  readonly to: readonly MailAddress[];
  readonly cc: readonly MailAddress[];
  readonly bcc: readonly MailAddress[];
  readonly subject: string;
  readonly text: string;
  readonly html?: string;
  readonly attachments: readonly MailProviderAttachmentInput[];
  /** Provider attachment IDs retained from an existing draft. */
  readonly retainedProviderAttachmentIds?: readonly string[];
  readonly internetMessageId?: string;
  readonly inReplyTo?: string;
  readonly references: readonly string[];
  readonly providerConversationId?: string;
  /** Existing Provider draft message to update or send. */
  readonly draftProviderMessageId?: string;
  readonly draftProviderDraftId?: string;
  /** Provider message used as the reply target, resolved by Mail Core. */
  readonly replyToProviderMessageId?: string;
  /** Provider message used as the forward source, resolved by Mail Core. */
  readonly forwardOfProviderMessageId?: string;
  /** Preserve the supplied forward body while retaining source attachments. */
  readonly forwardBodyIncluded?: boolean;
  /** The supplied reply already contains the original message. */
  readonly replyBodyIncluded?: boolean;
}

export type MailProviderSendResult =
  | {
      readonly status: 'accepted';
      readonly providerMessageId?: string;
      readonly internetMessageId?: string;
      readonly sentCopyError?: MailProviderError;
      readonly recipientError?: MailProviderError;
    }
  | {
      readonly status: 'failed';
      readonly error: MailProviderError;
    }
  | {
      readonly status: 'submission_unknown';
      readonly error: MailProviderError;
    };

export interface MailProviderAdapter {
  readonly identity: MailProviderIdentity;
  readonly capabilities: MailProviderCapabilities;
  readonly pushNotificationsConfigured?: boolean;
  refreshAuthorization?(
    signal?: AbortSignal,
  ): Promise<MailProviderResult<MailAuthorizedAccount>>;
  listFolders?(
    input: MailProviderListFoldersInput,
  ): Promise<MailProviderResult<MailProviderFolderPage>>;
  createLabel?(
    name: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<NormalizedMailFolder>>;
  updateLabels?(
    providerMessageId: string,
    input: MailProviderUpdateLabelsInput,
  ): Promise<MailProviderResult<void>>;
  reconcileSyncCursor?(
    cursor: MailSyncCursor | undefined,
    providerFolderIds: readonly string[],
  ): MailProviderResult<MailSyncCursor>;
  listMessages?(
    input: MailProviderListMessagesInput,
  ): Promise<MailProviderResult<MailProviderMessagePage>>;
  listChanges?(
    input: MailProviderListChangesInput,
  ): Promise<MailProviderResult<MailProviderChangePage>>;
  getCurrentSyncCursor?(
    signal?: AbortSignal,
  ): Promise<MailProviderResult<MailSyncCursor>>;
  getMessage?(
    providerMessageId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<NormalizedMailMessage>>;
  getAttachment?(
    providerMessageId: string,
    providerAttachmentId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<MailAttachmentContent>>;
  sendMessage?(input: MailProviderSendInput): Promise<MailProviderSendResult>;
  saveDraft?(
    input: MailProviderSendInput,
  ): Promise<MailProviderResult<NormalizedMailMessage>>;
  updateDraft?(
    providerMessageId: string,
    input: MailProviderSendInput,
  ): Promise<MailProviderResult<NormalizedMailMessage>>;
  setRead?(
    providerMessageId: string,
    read: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>>;
  setStarred?(
    providerMessageId: string,
    starred: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>>;
  moveMessage?(
    providerMessageId: string,
    providerFolderId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<MailProviderMoveResult>>;
  deleteMessage?(
    providerMessageId: string,
    permanently: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>>;
  upsertPushSubscription?(
    input: MailProviderUpsertPushSubscriptionInput,
  ): Promise<MailProviderResult<MailProviderUpsertPushSubscriptionResult>>;
  deletePushSubscription?(
    providerSubscriptionId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>>;
  close?(): Promise<void>;
}

export interface MailProviderContext {
  readonly publicBasePath: string;
  readonly credentials: MailCredentialVault;
}

export interface MailCredentialVault {
  put(
    value: unknown,
    options?: {
      readonly purpose?: 'account' | 'authorization';
      readonly expiresAt?: string;
    },
  ): Promise<string>;
  get<T>(reference: string): Promise<T>;
  replace(reference: string, value: unknown): Promise<void>;
  getOrRefresh<T>(
    reference: string,
    isFresh: (value: T) => boolean,
    refresh: (value: T, signal?: AbortSignal) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T>;
  delete(reference: string): Promise<void>;
  deleteExpired?(now: string): Promise<number>;
}

export interface MailProviderMoveResult {
  /** Some Providers assign a new message identifier when moving a message. */
  readonly providerMessageId: string;
}

export interface MailProviderAuthorization<
  TConfig extends MailProviderConfig = MailProviderConfig,
> {
  start(
    context: MailProviderContext,
    config: TConfig,
    input: Omit<MailAuthorizationStartInput, 'provider'>,
  ): Promise<MailProviderResult<MailAuthorizationStartResult>>;
  complete(
    context: MailProviderContext,
    config: TConfig,
    input: MailProviderAuthorizationCallbackInput,
  ): Promise<MailProviderResult<MailAuthorizedAccount>>;
}

export interface MailProviderConnection<
  TConfig extends MailProviderConfig = MailProviderConfig,
> {
  connect(
    context: MailProviderContext,
    config: TConfig,
    input: MailProviderConnectInput,
  ): Promise<MailProviderResult<MailAuthorizedAccount>>;
}

export interface MailProviderDefinition<
  TConfig extends MailProviderConfig = MailProviderConfig,
> {
  readonly type: TConfig['type'];
  readonly label: string;
  readonly capabilities: MailProviderCapabilities;
  validateConfig?(config: TConfig): void;
  readonly authorization?: MailProviderAuthorization<TConfig>;
  readonly connection?: MailProviderConnection<TConfig>;
  readonly push?: MailProviderPushNotifications;
  createAdapter(
    context: MailProviderContext,
    config: TConfig,
    account: MailProviderAccount,
  ): Promise<MailProviderAdapter>;
}

export interface MailProviderRegistry {
  register(definition: MailProviderDefinition): MailProviderRegistry;
  definition(type: string): MailProviderDefinition | undefined;
  definitions(): readonly MailProviderDefinition[];
}

export interface MailProviderAdapterResolver {
  resolve(
    account: MailAccount,
    signal?: AbortSignal,
  ): Promise<MailProviderAdapter>;
}

export function defineMailProviderDefinition<
  TConfig extends MailProviderConfig,
>(
  definition: MailProviderDefinition<TConfig>,
): MailProviderDefinition<TConfig> {
  return definition;
}
