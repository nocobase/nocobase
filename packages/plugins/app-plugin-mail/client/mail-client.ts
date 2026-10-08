import { ApiClientError, type ApiClient } from '@nocobase/app-client';
import type {
  MailAccountView,
  MailAuthorizationStartResult,
  MailConnectAccountInput,
  MailComposeInput,
  MailBulkComposeInput,
  MailFolder,
  MailLabel,
  MailLabelColor,
  MailIdentity,
  MailSignature,
  MailSaveSignatureInput,
  MailListMessagesInput,
  MailManagedAccountView,
  MailManagementMessageActionInput,
  MailManagementMessageActionResult,
  MailMessage,
  MailMessageSummary,
  MailUpdateMessageInput,
  MailMoveMessageInput,
  MailUpdateMessageLabelsInput,
  MailPage,
  MailOffsetPage,
  MailProviderView,
  MailStartSyncInput,
  MailSubmissionLogView,
  MailSubmissionView,
  MailSyncRunView,
  MailUpdateAccountInput,
  MailUpdateIdentityInput,
  MailUpdateLabelInput,
  MailOutboundAttachmentView,
  MailTemplate,
  MailSaveTemplateInput,
  MailResolveDraftConflictInput,
} from '../shared/mail.js';

export type {
  MailAccountStatus,
  KnownMailAccountStatus,
  MailAccountView,
  MailAddress,
  MailAuthorizationStartResult,
  MailConnectAccountInput,
  MailComposeInput,
  MailBulkComposeInput,
  MailFolder,
  MailFolderType,
  KnownMailFolderType,
  MailLabel,
  MailLabelColor,
  MailIdentity,
  MailSignature,
  MailSaveSignatureInput,
  MailSaveLabelInput,
  MailInitialSyncPolicy,
  MailManagedAccountView,
  MailManagementMessageAction,
  MailManagementMessageActionInput,
  MailManagementMessageActionItemResult,
  MailManagementMessageActionResult,
  MailMessage,
  MailMessageSummary,
  MailPage,
  MailOffsetPage,
  MailProviderCapabilities,
  MailProviderErrorCategory,
  KnownMailProviderErrorCategory,
  MailProviderReasonCode,
  KnownMailProviderReasonCode,
  MailPublicError,
  MailProviderView,
  MailStartSyncInput,
  MailSubmissionStatus,
  KnownMailSubmissionStatus,
  MailSubmissionLogView,
  MailSubmissionView,
  MailSyncMode,
  MailSyncPhase,
  KnownMailSyncPhase,
  MailSyncRunStatus,
  KnownMailSyncRunStatus,
  MailSyncRunView,
  MailOutboundAttachmentView,
  MailTemplate,
  MailSaveTemplateInput,
  MailUpdateLabelInput,
  MailUpdateSignatureInput,
  MailUpdateTemplateInput,
  MailDraftConflict,
  MailDraftConflictAction,
  MailResolveDraftConflictInput,
} from '../shared/mail.js';

interface DataResponse<T> {
  readonly data: T;
}

interface ListResponse<T, M> {
  readonly data: readonly T[];
  readonly meta?: M;
}

/** `meta` of a cursor-paged feed. */
interface CursorMeta {
  readonly nextPageToken?: string;
  readonly total?: number;
}

/** `meta` of a page-number-paged table. */
interface PageMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

/** Page-number paging for administrative tables: `page` starts at 1 and `pageSize` is at most 100. */
export interface MailPageRequest {
  readonly page?: number;
  readonly pageSize?: number;
}

export interface MailSubmissionsRequest extends MailPageRequest {
  readonly bulkOnly?: boolean;
  readonly groupByBatch?: boolean;
}

/** Cursor paging for feeds: send back `nextCursor` of the previous page as `pageToken`. */
export interface MailCursorRequest {
  readonly pageSize?: number;
  readonly pageToken?: string;
}

export interface MailAuthorizationRequest {
  readonly type: string;
  readonly name: string;
  readonly scopes?: readonly string[];
  readonly initialSyncReceivedAfter: string;
}

export type MailConnectAccountRequest = Omit<
  MailConnectAccountInput,
  'provider'
> & {
  readonly type: string;
  readonly name: string;
};

