import { randomUUID } from 'node:crypto';
import { incompleteMessage } from '../incomplete-message.js';
import type {
  MailAttachmentContent,
  MailProviderResult,
  MailSyncCursor,
} from '../../../shared/mail.js';
import type {
  MailProviderAdapter,
  MailProviderAccount,
  MailProviderChangePage,
  MailProviderContext,
  MailProviderFolderPage,
  MailProviderListChangesInput,
  MailProviderListFoldersInput,
  MailProviderListMessagesInput,
  MailProviderMessagePage,
  MailProviderSendInput,
  MailProviderSendResult,
  MailProviderUpsertPushSubscriptionInput,
  MailProviderUpsertPushSubscriptionResult,
  MailProviderUpdateLabelsInput,
  NormalizedMailFolder,
  NormalizedMailMessage,
} from '../../contracts/provider.js';

import type {
  GmailCredential,
  GmailDraftList,
  GmailDraftResource,
  GmailHistoryList,
  GmailLabelList,
  GmailLabelResource,
  GmailMailProviderConfig,
  GmailMessageList,
  GmailMessageResource,
  GmailProfile,
  GmailWatchResponse,
} from './types.js';
import type { GmailBatchItemResult } from './batch.js';
import { GMAIL_CAPABILITIES } from './constants.js';
import { parseGmailBatchResponse } from './batch.js';
import { waitForGmailQuota } from './quota.js';
import {
  apiBase,
  fetchWithTimeout,
  gmailRequest,
  readJson,
  responseError,
  submissionResponse,
} from './http.js';
import {
  contentPreparationError,
  errorResult,
  failure,
  unknownError,
  ProviderRequestError,
} from './errors.js';
import {
  decodeBase64Url,
  gmailFolderType,
  normalizeMessage,
} from './normalize.js';
import {
  buildMime,
  forwardedHtml,
  forwardedText,
  normalizedDraft,
} from './mime.js';
import { gmailCursor, parseGmailCursor } from './sync.js';
import { expiry, exchangeToken, required, splitScopes } from './auth.js';

export class GmailMailProviderAdapter implements MailProviderAdapter {
  public readonly identity: MailProviderAccount['provider'];
  public readonly capabilities: MailProviderAdapter['capabilities'] =
    GMAIL_CAPABILITIES;
  public readonly pushNotificationsConfigured: boolean;
  private static readonly batchGetSize = 10;

  public constructor(
    private readonly context: MailProviderContext,
    private readonly config: GmailMailProviderConfig,
    private readonly account: MailProviderAccount,
  ) {
    this.identity = account.provider;
    this.pushNotificationsConfigured = Boolean(config.pushTopicName);
  }

