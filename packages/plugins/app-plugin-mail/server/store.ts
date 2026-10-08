import { type DatabaseManager } from '@nocobase/db';
import { MailAccountRemovalsStore } from './store/account-removals.js';
import type { MailAccountRemoval } from './contracts/persistence.js';
import { MailAccountsStore } from './store/accounts.js';
import { MailAttachmentsStore } from './store/attachments.js';
import { MailAuthorizationStore } from './store/authorization.js';
import { MailMessagesStore } from './store/messages.js';
import { MailMetadataStore } from './store/metadata.js';
import { MailOutboxStore } from './store/outbox.js';
import { MailPushStore } from './store/push.js';
import { MailSubmissionsStore } from './store/submissions.js';
import { MailSyncStore } from './store/sync.js';
import { MailTemplatesStore } from './store/templates.js';
import {
  type MailAccount,
  type MailComposeInput,
  type MailFolder,
  type MailIdentity,
  type MailLabel,
  type MailLabelColor,
  type MailListConversationMessagesInput,
  type MailListMessagesInput,
  type MailMessage,
  type MailMessageSummary,
  type MailOutboundAttachment,
  type MailPage,
  type MailProviderError,
  type MailProviderIdentity,
  type MailSignature,
  type MailSubmission,
  type MailSyncCursor,
  type MailSyncRun,
  type MailTemplate,
} from '../shared/mail.js';
import {
  type MailAuthorizationTransaction,
  type MailCreateSyncRunInput,
  type MailOutboxRecord,
  type MailScheduledSubmission,
  type MailStore,
  type MailStoredSubmission,
  type MailSyncBatch,
  type MailSyncStepCommit,
} from './contracts/persistence.js';
import {
  type MailProviderPushSubscription,
  type NormalizedMailFolder,
  type NormalizedMailMessage,
} from './contracts/provider.js';

/** Composes persistence modules; transaction ownership stays inside each operation. */
export class DatabaseMailStore implements MailStore {
  private readonly authorization: MailAuthorizationStore;
  private readonly attachments: MailAttachmentsStore;
  private readonly templates: MailTemplatesStore;
  private readonly accounts: MailAccountsStore;
  private readonly removals: MailAccountRemovalsStore;
  private readonly push: MailPushStore;
  private readonly metadata: MailMetadataStore;
  private readonly messages: MailMessagesStore;
  private readonly sync: MailSyncStore;
  private readonly submissions: MailSubmissionsStore;
  private readonly outbox: MailOutboxStore;
  public constructor(database: DatabaseManager) {
    this.accounts = new MailAccountsStore(database);
    this.removals = new MailAccountRemovalsStore(database);
    this.authorization = new MailAuthorizationStore(database);
    this.attachments = new MailAttachmentsStore(database);
    this.templates = new MailTemplatesStore(database);
    this.push = new MailPushStore(database, this.accounts);
    this.metadata = new MailMetadataStore(database);
    this.messages = new MailMessagesStore(database, this.accounts);
    this.sync = new MailSyncStore(database, this.accounts);
    this.submissions = new MailSubmissionsStore(database, this.accounts);
    this.outbox = new MailOutboxStore(database);
  }

  public async createAuthorizationTransaction(
    transaction: MailAuthorizationTransaction,
  ): Promise<void> {
    return this.authorization.createAuthorizationTransaction(transaction);
  }

  public async consumeAuthorizationTransaction(
    stateHash: string,
    now: string,
  ): Promise<MailAuthorizationTransaction | undefined> {
    return this.authorization.consumeAuthorizationTransaction(stateHash, now);
  }

  public async deleteExpiredAuthorizationTransactions(
    now: string,
  ): Promise<number> {
    return this.authorization.deleteExpiredAuthorizationTransactions(now);
  }

  public async createOutboundAttachment(
    attachment: MailOutboundAttachment,
  ): Promise<void> {
    return this.attachments.createOutboundAttachment(attachment);
  }