export interface MailMessagesQuery
  extends MailCursorRequest, Pick<MailListMessagesInput, 'conversationId'> {
  readonly accountId?: string;
  readonly folderId?: string;
  readonly labelId?: string;
  /** Search text. */
  readonly q?: string;
  readonly unread?: boolean;
  readonly starred?: boolean;
}

export interface MailManagedMessagesQuery extends MailPageRequest {
  readonly accountId?: string;
  readonly folderId?: string;
  readonly q?: string;
  readonly unread?: boolean;
  readonly starred?: boolean;
}

export class MailClient {
  public constructor(private readonly client: ApiClient) {}

  public listProviders(): Promise<readonly MailProviderView[]> {
    return this.client
      .request<DataResponse<readonly MailProviderView[]>>({
        path: 'mail/providers',
      })
      .then((response) => response.data);
  }

  public listAccounts(): Promise<readonly MailAccountView[]> {
    return this.client
      .request<DataResponse<readonly MailAccountView[]>>({
        path: 'mail/accounts',
      })
      .then((response) => response.data);
  }

  public updateAccount(
    input: MailUpdateAccountInput,
  ): Promise<MailAccountView> {
    const { accountId, ...json } = input;
    return this.client
      .request<DataResponse<MailAccountView>>({
        path: `mail/accounts/${encodeURIComponent(accountId)}`,
        method: 'PATCH',
        json,
      })
      .then((response) => response.data);
  }

  /**
   * Start removing an account. The server answers 202 with the account in its `removing` state, or with no body when
   * the removal already finished.
   */
  public removeAccount(
    accountId: string,
  ): Promise<MailAccountView | undefined> {
    return this.client
      .request<DataResponse<MailAccountView> | undefined>({
        path: `mail/accounts/${encodeURIComponent(accountId)}`,
        method: 'DELETE',
      })
      .then((response) => response?.data);
  }

  public listManagedAccounts(): Promise<readonly MailManagedAccountView[]> {
    return this.client
      .request<DataResponse<readonly MailManagedAccountView[]>>({
        path: 'mail/settings/accounts',
      })
      .then((response) => response.data);
  }

  public listManagementAccounts(): Promise<readonly MailManagedAccountView[]> {
    return this.client
      .request<DataResponse<readonly MailManagedAccountView[]>>({
        path: 'mail/management/accounts',
      })
      .then((response) => response.data);
  }

  public listManagedFolders(accountId: string): Promise<readonly MailFolder[]> {
    return this.client
      .request<DataResponse<readonly MailFolder[]>>({
        path: `mail/management/accounts/${encodeURIComponent(accountId)}/folders`,
      })
      .then((response) => response.data);
  }

  /** Every user's sync runs, for administrators, paged by page number. */
  public listManagedSyncRunsPage(
    request: MailPageRequest = {},
  ): Promise<MailOffsetPage<MailSyncRunView>> {
    return this.client
      .request<ListResponse<MailSyncRunView, PageMeta>>({
        path: 'mail/settings/syncRuns',
        query: { page: request.page, pageSize: request.pageSize },
      })
      .then(toOffsetPage);
  }

  /** Every user's submissions, for administrators, paged by page number. */
  public listManagedSubmissionsPage(
    request: MailPageRequest = {},
  ): Promise<MailOffsetPage<MailSubmissionLogView>> {
    return this.client
      .request<ListResponse<MailSubmissionLogView, PageMeta>>({
        path: 'mail/settings/submissions',
        query: { page: request.page, pageSize: request.pageSize },
      })
      .then(toOffsetPage);
  }

  public getUnreadCount(): Promise<number> {
    return this.client
      .request<DataResponse<number>>({ path: 'mail/messages/countUnread' })
      .then((response) => response.data);
  }

  public startAuthorization(
    input: MailAuthorizationRequest,
  ): Promise<MailAuthorizationStartResult> {
    return this.post<MailAuthorizationStartResult>(
      'mail/authorizations',
      input,
    );
  }

  public connectAccount(
    input: MailConnectAccountRequest,
  ): Promise<MailAccountView> {
    const { type, name, ...json } = input;
    return this.post<MailAccountView>('mail/accounts/connect', {
      type,
      name,
      ...json,
    });
  }

  public listIdentities(accountId: string): Promise<readonly MailIdentity[]> {
    return this.client
      .request<DataResponse<readonly MailIdentity[]>>({
        path: `mail/accounts/${encodeURIComponent(accountId)}/identities`,
      })
      .then((response) => response.data);
  }

