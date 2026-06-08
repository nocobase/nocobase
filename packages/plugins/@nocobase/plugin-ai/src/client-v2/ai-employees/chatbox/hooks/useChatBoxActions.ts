/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback } from 'react';
import { useApp } from '@nocobase/client-v2';
import { randomId } from '@nocobase/flow-engine';
import type { Attachment, AIEmployee, ClearOptions, Message, Task, TriggerTaskOptions } from '../../types';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { CHAT_DEFAULT_SESSION_KEY, useChatMessagesStore } from '../stores/chat-messages';

const getFilenameAttachments = (attachments?: Attachment[]) => {
  const result: Attachment[] = [];
  for (const attachment of attachments ?? []) {
    if (!attachment) {
      continue;
    }
    if (Array.isArray(attachment)) {
      for (const item of attachment) {
        if (item?.filename) {
          result.push(item);
        }
      }
      continue;
    }
    if (attachment.filename) {
      result.push(attachment);
    }
  }
  return result;
};

const parseTask = (task: Task) => {
  const message = task.message;
  return {
    userMessage: message?.user ? { type: 'text' as const, content: message.user } : undefined,
    systemMessage: message?.system,
    attachments: getFilenameAttachments(message?.attachments),
    workContext: message?.workContext,
    skillSettings: task.skillSettings,
    webSearch: task.webSearch,
    model: task.model,
  };
};

