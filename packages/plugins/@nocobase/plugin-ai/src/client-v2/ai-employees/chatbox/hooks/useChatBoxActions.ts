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
import { useChat } from '../hooks/useChat';
import { useChatConversationActions } from './useChatConversationActions';
import { useChatMessageActions } from './useChatMessageActions';
import { useT } from '../../../locale';
import { parseTask } from '../utils';
import { aiEmployeeRole } from '../roles';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { getAllModels, isSameModel, isValidModel, resolveModel } from '../model';
import { type ChatBoxRuntime, useResolvedChatBoxRuntime } from '../stores/runtime';

export const useChatBoxActions = (runtime?: ChatBoxRuntime) => {
  const app = useApp();
  const api = app.apiClient;
  const aiConfigRepository = useAIConfigRepository();
  const t = useT();
  const resolvedRuntime = useResolvedChatBoxRuntime(runtime);
  const { chatBoxModel, chatConversationModel, chatSenderModel, chatToolModel, workflowTaskModel } = resolvedRuntime;

  const currentConversation = chatConversationModel.currentConversation;
  const chat = useChat(currentConversation, resolvedRuntime);
  const draftChat = useChat(undefined, resolvedRuntime);

  const { refresh: refreshConversations } = useChatConversationActions(resolvedRuntime);
  const { sendMessages, syncContextAttachments } = useChatMessageActions(resolvedRuntime);

  const clear = useCallback(
    (options?: ClearOptions, sessionId: string | undefined = chatConversationModel.currentConversation) => {
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
        chatSenderModel.setSenderValue('');
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
    [chat, chatBoxModel, chatConversationModel, chatSenderModel, chatToolModel],
  );

  const send = useCallback(
    (options: SendOptions) => {
      const scope = options.scope === undefined ? resolvedRuntime.scope : options.scope;
      const sendOptions = {
        ...options,
        scope,
        onConversationCreate: (sessionId: string) => {
          chatConversationModel.setCurrentConversation(sessionId);
          refreshConversations();
        },
      };
      clear();
      sendMessages(sendOptions);
    },
    [chatConversationModel, clear, refreshConversations, resolvedRuntime.scope, sendMessages],
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
      chatConversationModel.setCurrentConversation(undefined);
      workflowTaskModel.setCurrentWorkflowTask(undefined);
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
    chatConversationModel.setCurrentConversation(undefined);
    workflowTaskModel.setCurrentWorkflowTask(undefined);
    clear(undefined, undefined);
    draftChat.setMessages([greetingMsg]);
    chatSenderModel.senderRef?.current?.focus();
  }, [chatBoxModel, chatConversationModel, chatSenderModel, clear, draftChat, t, workflowTaskModel]);

  const switchAIEmployee = useCallback(
    (aiEmployee: AIEmployee, options?: { clear?: ClearOptions }) => {
      chatBoxModel.setCurrentEmployee(aiEmployee);
      chatConversationModel.setCurrentConversation(undefined);
      workflowTaskModel.setCurrentWorkflowTask(undefined);
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
        chatSenderModel.senderRef?.current?.focus();
        draftChat.setMessages([greetingMsg]);
      } else {
        draftChat.setMessages([]);
      }
    },
    [chatBoxModel, chatConversationModel, chatSenderModel, clear, draftChat, t, workflowTaskModel],
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
      if (chatConversationModel.currentConversation) {
        chatConversationModel.setCurrentConversation(undefined);
        workflowTaskModel.setCurrentWorkflowTask(undefined);
        draftChat.setMessages([]);
      }
      chatBoxModel.setCurrentEmployee(aiEmployee);
      await ensureModel(aiEmployee);
      chatSenderModel.senderRef?.current?.focus();
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
        chatConversationModel.setWebSearch(resolvedWebSearch);
        if (userMessage && userMessage.type === 'text') {
          chatSenderModel.setSenderValue(userMessage.content);
        } else {
          chatSenderModel.setSenderValue('');
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
            scope: options.scope === undefined ? resolvedRuntime.scope : options.scope,
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
      chatSenderModel,
      resolveTaskModel,
      send,
      resolvedRuntime.scope,
      chatConversationModel,
      syncContextAttachments,
      t,
      updateRole,
      workflowTaskModel,
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
