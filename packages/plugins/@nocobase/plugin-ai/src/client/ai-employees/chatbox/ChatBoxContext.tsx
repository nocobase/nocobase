/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AttachmentProps, Conversation, Message, Action, SendOptions, AIEmployee } from '../types';
import { Avatar, GetProp, GetRef, Button, Alert, Space } from 'antd';
import type { Sender } from '@ant-design/x';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Bubble } from '@ant-design/x';
import { useAPIClient, useRequest } from '@nocobase/client';
import { AIEmployeesContext } from '../AIEmployeesProvider';
import { Attachment } from './Attachment';
import { ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import { avatars } from '../avatars';
import { useChatMessages } from './useChatMessages';

export const ChatBoxContext = createContext<{
  setOpen: (open: boolean) => void;
  open: boolean;
  filterEmployee: string;
  setFilterEmployee: React.Dispatch<React.SetStateAction<string>>;
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
  attachments: AttachmentProps[];
  setAttachments: React.Dispatch<React.SetStateAction<AttachmentProps[]>>;
  actions: Action[];
  setActions: React.Dispatch<React.SetStateAction<Action[]>>;
  senderValue: string;
  setSenderValue: React.Dispatch<React.SetStateAction<string>>;
  senderRef: React.MutableRefObject<GetRef<typeof Sender>>;
  clear: () => void;
  send(opts: SendOptions): void;
}>({} as any);

const defaultRoles = {
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
  avatar: aiEmployee.avatar ? <Avatar src={avatars(aiEmployee.avatar)} /> : null,
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

export const useChatBoxContext = () => {
  const api = useAPIClient();
  const { aiEmployees } = useContext(AIEmployeesContext);
  const [openChatBox, setOpenChatBox] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [currentConversation, setCurrentConversation] = useState<string>();
  const { messages, setMessages, attachments, setAttachments, actions, setActions, responseLoading, sendMessages } =
    useChatMessages();
  const [senderValue, setSenderValue] = useState<string>('');
  const senderRef = useRef<GetRef<typeof Sender>>(null);
  const [roles, setRoles] = useState<GetProp<typeof Bubble.List, 'roles'>>(defaultRoles);
  const conversations = useRequest<Conversation[]>(
    () =>
      api
        .resource('aiConversations')
        .list({
          sort: ['-updatedAt'],
          ...(filterEmployee !== 'all'
            ? {
                filter: {
                  'aiEmployees.username': filterEmployee,
                },
              }
            : {}),
        })
        .then((res) => res?.data?.data),
    {
      ready: openChatBox,
      refreshDeps: [filterEmployee],
    },
  );

  const clear = () => {
    setCurrentConversation(undefined);
    setMessages([]);
    setAttachments([]);
    setActions([]);
    setSenderValue('');
    senderRef.current?.focus();
  };

  const send = async (options: SendOptions) => {
    setSenderValue('');
    const { aiEmployee } = options;
    if (!roles[aiEmployee.username]) {
      setRoles((prev) => ({
        ...prev,
        [aiEmployee.username]: aiEmployeeRole(aiEmployee),
      }));
    }
    sendMessages({
      ...options,
      onConversationCreate: (sessionId: string) => {
        setCurrentConversation(sessionId);
        conversations.refresh();
      },
    });
  };

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
    if (openChatBox) {
      senderRef.current?.focus();
    }
  }, [openChatBox]);

  return {
    open: openChatBox,
    setOpen: setOpenChatBox,
    filterEmployee,
    setFilterEmployee,
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    setMessages,
    roles,
    responseLoading,
    attachments,
    setAttachments,
    actions,
    setActions,
    senderRef,
    senderValue,
    setSenderValue,
    send,
    clear,
  };
};
