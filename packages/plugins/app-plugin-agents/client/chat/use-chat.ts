/**
 * The chat's data: the agents the viewer may chat with, a conversation and its messages kept current (the per-user
 * realtime topic says what changed, then the page fetches `messages?after=<lastSeq>`; while a run is open it also
 * polls, since announcements reach only browsers on the instance that made the change), the viewer's conversations,
 * and the writes on a conversation. Each write toasts its failure; the list refetches after each one.
 *
 * Every hook reads and writes this plugin's cache (`agentsQueryClient()`) and words its toasts in this plugin's
 * namespace, whichever `QueryClientProvider` and namespace are above it, so an application's own chat UI needs only
 * `ChatProvider`.
 */
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useSyncExternalStore,
  type Dispatch,
} from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  CONVERSATIONS_TOPIC,
  type ChatAgent,
  type ConversationChanged,
  type ConversationDetail,
  type ConversationListQuery,
  type ConversationPage,
  type ConversationSource,
  type MessageAttachment,
  type PageContext,
} from '../../shared/conversations.js';
import { useRealtimeTopic } from '../hooks/use-realtime-topic.js';
import { errorText } from '../hooks/use-notify.js';
import { agentsQueryClient } from '../query.js';
import {
  useChatController,
  useChatStream,
  useChatStreamState,
} from './controller.js';
import { ChatApi } from './api.js';
import { chatKeys } from './keys.js';
import {
  EMPTY_MESSAGES,
  messagesReducer,
  type MessagesAction,
  type MessagesState,
} from './message-model.js';

/** How often an open conversation with a run is fetched when no announcement comes. */
export const CHAT_POLL_MS = 5000;
/** How often while an online agent's reply is being written, so it grows even without announcements. */
export const CHAT_STREAM_POLL_MS = 1000;

export function useChatApi(): ChatApi {
  const api = useApiClient();
  return useMemo(() => new ChatApi(api), [api]);
}

/** A conversation's data must never stand in for another one's (the default keeps the previous key's data). */
function noPlaceholder(): undefined {
  return undefined;
}

function notRetriedOnClientErrors(count: number, error: Error): boolean {
  return !(error instanceof ApiClientError && error.status < 500) && count < 1;
}

export function isChatPayload(
  payload: unknown,
): payload is ConversationChanged {
  if (!payload || typeof payload !== 'object') return false;
  const kind = (payload as { kind?: unknown }).kind;
  return kind === 'conversation.messages' || kind === 'conversation.changed';
}

/** The agents the viewer may chat with, with whether each can answer now. */
export function useChatAgents(enabled = true): UseQueryResult<ChatAgent[]> {
  const api = useChatApi();
  const query = useQuery(
    {
      queryKey: chatKeys.agents,
      queryFn: () => api.agents(),
      enabled,
      staleTime: 15_000,
      retry: notRetriedOnClientErrors,
    },
    agentsQueryClient(),
  );
  const { refetch } = query;
  useEffect(() => {
    if (enabled) void refetch({ cancelRefetch: false });
  }, [enabled, refetch]);
  return query;
}

/** One conversation; polled while its run is open. */
export function useConversation(
  conversationId: string | null,
): UseQueryResult<ConversationDetail> {
  const api = useChatApi();
  const stream = useChatStreamState(conversationId);
  return useQuery(
    {
      queryKey: chatKeys.conversation(conversationId ?? ''),
      queryFn: () => api.conversation(conversationId ?? ''),
      enabled: conversationId !== null,
      placeholderData: noPlaceholder,
      retry: notRetriedOnClientErrors,
      refetchInterval: (query) =>
        query.state.data?.run ||
        (query.state.data?.execution?.status === 'running' &&
          stream?.phase !== 'interrupted')
          ? CHAT_POLL_MS
          : false,
    },
    agentsQueryClient(),
  );
}

/** One page or more of the viewer's conversations matching `query`, last message first. */
export type ConversationListPages = InfiniteData<
  ConversationPage,
  string | null
>;

/** The viewer's conversations matching `query`, last message first; `fetchNextPage()` loads the next page. */
export function useConversationList(
  query: ConversationListQuery,
): UseInfiniteQueryResult<ConversationListPages> {
  const api = useChatApi();
  return useInfiniteQuery(
    {
      queryKey: chatKeys.list(query),
      queryFn: ({ pageParam }) =>
        api.conversations({
          ...query,
          ...(pageParam ? { pageToken: pageParam } : {}),
        }),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      placeholderData: keepPreviousData,
    },
    agentsQueryClient(),
  );
}

/**
 * Keeps the conversation details and lists current from the per-user topic. Mounted once, by `ChatProvider` while the
 * chat is available; after a reconnect everything is refetched, since announcements were missed meanwhile.
 */