  public async getOutboundAttachment(
    userId: string,
    attachmentId: string,
  ): Promise<MailOutboundAttachment | undefined> {
    return this.attachments.getOutboundAttachment(userId, attachmentId);
  }

  public async extendOutboundAttachments(
    userId: string,
    attachmentIds: readonly string[],
    expiresAt: string,
  ): Promise<void> {
    return this.attachments.extendOutboundAttachments(
      userId,
      attachmentIds,
      expiresAt,
    );
  }

  public async listExpiredOutboundAttachments(
    now: string,
    limit: number,
    after?: Pick<MailOutboundAttachment, 'expiresAt' | 'id'>,
  ): Promise<readonly MailOutboundAttachment[]> {
    return this.attachments.listExpiredOutboundAttachments(now, limit, after);
  }

  public async deleteOutboundAttachment(
    attachmentId: string,
  ): Promise<boolean> {
    return this.attachments.deleteOutboundAttachment(attachmentId);
  }

  public async listTemplates(
    ownerId: string,
  ): Promise<readonly MailTemplate[]> {
    return this.templates.listTemplates(ownerId);
  }

  public async saveTemplate(template: MailTemplate): Promise<MailTemplate> {
    return this.templates.saveTemplate(template);
  }

  public async deleteTemplate(
    ownerId: string,
    templateId: string,
  ): Promise<boolean> {
    return this.templates.deleteTemplate(ownerId, templateId);
  }

  public async getAccount(accountId: string): Promise<MailAccount | undefined> {
    return this.accounts.getAccount(accountId);
  }

  public async findAccountByProviderIdentity(
    provider: MailProviderIdentity,
    address: string,
    authorizationSubject?: string,
  ): Promise<MailAccount | undefined> {
    return this.accounts.findAccountByProviderIdentity(
      provider,
      address,
      authorizationSubject,
    );
  }

  public async listAccounts(userId: string): Promise<readonly MailAccount[]> {
    return this.accounts.listAccounts(userId);
  }

  public async listAllAccounts(): Promise<readonly MailAccount[]> {
    return this.accounts.listAllAccounts();
  }

  public async getPushSubscription(
    accountId: string,
  ): Promise<MailProviderPushSubscription | undefined> {
    return this.push.getPushSubscription(accountId);
  }

  public async findPushSubscription(
    provider: MailProviderIdentity,
    providerSubscriptionId: string,
  ): Promise<MailProviderPushSubscription | undefined> {
    return this.push.findPushSubscription(provider, providerSubscriptionId);
  }

  public async findActiveAccountsForPush(
    provider: MailProviderIdentity,
    providerSubscriptionIds: readonly string[],
    accountAddresses: readonly string[],
  ): Promise<readonly MailAccount[]> {
    return this.push.findActiveAccountsForPush(
      provider,
      providerSubscriptionIds,
      accountAddresses,
    );
  }

  public async savePushSubscription(
    subscription: MailProviderPushSubscription,
    leaseToken?: string,
  ): Promise<boolean> {
    return this.push.savePushSubscription(subscription, leaseToken);
  }

  public async claimPushSubscriptionMaintenance(
    account: MailAccount,
    leaseToken: string,
    now: string,
    leaseExpiresAt: string,
  ): Promise<
    | import('./contracts/provider.js').MailPushSubscriptionMaintenanceLease
    | undefined
  > {
    return this.push.claimPushSubscriptionMaintenance(
      account,
      leaseToken,
      now,
      leaseExpiresAt,
    );
  }

  public async releasePushSubscriptionMaintenance(
    accountId: string,
    leaseToken: string,
  ): Promise<void> {
    return this.push.releasePushSubscriptionMaintenance(accountId, leaseToken);
  }

