/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useChat } from '../hooks/useChat';
import { useCallback } from 'react';
import { useApp } from '@nocobase/client-v2';
import { randomId } from '@nocobase/flow-engine';
import { AIEmployee, Attachment, ContextItem, Message, ResendOptions, SendOptions, ToolCall } from '../../types';
import { useLoadMoreObserver } from './useLoadMoreObserver';
import { useT } from '../../../locale';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChatBoxStore } from '../stores/chat-box';
import { flattenMessages, parseWorkContext } from '../utils';
import { aiDebugLogger } from '../../../debug-logger'; // [AI_DEBUG]
import { useChatToolCallStore } from '../stores/chat-tool-call';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { ensureModel, getAllModels, isSameModel, isValidModel } from '../model';
import { FlowUtils } from '../../flow';
import { UploadFieldModel } from '@nocobase/plugin-file-manager/client-v2';

const STREAM_UPDATE_INTERVAL = 50;

type MessagesResponse = {
  data: Message[];
  meta: {
    cursor?: string;
    hasMore?: boolean;
  };
};

type StreamBody = Record<string, unknown> & {
  content?: string;
  status?: string;
  toolCalls?: ToolCall<unknown>[];
  toolCall?: ToolCall<unknown> & { messageId?: string };
  invokeStatus?: string;
  invokeStartTime?: unknown;
  invokeEndTime?: unknown;
};

