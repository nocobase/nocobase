/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useEffect, useMemo } from 'react';
import { Button, Space, App, Alert, Flex, Collapse, Typography, Tooltip } from 'antd';
import { CopyOutlined, ReloadOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Attachments, Bubble } from '@ant-design/x';
import { useT } from '../../locale';
import { lazy, usePlugin, useToken, useTools, toToolsMap } from '@nocobase/client';
import PluginAIClient from '../..';
import { cx, css } from '@emotion/css';
import { Message, Task } from '../types';
import { ContextItem } from './ContextItem';
import { ToolCard } from './generative-ui/ToolCard';
import { useChatConversationsStore } from './stores/chat-conversations';
import { useChatMessageActions } from './hooks/useChatMessageActions';
import { useChatBoxStore } from './stores/chat-box';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import _ from 'lodash';

const { Markdown } = lazy(() => import('./markdown/Markdown'), 'Markdown');

const { Link } = Typography;

const messageFooterWeakClass = css`
  margin-top: 4px;
  display: flex;
`;

const MessageWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    footer?: React.ReactNode;
  }
>(({ children, footer, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
      {footer && <div className={messageFooterWeakClass}>{footer}</div>}
    </div>
  );
});

const AITextMessageRenderer: React.FC<{
  msg: Message['content'];
  toolInlineActions?: React.ReactNode;
}> = ({ msg, toolInlineActions }) => {
  const plugin = usePlugin('ai') as PluginAIClient;
  const provider = plugin.aiManager.llmProviders.get(msg.metadata?.provider);
  if (!provider?.components?.MessageRenderer) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {typeof msg.content === 'string' && <Markdown message={msg} />}
        {msg.tool_calls?.length ? (
          <ToolCard toolCalls={msg.tool_calls} messageId={msg.messageId} inlineActions={toolInlineActions} />
        ) : null}
      </div>
    );
  }
  const M = provider.components.MessageRenderer;
  return <M msg={msg} />;
};

const AIMessageRenderer: React.FC<{
  msg: Message['content'];
  toolInlineActions?: React.ReactNode;
}> = ({ msg, toolInlineActions }) => {
  switch (msg.type) {
    case 'greeting':
      return (
        <Bubble
          content={msg.content}
          style={{
            marginBottom: '8px',
          }}
        />
      );
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
          content={<AITextMessageRenderer msg={msg} toolInlineActions={toolInlineActions} />}
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
  const { tools, loading: toolsLoading } = useTools();
  const toolsMap = useMemo(() => toToolsMap(tools || []), [tools]);
  const plugin = usePlugin('ai') as PluginAIClient;
  const provider = plugin.aiManager.llmProviders.get(msg.metadata?.provider);
  const hasCustomRenderer = !!provider?.components?.MessageRenderer;
  const footerButtonStyle: React.CSSProperties = {
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    height: token.controlHeightSM,
    padding: `0 ${token.paddingXS}px`,
  };
  const footerIconStyle: React.CSSProperties = {
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
  };
  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    message.success(t('Copied'));
  };

  const currentEmployee = useChatBoxStore.use.currentEmployee();

  const currentConversation = useChatConversationsStore.use.currentConversation();

  const { resendMessages } = useChatMessageActions();
  const usageMetadata = msg.metadata?.usage_metadata;
  const hasTextContent = typeof msg.content === 'string' && msg.content.trim().length > 0;
  const hasSingleToolCall = msg.tool_calls?.length === 1;
  const toolCall = hasSingleToolCall ? msg.tool_calls?.[0] : undefined;
  const isDefaultToolCard = !!toolCall && !toolsLoading && !toolsMap.get(toolCall.name)?.ui?.card;
  const useInlineToolActions = !hasCustomRenderer && hasSingleToolCall && !hasTextContent && isDefaultToolCard;
  const messageActions =
    msg.type !== 'greeting' ? (
      <Space>
        <Button
          color="default"
          variant="text"
          size="small"
          style={footerButtonStyle}
          icon={
            <ReloadOutlined
              style={footerIconStyle}
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
          <Button
            color="default"
            variant="text"
            size="small"
            style={footerButtonStyle}
            icon={<CopyOutlined style={footerIconStyle} onClick={copy} />}
          />
        )}
      </Space>
    ) : null;
  return (
    <MessageWrapper ref={msg.ref} footer={messageActions && !useInlineToolActions ? messageActions : null}>
      {msg.reference?.length && <Reference references={msg.reference} />}
      <AIMessageRenderer msg={msg} toolInlineActions={useInlineToolActions ? messageActions : null} />
    </MessageWrapper>
  );
});