  public updateIdentity(input: MailUpdateIdentityInput): Promise<MailIdentity> {
    const { accountId, identityId, ...json } = input;
    return this.client
      .request<DataResponse<MailIdentity>>({
        path: `mail/accounts/${encodeURIComponent(accountId)}/identities/${encodeURIComponent(identityId)}`,
        method: 'PATCH',
        json,
      })
      .then((response) => response.data);
  }

  public listSignatures(accountId: string): Promise<readonly MailSignature[]> {
    return this.client
      .request<DataResponse<readonly MailSignature[]>>({
        path: `mail/accounts/${encodeURIComponent(accountId)}/signatures`,
      })
      .then((response) => response.data);
  }

  public saveSignature(input: MailSaveSignatureInput): Promise<MailSignature> {
    const { id, accountId, ...json } = input;
    return this.client
      .request<DataResponse<MailSignature>>({
        path: `mail/accounts/${encodeURIComponent(accountId)}/signatures${id ? `/${encodeURIComponent(id)}` : ''}`,
        method: id ? 'PATCH' : 'POST',
        json,
      })
      .then((response) => response.data);
  }

  public deleteSignature(
    accountId: string,
    signatureId: string,
  ): Promise<void> {
    return this.client.request<void>({
      path: `mail/accounts/${encodeURIComponent(accountId)}/signatures/${encodeURIComponent(signatureId)}`,
      method: 'DELETE',
    });
  }

  public listFolders(accountId: string): Promise<readonly MailFolder[]> {
    return this.client
      .request<DataResponse<readonly MailFolder[]>>({
        path: `mail/accounts/${encodeURIComponent(accountId)}/folders`,
      })
      .then((response) => response.data);
  }

  public listLabels(): Promise<readonly MailLabel[]> {
    return this.client
      .request<DataResponse<readonly MailLabel[]>>({
        path: 'mail/labels',
      })
      .then((response) => response.data);
  }

  public createLabel(name: string, color?: MailLabelColor): Promise<MailLabel> {
    return this.post<MailLabel>('mail/labels', { name, color });
  }

  public updateLabel(input: MailUpdateLabelInput): Promise<MailLabel> {
    const { id, ...json } = input;
    return this.client
      .request<DataResponse<MailLabel>>({
        path: `mail/labels/${encodeURIComponent(id)}`,
        method: 'PATCH',
        json,
      })
      .then((response) => response.data);
  }

  public deleteLabel(labelId: string): Promise<void> {
    return this.client.request<void>({
      path: `mail/labels/${encodeURIComponent(labelId)}`,
      method: 'DELETE',
    });
  }

  public startSync(input: MailStartSyncInput): Promise<MailSyncRunView> {
    const { accountId, ...body } = input;
    return this.post<MailSyncRunView>(
      `mail/accounts/${encodeURIComponent(accountId)}/sync`,
      body,
    );
  }

  public getSyncRun(syncRunId: string): Promise<MailSyncRunView> {
    return this.client
      .request<DataResponse<MailSyncRunView>>({
        path: `mail/syncRuns/${encodeURIComponent(syncRunId)}`,
      })
      .then((response) => response.data);
  }

  public listSyncRunsPage(
    request: MailPageRequest = {},
  ): Promise<MailOffsetPage<MailSyncRunView>> {
    return this.client
      .request<ListResponse<MailSyncRunView, PageMeta>>({
        path: 'mail/syncRuns',
        query: { page: request.page, pageSize: request.pageSize },
      })
      .then(toOffsetPage);
  }

  public listSubmissionsPage(
    request: MailSubmissionsRequest = {},
  ): Promise<MailOffsetPage<MailSubmissionLogView>> {
    return this.client
      .request<ListResponse<MailSubmissionLogView, PageMeta>>({
        path: 'mail/submissions',
        query: {
          bulkOnly: request.bulkOnly,
          groupByBatch: request.groupByBatch,
          page: request.page,
          pageSize: request.pageSize,
        },
      })
      .then(toOffsetPage);
  }

  public retrySyncRun(syncRunId: string): Promise<MailSyncRunView> {
    return this.post<MailSyncRunView>(
      `mail/syncRuns/${encodeURIComponent(syncRunId)}/retry`,
      {},
    );
  }

  public cancelSyncRun(syncRunId: string): Promise<MailSyncRunView> {
    return this.post<MailSyncRunView>(
      `mail/syncRuns/${encodeURIComponent(syncRunId)}/cancel`,
      {},
    );
  }

