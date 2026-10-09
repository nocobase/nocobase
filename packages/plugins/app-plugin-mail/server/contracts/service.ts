import type {
  MailAccount,
  MailAccountView,
  MailAttachmentContent,
  MailAuthorizationStartResult,
  MailBulkComposeInput,
  MailCompleteAuthorizationInput,
  MailComposeInput,
  MailConnectAccountInput,
  MailDeleteMessageInput,
  MailFolder,
  MailIdentity,
  MailLabel,
  MailListConversationMessagesInput,
  MailListMessagesInput,
  MailManagedAccountView,
  MailManagementMessageActionInput,
  MailManagementMessageActionResult,
  MailMessage,
  MailMessageSummary,
  MailMoveMessageInput,
  MailOffsetPage,
  MailOperationContext,
  MailOutboundAttachmentView,
  MailPage,
  MailProviderView,
  MailResolveDraftConflictInput,
  MailSaveLabelInput,
  MailSaveSignatureInput,
  MailSaveTemplateInput,
  MailSignature,
  MailStartAuthorizationInput,
  MailStartSyncInput,
  MailSubmissionLogView,
  MailSubmissionView,
  MailSyncRunView,
  MailTemplate,
  MailUpdateAccountInput,
  MailUpdateIdentityInput,
  MailUpdateLabelInput,
  MailUpdateSignatureInput,
  MailUpdateTemplateInput,
  MailUpdateMessageInput,
  MailUpdateMessageLabelsInput,
  MailUploadAttachmentInput,
} from '../../shared/mail.js';

/**
 * Server facade for consuming Mail operations from another application plugin.
 * Resolve it with `mailServiceToken`; custom providers extend Mail through
 * `MailProviderDefinition` rather than implementing this service.
 */