export const Reference: React.FC<{ references: { title: string; url: string }[] }> = ({ references }) => {
  const t = useT();
  const items = [
    {
      key: '1',
      label: t('Cite {{count}} pieces of information as references', { count: references.length }),
      children: (
        <Space style={{ width: '100%' }} direction="vertical">
          {references.map((ref, index) => {
            const url = ref.url;
            const title = _.isEmpty(ref.title) ? t('references {{index}}', { index: index + 1 }) : ref.title;
            const tooltip = _.isEmpty(ref.title) ? ref.url : ref.title;
            return (
              <Tooltip key={index} title={tooltip} arrow={false}>
                <Link href={url} target="_blank" ellipsis>
                  {title}
                </Link>
              </Tooltip>
            );
          })}
        </Space>
      ),
    },
  ];
  return <Collapse items={items} bordered={false} size="small" style={{ marginBottom: 8 }} />;
};

export const UserMessage: React.FC<{
  msg: Message['content'];
}> = memo(({ msg }) => {
  const t = useT();
  const { token } = useToken();
  const { message } = App.useApp();
  const footerButtonStyle: React.CSSProperties = {
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    height: token.controlHeightSM,
    padding: `0 ${token.paddingXS}px`,
  };
  const footerIconStyle: React.CSSProperties = {
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
  };

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
            style={footerButtonStyle}
            icon={
              <EditOutlined
                style={footerIconStyle}
                onClick={() => {
                  startEditingMessage(msg);
                  setSenderValue(msg.content);
                  senderRef.current?.focus();
                }}
              />
            }
          />
          {typeof msg.content === 'string' && msg.content && (
            <Button
              color="default"
              variant="text"
              size="small"
              style={footerButtonStyle}
              icon={<CopyOutlined style={footerIconStyle} onClick={copy} />}
            />
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
            <ContextItem within="chatbox" item={item} key={`${item.type}:${item.uid}`} />
          ))}
        </div>
      ) : null}
      {items?.length ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 4,
          }}
        >
          {items.map((item) => (
            <Attachments.FileCard key={item.uid} item={item} />
          ))}
        </div>
      ) : null}
      {_.isEmpty(msg.content) ? (
        <></>
      ) : (
        <Bubble
          content={msg.content}
          styles={{
            content: {
              whiteSpace: 'pre-wrap',
            },
          }}
        />
      )}
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

  const showAlert = msg.content !== 'GraphRecursionError';
  useEffect(() => {
    if (msg.content === 'GraphRecursionError') {
      resendMessages({
        sessionId: currentConversation,
        aiEmployee: currentEmployee,
        important: msg.content,
      });
    }
  }, [msg]);

  return (
    showAlert && (
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
    )
  );
});

export const HintMessage: React.FC<{ msg: any }> = memo(({ msg }) => {
  return <Alert style={{ marginBottom: 8 }} message={<>{msg.content} </>} type="info" showIcon closable />;
});

export const TaskMessage: React.FC<{
  msg: {
    content: Task[];
  };
}> = memo(({ msg }) => {
  const t = useT();
  // 保证 msg.content 始终被归一化为数组
  const rawTasks = (msg as any)?.content;
  const tasks: Task[] = Array.isArray(rawTasks) ? rawTasks : rawTasks ? [rawTasks] : [];

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
