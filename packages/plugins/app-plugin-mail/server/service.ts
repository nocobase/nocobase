import {
  DEFAULT_MAIL_AUTOMATIC_SYNC_INTERVAL_MINUTES,
  resolveMailAutomaticSyncIntervalMinutes,
  resolveMailSyncBatchSize,
} from './config.js';
import { SendMailOperation } from './operations/send-mail.js';
import { MailAccountsService } from './services/accounts.js';
import { MailAttachmentsService } from './services/attachments.js';
import { MailAuthorizationService } from './services/authorization.js';
import { type DefaultMailServiceDependencies } from './services/dependencies.js';
import { MailDraftsService } from './services/drafts.js';
import { MailManagementService } from './services/management.js';
import { MailMessagesService } from './services/messages.js';
import { MailPreferencesService } from './services/preferences.js';
import { MailProvidersService } from './services/providers.js';
import { MailSubmissionsService } from './services/submissions.js';
import { MailSyncService } from './services/sync.js';
import {
  type MailAccountView,
  type MailAttachmentContent,
  type MailAuthorizationStartResult,
  type MailCompleteAuthorizationInput,
  type MailConnectAccountInput,
  type MailFolder,
  type MailLabel,
  type MailListConversationMessagesInput,
  type MailListMessagesInput,
  type MailManagedAccountView,
  type MailManagementMessageActionInput,
  type MailManagementMessageActionResult,
  type MailMessage,
  type MailMessageSummary,
  type MailOperationContext,
  type MailOutboundAttachmentView,
  type MailPage,
  type MailProviderView,
  type MailResolveDraftConflictInput,
  type MailSaveLabelInput,
  type MailSignature,
  type MailStartAuthorizationInput,
  type MailStartSyncInput,
  type MailSubmissionLogView,
  type MailSubmissionView,
  type MailSyncRunView,
  type MailUploadAttachmentInput,
} from '../shared/mail.js';
import { type MailService } from './contracts/service.js';

/** Stable application-facing facade for the internal mail services. */
export class DefaultMailService implements MailService {
  private readonly providers: MailProvidersService;
  private readonly authorization: MailAuthorizationService;
  private readonly accounts: MailAccountsService;
  private readonly preferences: MailPreferencesService;
  private readonly messages: MailMessagesService;
  private readonly drafts: MailDraftsService;
  private readonly attachments: MailAttachmentsService;
  private readonly sync: MailSyncService;
  private readonly submissions: MailSubmissionsService;
  private readonly management: MailManagementService;
  public constructor(dependencies: DefaultMailServiceDependencies) {
    const syncBatchSize = resolveMailSyncBatchSize(dependencies.syncBatchSize);
    const defaultAutomaticSyncIntervalMinutes =
      resolveMailAutomaticSyncIntervalMinutes(
        dependencies.defaultAutomaticSyncIntervalMinutes ??
          DEFAULT_MAIL_AUTOMATIC_SYNC_INTERVAL_MINUTES,
      );
    const sendMail = new SendMailOperation({
      ...dependencies,
      outbox: dependencies.outbox,
    });
    this.sync = new MailSyncService(dependencies, syncBatchSize);
    this.providers = new MailProvidersService(dependencies);
    this.authorization = new MailAuthorizationService(
      dependencies,
      this.sync,
      defaultAutomaticSyncIntervalMinutes,
    );
    this.accounts = new MailAccountsService(dependencies);
    this.preferences = new MailPreferencesService(dependencies);
    this.messages = new MailMessagesService(dependencies);
    this.drafts = new MailDraftsService(dependencies, sendMail);
    this.attachments = new MailAttachmentsService(dependencies);
    this.submissions = new MailSubmissionsService(dependencies, sendMail);
    this.management = new MailManagementService(dependencies);
  }

  public listProviders(): Promise<readonly MailProviderView[]> {
    return this.providers.listProviders();
  }

  public async connectAccount(
    context: MailOperationContext,
    input: MailConnectAccountInput,
  ): Promise<MailAccountView> {
    return this.authorization.connectAccount(context, input);
  }

  public async startAuthorization(
    context: MailOperationContext,
    input: MailStartAuthorizationInput,
  ): Promise<MailAuthorizationStartResult> {
    return this.authorization.startAuthorization(context, input);
  }

  public async completeAuthorization(
    input: MailCompleteAuthorizationInput,
  ): Promise<MailAccountView> {
    return this.authorization.completeAuthorization(input);
  }

  public async listAccounts(
    context: MailOperationContext,
  ): Promise<readonly MailAccountView[]> {
    return this.accounts.listAccounts(context);
  }

  public async updateAccount(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailUpdateAccountInput,
  ): Promise<MailAccountView> {
    return this.accounts.updateAccount(context, input);
  }

