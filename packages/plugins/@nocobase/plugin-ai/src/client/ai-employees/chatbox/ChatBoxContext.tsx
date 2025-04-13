/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Conversation, Message, SendOptions, AIEmployee, ShortcutOptions } from '../types';
import { Avatar, GetProp, GetRef, Button, Alert, Popover } from 'antd';
import type { Sender } from '@ant-design/x';
import React, { useContext, useEffect, useState, useRef, useMemo, useCallback, createRef } from 'react';
import { Bubble } from '@ant-design/x';
import { useAPIClient } from '@nocobase/client';
import { AIEmployeesContext } from '../AIEmployeesProvider';
import { ReloadOutlined } from '@ant-design/icons';
import { avatars } from '../avatars';
import { uid } from '@formily/shared';
import { useT } from '../../locale';
import { createForm, Form } from '@formily/core';
import { ProfileCard } from '../ProfileCard';
import { createContext, useContextSelector } from 'use-context-selector';
import { AIMessage, ErrorMessage, UserMessage } from './MessageRenderer';
import { useChatMessages } from './ChatMessagesProvider';
import { useChatConversations } from './ChatConversationsProvider';

type ChatBoxContextValues = {
  setOpen: (open: boolean) => void;
  open: boolean;
  currentEmployee: AIEmployee;
  setCurrentEmployee: React.Dispatch<React.SetStateAction<AIEmployee>>;
  roles: { [role: string]: any };
  senderValue: string;
  setSenderValue: React.Dispatch<React.SetStateAction<string>>;
  senderRef: React.MutableRefObject<GetRef<typeof Sender>>;
  senderPlaceholder: string;
  setSenderPlaceholder: React.Dispatch<React.SetStateAction<string>>;
  infoForm: Form;
  showInfoForm: boolean;
  startNewConversation: () => void;
  triggerShortcut: (options: ShortcutOptions) => void;
  send(opts: SendOptions): void;
};

export const ChatBoxContext = createContext<ChatBoxContextValues>({} as any);

const defaultRoles: GetProp<typeof Bubble.List, 'roles'> = {
  user: {
    placement: 'end',
    styles: {
      content: {
        maxWidth: '80%',
        margin: '8px 8px 8px 0',
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
  action: {
    placement: 'start',
    avatar: { icon: '', style: { visibility: 'hidden' } },
    typing: { step: 5, interval: 20 },
    style: {
      maxWidth: 400,
      marginInlineEnd: 48,
    },
    styles: {
      footer: {
        width: '100%',
      },
    },
    variant: 'borderless',
    messageRender: (msg: any) => {
      return (
        <Button onClick={msg.onClick} icon={msg.icon}>
          {msg.content}
        </Button>
      );
    },
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
  style: {
    maxWidth: '80%',
    marginInlineEnd: 48,
    margin: '8px 0',
  },
  styles: {
    footer: {
      width: '100%',
    },
  },
  variant: 'borderless',
  messageRender: (msg: any) => {
    return <AIMessage msg={msg} />;
  },
});

export const useSetChatBoxContext = () => {
  const t = useT();
  const { aiEmployees } = useContext(AIEmployeesContext);
  const [open, setOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<AIEmployee>(null);
  const { setMessages, sendMessages } = useChatMessages();
  const { currentConversation, setCurrentConversation, conversationsService } = useChatConversations();
  const [senderValue, setSenderValue] = useState<string>('');
  const [senderPlaceholder, setSenderPlaceholder] = useState<string>('');
  const senderRef = useRef<GetRef<typeof Sender>>(null);
  const [roles, setRoles] = useState<GetProp<typeof Bubble.List, 'roles'>>(defaultRoles);

  const infoForm = useMemo(() => createForm(), []);

  const send = (options: SendOptions) => {
    const sendOptions = {
      ...options,
      onConversationCreate: (sessionId: string) => {
        setCurrentConversation(sessionId);
        conversationsService.run();
      },
    };
    const hasInfoFormValues = Object.values(infoForm?.values || []).filter(Boolean).length;
    if (hasInfoFormValues) {
      sendOptions.infoFormValues = { ...infoForm.values };
    }
    setSenderValue('');
    infoForm.reset();
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
    setCurrentConversation(undefined);
    setCurrentEmployee(null);
    setSenderValue('');
    infoForm.reset();
    setMessages([]);
    senderRef.current?.focus();
  }, [infoForm]);

  const triggerShortcut = useCallback(
    (options: ShortcutOptions) => {
      const { aiEmployee, message, infoFormValues, autoSend } = options;
      updateRole(aiEmployee);
      if (!open) {
        setOpen(true);
      }
      if (currentConversation) {
        setCurrentConversation(undefined);
        setMessages([]);
      }
      setCurrentEmployee(aiEmployee);
      if (message && message.type === 'text') {
        setSenderValue(message.content);
      } else {
        setSenderValue('');
      }
      setMessages([
        {
          key: uid(),
          role: aiEmployee.username,
          content: {
            type: 'greeting',
            content: aiEmployee.greeting || t('Default greeting message', { nickname: aiEmployee.nickname }),
          },
        },
      ]);
      senderRef.current?.focus();
      infoForm.setValues(infoFormValues);
      if (autoSend) {
        send({
          aiEmployee,
          messages: [message],
        });
      }
    },
    [open, currentConversation, infoForm],
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
    if (open) {
      conversationsService.run();
      senderRef.current?.focus();
    }
  }, [open]);

  return {
    open,
    setOpen,
    currentEmployee,
    setCurrentEmployee,
    roles,
    senderRef,
    senderValue,
    setSenderValue,
    senderPlaceholder,
    setSenderPlaceholder,
    showInfoForm: !!currentEmployee?.chatSettings?.infoForm?.length,
    infoForm,
    startNewConversation,
    triggerShortcut,
    send,
  };
};

export const useChatBoxContext = <K extends keyof ChatBoxContextValues>(name: K) => {
  return useContextSelector(ChatBoxContext, (v) => v[name]);
};