  public async upsertPushSubscription(
    input: MailProviderUpsertPushSubscriptionInput,
  ): Promise<MailProviderResult<MailProviderUpsertPushSubscriptionResult>> {
    if (!this.config.pushTopicName) {
      return failure(
        'GMAIL_PUSH_TOPIC_REQUIRED',
        'Gmail push notifications require pushTopicName.',
        'configuration',
        false,
      );
    }
    const result = await this.request<GmailWatchResponse>('/users/me/watch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        topicName: this.config.pushTopicName,
        ...(this.config.pushLabelIds?.length
          ? {
              labelIds: this.config.pushLabelIds,
              labelFilterBehavior: 'include',
            }
          : {}),
      }),
      signal: input.signal,
    });
    if (!result.ok) return result;
    const expiration = Number(result.value.expiration);
    if (!Number.isFinite(expiration)) {
      return failure(
        'GMAIL_PUSH_EXPIRATION_MISSING',
        'Gmail did not return a push watch expiration.',
        'provider',
        false,
      );
    }
    const expiresAt = new Date(expiration).toISOString();
    return {
      ok: true,
      value: {
        providerSubscriptionId: this.account.address,
        renewAfter: new Date(
          Math.min(Date.now() + 86_400_000, expiration - 3_600_000),
        ).toISOString(),
        expiresAt,
      },
    };
  }

  public deletePushSubscription(
    _providerSubscriptionId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    return this.emptyRequest('/users/me/stop', { method: 'POST', signal });
  }

  public async getCurrentSyncCursor(
    signal?: AbortSignal,
  ): Promise<MailProviderResult<MailSyncCursor>> {
    const profile = await this.request<GmailProfile>('/users/me/profile', {
      signal,
    });
    if (!profile.ok) return profile;
    return profile.value.historyId
      ? {
          ok: true,
          value: gmailCursor(
            profile.value.historyId,
            undefined,
            new Date().toISOString(),
          ),
        }
      : failure(
          'GMAIL_HISTORY_ID_MISSING',
          'Gmail did not provide a history ID for the initial sync baseline.',
          'provider',
          false,
        );
  }

  public async listFolders(
    input: MailProviderListFoldersInput,
  ): Promise<MailProviderResult<MailProviderFolderPage>> {
    const result = await this.request<GmailLabelList>('/users/me/labels', {
      signal: input.signal,
    });
    if (!result.ok) return result;
    const folders = (result.value.labels ?? []).flatMap((label) =>
      label.id
        ? [
            {
              providerFolderId: label.id,
              type: gmailFolderType(label.id),
              name: label.name ?? label.id,
              unreadCount: label.messagesUnread,
              kind: 'label' as const,
            },
          ]
        : [],
    );
    const completeFolders = [
      ...folders,
      {
        providerFolderId: '__archive__',
        type: 'archive' as const,
        name: 'Archive',
        kind: 'label' as const,
      },
    ];
    return {
      ok: true,
      value: {
        folders: completeFolders,
        completeProviderFolderIds: completeFolders.map(
          (folder) => folder.providerFolderId,
        ),
      },
    };
  }

  public async createLabel(
    name: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<NormalizedMailFolder>> {
    const result = await this.request<GmailLabelResource>('/users/me/labels', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      }),
      signal,
    });
    if (!result.ok) return result;
    const id = result.value.id;
    if (!id) {
      return failure(
        'GMAIL_LABEL_ID_MISSING',
        'Gmail did not return an ID for the created label.',
        'provider',
        false,
      );
    }
    return {
      ok: true,
      value: {
        providerFolderId: id,
        type: 'custom',
        name: result.value.name ?? name,
        unreadCount: result.value.messagesUnread,
        kind: 'label',
      },
    };
  }

  public updateLabels(
    providerMessageId: string,
    input: MailProviderUpdateLabelsInput,
  ): Promise<MailProviderResult<void>> {
    return this.modifyLabels(
      providerMessageId,
      input.addLabelIds,
      input.removeLabelIds,
      input.signal,
    );
  }

  public async listMessages(
    input: MailProviderListMessagesInput,
  ): Promise<MailProviderResult<MailProviderMessagePage>> {
    if (
      !input.receivedAfter ||
      !Number.isFinite(Date.parse(input.receivedAfter))
    ) {
      return failure(
        'GMAIL_SYNC_START_DATE_REQUIRED',
        'Gmail initial synchronization requires a valid start date.',
        'configuration',
        false,
      );
    }
    const query = new URLSearchParams();
    query.set('maxResults', String(Math.min(input.limit ?? 100, 500)));
    query.set('includeSpamTrash', 'true');
    if (input.cursor) query.set('pageToken', input.cursor);
    const seconds = Math.floor(new Date(input.receivedAfter).getTime() / 1000);
    query.set('q', `after:${seconds - 1}`);
    const page = await this.request<GmailMessageList>(
      `/users/me/messages?${query.toString()}`,
      { signal: input.signal },
    );
    if (!page.ok)
      return input.cursor &&
        page.error.code === 'GMAIL_HTTP_400' &&
        /token/i.test(page.error.message)
        ? failure(
            'GMAIL_SYNC_CURSOR_INVALID',
            'Gmail history pagination expired.',
            'provider',
            false,
          )
        : page;
    const messages = await this.getSyncMessages(
      (page.value.messages ?? []).flatMap((item) => (item.id ? [item.id] : [])),
      input.signal,
    );
    const failed = messages.find(
      (result) => !result.ok && result.error.code !== 'GMAIL_HTTP_404',
    );
    if (failed && !failed.ok) return failed;
    return {
      ok: true,
      value: {
        messages: messages.flatMap((result) =>
          result.ok &&
          (!input.receivedAfter ||
            !result.value.receivedAt ||
            Date.parse(result.value.receivedAt) >=
              Date.parse(input.receivedAfter))
            ? [result.value]
            : [],
        ),
        nextCursor: page.value.nextPageToken,
      },
    };
  }

  public async listChanges(
    input: MailProviderListChangesInput,
  ): Promise<MailProviderResult<MailProviderChangePage>> {
    const cursor = parseGmailCursor(input.cursor);
    if (!cursor)
      return failure(
        'GMAIL_SYNC_CURSOR_INVALID',
        'Gmail sync cursor is invalid.',
        'provider',
        false,
      );
    if (cursor.recoveryAfter) {
      return failure(
        'GMAIL_SYNC_CURSOR_INVALID',
        'Gmail requires a complete policy-scoped rescan.',
        'provider',
        false,
      );
    }
    const query = new URLSearchParams({
      startHistoryId: cursor.historyId,
      maxResults: String(Math.min(input.limit, 500)),
    });
    if (cursor.pageToken) query.set('pageToken', cursor.pageToken);
    const history = await this.request<GmailHistoryList>(
      `/users/me/history?${query.toString()}`,
      { signal: input.signal },
    );
    if (!history.ok) {
      return history.error.code === 'GMAIL_HTTP_404'
        ? failure(
            'GMAIL_SYNC_CURSOR_INVALID',
            'Gmail history expired; rescan is required.',
            'provider',
            false,
          )
        : history;
    }
    const deleted = new Set<string>();
    const changed = new Set<string>();
    for (const record of history.value.history ?? []) {
      for (const item of record.messages ?? [])
        if (item.id) changed.add(item.id);
      for (const item of record.messagesAdded ?? [])
        if (item.message?.id) changed.add(item.message.id);
      for (const item of record.labelsAdded ?? [])
        if (item.message?.id) changed.add(item.message.id);
      for (const item of record.labelsRemoved ?? [])
        if (item.message?.id) changed.add(item.message.id);
      for (const item of record.messagesDeleted ?? []) {
        if (item.message?.id) {
          deleted.add(item.message.id);
          changed.delete(item.message.id);
        }
      }
    }
    const results = await this.getSyncMessages([...changed], input.signal);
    const failed = results.find(
      (result) => !result.ok && result.error.code !== 'GMAIL_HTTP_404',
    );
    if (failed && !failed.ok) return failed;
    const historyId = history.value.nextPageToken
      ? cursor.historyId
      : (history.value.historyId ?? cursor.historyId);
    const capturedAt = history.value.nextPageToken
      ? cursor.capturedAt
      : new Date().toISOString();
    return {
      ok: true,
      value: {
        messages: results.flatMap((result) =>
          result.ok ? [result.value] : [],
        ),
        deletedProviderMessageIds: [...deleted],
        nextCursor: gmailCursor(
          historyId,
          history.value.nextPageToken,
          capturedAt,
        ),
        hasMore: Boolean(history.value.nextPageToken),
      },
    };
  }

  private async getSyncMessages(
    ids: readonly string[],
    signal?: AbortSignal,
  ): Promise<readonly MailProviderResult<NormalizedMailMessage>[]> {
    const results: MailProviderResult<NormalizedMailMessage>[] = [];
    for (
      let offset = 0;
      offset < ids.length;
      offset += GmailMailProviderAdapter.batchGetSize
    ) {
      signal?.throwIfAborted();
      const batchIds = ids.slice(
        offset,
        offset + GmailMailProviderAdapter.batchGetSize,
      );
      const batch = await this.getMessagesBatch(batchIds, signal);
      if (!batch.ok) {
        results.push(...batchIds.map(() => batch));
        continue;
      }
      for (const item of batch.value) {
        results.push(
          await this.normalizeSyncMessage(item.id, item.result, signal),
        );
      }
    }
    return results;
  }

  private async getMessagesBatch(
    ids: readonly string[],
    signal?: AbortSignal,
  ): Promise<MailProviderResult<readonly GmailBatchItemResult[]>> {
    try {
      const accessToken = await this.accessToken(signal);
      const boundary = `mail_${randomUUID().replaceAll('-', '')}`;
      const body =
        ids
          .map(
            (id, index) =>
              `--${boundary}\r\nContent-Type: application/http\r\nContent-ID: <item-${index}:${boundary}@mail.nocobase>\r\n\r\nGET /gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=full HTTP/1.1\r\naccept: application/json\r\n\r\n`,
          )
          .join('') + `--${boundary}--\r\n`;
      await waitForGmailQuota(
        this.config,
        this.account.address,
        20 * ids.length,
        signal,
      );
      const response = await fetchWithTimeout(gmailBatchUrl(this.config), {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          accept: 'application/json',
          'content-type': `multipart/mixed; boundary=${boundary}`,
        },
        body,
        signal,
      });
      const result = await parseGmailBatchResponse(response, ids);
      if (
        !result.ok &&
        result.error.code === 'GMAIL_BATCH_RESPONSE_TOO_LARGE' &&
        ids.length > 1
      ) {
        const midpoint = Math.ceil(ids.length / 2);
        const first = await this.getMessagesBatch(
          ids.slice(0, midpoint),
          signal,
        );
        if (!first.ok) return first;
        const second = await this.getMessagesBatch(ids.slice(midpoint), signal);
        if (!second.ok) return second;
        return { ok: true, value: [...first.value, ...second.value] };
      }
      return result;
    } catch (error) {
      return {
        ok: false,
        error: errorResult(error, 'GMAIL_BATCH_REQUEST_FAILED'),
      };
    }
  }

  private async normalizeSyncMessage(
    id: string,
    result: MailProviderResult<GmailMessageResource>,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<NormalizedMailMessage>> {
    if (!result.ok) return result;
    let messageResult: MailProviderResult<NormalizedMailMessage>;
    try {
      messageResult = normalizeMessage(result.value);
    } catch {
      messageResult = failure(
        'MAIL_CONTENT_INVALID',
        'Mail content could not be decoded.',
        'content',
        false,
      );
    }
    if (messageResult.ok || messageResult.error.category !== 'content')
      return messageResult;
    const metadata = await this.request<GmailMessageResource>(
      `/users/me/messages/${encodeURIComponent(id)}?format=metadata`,
      { signal },
    );
    if (!metadata.ok) return metadata;
    try {
      const normalized = normalizeMessage(metadata.value);
      if (normalized.ok)
        return {
          ok: true,
          value: incompleteMessage(
            id,
            messageResult.error.code,
            normalized.value,
          ),
        };
    } catch {
      /* Keep the provider identity even when its headers are malformed. */
    }
    const receivedAt = new Date(Number(metadata.value.internalDate));
    return {
      ok: true,
      value: incompleteMessage(id, messageResult.error.code, {
        providerFolderIds: metadata.value.labelIds ?? [],
        receivedAt:
          metadata.value.internalDate && Number.isFinite(receivedAt.getTime())
            ? receivedAt.toISOString()
            : undefined,
      }),
    };
  }

  public async getMessage(
    providerMessageId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<NormalizedMailMessage>> {
    const message = await this.request<GmailMessageResource>(
      `/users/me/messages/${encodeURIComponent(providerMessageId)}?format=full`,
      { signal },
    );
    if (!message.ok) return message;
    try {
      return normalizeMessage(message.value);
    } catch {
      return failure(
        'MAIL_CONTENT_INVALID',
        'Mail content could not be decoded.',
        'content',
        false,
      );
    }
  }

  public async getAttachment(
    providerMessageId: string,
    providerAttachmentId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<MailAttachmentContent>> {
    const result = await this.request<{ data?: string; size?: number }>(
      `/users/me/messages/${encodeURIComponent(providerMessageId)}/attachments/${encodeURIComponent(providerAttachmentId)}`,
      { signal },
    );
    if (!result.ok) return result;
    const bytes = decodeBase64Url(result.value.data ?? '');
    return {
      ok: true,
      value: {
        fileName: providerAttachmentId,
        contentType: 'application/octet-stream',
        size: result.value.size ?? bytes.byteLength,
        stream: new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(bytes);
            controller.close();
          },
        }),
      },
    };
  }

  public async sendMessage(
    input: MailProviderSendInput,
  ): Promise<MailProviderSendResult> {
    let submissionStarted = false;
    let accessToken: string;
    try {
      accessToken = await this.accessToken(input.signal);
    } catch (error) {
      return {
        status: 'failed',
        error: errorResult(error, 'GMAIL_AUTHORIZATION_FAILED'),
      };
    }
    try {
      const prepared = input.message.draftProviderMessageId
        ? { ok: true as const, value: input }
        : await this.prepareForward(input);
      if (!prepared.ok) {
        return { status: 'failed', error: prepared.error };
      }
      input = prepared.value;
    } catch (error) {
      return {
        status: 'failed',
        error: contentPreparationError(
          error,
          'GMAIL_MESSAGE_PREPARATION_FAILED',
        ),
      };
    }
    try {
      if (input.message.draftProviderMessageId) {
        let resolvedDraftId: MailProviderResult<string>;
        try {
          resolvedDraftId = await this.resolveDraftId(
            input.message.draftProviderMessageId,
            input.message.draftProviderDraftId,
            input.signal,
          );
          if (!resolvedDraftId.ok) {
            return { status: 'failed', error: resolvedDraftId.error };
          }
          const updated = await this.updateDraft(resolvedDraftId.value, input);
          if (!updated.ok) return { status: 'failed', error: updated.error };
        } catch (error) {
          return {
            status: 'failed',
            error: contentPreparationError(
              error,
              'GMAIL_MESSAGE_PREPARATION_FAILED',
            ),
          };
        }
        await waitForGmailQuota(
          this.config,
          this.account.address,
          100,
          input.signal,
        );
        input.signal?.throwIfAborted();
        submissionStarted = true;
        const response = await fetchWithTimeout(
          `${apiBase(this.config)}/users/me/drafts/send`,
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${accessToken}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({ id: resolvedDraftId.value }),
            signal: input.signal,
          },
        );
        if (!response.ok) {
          return submissionResponse(response);
        }
        const value = await readJson<GmailMessageResource>(response);
        return { status: 'accepted', providerMessageId: value.id };
      }
      let raw: string;
      try {
        raw = await buildMime(input);
      } catch (error) {
        return {
          status: 'failed',
          error: contentPreparationError(
            error,
            'GMAIL_MESSAGE_PREPARATION_FAILED',
          ),
        };
      }
      await waitForGmailQuota(
        this.config,
        this.account.address,
        100,
        input.signal,
      );
      input.signal?.throwIfAborted();
      submissionStarted = true;
      const response = await fetchWithTimeout(
        `${apiBase(this.config)}/users/me/messages/send`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            raw,
            ...(input.message.providerConversationId
              ? { threadId: input.message.providerConversationId }
              : {}),
          }),
          signal: input.signal,
        },
      );
      if (!response.ok) return submissionResponse(response);
      const value = await readJson<GmailMessageResource>(response);
      return { status: 'accepted', providerMessageId: value.id };
    } catch (error) {
      return {
        status: submissionStarted ? 'submission_unknown' : 'failed',
        error: unknownError(
          error,
          submissionStarted
            ? 'GMAIL_SEND_RESULT_UNKNOWN'
            : 'GMAIL_SEND_NOT_SUBMITTED',
        ),
      };
    }
  }

  public async saveDraft(
    input: MailProviderSendInput,
  ): Promise<MailProviderResult<NormalizedMailMessage>> {
    let accessToken: string;
    try {
      accessToken = await this.accessToken(input.signal);
    } catch (error) {
      return {
        ok: false,
        error: errorResult(error, 'GMAIL_AUTHORIZATION_FAILED'),
      };
    }
    try {
      const prepared = await this.prepareForward(input);
      if (!prepared.ok) return prepared;
      input = prepared.value;
      await waitForGmailQuota(
        this.config,
        this.account.address,
        10,
        input.signal,
      );
      const response = await fetchWithTimeout(
        `${apiBase(this.config)}/users/me/drafts`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              raw: await buildMime(input),
              ...(input.message.providerConversationId
                ? { threadId: input.message.providerConversationId }
                : {}),
            },
          }),
          signal: input.signal,
        },
      );
      if (!response.ok) {
        return { ok: false, error: await responseError('GMAIL', response) };
      }
      const value = await readJson<GmailDraftResource>(response);
      const providerMessageId = required(
        value.message?.id,
        'Gmail draft message ID',
      );
      const saved = input.message.attachments.length
        ? await this.getMessage(providerMessageId, input.signal)
        : undefined;
      if (saved && !saved.ok) return saved;
      return {
        ok: true,
        value: {
          ...(saved?.ok
            ? saved.value
            : normalizedDraft(input, providerMessageId)),
          providerDraftId: required(value.id, 'Gmail draft ID'),
          providerConversationId:
            value.message?.threadId ?? input.message.providerConversationId,
          providerFolderIds: ['DRAFT'],
          read: true,
          draft: true,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: unknownError(error, 'GMAIL_DRAFT_SAVE_FAILED'),
      };
    }
  }

  public async updateDraft(
    providerDraftId: string,
    input: MailProviderSendInput,
  ): Promise<MailProviderResult<NormalizedMailMessage>> {
    const resolvedDraftId = await this.resolveDraftId(
      input.message.draftProviderMessageId ?? providerDraftId,
      input.message.draftProviderDraftId,
      input.signal,
    );
    if (!resolvedDraftId.ok) return resolvedDraftId;
    providerDraftId = resolvedDraftId.value;
    const existing = input.message.draftProviderMessageId
      ? await this.getMessage(
          input.message.draftProviderMessageId,
          input.signal,
        )
      : undefined;
    if (existing && !existing.ok) return existing;
    const retained = new Set(input.message.retainedProviderAttachmentIds ?? []);
    const preservedAttachments = existing?.ok
      ? existing.value.attachments
          .filter((attachment) => retained.has(attachment.providerAttachmentId))
          .map((attachment) => ({
            fileName: attachment.fileName,
            contentType: attachment.contentType,
            size: attachment.size,
            contentId: attachment.contentId,
            inline: attachment.inline,
            open: async () => {
              const content = await this.getAttachment(
                existing.value.providerMessageId,
                attachment.providerAttachmentId,
                input.signal,
              );
              if (!content.ok) throw new ProviderRequestError(content.error);
              return content.value.stream;
            },
          }))
      : [];
    const message = {
      ...input.message,
      attachments: [...preservedAttachments, ...input.message.attachments],
    };
    const result = await this.request<GmailDraftResource>(
      `/users/me/drafts/${encodeURIComponent(providerDraftId)}`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: providerDraftId,
          message: {
            raw: await buildMime({ ...input, message }),
            ...(input.message.providerConversationId
              ? { threadId: input.message.providerConversationId }
              : {}),
          },
        }),
        signal: input.signal,
      },
    );
    if (!result.ok) return result;
    const providerMessageId = required(
      result.value.message?.id,
      'Gmail draft message ID',
    );
    const saved =
      input.message.attachments.length || input.message.draftProviderMessageId
        ? await this.getMessage(providerMessageId, input.signal)
        : undefined;
    if (saved && !saved.ok) return saved;
    return {
      ok: true,
      value: {
        ...(saved?.ok
          ? saved.value
          : normalizedDraft(input, providerMessageId)),
        providerDraftId,
        providerConversationId:
          result.value.message?.threadId ??
          input.message.providerConversationId,
        providerFolderIds: ['DRAFT'],
        read: true,
        draft: true,
      },
    };
  }

  private async prepareForward(
    input: MailProviderSendInput,
  ): Promise<MailProviderResult<MailProviderSendInput>> {
    const sourceId = input.message.forwardOfProviderMessageId;
    if (!sourceId) return { ok: true, value: input };
    const source = await this.getMessage(sourceId, input.signal);
    if (!source.ok) return source;
    const forwardedAttachments = source.value.attachments.map((attachment) => ({
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      size: attachment.size,
      contentId: attachment.contentId,
      inline: attachment.inline,
      open: async () => {
        const content = await this.getAttachment(
          source.value.providerMessageId,
          attachment.providerAttachmentId,
          input.signal,
        );
        if (!content.ok) throw new ProviderRequestError(content.error);
        return content.value.stream;
      },
    }));
    const attachmentSize = [
      ...forwardedAttachments,
      ...input.message.attachments,
    ].reduce((total, attachment) => total + attachment.size, 0);
    if (attachmentSize > 25 * 1024 * 1024) {
      return failure(
        'GMAIL_FORWARD_ATTACHMENTS_TOO_LARGE',
        'Forwarded attachments exceed the 25 MB message limit.',
        'content',
        false,
      );
    }
    const text = input.message.forwardBodyIncluded
      ? input.message.text
      : forwardedText(input.message.text, source.value);
    const html = input.message.forwardBodyIncluded
      ? input.message.html
      : forwardedHtml(input.message.html, input.message.text, source.value);
    return {
      ok: true,
      value: {
        ...input,
        message: {
          ...input.message,
          text,
          html,
          attachments: [...input.message.attachments, ...forwardedAttachments],
          forwardOfProviderMessageId: undefined,
        },
      },
    };
  }

  private async resolveDraftId(
    providerMessageId: string,
    providerDraftId: string | undefined,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<string>> {
    if (providerDraftId) return { ok: true, value: providerDraftId };
    let pageToken: string | undefined;
    const seenPageTokens = new Set<string>();
    do {
      if (pageToken) {
        if (seenPageTokens.has(pageToken)) {
          return failure(
            'GMAIL_PAGING_STALLED',
            'Gmail returned the same draft page token repeatedly.',
            'provider',
            false,
          );
        }
        seenPageTokens.add(pageToken);
      }
      const query = new URLSearchParams({ maxResults: '500' });
      if (pageToken) query.set('pageToken', pageToken);
      const page = await this.request<GmailDraftList>(
        `/users/me/drafts?${query.toString()}`,
        { signal },
      );
      if (!page.ok) return page;
      const match = page.value.drafts?.find(
        (draft) => draft.message?.id === providerMessageId,
      );
      if (match?.id) return { ok: true, value: match.id };
      pageToken = page.value.nextPageToken;
    } while (pageToken);
    return failure(
      'GMAIL_DRAFT_NOT_FOUND',
      'Gmail draft was not found.',
      'provider',
      false,
    );
  }

  public setRead(
    providerMessageId: string,
    read: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    return this.modifyLabels(
      providerMessageId,
      read ? [] : ['UNREAD'],
      read ? ['UNREAD'] : [],
      signal,
    );
  }

  public setStarred(
    providerMessageId: string,
    starred: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    return this.modifyLabels(
      providerMessageId,
      starred ? ['STARRED'] : [],
      starred ? [] : ['STARRED'],
      signal,
    );
  }

  public async moveMessage(
    providerMessageId: string,
    providerFolderId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<{ readonly providerMessageId: string }>> {
    const archive = providerFolderId === '__archive__';
    const result = await this.modifyLabels(
      providerMessageId,
      archive ? [] : [providerFolderId],
      ['INBOX', 'TRASH', 'SPAM'].filter((label) => label !== providerFolderId),
      signal,
    );
    return result.ok ? { ok: true, value: { providerMessageId } } : result;
  }

  public deleteMessage(
    providerMessageId: string,
    permanently: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    return permanently
      ? this.emptyRequest(
          `/users/me/messages/${encodeURIComponent(providerMessageId)}`,
          { method: 'DELETE', signal },
        )
      : this.emptyRequest(
          `/users/me/messages/${encodeURIComponent(providerMessageId)}/trash`,
          { method: 'POST', signal },
        );
  }

  private async modifyLabels(
    providerMessageId: string,
    addLabelIds: readonly string[],
    removeLabelIds: readonly string[],
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    return this.emptyRequest(
      `/users/me/messages/${encodeURIComponent(providerMessageId)}/modify`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ addLabelIds, removeLabelIds }),
        signal,
      },
    );
  }

  private async emptyRequest(
    path: string,
    init: RequestInit,
  ): Promise<MailProviderResult<void>> {
    try {
      const accessToken = await this.accessToken(init.signal ?? undefined);
      await waitForGmailQuota(
        this.config,
        this.account.address,
        gmailQuotaUnits(path, init.method),
        init.signal ?? undefined,
      );
      const response = await fetchWithTimeout(
        `${apiBase(this.config)}${path}`,
        {
          ...init,
          headers: {
            authorization: `Bearer ${accessToken}`,
            ...init.headers,
          },
        },
      );
      return response.ok
        ? { ok: true, value: undefined }
        : { ok: false, error: await responseError('GMAIL', response) };
    } catch (error) {
      return {
        ok: false,
        error: errorResult(error, 'GMAIL_MESSAGE_MUTATION_FAILED'),
      };
    }
  }

  private async request<T>(
    path: string,
    init: RequestInit,
  ): Promise<MailProviderResult<T>> {
    try {
      const accessToken = await this.accessToken(init.signal ?? undefined);
      await waitForGmailQuota(
        this.config,
        this.account.address,
        gmailQuotaUnits(path, init.method),
        init.signal ?? undefined,
      );
      return await gmailRequest<T>(this.config, accessToken, path, init);
    } catch (error) {
      return { ok: false, error: errorResult(error, 'GMAIL_REQUEST_FAILED') };
    }
  }

  private async accessToken(signal?: AbortSignal): Promise<string> {
    const credential =
      await this.context.credentials.getOrRefresh<GmailCredential>(
        this.account.credentialReference,
        (value) => Date.parse(value.expiresAt) > Date.now() + 60_000,
        async (value, refreshSignal) => {
          const refreshed = await exchangeToken(
            this.config,
            {
              client_id: this.config.clientId,
              client_secret: this.config.clientSecret,
              refresh_token: value.refreshToken,
              grant_type: 'refresh_token',
            },
            refreshSignal ?? signal,
          );
          if (!refreshed.ok) throw new ProviderRequestError(refreshed.error);
          return {
            ...value,
            accessToken: required(
              refreshed.value.access_token,
              'Gmail access token',
            ),
            refreshToken: refreshed.value.refresh_token ?? value.refreshToken,
            expiresAt: expiry(refreshed.value.expires_in),
            scopes: splitScopes(refreshed.value.scope, value.scopes),
            tokenType: refreshed.value.token_type ?? value.tokenType,
          };
        },
        signal,
      );
    return credential.accessToken;
  }
}

