import type { Chat } from '@ai-sdk/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { aiChatReducer, createAIChatState } from './chat-reducer.js';
import {
  AIChatContext,
  AIChatMessagesContext,
  AIChatStatusContext,
  type AIChatBaseContextValue,
  type AIChatMessagesContextValue,
  type AIChatStatusContextValue,
} from './chat-context.js';
import {
  createAIChatTaskRuntime,
  findAIChatTaskModel,
  findTriggeredAIEmployee,
  getConfiguredAIChatTaskSet,
  getTriggeredAIEmployeeTask,
  getTriggeredAIWorkContext,
  type AIChatTaskSet,
} from './chat-task-utils.js';
import {
  useAIChatControllerState,
  type AIChatController,
} from './chat-controller.js';
import { useAI } from './ai-context.js';
import {
  getAIModelKey,
  getEmployeeModels,
  resolveEmployeeModel,
} from './model.js';
import { useChatAttachments } from './use-chat-attachments.js';
import {
  useChatMessageActions,
  type AIMessageEditingSnapshot,
} from './use-chat-message-actions.js';
import { useChatWorkContext } from './use-chat-work-context.js';
import { useChatState } from './use-chat-state.js';
import { useConversationCatalog } from './use-conversation-catalog.js';
import { useConversationHistory } from './use-conversation-history.js';
import { useChatRuntime } from './use-chat-runtime.js';
import {
  getAIWorkContextRequiredTools,
  mergeAIRequiredTools,
} from './page-context-utils.js';
import {
  useAIPageContextResolver,
  useAIPageContextScope,
} from './page-context-store.js';
import {
  AI_DRAFT_CONVERSATION_ID,
  type AIChatMessage,
  type AIChatTaskRuntime,
  type AIConversation,
  type AIEmployee,
  type AIEmployeeTask,
  type AIEmployeeTasks,
  type AIEmployeeTaskTrigger,
  type AIModel,
  type AIWorkContextItem,
} from './types.js';

const EMPTY_TASKS: AIEmployeeTask[] = [];
const EMPTY_EMPLOYEE_TASKS: AIEmployeeTasks = {};
const UNAVAILABLE_EMPLOYEE: AIEmployee = {
  username: '__unavailable__',
  nickname: 'AI employee',
  position: 'Not configured',
  greeting: 'Configure an AI employee and model to start chatting.',
};
const UNAVAILABLE_MODEL: AIModel = {
  value: '__unavailable__',
  label: 'No enabled model',
  configured: false,
};

export type AIChatProviderProps = PropsWithChildren<{
  id: string;
  controller?: AIChatController;
  defaultEmployee?: string;
  defaultTasks?: AIEmployeeTask[];
  employeeTasks?: AIEmployeeTasks;
  webSearch?: boolean;
}>;

type PendingAIChatTask = {
  key: string;
  employeeUsername: string;
  task: AIEmployeeTask;
  auto: boolean;
};