  public async removeAccount(
    context: MailOperationContext,
    accountId: string,
  ): Promise<MailAccountView | undefined> {
    return this.accounts.removeAccount(context, accountId);
  }

  public async listManagedAccounts(
    context: MailOperationContext,
  ): Promise<readonly MailManagedAccountView[]> {
    return this.management.listManagedAccounts(context);
  }

  public listManagedSyncRunsPage(
    context: MailOperationContext,
    offset: number,
    limit: number,
  ): Promise<import('../shared/mail.js').MailOffsetPage<MailSyncRunView>> {
    return this.management.listManagedSyncRunsPage(context, offset, limit);
  }

  public listManagedSubmissionsPage(
    context: MailOperationContext,
    offset: number,
    limit: number,
  ): Promise<
    import('../shared/mail.js').MailOffsetPage<MailSubmissionLogView>
  > {
    return this.management.listManagedSubmissionsPage(context, offset, limit);
  }

  public listManagedFolders(
    _context: MailOperationContext,
    accountId: string,
  ): Promise<readonly MailFolder[]> {
    return this.management.listManagedFolders(_context, accountId);
  }

  public listManagedMessages(
    _context: MailOperationContext,
    input: MailListMessagesInput,
  ): Promise<MailPage<MailMessageSummary>> {
    return this.management.listManagedMessages(_context, input);
  }

  public getManagedMessage(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
  ): Promise<MailMessage | undefined> {
    return this.management.getManagedMessage(context, accountId, messageId);
  }

