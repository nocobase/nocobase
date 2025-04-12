/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo } from 'react';
import { Button, Space, App, Alert } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { Bubble } from '@ant-design/x';
import { InfoFormMessage } from './InfoForm';
import { useT } from '../../locale';
import { useChatMessages } from './ChatMessagesProvider';
import { useChatBoxContext } from './ChatBoxContext';
import { useChatConversations } from './ChatConversationsProvider';

const MessageWrapper = React.forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
  }
>((props, ref) => {
  if (ref) {
    return <div ref={ref}>{props.children}</div>;
  }
  return props.children;
});

const AIMessageRenderer: React.FC<{
  msg: any;
}> = ({ msg }) => {
  const t = useT();
  const { message } = App.useApp();
  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    message.success(t('Copied to clipboard'));
  };
  const { currentConversation } = useChatConversations();
  const { resendMessages } = useChatMessages();
  const currentEmployee = useChatBoxContext('currentEmployee');
  switch (msg.type) {
    case 'greeting':
      return <Bubble content={msg.content} />;
    case 'text':
      return (
        <Bubble
          content={msg.content}
          footer={
            <Space>
              <Button
                color="default"
                variant="text"
                size="small"
                icon={
                  <ReloadOutlined
                    onClick={() =>
                      resendMessages({
                        sessionId: currentConversation,
                        messageId: msg.messageId,
                        aiEmployee: currentEmployee,
                      })
                    }
                  />
                }
              />
              <Button color="default" variant="text" size="small" icon={<CopyOutlined onClick={copy} />} />
            </Space>
          }
        />
      );
    case 'info':
      return <Bubble content={<InfoFormMessage values={msg.content} />} />;
  }
};

export const AIMessage: React.FC<{
  msg: any;
}> = memo(({ msg }) => {
  return (
    <MessageWrapper ref={msg.ref}>
      <AIMessageRenderer msg={msg} />
    </MessageWrapper>
  );
});

export const UserMessage: React.FC<{
  msg: any;
}> = memo(({ msg }) => {
  return (
    <MessageWrapper ref={msg.ref}>
      <Bubble content={msg.content} />
    </MessageWrapper>
  );
});

export const ErrorMessage: React.FC<{
  msg: any;
}> = memo(({ msg }) => {
  const { currentConversation } = useChatConversations();
  const { resendMessages, messages } = useChatMessages();
  const currentEmployee = useChatBoxContext('currentEmployee');

  return (
    <Alert
      message={
        <>
          {msg.content}{' '}
          <Button
            onClick={() => {
              let messageId: string;
              const prev = messages[messages.length - 2];
              if (prev && prev.role !== 'user') {
                messageId = prev.key as string;
              }
              resendMessages({
                sessionId: currentConversation,
                messageId,
                aiEmployee: currentEmployee,
              });
            }}
            icon={<ReloadOutlined />}
            type="text"
          />
        </>
      }
      type="warning"
      showIcon
    />
  );
});
