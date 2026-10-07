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
  useRef,
  useState,
  type Dispatch,
} from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { OnlineModelEntry } from '../../shared/agents.js';
import {
  CONVERSATIONS_TOPIC,
  MESSAGE_PAGE_DEFAULT,
  type ChatAgent,
  type ConversationChanged,
  type ConversationDetail,
  type ConversationListQuery,
  type ConversationPage,
  type ConversationSource,
  type MessageAttachment,
  type PageContext,
  type SendMessageResult,
} from '../../shared/conversations.js';
import { useRealtimeTopic } from '../hooks/use-realtime-topic.js';
import { errorText } from '../hooks/use-notify.js';
import { agentsQueryClient } from '../query.js';
import { ChatApi } from './api.js';
import { chatKeys } from './keys.js';
import {
  EMPTY_MESSAGES,
  fetchCursor,
  lastLoadedSeq,
  streamingSeq,
  messagesReducer,
  newClientId,
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
  return useQuery(
    {
      queryKey: chatKeys.agents,
      queryFn: () => api.agents(),
      enabled,
      staleTime: 15_000,
    },
    agentsQueryClient(),
  );
}

/** One conversation; polled while its run is open. */
export function useConversation(
  conversationId: string | null,
): UseQueryResult<ConversationDetail> {
  const api = useChatApi();
  return useQuery(
    {
      queryKey: chatKeys.conversation(conversationId ?? ''),
      queryFn: () => api.conversation(conversationId ?? ''),
      enabled: conversationId !== null,
      placeholderData: noPlaceholder,
      retry: notRetriedOnClientErrors,
      refetchInterval: (query) =>
        query.state.data?.run ? CHAT_POLL_MS : false,
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

interface Loader {
  inflight: boolean;
  again: boolean;
  loadingOlder: boolean;
}

/**
 * A conversation's messages: the newest page first, older pages on demand, newer ones when the topic announces them
 * (or the poll finds them while `polling`). A null conversation is a new one: only optimistic messages, kept when
 * its first message creates it (`conversationId` going from null to an id).
 */
export function useConversationMessages(
  conversationId: string | null,
  polling: boolean,
): ConversationMessages {
  const api = useChatApi();
  const [state, dispatch] = useReducer(messagesReducer, EMPTY_MESSAGES);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<unknown>(undefined);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });
  const idRef = useRef(conversationId);
  const loaderRef = useRef<Loader>({
    inflight: false,
    again: false,
    loadingOlder: false,
  });

  const fetchNewer = useCallback((): void => {
    const id = idRef.current;
    if (!id) return;
    const loader = loaderRef.current;
    if (loader.inflight) {
      loader.again = true;
      return;
    }
    loader.inflight = true;
    const run = async (): Promise<void> => {
      try {
        let full = false;
        do {
          loader.again = false;
          const after = fetchCursor(stateRef.current);
          const page = await api.messages(
            id,
            stateRef.current.loaded ? { after } : {},
          );
          if (idRef.current !== id) return;
          // From before a reply still being written, a full page may hold nothing new: do not ask again.
          full =
            stateRef.current.loaded &&
            after === lastLoadedSeq(stateRef.current) &&
            page.items.length >= MESSAGE_PAGE_DEFAULT;
          dispatch({ type: 'page', page });
          stateRef.current = messagesReducer(stateRef.current, {
            type: 'page',
            page,
          });
          setError(undefined);
        } while (loader.again || full);
      } catch (failure: unknown) {
        if (idRef.current === id) setError(failure);
      } finally {
        loader.inflight = false;
      }
    };
    void run();
  }, [api]);

  // A new id: start over, unless it is the conversation a new one's first message just created.
  const previousRef = useRef(conversationId);
  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = conversationId;
    idRef.current = conversationId;
    if (previous !== conversationId && previous !== null) {
      loaderRef.current = {
        inflight: false,
        again: false,
        loadingOlder: false,
      };
      stateRef.current = EMPTY_MESSAGES;
      dispatch({ type: 'reset' });
      setError(undefined);
    }
    if (conversationId) fetchNewer();
  }, [conversationId, fetchNewer]);

  useRealtimeTopic(conversationId ? CONVERSATIONS_TOPIC : null, (payload) => {
    if (payload === undefined) {
      fetchNewer();
      return;
    }
    if (
      isChatPayload(payload) &&
      payload.kind === 'conversation.messages' &&
      payload.conversationId === idRef.current &&
      (payload.lastSeq > lastLoadedSeq(stateRef.current) ||
        streamingSeq(stateRef.current) !== null)
    )
      fetchNewer();
  });

  const streaming = streamingSeq(state) !== null;
  useEffect(() => {
    if (!(polling || streaming) || !conversationId) return undefined;
    const timer = window.setInterval(
      fetchNewer,
      streaming ? CHAT_STREAM_POLL_MS : CHAT_POLL_MS,
    );
    return () => window.clearInterval(timer);
  }, [polling, streaming, conversationId, fetchNewer]);

  const loadOlder = useCallback((): void => {
    const id = idRef.current;
    const loader = loaderRef.current;
    const pageToken = stateRef.current.olderToken;
    if (!id || !pageToken || loader.loadingOlder) return;
    loader.loadingOlder = true;
    setLoadingOlder(true);
    void api
      .messages(id, { pageToken })
      .then((page) => {
        if (idRef.current === id) dispatch({ type: 'page', page, older: true });
      })
      .catch((failure: unknown) => setError(failure))
      .finally(() => {
        loader.loadingOlder = false;
        setLoadingOlder(false);
      });
  }, [api]);

  return {
    ...state,
    loadingOlder,
    error,
    loadOlder,
    fetchNewer,
    dispatch,
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
 * Sends a message, showing it at once and replacing it with the server's copy (matched by `clientId`). A new
 * conversation (`conversationId` null) is created first, with `agentId`, `source` and, for an online agent, `model`.
 */
export function useSendMessage({
  conversationId,
  agentId,
  source,
  model = null,
  dispatch,
  onCreated,
}: {
  readonly conversationId: string | null;
  readonly agentId: string | null;
  readonly source: ConversationSource;
  /** A new conversation with an online agent: the entry of `ChatAgent.models` it answers with; null for the default. */
  readonly model?: OnlineModelEntry | null;
  readonly dispatch: Dispatch<MessagesAction>;
  readonly onCreated: (conversation: ConversationDetail) => void;
}): (input: SendInput) => Promise<SendMessageResult | null> {
  const api = useChatApi();
  const queryClient = agentsQueryClient();
  const toaster = useToaster();
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const createdRef = useRef<string | null>(null);
  return useCallback(
    async (input: SendInput) => {
      const clientId = input.clientId ?? newClientId();
      if (input.clientId) dispatch({ type: 'discard', clientId });
      dispatch({
        type: 'sending',
        message: {
          clientId,
          content: input.content,
          context: input.context,
          ...(input.attachments?.length
            ? { attachments: input.attachments }
            : {}),
          createdAt: new Date().toISOString(),
          status: 'sending',
        },
      });
      try {
        let id = conversationId ?? createdRef.current;
        if (!id) {
          const created = await api.createConversation({
            ...(agentId ? { agentId } : {}),
            source,
            ...(model ? { model } : {}),
          });
          id = created.id;
          createdRef.current = id;
          queryClient.setQueryData(chatKeys.conversation(id), created);
          onCreated(created);
        }
        const result = await api.sendMessage(id, {
          content: input.content,
          clientId,
          ...(input.context ? { context: input.context } : {}),
          ...(input.attachments?.length
            ? { attachmentIds: input.attachments.map((file) => file.id) }
            : {}),
        });
        dispatch({ type: 'confirmed', message: result.message });
        queryClient.setQueryData(
          chatKeys.conversation(id),
          result.conversation,
        );
        void queryClient.invalidateQueries({ queryKey: chatKeys.lists });
        return result;
      } catch (error: unknown) {
        dispatch({ type: 'failed', clientId });
        toaster.show({
          type: 'error',
          title: errorText(t, error, t('chat.sendFailed')),
        });
        return null;
      }
    },
    [
      api,
      conversationId,
      agentId,
      source,
      model,
      dispatch,
      onCreated,
      queryClient,
      toaster,
      t,
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
  /** Chooses the model an online conversation answers with from its next run (null: the agent's default). */
  readonly chooseModel: UseMutationResult<
    ConversationDetail,
    unknown,
    { readonly id: string; readonly model: OnlineModelEntry | null }
  >;
  readonly stop: UseMutationResult<ConversationDetail, unknown, string>;
  readonly fallback: UseMutationResult<ConversationDetail, unknown, string>;
  readonly restore: UseMutationResult<ConversationDetail, unknown, string>;
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

  const chooseModel = useMutation(
    {
      mutationFn: (input: {
        readonly id: string;
        readonly model: OnlineModelEntry | null;
      }) => api.updateConversation(input.id, { model: input.model }),
      onSuccess: remember,
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

  const fallback = useMutation(
    {
      mutationFn: (id: string) => api.fallback(id),
      onSuccess: (detail) => {
        remember(detail);
        toaster.show({
          type: 'success',
          title: t('chat.offline.fallbackDone'),
          description: t('chat.offline.newSession'),
        });
      },
      onError: failed,
    },
    queryClient,
  );

  const restore = useMutation(
    {
      mutationFn: (id: string) => api.restore(id),
      onSuccess: (detail) => {
        remember(detail);
        toaster.show({
          type: 'success',
          title: t('chat.offline.restoreDone'),
          description: t('chat.offline.newSession'),
        });
      },
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

  return { rename, archive, chooseModel, stop, fallback, restore, markRead };
}