function gmailBatchUrl(config: GmailMailProviderConfig): string {
  const base = apiBase(config);
  const apiSuffix = '/gmail/v1';
  const root = base.endsWith(apiSuffix)
    ? base.slice(0, -apiSuffix.length)
    : base;
  return `${root}/batch/gmail/v1`;
}

function gmailQuotaUnits(path: string, method = 'GET'): number {
  const normalizedMethod = method.toUpperCase();
  if (/\/watch(?:\?|$)/.test(path)) return 100;
  if (/\/stop(?:\?|$)/.test(path)) return 50;
  if (
    /\/messages\/send(?:\?|$)/.test(path) ||
    /\/drafts\/send(?:\?|$)/.test(path)
  )
    return 100;
  if (/\/messages\/batch(?:Delete|Modify)(?:\?|$)/i.test(path)) return 50;
  if (/\/history(?:\?|$)/.test(path)) return 2;
  if (/\/profile(?:\?|$)/.test(path)) return 1;
  if (/\/messages\/[^/]+\/attachments\//.test(path)) return 20;
  if (/\/messages\/[^/]+\/trash(?:\?|$)/.test(path)) return 20;
  if (/\/messages\/[^/]+\/untrash(?:\?|$)/.test(path)) return 5;
  if (/\/messages\/[^/?]+(?:\?|$)/.test(path) && normalizedMethod === 'DELETE')
    return 10;
  if (/\/messages\/[^/?]+(?:\?|$)/.test(path)) return 20;
  if (/\/messages(?:\?|$)/.test(path)) return 5;
  if (/\/drafts\/[^/?]+/.test(path))
    return normalizedMethod === 'GET'
      ? 20
      : normalizedMethod === 'DELETE'
        ? 10
        : 15;
  if (/\/drafts(?:\?|$)/.test(path)) return normalizedMethod === 'GET' ? 5 : 10;
  if (/\/labels\/[^/?]+/.test(path)) return normalizedMethod === 'GET' ? 1 : 5;
  if (/\/labels(?:\?|$)/.test(path)) return normalizedMethod === 'GET' ? 1 : 5;
  return 5;
}
