/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bubble } from '@ant-design/x';
import { Button, Divider, Layout, Space, Spin, theme, Typography } from 'antd';
import { DownOutlined, LoadingOutlined, RightOutlined } from '@ant-design/icons';
import { useApp } from '@nocobase/client-v2';
import { useT } from '../../../locale';
import type { Message } from '../../types';
import { useChat } from '../hooks/useChat';
import { useChatMessageActions } from '../hooks/useChatMessageActions';
import { useWorkflowTasks } from '../hooks/useWorkflowTasks';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChatToolsStore } from '../stores/chat-tools';
import { flattenMessages, formatConversationDuration, type RenderedItem } from '../utils';
import { createAIEmployeeRole, defaultMessageRoles } from './MessageRenderers';

const { Link, Text } = Typography;

const STICKY_BOTTOM_THRESHOLD = 48;

const isSameMessageContent = (prev: Message['content'], next: Message['content']) =>
  prev === next ||
  (prev?.messageId === next?.messageId &&
    prev?.content === next?.content &&
    prev?.reasoning === next?.reasoning &&
    prev?.tool_calls === next?.tool_calls &&
    prev?.metadata === next?.metadata &&
    prev?.reference === next?.reference);

const MemoBubble = React.memo(Bubble, (prevProps, nextProps) => {
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.placement === nextProps.placement &&
    prevProps.variant === nextProps.variant &&
    prevProps.avatar === nextProps.avatar &&
    prevProps.header === nextProps.header &&
    prevProps.footer === nextProps.footer &&
    prevProps.messageRender === nextProps.messageRender &&
    isSameMessageContent(prevProps.content as Message['content'], nextProps.content as Message['content'])
  );
});

