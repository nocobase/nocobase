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
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChat } from '../hooks/useChat';
import { useChatConversationActions } from './useChatConversationActions';
import { useChatMessageActions } from './useChatMessageActions';
import { useT } from '../../../locale';
import { parseTask } from '../utils';
import { aiEmployeeRole } from '../roles';
import { useWorkflowTasksStore } from '../stores/workflow-tasks';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { getAllModels, isSameModel, isValidModel, resolveModel } from '../model';
import { type ChatBoxRuntime, useResolvedChatBoxRuntime } from '../stores/runtime';

export const useChatBoxActions = (runtime?: ChatBoxRuntime) => {
  const app = useApp();
  const api = app.apiClient;
  const aiConfigRepository = useAIConfigRepository();
  const t = useT();
  const resolvedRuntime = useResolvedChatBoxRuntime(runtime);
  const { chatBoxModel, chatToolModel } = resolvedRuntime;

  const setCurrentConversation = useChatConversationsStore.use.setCurrentConversation();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const setWebSearch = useChatConversationsStore.use.setWebSearch();
  const chat = useChat(currentConversation, resolvedRuntime);
  const draftChat = useChat(undefined, resolvedRuntime);

  const setCurrentWorkflowTask = useWorkflowTasksStore.use.setCurrentWorkflowTask();

  const { refresh: refreshConversations } = useChatConversationActions();
  const { sendMessages, syncContextAttachments } = useChatMessageActions(resolvedRuntime);

  const clear = useCallback(
    (
      options?: ClearOptions,
      sessionId: string | undefined = useChatConversationsStore.getState().currentConversation,
    ) => {
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
        chatBoxModel.setSenderValue('');
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
        chatBoxModel.setTaskVariables({});
      }
      if (toolModal !== false) {
        chatToolModel.setOpenToolModal(false);
      }
      if (activeTool !== false) {
        chatToolModel.setActiveTool(null);
      }
      if (activeMessageId !== false) {
        chatToolModel.setActiveMessageId('');
      }
      if (skillSettings !== false) {
        sessionChat.setSkillSettings(undefined);
      }
    },
    [chat, chatBoxModel, chatToolModel],
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
      if (!chatBoxModel.roles[aiEmployee.username]) {
        chatBoxModel.setRoles((prev) => ({
          ...prev,
          [aiEmployee.username]: aiEmployeeRole(aiEmployee),
        }));
      }
    },
    [chatBoxModel],
  );

  const ensureModel = useCallback(
    async (aiEmployee: AIEmployee) => {
      const allModels = getAllModels(await aiConfigRepository.getLLMServices());
      const currentModel = chatBoxModel.model;
      const resolvedModel = resolveModel(api, aiEmployee, allModels, currentModel);
      if (!isSameModel(currentModel, resolvedModel)) {
        chatBoxModel.setModel(resolvedModel);
      }
      return resolvedModel;
    },
    [api, aiConfigRepository, chatBoxModel],
  );

  const resolveTaskModel = useCallback(
    async (aiEmployee: AIEmployee, taskModel?: { llmService: string; model: string } | null) => {
      const allModels = getAllModels(await aiConfigRepository.getLLMServices());
      if (!allModels.length) {
        const currentModel = chatBoxModel.model;
        if (currentModel) {
          chatBoxModel.setModel(null);
        }
        return null;
      }
      if (isValidModel(taskModel, allModels)) {
        const currentModel = chatBoxModel.model;
        if (!isSameModel(currentModel, taskModel)) {
          chatBoxModel.setModel(taskModel);
        }
        return taskModel;
      }
      const currentModel = chatBoxModel.model;
      const resolvedModel = resolveModel(api, aiEmployee, allModels, currentModel);
      if (!isSameModel(currentModel, resolvedModel)) {
        chatBoxModel.setModel(resolvedModel);
      }
      return resolvedModel;
    },
    [api, aiConfigRepository, chatBoxModel],
  );

  const startNewConversation = useCallback(() => {
    const currentEmployee = chatBoxModel.currentEmployee;
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
    chatBoxModel.senderRef?.current?.focus();
  }, [chatBoxModel, clear, draftChat, setCurrentConversation, setCurrentWorkflowTask, t]);

  const switchAIEmployee = useCallback(
    (aiEmployee: AIEmployee, options?: { clear?: ClearOptions }) => {
      chatBoxModel.setCurrentEmployee(aiEmployee);
      setCurrentConversation(undefined);
      setCurrentWorkflowTask(undefined);
      clear(options?.clear, undefined);
      chatBoxModel.setModel(null);
      if (aiEmployee) {
        const greetingMsg = {
          key: randomId(),
          role: aiEmployee.username,
          content: {
            type: 'greeting' as const,
            content: aiEmployee.greeting || t('Default greeting message', { nickname: aiEmployee.nickname }),
          },
        };
        chatBoxModel.senderRef?.current?.focus();
        draftChat.setMessages([greetingMsg]);
      } else {
        draftChat.setMessages([]);
      }
    },
    [chatBoxModel, clear, draftChat, setCurrentConversation, setCurrentWorkflowTask, t],
  );

  const triggerTask = useCallback(
    async (options: TriggerTaskOptions) => {
      clear(undefined, undefined);
      const { aiEmployee, tasks } = options;
      if (!aiEmployee) {
        chatBoxModel.setCurrentEmployee(undefined);
        draftChat.setMessages([]);
        return;
      }
      updateRole(aiEmployee);
      chatBoxModel.setReadonly(false);
      draftChat.setResponseLoading(false);
      if (options.open !== false && !chatBoxModel.open) {
        chatBoxModel.setOpen(true);
      }
      if (useChatConversationsStore.getState().currentConversation) {
        setCurrentConversation(undefined);
        setCurrentWorkflowTask(undefined);
        draftChat.setMessages([]);
      }
      chatBoxModel.setCurrentEmployee(aiEmployee);
      await ensureModel(aiEmployee);
      chatBoxModel.senderRef?.current?.focus();
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
          chatBoxModel.setSenderValue(userMessage.content);
        } else {
          chatBoxModel.setSenderValue('');
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
      chatBoxModel,
      clear,
      draftChat,
      ensureModel,
      aiConfigRepository,
      resolveTaskModel,
      send,
      setCurrentConversation,
      setCurrentWorkflowTask,
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
