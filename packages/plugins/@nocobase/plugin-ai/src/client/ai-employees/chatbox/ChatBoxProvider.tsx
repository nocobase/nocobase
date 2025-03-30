/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { FloatButton, Avatar, Typography, GetProp, GetRef, Button } from 'antd';
import type { BubbleProps, Sender } from '@ant-design/x';
import { Bubble } from '@ant-design/x';
import { CurrentUserContext, useAPIClient, useLocalVariables, useRequest, useVariables } from '@nocobase/client';
import { ChatBox } from './ChatBox';
import icon from '../icon.svg';
import { css } from '@emotion/css';
import { AIEmployee, AIEmployeesContext } from '../AIEmployeesProvider';
import { avatars } from '../avatars';
import { uid } from '@formily/shared';
import { useT } from '../../locale';
import { Attachment, AttachmentProps, AttachmentType } from './Attachment';
const { Paragraph } = Typography;

type Conversation = {
  sessionId: string;
  title: string;
  updatedAt: string;
};

type MessageType = 'text' | AttachmentType;
type Message = BubbleProps & { key?: string | number; role?: string };
type Action = {
  content: string;
  onClick: (content: string) => void;
};

type SendOptions = {
  sessionId?: string;
  greeting?: boolean;
  aiEmployee?: AIEmployee;
  messages: {
    type: MessageType;
    content: string;
  }[];
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
      case 'text':
        return <Bubble content={msg.content} />;
      case 'action':
        return <Button onClick={msg.onClick}>{msg.content}</Button>;
    }
  },
});

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
  senderRef: React.MutableRefObject<GetRef<typeof Sender>>;
  send(opts: SendOptions): void;
}>({} as any);

export const ChatBoxProvider: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const t = useT();
  const api = useAPIClient();
  const ctx = useContext(CurrentUserContext);
  const { aiEmployees } = useContext(AIEmployeesContext);
  const [openChatBox, setOpenChatBox] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [currentConversation, setCurrentConversation] = useState<string>();
  const [responseLoading, setResponseLoading] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentProps[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const senderRef = useRef<GetRef<typeof Sender>>(null);
  const [roles, setRoles] = useState<GetProp<typeof Bubble.List, 'roles'>>({
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
  });
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
  const send = async ({ sessionId, aiEmployee, messages: sendMsgs, greeting }: SendOptions) => {
    setRoles((prev) => ({
      ...prev,
      [aiEmployee.username]: aiEmployeeRole(aiEmployee),
    }));
    const msgs: Message[] = [];
    if (greeting) {
      msgs.push({
        key: uid(),
        role: aiEmployee.username,
        content: {
          type: 'text',
          content: aiEmployee.greeting || t('Default greeting message', { nickname: aiEmployee.nickname }),
        },
      });
      setMessages(msgs);
    }
    if (!sendMsgs.length) {
      senderRef.current?.focus();
      return;
    }
    if (attachments.length) {
      msgs.push(
        ...attachments.map((attachment) => ({
          key: uid(),
          role: 'user',
          content: attachment,
        })),
      );
      setMessages(msgs);
    }
    msgs.push(...sendMsgs.map((msg) => ({ key: uid(), role: 'user', content: msg })));
    setMessages(msgs);
    if (!sessionId) {
      const createRes = await api.resource('aiConversations').create({
        values: {
          aiEmployees: [aiEmployee],
        },
      });
      const conversation = createRes?.data?.data;
      if (!conversation) {
        return;
      }
      sessionId = conversation.sessionId;
      setCurrentConversation(conversation.sessionId);
      conversations.refresh();
    }
    setAttachments([]);
    setResponseLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        key: uid(),
        role: aiEmployee.username,
        content: {
          type: 'text',
          content: '',
        },
        loading: true,
      },
    ]);
    const sendRes = await api.request({
      url: 'aiConversations:sendMessages',
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
      },
      data: {
        aiEmployee: aiEmployee.username,
        sessionId,
        messages: msgs,
      },
      responseType: 'stream',
      adapter: 'fetch',
    });
    if (!sendRes?.data) {
      setResponseLoading(false);
      return;
    }
    const reader = sendRes.data.getReader();
    const decoder = new TextDecoder();
    let result = '';
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let content = '';
      const { done, value } = await reader.read();
      if (done) {
        setResponseLoading(false);
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);
      for (const line of lines) {
        const data = JSON.parse(line.replace(/^data: /, ''));
        if (data.type === 'content' && data.body) {
          content += data.body;
        }
      }
      result += content;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        // @ts-ignore
        last.content.content = last.content.content + content;
        last.loading = false;
        return [...prev];
      });
    }
    if (actions) {
      setMessages((prev) => [
        ...prev,
        ...actions.map((action) => ({
          key: uid(),
          role: aiEmployee.username,
          content: {
            type: 'action',
            content: action.content,
            onClick: () => {
              action.onClick(result);
            },
          },
        })),
      ]);
      setActions([]);
    }
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

  if (!ctx?.data?.data) {
    return <>{props.children}</>;
  }
  return (
    <ChatBoxContext.Provider
      value={{
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
        send,
      }}
    >
      {props.children}
      {!openChatBox && (
        <div
          className={css`
            .ant-float-btn {
              width: 40px;
            }
            .ant-float-btn .ant-float-btn-body .ant-float-btn-content {
              padding: 0;
            }
            .ant-float-btn .ant-float-btn-body .ant-float-btn-content .ant-float-btn-icon {
              width: 40px;
            }
          `}
        >
          <FloatButton
            icon={
              <Avatar
                src={icon}
                size={40}
                style={{
                  marginBottom: '4px',
                }}
              />
            }
            onClick={() => {
              setOpenChatBox(true);
            }}
            shape="square"
          />
        </div>
      )}
      {openChatBox ? <ChatBox /> : null}
    </ChatBoxContext.Provider>
  );
};
