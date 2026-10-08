import { incompleteMessage } from '../incomplete-message.js';
import type {
  MailAttachmentContent,
  MailProviderResult,
  MailSyncCursor,
  NormalizedMailAttachment,
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
  NormalizedMailMessage,
} from '../../contracts/provider.js';

import type {
  FolderCursor,
  InitialCursor,
  GraphAttachment,
  GraphFileAttachment,
  GraphFolder,
  GraphMessage,
  GraphPage,
  GraphSubscription,
  GraphUploadSession,
  MicrosoftCredential,
  MicrosoftMailProviderConfig,
  PageNormalizationResult,
} from './types.js';
import {
  MESSAGE_NORMALIZATION_CONCURRENCY,
  MESSAGE_SELECT,
  MICROSOFT_CAPABILITIES,
  SIMPLE_ATTACHMENT_LIMIT,
  UPLOAD_CHUNK_SIZE,
} from './constants.js';
import {
  fetchWithTimeout,
  graphBase,
  graphRequest,
  resolveGraphUrl,
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
import { graphAttachments, graphAttachment, relatedBody } from './content.js';
import {
  graphFolderType,
  graphRecipient,
  normalizeGraphMessage,
} from './normalize.js';
import {
  decodeFolderCursor,
  decodeInitialCursor,
  encode,
  filterReceivedAfter,
  graphCursor,
  invalidSyncCursor,
  parseGraphCursor,
  uniqueStrings,
} from './sync.js';
import { mapConcurrent } from './concurrency.js';
import { exchangeToken, expiry, required, splitScopes } from './auth.js';

export class MicrosoftMailProviderAdapter implements MailProviderAdapter {
  public readonly identity: MailProviderAccount['provider'];
  public readonly capabilities: MailProviderAdapter['capabilities'] =
    MICROSOFT_CAPABILITIES;

  public constructor(
    private readonly context: MailProviderContext,
    private readonly config: MicrosoftMailProviderConfig,
    private readonly account: MailProviderAccount,
  ) {
    this.identity = account.provider;
  }

  public async upsertPushSubscription(
    input: MailProviderUpsertPushSubscriptionInput,
  ): Promise<MailProviderResult<MailProviderUpsertPushSubscriptionResult>> {
    const expirationDateTime = new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    let fallbackSubscriptionId = input.providerSubscriptionId;
    let result = input.providerSubscriptionId
      ? await this.request<GraphSubscription>(
          `/subscriptions/${encodeURIComponent(input.providerSubscriptionId)}`,
          {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ expirationDateTime }),
            signal: input.signal,
          },
        )
      : undefined;
    if (
      !result ||
      (!result.ok &&
        ['MICROSOFT_HTTP_404', 'MICROSOFT_HTTP_410'].includes(
          result.error.code,
        ))
    ) {
      fallbackSubscriptionId = undefined;
      result = await this.request<GraphSubscription>('/subscriptions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          changeType: 'created,updated,deleted',
          notificationUrl: input.notificationUrl,
          resource: 'me/messages',
          expirationDateTime,
          clientState: input.clientState,
          latestSupportedTlsVersion: 'v1_2',
        }),
        signal: input.signal,
      });
    }
    if (!result.ok) return result;
    const id = result.value.id ?? fallbackSubscriptionId;
    const expiresAt = result.value.expirationDateTime ?? expirationDateTime;
    if (!id || Number.isNaN(Date.parse(expiresAt))) {
      return failure(
        'MICROSOFT_PUSH_SUBSCRIPTION_INVALID',
        'Microsoft Graph did not return a valid push subscription.',
        'provider',
        false,
      );
    }
    return {
      ok: true,
      value: {
        providerSubscriptionId: id,
        renewAfter: new Date(
          Date.parse(expiresAt) - 12 * 60 * 60 * 1000,
        ).toISOString(),
        expiresAt,
      },
    };
  }

  public async deletePushSubscription(
    providerSubscriptionId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    try {
      const resolvedUrl = resolveGraphUrl(
        this.config,
        `/subscriptions/${encodeURIComponent(providerSubscriptionId)}`,
      );
      if (!resolvedUrl.ok) return resolvedUrl;
      const response = await fetchWithTimeout(resolvedUrl.value, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${await this.accessToken(signal)}`,
          accept: 'application/json',
        },
        signal,
      });
      return response.ok || [404, 410].includes(response.status)
        ? { ok: true, value: undefined }
        : { ok: false, error: await responseError(response) };
    } catch (error) {
      return {
        ok: false,
        error: errorResult(error, 'MICROSOFT_PUSH_DELETE_FAILED'),
      };
    }
  }

  public getCurrentSyncCursor(): Promise<MailProviderResult<MailSyncCursor>> {
    return Promise.resolve({
      ok: true,
      value: graphCursor({ checkpoints: {}, folders: [] }),
    });
  }

  public async listFolders(
    input: MailProviderListFoldersInput,
  ): Promise<MailProviderResult<MailProviderFolderPage>> {
    const decoded = input.cursor ? decodeFolderCursor(input.cursor) : undefined;
    if (input.cursor && !decoded) return invalidSyncCursor();
    const cursor: FolderCursor = decoded ?? {
      pending: ['/me/mailFolders?includeHiddenFolders=true&$top=100'],
      providerFolderIds: [],
    };
    const [url, ...remaining] = cursor.pending;
    if (!url) {
      return {
        ok: true,
        value: {
          folders: [],
          completeProviderFolderIds: cursor.providerFolderIds,
        },
      };
    }
    const page = await this.request<GraphPage<GraphFolder>>(url, {
      signal: input.signal,
    });
    if (!page.ok) return page;
    const folders = (page.value.value ?? []).map((folder) => ({
      providerFolderId: required(folder.id, 'Microsoft folder ID'),
      type: graphFolderType(folder.displayName, folder.wellKnownName),
      name: folder.displayName ?? '',
      unreadCount: folder.unreadItemCount,
      kind: 'folder' as const,
    }));
    const childUrls = (page.value.value ?? []).flatMap((folder) =>
      (folder.childFolderCount ?? 0) > 0 && folder.id
        ? [
            `/me/mailFolders/${encodeURIComponent(folder.id)}/childFolders?includeHiddenFolders=true&$top=100`,
          ]
        : [],
    );
    const pending = [
      ...(page.value['@odata.nextLink'] ? [page.value['@odata.nextLink']] : []),
      ...remaining,
      ...childUrls,
    ];
    const providerFolderIds = uniqueStrings([
      ...cursor.providerFolderIds,
      ...folders.map((folder) => folder.providerFolderId),
    ]);
    return {
      ok: true,
      value: {
        folders,
        nextCursor:
          pending.length > 0
            ? encode({ pending, providerFolderIds } satisfies FolderCursor)
            : undefined,
        completeProviderFolderIds:
          pending.length === 0 ? providerFolderIds : undefined,
      },
    };
  }

  public reconcileSyncCursor(
    syncCursor: MailSyncCursor | undefined,
    providerFolderIds: readonly string[],
  ): MailProviderResult<MailSyncCursor> {
    const cursor = parseGraphCursor(syncCursor);
    if (!cursor && syncCursor) {
      return failure(
        'MICROSOFT_SYNC_CURSOR_INVALID',
        'Microsoft sync cursor is invalid.',
        'provider',
        false,
      );
    }
    const folders = uniqueStrings(providerFolderIds);
    const checkpoints = Object.fromEntries(
      Object.entries(cursor?.checkpoints ?? {}).filter(([folderId]) =>
        folders.includes(folderId),
      ),
    );
    return {
      ok: true,
      value: graphCursor({
        checkpoints,
        folders,
        folderIndex: 0,
      }),
    };
  }

  public async listMessages(
    input: MailProviderListMessagesInput,
  ): Promise<MailProviderResult<MailProviderMessagePage>> {
    let cursor: InitialCursor | undefined;
    if (input.cursor) {
      cursor = decodeInitialCursor(input.cursor);
      if (!cursor) return invalidSyncCursor();
    } else {
      let folders = input.providerFolderIds ?? [];
      if (folders.length === 0) {
        const discovered = await this.listFolders({
          limit: input.limit ?? 100,
          signal: input.signal,
        });
        if (!discovered.ok) return discovered;
        if (discovered.value.nextCursor)
          return failure(
            'MICROSOFT_FOLDER_SCOPE_REQUIRED',
            'Microsoft initial sync requires the complete discovered folder scope.',
            'configuration',
            false,
          );
        folders = discovered.value.completeProviderFolderIds ?? [];
      }
      if (folders.length === 0)
        return failure(
          'MICROSOFT_FOLDER_SCOPE_REQUIRED',
          'Microsoft initial sync requires a discovered folder scope.',
          'configuration',
          false,
        );
      const baseline = parseGraphCursor(input.baselineCursor);
      cursor = {
        phase: 'baseline',
        folders,
        folderIndex: 0,
        checkpoints: baseline?.checkpoints ?? {},
        receivedAfter: input.receivedAfter,
      };
    }
    if (cursor.phase === 'baseline') {
      if (cursor.folderIndex >= cursor.folders.length) {
        return {
          ok: true,
          value: {
            historyReady: false,
            messages: [],
            nextCursor: encode({
              ...cursor,
              phase: 'history',
              folderIndex: 0,
            } satisfies InitialCursor),
            syncCursor: graphCursor({
              checkpoints: cursor.checkpoints,
              folders: cursor.folders,
            }),
          },
        };
      }
      const folderId = cursor.folders[cursor.folderIndex];
      const page = await this.request<GraphPage<GraphMessage>>(
        cursor.nextLink ?? this.latestDeltaUrl(folderId),
        { signal: input.signal },
      );
      if (!page.ok)
        return page.error.code === 'MICROSOFT_HTTP_410'
          ? invalidSyncCursor()
          : page;
      const nextLink = page.value['@odata.nextLink'];
      if (nextLink) {
        return {
          ok: true,
          value: {
            historyReady: false,
            messages: [],
            nextCursor: encode({
              ...cursor,
              nextLink,
            } satisfies InitialCursor),
            syncCursor: graphCursor({
              checkpoints: cursor.checkpoints,
              folders: cursor.folders,
            }),
          },
        };
      }
      const deltaLink = page.value['@odata.deltaLink'];
      if (!deltaLink)
        return failure(
          'MICROSOFT_DELTA_LINK_MISSING',
          'Microsoft latest delta response did not include a checkpoint.',
          'provider',
          false,
        );
      const checkpoints = {
        ...cursor.checkpoints,
        [folderId]: deltaLink,
      };
      const folderIndex = cursor.folderIndex + 1;
      return {
        ok: true,
        value: {
          historyReady: false,
          messages: [],
          nextCursor: encode({
            phase:
              folderIndex >= cursor.folders.length ? 'history' : 'baseline',
            folderIndex: folderIndex >= cursor.folders.length ? 0 : folderIndex,
            folders: cursor.folders,
            checkpoints,
            ...(cursor.receivedAfter
              ? { receivedAfter: cursor.receivedAfter }
              : {}),
          } satisfies InitialCursor),
          syncCursor: graphCursor({ checkpoints, folders: cursor.folders }),
        },
      };
    }
    if (cursor.folderIndex >= cursor.folders.length) {
      return {
        ok: true,
        value: {
          historyReady: false,
          messages: [],
          syncCursor: graphCursor({
            checkpoints: cursor.checkpoints,
            folders: cursor.folders,
          }),
        },
      };
    }
    const folderId = cursor.folders[cursor.folderIndex];
    const url =
      cursor.nextLink ??
      this.messageListUrl(folderId, input.limit ?? 100, input.receivedAfter);
    const page = await this.request<GraphPage<GraphMessage>>(url, {
      signal: input.signal,
    });
    if (!page.ok)
      return page.error.code === 'MICROSOFT_HTTP_410'
        ? invalidSyncCursor()
        : page;
    const normalized = await this.normalizePage(
      page.value.value ?? [],
      input.signal,
    );
    if (!normalized.ok) return normalized;
    const messages = filterReceivedAfter(
      normalized.value.messages,
      cursor.receivedAfter,
    );
    const checkpoints = { ...cursor.checkpoints };
    let folderIndex = cursor.folderIndex;
    const nextLink = page.value['@odata.nextLink'];
    if (!nextLink) {
      folderIndex += 1;
    }
    const finished = folderIndex >= cursor.folders.length && !nextLink;
    return {
      ok: true,
      value: {
        messages,
        nextCursor: finished
          ? undefined
          : encode({
              folders: cursor.folders,
              phase: 'history',
              folderIndex,
              checkpoints,
              receivedAfter: cursor.receivedAfter,
              ...(nextLink ? { nextLink } : {}),
            }),
        syncCursor: graphCursor({
          checkpoints,
          folders: cursor.folders,
          folderIndex: 0,
        }),
      },
    };
  }

  public async listChanges(
    input: MailProviderListChangesInput,
  ): Promise<MailProviderResult<MailProviderChangePage>> {
    const cursor = parseGraphCursor(input.cursor);
    if (!cursor)
      return failure(
        'MICROSOFT_SYNC_CURSOR_INVALID',
        'Microsoft sync cursor is invalid.',
        'provider',
        false,
      );
    const folders = cursor.folders ?? Object.keys(cursor.checkpoints);
    if (folders.length === 0) {
      return {
        ok: true,
        value: {
          messages: [],
          deletedProviderMessageIds: [],
          nextCursor: graphCursor(cursor),
          hasMore: false,
        },
      };
    }
    const index = cursor.folderIndex ?? 0;
    if (index >= folders.length) {
      return {
        ok: true,
        value: {
          messages: [],
          deletedProviderMessageIds: [],
          nextCursor: graphCursor({ checkpoints: cursor.checkpoints, folders }),
          hasMore: false,
        },
      };
    }
    const folderId = folders[index];
    const requestUrl =
      cursor.nextLink ??
      cursor.checkpoints[folderId] ??
      this.deltaUrl(folderId, input.limit);
    if (!requestUrl) {
      return failure(
        'MICROSOFT_SYNC_CURSOR_INVALID',
        'Microsoft sync cursor does not contain a folder checkpoint.',
        'provider',
        false,
      );
    }
    const page = await this.request<GraphPage<GraphMessage>>(requestUrl, {
      signal: input.signal,
    });
    if (!page.ok)
      return page.error.code === 'MICROSOFT_HTTP_410'
        ? failure(
            'MICROSOFT_SYNC_CURSOR_INVALID',
            'Microsoft delta cursor expired; a new initial sync is required.',
            'provider',
            false,
          )
        : page;
    const normalized = await this.normalizePage(
      page.value.value ?? [],
      input.signal,
    );
    if (!normalized.ok) return normalized;
    const checkpoints = { ...cursor.checkpoints };
    const nextLink = page.value['@odata.nextLink'];
    let nextIndex = index;
    if (!nextLink) {
      const deltaLink = page.value['@odata.deltaLink'];
      if (!deltaLink)
        return failure(
          'MICROSOFT_DELTA_LINK_MISSING',
          'Microsoft delta response did not include a checkpoint.',
          'provider',
          false,
        );
      checkpoints[folderId] = deltaLink;
      nextIndex += 1;
    }
    const hasMore = Boolean(nextLink) || nextIndex < folders.length;
    return {
      ok: true,
      value: {
        messages: normalized.value.messages,
        deletedProviderMessageIds: normalized.value.deletedProviderMessageIds,
        nextCursor: graphCursor({
          checkpoints,
          folders,
          ...(hasMore
            ? {
                folderIndex: nextIndex,
                ...(nextLink ? { nextLink } : {}),
              }
            : {}),
        }),
        hasMore,
      },
    };
  }

  public async getMessage(
    providerMessageId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<NormalizedMailMessage>> {
    const result = await this.request<GraphMessage>(
      `/me/messages/${encodeURIComponent(providerMessageId)}?$select=${MESSAGE_SELECT}`,
      { signal },
    );
    if (!result.ok) return result;
    const attachments =
      result.value.hasAttachments ||
      /cid:/iu.test(result.value.body?.content ?? '')
        ? await this.attachments(providerMessageId, signal)
        : {
            ok: true as const,
            value: [] as readonly NormalizedMailAttachment[],
          };
    if (!attachments.ok) return attachments;
    return normalizeGraphMessage(result.value, attachments.value);
  }

  public async getAttachment(
    providerMessageId: string,
    providerAttachmentId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<MailAttachmentContent>> {
    const result = await this.request<GraphAttachment>(
      `/me/messages/${encodeURIComponent(providerMessageId)}/attachments/${encodeURIComponent(providerAttachmentId)}`,
      { signal },
    );
    if (!result.ok) return result;
    const bytes = Buffer.from(result.value.contentBytes ?? '', 'base64');
    return {
      ok: true,
      value: {
        fileName: result.value.name ?? providerAttachmentId,
        contentType: result.value.contentType ?? 'application/octet-stream',
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
    let token: string;
    try {
      token = await this.accessToken(input.signal);
    } catch (error) {
      return {
        status: 'failed',
        error: errorResult(error, 'MICROSOFT_AUTHORIZATION_FAILED'),
      };
    }
    try {
      if (input.message.draftProviderMessageId) {
        try {
          const updated = await this.updateDraft(
            input.message.draftProviderMessageId,
            input,
          );
          if (!updated.ok) return { status: 'failed', error: updated.error };
        } catch (error) {
          return {
            status: 'failed',
            error: contentPreparationError(
              error,
              'MICROSOFT_MESSAGE_PREPARATION_FAILED',
            ),
          };
        }
        const sent = await fetchWithTimeout(
          `${graphBase(this.config)}/me/messages/${encodeURIComponent(input.message.draftProviderMessageId)}/send`,
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${token}`,
              'client-request-id': input.trackingId,
            },
            signal: input.signal,
          },
        );
        return sent.ok
          ? {
              status: 'accepted',
              providerMessageId: input.message.draftProviderMessageId,
            }
          : submissionResponse(sent);
      }
      if (
        input.message.replyToProviderMessageId ||
        input.message.forwardOfProviderMessageId
      ) {
        return await this.sendRelatedMessage(token, input);
      }
      if (
        input.message.attachments.reduce(
          (total, attachment) => total + attachment.size,
          0,
        ) >= SIMPLE_ATTACHMENT_LIMIT
      ) {
        let draft: MailProviderResult<NormalizedMailMessage>;
        try {
          draft = await this.saveDraft(input);
        } catch (error) {
          return {
            status: 'failed',
            error: contentPreparationError(
              error,
              'MICROSOFT_MESSAGE_PREPARATION_FAILED',
            ),
          };
        }
        if (!draft.ok) return { status: 'failed', error: draft.error };
        const draftId = draft.value.providerMessageId;
        const sent = await fetchWithTimeout(
          `${graphBase(this.config)}/me/messages/${encodeURIComponent(draftId)}/send`,
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${token}`,
              'client-request-id': input.trackingId,
            },
            signal: input.signal,
          },
        );
        return sent.ok
          ? { status: 'accepted', providerMessageId: draftId }
          : submissionResponse(sent);
      }
      let attachments: readonly GraphFileAttachment[];
      try {
        attachments = await graphAttachments(input);
      } catch (error) {
        return {
          status: 'failed',
          error: contentPreparationError(
            error,
            'MICROSOFT_MESSAGE_PREPARATION_FAILED',
          ),
        };
      }
      const response = await fetchWithTimeout(
        `${graphBase(this.config)}/me/sendMail`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
            Prefer: 'IdType="ImmutableId"',
            'client-request-id': input.trackingId,
          },
          body: JSON.stringify({
            message: {
              subject: input.message.subject,
              from: graphRecipient(input.identity),
              body: {
                contentType: input.message.html ? 'HTML' : 'Text',
                content: input.message.html ?? input.message.text,
              },
              toRecipients: input.message.to.map(graphRecipient),
              ccRecipients: input.message.cc.map(graphRecipient),
              bccRecipients: input.message.bcc.map(graphRecipient),
              attachments,
            },
            saveToSentItems: true,
          }),
          signal: input.signal,
        },
      );
      return response.ok
        ? { status: 'accepted' }
        : submissionResponse(response);
    } catch (error) {
      return {
        status: 'submission_unknown',
        error: unknownError(error, 'MICROSOFT_SEND_RESULT_UNKNOWN'),
      };
    }
  }

  public async saveDraft(
    input: MailProviderSendInput,
  ): Promise<MailProviderResult<NormalizedMailMessage>> {
    if (
      input.message.replyToProviderMessageId ||
      input.message.forwardOfProviderMessageId
    ) {
      return this.saveRelatedDraft(input);
    }
    const result = await this.request<GraphMessage>('/me/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'client-request-id': input.trackingId,
      },
      body: JSON.stringify({
        subject: input.message.subject,
        from: graphRecipient(input.identity),
        body: {
          contentType: input.message.html ? 'HTML' : 'Text',
          content: input.message.html ?? input.message.text,
        },
        toRecipients: input.message.to.map(graphRecipient),
        ccRecipients: input.message.cc.map(graphRecipient),
        bccRecipients: input.message.bcc.map(graphRecipient),
      }),
      signal: input.signal,
    });
    if (!result.ok) return result;
    const providerMessageId = required(
      result.value.id,
      'Microsoft draft message ID',
    );
    for (const attachment of input.message.attachments) {
      const added = await this.addAttachment(
        providerMessageId,
        attachment,
        input.trackingId,
        input.signal,
      );
      if (!added.ok) return added;
    }
    const attachments = input.message.attachments.length
      ? await this.attachments(providerMessageId, input.signal)
      : { ok: true as const, value: [] as readonly NormalizedMailAttachment[] };
    if (!attachments.ok) return attachments;
    return normalizeGraphMessage(
      {
        ...result.value,
        isDraft: true,
        parentFolderId: result.value.parentFolderId ?? 'drafts',
      },
      attachments.value,
    );
  }

  public async updateDraft(
    providerMessageId: string,
    input: MailProviderSendInput,
  ): Promise<MailProviderResult<NormalizedMailMessage>> {
    const result = await this.request<GraphMessage>(
      `/me/messages/${encodeURIComponent(providerMessageId)}`,
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'client-request-id': input.trackingId,
        },
        body: JSON.stringify({
          subject: input.message.subject,
          from: graphRecipient(input.identity),
          body: {
            contentType: input.message.html ? 'HTML' : 'Text',
            content: input.message.html ?? input.message.text,
          },
          toRecipients: input.message.to.map(graphRecipient),
          ccRecipients: input.message.cc.map(graphRecipient),
          bccRecipients: input.message.bcc.map(graphRecipient),
        }),
        signal: input.signal,
      },
    );
    if (!result.ok) return result;
    const shouldUpdateAttachments =
      input.message.retainedProviderAttachmentIds !== undefined ||
      input.message.attachments.length > 0;
    const existingAttachments = shouldUpdateAttachments
      ? await this.attachments(providerMessageId, input.signal)
      : { ok: true as const, value: [] as readonly NormalizedMailAttachment[] };
    if (!existingAttachments.ok) return existingAttachments;
    const retained = new Set(
      input.message.retainedProviderAttachmentIds ??
        existingAttachments.value.map(
          (attachment) => attachment.providerAttachmentId,
        ),
    );
    for (const attachment of existingAttachments.value) {
      if (retained.has(attachment.providerAttachmentId)) continue;
      const removed = await this.deleteDraftAttachment(
        providerMessageId,
        attachment.providerAttachmentId,
        input.signal,
      );
      if (!removed.ok) return removed;
    }
    for (const attachment of input.message.attachments) {
      const added = await this.addAttachment(
        providerMessageId,
        attachment,
        input.trackingId,
        input.signal,
      );
      if (!added.ok) return added;
    }
    const attachments = shouldUpdateAttachments
      ? await this.attachments(providerMessageId, input.signal)
      : { ok: true as const, value: [] as readonly NormalizedMailAttachment[] };
    if (!attachments.ok) return attachments;
    return normalizeGraphMessage(
      {
        ...result.value,
        id: result.value.id ?? providerMessageId,
        isDraft: true,
        parentFolderId: result.value.parentFolderId ?? 'drafts',
        from: graphRecipient(input.identity),
        toRecipients: input.message.to.map(graphRecipient),
        ccRecipients: input.message.cc.map(graphRecipient),
        bccRecipients: input.message.bcc.map(graphRecipient),
        subject: input.message.subject,
        body: {
          contentType: input.message.html ? 'HTML' : 'Text',
          content: input.message.html ?? input.message.text,
        },
      },
      attachments.value,
    );
  }

  public setRead(
    providerMessageId: string,
    read: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    return this.updateMessage(providerMessageId, { isRead: read }, signal);
  }

  public setStarred(
    providerMessageId: string,
    starred: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    return this.updateMessage(
      providerMessageId,
      { flag: { flagStatus: starred ? 'flagged' : 'notFlagged' } },
      signal,
    );
  }

  public async moveMessage(
    providerMessageId: string,
    providerFolderId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<{ readonly providerMessageId: string }>> {
    const result = await this.request<GraphMessage>(
      `/me/messages/${encodeURIComponent(providerMessageId)}/move`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ destinationId: providerFolderId }),
        signal,
      },
    );
    return result.ok
      ? {
          ok: true,
          value: {
            providerMessageId: required(
              result.value.id,
              'Microsoft moved message ID',
            ),
          },
        }
      : result;
  }

  public async deleteMessage(
    providerMessageId: string,
    permanently: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    if (!permanently) {
      const moved = await this.moveMessage(
        providerMessageId,
        'deleteditems',
        signal,
      );
      return moved.ok ? { ok: true, value: undefined } : moved;
    }
    let token: string;
    try {
      token = await this.accessToken(signal);
    } catch (error) {
      return {
        ok: false,
        error: errorResult(error, 'MICROSOFT_AUTHORIZATION_FAILED'),
      };
    }
    try {
      const response = await fetchWithTimeout(
        `${graphBase(this.config)}/me/messages/${encodeURIComponent(providerMessageId)}`,
        {
          method: 'DELETE',
          headers: {
            authorization: `Bearer ${token}`,
            Prefer: 'IdType="ImmutableId"',
          },
          signal,
        },
      );
      return response.ok
        ? { ok: true, value: undefined }
        : { ok: false, error: await responseError(response) };
    } catch (error) {
      return {
        ok: false,
        error: errorResult(error, 'MICROSOFT_MESSAGE_DELETE_FAILED'),
      };
    }
  }

  private async updateMessage(
    providerMessageId: string,
    patch: Readonly<Record<string, unknown>>,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    const result = await this.request<GraphMessage>(
      `/me/messages/${encodeURIComponent(providerMessageId)}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
        signal,
      },
    );
    return result.ok ? { ok: true, value: undefined } : result;
  }

  private async sendRelatedMessage(
    token: string,
    input: MailProviderSendInput,
  ): Promise<MailProviderSendResult> {
    let prepared: MailProviderResult<NormalizedMailMessage>;
    try {
      prepared = await this.saveRelatedDraft(input);
    } catch (error) {
      return {
        status: 'failed',
        error: contentPreparationError(
          error,
          'MICROSOFT_MESSAGE_PREPARATION_FAILED',
        ),
      };
    }
    if (!prepared.ok) return { status: 'failed', error: prepared.error };
    const draftId = prepared.value.providerMessageId;
    const sent = await fetchWithTimeout(
      `${graphBase(this.config)}/me/messages/${encodeURIComponent(draftId)}/send`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'client-request-id': input.trackingId,
        },
        signal: input.signal,
      },
    );
    return sent.ok
      ? { status: 'accepted', providerMessageId: draftId }
      : submissionResponse(sent);
  }

  private async saveRelatedDraft(
    input: MailProviderSendInput,
  ): Promise<MailProviderResult<NormalizedMailMessage>> {
    const sourceId =
      input.message.replyToProviderMessageId ??
      input.message.forwardOfProviderMessageId;
    const action = input.message.replyToProviderMessageId
      ? 'createReply'
      : 'createForward';
    const created = await this.request<GraphMessage>(
      `/me/messages/${encodeURIComponent(required(sourceId, 'Microsoft related message ID'))}/${action}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'client-request-id': input.trackingId,
        },
        body: '{}',
        signal: input.signal,
      },
    );
    if (!created.ok) return created;
    const draft = created.value;
    const draftId = required(draft.id, 'Microsoft reply or forward draft ID');
    const updated = await this.request<GraphMessage>(
      `/me/messages/${encodeURIComponent(draftId)}`,
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'client-request-id': input.trackingId,
        },
        body: JSON.stringify({
          subject: input.message.subject,
          from: graphRecipient(input.identity),
          body: relatedBody(input, draft),
          toRecipients: input.message.to.map(graphRecipient),
          ccRecipients: input.message.cc.map(graphRecipient),
          bccRecipients: input.message.bcc.map(graphRecipient),
        }),
        signal: input.signal,
      },
    );
    if (!updated.ok) return updated;
    for (const attachment of input.message.attachments) {
      const added = await this.addAttachment(
        draftId,
        attachment,
        input.trackingId,
        input.signal,
      );
      if (!added.ok) return added;
    }
    const attachments =
      input.message.forwardOfProviderMessageId ||
      input.message.attachments.length > 0
        ? await this.attachments(draftId, input.signal)
        : {
            ok: true as const,
            value: [] as readonly NormalizedMailAttachment[],
          };
    if (!attachments.ok) return attachments;
    return normalizeGraphMessage(
      {
        ...draft,
        ...updated.value,
        id: draftId,
        isDraft: true,
        parentFolderId: updated.value.parentFolderId ?? 'drafts',
        from: graphRecipient(input.identity),
        toRecipients: input.message.to.map(graphRecipient),
        ccRecipients: input.message.cc.map(graphRecipient),
        bccRecipients: input.message.bcc.map(graphRecipient),
        subject: input.message.subject,
        body: relatedBody(input, draft),
      },
      attachments.value,
    );
  }

  private async deleteDraftAttachment(
    providerMessageId: string,
    providerAttachmentId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    try {
      const response = await fetchWithTimeout(
        `${graphBase(this.config)}/me/messages/${encodeURIComponent(providerMessageId)}/attachments/${encodeURIComponent(providerAttachmentId)}`,
        {
          method: 'DELETE',
          headers: {
            authorization: `Bearer ${await this.accessToken(signal)}`,
            Prefer: 'IdType="ImmutableId"',
          },
          signal,
        },
      );
      return response.ok
        ? { ok: true, value: undefined }
        : { ok: false, error: await responseError(response) };
    } catch (error) {
      return {
        ok: false,
        error: errorResult(error, 'MICROSOFT_ATTACHMENT_DELETE_FAILED'),
      };
    }
  }

  private async addAttachment(
    providerMessageId: string,
    attachment: MailProviderSendInput['message']['attachments'][number],
    trackingId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    try {
      const stream = await attachment.open();
      const bytes = Buffer.from(await new Response(stream).arrayBuffer());
      if (bytes.byteLength !== attachment.size) {
        throw new Error('Mail attachment size changed before submission.');
      }
      if (bytes.byteLength < SIMPLE_ATTACHMENT_LIMIT) {
        const added = await this.request<GraphAttachment>(
          `/me/messages/${encodeURIComponent(providerMessageId)}/attachments`,
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'client-request-id': trackingId,
            },
            body: JSON.stringify(graphAttachment(attachment, bytes)),
            signal,
          },
        );
        return added.ok ? { ok: true, value: undefined } : added;
      }
      const session = await this.request<GraphUploadSession>(
        `/me/messages/${encodeURIComponent(providerMessageId)}/attachments/createUploadSession`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'client-request-id': trackingId,
          },
          body: JSON.stringify({
            AttachmentItem: {
              attachmentType: 'file',
              name: attachment.fileName,
              size: attachment.size,
              contentType: attachment.contentType,
              isInline: attachment.inline,
              ...(attachment.contentId
                ? { contentId: attachment.contentId }
                : {}),
            },
          }),
          signal,
        },
      );
      if (!session.ok) return session;
      const uploadUrl = required(
        session.value.uploadUrl,
        'Microsoft attachment upload URL',
      );
      if (new URL(uploadUrl).protocol !== 'https:') {
        throw new Error('Microsoft attachment upload URL must use HTTPS.');
      }
      for (
        let start = 0;
        start < bytes.byteLength;
        start += UPLOAD_CHUNK_SIZE
      ) {
        const end = Math.min(start + UPLOAD_CHUNK_SIZE, bytes.byteLength);
        const response = await fetchWithTimeout(uploadUrl, {
          method: 'PUT',
          headers: {
            'content-length': String(end - start),
            'content-range': `bytes ${start}-${end - 1}/${bytes.byteLength}`,
          },
          body: bytes.subarray(start, end),
          signal,
        });
        if (!response.ok) {
          return { ok: false, error: await responseError(response) };
        }
      }
      return { ok: true, value: undefined };
    } catch (error) {
      return {
        ok: false,
        error: errorResult(error, 'MICROSOFT_ATTACHMENT_UPLOAD_FAILED'),
      };
    }
  }

  private async normalizePage(
    messages: readonly GraphMessage[],
    signal?: AbortSignal,
  ): Promise<
    MailProviderResult<{
      readonly messages: readonly NormalizedMailMessage[];
      readonly deletedProviderMessageIds: readonly string[];
    }>
  > {
    const results = await mapConcurrent(
      messages,
      MESSAGE_NORMALIZATION_CONCURRENCY,
      async (message): Promise<PageNormalizationResult> => {
        try {
          if (message['@removed']) {
            if (!message.id) return {};
            const current = await this.getMessage(message.id, signal);
            if (current.ok) {
              return { message: current.value };
            } else if (current.error.code === 'MICROSOFT_HTTP_404') {
              return { deletedProviderMessageId: message.id };
            } else {
              return { error: current.error };
            }
          }
          const attachments =
            (message.hasAttachments ||
              /cid:/iu.test(message.body?.content ?? '')) &&
            message.id
              ? await this.attachments(message.id, signal)
              : {
                  ok: true as const,
                  value: [] as readonly NormalizedMailAttachment[],
                };
          if (!attachments.ok) {
            if (attachments.error.category !== 'content' || !message.id)
              return { error: attachments.error };
            const metadata = normalizeGraphMessage(message, []);
            return metadata.ok
              ? {
                  message: incompleteMessage(
                    message.id,
                    attachments.error.code,
                    metadata.value,
                  ),
                }
              : { error: metadata.error };
          }
          const result = normalizeGraphMessage(message, attachments.value);
          return result.ok
            ? { message: result.value }
            : { error: result.error };
        } catch (error) {
          if (signal?.aborted) throw error;
          if (!message.id)
            return {
              error: {
                code: 'MICROSOFT_MESSAGE_INVALID',
                message: 'Message identity is missing.',
                category: 'provider',
                retryable: false,
              },
            };
          return {
            message: incompleteMessage(message.id, 'MAIL_CONTENT_INVALID', {
              providerFolderIds: message.parentFolderId
                ? [message.parentFolderId]
                : [],
              receivedAt: message.receivedDateTime,
              subject:
                typeof message.subject === 'string' ? message.subject : '',
            }),
          };
        }
      },
    );
    const normalized: NormalizedMailMessage[] = [];
    const deleted: string[] = [];
    for (const result of results) {
      if (result.error) return { ok: false, error: result.error };
      if (result.message) normalized.push(result.message);
      if (result.deletedProviderMessageId) {
        deleted.push(result.deletedProviderMessageId);
      }
    }
    return {
      ok: true,
      value: {
        messages: normalized,
        deletedProviderMessageIds: deleted,
      },
    };
  }

  private async attachments(
    messageId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<readonly NormalizedMailAttachment[]>> {
    // contentId belongs to fileAttachment, not the attachment base type.
    const result = await this.request<GraphPage<GraphAttachment>>(
      `/me/messages/${encodeURIComponent(messageId)}/attachments?$select=id,name,contentType,size,isInline,microsoft.graph.fileAttachment/contentId`,
      { signal },
    );
    if (!result.ok) return result;
    return {
      ok: true,
      value: (result.value.value ?? []).flatMap((item) =>
        item.id
          ? [
              {
                providerAttachmentId: item.id,
                fileName: item.name ?? '',
                contentType: item.contentType ?? 'application/octet-stream',
                size: item.size ?? 0,
                contentId: item.contentId,
                inline: item.isInline ?? false,
              },
            ]
          : [],
      ),
    };
  }

  private deltaUrl(
    folderId: string,
    limit: number,
    _receivedAfter?: string,
  ): string {
    const query = new URLSearchParams({
      $select: MESSAGE_SELECT,
      $top: String(Math.min(limit, 500)),
      $orderby: 'receivedDateTime desc',
    });
    return `/me/mailFolders/${encodeURIComponent(folderId)}/messages/delta?${query.toString()}`;
  }

  private latestDeltaUrl(folderId: string): string {
    const query = new URLSearchParams({ $deltatoken: 'latest' });
    return `/me/mailFolders/${encodeURIComponent(folderId)}/messages/delta?${query.toString()}`;
  }

  private messageListUrl(
    folderId: string,
    limit: number,
    receivedAfter?: string,
  ): string {
    const query = new URLSearchParams({
      $select: MESSAGE_SELECT,
      $top: String(Math.min(limit, 500)),
      $orderby: 'receivedDateTime desc',
    });
    if (receivedAfter) {
      query.set('$filter', `receivedDateTime ge ${receivedAfter}`);
    }
    return `/me/mailFolders/${encodeURIComponent(folderId)}/messages?${query.toString()}`;
  }

  private async request<T>(
    pathOrUrl: string,
    init: RequestInit,
  ): Promise<MailProviderResult<T>> {
    try {
      return await graphRequest<T>(
        this.config,
        await this.accessToken(init.signal ?? undefined),
        pathOrUrl,
        init,
      );
    } catch (error) {
      return {
        ok: false,
        error: errorResult(error, 'MICROSOFT_REQUEST_FAILED'),
      };
    }
  }

  private async accessToken(signal?: AbortSignal): Promise<string> {
    const credential =
      await this.context.credentials.getOrRefresh<MicrosoftCredential>(
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
              scope: value.scopes.join(' '),
            },
            refreshSignal ?? signal,
          );
          if (!refreshed.ok) throw new ProviderRequestError(refreshed.error);
          return {
            ...value,
            accessToken: required(
              refreshed.value.access_token,
              'Microsoft access token',
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
