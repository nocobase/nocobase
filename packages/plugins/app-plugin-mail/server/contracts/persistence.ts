import type {
  MailAccount,
  MailAddress,
  MailComposeInput,
  MailFolder,
  MailIdentity,
  MailInitialSyncPolicy,
  MailLabel,
  MailLabelColor,
  MailListConversationMessagesInput,
  MailListMessagesInput,
  MailMessage,
  MailMessageSummary,
  MailOffsetPage,
  MailOutboundAttachment,
  MailPage,
  MailProviderError,
  MailProviderIdentity,
  MailSignature,
  MailSubmission,
  MailSyncCursor,
  MailSyncMode,
  MailSyncPhase,
  MailSyncRun,
  MailSyncRunStatus,
  MailTemplate,
} from '../../shared/mail.js';
import type {
  MailProviderFolderRemoval,
  MailProviderPushSubscription,
  MailPushSubscriptionMaintenanceLease,
  NormalizedMailFolder,
  NormalizedMailMessage,
} from './provider.js';

export interface MailAuthorizationTransaction {
  readonly stateHash: string;
  readonly userId: string;
  readonly provider: MailProviderIdentity;
  readonly redirectUri: string;
  readonly verifierCredentialReference: string;
  readonly scopes: readonly string[];
  readonly initialSyncReceivedAfter?: string | null;
  readonly expiresAt: string;
}

export interface MailSyncBatch {
  readonly accountId: string;
  readonly folders: readonly NormalizedMailFolder[];
  readonly messages: readonly NormalizedMailMessage[];
  readonly removedFromFolders?: readonly MailProviderFolderRemoval[];
  readonly deletedProviderMessageIds: readonly string[];
  readonly previousCursor?: MailSyncCursor;
  readonly nextCursor: MailSyncCursor;
}

export interface MailSyncStepCommit {
  readonly historyComplete?: boolean;
  readonly restart?: boolean;
  readonly historyPage?: boolean;
  readonly receivedAfter?: string;
  readonly run: MailSyncRun;
  readonly folders?: readonly NormalizedMailFolder[];
  readonly completeProviderFolderIds?: readonly string[];
  readonly messages: readonly NormalizedMailMessage[];
  readonly removedFromFolders?: readonly MailProviderFolderRemoval[];
  readonly deletedProviderMessageIds?: readonly string[];
  readonly phase: MailSyncPhase;
  readonly status: MailSyncRunStatus;
  readonly historyCursor?: string;
  readonly folderCursor?: string;
  readonly baselineCursor?: MailSyncCursor;
  readonly changeCursor?: MailSyncCursor;
  readonly createNextTask: boolean;
}

export type MailOutboxStatus = 'pending' | 'publishing' | 'published';

export interface MailSyncMailboxTaskPayload {
  readonly version: 1;
  readonly syncRunId: string;
  readonly expectedRevision: number;
  readonly expectedPhase: MailSyncPhase;
}

export interface MailScheduledSendTaskPayload {
  readonly version: 1;
  readonly submissionId: string;
}

export interface MailRequestSyncPayload {
  readonly version: 1;
  readonly accountId: string;
}

interface MailOutboxRecordBase {
  readonly id: string;
  readonly aggregateId: string;
  readonly deduplicationKey: string;
  readonly status: MailOutboxStatus;
  readonly attempts: number;
  readonly availableAt: string;
  readonly leaseToken?: string;
  readonly leaseExpiresAt?: string;
  readonly createdAt: string;
  readonly publishedAt?: string;
}

export type MailOutboxRecord = MailOutboxRecordBase &
  (
    | {
        readonly type: 'syncMailbox';
        readonly payload: MailSyncMailboxTaskPayload;
      }
    | {
        readonly type: 'sendScheduledMail';
        readonly payload: MailScheduledSendTaskPayload;
      }
    | {
        readonly type: 'requestMailboxSync';
        readonly payload: MailRequestSyncPayload;
      }
  );

export interface MailCreateSyncRunInput {
  readonly id: string;
  readonly accountId: string;
  readonly requestedBy: string;
  readonly mode: MailSyncMode;
  readonly policy: MailInitialSyncPolicy;
}

