/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback } from 'react';
import { AIEmployee, Attachment, ClearOptions, Message, SendOptions, TriggerTaskOptions } from '../../types';
import { useApp } from '@nocobase/client-v2';
import { randomId } from '@nocobase/flow-engine';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChat } from '../hooks/useChat';
import { useChatConversationActions } from './useChatConversationActions';
import { useChatMessageActions } from './useChatMessageActions';
import { useT } from '../../../locale';
import { parseTask } from '../utils';
import { aiEmployeeRole } from '../roles';
import { useChatToolsStore } from '../stores/chat-tools';
import { useWorkflowTasksStore } from '../stores/workflow-tasks';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { getAllModels, isSameModel, isValidModel, resolveModel } from '../model';

export const useChatBoxActions = () => {
  const app = useApp();
  const api = app.apiClient;
  const aiConfigRepository = useAIConfigRepository();
  const t = useT();

  const open = useChatBoxStore.use.open();
  const setOpen = useChatBoxStore.use.setOpen();
  const setReadonly = useChatBoxStore.use.setReadonly();
  const setSenderValue = useChatBoxStore.use.setSenderValue();
  const setTaskVariables = useChatBoxStore.use.setTaskVariables();
  const roles = useChatBoxStore.use.roles();
  const setRoles = useChatBoxStore.use.setRoles();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const setCurrentEmployee = useChatBoxStore.use.setCurrentEmployee();
  const senderRef = useChatBoxStore.use.senderRef();
  const setModel = useChatBoxStore.use.setModel();

  const setCurrentConversation = useChatConversationsStore.use.setCurrentConversation();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const setWebSearch = useChatConversationsStore.use.setWebSearch();
  const chat = useChat(currentConversation);
  const draftChat = useChat();

  const setOpenToolModal = useChatToolsStore.use.setOpenToolModal();
  const setActiveTool = useChatToolsStore.use.setActiveTool();
  const setActiveMessageId = useChatToolsStore.use.setActiveMessageId();
  const setCurrentWorkflowTask = useWorkflowTasksStore.use.setCurrentWorkflowTask();

  const { refresh: refreshConversations } = useChatConversationActions();
  const { sendMessages, syncContextAttachments } = useChatMessageActions();

  const clear = useCallback(
    (options?: ClearOptions, sessionId: string | undefined = currentConversation) => {
      const sessionChat = chat.for(sessionId);
      const {
        sender,
        systemMessage,
        attachments,
        contextItems,
        taskVariables,
        toolModal,
        activeTool,
        activeMessageId,
        skillSettings,
      } = options ?? {};
      if (sender !== false) {
        setSenderValue('');
      }
      if (systemMessage !== false) {
        sessionChat.setSystemMessage('');
      }
      if (attachments !== false) {
        sessionChat.setAttachments([]);
      }
      if (contextItems !== false) {
        sessionChat.setContextItems([]);
      }
      if (taskVariables !== false) {
        setTaskVariables({});
      }
      if (toolModal !== false) {
        setOpenToolModal(false);
      }
      if (activeTool !== false) {
        setActiveTool(null);
      }
      if (activeMessageId !== false) {
        setActiveMessageId('');
      }
      if (skillSettings !== false) {
        sessionChat.setSkillSettings(undefined);
      }
    },
    [chat, currentConversation, setActiveMessageId, setActiveTool, setOpenToolModal, setSenderValue, setTaskVariables],
  );

  const send = useCallback(
    (options: SendOptions) => {
      const sendOptions = {
        ...options,
        onConversationCreate: (sessionId: string) => {
          setCurrentConversation(sessionId);
          refreshConversations();
        },
      };
      clear();
      sendMessages(sendOptions);
    },
    [clear, refreshConversations, sendMessages, setCurrentConversation],
  );

  const updateRole = useCallback(
    (aiEmployee: AIEmployee) => {
      if (!roles[aiEmployee.username]) {
        setRoles((prev) => ({
          ...prev,
          [aiEmployee.username]: aiEmployeeRole(aiEmployee),
        }));
      }
    },
    [roles, setRoles],
  );

  const ensureModel = useCallback(
    async (aiEmployee: AIEmployee) => {
      const allModels = getAllModels(await aiConfigRepository.getLLMServices());
      const currentModel = useChatBoxStore.getState().model;
      const resolvedModel = resolveModel(api, aiEmployee, allModels, currentModel);
      if (!isSameModel(currentModel, resolvedModel)) {
        setModel(resolvedModel);
      }
      return resolvedModel;
    },
    [api, aiConfigRepository, setModel],
  );

  const resolveTaskModel = useCallback(
    async (aiEmployee: AIEmployee, taskModel?: { llmService: string; model: string } | null) => {
      const allModels = getAllModels(await aiConfigRepository.getLLMServices());
      if (!allModels.length) {
        const currentModel = useChatBoxStore.getState().model;
        if (currentModel) {
          setModel(null);
        }
        return null;
      }
      if (isValidModel(taskModel, allModels)) {
        const currentModel = useChatBoxStore.getState().model;
        if (!isSameModel(currentModel, taskModel)) {
          setModel(taskModel);
        }
        return taskModel;
      }
      const currentModel = useChatBoxStore.getState().model;
      const resolvedModel = resolveModel(api, aiEmployee, allModels, currentModel);
      if (!isSameModel(currentModel, resolvedModel)) {
        setModel(resolvedModel);
      }
      return resolvedModel;
    },
    [api, aiConfigRepository, setModel],
  );

  const startNewConversation = useCallback(() => {
    if (!currentEmployee) {
      setCurrentConversation(undefined);
      setCurrentWorkflowTask(undefined);
      clear(undefined, undefined);
      draftChat.setMessages([]);
      return;
    }
    const greetingMsg = {
      key: randomId(),
      role: currentEmployee.username,
      content: {
        type: 'greeting' as const,
        content: currentEmployee.greeting || t('Default greeting message', { nickname: currentEmployee.nickname }),
      },
    };
    setCurrentConversation(undefined);
    setCurrentWorkflowTask(undefined);
    clear(undefined, undefined);
    draftChat.setMessages([greetingMsg]);
    senderRef?.current?.focus();
  }, [clear, currentEmployee, draftChat, senderRef, setCurrentConversation, setCurrentWorkflowTask, t]);

  const switchAIEmployee = useCallback(
    (aiEmployee: AIEmployee, options?: { clear?: ClearOptions }) => {
      setCurrentEmployee(aiEmployee);
      setCurrentConversation(undefined);
      setCurrentWorkflowTask(undefined);
      clear(options?.clear, undefined);
      setModel(null);
      if (aiEmployee) {
        const greetingMsg = {
          key: randomId(),
          role: aiEmployee.username,
          content: {
            type: 'greeting' as const,
            content: aiEmployee.greeting || t('Default greeting message', { nickname: aiEmployee.nickname }),
          },
        };
        senderRef?.current?.focus();
        draftChat.setMessages([greetingMsg]);
      } else {
        draftChat.setMessages([]);
      }
    },
    [clear, draftChat, senderRef, setCurrentConversation, setCurrentEmployee, setCurrentWorkflowTask, setModel, t],
  );

  const triggerTask = useCallback(
    async (options: TriggerTaskOptions) => {
      clear(undefined, undefined);
      const { aiEmployee, tasks } = options;
      if (!aiEmployee) {
        setCurrentEmployee(undefined);
        draftChat.setMessages([]);
        return;
      }
      updateRole(aiEmployee);
      setReadonly(false);
      draftChat.setResponseLoading(false);
      if (!open) {
        setOpen(true);
      }
      if (currentConversation) {
        setCurrentConversation(undefined);
        setCurrentWorkflowTask(undefined);
        draftChat.setMessages([]);
      }
      setCurrentEmployee(aiEmployee);
      await ensureModel(aiEmployee);
      senderRef?.current?.focus();
      const msgs: Message[] = [
        {
          key: randomId(),
          role: aiEmployee.username,
          content: {
            type: 'greeting',
            content: aiEmployee.greeting || t('Default greeting message', { nickname: aiEmployee.nickname }),
          },
        },
      ];
      if (!tasks?.length) {
        draftChat.setMessages(msgs);
        return;
      }
      if (tasks.length === 1 && options.auto !== false) {
        draftChat.setMessages(msgs);
        const task = tasks[0];
        const {
          userMessage,
          systemMessage,
          attachments,
          workContext,
          skillSettings,
          webSearch,
          model: taskModel,
        } = await parseTask(task);
        const resolvedModel = await resolveTaskModel(aiEmployee, taskModel);
        const service = (await aiConfigRepository.getLLMServices()).find(
          (s) => s.llmService === resolvedModel?.llmService,
        );
        const resolvedWebSearch =
          service?.supportWebSearch === false ? false : typeof webSearch === 'boolean' ? webSearch : false;
        setWebSearch(resolvedWebSearch);
        if (userMessage && userMessage.type === 'text') {
          setSenderValue(userMessage.content);
        } else {
          setSenderValue('');
        }
        let contextAttachments: Attachment[] = [];
        if (workContext) {
          draftChat.setContextItems(workContext);
          contextAttachments = syncContextAttachments(workContext);
        }
        const resolvedAttachments = [...(attachments ?? []), ...contextAttachments];
        if (resolvedAttachments.length) {
          draftChat.setAttachments(resolvedAttachments);
        }
        if (systemMessage) {
          draftChat.setSystemMessage(systemMessage);
        }
        if (skillSettings) {
          draftChat.setSkillSettings(skillSettings);
        }
        if (task.autoSend) {
          send({
            aiEmployee,
            systemMessage,
            messages: [userMessage ?? { type: 'text', content: '' }],
            attachments: resolvedAttachments.length ? resolvedAttachments : undefined,
            workContext: workContext ?? [],
            skillSettings,
            webSearch: resolvedWebSearch,
            model: resolvedModel,
          });
        }
        return;
      }
      msgs.push({
        key: randomId(),
        role: 'task',
        content: {
          content: tasks,
        },
      });
      draftChat.setMessages(msgs);
    },
    [
      open,
      currentConversation,
      clear,
      draftChat,
      ensureModel,
      aiConfigRepository,
      resolveTaskModel,
      send,
      senderRef,
      setCurrentConversation,
      setCurrentEmployee,
      setCurrentWorkflowTask,
      setOpen,
      setReadonly,
      setSenderValue,
      setWebSearch,
      syncContextAttachments,
      t,
      updateRole,
    ],
  );

  return {
    clear,
    send,
    startNewConversation,
    switchAIEmployee,
    triggerTask,
  };
};