  public retrySubmission(submissionId: string): Promise<MailSubmissionLogView> {
    return this.post<MailSubmissionLogView>(
      `mail/submissions/${encodeURIComponent(submissionId)}/retry`,
      {},
    );
  }

  public cancelSubmission(
    submissionId: string,
  ): Promise<MailSubmissionLogView> {
    return this.post<MailSubmissionLogView>(
      `mail/submissions/${encodeURIComponent(submissionId)}/cancel`,
      {},
    );
  }

  public listMessages(
    input: MailMessagesQuery = {},
  ): Promise<MailPage<MailMessageSummary>> {
    return this.client
      .request<ListResponse<MailMessageSummary, CursorMeta>>({
        path: 'mail/messages',
        query: { ...input },
      })
      .then(toCursorPage);
  }

  public listManagedMessages(
    input: MailManagedMessagesQuery = {},
  ): Promise<MailOffsetPage<MailMessageSummary>> {
    return this.client
      .request<ListResponse<MailMessageSummary, PageMeta>>({
        path: 'mail/management/messages',
        query: { ...input },
      })
      .then(toOffsetPage);
  }

  public manageMessages(
    input: MailManagementMessageActionInput,
  ): Promise<MailManagementMessageActionResult> {
    return this.post<MailManagementMessageActionResult>(
      'mail/management/messages/batchApply',
      input,
    );
  }

  public getManagedMessage(
    accountId: string,
    messageId: string,
  ): Promise<MailMessage> {
    return this.client
      .request<DataResponse<MailMessage>>({
        path: `mail/management/accounts/${encodeURIComponent(accountId)}/messages/${encodeURIComponent(messageId)}`,
      })
      .then((response) => response.data);
  }

