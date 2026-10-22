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
  CancelledError,
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
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
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
import type { ModelRef, ModelService } from '../../shared/models.js';
import { useRealtimeTopic } from '../hooks/use-realtime-topic.js';
import { useQuotaExpiry } from '../hooks/use-quota-expiry.js';
import { RUNNERS_TOPIC } from '../../shared/realtime.js';
import { errorText } from '../hooks/use-notify.js';
import { agentsQueryClient } from '../query.js';
import { useChatController, useChatStream } from './controller.js';
import { ChatApi } from './api.js';
import { chatKeys } from './keys.js';
import {
  EMPTY_MESSAGES,
  messagesReducer,
  type MessagesAction,
  type MessagesState,
} from './message-model.js';

/** How often an open conversation with a run is fetched when no announcement comes. */
export const CHAT_POLL_MS = 60_000;

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
  return (
    kind === 'conversation.messages' ||
    kind === 'conversation.changed' ||
    kind === 'conversation.messageUpdated'
  );
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
  useQuotaExpiry(query.data ?? []);
  const { refetch } = query;
  useEffect(() => {
    if (enabled) void refetch({ cancelRefetch: false });
  }, [enabled, refetch]);
  return query;
}

/** Public native chat models; revalidated while open, without turning a failed read into an empty catalog. */
export function useChatModels(enabled = true): UseQueryResult<ModelService[]> {
  const api = useChatApi();
  const client = agentsQueryClient();
  const query = useQuery(
    {
      queryKey: chatKeys.models,
      queryFn: ({ signal }) => api.models(signal),
      enabled,
      staleTime: 15_000,
      retry: false,
      refetchOnWindowFocus: 'always',
    },
    client,
  );
  const { refetch } = query;
  useEffect(() => {
    if (!enabled) {
      // Closing the last consumer abandons stale revalidation; active consumers keep their request.
      void client.cancelQueries({
        queryKey: chatKeys.models,
        exact: true,
        type: 'inactive',
      });
      return;
    }
    // Multiple mounted consumers share any in-flight open/focus refresh instead of restarting it.
    void refetch({ cancelRefetch: false });
    const refresh = () => void refetch({ cancelRefetch: false });
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [client, enabled, refetch]);
  return query;
}

/** One conversation; polled while its run is open. */
export function useConversation(
  conversationId: string | null,
): UseQueryResult<ConversationDetail> {
  const api = useChatApi();
  const controller = useChatController();
  return useQuery(
    {
      queryKey: chatKeys.conversation(conversationId ?? ''),
      queryFn: async () => {
        const current = controller.detailRequest(conversationId ?? '');
        if (!current()) throw new CancelledError({ silent: true });
        const detail = await api.conversation(conversationId ?? '');
        if (!current()) throw new CancelledError({ silent: true });
        controller.observeDetail(detail);
        return detail;
      },
      enabled: conversationId !== null,
      placeholderData: noPlaceholder,
      retry: notRetriedOnClientErrors,
      refetchInterval: (query) =>
        query.state.data?.run ||
        query.state.data?.execution?.status === 'running'
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
  useRealtimeTopic(enabled ? RUNNERS_TOPIC : null, () => {
    void queryClient.invalidateQueries({ queryKey: chatKeys.agents });
  });
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
): ConversationMessages {
  const controller = useChatController();
  useChatStream(conversationId);
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
    if (!conversationId) return;
    if (payload === undefined) {
      void controller
        .refresh(conversationId)
        .then(() => controller.resume(conversationId))
        .catch(() => {});
      return;
    }
    if (!isChatPayload(payload) || payload.conversationId !== conversationId)
      return;
    if (payload.kind === 'conversation.messageUpdated')
      controller.messageUpdated(
        conversationId,
        payload.messageId,
        payload.revision,
      );
    else if (
      payload.kind === 'conversation.messages' &&
      payload.lastSeq > controller.history(conversationId).loadedThrough
    )
      fetchNewer();
  });
  // One durable subscription/poll owner regardless of how many surfaces display this conversation.
  useEffect(
    () => (conversationId ? controller.watch(conversationId) : undefined),
    [controller, conversationId],
  );
  const loaded = conversationId
    ? controller.history(conversationId)
    : { state: draft, loadingOlder: false, error: undefined };
  const records = controller.submissions
    .snapshot()
    .filter(
      (record) =>
        record.conversationId === conversationId &&
        !record.message &&
        !['rejected', 'confirmed'].includes(record.status),
    );
  const pending = conversationId
    ? records.map((record) => ({
        clientId: record.clientId,
        content: record.content,
        context: record.context,
        attachments: record.attachments,
        createdAt: record.createdAt,
        status:
          record.status === 'notSubmitted'
            ? ('failed' as const)
            : record.status === 'unknown' || record.status === 'creationUnknown'
              ? ('unknown' as const)
              : ('sending' as const),
      }))
    : loaded.state.pending;
  return {
    ...loaded.state,
    pending,
    // The SDK owns optimistic user messages; recovery controls replace their presentation until admission is reconciled.
    items: loaded.state.items.filter(
      (message) =>
        !records.some(
          (record) =>
            message.id === record.clientId &&
            message.metadata?.seq === undefined,
        ),
    ),
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
  selectedModel,
  editorRevision = 0,
  dispatch,
  onCreated,
}: {
  readonly conversationId: string | null;
  readonly agentId: string | null;
  readonly source: ConversationSource;
  /** Snapshotted for a new, explicitly native conversation only; Runner and continuation ignore it. */
  readonly selectedModel?: ModelRef;
  /** A fresh blank editor must not share pending/unknown creation admission with its predecessor. */
  readonly editorRevision?: number;
  readonly dispatch: Dispatch<MessagesAction>;
  readonly onCreated: (conversation: ConversationDetail) => void;
}): (input: SendInput) => boolean {
  const controller = useChatController();
  const editorKey = `registry:${source}:${conversationId ?? 'new'}:${editorRevision}`;
  const editorRef = useRef(editorKey);
  const observersRef = useRef(new Set<() => void>());
  useLayoutEffect(() => {
    editorRef.current = editorKey;
    const observers = observersRef.current;
    return () => {
      for (const cleanup of observers) cleanup();
      observers.clear();
    };
  }, [controller, editorKey]);
  return useCallback(
    (input: SendInput) => {
      if (input.clientId) {
        if (!controller.submissions.editRejected(input.clientId)) return false;
        dispatch({ type: 'discard', clientId: input.clientId });
      }
      const submission = { clientId: undefined as string | undefined };
      const active = controller.lifetime();
      const visible = () =>
        active() &&
        editorRef.current === editorKey &&
        observersRef.current.has(cleanup);
      const cleanup = () => {
        off();
        stop();
        observersRef.current.delete(cleanup);
      };
      const off = controller.submissions.onUpdated(
        (detail, record, created) => {
          if (record.clientId !== submission.clientId || !visible()) return;
          if (created) onCreated(detail);
        },
      );
      const stop = controller.submissions.subscribe(() => {
        const record = controller.submissions
          .snapshot()
          .find((record) => record.clientId === submission.clientId);
        if (!record || !visible()) return;
        if (record.status === 'confirmed') {
          if (record.message)
            dispatch({ type: 'confirmed', message: record.message });
          cleanup();
        } else if (
          ['unknown', 'creationUnknown', 'notSubmitted', 'rejected'].includes(
            record.status,
          )
        ) {
          dispatch({
            type: record.status === 'notSubmitted' ? 'failed' : 'unknown',
            clientId: record.clientId,
          });
          cleanup();
        }
      });
      observersRef.current.add(cleanup);
      const submitted = controller.submissions.submit({
        content: input.content,
        context: input.context,
        attachments: input.attachments ?? [],
        conversationId,
        editorKey,
        create: {
          ...(agentId ? { agentId } : {}),
          source,
          ...(!conversationId && agentId === 'online' && selectedModel
            ? { selectedModel }
            : {}),
        },
      });
      if (!submitted) {
        cleanup();
        return false;
      }
      const record = controller.submissions.snapshot().at(-1)!;
      submission.clientId = record.clientId;
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
    [
      controller,
      conversationId,
      agentId,
      source,
      selectedModel,
      editorKey,
      dispatch,
      onCreated,
    ],
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

  const controller = useChatController();
  type Scope = { active: () => boolean };
  const scope = (): Scope => ({ active: controller.lifetime() });
  const failed = (
    error: unknown,
    _input: unknown,
    lifetime: Scope | undefined,
  ): void => {
    if (!lifetime?.active()) return;
    void toaster.show({
      type: 'error',
      title: errorText(t, error, t('common.requestFailed')),
    });
  };

  const rename = useMutation(
    {
      mutationFn: (input: { readonly id: string; readonly title: string }) =>
        controller.command(
          input.id,
          () => api.updateConversation(input.id, { title: input.title }),
          (detail) => detail,
        ),
      onMutate: scope,
      onSuccess: (_detail, _input, lifetime) => {
        if (!lifetime.active()) return;
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
      }) =>
        controller.command(
          input.id,
          () => api.updateConversation(input.id, { archived: input.archived }),
          (detail) => detail,
        ),
      onMutate: scope,
      onSuccess: (detail, input, lifetime) => {
        if (!lifetime.active()) return;
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
              if (!lifetime.active()) return;
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
      mutationFn: (id: string) => controller.stop(id),
      onMutate: scope,
      onError: failed,
    },
    queryClient,
  );

  const markRead = useCallback(
    (id: string) => {
      void controller
        .command(
          id,
          () => api.markRead(id),
          (detail) => detail,
        )
        .catch(() => undefined);
    },
    [api, controller],
  );

  return { rename, archive, stop, markRead };
}
