import { Chat } from "@ai-sdk/react";
import {
  useCallback,
  useRef,
  type Dispatch,
  type MutableRefObject,
} from "react";
import type { AIChatAction, AIChatState } from "./chat-reducer";
import { NocoBaseChatTransport } from "./chat-transport";
import { findAIModel, getAIModelKey } from "./model";
import type { useAI } from "./ai-provider";
import {
  AI_DRAFT_CONVERSATION_ID,
  type AIChatMessage,
  type AIChatTaskRuntime,
} from "./types";

type AIContextValue = ReturnType<typeof useAI>;

export type AIConversationRuntimeContext = {
  employeeUsername: string;
  model: string;
  task?: AIChatTaskRuntime;
};

export function useChatRuntime({
  id,
  ai,
  stateRef,
  taskRuntimeRef,
  webSearchRef,
  conversationFinishedHandlerRef,
  moveAttachments,
  moveWorkContext,
  dispatch,
}: {
  id: string;
  ai: AIContextValue;
  stateRef: MutableRefObject<AIChatState>;
  taskRuntimeRef: MutableRefObject<AIChatTaskRuntime | undefined>;
  webSearchRef: MutableRefObject<boolean>;
  conversationFinishedHandlerRef: MutableRefObject<
    | ((conversationId: string, chat: Chat<AIChatMessage>) => Promise<void>)
    | undefined
  >;
  moveAttachments: (from: string, to: string) => void;
  moveWorkContext: (from: string, to: string) => void;
  dispatch: Dispatch<AIChatAction>;
}) {
  const chatsRef = useRef(new Map<string, Chat<AIChatMessage>>());
  const transportsRef = useRef(new Map<string, NocoBaseChatTransport>());
  const runtimeContextsRef = useRef(
    new Map<string, AIConversationRuntimeContext>()
  );

  const getRuntimeContext = useCallback(
    (conversationId: string): AIConversationRuntimeContext => {
      const existing = runtimeContextsRef.current.get(conversationId);
      if (existing) return existing;

      const latestState = stateRef.current;
      const conversation = latestState.conversations.find(
        (item) => item.id === conversationId
      );
      const conversationModel = conversation?.model
        ? ai.models.find(
            (item) =>
              item.value === conversation.model?.model &&
              (!conversation.model.llmService ||
                item.llmService === conversation.model.llmService)
          )
        : undefined;
      const context = {
        employeeUsername:
          conversation?.employeeUsername ??
          latestState.selectedEmployeeUsername,
        model: conversationModel
          ? getAIModelKey(conversationModel)
          : latestState.selectedModel,
        task:
          conversationId === AI_DRAFT_CONVERSATION_ID
            ? taskRuntimeRef.current
            : undefined,
      };
      runtimeContextsRef.current.set(conversationId, context);
      return context;
    },
    [ai.models, stateRef, taskRuntimeRef]
  );

  const getChat = useCallback(
    (conversationId: string) => {
      const existing = chatsRef.current.get(conversationId);
      if (existing) return existing;

      let runtimeConversationId = conversationId;
      const transport = ai.createTransport({
        chatId: `${id}:${conversationId}`,
        getContext: () => {
          const runtimeContext = getRuntimeContext(runtimeConversationId);
          const employee =
            ai.employees.find(
              (item) => item.username === runtimeContext.employeeUsername
            ) ?? ai.employees[0];
          const model =
            findAIModel(ai.models, runtimeContext.model) ?? ai.models[0];
          if (!employee || !model) {
            throw new Error(
              "AIProvider requires at least one employee and model"
            );
          }
          const task = runtimeContext.task;
          return {
            sessionId:
              runtimeConversationId === AI_DRAFT_CONVERSATION_ID
                ? undefined
                : runtimeConversationId,
            employee,
            model,
            task: task
              ? {
                  ...task,
                  webSearch: task.webSearch ?? webSearchRef.current,
                }
              : webSearchRef.current
              ? { workContext: [], webSearch: true }
              : undefined,
          };
        },
        onSessionCreated: (sessionId) => {
          const previousConversationId = runtimeConversationId;
          chatsRef.current.delete(runtimeConversationId);
          chatsRef.current.set(sessionId, chat);
          if (transport instanceof NocoBaseChatTransport) {
            transportsRef.current.delete(previousConversationId);
            transportsRef.current.set(sessionId, transport);
          }
          const runtimeContext = runtimeContextsRef.current.get(
            previousConversationId
          );
          if (runtimeContext) {
            runtimeContextsRef.current.delete(previousConversationId);
            runtimeContextsRef.current.set(sessionId, runtimeContext);
          }
          moveAttachments(previousConversationId, sessionId);
          moveWorkContext(previousConversationId, sessionId);
          dispatch({
            type: "replace-conversation-id",
            from: runtimeConversationId,
            to: sessionId,
          });
          runtimeConversationId = sessionId;
        },
      });
      const chat = new Chat<AIChatMessage>({
        id: `${id}:${conversationId}`,
        messages: [],
        onFinish: () => {
          const finishedConversationId = runtimeConversationId;
          if (finishedConversationId === AI_DRAFT_CONVERSATION_ID) {
            return;
          }
          queueMicrotask(() => {
            void conversationFinishedHandlerRef.current?.(
              finishedConversationId,
              chat
            );
          });
        },
        transport,
      });
      chatsRef.current.set(conversationId, chat);
      if (transport instanceof NocoBaseChatTransport) {
        transportsRef.current.set(conversationId, transport);
      }
      return chat;
    },
    [
      ai,
      conversationFinishedHandlerRef,
      dispatch,
      getRuntimeContext,
      id,
      moveAttachments,
      moveWorkContext,
      webSearchRef,
    ]
  );

  const getTransport = useCallback(
    (conversationId: string) => transportsRef.current.get(conversationId),
    []
  );

  const remove = useCallback((conversationId: string) => {
    chatsRef.current.delete(conversationId);
    transportsRef.current.delete(conversationId);
    runtimeContextsRef.current.delete(conversationId);
  }, []);

  return {
    chatsRef,
    transportsRef,
    runtimeContextsRef,
    getRuntimeContext,
    getChat,
    getTransport,
    remove,
  };
}