export const Messages: React.FC = () => {
  const t = useT();
  const { token } = theme.useToken();
  const app = useApp();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const roles = useChatBoxStore.use.roles();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const messages = chat.use.messages();
  const messagesLoading = chat.use.messagesLoading();
  const renderedMessages = useMemo(() => flattenMessages(Array.isArray(messages) ? messages : []), [messages]);
  const firstMessageIndex = renderedMessages.findIndex(
    (item) => item.type === 'message' && item.isRoot && item.message.content?.type !== 'greeting',
  );
  const [collapsedConversationKeys, setCollapsedConversationKeys] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const updateTools = useChatToolsStore.use.updateTools();
  const { loadMessages, lastMessageRef } = useChatMessageActions();
  const setResponseLoading = chat.setResponseLoading;
  const { updateReadonly } = useWorkflowTasks();

  useEffect(() => {
    updateTools(messages);
  }, [messages, updateTools]);

  useEffect(() => {
    setCollapsedConversationKeys((previous) => {
      const next = { ...previous };
      let changed = false;

      const collectCompletedConversations = (items: RenderedItem[]) => {
        items.forEach((item) => {
          if (item.type !== 'conversation-group') {
            return;
          }
          if (item.status === 'completed' && !(item.key in next)) {
            next[item.key] = false;
            changed = true;
          }
          collectCompletedConversations(item.items);
        });
      };

      collectCompletedConversations(renderedMessages);

      return changed ? next : previous;
    });
  }, [renderedMessages]);

  const isNearBottom = useCallback((container: HTMLDivElement) => {
    return container.scrollHeight - container.scrollTop - container.clientHeight <= STICKY_BOTTOM_THRESHOLD;
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    shouldStickToBottomRef.current = isNearBottom(container);
  }, [isNearBottom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      if (shouldStickToBottomRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [messages]);

  const onAIEmployeeTaskStatusUpdate = useCallback(
    (event: Event) => {
      const detail = (event as CustomEvent<{ sessionId?: string; status?: string }>).detail;
      const sessionId = detail?.sessionId;
      const status = detail?.status;
      if (currentConversation && currentConversation === sessionId && status !== 'processing') {
        loadMessages(sessionId);
        setResponseLoading(false);
        updateReadonly(sessionId).catch(console.error);
      }
    },
    [currentConversation, loadMessages, setResponseLoading, updateReadonly],
  );

  useEffect(() => {
    app.eventBus.addEventListener('ws:message:ai-employee-tasks:status', onAIEmployeeTaskStatusUpdate);
    return () => {
      app.eventBus.removeEventListener('ws:message:ai-employee-tasks:status', onAIEmployeeTaskStatusUpdate);
    };
  }, [app.eventBus, onAIEmployeeTaskStatusUpdate]);

  const resolvedRoles = useMemo(() => {
    const employeeRoleName = currentEmployee?.username;
    const nextRoles = {
      ...defaultMessageRoles,
      ...roles,
    };
    if (employeeRoleName && !nextRoles[employeeRoleName]) {
      nextRoles[employeeRoleName] = createAIEmployeeRole(currentEmployee.nickname || currentEmployee.username);
    }
    return nextRoles;
  }, [currentEmployee, roles]);

  const renderConversationToggleDivider = (
    item: Extract<RenderedItem, { type: 'conversation-group' }>,
    collapsed: boolean,
  ) => {
    const durationText = formatConversationDuration(item.durationMs);

    return (
      <Divider
        key={`${item.key}-divider-top`}
        dashed
        plain
        style={{
          margin: '0 0 8px 0',
          color: token.colorTextDescription,
        }}
      >
        <Button
          type="link"
          size="small"
          onClick={() =>
            setCollapsedConversationKeys((previous) => ({
              ...previous,
              [item.key]: !collapsed,
            }))
          }
          style={{
            paddingInline: 0,
            color: token.colorTextDescription,
          }}
          icon={collapsed ? <RightOutlined /> : <DownOutlined />}
          iconPosition="end"
        >
          {t('Done in {{ durationText }}', { durationText })}
        </Button>
      </Divider>
    );
  };

  const renderConversationCompletedDivider = (item: Extract<RenderedItem, { type: 'conversation-group' }>) => {
    const nickname = item.roleName ? resolvedRoles[item.roleName]?.nickname || item.roleName : undefined;

    return (
      <Divider
        key={`${item.key}-divider-bottom`}
        dashed
        plain
        style={{
          margin: '0 0 8px 0',
          color: token.colorTextDescription,
        }}
      >
        {t('{{ nickname }} has completed the work', { nickname })}
      </Divider>
    );
  };

  const renderItem = (item: RenderedItem, indexPath: string) => {
    if (item.type === 'conversation-group') {
      const collapsed = item.status === 'completed' ? collapsedConversationKeys[item.key] !== false : false;

      if (collapsed) {
        return renderConversationToggleDivider(item, true);
      }

      return (
        <React.Fragment key={item.key}>
          {item.status === 'completed' ? renderConversationToggleDivider(item, false) : null}
          {item.items.map((child, childIndex) => renderItem(child, `${indexPath}-${childIndex}`))}
          {item.status === 'completed' ? renderConversationCompletedDivider(item) : null}
        </React.Fragment>
      );
    }

    const message = item.message;
    const role = resolvedRoles[message.role];
    if (!role) {
      return null;
    }

    if (indexPath === String(firstMessageIndex)) {
      return (
        <div key={message.key} ref={lastMessageRef}>
          <MemoBubble {...role} loading={message.loading} content={message.content} />
        </div>
      );
    }

    return <MemoBubble {...role} key={message.key} loading={message.loading} content={message.content} />;
  };

  return (
    <Layout.Content
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        margin: '16px 0',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {messagesLoading ? (
        <Spin
          style={{
            display: 'block',
            margin: '8px auto',
          }}
        />
      ) : null}
      {renderedMessages.length ? (
        <div>
          {renderedMessages.map((item, index) => renderItem(item, String(index)))}
          <BackgroundWorkingHint />
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

const BackgroundWorkingHint: React.FC = () => {
  const t = useT();
  const { loadMessages, getConversationLLMActiveState } = useChatMessageActions();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const chat = useChat(currentConversation);
  const messages = chat.use.messages();
  const backgroundWorking = chat.use.backgroundWorking();
  const resumeStreamFailed = chat.use.resumeStreamFailed();
  const setBackgroundWorking = chat.setBackgroundWorking;
  const setResponseLoading = chat.setResponseLoading;
  const setResumeStreamFailed = chat.setResumeStreamFailed;

  const checkState = useCallback(async () => {
    if (!currentConversation) {
      return;
    }
    const llmActiveState = await getConversationLLMActiveState(currentConversation);
    if (!llmActiveState) {
      return;
    }
    const isBackgroundWorking = llmActiveState === 'invoking' || (resumeStreamFailed && llmActiveState === 'streaming');
    setBackgroundWorking(isBackgroundWorking);
    if (isBackgroundWorking) {
      setResponseLoading(true);
    }
    if (llmActiveState === 'idle' && resumeStreamFailed) {
      setResumeStreamFailed(false);
      setResponseLoading(false);
    }
  }, [
    currentConversation,
    getConversationLLMActiveState,
    resumeStreamFailed,
    setBackgroundWorking,
    setResponseLoading,
    setResumeStreamFailed,
  ]);

  const refreshMessages = useCallback(async () => {
    if (!currentConversation) {
      return;
    }
    await loadMessages(currentConversation);
    await checkState();
  }, [checkState, currentConversation, loadMessages]);

  useEffect(() => {
    if (currentConversation) {
      checkState().catch(console.error);
    }
  }, [checkState, currentConversation, messages.length]);

  if (!currentConversation || !backgroundWorking) {
    return null;
  }

  const Content: React.FC = () => (
    <Typography>
      <Space>
        <Spin indicator={<LoadingOutlined spin />} />
        <Text type="secondary">
          {t('{{ nickname }} is working in background.', { nickname: currentEmployee?.nickname })}
        </Text>
        <Link onClick={refreshMessages}>{t('Click')}</Link>
        <Text type="secondary">{t('to Refresh.')}</Text>
      </Space>
    </Typography>
  );

  return (
    <Bubble
      placement="start"
      variant="borderless"
      styles={{
        content: {
          margin: '8px 16px',
        },
      }}
      messageRender={() => <Content />}
    />
  );
};