export function useChatRealtime(enabled: boolean): void {
  const queryClient = agentsQueryClient();
  useRealtimeTopic(enabled ? CONVERSATIONS_TOPIC : null, (payload) => {
    if (payload === undefined) {
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      return;
    }
    if (!isChatPayload(payload)) return;
    void queryClient.invalidateQueries({ queryKey: chatKeys.lists });
    if (payload.kind === 'conversation.changed')
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversation(payload.conversationId),
      });
  });
}

export interface ConversationMessages extends MessagesState {
  readonly loadingOlder: boolean;
  readonly error: unknown;
  readonly loadOlder: () => void;
  /** Fetches what arrived after the last message loaded. */
  readonly fetchNewer: () => void;
  readonly dispatch: Dispatch<MessagesAction>;
}

/** Canonical pages and the initial stream live in one controller, independent of mounted views. */
export function useConversationMessages(
  conversationId: string | null,
  _polling: boolean,
  online = false,
): ConversationMessages {
  const controller = useChatController();
  const stream = useChatStream(online ? conversationId : null);
  useSyncExternalStore(
    controller.subscribe,
    controller.snapshot,
    controller.snapshot,
  );
  const [draft, draftDispatch] = useReducer(messagesReducer, EMPTY_MESSAGES);
  useEffect(() => {
    if (conversationId) void controller.loadHistory(conversationId);
  }, [controller, conversationId]);
  const fetchNewer = useCallback(() => {
    if (conversationId)
      void controller.loadHistory(conversationId, false, true);
  }, [controller, conversationId]);
  useRealtimeTopic(conversationId ? CONVERSATIONS_TOPIC : null, (payload) => {
    if (
      isChatPayload(payload) &&
      payload.kind === 'conversation.messages' &&
      payload.conversationId === conversationId &&
      (payload.lastSeq >
        (controller.history(conversationId).state.items.at(-1)?.seq ?? 0) ||
        controller
          .history(conversationId)
          .state.items.some((item) => item.metadata.streaming))
    )
      fetchNewer();
  });
  const loaded = conversationId
    ? controller.history(conversationId)
    : { state: draft, loadingOlder: false, error: undefined };
  const state = loaded.state;
  const pending = conversationId
    ? controller.submissions
        .snapshot()
        .filter(
          (record) =>
            record.conversationId === conversationId &&
            !record.message &&
            !['rejected', 'confirmed'].includes(record.status),
        )
        .map((record) => ({
          clientId: record.clientId,
          content: record.content,
          context: record.context,
          attachments: record.attachments,
          createdAt: record.createdAt,
          status:
            record.status === 'notSubmitted'
              ? ('failed' as const)
              : record.status === 'unknown' ||
                  record.status === 'creationUnknown'
                ? ('unknown' as const)
                : ('sending' as const),
        }))
    : state.pending;
  return {
    ...state,
    pending,
    items:
      stream && (stream.lastSeq === undefined || state.lastSeq < stream.lastSeq)
        ? [
            ...state.items,
            ...stream.items.filter(
              (item) => !state.items.some((saved) => saved.seq === item.seq),
            ),
          ].sort((a, b) => a.seq - b.seq)
        : state.items,
    loadingOlder: loaded.loadingOlder,
    error: loaded.error,
    fetchNewer,
    loadOlder: () => {
      if (conversationId) void controller.loadHistory(conversationId, true);
    },
    dispatch: (action) => {
      if (action.type === 'discard')
        controller.submissions.editRejected(action.clientId);
      if (conversationId) controller.dispatch(conversationId, action);
      else draftDispatch(action);
    },
  };
}

export interface SendInput {
  readonly content: string;
  readonly context: PageContext | undefined;
  /** Uploaded files to send with it (`useChatAttachments`). */
  readonly attachments?: readonly MessageAttachment[];
  /** Given when sending again a message that failed. */
  readonly clientId?: string;
}

/**
 * Returns synchronous client acceptance (not server confirmation), showing it at once and replacing it with the server's copy (matched by `clientId`). A new
 * conversation (`conversationId` null) is created first, with `agentId` and `source`.
 */
