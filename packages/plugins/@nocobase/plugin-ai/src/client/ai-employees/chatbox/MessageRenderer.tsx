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
import { CopyOutlined, ReloadOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Attachments, Bubble } from '@ant-design/x';
import { useT } from '../../locale';
import { usePlugin, useToken } from '@nocobase/client';
import { Markdown } from './markdown/Markdown';
import PluginAIClient from '../..';
import { cx, css } from '@emotion/css';
import { Message, Task } from '../types';
import { Attachment } from './Attachment';
import { ContextItem } from './ContextItem';
import { ToolCard } from './generative-ui/ToolCard';
import { useChatConversationsStore } from './stores/chat-conversations';
import { useChatMessageActions } from './hooks/useChatMessageActions';
import { useChatBoxStore } from './stores/chat-box';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import _ from 'lodash';

const MessageWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    footer?: React.ReactNode;
  }
>(({ children, footer, ...props }, ref) => {
  const [showFooter, setShowFooter] = React.useState(false);

  return (
    <div ref={ref} {...props} onMouseEnter={() => setShowFooter(true)} onMouseLeave={() => setShowFooter(false)}>
      {children}
      {footer && <div style={{ marginTop: '4px', opacity: showFooter ? 1 : 0 }}>{footer}</div>}
    </div>
  );
});

const AITextMessageRenderer: React.FC<{
  msg: Message['content'];
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
        {typeof msg.content === 'string' && <Markdown message={msg} />}
        {msg.tool_calls?.length ? <ToolCard tools={msg.tool_calls} messageId={msg.messageId} /> : null}
      </div>
    );
  }
  const M = provider.components.MessageRenderer;
  return <M msg={msg} />;
};

const AIMessageRenderer: React.FC<{
  msg: Message['content'];
}> = ({ msg }) => {
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
        />
      );
  }
};

export const AIMessage: React.FC<{
  msg: Message['content'];
}> = memo(({ msg }) => {
  const t = useT();
  const { token } = useToken();
  const { message } = App.useApp();
  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    message.success(t('Copied'));
  };

  const currentEmployee = useChatBoxStore.use.currentEmployee();

  const currentConversation = useChatConversationsStore.use.currentConversation();

  const { resendMessages } = useChatMessageActions();
  const usageMetadata = msg.metadata?.usage_metadata;
  return (
    <MessageWrapper
      ref={msg.ref}
      footer={
        msg.type !== 'greeting' && (
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
            {/* {usageMetadata && usageMetadata.input_tokens && usageMetadata.output_tokens && ( */}
            {/*   <span */}
            {/*     style={{ */}
            {/*       fontSize: token.fontSizeSM, */}
            {/*       color: token.colorTextDescription, */}
            {/*     }} */}
            {/*   > */}
            {/*     <span */}
            {/*       style={{ */}
            {/*         marginLeft: '8px', */}
            {/*       }} */}
            {/*     > */}
            {/*       Tokens: <ArrowUpOutlined /> */}
            {/*       {new Intl.NumberFormat('en-US', { */}
            {/*         notation: 'compact', */}
            {/*         maximumFractionDigits: 1, */}
            {/*       }).format(usageMetadata.input_tokens)} */}
            {/*     </span> */}
            {/*     <span */}
            {/*       style={{ */}
            {/*         marginLeft: '4px', */}
            {/*       }} */}
            {/*     > */}
            {/*       <ArrowDownOutlined /> */}
            {/*       {new Intl.NumberFormat('en-US', { */}
            {/*         notation: 'compact', */}
            {/*         maximumFractionDigits: 1, */}
            {/*       }).format(usageMetadata.output_tokens)} */}
            {/*     </span> */}
            {/*   </span> */}
            {/* )} */}
          </Space>
        )
      }
    >
      <AIMessageRenderer msg={msg} />
    </MessageWrapper>
  );
});

export const UserMessage: React.FC<{
  msg: Message['content'];
}> = memo(({ msg }) => {
  const t = useT();
  const { message } = App.useApp();

  const setSenderValue = useChatBoxStore.use.setSenderValue();
  const senderRef = useChatBoxStore.use.senderRef();

  const { startEditingMessage } = useChatMessageActions();

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    message.success(t('Copied'));
  };
  const items = msg.attachments?.map((item, index) => ({
    uid: index.toString(),
    name: item.filename,
    status: 'done' as const,
    url: item.url,
    size: item.size,
    thumbUrl: item.preview,
    ...item,
  }));

  return (
    <MessageWrapper
      ref={msg.ref}
      className={cx(css`
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      `)}
      footer={
        <Space>
          <Button
            color="default"
            variant="text"
            size="small"
            icon={
              <EditOutlined
                onClick={() => {
                  startEditingMessage(msg);
                  setSenderValue(msg.content);
                  senderRef.current?.focus();
                }}
              />
            }
          />
          {typeof msg.content === 'string' && msg.content && (
            <Button color="default" variant="text" size="small" icon={<CopyOutlined onClick={copy} />} />
          )}
        </Space>
      }
    >
      {msg.workContext?.length ? (
        <div
          style={{
            marginBottom: '4px',
          }}
        >
          {msg.workContext.map((item: any) => (
            <ContextItem item={item} key={`${item.type}:${item.uid}`} />
          ))}
        </div>
      ) : null}
      {items?.length ? (
        <div
          style={{
            marginBottom: '4px',
          }}
        >
          {items.map((item) => (
            <Attachment file={item} key={item.filename} />
          ))}
        </div>
      ) : null}
      {_.isEmpty(msg.content) ? <></> : <Bubble content={msg.content} />}
    </MessageWrapper>
  );
});

export const ErrorMessage: React.FC<{
  msg: any;
}> = memo(({ msg }) => {
  const currentEmployee = useChatBoxStore.use.currentEmployee();

  const currentConversation = useChatConversationsStore.use.currentConversation();

  const messages = useChatMessagesStore.use.messages();

  const { resendMessages } = useChatMessageActions();

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

  const taskVariables = useChatBoxStore.use.taskVariables();
  const currentEmployee = useChatBoxStore.use.currentEmployee();

  const { triggerTask } = useChatBoxActions();

  const tasksItems = tasks
    .map((task, index) => ({ ...task, title: task.title || `${t('Task')} ${index + 1}` }))
    .sort((a, b) => (b.title?.length ?? 0) - (a.title?.length ?? 0));

  return (
    <Flex align="flex-start" gap="middle" wrap={true}>
      {tasksItems.map((task, index) => (
        <Button
          key={index}
          style={{
            whiteSpace: 'normal',
            textAlign: 'left',
            height: 'auto',
          }}
          variant="outlined"
          onClick={() =>
            triggerTask({
              aiEmployee: currentEmployee,
              tasks: [task],
              ...taskVariables,
            })
          }
        >
          <div>{task.title}</div>
        </Button>
      ))}
    </Flex>
  );
});
