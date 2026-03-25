/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Bubble } from '@ant-design/x';
import { Spin, Layout, Divider } from 'antd';
import { useT } from '../../locale';
import { useToken } from '@nocobase/client';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatMessageActions } from './hooks/useChatMessageActions';
import { useChatBoxStore } from './stores/chat-box';
import { useChatToolsStore } from './stores/chat-tools';
import { Message } from '../types';

type RenderedItem =
  | {
      type: 'message';
      message: Message;
      isRoot: boolean;
    }
  | {
      type: 'divider';
      key: string;
      roleName?: string;
    };

const flattenMessages = (messages: Message[] = [], isRoot = true): RenderedItem[] => {
  return messages.flatMap((msg) => {
    const subAgentItems =
      msg.content?.subAgentConversations?.flatMap((conversation) => {
        const conversationMessages = flattenMessages(
          conversation.messages.filter((subMessage) => subMessage.role !== 'user'),
          false,
        );

        if (!conversationMessages.length) {
          return [];
        }

        return conversation.status === 'completed'
          ? [
              ...conversationMessages,
              {
                type: 'divider' as const,
                key: `${conversation.sessionId}-completed`,
                roleName: conversation.messages.find((subMessage) => subMessage.role !== 'user')?.role,
              },
            ]
          : conversationMessages;
      }) ?? [];

    return [
      {
        type: 'message' as const,
        message: msg,
        isRoot,
      },
      ...subAgentItems,
    ];
  });
};

export const Messages: React.FC = () => {
  const t = useT();
  const { token } = useToken();

  const roles = useChatBoxStore.use.roles();

  const messages = useChatMessagesStore.use.messages();

  const updateTools = useChatToolsStore.use.updateTools();

  const { messagesService, lastMessageRef } = useChatMessageActions();
  const renderedMessages = useMemo(() => flattenMessages(messages), [messages]);
  const firstMessageIndex = renderedMessages.findIndex(
    (item) => item.type === 'message' && item.isRoot && item.message.content?.type !== 'greeting',
  );

  useEffect(() => {
    updateTools(messages);
  }, [messages, updateTools]);

  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const resizeObserver = new ResizeObserver(() => {
      container.scrollTop = container.scrollHeight;
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [messages]);

  return (
    <Layout.Content
      ref={containerRef}
      style={{
        margin: '16px 0',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {messagesService.loading && (
        <Spin
          style={{
            display: 'block',
            margin: '8px auto',
          }}
        />
      )}
      {renderedMessages.length ? (
        <div>
          {renderedMessages.map((item, index) => {
            if (item.type === 'divider') {
              const nickname = item.roleName ? (roles[item.roleName] as any)?.nickname || item.roleName : undefined;
              return (
                <div key={item.key} style={{ padding: '0 16px' }}>
                  <Divider
                    dashed
                    plain
                    style={{
                      margin: '12px 0 16px',
                      color: token.colorTextDescription,
                    }}
                  >
                    {t('{{ nickname }} has completed the work', { nickname })}
                  </Divider>
                </div>
              );
            }

            const msg = item.message;
            const role = roles[msg.role];
            if (!role) {
              return null;
            }
            return index === firstMessageIndex ? (
              <div key={msg.key} ref={lastMessageRef}>
                <Bubble {...role} loading={msg.loading} content={msg.content} />
              </div>
            ) : (
              <Bubble {...role} key={msg.key} loading={msg.loading} content={msg.content} />
            );
          })}
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: token.colorTextDescription,
          }}
        >
          {t('Work with your AI crew')}
        </div>
      )}
    </Layout.Content>
  );
};
