/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  AttachmentProps,
  Conversation,
  Message,
  Action,
  SendOptions,
  AIEmployee,
  MessageType,
  ShortcutOptions,
} from '../types';
import { Avatar, GetProp, GetRef, Button, Alert, Space, Popover } from 'antd';
import type { Sender } from '@ant-design/x';
import React, { useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Bubble } from '@ant-design/x';
import { useAPIClient, useRequest } from '@nocobase/client';
import { AIEmployeesContext } from '../AIEmployeesProvider';
import { Attachment } from './Attachment';
import { ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import { avatars } from '../avatars';
import { useChatMessages } from './useChatMessages';
import { uid } from '@formily/shared';
import { useT } from '../../locale';
import { createForm, Form } from '@formily/core';
import { ProfileCard } from '../ProfileCard';
import { InfoFormMessage } from './InfoForm';
import { createContext, useContextSelector } from 'use-context-selector';

export const ChatBoxContext = createContext<{
  setOpen: (open: boolean) => void;
  open: boolean;
  currentEmployee: AIEmployee;
  setCurrentEmployee: React.Dispatch<React.SetStateAction<AIEmployee>>;
  conversations: {
    loading: boolean;
    data?: Conversation[];
    refresh: () => void;
  };
  currentConversation: string;
  setCurrentConversation: React.Dispatch<React.SetStateAction<string | undefined>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  roles: { [role: string]: any };
  responseLoading: boolean;
  senderValue: string;
  setSenderValue: React.Dispatch<React.SetStateAction<string>>;
  senderRef: React.MutableRefObject<GetRef<typeof Sender>>;
  senderPlaceholder: string;
  infoForm: Form;
  showInfoForm: boolean;
  switchAIEmployee: (aiEmployee: AIEmployee) => void;
  startNewConversation: () => void;
  triggerShortcut: (options: ShortcutOptions) => void;
  send(opts: SendOptions): void;
}>({} as any);

const defaultRoles: GetProp<typeof Bubble.List, 'roles'> = {
  user: {
    placement: 'end',
    styles: {
      content: {
        maxWidth: '400px',
      },
    },
    variant: 'borderless',
    messageRender: (msg: any) => {
      switch (msg.type) {
        case 'text':
          return <Bubble content={msg.content} />;
        default:
          return <Attachment {...msg} />;
      }
    },
  },
  error: {
    placement: 'start',
    variant: 'borderless',
    messageRender: (msg: any) => {
      return (
        <Alert
          message={
            <>
              {msg.content} <Button icon={<ReloadOutlined />} type="text" />
            </>
          }
          type="warning"
          showIcon
        />
      );
    },
  },
  info: {
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
    // variant: 'borderless',
    messageRender: (msg: any) => {
      return <InfoFormMessage values={msg.content} />;
    },
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
    switch (msg.type) {
      case 'greeting':
        return <Bubble content={msg.content} />;
      case 'text':
        return (
          <Bubble
            content={msg.content}
            footer={
              <Space>
                <Button color="default" variant="text" size="small" icon={<ReloadOutlined />} />
                <Button color="default" variant="text" size="small" icon={<CopyOutlined />} />
              </Space>
            }
          />
        );
    }
  },
});

export const useSetChatBoxContext = () => {
  const t = useT();
  const api = useAPIClient();
  const { aiEmployees } = useContext(AIEmployeesContext);
  const [open, setOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<AIEmployee>(null);
  const [currentConversation, setCurrentConversation] = useState<string>();
  const { messages, setMessages, responseLoading, addMessage, sendMessages } = useChatMessages();
  const [senderValue, setSenderValue] = useState<string>('');
  const [senderPlaceholder, setSenderPlaceholder] = useState<string>('');
  const senderRef = useRef<GetRef<typeof Sender>>(null);
  const [roles, setRoles] = useState<GetProp<typeof Bubble.List, 'roles'>>(defaultRoles);

  const infoForm = useMemo(() => createForm(), []);

  const conversations = useRequest<Conversation[]>(
    () =>
      api
        .resource('aiConversations')
        .list({
          sort: ['-updatedAt'],
        })
        .then((res) => res?.data?.data),
    {
      ready: open,
    },
  );

  const send = (options: SendOptions) => {
    const sendOptions = {
      ...options,
      onConversationCreate: (sessionId: string) => {
        setCurrentConversation(sessionId);
        conversations.refresh();
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

  const switchAIEmployee = useCallback(
    (aiEmployee: AIEmployee) => {
      const greetingMsg = {
        key: uid(),
        role: aiEmployee.username,
        content: {
          type: 'greeting',
          content: aiEmployee.greeting || t('Default greeting message', { nickname: aiEmployee.nickname }),
        },
      };
      setCurrentEmployee(aiEmployee);
      setSenderPlaceholder(aiEmployee.chatSettings?.senderPlaceholder);
      infoForm.reset();
      senderRef.current?.focus();
      if (!currentConversation) {
        setMessages([greetingMsg]);
      } else {
        addMessage(greetingMsg);
        setSenderValue('');
      }
    },
    [currentConversation, infoForm],
  );

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
      senderRef.current?.focus();
    }
  }, [open]);

  return {
    open,
    setOpen,
    currentEmployee,
    setCurrentEmployee,
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    setMessages,
    roles,
    responseLoading,
    senderRef,
    senderValue,
    setSenderValue,
    senderPlaceholder,
    showInfoForm: !!currentEmployee?.chatSettings?.infoForm?.length,
    infoForm,
    switchAIEmployee,
    startNewConversation,
    triggerShortcut,
    send,
  };
};

export const useChatBoxContext = (name: string) => {
  return useContextSelector(ChatBoxContext, (v) => v[name]);
};
