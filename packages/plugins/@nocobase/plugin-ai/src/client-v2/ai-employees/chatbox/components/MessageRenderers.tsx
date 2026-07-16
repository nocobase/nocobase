/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useEffect, useMemo } from 'react';
import { Bubble } from '@ant-design/x';
import { Alert, Button, Collapse, Flex, Space, Spin, theme, Tooltip, Typography } from 'antd';
import { CopyOutlined, EditOutlined, LoadingOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { toToolsMap } from '@nocobase/client-v2';
import { observer } from '@nocobase/flow-engine';
import type { Message, Task } from '../../types';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { useChat } from '../hooks/useChat';
import { useChatBoxActions } from '../hooks/useChatBoxActions';
import { useChatMessageActions } from '../hooks/useChatMessageActions';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { FileCardList } from './Attachments';
import { Actions } from './Actions';
import { ContextItem } from './ContextItem';
import { Markdown } from './Markdown';
import { ToolCard } from './ToolCard';

const { Link, Paragraph, Text } = Typography;

type MessagePayload = Message['content'];
type ChatBubbleRole = Omit<React.ComponentProps<typeof Bubble>, 'content' | 'messageRender' | 'loadingRender'> & {
  nickname?: string;
  content?: MessagePayload;
  messageRender?: (content: MessagePayload) => React.ReactNode;
  loadingRender?: () => React.ReactNode;
};

const messageFooterWeakStyle: React.CSSProperties = {
  marginTop: 4,
  display: 'flex',
};

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
      {footer ? <div style={messageFooterWeakStyle}>{footer}</div> : null}
    </div>
  );
});

MessageWrapper.displayName = 'MessageWrapper';

export const defaultMessageRoles: Record<string, ChatBubbleRole> = {
  user: {
    placement: 'end',
    styles: {
      content: {
        maxWidth: '80%',
        margin: '0 8px 8px 0',
      },
    },
    variant: 'borderless',
    messageRender: (msg: MessagePayload) => <UserMessage msg={msg} />,
  },
  error: {
    placement: 'start',
    variant: 'borderless',
    styles: {
      content: {
        margin: '8px 16px',
      },
    },
    messageRender: (msg: MessagePayload) => <ErrorMessage msg={msg} />,
  },
  hint: {
    placement: 'start',
    variant: 'borderless',
    styles: {
      content: {
        margin: '8px 16px',
      },
    },
    messageRender: (msg: MessagePayload) => <HintMessage msg={msg} />,
  },
  task: {
    placement: 'start',
    variant: 'borderless',
    styles: {
      content: {
        margin: '0px 16px 8px',
      },
    },
    messageRender: (msg: MessagePayload) => <TaskMessage msg={msg} />,
  },
};

export const createAIEmployeeRole = (nickname?: string): ChatBubbleRole => ({
  placement: 'start',
  typing: { step: 5, interval: 20 },
  variant: 'borderless',
  styles: {
    content: {
      width: '95%',
      margin: '8px 16px',
      marginInlineEnd: 16,
      minHeight: 0,
    },
  },
  messageRender: (msg: MessagePayload) => <AIMessage msg={msg} />,
  loadingRender: () => <AIThinking nickname={nickname} />,
});

const AITextMessageRenderer: React.FC<{
  msg: MessagePayload;
  toolInlineActions?: React.ReactNode;
}> = memo(({ msg, toolInlineActions }) => {
  const t = useT();
  const reasoningText = msg.reasoning?.content;
  const reasoningStatus = msg.reasoning?.status;
  const text = typeof msg.content === 'string' ? msg.content : '';

  return (
    <>
      {reasoningText && reasoningStatus ? (
        <Collapse
          size="small"
          bordered={false}
          defaultActiveKey="thinking"
          style={{
            marginBottom: 14,
          }}
          items={[
            {
              key: 'thinking',
              label: reasoningStatus === 'streaming' ? t('Thinking in progress') : t('Thinking completed'),
              children: (
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    color: 'rgba(0, 0, 0, 0.65)',
                    fontSize: 12,
                  }}
                >
                  {reasoningText}
                </div>
              ),
            },
          ]}
        />
      ) : null}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {text ? <Markdown message={msg}>{text}</Markdown> : null}
        {text ? <Actions message={msg} responseType="text" value={text} /> : null}
        {msg.tool_calls?.length ? (
          <ToolCard toolCalls={msg.tool_calls} messageId={msg.messageId} inlineActions={toolInlineActions} />
        ) : null}
      </div>
    </>
  );
});