type StreamData = {
  type?: string;
  from?: Message['content']['from'];
  sessionId?: string;
  username?: string;
  errorName?: string;
  body?: StreamBody | string | Partial<ToolCall<string>>[] | unknown[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getStreamBody = (data: StreamData): StreamBody | undefined => (isRecord(data.body) ? data.body : undefined);

const getStreamToolCallChunks = (data: StreamData): Partial<ToolCall<string>>[] =>
  Array.isArray(data.body) ? (data.body as Partial<ToolCall<string>>[]) : [];

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const getErrorName = (error: unknown) => (error instanceof Error ? error.name : undefined);

export const useChatMessageActions = () => {
  const app = useApp();
  const t = useT();
  const api = app.apiClient;
  const aiConfigRepository = useAIConfigRepository();

  const isEditingMessage = useChatBoxStore.use.isEditingMessage();
  const setIsEditingMessage = useChatBoxStore.use.setIsEditingMessage();
  const setEditingMessageId = useChatBoxStore.use.setEditingMessageId();
  const setModel = useChatBoxStore.use.setModel();

  const currentConversation = useChatConversationsStore.use.currentConversation?.();
  const currentWebSearch = useChatConversationsStore.use.webSearch();
  const setConversationUnreadCount = useChatConversationsStore.use.setUnreadCount();
  const chat = useChat(currentConversation);
  const messages = chat.use.messages();
  const abortController = chat.use.abortController();
  const setMessages = chat.setMessages;
  const setResponseLoading = chat.setResponseLoading;
  const setAbortController = chat.setAbortController;
  const setAttachments = chat.setAttachments;
  const setContextItems = chat.setContextItems;

  const updateToolCallInvokeStatus = useChatToolCallStore.use.updateToolCallInvokeStatus();
  const getSessionChat = useCallback((sessionId?: string) => chat.for(sessionId).getState(), [chat]);
  const getConversationModel = useCallback(
    (messages: Message[], services: Awaited<ReturnType<typeof aiConfigRepository.getLLMServices>>) => {
      for (let i = messages.length - 1; i >= 0; i -= 1) {
        const metadata = messages[i]?.content?.metadata;
        if (metadata?.llmService && metadata?.model) {
          return {
            llmService: metadata.llmService,
            model: metadata.model,
          };
        }
        if (metadata?.provider && metadata?.model) {
          const candidates = services
            .filter((service) => service.provider === metadata.provider)
            .filter((service) => service.enabledModels.some((model) => model.value === metadata.model));
          if (candidates.length === 1) {
            return {
              llmService: candidates[0].llmService,
              model: metadata.model,
            };
          }
        }
      }
      return null;
    },
    [aiConfigRepository],
  );
  const ensureModelFromStore = useCallback(
    async (username?: string) => {
      const state = useChatBoxStore.getState();
      const targetUsername = username || state.currentEmployee?.username;
      if (!targetUsername) {
        return state.model;
      }
      return ensureModel({
        api,
        aiConfigRepository,
        aiEmployee:
          state.currentEmployee?.username === targetUsername ? state.currentEmployee : { username: targetUsername },
        currentOverride: state.model,
        onResolved: setModel,
      });
    },
    [api, aiConfigRepository, setModel],
  );

  const extractContextAttachments = useCallback(
    (items: ContextItem | ContextItem[]): Attachment[] => {
      const attachments: Attachment[] = [];
      const contextItems = Array.isArray(items) ? items : [items];
      for (const item of contextItems.filter((it) => it.type?.startsWith('flow-model'))) {
        const model = app.flowEngine.getModel(item.uid, true);
        if (!model) {
          continue;
        }
        FlowUtils.walkthrough(model, (subModel) => {
          if (
            subModel instanceof UploadFieldModel &&
            subModel.props?.value?.length &&
            typeof subModel.props.value !== 'string'
          ) {
            attachments.push(...subModel.props.value.map((it) => ({ ...it, status: 'done' })));
          }
        });
      }
      return attachments;
    },
    [app],
  );

  const syncContextAttachments = useCallback(
    (items: ContextItem | ContextItem[]) => {
      const attachments = extractContextAttachments(items);
      if (attachments.length) {
        const sessionChat = getSessionChat(useChatConversationsStore.getState().currentConversation);
        sessionChat.addAttachments(attachments);
      }
      return attachments;
    },
    [extractContextAttachments, getSessionChat],
  );

  const loadMessages = useCallback(
    async (sessionId?: string, cursor?: string) => {
      if (!sessionId) {
        return;
      }
      const sessionChat = getSessionChat(sessionId);
      sessionChat.setMessagesLoading(true);
      sessionChat.setMessagesError(null);
      try {
        const activeConversation = useChatConversationsStore.getState().currentConversation;
        const chatBoxOpen = useChatBoxStore.getState().open;
        const res = await api.resource('aiConversations').getMessages({
          sessionId,
          cursor,
          paginate: false,
          updateRead: sessionId === activeConversation && chatBoxOpen,
        });

        const data = res?.data as MessagesResponse | undefined;
        if (!data?.data) {
          sessionChat.setMessagesMeta({});
          return;
        }
        const newMessages = [...data.data].reverse();
        const services = !cursor ? await aiConfigRepository.getLLMServices() : [];
        const conversationModel = !cursor ? getConversationModel(newMessages, services) : null;
        if (conversationModel) {
          const currentModel = useChatBoxStore.getState().model;
          const allModels = getAllModels(services);
          if (isValidModel(conversationModel, allModels) && !isSameModel(currentModel, conversationModel)) {
            setModel(conversationModel);
          }
        }

        // [AI_DEBUG] backend tool results
        for (const msg of newMessages) {
          const toolCalls = msg.content?.tool_calls;
          if (toolCalls?.length) {
            for (const tc of toolCalls) {
              if (tc.willInterrupt) {
                updateToolCallInvokeStatus(sessionId, msg.content.messageId, tc.id, tc.invokeStatus);
              }
              if (tc.invokeStatus === 'done' || tc.invokeStatus === 'confirmed') {
                const contentStr = typeof tc.content === 'string' ? tc.content : JSON.stringify(tc.content);
                aiDebugLogger.log(sessionId, 'tool_result', {
                  toolCallId: tc.id,
                  toolName: tc.name,
                  args: tc.args,
                  status: tc.status,
                  invokeStatus: tc.invokeStatus,
                  auto: tc.auto,
                  execution: 'backend',
                  contentPreview: contentStr?.slice(0, 500),
                });
              }
            }
          }
          if (msg.content?.subAgentConversations?.length) {
            for (const conversation of msg.content.subAgentConversations) {
              for (const subMessage of conversation.messages ?? []) {
                const subMessageId = subMessage.content?.messageId;
                const subToolCalls = subMessage.content?.tool_calls;
                if (!subMessageId || !subToolCalls?.length) {
                  continue;
                }
                for (const tc of subToolCalls) {
                  if (tc.willInterrupt) {
                    updateToolCallInvokeStatus(sessionId, subMessageId, tc.id, tc.invokeStatus);
                  }
                }
              }
            }
          }
        }

        sessionChat.setMessages((prev) => {
          const last = prev[prev.length - 1];
          const result = cursor ? [...newMessages, ...prev] : newMessages;
          if (last?.role === 'error') {
            result.push(last);
          }
          return result;
        });
        sessionChat.setMessagesMeta(data.meta || {});
      } catch (error) {
        sessionChat.setMessagesError(error);
      } finally {
        sessionChat.setMessagesLoading(false);
      }
    },
    [api, aiConfigRepository, getConversationModel, getSessionChat, setModel, updateToolCallInvokeStatus],
  );

  const getConversationLLMActiveState = useCallback(
    async (sessionId: string): Promise<string | undefined> => {
      const res = await api.resource('aiConversations').get({
        filter: { sessionId },
      });
      return res.data?.data?.llmActiveState;
    },
    [api],
  );

  const processStreamResponse = useCallback(
    async (stream: ReadableStream<Uint8Array>, sessionId: string, aiEmployee: AIEmployee) => {
      const sessionChat = getSessionChat(sessionId);
      sessionChat.setBackgroundWorking(false);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let result = '';
      let error = false;
      let streamBuffer = '';

      type MessagesStore = {
        addMessage: (msg: Message) => void;
        updateLast: (updater: (msg: Message) => Message) => void;
      };

      type PendingStreamUpdate = {
        updateLast: MessagesStore['updateLast'];
        content: string;
        reasoningContent: string;
        reasoningStatus?: string;
        from?: Message['content']['from'];
        timer?: ReturnType<typeof setTimeout>;
      };

      const pendingStreamUpdates = new Map<string, PendingStreamUpdate>();

      const flushPendingStreamUpdate = (key: string) => {
        const pending = pendingStreamUpdates.get(key);
        if (!pending) {
          return;
        }
        pendingStreamUpdates.delete(key);
        pending.updateLast((last) => {
          const nextContent = { ...last.content };
          if (pending.from) {
            nextContent.from = pending.from;
          }
          if (pending.content) {
            nextContent.content = `${typeof last.content.content === 'string' ? last.content.content : ''}${
              pending.content
            }`;
          }
          if (pending.reasoningContent) {
            nextContent.reasoning = {
              status: pending.reasoningStatus,
              content: `${last.content.reasoning?.content ?? ''}${pending.reasoningContent}`,
            };
          }
          return {
            ...last,
            createdAt: new Date().toISOString(),
            content: nextContent,
            loading: false,
          };
        });
      };

      const flushAllPendingStreamUpdates = () => {
        for (const key of Array.from(pendingStreamUpdates.keys())) {
          const pending = pendingStreamUpdates.get(key);
          if (pending?.timer) {
            clearTimeout(pending.timer);
          }
          flushPendingStreamUpdate(key);
        }
      };

      const clearAllPendingStreamUpdates = () => {
        for (const pending of pendingStreamUpdates.values()) {
          if (pending.timer) {
            clearTimeout(pending.timer);
          }
        }
        pendingStreamUpdates.clear();
      };

      const enqueueStreamUpdate = (
        key: string,
        store: MessagesStore,
        update: Pick<PendingStreamUpdate, 'content' | 'reasoningContent' | 'reasoningStatus' | 'from'>,
      ) => {
        const pending = pendingStreamUpdates.get(key) ?? {
          updateLast: store.updateLast,
          content: '',
          reasoningContent: '',
        };
        pending.updateLast = store.updateLast;
        if (update.from === 'main-agent' || update.from === 'sub-agent') {
          pending.from = update.from;
        }
        pending.content += update.content ?? '';
        pending.reasoningContent += update.reasoningContent ?? '';
        pending.reasoningStatus = update.reasoningStatus ?? pending.reasoningStatus;
        if (!pending.timer) {
          pending.timer = setTimeout(() => {
            flushPendingStreamUpdate(key);
          }, STREAM_UPDATE_INTERVAL);
        }
        pendingStreamUpdates.set(key, pending);
      };

      const getStreamUpdateKey = (data: StreamData) =>
        `${data.from || 'main-agent'}:${data.sessionId || sessionId}:${data.username || ''}`;

      const processStreamStart = (data: StreamData) => {
        if (data.type === 'stream_start') {
          console.debug('stream_start', data.from, data.sessionId);
        }
      };

      const processStreamEnd = (data: StreamData) => {
        if (data.type === 'stream_end') {
          console.debug('stream_end', data.from, data.sessionId);
        }
      };

      const processResumeStreamUnavailable = (data: StreamData) => {
        if (data.type === 'chunks_cache_missing') {
          sessionChat.setResumeStreamFailed(true);
        }
      };

      const processReasoning = (data: StreamData, store: MessagesStore) => {
        const body = getStreamBody(data);
        if (data.type === 'reasoning' && body?.content && typeof body.content === 'string') {
          aiDebugLogger.log(data.sessionId, 'stream_reasoning', {
            phase: 'delta',
            preview: body.content?.slice?.(0, 120) || '',
          });
          enqueueStreamUpdate(getStreamUpdateKey(data), store, {
            from: data.from,
            content: '',
            reasoningContent: body.content,
            reasoningStatus: body.status,
          });
        }
      };

      const processContent = (data: StreamData, store: MessagesStore) => {
        if (data.type === 'content' && data.body && typeof data.body === 'string') {
          aiDebugLogger.log(data.sessionId, 'stream_text', {
            preview: data.body?.slice?.(0, 100) || '',
          });
          enqueueStreamUpdate(getStreamUpdateKey(data), store, {
            from: data.from,
            content: data.body,
            reasoningContent: '',
          });
        }
      };

      const processToolCallChunks = (data: StreamData, store: MessagesStore) => {
        const chunks = getStreamToolCallChunks(data);
        if (data.type === 'tool_call_chunks' && chunks.length > 0) {
          aiDebugLogger.log(data.sessionId, 'stream_delta', {
            chunk: chunks[0],
          });
          store.updateLast((last) => {
            const toolCalls = last.content.tool_calls || [];
            const toolCallChunk = chunks[0];
            let nextToolCalls = toolCalls;
            if (toolCallChunk.name) {
              nextToolCalls = [...toolCalls, toolCallChunk as ToolCall<unknown>];
            } else if (toolCalls.length > 0) {
              const lastToolCall = toolCalls[toolCalls.length - 1];
              nextToolCalls = [
                ...toolCalls.slice(0, -1),
                {
                  ...lastToolCall,
                  args: `${lastToolCall.args ?? ''}${toolCallChunk.args ?? ''}`,
                },
              ];
            }
            return {
              ...last,
              createdAt: new Date().toISOString(),
              content: {
                ...last.content,
                from: data.from,
                tool_calls: nextToolCalls,
              },
              loading: false,
            };
          });
        }
      };

      const processToolCall = (data: StreamData, store: MessagesStore) => {
        const body = getStreamBody(data);
        if (data.type === 'tool_calls' && body?.toolCalls?.length > 0) {
          store.updateLast((last) => {
            return {
              ...last,
              createdAt: new Date().toISOString(),
              content: {
                ...last.content,
                from: data.from,
                tool_calls: body.toolCalls,
              },
              loading: false,
            };
          });
        }
      };

      const processToolCallStatus = (data: StreamData, store: MessagesStore) => {
        if (data.type === 'tool_call_status') {
          const body = getStreamBody(data);
          if (body?.toolCall) {
            const { toolCall, invokeStatus } = body;
            if (toolCall.willInterrupt) {
              updateToolCallInvokeStatus(sessionId, toolCall.messageId, toolCall.id, String(invokeStatus));
            }
          }
          store.updateLast((last) => {
            const toolCalls = last.content.tool_calls || [];
            const toolCallId = body?.toolCall?.id;
            const nextToolCalls = toolCalls.map((t) =>
              t.id === toolCallId
                ? {
                    ...t,
                    invokeStatus: (body?.invokeStatus as ToolCall['invokeStatus'] | undefined) ?? t.invokeStatus,
                    status: (body?.status as ToolCall['status'] | undefined) ?? t.status,
                    invokeStartTime: body?.invokeStartTime ?? t.invokeStartTime,
                    invokeEndTime: body?.invokeEndTime ?? t.invokeEndTime,
                    content: body?.content ?? t.content,
                  }
                : t,
            );
            return {
              ...last,
              content: {
                ...last.content,
                tool_calls: nextToolCalls,
              },
              loading: false,
            };
          });
        }
      };

      const processWebSearch = (data: StreamData) => {
        const actions = Array.isArray(data.body) ? data.body : [];
        if (data.type === 'web_search' && actions.length) {
          aiDebugLogger.log(data.sessionId, 'stream_search', {
            actions,
          });
          for (const item of actions) {
            sessionChat.setWebSearching(item as Parameters<typeof sessionChat.setWebSearching>[0]);
          }
        }
      };

      const processNewMessage = (data: StreamData, store: MessagesStore) => {
        if (data.type === 'new_message') {
          aiDebugLogger.log(data.sessionId, 'stream_start', {});
          store.addMessage({
            key: randomId(),
            role: aiEmployee.username,
            createdAt: new Date().toISOString(),
            content: { from: data.from, type: 'text', content: '' },
            loading: true,
          });
        }
      };

      const processError = (data: StreamData) => {
        if (data.type === 'error') {
          aiDebugLogger.log(data.sessionId, 'stream_error', {
            message: data.body,
          });
          error = true;
          result = data.errorName ? data.errorName : String(data.body);
        }
      };

      const mainAgentMessageStore = {
        addMessage: sessionChat.addMessage,
        updateLast: sessionChat.updateLastMessage,
      };

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done || error) {
            flushAllPendingStreamUpdates();
            sessionChat.setResponseLoading(false);
            sessionChat.setWebSearching(null);
            break;
          }

          streamBuffer += decoder.decode(value, { stream: true });
          const parts = streamBuffer.split(/\r?\n/);
          streamBuffer = parts.pop() ?? '';
          const lines = parts.filter(Boolean);

          for (const line of lines) {
            try {
              const data = JSON.parse(line.replace(/^data: /, '')) as StreamData;
              processError(data);
              processResumeStreamUnavailable(data);
              if (data.from === 'main-agent') {
                sessionChat.setBackgroundWorking(false);
                if (sessionId !== data.sessionId) {
                  console.warn('invalid session id, ignore chunks', data);
                  continue;
                }
                processStreamStart(data);
                processStreamEnd(data);
                processNewMessage(data, mainAgentMessageStore);
                processReasoning(data, mainAgentMessageStore);
                processContent(data, mainAgentMessageStore);
                processToolCallChunks(data, mainAgentMessageStore);
                processToolCall(data, mainAgentMessageStore);
                processToolCallStatus(data, mainAgentMessageStore);
                processWebSearch({
                  ...data,
                  sessionId,
                });
              } else if (data.from === 'sub-agent') {
                sessionChat.setBackgroundWorking(false);
                const subAgentMessageStore = {
                  addMessage: (msg: Message) => {
                    msg.role = data.username;
                    sessionChat.addSubAgentMessage(data.sessionId, msg);
                  },
                  updateLast: (updater: (msg: Message) => Message) => {
                    sessionChat.updateLastSubAgentMessage(data.sessionId, data.username, updater);
                  },
                };

                if (data.type === 'sub_agent_completed') {
                  sessionChat.updateSubAgentConversationStatus(data.sessionId, 'completed');
                }

                processNewMessage(data, subAgentMessageStore);
                processReasoning(data, subAgentMessageStore);
                processContent(data, subAgentMessageStore);
                processToolCallChunks(data, subAgentMessageStore);
                processToolCall(data, subAgentMessageStore);
                processToolCallStatus(data, subAgentMessageStore);
                processWebSearch({
                  ...data,
                  sessionId,
                });
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }
      } catch (err) {
        console.error(err);
        if (getErrorName(err) === 'AbortError') {
          clearAllPendingStreamUpdates();
          sessionChat.setResponseLoading(false);
          sessionChat.setWebSearching(null);
          return;
        }
        error = true;
        result = getErrorMessage(err);

        aiDebugLogger.log(sessionId, 'error', {
          message: getErrorMessage(err),
          stack: err instanceof Error ? err.stack?.slice(0, 500) : undefined,
          context: { phase: 'stream_processing' },
        });
      }

      if (error) {
        sessionChat.updateLastMessage((last) => ({
          ...last,
          role: 'error',
          loading: false,
          content: {
            ...last.content,
            content: t(result),
          },
        }));
      }

      await loadMessages(sessionId);
    },
    [getSessionChat, loadMessages, t, updateToolCallInvokeStatus],
  );

  const sendMessages = async ({
    sessionId,
    aiEmployee,
    systemMessage,
    messages: sendMsgs,
    attachments,
    workContext,
    editingMessageId,
    onConversationCreate,
    skillSettings,
    webSearch,
    model: inputModel,
  }: SendOptions & {
    onConversationCreate?: (sessionId: string) => void;
  }) => {
    if (!sendMsgs.length) return;
    const draftSessionId = sessionId;
    let targetSessionId = sessionId;
    let sessionChat = getSessionChat(targetSessionId);
    sessionChat.setBackgroundWorking(false);

    // Read model from store at call time to avoid stale closure
    const model = inputModel ?? useChatBoxStore.getState().model;

    // [AI_DEBUG] request
    aiDebugLogger.log(
      sessionId || 'pending',
      'request',
      {
        action: 'sendMessages',
        employeeId: aiEmployee?.username,
        model: model?.model,
        messagesCount: sendMsgs.length,
        hasAttachments: attachments?.length > 0,
        hasContext: workContext?.length > 0,
        editingMessageId,
      },
      { employeeId: aiEmployee?.username, employeeName: aiEmployee?.nickname },
    );
    const sessionMessages = sessionChat.messages;
    const renderedSessionMessages = flattenMessages(sessionMessages);
    const last = sessionMessages[sessionMessages.length - 1];
    if (last?.role === 'error') {
      sessionChat.setMessages((prev) => prev.slice(0, -1));
    }
    const lastRenderedMessage = renderedSessionMessages.at(-1);

    const parsedWorkContext = await parseWorkContext(app, workContext);
    const msgs = sendMsgs.map((msg, index) => ({
      key: randomId(),
      role: 'user',
      content: msg,
      attachments: index === 0 ? attachments : undefined,
      workContext: index === 0 ? parsedWorkContext : undefined,
    }));
    if (lastRenderedMessage?.type === 'conversation-group' && !isEditingMessage) {
      sessionChat.addSubAgentMessages(
        lastRenderedMessage.key,
        sendMsgs.map((msg, index) => ({
          key: randomId(),
          role: 'user',
          content: {
            ...msg,
            attachments: index === 0 ? attachments : undefined,
            workContext: index === 0 ? workContext : undefined,
          },
        })),
      );
    } else {
      sessionChat.addMessages(
        sendMsgs.map((msg, index) => ({
          key: randomId(),
          role: 'user',
          content: {
            ...msg,
            attachments: index === 0 ? attachments : undefined,
            workContext: index === 0 ? workContext : undefined,
          },
        })),
      );
    }

    if (!sessionId) {
      const createRes = await api.resource('aiConversations').create({
        values: {
          aiEmployee,
          systemMessage,
          skillSettings,
          modelSettings: model
            ? {
                llmService: model.llmService,
                model: model.model,
              }
            : undefined,
        },
      });
      const conversation = createRes?.data?.data;
      if (!conversation) return;
      sessionId = conversation.sessionId;
      targetSessionId = sessionId;
      chat.for(draftSessionId).migrateSessionState(sessionId);
      if (draftSessionId) {
        useChatToolCallStore.getState().migrateSessionState(draftSessionId, sessionId);
      }
      sessionChat = getSessionChat(sessionId);
      onConversationCreate?.(sessionId);
    }
    sessionChat.setWebSearching(null);
    sessionChat.setResponseLoading(true);

    if (lastRenderedMessage?.type === 'conversation-group' && !isEditingMessage) {
      sessionChat.addSubAgentMessage(lastRenderedMessage.key, {
        key: randomId(),
        role: lastRenderedMessage.roleName,
        content: { type: 'text', content: '' },
        loading: true,
      });
    } else {
      sessionChat.addMessage({
        key: randomId(),
        role: aiEmployee.username,
        content: { type: 'text', content: '' },
        loading: true,
      });
    }

    const controller = new AbortController();
    sessionChat.setAbortController(controller);
    try {
      const sendRes = await api.request({
        url: 'aiConversations:sendMessages',
        method: 'POST',
        headers: { Accept: 'text/event-stream' },
        data: {
          aiEmployee: aiEmployee.username,
          sessionId,
          messages: msgs,
          systemMessage,
          editingMessageId,
          model,
          webSearch,
        },
        responseType: 'stream',
        adapter: 'fetch',
        signal: controller?.signal,
        skipNotify: (err: { name?: string }) => err.name === 'CanceledError',
      });

      if (!sendRes?.data) {
        sessionChat.setResponseLoading(false);
        return;
      }

      await processStreamResponse(sendRes.data, sessionId, aiEmployee);
    } catch (err) {
      if (getErrorName(err) === 'CanceledError') {
        sessionChat.setResponseLoading(false);
        sessionChat.setWebSearching(null);
        return;
      }
      sessionChat.setResponseLoading(false);
      throw err;
    } finally {
      sessionChat.setAbortController(null);
    }
  };

  const resendMessages = async ({ sessionId, messageId, aiEmployee, important }: ResendOptions) => {
    const sessionChat = getSessionChat(sessionId);
    const index = sessionChat.messages.findIndex((msg) => msg.key === messageId);
    sessionChat.setWebSearching(null);
    sessionChat.setBackgroundWorking(false);
    sessionChat.setResponseLoading(true);
    sessionChat.setMessages((prev) => [
      ...prev.slice(0, index),
      {
        key: randomId(),
        role: aiEmployee.username,
        content: {
          type: 'text',
          content: '',
        },
        loading: true,
      },
    ]);

    // Read model from store at call time to avoid stale closure.
    // If not ready yet, resolve it through shared model rules.
    let model = useChatBoxStore.getState().model;
    if (!model) {
      model = await ensureModelFromStore(aiEmployee?.username);
    }

    const controller = new AbortController();
    sessionChat.setAbortController(controller);
    try {
      const sendRes = await api.request({
        url: 'aiConversations:resendMessages',
        method: 'POST',
        headers: { Accept: 'text/event-stream' },
        data: { sessionId, messageId, model, important, webSearch: currentWebSearch },
        responseType: 'stream',
        adapter: 'fetch',
        signal: controller?.signal,
        skipNotify: (err: { name?: string }) => err.name === 'CanceledError',
      });

      if (!sendRes?.data) {
        sessionChat.setResponseLoading(false);
        return;
      }

      await processStreamResponse(sendRes.data, sessionId, aiEmployee);
    } catch (err) {
      if (getErrorName(err) === 'CanceledError') {
        sessionChat.setResponseLoading(false);
        sessionChat.setWebSearching(null);
        return;
      }
      sessionChat.setResponseLoading(false);
      throw err;
    } finally {
      sessionChat.setAbortController(null);
    }
  };

  const resumeStream = useCallback(
    async ({ sessionId, aiEmployee }: { sessionId: string; aiEmployee: AIEmployee }) => {
      if (!sessionId || !aiEmployee) {
        return;
      }

      const sessionChat = getSessionChat(sessionId);
      const last = sessionChat.messages[sessionChat.messages.length - 1];

      sessionChat.setBackgroundWorking(false);
      sessionChat.setResponseLoading(true);

      const controller = new AbortController();
      sessionChat.setAbortController(controller);
      try {
        const sendRes = await api.request({
          url: 'aiConversations:resumeStream',
          method: 'POST',
          headers: { Accept: 'text/event-stream' },
          data: { sessionId },
          responseType: 'stream',
          adapter: 'fetch',
          signal: controller.signal,
          skipNotify: (err: { name?: string }) => err.name === 'CanceledError',
        });

        if (!sendRes?.data) {
          sessionChat.setResponseLoading(false);
          return;
        }

        sessionChat.addMessage({
          key: randomId(),
          role: aiEmployee.username,
          content: { type: 'text', content: '' },
          loading: true,
        });

        await processStreamResponse(sendRes.data, sessionId, aiEmployee);
      } catch (err) {
        if (getErrorName(err) === 'CanceledError') {
          return;
        }
        sessionChat.setResponseLoading(false);
        throw err;
      } finally {
        sessionChat.setAbortController(null);
      }
    },
    [api, getSessionChat, processStreamResponse],
  );

  const cancelRequest = useCallback(async () => {
    const controller = abortController;
    if (!controller) {
      return;
    }
    controller.abort();
    setAbortController(null);
    await api.resource('aiConversations').abort({
      values: {
        sessionId: currentConversation,
      },
    });
    // sleep(500)
    await new Promise((resolve) => setTimeout(resolve, 500));
    loadMessages(currentConversation);
    setResponseLoading(false);
  }, [abortController, api, currentConversation, loadMessages, setAbortController, setResponseLoading]);

  const resumeToolCall = useCallback(
    async ({
      sessionId,
      messageId,
      aiEmployee,
      toolCallIds,
      toolCallResults,
    }: {
      sessionId: string;
      messageId: string;
      aiEmployee: AIEmployee;
      toolCallIds?: string[];
      toolCallResults?: { id: string; [key: string]: unknown }[];
    }) => {
      const sessionChat = getSessionChat(sessionId);
      sessionChat.setWebSearching(null);
      sessionChat.setBackgroundWorking(false);
      sessionChat.setResponseLoading(true);
      // Read model from store at call time to avoid stale closure.
      // If not ready yet, resolve it through shared model rules.
      let model = useChatBoxStore.getState().model;
      if (!model) {
        model = await ensureModelFromStore(aiEmployee?.username);
      }
      const controller = new AbortController();
      sessionChat.setAbortController(controller);
      try {
        const sendRes = await api.request({
          url: 'aiConversations:resumeToolCall',
          method: 'POST',
          headers: { Accept: 'text/event-stream' },
          data: { sessionId, messageId, toolCallIds, toolCallResults, model, webSearch: currentWebSearch },
          responseType: 'stream',
          adapter: 'fetch',
          signal: controller?.signal,
        });

        if (!sendRes?.data) {
          sessionChat.setResponseLoading(false);
          return;
        }

        await processStreamResponse(sendRes.data, sessionId, aiEmployee);
      } catch (err) {
        if (getErrorName(err) === 'CanceledError') {
          sessionChat.setResponseLoading(false);
          sessionChat.setWebSearching(null);
          return;
        }
        sessionChat.setResponseLoading(false);
        throw err;
      } finally {
        sessionChat.setAbortController(null);
      }
    },
    [api, currentWebSearch, ensureModelFromStore, getSessionChat, processStreamResponse],
  );

  const loadMoreMessages = useCallback(async () => {
    const sessionChat = getSessionChat(currentConversation);
    if (sessionChat.messagesLoading || !sessionChat.messagesMeta?.hasMore) {
      return;
    }
    await loadMessages(currentConversation, sessionChat.messagesMeta?.cursor);
  }, [currentConversation, getSessionChat, loadMessages]);
  const { ref: lastMessageRef } = useLoadMoreObserver({ loadMore: loadMoreMessages });

  const updateToolArgs = useCallback(
    async ({ sessionId, messageId, tool }) => {
      await api.resource('aiConversations').updateToolArgs({
        values: {
          sessionId,
          messageId,
          tool,
        },
      });
      loadMessages(sessionId);
    },
    [api, loadMessages],
  );

  const startEditingMessage = useCallback(
    (msg: { messageId: string; attachments?: Attachment[]; workContext?: ContextItem[] }) => {
      const currentMessages = messages;
      const index = currentMessages.findIndex((m) => m.key === msg.messageId);
      setIsEditingMessage(true);
      setEditingMessageId(msg.messageId);
      setMessages(currentMessages.slice(0, index));
      if (msg.attachments) {
        setAttachments(msg.attachments);
      }
      if (msg.workContext) {
        setContextItems(msg.workContext);
      }
    },
    [messages, setAttachments, setContextItems, setEditingMessageId, setIsEditingMessage, setMessages],
  );

  const finishEditingMessage = useCallback(() => {
    setIsEditingMessage(false);
    setEditingMessageId(undefined);
    setAttachments([]);
    setContextItems([]);
  }, [setAttachments, setContextItems, setEditingMessageId, setIsEditingMessage]);

  return {
    syncContextAttachments,
    loadMessages,
    loadMoreMessages,
    sendMessages,
    resendMessages,
    resumeStream,
    getConversationLLMActiveState,
    cancelRequest,
    resumeToolCall,
    updateToolArgs,
    lastMessageRef,
    startEditingMessage,
    finishEditingMessage,
  };
};