export function useSendMessage({
  conversationId,
  agentId,
  source,
  dispatch,
  onCreated,
}: {
  readonly conversationId: string | null;
  readonly agentId: string | null;
  readonly source: ConversationSource;
  readonly dispatch: Dispatch<MessagesAction>;
  readonly onCreated: (conversation: ConversationDetail) => void;
}): (input: SendInput) => boolean {
  const controller = useChatController();
  return useCallback(
    (input: SendInput) => {
      const editorKey = `registry:${source}:${conversationId ?? 'new'}`;
      if (input.clientId) {
        if (!controller.submissions.editRejected(input.clientId)) return false;
        dispatch({ type: 'discard', clientId: input.clientId });
      }
      const off = controller.submissions.onUpdated(
        (detail, record, created) => {
          if (record.editorKey !== editorKey) return;
          if (created) onCreated(detail);
          if (record.message) {
            dispatch({ type: 'confirmed', message: record.message });
            off();
            stop();
          }
        },
      );
      const stop = controller.submissions.subscribe(() => {
        const record = controller.submissions
          .snapshot()
          .slice()
          .reverse()
          .find((record) => record.editorKey === editorKey);
        if (
          record &&
          ['unknown', 'creationUnknown', 'notSubmitted'].includes(record.status)
        ) {
          dispatch({
            type: record.status === 'notSubmitted' ? 'failed' : 'unknown',
            clientId: record.clientId,
          });
          off();
          stop();
        }
      });
      const submitted = controller.submissions.submit({
        content: input.content,
        context: input.context,
        attachments: input.attachments ?? [],
        conversationId,
        editorKey,
        create: { ...(agentId ? { agentId } : {}), source },
      });
      if (!submitted) {
        off();
        stop();
        return false;
      }
      const record = controller.submissions.snapshot().at(-1)!;
      dispatch({
        type: 'sending',
        message: {
          clientId: record.clientId,
          content: record.content,
          context: record.context,
          attachments: record.attachments,
          createdAt: record.createdAt,
          status: 'sending',
        },
      });
      return true;
    },
    [controller, conversationId, agentId, source, dispatch, onCreated],
  );
}

/** Uploading the files a message will carry, and discarding one removed before sending. */
export interface ChatAttachments {
  upload(file: File, signal?: AbortSignal): Promise<MessageAttachment>;
  /** Best effort: an upload never sent is purged after a day anyway. */
  discard(attachment: MessageAttachment): void;
}

export function useChatAttachments(): ChatAttachments {
  const api = useChatApi();
  return useMemo(
    () => ({
      upload: (file, signal) => api.uploadAttachment(file, signal),
      discard: (attachment) => {
        api.discardAttachment(attachment.id).catch(() => undefined);
      },
    }),
    [api],
  );
}

export interface ConversationActions {
  readonly rename: UseMutationResult<
    ConversationDetail,
    unknown,
    { readonly id: string; readonly title: string }
  >;
  readonly archive: UseMutationResult<
    ConversationDetail,
    unknown,
    { readonly id: string; readonly archived: boolean }
  >;
  readonly stop: UseMutationResult<ConversationDetail, unknown, string>;
  readonly markRead: (id: string) => void;
}

export function useConversationActions(): ConversationActions {
  const api = useChatApi();
  const queryClient = agentsQueryClient();
  const toaster = useToaster();
  const { t } = useTranslation(ACCESS_NAMESPACE);

  const remember = useCallback(
    (detail: ConversationDetail): void => {
      queryClient.setQueryData(chatKeys.conversation(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: chatKeys.lists });
    },
    [queryClient],
  );
  const failed = (error: unknown): void =>
    void toaster.show({
      type: 'error',
      title: errorText(t, error, t('common.requestFailed')),
    });

  const rename = useMutation(
    {
      mutationFn: (input: { readonly id: string; readonly title: string }) =>
        api.updateConversation(input.id, { title: input.title }),
      onSuccess: (detail) => {
        remember(detail);
        toaster.show({ type: 'success', title: t('chat.renamed') });
      },
      onError: failed,
    },
    queryClient,
  );

  const archive = useMutation(
    {
      mutationFn: (input: {
        readonly id: string;
        readonly archived: boolean;
      }) => api.updateConversation(input.id, { archived: input.archived }),
      onSuccess: (detail, input) => {
        remember(detail);
        if (!input.archived) {
          toaster.show({ type: 'success', title: t('chat.unarchived') });
          return;
        }
        const toastId = toaster.show({
          type: 'success',
          title: t('chat.archivedNamed', {
            title: detail.title || t('chat.untitled'),
          }),
          action: {
            label: t('chat.undo'),
            onClick: () => {
              toaster.close(toastId);
              archive.mutate({ id: input.id, archived: false });
            },
          },
        });
      },
      onError: failed,
    },
    queryClient,
  );

  const stop = useMutation(
    {
      mutationFn: (id: string) => api.stop(id),
      onSuccess: remember,
      onError: failed,
    },
    queryClient,
  );

  const markRead = useCallback(
    (id: string) => {
      void api
        .markRead(id)
        .then((detail) => remember(detail))
        .catch(() => undefined);
    },
    [api, remember],
  );

  return { rename, archive, stop, markRead };
}
