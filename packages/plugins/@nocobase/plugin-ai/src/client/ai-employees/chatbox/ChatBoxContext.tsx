/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Conversation, Message, SendOptions, AIEmployee, TriggerTaskOptions } from '../types';
import { Avatar, GetProp, GetRef, Button, Alert, Popover } from 'antd';
import type { Sender } from '@ant-design/x';
import React, { useContext, useEffect, useState, useRef, useMemo, useCallback, createRef } from 'react';
import { Bubble } from '@ant-design/x';
import { AIEmployeesContext } from '../AIEmployeesProvider';
import { avatars } from '../avatars';
import { uid } from '@formily/shared';
import { useT } from '../../locale';
import { ProfileCard } from '../ProfileCard';
import { createContext, useContextSelector } from 'use-context-selector';
import { AIMessage, ErrorMessage, TaskMessage, UserMessage } from './MessageRenderer';
import { useChatMessages } from './ChatMessagesProvider';
import { useChatConversations } from './ChatConversationsProvider';
import { parseTask } from './utils';

type ChatBoxContextValues = {
  chatBoxRef: React.MutableRefObject<HTMLElement>;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  showConversations: boolean;
  setShowConversations: React.Dispatch<React.SetStateAction<boolean>>;
  currentEmployee: AIEmployee;
  setCurrentEmployee: React.Dispatch<React.SetStateAction<AIEmployee>>;
  roles: { [role: string]: any };
  senderValue: string;
  setSenderValue: React.Dispatch<React.SetStateAction<string>>;
  senderRef: React.MutableRefObject<GetRef<typeof Sender>>;
  senderPlaceholder: string;
  setSenderPlaceholder: React.Dispatch<React.SetStateAction<string>>;
  taskVariables: {
    variables?: Record<string, any>;
    localVariables?: Record<string, any>;
  };
  setTaskVariables: React.Dispatch<
    React.SetStateAction<{
      variables?: Record<string, any>;
      localVariables?: Record<string, any>;
    }>
  >;
  startNewConversation: () => void;
  triggerTask: (options: TriggerTaskOptions) => void;
  switchAIEmployee: (aiEmployee: AIEmployee) => void;
  send(opts: SendOptions): void;
  clear: () => void;
};

export const ChatBoxContext = createContext<ChatBoxContextValues>({} as any);

const defaultRoles: GetProp<typeof Bubble.List, 'roles'> = {
  user: {
    placement: 'end',
    styles: {
      content: {
        maxWidth: '80%',
        margin: '0 8px 0 0',
      },
    },
    variant: 'borderless',
    messageRender: (msg: any) => {
      return <UserMessage msg={msg} />;
    },
  },
  error: {
    placement: 'start',
    variant: 'borderless',
    messageRender: (msg: any) => <ErrorMessage msg={msg} />,
  },
  task: {
    placement: 'start',
    avatar: { icon: '', style: { visibility: 'hidden' } },
    variant: 'borderless',
    messageRender: (msg: any) => <TaskMessage msg={msg} />,
  },
};

const aiEmployeeRole = (aiEmployee: AIEmployee) => ({
  placement: 'start',
  avatar: aiEmployee.avatar ? (
    <Popover content={<ProfileCard aiEmployee={aiEmployee} />} placement="leftTop">
      <Avatar src={avatars(aiEmployee.avatar)} />
    </Popover>
  ) : null,
  typing: { step: 5, interval: 20 },
  variant: 'borderless',
  styles: {
    content: {
      width: '95%',
      margin: '8px 0',
      marginInlineEnd: 16,
    },
  },
  messageRender: (msg: any) => {
    return <AIMessage msg={msg} />;
  },
});

export const useSetChatBoxContext = () => {
  const t = useT();
  const { aiEmployees } = useContext(AIEmployeesContext);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<AIEmployee>(null);
  const { setMessages, sendMessages, setAttachments, setSystemMessage } = useChatMessages();
  const { currentConversation, setCurrentConversation, conversationsService } = useChatConversations();
  const [senderValue, setSenderValue] = useState<string>('');
  const [senderPlaceholder, setSenderPlaceholder] = useState<string>('');
  const senderRef = useRef<GetRef<typeof Sender>>(null);
  const [roles, setRoles] = useState<GetProp<typeof Bubble.List, 'roles'>>(defaultRoles);
  const [taskVariables, setTaskVariables] = useState<{
    variables?: Record<string, any>;
    localVariables?: Record<string, any>;
  }>({});
  const chatBoxRef = useRef<HTMLElement>(null);

  const clear = () => {
    setSenderValue('');
    setSystemMessage('');
    setAttachments([]);
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
      const { aiEmployee, tasks, variables, localVariables } = options;
      updateRole(aiEmployee);
      if (!open) {
        setOpen(true);
      }
      if (currentConversation) {
        setCurrentConversation(undefined);
        setMessages([]);
      }
      setCurrentEmployee(aiEmployee);
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
      if (tasks.length === 1) {
        setMessages(msgs);
        const task = tasks[0];
        const { userMessage, systemMessage, attachments } = await parseTask(task, variables, localVariables);
        if (userMessage && userMessage.type === 'text') {
          setSenderValue(userMessage.content);
        } else {
          setSenderValue('');
        }
        if (attachments) {
          setAttachments(attachments);
        }
        if (systemMessage) {
          setSystemMessage(systemMessage);
        }
        if (task.autoSend) {
          send({
            aiEmployee,
            systemMessage,
            messages: [userMessage],
            attachments,
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
    [open, currentConversation],
  );

  useEffect(() => {
    if (!aiEmployees) {
      return;
    }
    const roles = aiEmployees.reduce((prev, aiEmployee) => {
      return {
        ...prev,
        [aiEmployee.username]: aiEmployeeRole(aiEmployee),
      };
    }, {});
    setRoles((prev) => ({
      ...prev,
      ...roles,
    }));
  }, [aiEmployees]);

  useEffect(() => {
    senderRef.current?.focus();
  }, [currentEmployee]);

  useEffect(() => {
    if (open) {
      conversationsService.run();
      senderRef.current?.focus();
    }
  }, [open]);

  return {
    chatBoxRef,
    open,
    setOpen,
    expanded,
    setExpanded,
    showConversations,
    setShowConversations,
    currentEmployee,
    setCurrentEmployee,
    roles,
    senderRef,
    senderValue,
    setSenderValue,
    senderPlaceholder,
    setSenderPlaceholder,
    taskVariables,
    setTaskVariables,
    startNewConversation,
    triggerTask,
    switchAIEmployee,
    send,
    clear,
  };
};

export const useChatBoxContext = <K extends keyof ChatBoxContextValues>(name: K) => {
  return useContextSelector(ChatBoxContext, (v) => v[name]);
};