export interface MailService {
  listProviders(): Promise<readonly MailProviderView[]>;
  startAuthorization(
    context: MailOperationContext,
    input: MailStartAuthorizationInput,
  ): Promise<MailAuthorizationStartResult>;
  connectAccount(
    context: MailOperationContext,
    input: MailConnectAccountInput,
  ): Promise<MailAccountView>;
  completeAuthorization(
    input: MailCompleteAuthorizationInput,
  ): Promise<MailAccountView>;
  listAccounts(
    context: MailOperationContext,
  ): Promise<readonly MailAccountView[]>;
  updateAccount(
    context: MailOperationContext,
    input: MailUpdateAccountInput,
  ): Promise<MailAccountView>;
  /**
   * Mark an account for removal; a background task deletes it. Answers the account in its `removing` state, or
   * `undefined` when the removal already finished.
   */
  removeAccount(
    context: MailOperationContext,
    accountId: string,
  ): Promise<MailAccountView | undefined>;
  listManagedAccounts(
    context: MailOperationContext,
  ): Promise<readonly MailManagedAccountView[]>;
  /** Every user's sync runs, newest first, one page at a time. */
  listManagedSyncRunsPage(
    context: MailOperationContext,
    offset: number,
    limit: number,
  ): Promise<MailOffsetPage<MailSyncRunView>>;
  /** Every user's submissions, newest first, one page at a time. */
  listManagedSubmissionsPage(
    context: MailOperationContext,
    offset: number,
    limit: number,
  ): Promise<MailOffsetPage<MailSubmissionLogView>>;
  listManagedFolders(
    context: MailOperationContext,
    accountId: string,
  ): Promise<readonly MailFolder[]>;
  listManagedMessages(
    context: MailOperationContext,
    input: MailListMessagesInput,
  ): Promise<MailPage<MailMessageSummary>>;
  getManagedMessage(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
  ): Promise<MailMessage | undefined>;
  getManagedAttachment(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<MailAttachmentContent>;
  manageMessages(
    context: MailOperationContext,
    input: MailManagementMessageActionInput,
  ): Promise<MailManagementMessageActionResult>;
  listFolders(
    context: MailOperationContext,
    accountId: string,
  ): Promise<readonly MailFolder[]>;
  listLabels(context: MailOperationContext): Promise<readonly MailLabel[]>;
  listIdentities(
    context: MailOperationContext,
    accountId: string,
  ): Promise<readonly MailIdentity[]>;
  updateIdentity(
    context: MailOperationContext,
    input: MailUpdateIdentityInput,
  ): Promise<MailIdentity>;
  listSignatures(
    context: MailOperationContext,
    accountId: string,
  ): Promise<readonly MailSignature[]>;
  saveSignature(
    context: MailOperationContext,
    input: MailSaveSignatureInput,
  ): Promise<MailSignature>;
  updateSignature(
    context: MailOperationContext,
    input: MailUpdateSignatureInput,
  ): Promise<MailSignature>;
  deleteSignature(
    context: MailOperationContext,
    accountId: string,
    signatureId: string,
  ): Promise<void>;
  createLabel(
    context: MailOperationContext,
    input: MailSaveLabelInput,
  ): Promise<MailLabel>;
  updateLabel(
    context: MailOperationContext,
    input: MailUpdateLabelInput,
  ): Promise<MailLabel>;
  deleteLabel(context: MailOperationContext, labelId: string): Promise<void>;
  updateMessageLabels(
    context: MailOperationContext,
    input: MailUpdateMessageLabelsInput,
  ): Promise<MailMessage>;
  getUnreadCount(context: MailOperationContext): Promise<number>;
  startSync(
    context: MailOperationContext,
    input: MailStartSyncInput,
  ): Promise<MailSyncRunView>;
  getSyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView | undefined>;
  listSyncRunsPage(
    context: MailOperationContext,
    offset?: number,
    limit?: number,
  ): Promise<MailOffsetPage<MailSyncRunView>>;
  listSubmissionsPage(
    context: MailOperationContext,
    bulkOnly?: boolean,
    offset?: number,
    groupByBatch?: boolean,
    limit?: number,
  ): Promise<MailOffsetPage<MailSubmissionLogView>>;
  listSyncRuns(
    context: MailOperationContext,
    offset?: number,
    limit?: number,
  ): Promise<readonly MailSyncRunView[]>;
  retrySyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView>;
  cancelSyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView>;
  retrySubmission(
    context: MailOperationContext,
    submissionId: string,
  ): Promise<MailSubmissionLogView>;
  cancelSubmission(
    context: MailOperationContext,
    submissionId: string,
  ): Promise<MailSubmissionLogView>;
  listSubmissions(
    context: MailOperationContext,
    bulkOnly?: boolean,
    offset?: number,
    groupByBatch?: boolean,
    limit?: number,
  ): Promise<readonly MailSubmissionLogView[]>;
  listMessages(
    context: MailOperationContext,
    input: MailListMessagesInput,
  ): Promise<MailPage<MailMessageSummary>>;
  retryMessageContent(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
  ): Promise<MailMessage>;
  getMessage(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
  ): Promise<MailMessage | undefined>;
  getAttachment(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<MailAttachmentContent>;
  listConversationMessages(
    context: MailOperationContext,
    accountId: string,
    conversationId: string,
    input?: MailListConversationMessagesInput,
  ): Promise<MailPage<MailMessage>>;
  sendMessage(
    context: MailOperationContext,
    input: MailComposeInput,
  ): Promise<MailSubmissionView>;
  sendBulk(
    context: MailOperationContext,
    input: MailBulkComposeInput,
  ): Promise<readonly MailSubmissionView[]>;
  saveDraft(
    context: MailOperationContext,
    input: MailComposeInput,
  ): Promise<MailMessage>;
  resolveDraftConflict(
    context: MailOperationContext,
    input: MailResolveDraftConflictInput,
  ): Promise<MailMessage>;
  getUploadedAttachment(
    context: MailOperationContext,
    attachmentId: string,
  ): Promise<MailAttachmentContent>;

  uploadAttachment(
    context: MailOperationContext,
    input: MailUploadAttachmentInput,
  ): Promise<MailOutboundAttachmentView>;
  listTemplates(
    context: MailOperationContext,
  ): Promise<readonly MailTemplate[]>;
  saveTemplate(
    context: MailOperationContext,
    input: MailSaveTemplateInput,
  ): Promise<MailTemplate>;
  updateTemplate(
    context: MailOperationContext,
    input: MailUpdateTemplateInput,
  ): Promise<MailTemplate>;
  deleteTemplate(
    context: MailOperationContext,
    templateId: string,
  ): Promise<void>;
  updateMessage(
    context: MailOperationContext,
    input: MailUpdateMessageInput,
  ): Promise<MailMessage>;
  moveMessage(
    context: MailOperationContext,
    input: MailMoveMessageInput,
  ): Promise<MailMessage>;
  deleteMessage(
    context: MailOperationContext,
    input: MailDeleteMessageInput,
  ): Promise<void>;
}

/** Background delivery and synchronization lifecycle owned by the Mail provider. */
export interface MailRuntimeService {
  start(): Promise<void>;
  scheduleAutomaticSync(): void;
  createAutomaticSyncRuns(): Promise<number>;
  schedulePushSync(accountId: string): Promise<boolean>;
  schedulePushSyncBatch(accounts: readonly MailAccount[]): Promise<void>;
  kick(): void;
  publishPending(): Promise<void>;
  close(): Promise<void>;
}
