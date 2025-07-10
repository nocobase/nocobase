/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useEffect, useRef } from 'react';
import { Bubble } from '@ant-design/x';
import { Spin, Layout } from 'antd';
import { useT } from '../../locale';
import { useToken } from '@nocobase/client';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatMessageActions } from './hooks/useChatMessageActions';
import { useChatBoxStore } from './stores/chat-box';

export const Messages: React.FC = () => {
  const t = useT();
  const { token } = useToken();

  const roles = useChatBoxStore.use.roles();

  const messages = useChatMessagesStore.use.messages();

  const { messagesService, lastMessageRef } = useChatMessageActions();

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
      {messages?.length ? (
        <div>
          {messages.map((msg, index) => {
            const role = roles[msg.role];
            if (!role) {
              return null;
            }
            return index === 0 && msg.content?.type !== 'greeting' ? (
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