export const useChatBoxActions = () => {
  const app = useApp();
  const open = useChatBoxStore.use.open();
  const setOpen = useChatBoxStore.use.setOpen();
  const setReadonly = useChatBoxStore.use.setReadonly();
  const setSenderValue = useChatBoxStore.use.setSenderValue();
  const setTaskVariables = useChatBoxStore.use.setTaskVariables();
  const setCurrentEmployee = useChatBoxStore.use.setCurrentEmployee();
  const setModel = useChatBoxStore.use.setModel();
  const senderRef = useChatBoxStore.use.senderRef();

  const setCurrentConversation = useChatConversationsStore.use.setCurrentConversation();
  const setWebSearch = useChatConversationsStore.use.setWebSearch();

  const clear = useCallback(
    (options?: ClearOptions) => {
      const { sender, systemMessage, attachments, contextItems, taskVariables, skillSettings } = options ?? {};
      if (sender !== false) {
        setSenderValue('');
      }
      if (systemMessage !== false) {
        useChatMessagesStore.getState().setSessionSystemMessage(CHAT_DEFAULT_SESSION_KEY, '');
      }
      if (attachments !== false) {
        useChatMessagesStore.getState().setSessionAttachments(CHAT_DEFAULT_SESSION_KEY, []);
      }
      if (contextItems !== false) {
        useChatMessagesStore.getState().setSessionContextItems(CHAT_DEFAULT_SESSION_KEY, []);
      }
      if (taskVariables !== false) {
        setTaskVariables({});
      }
      if (skillSettings !== false) {
        useChatMessagesStore.getState().setSessionSkillSettings(CHAT_DEFAULT_SESSION_KEY, undefined);
      }
    },
    [setSenderValue, setTaskVariables],
  );

  const getDefaultGreeting = useCallback(
    (aiEmployee: AIEmployee) => {
      const fallback = `Hello, I am ${aiEmployee.nickname || aiEmployee.username}. How can I help you?`;
      return (
        aiEmployee.greeting ||
        app.i18n?.t?.('Default greeting message', {
          ns: ['@nocobase/plugin-ai', 'client'],
          nickname: aiEmployee.nickname,
          defaultValue: fallback,
        }) ||
        fallback
      );
    },
    [app],
  );

  const startNewConversation = useCallback(() => {
    const currentEmployee = useChatBoxStore.getState().currentEmployee;
    setCurrentConversation(undefined);
    clear(undefined);
    if (currentEmployee) {
      useChatMessagesStore.getState().setSessionMessages(CHAT_DEFAULT_SESSION_KEY, [
        {
          key: randomId(),
          role: currentEmployee.username,
          content: {
            type: 'greeting',
            content: getDefaultGreeting(currentEmployee),
          },
        },
      ]);
    }
    senderRef.current?.focus();
  }, [clear, getDefaultGreeting, senderRef, setCurrentConversation]);

  const switchAIEmployee = useCallback(
    (aiEmployee: AIEmployee, options?: { clear?: ClearOptions }) => {
      setCurrentEmployee(aiEmployee);
      setCurrentConversation(undefined);
      clear(options?.clear);
      setModel(null);
      if (aiEmployee) {
        useChatMessagesStore.getState().setSessionMessages(CHAT_DEFAULT_SESSION_KEY, [
          {
            key: randomId(),
            role: aiEmployee.username,
            content: {
              type: 'greeting',
              content: getDefaultGreeting(aiEmployee),
            },
          },
        ]);
        senderRef.current?.focus();
      } else {
        useChatMessagesStore.getState().setSessionMessages(CHAT_DEFAULT_SESSION_KEY, []);
      }
    },
    [clear, getDefaultGreeting, senderRef, setCurrentConversation, setCurrentEmployee, setModel],
  );

  const triggerTask = useCallback(
    async (options: TriggerTaskOptions) => {
      const { aiEmployee, tasks } = options;
      clear(undefined);
      setReadonly(false);
      useChatMessagesStore.getState().setSessionResponseLoading(CHAT_DEFAULT_SESSION_KEY, false);
      if (!open) {
        setOpen(true);
      }
      setCurrentConversation(undefined);
      setCurrentEmployee(aiEmployee);
      senderRef.current?.focus();

      const messages: Message[] = aiEmployee
        ? [
            {
              key: randomId(),
              role: aiEmployee.username,
              content: {
                type: 'greeting',
                content: getDefaultGreeting(aiEmployee),
              },
            },
          ]
        : [];

      if (!tasks?.length) {
        useChatMessagesStore.getState().setSessionMessages(CHAT_DEFAULT_SESSION_KEY, messages);
        return;
      }

      if (tasks.length === 1 && options.auto !== false) {
        const task = tasks[0];
        const { userMessage, systemMessage, attachments, workContext, skillSettings, webSearch, model } =
          parseTask(task);
        useChatMessagesStore.getState().setSessionMessages(CHAT_DEFAULT_SESSION_KEY, messages);
        setWebSearch(typeof webSearch === 'boolean' ? webSearch : false);
        setModel(model ?? null);
        setSenderValue(userMessage?.content ?? '');
        if (attachments?.length) {
          useChatMessagesStore.getState().setSessionAttachments(CHAT_DEFAULT_SESSION_KEY, attachments);
        }
        if (workContext) {
          useChatMessagesStore.getState().setSessionContextItems(CHAT_DEFAULT_SESSION_KEY, workContext);
        }
        if (systemMessage) {
          useChatMessagesStore.getState().setSessionSystemMessage(CHAT_DEFAULT_SESSION_KEY, systemMessage);
        }
        if (skillSettings) {
          useChatMessagesStore.getState().setSessionSkillSettings(CHAT_DEFAULT_SESSION_KEY, skillSettings);
        }
        return;
      }

      messages.push({
        key: randomId(),
        role: 'task',
        content: {
          content: tasks,
        },
      });
      useChatMessagesStore.getState().setSessionMessages(CHAT_DEFAULT_SESSION_KEY, messages);
    },
    [
      clear,
      getDefaultGreeting,
      open,
      senderRef,
      setCurrentConversation,
      setCurrentEmployee,
      setModel,
      setOpen,
      setReadonly,
      setSenderValue,
      setWebSearch,
    ],
  );

  return {
    clear,
    startNewConversation,
    switchAIEmployee,
    triggerTask,
  };
};
