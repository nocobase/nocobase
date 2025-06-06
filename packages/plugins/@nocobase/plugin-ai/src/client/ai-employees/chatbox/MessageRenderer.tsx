/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useEffect, useMemo } from 'react';
import { Button, Space, App, Alert, Flex } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { Attachments, Bubble } from '@ant-design/x';
import { useT } from '../../locale';
import { useChatMessages } from './ChatMessagesProvider';
import { useChatBoxContext } from './ChatBoxContext';
import { useChatConversations } from './ChatConversationsProvider';
import { usePlugin } from '@nocobase/client';
import { Markdown } from './Markdown';
import { ToolCard } from './ToolCard';
import PluginAIClient from '../..';
import { useRenderUISchemaTag } from './useRenderUISchemaTag';
import { cx, css } from '@emotion/css';
import { Task } from '../types';

const MessageWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
  }
>((props, ref) => {
  if (ref) {
    return (
      <div ref={ref} {...props}>
        {props.children}
      </div>
    );
  }
  return <div {...props}>{props.children}</div>;
});

const AITextMessageRenderer: React.FC<{
  msg: any;
}> = ({ msg }) => {
  const plugin = usePlugin('ai') as PluginAIClient;
  const provider = plugin.aiManager.llmProviders.get(msg.metadata?.provider);
  if (!provider?.components?.MessageRenderer) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {typeof msg.content === 'string' && <Markdown markdown={msg.content} />}
        {msg.tool_calls?.length ? (
          <ToolCard tools={msg.tool_calls} messageId={msg.messageId} autoCall={msg.metadata?.autoCallTool} />
        ) : null}
      </div>
    );
  }
  const M = provider.components.MessageRenderer;
  return <M msg={msg} />;
};

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
    default:
      return (
        <Bubble
          styles={{
            content: {
              width: '100%',
              minHeight: 0,
            },
          }}
          variant="borderless"
          content={<AITextMessageRenderer msg={msg} />}
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
              {typeof msg.content === 'string' && msg.content && (
                <Button color="default" variant="text" size="small" icon={<CopyOutlined onClick={copy} />} />
              )}
            </Space>
          }
        />
      );
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
  const {
    html,
    styles: { hashId, wrapSSR, componentCls },
    handleClick,
  } = useRenderUISchemaTag(msg.content);
  const items = msg.attachments?.map((item, index) => ({
    uid: index.toString(),
    name: item.filename,
    status: 'done' as const,
    url: item.url,
    size: item.size,
    thumbUrl: item.preview,
    ...item,
  }));

  return wrapSSR(
    <MessageWrapper
      ref={msg.ref}
      className={cx(
        hashId,
        componentCls,
        css`
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        `,
      )}
    >
      {items?.length ? (
        <Attachments
          styles={{
            list: {
              paddingInline: 0,
              justifyContent: 'end',
            },
          }}
          items={items}
          disabled={true}
        />
      ) : null}
      <Bubble onClick={handleClick} content={<div dangerouslySetInnerHTML={{ __html: html }} />} />
    </MessageWrapper>,
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
      message={<>{msg.content} </>}
      action={
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
      }
      type="warning"
      showIcon
    />
  );
});

export const TaskMessage: React.FC<{
  msg: {
    content: Task[];
  };
}> = memo(({ msg }) => {
  const t = useT();
  const tasks = msg.content;
  const triggerTask = useChatBoxContext('triggerTask');
  const currentEmployee = useChatBoxContext('currentEmployee');

  return (
    <Flex align="flex-start" gap="small" vertical>
      {tasks.map((task, index) => (
        <Button
          key={index}
          style={{
            whiteSpace: 'normal',
            textAlign: 'left',
            height: 'auto',
          }}
          type="primary"
          ghost
          onClick={() =>
            triggerTask({
              aiEmployee: currentEmployee,
              tasks: [task],
            })
          }
        >
          {task.title || `${t('Task')} ${index + 1}`}
        </Button>
      ))}
    </Flex>
  );
});