  public getManagedAttachment(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<MailAttachmentContent> {
    return this.attachments.getManagedAttachment(
      context,
      accountId,
      messageId,
      attachmentId,
    );
  }

  public async manageMessages(
    context: MailOperationContext,
    input: MailManagementMessageActionInput,
  ): Promise<MailManagementMessageActionResult> {
    return this.management.manageMessages(context, input);
  }

  public async listFolders(
    context: MailOperationContext,
    accountId: string,
  ): Promise<readonly MailFolder[]> {
    return this.messages.listFolders(context, accountId);
  }

  public listLabels(
    context: MailOperationContext,
  ): Promise<readonly MailLabel[]> {
    return this.preferences.listLabels(context);
  }

  public async listIdentities(
    context: MailOperationContext,
    accountId: string,
  ): Promise<readonly import('../shared/mail.js').MailIdentity[]> {
    return this.preferences.listIdentities(context, accountId);
  }

  public async updateIdentity(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailUpdateIdentityInput,
  ): Promise<import('../shared/mail.js').MailIdentity> {
    return this.preferences.updateIdentity(context, input);
  }

  public async listSignatures(
    context: MailOperationContext,
    accountId: string,
  ): Promise<readonly MailSignature[]> {
    return this.preferences.listSignatures(context, accountId);
  }

  public async saveSignature(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailSaveSignatureInput,
  ): Promise<MailSignature> {
    return this.preferences.saveSignature(context, input);
  }

  public async updateSignature(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailUpdateSignatureInput,
  ): Promise<MailSignature> {
    return this.preferences.updateSignature(context, input);
  }

  public async deleteSignature(
    context: MailOperationContext,
    accountId: string,
    signatureId: string,
  ): Promise<void> {
    return this.preferences.deleteSignature(context, accountId, signatureId);
  }

  public async createLabel(
    context: MailOperationContext,
    input: MailSaveLabelInput,
  ): Promise<MailLabel> {
    return this.preferences.createLabel(context, input);
  }

  public async updateLabel(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailUpdateLabelInput,
  ): Promise<MailLabel> {
    return this.preferences.updateLabel(context, input);
  }

  public async deleteLabel(
    context: MailOperationContext,
    labelId: string,
  ): Promise<void> {
    return this.preferences.deleteLabel(context, labelId);
  }

  public async updateMessageLabels(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailUpdateMessageLabelsInput,
  ): Promise<MailMessage> {
    return this.messages.updateMessageLabels(context, input);
  }

  public getUnreadCount(context: MailOperationContext): Promise<number> {
    return this.messages.getUnreadCount(context);
  }

  public async startSync(
    context: MailOperationContext,
    input: MailStartSyncInput,
  ): Promise<MailSyncRunView> {
    return this.sync.startSync(context, input);
  }

  public async getSyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView | undefined> {
    return this.sync.getSyncRun(context, syncRunId);
  }

  public listSyncRunsPage(
    context: MailOperationContext,
    offset = 0,
    limit = 20,
  ): Promise<import('../shared/mail.js').MailOffsetPage<MailSyncRunView>> {
    return this.sync.listSyncRunsPage(context, offset, limit);
  }

  public async listSyncRuns(
    context: MailOperationContext,
    offset = 0,
    limit = 100,
  ): Promise<readonly MailSyncRunView[]> {
    return this.sync.listSyncRuns(context, offset, limit);
  }

  public async retrySyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView> {
    return this.sync.retrySyncRun(context, syncRunId);
  }

  public async cancelSyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView> {
    return this.sync.cancelSyncRun(context, syncRunId);
  }

  public async retrySubmission(
    context: MailOperationContext,
    submissionId: string,
  ): Promise<MailSubmissionLogView> {
    return this.submissions.transitionSubmission(
      context,
      submissionId,
      'retry',
    );
  }

  public async cancelSubmission(
    context: MailOperationContext,
    submissionId: string,
  ): Promise<MailSubmissionLogView> {
    return this.submissions.transitionSubmission(
      context,
      submissionId,
      'cancel',
    );
  }

  public listSubmissionsPage(
    context: MailOperationContext,
    bulkOnly = false,
    offset = 0,
    groupByBatch = false,
    limit = 20,
  ): Promise<
    import('../shared/mail.js').MailOffsetPage<MailSubmissionLogView>
  > {
    return this.submissions.listSubmissionsPage(
      context,
      bulkOnly,
      offset,
      groupByBatch,
      limit,
    );
  }

  public async listSubmissions(
    context: MailOperationContext,
    bulkOnly = false,
    offset = 0,
    groupByBatch = false,
    limit: number = groupByBatch ? 20 : 100,
  ): Promise<readonly MailSubmissionLogView[]> {
    return this.submissions.listSubmissions(
      context,
      bulkOnly,
      offset,
      groupByBatch,
      limit,
    );
  }

  public listMessages(
    context: MailOperationContext,
    input: MailListMessagesInput,
  ): Promise<MailPage<MailMessageSummary>> {
    return this.messages.listMessages(context, input);
  }

  public retryMessageContent(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
  ): Promise<MailMessage> {
    return this.messages.retryMessageContent(context, accountId, messageId);
  }

  public getMessage(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
  ): Promise<MailMessage | undefined> {
    return this.messages.getMessage(context, accountId, messageId);
  }

  public async listConversationMessages(
    context: MailOperationContext,
    accountId: string,
    conversationId: string,
    input: MailListConversationMessagesInput = {},
  ): Promise<MailPage<MailMessage>> {
    return this.messages.listConversationMessages(
      context,
      accountId,
      conversationId,
      input,
    );
  }

  public async sendMessage(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailComposeInput,
  ): Promise<MailSubmissionView> {
    return this.submissions.sendMessage(context, input);
  }

  public async sendBulk(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailBulkComposeInput,
  ): Promise<readonly MailSubmissionView[]> {
    return this.submissions.sendBulk(context, input);
  }

  public async saveDraft(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailComposeInput,
  ): Promise<MailMessage> {
    return this.drafts.saveDraft(context, input);
  }

  public async resolveDraftConflict(
    context: MailOperationContext,
    input: MailResolveDraftConflictInput,
  ): Promise<MailMessage> {
    return this.drafts.resolveDraftConflict(context, input);
  }

  public async getUploadedAttachment(
    context: MailOperationContext,
    attachmentId: string,
  ): Promise<MailAttachmentContent> {
    return this.attachments.getUploadedAttachment(context, attachmentId);
  }

  public async uploadAttachment(
    context: MailOperationContext,
    input: MailUploadAttachmentInput,
  ): Promise<MailOutboundAttachmentView> {
    return this.attachments.uploadAttachment(context, input);
  }

  public listTemplates(
    context: MailOperationContext,
  ): Promise<readonly import('../shared/mail.js').MailTemplate[]> {
    return this.preferences.listTemplates(context);
  }

  public async saveTemplate(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailSaveTemplateInput,
  ): Promise<import('../shared/mail.js').MailTemplate> {
    return this.preferences.saveTemplate(context, input);
  }

  public async updateTemplate(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailUpdateTemplateInput,
  ): Promise<import('../shared/mail.js').MailTemplate> {
    return this.preferences.updateTemplate(context, input);
  }

  public async deleteTemplate(
    context: MailOperationContext,
    templateId: string,
  ): Promise<void> {
    return this.preferences.deleteTemplate(context, templateId);
  }

  public async updateMessage(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailUpdateMessageInput,
  ): Promise<MailMessage> {
    return this.messages.updateMessage(context, input);
  }

  public async moveMessage(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailMoveMessageInput,
  ): Promise<MailMessage> {
    return this.messages.moveMessage(context, input);
  }

  public async deleteMessage(
    context: MailOperationContext,
    input: import('../shared/mail.js').MailDeleteMessageInput,
  ): Promise<void> {
    return this.messages.deleteMessage(context, input);
  }

  public async getAttachment(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<MailAttachmentContent> {
    return this.attachments.getAttachment(
      context,
      accountId,
      messageId,
      attachmentId,
    );
  }
}

export type {
  DefaultMailServiceDependencies,
  MailOutboxPublisher,
} from './services/dependencies.js';