  public downloadManagedAttachment(
    accountId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<ReadableStream<Uint8Array>> {
    return this.client.stream({
      path: `mail/management/accounts/${encodeURIComponent(accountId)}/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`,
    });
  }

  public retryMessageContent(
    accountId: string,
    messageId: string,
  ): Promise<MailMessage> {
    return this.post<MailMessage>(
      `mail/accounts/${encodeURIComponent(accountId)}/messages/${encodeURIComponent(messageId)}/retryContent`,
      {},
    );
  }

  public getMessage(
    accountId: string,
    messageId: string,
  ): Promise<MailMessage> {
    return this.client
      .request<DataResponse<MailMessage>>({
        path: `mail/accounts/${encodeURIComponent(accountId)}/messages/${encodeURIComponent(messageId)}`,
      })
      .then((response) => response.data);
  }

  public downloadAttachment(
    accountId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<ReadableStream<Uint8Array>> {
    return this.client.stream({
      path: `mail/accounts/${encodeURIComponent(accountId)}/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`,
    });
  }

  public listConversationMessages(
    accountId: string,
    conversationId: string,
    input: MailCursorRequest = {},
  ): Promise<MailPage<MailMessage>> {
    return this.client
      .request<ListResponse<MailMessage, CursorMeta>>({
        path: `mail/accounts/${encodeURIComponent(accountId)}/conversations/${encodeURIComponent(conversationId)}/messages`,
        query: { ...input },
      })
      .then(toCursorPage);
  }

  public sendMessage(input: MailComposeInput): Promise<MailSubmissionView> {
    return this.post<MailSubmissionView>('mail/messages/send', input);
  }

  public sendBulk(
    input: MailBulkComposeInput,
  ): Promise<readonly MailSubmissionView[]> {
    return this.post<readonly MailSubmissionView[]>(
      'mail/messages/sendBulk',
      input,
    );
  }

  public uploadAttachment(file: File): Promise<MailOutboundAttachmentView> {
    const body = new FormData();
    body.append('file', file);
    return this.client
      .request<DataResponse<MailOutboundAttachmentView>>({
        path: 'mail/attachments',
        method: 'POST',
        body,
      })
      .then((response) => response.data);
  }

  public listTemplates(): Promise<readonly MailTemplate[]> {
    return this.client
      .request<DataResponse<readonly MailTemplate[]>>({
        path: 'mail/templates',
      })
      .then((response) => response.data);
  }

  public saveTemplate(input: MailSaveTemplateInput): Promise<MailTemplate> {
    const { id, ...json } = input;
    return this.client
      .request<DataResponse<MailTemplate>>({
        path: id
          ? `mail/templates/${encodeURIComponent(id)}`
          : 'mail/templates',
        method: id ? 'PATCH' : 'POST',
        json,
      })
      .then((response) => response.data);
  }

  public deleteTemplate(templateId: string): Promise<void> {
    return this.client
      .request({
        path: `mail/templates/${encodeURIComponent(templateId)}`,
        method: 'DELETE',
      })
      .then(() => undefined);
  }

  public saveDraft(input: MailComposeInput): Promise<MailMessage> {
    return this.post<MailMessage>('mail/messages/saveDraft', input);
  }

  public resolveDraftConflict(
    input: MailResolveDraftConflictInput,
  ): Promise<MailMessage> {
    const { accountId, messageId, action } = input;
    return this.post<MailMessage>(
      `mail/accounts/${encodeURIComponent(accountId)}/messages/${encodeURIComponent(messageId)}/resolveDraftConflict`,
      { action },
    );
  }

  public updateMessage(input: MailUpdateMessageInput): Promise<MailMessage> {
    const { accountId, messageId, ...json } = input;
    return this.client
      .request<DataResponse<MailMessage>>({
        path: `mail/accounts/${encodeURIComponent(accountId)}/messages/${encodeURIComponent(messageId)}`,
        method: 'PATCH',
        json,
      })
      .then((response) => response.data);
  }

  public updateMessageLabels(
    input: MailUpdateMessageLabelsInput,
  ): Promise<MailMessage> {
    const { accountId, messageId, ...json } = input;
    return this.client
      .request<DataResponse<MailMessage>>({
        path: `mail/accounts/${encodeURIComponent(accountId)}/messages/${encodeURIComponent(messageId)}/modifyLabels`,
        method: 'POST',
        json,
      })
      .then((response) => response.data);
  }

  public moveMessage(input: MailMoveMessageInput): Promise<MailMessage> {
    const { accountId, messageId, ...json } = input;
    return this.client
      .request<DataResponse<MailMessage>>({
        path: `mail/accounts/${encodeURIComponent(accountId)}/messages/${encodeURIComponent(messageId)}/move`,
        method: 'POST',
        json,
      })
      .then((response) => response.data);
  }

  public deleteMessage(
    accountId: string,
    messageId: string,
    permanently = false,
  ): Promise<void> {
    return this.client.request<void>({
      path: `mail/accounts/${encodeURIComponent(accountId)}/messages/${encodeURIComponent(messageId)}`,
      method: 'DELETE',
      query: { permanently },
    });
  }

  private post<T>(path: string, body: unknown): Promise<T> {
    return this.client
      .request<DataResponse<T>>({
        path,
        method: 'POST',
        json: body,
      })
      .then((response) => response.data);
  }
}

/**
 * Text to show a user for a failed Mail call: the translation the server attached to its error, or `fallback`. An
 * error thrown in the browser carries its own, already translated, message. A server's `message` is developer text and
 * is never shown.
 */
export function mailErrorMessage(cause: unknown, fallback: string): string {
  if (cause instanceof ApiClientError) {
    const localized = readLocalizedMessage(cause.payload);
    return localized?.trim() ? localized : fallback;
  }
  return cause instanceof Error && cause.message.trim()
    ? cause.message
    : fallback;
}

function readLocalizedMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const error = (payload as { readonly error?: unknown }).error;
  if (!error || typeof error !== 'object') return undefined;
  const localized = (error as { readonly localizedMessage?: unknown })
    .localizedMessage;
  if (!localized || typeof localized !== 'object') return undefined;
  const message = (localized as { readonly message?: unknown }).message;
  return typeof message === 'string' ? message : undefined;
}

function toOffsetPage<T>(
  response: ListResponse<T, PageMeta>,
): MailOffsetPage<T> {
  return {
    items: response.data,
    total: response.meta?.total ?? response.data.length,
  };
}

/** A feed page; `nextCursor` carries `meta.nextPageToken`, which the next request sends back as `pageToken`. */
function toCursorPage<T>(response: ListResponse<T, CursorMeta>): MailPage<T> {
  return {
    items: response.data,
    ...(response.meta?.total !== undefined
      ? { total: response.meta.total }
      : {}),
    ...(response.meta?.nextPageToken
      ? { nextCursor: response.meta.nextPageToken }
      : {}),
  };
}