export function AIChatProvider({
  id,
  controller,
  defaultEmployee,
  defaultTasks = EMPTY_TASKS,
  employeeTasks = EMPTY_EMPLOYEE_TASKS,
  webSearch = false,
  children,
}: AIChatProviderProps) {
  const ai = useAI();
  const resolvePageContext = useAIPageContextResolver();
  const inheritedPageContext = useAIPageContextScope();
  const { open: chatSurfaceOpen } = useAIChatControllerState(controller);
  const chatSurfaceOpenRef = useRef(chatSurfaceOpen);
  const { configurationStatus, listConversations } = ai;
  const defaultEmployeeUsername =
    ai.employees.find((employee) => employee.username === defaultEmployee)
      ?.username ??
    ai.employees[0]?.username ??
    '';
  const [state, dispatch] = useReducer(
    aiChatReducer,
    createAIChatState({
      conversations: [],
      employeeUsername: defaultEmployeeUsername,
      model: ai.models[0] ? getAIModelKey(ai.models[0]) : 'default',
    }),
  );
  const conversationFinishedHandlerRef =
    useRef<
      (conversationId: string, chat: Chat<AIChatMessage>) => Promise<void>
    >(undefined);
  const [historyError, setHistoryError] = useState<Error>();
  const [interactionError, setInteractionError] = useState<Error>();
  const interactionVersionRef = useRef(0);
  const invalidatePendingInteraction = useCallback(() => {
    interactionVersionRef.current += 1;
  }, []);
  const setConversationList = useCallback(
    (conversations: AIConversation[]) =>
      dispatch({ type: 'set-conversations', conversations }),
    [],
  );
  const {
    loading: conversationsLoading,
    search: conversationSearch,
    refresh: refreshConversationCatalog,
    searchConversations,
    updateCatalog: updateConversationCatalog,
  } = useConversationCatalog({
    configurationStatus,
    listConversations,
    onChange: setConversationList,
    onError: setHistoryError,
  });
  const {
    attachments,
    uploadingAttachments,
    uploadFiles,
    removeAttachment,
    setConversationAttachments,
    moveAttachments,
    removeConversationAttachments,
    getConversationAttachments,
  } = useChatAttachments(state.activeConversationId);
  const {
    workContext,
    addWorkContext,
    removeWorkContext,
    setConversationWorkContext,
    moveWorkContext,
    removeConversationWorkContext,
    getConversationWorkContext,
  } = useChatWorkContext(state.activeConversationId);
  const [editingMessageId, setEditingMessageId] = useState<string>();
  const editingSnapshotRef = useRef<AIMessageEditingSnapshot | undefined>(
    undefined,
  );
  // `webSearch` is where the switch starts; the composer's toggle changes it
  // from there, and a new value of the prop starts it over.
  const [webSearchEnabled, setWebSearchEnabled] = useState(webSearch);
  const [webSearchProp, setWebSearchProp] = useState(webSearch);
  if (webSearchProp !== webSearch) {
    setWebSearchProp(webSearch);
    setWebSearchEnabled(webSearch);
  }
  const webSearchRef = useRef(webSearchEnabled);
  const taskRuntimeRef = useRef<AIChatTaskRuntime | undefined>(undefined);
  // A queued task is never rendered; it waits for the draft conversation and
  // the requested employee to become current. Keeping it in a ref with a
  // signal that wakes the effect keeps the queue out of the render output.
  // The ref is current the moment a task is queued, but an effect from a
  // render committed before that can still be waiting to run, with the
  // selections and sender of that render. Recording which signal queued the
  // task lets only an effect from a render that saw it take the task.
  const pendingTaskRef = useRef<PendingAIChatTask | undefined>(undefined);
  const queuedTaskSignalRef = useRef(0);
  const [pendingTaskSignal, setPendingTaskSignal] = useState(0);
  const queuePendingTask = useCallback((task?: PendingAIChatTask) => {
    const signal = queuedTaskSignalRef.current + 1;
    queuedTaskSignalRef.current = signal;
    pendingTaskRef.current = task;
    setPendingTaskSignal(signal);
  }, []);
  const getConfiguredTaskSet = useCallback(
    (employeeUsername: string) =>
      getConfiguredAIChatTaskSet({
        employeeUsername,
        defaultEmployeeUsername,
        defaultTasks,
        employeeTasks,
        inheritedContext: inheritedPageContext,
      }),
    [
      defaultEmployeeUsername,
      defaultTasks,
      employeeTasks,
      inheritedPageContext,
    ],
  );
  const [activeTaskSet, setActiveTaskSet] = useState<AIChatTaskSet | undefined>(
    () => getConfiguredTaskSet(defaultEmployeeUsername),
  );
  const [composerFocusRequest, requestComposerFocus] = useReducer(
    (request: number) => request + 1,
    0,
  );
  const stateRef = useRef(state);
  // The chat runtime reads these from callbacks that run after a commit, so
  // they are synchronized in an effect rather than written during render.
  useEffect(() => {
    chatSurfaceOpenRef.current = chatSurfaceOpen;
    stateRef.current = state;
    webSearchRef.current = webSearchEnabled;
  }, [chatSurfaceOpen, state, webSearchEnabled]);
  const {
    transportsRef,
    runtimeContextsRef,
    getRuntimeContext,
    getChat,
    getTransport,
    remove: removeChatRuntime,
  } = useChatRuntime({
    id,
    ai,
    stateRef,
    taskRuntimeRef,
    webSearchRef,
    conversationFinishedHandlerRef,
    moveAttachments,
    moveWorkContext,
    dispatch,
  });

  // The first selection is made on the first render, which can be before the
  // employees load; falling back to the default rather than to the first
  // employee keeps `defaultEmployee` honoured once they arrive.
  const configuredEmployee =
    ai.employees.find(
      (employee) => employee.username === state.selectedEmployeeUsername,
    ) ??
    ai.employees.find(
      (employee) => employee.username === defaultEmployeeUsername,
    ) ??
    ai.employees[0];
  const configuredModel = resolveEmployeeModel(
    ai.models,
    configuredEmployee,
    state.selectedModel,
  );
  const employeeModels = useMemo(
    () => getEmployeeModels(ai.models, configuredEmployee),
    [ai.models, configuredEmployee],
  );
  // A send checks the stored selections against the resolved ones, and the
  // request carries the stored ones, so they follow what the chat resolved:
  // the default employee once employees load after the chat mounted, and the
  // employee's first allowed model when the stored one is not allowed.
  const configuredEmployeeUsername = configuredEmployee?.username;
  useEffect(() => {
    if (
      configuredEmployeeUsername &&
      configuredEmployeeUsername !== state.selectedEmployeeUsername
    ) {
      dispatch({
        type: 'select-employee',
        username: configuredEmployeeUsername,
      });
    }
  }, [configuredEmployeeUsername, state.selectedEmployeeUsername]);
  const configuredModelKey = configuredModel
    ? getAIModelKey(configuredModel)
    : undefined;
  useEffect(() => {
    if (configuredModelKey && configuredModelKey !== state.selectedModel) {
      dispatch({ type: 'select-model', model: configuredModelKey });
    }
  }, [configuredModelKey, state.selectedModel]);
  const currentEmployee = configuredEmployee ?? UNAVAILABLE_EMPLOYEE;
  const currentModel = configuredModel ?? UNAVAILABLE_MODEL;
  const canSend = Boolean(
    configuredEmployee &&
    configuredModel &&
    configuredModel.configured !== false,
  );

  const getActiveConversationId = useCallback(
    () => stateRef.current.activeConversationId,
    [],
  );
  const markConversationRead = useCallback(
    (conversationId: string) =>
      dispatch({ type: 'mark-conversation-read', conversationId }),
    [],
  );
  const {
    invalidate: invalidateConversationHistory,
    load: loadConversationMessages,
    loadingId: messageLoadingId,
    refresh: refreshConversationMessages,
  } = useConversationHistory({
    chatSurfaceOpen,
    activeConversationId: state.activeConversationId,
    getActiveConversationId,
    getChat,
    getTransport,
    getConversationMessages: ai.getConversationMessages,
    getConversationActiveState: ai.getConversationActiveState,
    onMarkRead: markConversationRead,
    onError: setHistoryError,
  });

  const activeChat = getChat(state.activeConversationId);
  const chat = useChatState(activeChat);
  const draft = state.drafts[state.activeConversationId] ?? '';
  const activeConversation = state.conversations.find(
    (conversation) => conversation.id === state.activeConversationId,
  );

  const setDraft = useCallback(
    (value: string) => {
      dispatch({
        type: 'set-draft',
        conversationId: state.activeConversationId,
        value,
      });
    },
    [state.activeConversationId],
  );

  const sendText = useCallback(
    async (rawValue: string) => {
      const value = rawValue.trim();
      const operationVersion = interactionVersionRef.current + 1;
      interactionVersionRef.current = operationVersion;
      const currentState = stateRef.current;
      const currentId = currentState.activeConversationId;
      const employee =
        ai.employees.find(
          (item) => item.username === currentState.selectedEmployeeUsername,
        ) ?? ai.employees[0];
      const model = resolveEmployeeModel(
        ai.models,
        employee,
        currentState.selectedModel,
      );
      const conversation = currentState.conversations.find(
        (item) => item.id === currentId,
      );
      if (!employee || !model || model.configured === false) return;
      const currentAttachments = getConversationAttachments(currentId);
      const unresolvedWorkContext = getConversationWorkContext(currentId);
      if (
        currentAttachments.some(
          (attachment) => attachment.status === 'uploading',
        ) ||
        (!value &&
          !currentAttachments.some(
            (attachment) => attachment.status === 'done',
          ) &&
          !unresolvedWorkContext.length) ||
        activeChat.status === 'streaming' ||
        activeChat.status === 'submitted'
      )
        return;

      setInteractionError(undefined);
      let currentWorkContext: typeof unresolvedWorkContext;
      try {
        currentWorkContext = resolvePageContext
          ? await resolvePageContext(unresolvedWorkContext)
          : unresolvedWorkContext;
      } catch (error) {
        if (interactionVersionRef.current !== operationVersion) return;
        setInteractionError(
          error instanceof Error
            ? error
            : new Error('Unable to read the selected page context'),
        );
        return;
      }
      const latestState = stateRef.current;
      if (
        interactionVersionRef.current !== operationVersion ||
        latestState.activeConversationId !== currentId ||
        latestState.selectedEmployeeUsername !== employee.username ||
        latestState.selectedModel !== getAIModelKey(model) ||
        getConversationAttachments(currentId) !== currentAttachments ||
        getConversationWorkContext(currentId) !== unresolvedWorkContext
      ) {
        return;
      }

      const completedAttachments = currentAttachments.filter(
        (attachment) => attachment.status === 'done',
      );
      if (
        !value &&
        !completedAttachments.length &&
        !currentWorkContext.length
      ) {
        return;
      }
      const requiredTools = getAIWorkContextRequiredTools(currentWorkContext);
      const currentTask = taskRuntimeRef.current;
      const runtimeTask =
        currentTask || requiredTools.length
          ? {
              ...(currentTask ?? { workContext: [] }),
              skillSettings: mergeAIRequiredTools(
                currentTask?.skillSettings,
                requiredTools,
              ),
            }
          : undefined;
      runtimeContextsRef.current.set(currentId, {
        employeeUsername: employee.username,
        model: getAIModelKey(model),
        task: runtimeTask,
      });
      const title =
        value ||
        completedAttachments[0]?.filename ||
        currentWorkContext[0]?.title ||
        'New conversation';
      if (!conversation) {
        dispatch({
          type: 'add-conversation',
          conversation: {
            id: currentId,
            title: title.slice(0, 42),
            employeeUsername: employee.username,
            updatedAt: new Date().toISOString(),
          },
        });
      }

      dispatch({ type: 'set-draft', conversationId: currentId, value: '' });
      setConversationAttachments(currentId, []);
      setConversationWorkContext(currentId, []);
      const activeEditingMessageId = editingMessageId;
      setEditingMessageId(undefined);
      editingSnapshotRef.current = undefined;
      await activeChat.sendMessage({
        parts: [
          ...(value ? [{ type: 'text' as const, text: value }] : []),
          ...completedAttachments
            .filter((attachment) => attachment.url || attachment.preview)
            .map((attachment) => ({
              type: 'file' as const,
              mediaType: attachment.mimetype ?? 'application/octet-stream',
              filename: attachment.filename,
              url: attachment.url ?? attachment.preview ?? '',
            })),
        ],
        metadata: {
          createdAt: new Date().toISOString(),
          employeeUsername: employee.username,
          editingMessageId: activeEditingMessageId,
          attachments: completedAttachments,
          workContext: currentWorkContext,
        },
      });
    },
    [
      ai.employees,
      ai.models,
      activeChat,
      editingMessageId,
      getConversationAttachments,
      getConversationWorkContext,
      resolvePageContext,
      runtimeContextsRef,
      setConversationAttachments,
      setConversationWorkContext,
    ],
  );

  const send = useCallback(async () => {
    const value =
      stateRef.current.drafts[stateRef.current.activeConversationId] ?? '';
    await sendText(value);
  }, [sendText]);

  const {
    retryMessage,
    decideToolCall,
    startEditingMessage,
    cancelEditingMessage,
    clearAutomaticToolApproval,
    processAutomaticToolApprovals,
  } = useChatMessageActions({
    ai,
    activeChat,
    getChat,
    stateRef,
    chatSurfaceOpenRef,
    transportsRef,
    getRuntimeContext,
    refreshConversationMessages,
    setHistoryError,
    editingSnapshotRef,
    setEditingMessageId,
    getConversationAttachments,
    getConversationWorkContext,
    setConversationAttachments,
    setConversationWorkContext,
    dispatch,
    requestComposerFocus,
  });

  const handleConversationFinished = useCallback(
    async (conversationId: string, targetChat: Chat<AIChatMessage>) => {
      try {
        const updateRead =
          stateRef.current.activeConversationId === conversationId &&
          chatSurfaceOpenRef.current;
        await refreshConversationMessages(conversationId, targetChat, {
          updateRead,
        });
        await refreshConversationCatalog();
        await processAutomaticToolApprovals(conversationId, targetChat);
      } catch (error) {
        setHistoryError(
          error instanceof Error
            ? error
            : new Error('Unable to refresh the conversation'),
        );
      }
    },
    [
      processAutomaticToolApprovals,
      refreshConversationCatalog,
      refreshConversationMessages,
    ],
  );
  useEffect(() => {
    conversationFinishedHandlerRef.current = handleConversationFinished;
  }, [handleConversationFinished]);

  const startNewConversation = useCallback(() => {
    invalidatePendingInteraction();
    const snapshot = editingSnapshotRef.current;
    if (
      snapshot &&
      snapshot.conversationId === stateRef.current.activeConversationId
    ) {
      // Resolve the chat here rather than mutating the one this render closed
      // over: the store write belongs to the callback, not to the render.
      getChat(snapshot.conversationId).messages = snapshot.messages;
      setConversationAttachments(snapshot.conversationId, snapshot.attachments);
      setConversationWorkContext(snapshot.conversationId, snapshot.workContext);
    }
    removeChatRuntime(AI_DRAFT_CONVERSATION_ID);
    invalidateConversationHistory();
    taskRuntimeRef.current = undefined;
    setInteractionError(undefined);
    queuePendingTask(undefined);
    setEditingMessageId(undefined);
    editingSnapshotRef.current = undefined;
    setConversationAttachments(AI_DRAFT_CONVERSATION_ID, []);
    setConversationWorkContext(AI_DRAFT_CONVERSATION_ID, []);
    setActiveTaskSet(
      getConfiguredTaskSet(stateRef.current.selectedEmployeeUsername),
    );
    dispatch({ type: 'start-new-conversation' });
    requestComposerFocus();
  }, [
    getChat,
    getConfiguredTaskSet,
    invalidateConversationHistory,
    invalidatePendingInteraction,
    queuePendingTask,
    removeChatRuntime,
    setConversationAttachments,
    setConversationWorkContext,
  ]);

  const triggerTask = useCallback(
    async (options: AIEmployeeTaskTrigger) => {
      const operationVersion = interactionVersionRef.current + 1;
      interactionVersionRef.current = operationVersion;
      cancelEditingMessage();
      // A trigger that names no employee opens this chat's own default, the
      // same one the chat starts on, rather than whichever employee sorts first.
      if (!options.aiEmployee && !ai.employees.length) {
        if (options.open !== false) controller?.open();
        return;
      }
      const requestedEmployee = options.aiEmployee ?? defaultEmployeeUsername;
      const employee = findTriggeredAIEmployee(ai.employees, requestedEmployee);

      if (!employee) {
        const requested =
          typeof requestedEmployee === 'string'
            ? requestedEmployee
            : requestedEmployee.username;
        console.warn(`AI employee "${requested}" was not found.`);
        return;
      }

      if (options.open !== false) controller?.open();

      const task = getTriggeredAIEmployeeTask(options);
      const contextItems = getTriggeredAIWorkContext(
        options,
        task,
        inheritedPageContext,
      );
      let workContext: AIWorkContextItem[];
      try {
        setInteractionError(undefined);
        workContext = resolvePageContext
          ? await resolvePageContext(contextItems)
          : contextItems;
      } catch (error) {
        if (interactionVersionRef.current !== operationVersion) return;
        setInteractionError(
          error instanceof Error
            ? error
            : new Error('Unable to read the selected page context'),
        );
        return;
      }
      if (interactionVersionRef.current !== operationVersion) return;
      taskRuntimeRef.current = createAIChatTaskRuntime(task, workContext);

      removeChatRuntime(AI_DRAFT_CONVERSATION_ID);
      invalidateConversationHistory();
      setConversationAttachments(AI_DRAFT_CONVERSATION_ID, []);
      setConversationWorkContext(AI_DRAFT_CONVERSATION_ID, workContext);
      dispatch({ type: 'select-employee', username: employee.username });
      dispatch({ type: 'start-new-conversation' });

      const allowedModels = getEmployeeModels(ai.models, employee);
      const taskModel = findAIChatTaskModel(allowedModels, task);
      const resolvedModel = taskModel ?? allowedModels[0];
      if (resolvedModel) {
        dispatch({
          type: 'select-model',
          model: getAIModelKey(resolvedModel),
        });
      }

      if (task) {
        setActiveTaskSet(undefined);
        queuePendingTask({
          key: crypto.randomUUID(),
          employeeUsername: employee.username,
          task,
          auto: options.auto !== false,
        });
      } else if (options.tasks?.length) {
        queuePendingTask(undefined);
        setActiveTaskSet({
          employeeUsername: employee.username,
          tasks: options.tasks,
          context: options.context,
        });
      } else {
        queuePendingTask(undefined);
        setActiveTaskSet(getConfiguredTaskSet(employee.username));
      }
      requestComposerFocus();
    },
    [
      ai.employees,
      ai.models,
      cancelEditingMessage,
      controller,
      defaultEmployeeUsername,
      getConfiguredTaskSet,
      inheritedPageContext,
      invalidateConversationHistory,
      queuePendingTask,
      resolvePageContext,
      removeChatRuntime,
      setConversationAttachments,
      setConversationWorkContext,
    ],
  );

  useEffect(() => {
    const pendingTask = pendingTaskRef.current;
    if (
      !pendingTask ||
      pendingTaskSignal !== queuedTaskSignalRef.current ||
      state.activeConversationId !== AI_DRAFT_CONVERSATION_ID ||
      currentEmployee.username !== pendingTask.employeeUsername
    ) {
      return;
    }

    const userMessage =
      pendingTask.task.message?.user ?? pendingTask.task.title ?? '';
    pendingTaskRef.current = undefined;
    if (pendingTask.auto && pendingTask.task.autoSend && userMessage.trim()) {
      void sendText(userMessage);
      return;
    }
    dispatch({
      type: 'set-draft',
      conversationId: AI_DRAFT_CONVERSATION_ID,
      value: userMessage,
    });
  }, [
    currentEmployee.username,
    pendingTaskSignal,
    sendText,
    state.activeConversationId,
  ]);

  useEffect(() => {
    if (!controller) return;
    return controller.bindTaskHandler(triggerTask);
  }, [controller, triggerTask]);

  const runTask = useCallback(
    (task: AIEmployeeTask) => {
      if (!activeTaskSet) return;
      void triggerTask({
        aiEmployee: activeTaskSet.employeeUsername,
        task,
        context: activeTaskSet.context,
        auto: true,
        open: false,
      });
    },
    [activeTaskSet, triggerTask],
  );

  const removeConversation = useCallback(
    async (conversationId: string) => {
      if (stateRef.current.activeConversationId === conversationId) {
        invalidatePendingInteraction();
      }
      try {
        await ai.destroyConversation(conversationId);
      } catch (error) {
        const resolvedError =
          error instanceof Error
            ? error
            : new Error('Unable to delete conversation');
        setHistoryError(resolvedError);
        throw resolvedError;
      }
      removeChatRuntime(conversationId);
      clearAutomaticToolApproval(conversationId);
      removeConversationAttachments(conversationId);
      removeConversationWorkContext(conversationId);
      dispatch({ type: 'remove-conversation', conversationId });
      updateConversationCatalog((items) =>
        items.filter((conversation) => conversation.id !== conversationId),
      );
      if (stateRef.current.activeConversationId === conversationId) {
        removeChatRuntime(AI_DRAFT_CONVERSATION_ID);
        invalidateConversationHistory();
        taskRuntimeRef.current = undefined;
        queuePendingTask(undefined);
        setEditingMessageId(undefined);
        editingSnapshotRef.current = undefined;
        setConversationAttachments(AI_DRAFT_CONVERSATION_ID, []);
        setConversationWorkContext(AI_DRAFT_CONVERSATION_ID, []);
        setActiveTaskSet(
          getConfiguredTaskSet(stateRef.current.selectedEmployeeUsername),
        );
        dispatch({ type: 'start-new-conversation' });
        requestComposerFocus();
      }
    },
    [
      ai,
      clearAutomaticToolApproval,
      getConfiguredTaskSet,
      invalidateConversationHistory,
      invalidatePendingInteraction,
      queuePendingTask,
      removeConversationAttachments,
      removeConversationWorkContext,
      removeChatRuntime,
      setConversationAttachments,
      setConversationWorkContext,
      updateConversationCatalog,
    ],
  );

  const renameConversation = useCallback(
    async (conversationId: string, rawTitle: string) => {
      const title = rawTitle.trim();
      if (!title) return;
      const conversation = stateRef.current.conversations.find(
        (item) => item.id === conversationId,
      );
      if (!conversation || conversation.title === title) return;
      await ai.updateConversationTitle(conversationId, title);
      dispatch({ type: 'rename-conversation', conversationId, title });
      updateConversationCatalog((items) =>
        items.map((item) =>
          item.id === conversationId ? { ...item, title } : item,
        ),
      );
    },
    [ai, updateConversationCatalog],
  );

  const value = useMemo<AIChatBaseContextValue>(
    () => ({
      id,
      employees: ai.employees,
      models: employeeModels,
      currentEmployee,
      currentModel,
      canSend,
      activeConversation,
      activeConversationId: state.activeConversationId,
      conversations: state.conversations,
      conversationsLoading,
      conversationSearch,
      messagesLoading: messageLoadingId === state.activeConversationId,
      historyError,
      interactionError,
      conversationListOpen: state.conversationListOpen,
      availableTasks: activeTaskSet?.tasks ?? [],
      composerFocusRequest,
      draft,
      attachments,
      uploadingAttachments,
      webSearch: webSearchEnabled,
      workContext,
      editingMessageId,
      setDraft,
      uploadFiles,
      removeAttachment,
      setWebSearch: setWebSearchEnabled,
      addWorkContext,
      removeWorkContext,
      send,
      stop: () => activeChat.stop(),
      regenerate: () => activeChat.regenerate(),
      retryMessage,
      decideToolCall,
      startNewConversation,
      selectConversation: (conversationId) => {
        invalidatePendingInteraction();
        cancelEditingMessage();
        setInteractionError(undefined);
        taskRuntimeRef.current = undefined;
        queuePendingTask(undefined);
        setActiveTaskSet(undefined);
        const conversation = stateRef.current.conversations.find(
          (item) => item.id === conversationId,
        );
        if (conversation?.employeeUsername) {
          dispatch({
            type: 'select-employee',
            username: conversation.employeeUsername,
          });
        }
        if (conversation?.model) {
          const model = ai.models.find(
            (item) =>
              item.value === conversation.model?.model &&
              (!conversation.model.llmService ||
                item.llmService === conversation.model.llmService),
          );
          if (model) {
            dispatch({ type: 'select-model', model: getAIModelKey(model) });
          }
        }
        dispatch({ type: 'set-active-conversation', conversationId });
        void loadConversationMessages(conversationId);
        requestComposerFocus();
      },
      renameConversation,
      removeConversation,
      searchConversations,
      setConversationListOpen: (open) =>
        dispatch({ type: 'set-conversation-list-open', open }),
      selectEmployee: (username) => {
        invalidatePendingInteraction();
        cancelEditingMessage();
        setInteractionError(undefined);
        removeChatRuntime(AI_DRAFT_CONVERSATION_ID);
        invalidateConversationHistory();
        taskRuntimeRef.current = undefined;
        queuePendingTask(undefined);
        setActiveTaskSet(getConfiguredTaskSet(username));
        setConversationAttachments(AI_DRAFT_CONVERSATION_ID, []);
        setConversationWorkContext(AI_DRAFT_CONVERSATION_ID, []);
        dispatch({ type: 'select-employee', username });
        dispatch({ type: 'start-new-conversation' });
        requestComposerFocus();
      },
      selectModel: (model) => {
        invalidatePendingInteraction();
        dispatch({ type: 'select-model', model });
      },
      startEditingMessage,
      cancelEditingMessage,
      saveUserPrompt: (prompt) =>
        configuredEmployee
          ? ai.updateEmployeeUserPrompt(configuredEmployee.username, prompt)
          : Promise.resolve(),
      triggerTask,
      runTask,
      focusComposer: requestComposerFocus,
    }),
    [
      activeConversation,
      ai,
      activeChat,
      composerFocusRequest,
      conversationsLoading,
      conversationSearch,
      messageLoadingId,
      historyError,
      interactionError,
      attachments,
      uploadingAttachments,
      webSearchEnabled,
      workContext,
      editingMessageId,
      currentEmployee,
      currentModel,
      canSend,
      configuredEmployee,
      employeeModels,
      getConfiguredTaskSet,
      invalidateConversationHistory,
      invalidatePendingInteraction,
      queuePendingTask,
      draft,
      id,
      removeConversation,
      removeChatRuntime,
      searchConversations,
      renameConversation,
      removeAttachment,
      addWorkContext,
      removeWorkContext,
      setConversationAttachments,
      setConversationWorkContext,
      runTask,
      retryMessage,
      decideToolCall,
      send,
      setDraft,
      uploadFiles,
      startEditingMessage,
      cancelEditingMessage,
      loadConversationMessages,
      startNewConversation,
      triggerTask,
      state.activeConversationId,
      state.conversationListOpen,
      state.conversations,
      activeTaskSet,
    ],
  );

  const messagesValue = useMemo<AIChatMessagesContextValue>(
    () => ({ messages: chat.messages }),
    [chat.messages],
  );
  const statusValue = useMemo<AIChatStatusContextValue>(
    () => ({ status: chat.status, error: chat.error }),
    [chat.error, chat.status],
  );

  return (
    <AIChatContext.Provider value={value}>
      <AIChatStatusContext.Provider value={statusValue}>
        <AIChatMessagesContext.Provider value={messagesValue}>
          {children}
        </AIChatMessagesContext.Provider>
      </AIChatStatusContext.Provider>
    </AIChatContext.Provider>
  );
}
