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
  MailFolderChoices,
  MailSyncFolderPreview,
  MailIdentity,
  MailLabel,
  MailListConversationMessagesInput,
  MailListMessagesInput,
  MailAdminAccountFilter,
  MailAdminAccountView,
  MailManagedAccountView,
  MailManagedLogFilter,
  MailManagedSubmissionView,
  MailTeamAccountView,
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
  MailUpdatedAccountView,
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
  ): Promise<MailUpdatedAccountView>;
  /**
   * Mark an account for removal; a background task deletes it. Answers the account in its `removing` state, or
   * `undefined` when the removal already finished.
   */
  removeAccount(
    context: MailOperationContext,
    accountId: string,
  ): Promise<MailAccountView | undefined>;
  /** Count the local messages a folder selection would delete before it is saved with `updateAccount`. */
  previewSyncFolders(
    context: MailOperationContext,
    accountId: string,
    syncFolderIds: readonly string[] | null,
  ): Promise<MailSyncFolderPreview>;
  listManagedAccounts(
    context: MailOperationContext,
  ): Promise<readonly MailManagedAccountView[]>;
  /** Every member's accounts for the Mail settings page: owner, Provider, status and last synchronization. */
  listAdminAccounts(
    context: MailOperationContext,
    filter?: MailAdminAccountFilter,
  ): Promise<readonly MailAdminAccountView[]>;
  /** Every member's accounts for Team mail's filters: owner and address. */
  listTeamAccounts(
    context: MailOperationContext,
  ): Promise<readonly MailTeamAccountView[]>;
  /** How many accounts each configured Provider has in each status. */
  countAccountsByProvider(
    context: MailOperationContext,
  ): Promise<readonly import('./persistence.js').MailProviderAccountCount[]>;
  /**
   * Every user's sync runs, newest first, continuing after `pageToken`. `canManage` marks every run manageable for a
   * caller who may retry and cancel them on the Mail settings page.
   */
  listManagedSyncRunsPage(
    context: MailOperationContext,
    pageToken: string | undefined,
    limit: number,
    filter?: MailManagedLogFilter,
    canManage?: boolean,
  ): Promise<MailPage<MailSyncRunView>>;
  /** Every user's submissions, newest first, one page at a time, without their content. */
  listManagedSubmissionsPage(
    context: MailOperationContext,
    pageToken: string | undefined,
    limit: number,
    filter?: MailManagedLogFilter,
    canManage?: boolean,
  ): Promise<MailPage<MailManagedSubmissionView>>;
  /** Retry any member's failed or cancelled sync run; the caller must hold `settings:mail.admin/manage`. */
  retryManagedSyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView>;
  /** Cancel any member's active sync run; the caller must hold `settings:mail.admin/manage`. */
  cancelManagedSyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView>;
  /** Retry any member's failed submission; the caller must hold `settings:mail.admin/manage`. */
  retryManagedSubmission(
    context: MailOperationContext,
    submissionId: string,
  ): Promise<MailManagedSubmissionView>;
  /** Cancel any member's pending or failed submission; the caller must hold `settings:mail.admin/manage`. */
  cancelManagedSubmission(
    context: MailOperationContext,
    submissionId: string,
  ): Promise<MailManagedSubmissionView>;
  listManagedFolders(
    context: MailOperationContext,
    accountId: string,
  ): Promise<readonly MailFolder[]>;
  /** Every member's messages; `userId` narrows them to one member's accounts. */
  listManagedMessages(
    context: MailOperationContext,
    input: MailListMessagesInput,
    userId?: string,
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
  /**
   * The account's synchronized folders. `includeUnsynced` adds the unselected folders, each with `synced`, for a folder
   * selection.
   */
  listFolders(
    context: MailOperationContext,
    accountId: string,
    options?: { readonly includeUnsynced?: boolean },
  ): Promise<readonly MailFolder[]>;
  /** Every folder of the account, each with `synced`, and whether they form a complete listing. */
  listFolderChoices(
    context: MailOperationContext,
    accountId: string,
  ): Promise<MailFolderChoices>;
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
  getOriginalMessage(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
  ): Promise<MailAttachmentContent>;
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