AITextMessageRenderer.displayName = 'AITextMessageRenderer';

const AIMessageRenderer: React.FC<{
  msg: MessagePayload;
  toolInlineActions?: React.ReactNode;
}> = memo(({ msg, toolInlineActions }) => {
  if (msg.type === 'greeting') {
    return (
      <Bubble
        content={msg.content}
        style={{
          marginBottom: 8,
        }}
      />
    );
  }

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
});

AIMessageRenderer.displayName = 'AIMessageRenderer';

export const AIMessage: React.FC<{
  msg: MessagePayload;
}> = observer(({ msg }) => {
  const t = useT();
  const { token } = theme.useToken();
  const aiConfigRepository = useAIConfigRepository();
  const toolsLoading = aiConfigRepository.aiToolsLoading;
  const toolsMap = useMemo(() => toToolsMap(aiConfigRepository.aiTools || []), [aiConfigRepository.aiTools]);
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const readonly = useChatBoxStore.use.readonly();
  const { resendMessages } = useChatMessageActions();
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
    copyText(msg.content);
  };
  const messageActions =
    msg.type !== 'greeting' ? (
      <Space>
        {msg.from === 'main-agent' && readonly !== true ? (
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
        ) : null}
        {typeof msg.content === 'string' && msg.content ? (
          <Button
            aria-label={t('Copy')}
            color="default"
            variant="text"
            size="small"
            style={footerButtonStyle}
            icon={<CopyOutlined style={footerIconStyle} onClick={copy} />}
          />
        ) : null}
      </Space>
    ) : null;
  const hasTextContent = typeof msg.content === 'string' && msg.content.trim().length > 0;
  const hasSingleToolCall = msg.tool_calls?.length === 1;
  const toolCall = hasSingleToolCall ? msg.tool_calls?.[0] : undefined;
  const isDefaultToolCard = !!toolCall && !toolsLoading && !toolsMap.get(toolCall.name)?.ui?.card;
  const useInlineToolActions = hasSingleToolCall && !hasTextContent && isDefaultToolCard;

  return (
    <MessageWrapper
      ref={msg.ref as React.Ref<HTMLDivElement>}
      footer={messageActions && !useInlineToolActions ? messageActions : null}
    >
      {Array.isArray(msg.reference) && msg.reference.length ? <Reference references={msg.reference} /> : null}
      <AIMessageRenderer msg={msg} toolInlineActions={useInlineToolActions ? messageActions : null} />
    </MessageWrapper>
  );
});

AIMessage.displayName = 'AIMessage';

const Reference: React.FC<{ references: { title?: string; url?: string }[] }> = ({ references }) => {
  const t = useT();
  return (
    <Collapse
      items={[
        {
          key: 'references',
          label: t('Cite {{count}} pieces of information as references', { count: references.length }),
          children: (
            <Space style={{ width: '100%' }} direction="vertical">
              {references.map((item, index) => {
                const title = item.title || t('references {{index}}', { index: index + 1 });
                const url = item.url || '';
                return (
                  <Tooltip key={`${url}-${index}`} title={item.title || url} arrow={false}>
                    <Link href={url} target="_blank" ellipsis>
                      {title}
                    </Link>
                  </Tooltip>
                );
              })}
            </Space>
          ),
        },
      ]}
      bordered={false}
      size="small"
      style={{ marginBottom: 8 }}
    />
  );
};