  public async renewPushSubscriptionMaintenance(
    accountId: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<boolean> {
    return this.push.renewPushSubscriptionMaintenance(
      accountId,
      leaseToken,
      leaseExpiresAt,
    );
  }

  public async markPushSubscriptionReplacementNeeded(
    accountId: string,
    leaseToken: string,
    updatedAt: string,
  ): Promise<boolean> {
    return this.push.markPushSubscriptionReplacementNeeded(
      accountId,
      leaseToken,
      updatedAt,
    );
  }

  public async deletePushSubscription(accountId: string): Promise<boolean> {
    return this.push.deletePushSubscription(accountId);
  }

  public updateAccountStatus(
    accountId: string,
    status: 'active' | 'suspended',
  ): Promise<void> {
    return this.accounts.updateAccountStatus(accountId, status);
  }

  public async saveAccount(account: MailAccount): Promise<MailAccount> {
    return this.accounts.saveAccount(account);
  }

  public async markAccountRemoving(
    accountId: string,
    userId: string,
  ): Promise<boolean> {
    return this.accounts.markAccountRemoving(accountId, userId);
  }

  public async markAccountReauthorizationRequired(
    accountId: string,
  ): Promise<boolean> {
    return this.accounts.markAccountReauthorizationRequired(accountId);
  }

  public renewAccountRemoval(task: MailAccountRemoval): Promise<boolean> {
    return this.removals.renewAccountRemoval(task);
  }

  public claimAccountRemoval(): Promise<MailAccountRemoval | undefined> {
    return this.removals.claimAccountRemoval();
  }
  public deleteAccountBatch(task: MailAccountRemoval): Promise<boolean> {
    return this.removals.deleteAccountBatch(task);
  }
  public releaseAccountRemoval(
    task: MailAccountRemoval,
    failed: boolean,
  ): Promise<void> {
    return this.removals.releaseAccountRemoval(task, failed);
  }
  public finishAccountRemoval(task: MailAccountRemoval): Promise<boolean> {
    return this.removals.finishAccountRemoval(task);
  }

  public async saveAuthorizedAccount(
    account: MailAccount,
    identities: readonly MailIdentity[],
    signatures: readonly MailSignature[] = [],
    replacingAccount: boolean = false,
  ): Promise<void> {
    return this.accounts.saveAuthorizedAccount(
      account,
      identities,
      signatures,
      replacingAccount,
    );
  }

  public async listIdentities(
    accountId: string,
  ): Promise<readonly MailIdentity[]> {
    return this.metadata.listIdentities(accountId);
  }

  public async replaceIdentities(
    accountId: string,
    identities: readonly MailIdentity[],
  ): Promise<void> {
    return this.metadata.replaceIdentities(accountId, identities);
  }

  public async getIdentity(
    identityId: string,
  ): Promise<MailIdentity | undefined> {
    return this.metadata.getIdentity(identityId);
  }

  public async updateIdentity(
    identityId: string,
    patch: Pick<MailIdentity, 'displayName'>,
  ): Promise<MailIdentity | undefined> {
    return this.metadata.updateIdentity(identityId, patch);
  }

  public async listSignatures(
    accountId: string,
  ): Promise<readonly MailSignature[]> {
    return this.metadata.listSignatures(accountId);
  }

  public async getSignature(
    signatureId: string,
  ): Promise<MailSignature | undefined> {
    return this.metadata.getSignature(signatureId);
  }

  public async saveSignature(signature: MailSignature): Promise<MailSignature> {
    return this.metadata.saveSignature(signature);
  }

  public async deleteSignature(
    accountId: string,
    signatureId: string,
  ): Promise<boolean> {
    return this.metadata.deleteSignature(accountId, signatureId);
  }

  public async listFolders(accountId: string): Promise<readonly MailFolder[]> {
    return this.metadata.listFolders(accountId);
  }

  public async listImapProviderMessageIds(
    accountId: string,
  ): Promise<readonly string[]> {
    return this.messages.listImapProviderMessageIds(accountId);
  }

  public async listLabels(ownerId: string): Promise<readonly MailLabel[]> {
    return this.metadata.listLabels(ownerId);
  }

  public async createLabel(
    ownerId: string,
    name: string,
    color: MailLabelColor,
  ): Promise<MailLabel> {
    return this.metadata.createLabel(ownerId, name, color);
  }

  public async updateLabel(
    ownerId: string,
    labelId: string,
    patch: Pick<MailLabel, 'name' | 'color'>,
  ): Promise<MailLabel | undefined> {
    return this.metadata.updateLabel(ownerId, labelId, patch);
  }

  public async deleteLabel(ownerId: string, labelId: string): Promise<boolean> {
    return this.metadata.deleteLabel(ownerId, labelId);
  }

  public async saveFolder(
    accountId: string,
    folder: NormalizedMailFolder,
  ): Promise<MailFolder> {
    return this.metadata.saveFolder(accountId, folder);
  }

  public async commitSyncBatch(batch: MailSyncBatch): Promise<void> {
    return this.sync.commitSyncBatch(batch);
  }

  public saveMessageContent(
    accountId: string,
    messageId: string,
    message: NormalizedMailMessage,
  ): Promise<MailMessage> {
    return this.messages.saveMessageContent(accountId, messageId, message);
  }

  public localizeDraft(
    accountId: string,
    messageId: string,
  ): Promise<MailMessage> {
    return this.messages.localizeDraft(accountId, messageId);
  }

  public async closeDraft(
    accountId: string,
    messageId?: string,
    draftKey?: string,
  ): Promise<void> {
    return this.messages.closeDraft(accountId, messageId, draftKey);
  }

  public async saveMessage(
    accountId: string,
    message: NormalizedMailMessage,
  ): Promise<MailMessage> {
    return this.messages.saveMessage(accountId, message);
  }

  public async listMessages(
    userId: string,
    input: MailListMessagesInput,
  ): Promise<MailPage<MailMessageSummary>> {
    return this.messages.listMessages(userId, input);
  }

  public async listAllMessages(
    input: MailListMessagesInput,
  ): Promise<MailPage<MailMessageSummary>> {
    return this.messages.listAllMessages(input);
  }

  public async getMessage(
    userId: string,
    accountId: string,
    messageId: string,
  ): Promise<MailMessage | undefined> {
    return this.messages.getMessage(userId, accountId, messageId);
  }

  public async getMessageForAccount(
    accountId: string,
    messageId: string,
  ): Promise<MailMessage | undefined> {
    return this.messages.getMessageForAccount(accountId, messageId);
  }

  public async listConversationMessages(
    userId: string,
    accountId: string,
    conversationId: string,
    input: MailListConversationMessagesInput = {},
  ): Promise<MailPage<MailMessage>> {
    return this.messages.listConversationMessages(
      userId,
      accountId,
      conversationId,
      input,
    );
  }

  public async updateMessageState(
    accountId: string,
    messageId: string,
    state: {
      readonly read?: boolean;
      readonly starred?: boolean;
      readonly note?: string | null;
      readonly todo?: boolean;
    },
  ): Promise<MailMessage | undefined> {
    return this.messages.updateMessageState(accountId, messageId, state);
  }

  public async updateMessageLabels(
    accountId: string,
    messageId: string,
    addLabelIds: readonly string[],
    removeLabelIds: readonly string[],
  ): Promise<MailMessage | undefined> {
    return this.messages.updateMessageLabels(
      accountId,
      messageId,
      addLabelIds,
      removeLabelIds,
    );
  }

  public async countUnreadMessages(userId: string): Promise<number> {
    return this.messages.countUnreadMessages(userId);
  }

  public async moveMessage(
    accountId: string,
    messageId: string,
    providerMessageId: string,
    providerFolderId: string,
  ): Promise<MailMessage | undefined> {
    return this.messages.moveMessage(
      accountId,
      messageId,
      providerMessageId,
      providerFolderId,
    );
  }

  public async deleteMessage(
    accountId: string,
    messageId: string,
    expectedUpdatedAt?: string,
    acceptedSubmissionId?: string,
  ): Promise<boolean> {
    return this.messages.deleteMessage(
      accountId,
      messageId,
      expectedUpdatedAt,
      acceptedSubmissionId,
    );
  }

  public async getSyncCursor(
    accountId: string,
  ): Promise<MailSyncCursor | undefined> {
    return this.sync.getSyncCursor(accountId);
  }

  public async getLastSyncedAt(accountId: string): Promise<string | undefined> {
    return this.sync.getLastSyncedAt(accountId);
  }

  public async clearSyncCursor(accountId: string): Promise<void> {
    return this.sync.clearSyncCursor(accountId);
  }

  public async markPushSyncPending(
    accountId: string,
    requestToken: string,
  ): Promise<void> {
    return this.push.markPushSyncPending(accountId, requestToken);
  }

  public async markPushSyncPendingBatch(
    accountIds: readonly string[],
    requestToken: string,
  ): Promise<void> {
    return this.push.markPushSyncPendingBatch(accountIds, requestToken);
  }

  public async clearPushSyncPending(
    accountId: string,
    requestToken: string,
  ): Promise<void> {
    return this.push.clearPushSyncPending(accountId, requestToken);
  }

  public async createSyncRun(
    input: MailCreateSyncRunInput,
  ): Promise<MailSyncRun> {
    return this.sync.createSyncRun(input);
  }

  public async findActiveSyncRun(
    accountId: string,
  ): Promise<MailSyncRun | undefined> {
    return this.sync.findActiveSyncRun(accountId);
  }

  public async getSyncRun(syncRunId: string): Promise<MailSyncRun | undefined> {
    return this.sync.getSyncRun(syncRunId);
  }

  public countSyncRuns(userId: string): Promise<number> {
    return this.sync.countSyncRuns(userId);
  }

  public countSubmissions(
    userId: string,
    bulkOnly = false,
    groupByBatch = false,
  ): Promise<number> {
    return this.submissions.countSubmissions(userId, bulkOnly, groupByBatch);
  }

  public async listSyncRuns(
    userId: string,
    offset = 0,
    limit = 100,
  ): Promise<readonly MailSyncRun[]> {
    return this.sync.listSyncRuns(userId, offset, limit);
  }

  public recoverSyncRuns(now: string): Promise<number> {
    return this.sync.recoverSyncRuns(now);
  }

  public async listAllSyncRuns(
    offset: number,
    limit: number,
  ): Promise<import('../shared/mail.js').MailOffsetPage<MailSyncRun>> {
    return this.sync.listAllSyncRuns(offset, limit);
  }

  public async cancelSyncRun(
    syncRunId: string,
  ): Promise<MailSyncRun | undefined> {
    return this.sync.cancelSyncRun(syncRunId);
  }

  public async claimSyncRun(
    syncRunId: string,
    expectedRevision: number,
    expectedPhase: MailSyncRun['phase'],
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<MailSyncRun | undefined> {
    return this.sync.claimSyncRun(
      syncRunId,
      expectedRevision,
      expectedPhase,
      leaseToken,
      leaseExpiresAt,
    );
  }

  public async renewSyncRunLease(
    syncRunId: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<boolean> {
    return this.sync.renewSyncRunLease(syncRunId, leaseToken, leaseExpiresAt);
  }

  public async commitSyncStep(input: MailSyncStepCommit): Promise<MailSyncRun> {
    return this.sync.commitSyncStep(input);
  }

  public async failSyncRun(
    run: MailSyncRun,
    error: MailProviderError,
  ): Promise<MailSyncRun> {
    return this.sync.failSyncRun(run, error);
  }

  public async releaseSyncRun(
    run: MailSyncRun,
    error: MailProviderError,
    availableAt: string,
  ): Promise<MailSyncRun> {
    return this.sync.releaseSyncRun(run, error, availableAt);
  }

  public async getSubmissionByIdempotencyKey(
    accountId: string,
    idempotencyKey: string,
  ): Promise<MailStoredSubmission | undefined> {
    return this.submissions.getSubmissionByIdempotencyKey(
      accountId,
      idempotencyKey,
    );
  }

  public async listSubmissions(
    userId: string,
    bulkOnly = false,
    offset = 0,
    groupByBatch = false,
    limit: number = groupByBatch ? 20 : 100,
  ): Promise<readonly MailStoredSubmission[]> {
    return this.submissions.listSubmissions(
      userId,
      bulkOnly,
      offset,
      groupByBatch,
      limit,
    );
  }

  public async transitionSubmission(
    submissionId: string,
    action: 'retry' | 'cancel',
  ): Promise<MailStoredSubmission> {
    return this.submissions.transitionSubmission(submissionId, action);
  }

  public async listAllSubmissions(
    offset: number,
    limit: number,
  ): Promise<import('../shared/mail.js').MailOffsetPage<MailStoredSubmission>> {
    return this.submissions.listAllSubmissions(offset, limit);
  }

  public async createSubmission(
    submission: MailSubmission,
    idempotencyKey: string,
    requestFingerprint: string,
    actorId?: string,
    input?: MailComposeInput,
  ): Promise<MailStoredSubmission> {
    return this.submissions.createSubmission(
      submission,
      idempotencyKey,
      requestFingerprint,
      actorId,
      input,
    );
  }

  public async createScheduledSubmission(
    submission: MailSubmission,
    idempotencyKey: string,
    requestFingerprint: string,
    actorId: string,
    input: MailComposeInput,
    draftSnapshot?: NormalizedMailMessage,
  ): Promise<MailStoredSubmission> {
    return this.submissions.createScheduledSubmission(
      submission,
      idempotencyKey,
      requestFingerprint,
      actorId,
      input,
      draftSnapshot,
    );
  }

  public async getScheduledSubmission(
    submissionId: string,
  ): Promise<MailScheduledSubmission | undefined> {
    return this.submissions.getScheduledSubmission(submissionId);
  }

  public async clearScheduledSubmission(submissionId: string): Promise<void> {
    return this.submissions.clearScheduledSubmission(submissionId);
  }

  public async failScheduledSubmission(
    submissionId: string,
    error: MailProviderError,
  ): Promise<void> {
    return this.submissions.failScheduledSubmission(submissionId, error);
  }

  public async claimSubmission(
    submissionId: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<boolean> {
    return this.submissions.claimSubmission(
      submissionId,
      leaseToken,
      leaseExpiresAt,
    );
  }

  public async recoverExpiredSubmissions(now: string): Promise<number> {
    return this.submissions.recoverExpiredSubmissions(now);
  }

  public async finishSubmission(
    submission: MailSubmission,
    leaseToken: string,
  ): Promise<MailSubmission> {
    return this.submissions.finishSubmission(submission, leaseToken);
  }

  public async claimOutbox(
    now: string,
    leaseToken: string,
    leaseExpiresAt: string,
    limit: number,
  ): Promise<readonly MailOutboxRecord[]> {
    return this.outbox.claimOutbox(now, leaseToken, leaseExpiresAt, limit);
  }

  public async markOutboxPublished(
    outboxId: string,
    leaseToken: string,
    publishedAt: string,
  ): Promise<boolean> {
    return this.outbox.markOutboxPublished(outboxId, leaseToken, publishedAt);
  }

  public async deletePublishedOutboxBefore(before: string): Promise<number> {
    return this.outbox.deletePublishedOutboxBefore(before);
  }

  public async releaseOutbox(
    outboxId: string,
    leaseToken: string,
    availableAt: string,
  ): Promise<boolean> {
    return this.outbox.releaseOutbox(outboxId, leaseToken, availableAt);
  }
}

export function createDatabaseMailStore(
  database: DatabaseManager,
): DatabaseMailStore {
  return new DatabaseMailStore(database);
}

export { toMailAccountView } from './views.js';
