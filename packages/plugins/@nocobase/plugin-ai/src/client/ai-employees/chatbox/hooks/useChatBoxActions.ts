/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback } from 'react';
import { AIEmployee, Message, SendOptions, TriggerTaskOptions } from '../../types';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChatMessagesStore } from '../stores/chat-messages';
import { useChatConversationActions } from './useChatConversationActions';
import { useChatMessageActions } from './useChatMessageActions';
import { useT } from '../../../locale';
import { parseTask } from '../utils';
import { uid } from '@formily/shared';
import { aiEmployeeRole } from '../roles';
import { useChatToolsStore } from '../stores/chat-tools';
import { useAPIClient } from '@nocobase/client';
import { useLLMServicesRepository } from '../../../llm-services/hooks/useLLMServicesRepository';
import { getAllModels, isSameModel, isValidModel, resolveModel } from '../model';

export const useChatBoxActions = () => {
  const api = useAPIClient();
  const llmServicesRepository = useLLMServicesRepository();
  const t = useT();

  const open = useChatBoxStore.use.open();
  const setOpen = useChatBoxStore.use.setOpen();
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

  const setSystemMessage = useChatMessagesStore.use.setSystemMessage();
  const setAttachments = useChatMessagesStore.use.setAttachments();
  const setContextItems = useChatMessagesStore.use.setContextItems();
  const setMessages = useChatMessagesStore.use.setMessages();
  const setSkillSettings = useChatMessagesStore.use.setSkillSettings();

  const setOpenToolModal = useChatToolsStore.use.setOpenToolModal();
  const setActiveTool = useChatToolsStore.use.setActiveTool();
  const setActiveMessageId = useChatToolsStore.use.setActiveMessageId();

  const { conversationsService } = useChatConversationActions();
  const { sendMessages } = useChatMessageActions();

  const clear = () => {
    setSenderValue('');
    setSystemMessage('');
    setAttachments([]);
    setContextItems([]);
    setTaskVariables({});
    setOpenToolModal(false);
    setActiveTool(null);
    setActiveMessageId('');
    setSkillSettings(undefined);
  };

  const send = (options: SendOptions) => {
    const sendOptions = {
      ...options,
      onConversationCreate: (sessionId: string) => {
        setCurrentConversation(sessionId);
        conversationsService.run();
      },
    };
    clear();
    sendMessages(sendOptions);
  };

  const updateRole = (aiEmployee: AIEmployee) => {
    if (!roles[aiEmployee.username]) {
      setRoles((prev) => ({
        ...prev,
        [aiEmployee.username]: aiEmployeeRole(aiEmployee),
      }));
    }
  };

  const ensureModel = useCallback(
    async (aiEmployee: AIEmployee) => {
      await llmServicesRepository.load();
      const allModels = getAllModels(llmServicesRepository.services);
      const currentModel = useChatBoxStore.getState().model;
      const resolvedModel = resolveModel(api, aiEmployee.username, allModels, currentModel);
      if (!isSameModel(currentModel, resolvedModel)) {
        setModel(resolvedModel);
      }
      return resolvedModel;
    },
    [api, llmServicesRepository, setModel],
  );

  const resolveTaskModel = useCallback(
    async (aiEmployee: AIEmployee, taskModel?: { llmService: string; model: string } | null) => {
      await llmServicesRepository.load();
      const allModels = getAllModels(llmServicesRepository.services);
      if (isValidModel(taskModel, allModels)) {
        const currentModel = useChatBoxStore.getState().model;
        if (!isSameModel(currentModel, taskModel)) {
          setModel(taskModel);
        }
        return taskModel;
      }
      const currentModel = useChatBoxStore.getState().model;
      const resolvedModel = resolveModel(api, aiEmployee.username, allModels, currentModel);
      if (!isSameModel(currentModel, resolvedModel)) {
        setModel(resolvedModel);
      }
      return resolvedModel;
    },
    [api, llmServicesRepository, setModel],
  );

  const startNewConversation = useCallback(() => {
    const greetingMsg = {
      key: uid(),
      role: currentEmployee.username,
      content: {
        type: 'greeting' as const,
        content: currentEmployee.greeting || t('Default greeting message', { nickname: currentEmployee.nickname }),
      },
    };
    setCurrentConversation(undefined);
    clear();
    setMessages([greetingMsg]);
    senderRef.current?.focus();
  }, [currentEmployee]);

  const switchAIEmployee = useCallback(
    (aiEmployee: AIEmployee) => {
      setCurrentEmployee(aiEmployee);
      setCurrentConversation(undefined);
      clear();
      setModel(null);
      if (aiEmployee) {
        const greetingMsg = {
          key: uid(),
          role: aiEmployee.username,
          content: {
            type: 'greeting' as const,
            content: aiEmployee.greeting || t('Default greeting message', { nickname: aiEmployee.nickname }),
          },
        };
        senderRef.current?.focus();
        setMessages([greetingMsg]);
      } else {
        setMessages([]);
      }
    },
    [currentConversation],
  );

  const triggerTask = useCallback(
    async (options: TriggerTaskOptions) => {
      clear();
      const { aiEmployee, tasks } = options;
      updateRole(aiEmployee);
      if (!open) {
        setOpen(true);
      }
      if (currentConversation) {
        setCurrentConversation(undefined);
        setMessages([]);
      }
      setCurrentEmployee(aiEmployee);
      await ensureModel(aiEmployee);
      senderRef.current?.focus();
      const msgs: Message[] = [
        {
          key: uid(),
          role: aiEmployee.username,
          content: {
            type: 'greeting',
            content: aiEmployee.greeting || t('Default greeting message', { nickname: aiEmployee.nickname }),
          },
        },
      ];
      if (!tasks?.length) {
        setMessages(msgs);
        return;
      }
      if (tasks.length === 1 && options.auto !== false) {
        setMessages(msgs);
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
        const service = llmServicesRepository.services.find((s) => s.llmService === resolvedModel?.llmService);
        const resolvedWebSearch =
          service?.supportWebSearch === false ? false : typeof webSearch === 'boolean' ? webSearch : false;
        setWebSearch(resolvedWebSearch);
        if (userMessage && userMessage.type === 'text') {
          setSenderValue(userMessage.content);
        } else {
          setSenderValue('');
        }
        if (attachments) {
          setAttachments(attachments);
        }
        if (workContext) {
          setContextItems(workContext);
        }
        if (systemMessage) {
          setSystemMessage(systemMessage);
        }
        if (skillSettings) {
          setSkillSettings(skillSettings);
        }
        if (task.autoSend) {
          send({
            aiEmployee,
            systemMessage,
            messages: [userMessage ?? { type: 'text', content: '' }],
            attachments,
            workContext,
            skillSettings,
            webSearch: resolvedWebSearch,
            model: resolvedModel,
          });
        }
        return;
      }
      msgs.push({
        key: uid(),
        role: 'task',
        content: {
          content: tasks,
        },
      });
      setMessages(msgs);
    },
    [open, currentConversation, ensureModel, llmServicesRepository, resolveTaskModel, setWebSearch],
  );

  return {
    clear,
    send,
    startNewConversation,
    switchAIEmployee,
    triggerTask,
  };
};
