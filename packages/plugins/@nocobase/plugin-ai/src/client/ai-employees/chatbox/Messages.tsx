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
import { useChatBoxContext } from './ChatBoxContext';
import emptyIcon from '../empty-icon.svg';
import { Spin, Layout } from 'antd';
import { useChatMessages } from './ChatMessagesProvider';

export const Messages: React.FC = () => {
  const { messages, messagesService, lastMessageRef } = useChatMessages();
  const roles = useChatBoxContext('roles');
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
            width: '64px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img src={emptyIcon} />
        </div>
      )}
    </Layout.Content>
  );
};