export const UserMessage: React.FC<{
  msg: MessagePayload;
}> = memo(({ msg }) => {
  const t = useT();
  const { token } = theme.useToken();
  const setSenderValue = useChatBoxStore.use.setSenderValue();
  const senderRef = useChatBoxStore.use.senderRef();
  const readonly = useChatBoxStore.use.readonly();
  const { startEditingMessage } = useChatMessageActions();
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
    copyText(msg.content);
  };

  return (
    <MessageWrapper
      ref={msg.ref as React.Ref<HTMLDivElement>}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
      footer={
        <Space>
          {msg.from === 'main-agent' && readonly !== true ? (
            <Button
              color="default"
              variant="text"
              size="small"
              style={footerButtonStyle}
              icon={
                <EditOutlined
                  style={footerIconStyle}
                  onClick={() => {
                    if (!msg.messageId) {
                      return;
                    }
                    startEditingMessage({
                      ...msg,
                      messageId: msg.messageId,
                    });
                    setSenderValue(stringifyContent(msg.content));
                    senderRef?.current?.focus();
                  }}
                />
              }
            />
          ) : null}
          {typeof msg.content === 'string' && msg.content ? (
            <Button
              aria-label={t('Copy')}
              color="default"
              variant="text"
              size="small"
              style={footerButtonStyle}
              icon={<CopyOutlined style={footerIconStyle} onClick={copy} />}
            />
          ) : null}
        </Space>
      }
    >
      {msg.workContext?.length ? (
        <div
          style={{
            marginBottom: 4,
          }}
        >
          {msg.workContext.map((item) => (
            <ContextItem within="chatbox" item={item} key={`${item.type}:${item.uid}`} />
          ))}
        </div>
      ) : null}
      {msg.attachments?.length ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <FileCardList attachments={msg.attachments} />
        </div>
      ) : null}
      {stringifyContent(msg.content) ? (
        <Bubble
          content={stringifyContent(msg.content)}
          styles={{
            content: {
              whiteSpace: 'pre-wrap',
            },
          }}
        />
      ) : null}
    </MessageWrapper>
  );
});

UserMessage.displayName = 'UserMessage';

export const ErrorMessage: React.FC<{
  msg: MessagePayload;
}> = memo(({ msg }) => {
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const messages = chat.use.messages();
  const { resendMessages } = useChatMessageActions();
  const showAlert = msg.content !== 'GraphRecursionError';

  useEffect(() => {
    if (msg.content === 'GraphRecursionError') {
      resendMessages({
        sessionId: currentConversation,
        aiEmployee: currentEmployee,
        important: stringifyContent(msg.content),
      });
    }
  }, [currentConversation, currentEmployee, msg.content, resendMessages]);

  if (!showAlert) {
    return null;
  }

  return (
    <Alert
      message={<>{stringifyContent(msg.content)} </>}
      action={
        <Button
          onClick={() => {
            let messageId: string | undefined;
            const previous = messages[messages.length - 2];
            if (previous && previous.role !== 'user') {
              messageId = String(previous.key);
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

ErrorMessage.displayName = 'ErrorMessage';

export const HintMessage: React.FC<{ msg: MessagePayload }> = memo(({ msg }) => {
  return (
    <Alert style={{ marginBottom: 8 }} message={<>{stringifyContent(msg.content)} </>} type="info" showIcon closable />
  );
});

HintMessage.displayName = 'HintMessage';

export const TaskMessage: React.FC<{
  msg: MessagePayload;
}> = memo(({ msg }) => {
  const t = useT();
  const rawTasks = msg.content;
  const tasks: Task[] = Array.isArray(rawTasks) ? rawTasks : rawTasks ? [rawTasks as Task] : [];
  const taskVariables = useChatBoxStore.use.taskVariables();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const { triggerTask } = useChatBoxActions();
  const taskItems = tasks
    .map((task, index) => ({ ...task, title: task.title || `${t('Task')} ${index + 1}` }))
    .sort((a, b) => (b.title?.length ?? 0) - (a.title?.length ?? 0));

  return (
    <Flex align="flex-start" gap="middle" wrap>
      {taskItems.map((task, index) => (
        <Button
          key={`${task.title}-${index}`}
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

TaskMessage.displayName = 'TaskMessage';

export const AIThinking: React.FC<{ nickname?: string }> = ({ nickname }) => {
  const t = useT();
  const { token } = theme.useToken();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const webSearching = chat.use.webSearching();

  return (
    <Space direction="vertical">
      <Space
        direction="horizontal"
        style={{
          color: token.colorTextDescription,
          fontStyle: 'italic',
        }}
      >
        <Spin indicator={<LoadingOutlined spin />} />
        {webSearching ? t('AI is searching', { nickname }) : t('AI is thinking', { nickname })}
      </Space>
      {webSearching?.query ? (
        <Paragraph>
          <blockquote>
            <SearchOutlined /> {webSearching.query}
          </blockquote>
        </Paragraph>
      ) : null}
    </Space>
  );
};

function stringifyContent(content: unknown) {
  if (typeof content === 'string') {
    return content;
  }
  if (content == null) {
    return '';
  }
  try {
    return JSON.stringify(content, null, 2);
  } catch (error) {
    console.error(error);
    return String(content);
  }
}

function copyText(content: unknown) {
  const text = stringifyContent(content);
  if (!text) {
    return;
  }
  navigator.clipboard?.writeText(text).catch(console.error);
}