export interface MailStoredSubmission extends MailSubmission {
  readonly text?: string;
  readonly html?: string;
  readonly cc?: readonly import('../../shared/mail.js').MailAddress[];
  readonly bcc?: readonly import('../../shared/mail.js').MailAddress[];
  readonly attachmentIds?: readonly string[];
  readonly attachmentContentIds?: Readonly<Record<string, string>>;
  readonly recipients?: readonly MailAddress[];
  readonly subject?: string;
  readonly bulk?: boolean;
  readonly batchId?: string;
  readonly hasComposeInput?: boolean;
  readonly requestFingerprint: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MailScheduledSubmission {
  readonly actorId: string;
  readonly input: MailComposeInput;
  readonly submission: MailStoredSubmission;
}

export interface MailAccountRemoval {
  readonly accountId: string;
  readonly leaseToken: string;
}

export interface MailStore {
  claimAccountRemoval(): Promise<MailAccountRemoval | undefined>;
  renewAccountRemoval(task: MailAccountRemoval): Promise<boolean>;
  deleteAccountBatch(task: MailAccountRemoval): Promise<boolean>;
  releaseAccountRemoval(
    task: MailAccountRemoval,
    failed: boolean,
  ): Promise<void>;
  finishAccountRemoval(task: MailAccountRemoval): Promise<boolean>;
  createAuthorizationTransaction(
    transaction: MailAuthorizationTransaction,
  ): Promise<void>;
  consumeAuthorizationTransaction(
    stateHash: string,
    now: string,
  ): Promise<MailAuthorizationTransaction | undefined>;
  deleteExpiredAuthorizationTransactions?(now: string): Promise<number>;
  getAccount(accountId: string): Promise<MailAccount | undefined>;
  findAccountByProviderIdentity(
    provider: MailProviderIdentity,
    address: string,
    authorizationSubject?: string,
  ): Promise<MailAccount | undefined>;
  listAccounts(userId: string): Promise<readonly MailAccount[]>;
  listAllAccounts(): Promise<readonly MailAccount[]>;
  updateAccountStatus(
    accountId: string,
    status: 'active' | 'suspended',
  ): Promise<void>;
  saveAccount(account: MailAccount): Promise<MailAccount>;
  markAccountRemoving(accountId: string, userId: string): Promise<boolean>;
  markAccountReauthorizationRequired(accountId: string): Promise<boolean>;
  getPushSubscription(
    accountId: string,
  ): Promise<MailProviderPushSubscription | undefined>;
  findPushSubscription(
    provider: MailProviderIdentity,
    providerSubscriptionId: string,
  ): Promise<MailProviderPushSubscription | undefined>;
  findActiveAccountsForPush(
    provider: MailProviderIdentity,
    providerSubscriptionIds: readonly string[],
    accountAddresses: readonly string[],
  ): Promise<readonly MailAccount[]>;
  savePushSubscription(
    subscription: MailProviderPushSubscription,
    leaseToken?: string,
  ): Promise<boolean>;
  deletePushSubscription(accountId: string): Promise<boolean>;
  claimPushSubscriptionMaintenance(
    account: MailAccount,
    leaseToken: string,
    now: string,
    leaseExpiresAt: string,
  ): Promise<MailPushSubscriptionMaintenanceLease | undefined>;
  releasePushSubscriptionMaintenance(
    accountId: string,
    leaseToken: string,
  ): Promise<void>;
  renewPushSubscriptionMaintenance(
    accountId: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<boolean>;
  markPushSubscriptionReplacementNeeded(
    accountId: string,
    leaseToken: string,
    updatedAt: string,
  ): Promise<boolean>;
  saveAuthorizedAccount(
    account: MailAccount,
    identities: readonly MailIdentity[],
    signatures?: readonly MailSignature[],
    replacingAccount?: boolean,
  ): Promise<void>;
  listIdentities(accountId: string): Promise<readonly MailIdentity[]>;
  replaceIdentities(
    accountId: string,
    identities: readonly MailIdentity[],
  ): Promise<void>;
  getIdentity(identityId: string): Promise<MailIdentity | undefined>;
  updateIdentity(
    identityId: string,
    patch: Pick<MailIdentity, 'displayName'>,
  ): Promise<MailIdentity | undefined>;
  listSignatures(accountId: string): Promise<readonly MailSignature[]>;
  getSignature(signatureId: string): Promise<MailSignature | undefined>;
  saveSignature(signature: MailSignature): Promise<MailSignature>;
  deleteSignature(accountId: string, signatureId: string): Promise<boolean>;
  listFolders(accountId: string): Promise<readonly MailFolder[]>;
  listImapProviderMessageIds?(accountId: string): Promise<readonly string[]>;
  listLabels(ownerId: string): Promise<readonly MailLabel[]>;
  createLabel(
    ownerId: string,
    name: string,
    color: MailLabelColor,
  ): Promise<MailLabel>;
  updateLabel(
    ownerId: string,
    labelId: string,
    patch: Pick<MailLabel, 'name' | 'color'>,
  ): Promise<MailLabel | undefined>;
  deleteLabel(ownerId: string, labelId: string): Promise<boolean>;
  saveFolder(
    accountId: string,
    folder: NormalizedMailFolder,
  ): Promise<MailFolder>;
  commitSyncBatch(batch: MailSyncBatch): Promise<void>;
  saveMessageContent(
    accountId: string,
    messageId: string,
    message: NormalizedMailMessage,
  ): Promise<MailMessage>;
  localizeDraft(accountId: string, messageId: string): Promise<MailMessage>;
  closeDraft(
    accountId: string,
    messageId?: string,
    draftKey?: string,
  ): Promise<void>;
  saveMessage(
    accountId: string,
    message: NormalizedMailMessage,
  ): Promise<MailMessage>;
  createOutboundAttachment(attachment: MailOutboundAttachment): Promise<void>;
  getOutboundAttachment(
    userId: string,
    attachmentId: string,
  ): Promise<MailOutboundAttachment | undefined>;
  extendOutboundAttachments(
    userId: string,
    attachmentIds: readonly string[],
    expiresAt: string,
  ): Promise<void>;
  listExpiredOutboundAttachments(
    now: string,
    limit: number,
    after?: Pick<MailOutboundAttachment, 'expiresAt' | 'id'>,
  ): Promise<readonly MailOutboundAttachment[]>;
  deleteOutboundAttachment(attachmentId: string): Promise<boolean>;
  listTemplates(ownerId: string): Promise<readonly MailTemplate[]>;
  saveTemplate(template: MailTemplate): Promise<MailTemplate>;
  deleteTemplate(ownerId: string, templateId: string): Promise<boolean>;
  listMessages(
    userId: string,
    input: MailListMessagesInput,
  ): Promise<MailPage<MailMessageSummary>>;
  listAllMessages(
    input: MailListMessagesInput,
  ): Promise<MailPage<MailMessageSummary>>;
  getMessage(
    userId: string,
    accountId: string,
    messageId: string,
  ): Promise<MailMessage | undefined>;
  getMessageForAccount(
    accountId: string,
    messageId: string,
  ): Promise<MailMessage | undefined>;
  listConversationMessages(
    userId: string,
    accountId: string,
    conversationId: string,
    input?: MailListConversationMessagesInput,
  ): Promise<MailPage<MailMessage>>;
  updateMessageState(
    accountId: string,
    messageId: string,
    state: {
      readonly read?: boolean;
      readonly starred?: boolean;
      readonly note?: string | null;
      readonly todo?: boolean;
    },
  ): Promise<MailMessage | undefined>;
  updateMessageLabels(
    accountId: string,
    messageId: string,
    addLabelIds: readonly string[],
    removeLabelIds: readonly string[],
  ): Promise<MailMessage | undefined>;
  countUnreadMessages(userId: string): Promise<number>;
  moveMessage(
    accountId: string,
    messageId: string,
    providerMessageId: string,
    providerFolderId: string,
  ): Promise<MailMessage | undefined>;
  deleteMessage(
    accountId: string,
    messageId: string,
    expectedUpdatedAt?: string,
    acceptedSubmissionId?: string,
  ): Promise<boolean>;
  getSyncCursor(accountId: string): Promise<MailSyncCursor | undefined>;
  getLastSyncedAt?(accountId: string): Promise<string | undefined>;
  clearSyncCursor(accountId: string): Promise<void>;
  markPushSyncPending(accountId: string, requestToken: string): Promise<void>;
  markPushSyncPendingBatch(
    accountIds: readonly string[],
    requestToken: string,
  ): Promise<void>;
  clearPushSyncPending(accountId: string, requestToken: string): Promise<void>;
  createSyncRun(input: MailCreateSyncRunInput): Promise<MailSyncRun>;
  findActiveSyncRun(accountId: string): Promise<MailSyncRun | undefined>;
  getSyncRun(syncRunId: string): Promise<MailSyncRun | undefined>;
  countSyncRuns(userId: string): Promise<number>;
  countSubmissions(
    userId: string,
    bulkOnly?: boolean,
    groupByBatch?: boolean,
  ): Promise<number>;
  listSyncRuns(
    userId: string,
    offset?: number,
    limit?: number,
  ): Promise<readonly MailSyncRun[]>;
  recoverSyncRuns(now: string): Promise<number>;
  /** Every user's sync runs, newest first, one page at a time. */
  listAllSyncRuns(
    offset: number,
    limit: number,
  ): Promise<MailOffsetPage<MailSyncRun>>;
  cancelSyncRun(syncRunId: string): Promise<MailSyncRun | undefined>;
  claimSyncRun(
    syncRunId: string,
    expectedRevision: number,
    expectedPhase: MailSyncPhase,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<MailSyncRun | undefined>;
  renewSyncRunLease(
    syncRunId: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<boolean>;
  commitSyncStep(input: MailSyncStepCommit): Promise<MailSyncRun>;
  failSyncRun(run: MailSyncRun, error: MailProviderError): Promise<MailSyncRun>;
  releaseSyncRun(
    run: MailSyncRun,
    error: MailProviderError,
    availableAt: string,
  ): Promise<MailSyncRun>;
  getSubmissionByIdempotencyKey(
    accountId: string,
    idempotencyKey: string,
  ): Promise<MailStoredSubmission | undefined>;
  listSubmissions(
    userId: string,
    bulkOnly?: boolean,
    offset?: number,
    groupByBatch?: boolean,
    limit?: number,
  ): Promise<readonly MailStoredSubmission[]>;
  transitionSubmission(
    submissionId: string,
    action: 'retry' | 'cancel',
  ): Promise<MailStoredSubmission>;
  /** Every user's submissions, newest first, one page at a time. */
  listAllSubmissions(
    offset: number,
    limit: number,
  ): Promise<MailOffsetPage<MailStoredSubmission>>;
  createSubmission(
    submission: MailSubmission,
    idempotencyKey: string,
    requestFingerprint: string,
    actorId?: string,
    input?: MailComposeInput,
  ): Promise<MailStoredSubmission>;
  createScheduledSubmission(
    submission: MailSubmission,
    idempotencyKey: string,
    requestFingerprint: string,
    actorId: string,
    input: MailComposeInput,
    draftSnapshot?: NormalizedMailMessage,
  ): Promise<MailStoredSubmission>;
  getScheduledSubmission(
    submissionId: string,
  ): Promise<MailScheduledSubmission | undefined>;
  clearScheduledSubmission(submissionId: string): Promise<void>;
  failScheduledSubmission(
    submissionId: string,
    error: MailProviderError,
  ): Promise<void>;
  claimSubmission(
    submissionId: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<boolean>;
  recoverExpiredSubmissions(now: string): Promise<number>;
  finishSubmission(
    submission: MailSubmission,
    leaseToken: string,
  ): Promise<MailSubmission>;
  claimOutbox(
    now: string,
    leaseToken: string,
    leaseExpiresAt: string,
    limit: number,
  ): Promise<readonly MailOutboxRecord[]>;
  markOutboxPublished(
    outboxId: string,
    leaseToken: string,
    publishedAt: string,
  ): Promise<boolean>;
  deletePublishedOutboxBefore?(before: string): Promise<number>;
  releaseOutbox(
    outboxId: string,
    leaseToken: string,
    availableAt: string,
  ): Promise<boolean>;
}
