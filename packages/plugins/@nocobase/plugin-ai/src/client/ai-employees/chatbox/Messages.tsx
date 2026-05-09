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
import { Spin, Layout, Divider, Button, Space, Typography } from 'antd';
import { RightOutlined, DownOutlined, LoadingOutlined } from '@ant-design/icons';
import { namespace, useT } from '../../locale';
import { useAPIClient, useApp, useToken } from '@nocobase/client';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatMessageActions } from './hooks/useChatMessageActions';
import { useChatBoxStore } from './stores/chat-box';
import { useChatToolsStore } from './stores/chat-tools';
import { flattenMessages, formatConversationDuration, RenderedItem } from './utils';
import { useWorkflowTasks } from './hooks/useWorkflowTasks';
import { useChatConversationsStore } from './stores/chat-conversations';

const { Text, Link } = Typography;

const STICKY_BOTTOM_THRESHOLD = 48;

const isSameMessageContent = (prev: any, next: any) =>
  prev === next ||
  (prev?.messageId === next?.messageId &&
    prev?.content === next?.content &&
    prev?.reasoning === next?.reasoning &&
    prev?.tool_calls === next?.tool_calls &&
    prev?.metadata === next?.metadata &&
    prev?.reference === next?.reference);

const MemoBubble = React.memo(Bubble, (prevProps: any, nextProps: any) => {
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.placement === nextProps.placement &&
    prevProps.variant === nextProps.variant &&
    prevProps.avatar === nextProps.avatar &&
    prevProps.header === nextProps.header &&
    prevProps.footer === nextProps.footer &&
    prevProps.messageRender === nextProps.messageRender &&
    isSameMessageContent(prevProps.content, nextProps.content)
  );
});

export const Messages: React.FC = () => {
  const t = useT();
  const { token } = useToken();

  const roles = useChatBoxStore.use.roles();

  const messages = useChatMessagesStore.use.messages();

  const updateTools = useChatToolsStore.use.updateTools();

  const { messagesService, lastMessageRef } = useChatMessageActions();
  const renderedMessages = useMemo(() => flattenMessages(messages), [messages]);
  const [collapsedConversationKeys, setCollapsedConversationKeys] = useState<Record<string, boolean>>({});
  const firstMessageIndex = renderedMessages.findIndex(
    (item) => item.type === 'message' && item.isRoot && item.message.content?.type !== 'greeting',
  );

  useEffect(() => {
    updateTools(messages);
  }, [messages, updateTools]);

  useEffect(() => {
    setCollapsedConversationKeys((prev) => {
      const next = { ...prev };
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

      return changed ? next : prev;
    });
  }, [renderedMessages]);

  const containerRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);

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

    return () => cancelAnimationFrame(frame);
  }, [messages]);

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
            setCollapsedConversationKeys((prev) => ({
              ...prev,
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
    const nickname = item.roleName ? (roles[item.roleName] as any)?.nickname || item.roleName : undefined;

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

    const msg = item.message;
    const role = roles[msg.role];
    if (!role) {
      return null;
    }

    return indexPath === String(firstMessageIndex) ? (
      <div key={msg.key} ref={lastMessageRef}>
        <MemoBubble {...role} loading={msg.loading} content={msg.content} />
      </div>
    ) : (
      <MemoBubble {...role} key={msg.key} loading={msg.loading} content={msg.content} />
    );
  };

  const app = useApp();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const setResponseLoading = useChatMessagesStore.use.setResponseLoading();
  const { updateReadonly } = useWorkflowTasks();
  const onAIEmployeeTaskStatusUpdate = useCallback(
    (e: any) => {
      const { sessionId, status } = e.detail;
      if (currentConversation && currentConversation === sessionId) {
        if (status !== 'processing') {
          messagesService.run(sessionId);
          setResponseLoading(false);
          updateReadonly(sessionId).catch(console.log);
        }
      }
    },
    [messagesService, updateReadonly, setResponseLoading, currentConversation],
  );
  useEffect(() => {
    app.eventBus.addEventListener('ws:message:ai-employee-tasks:status', onAIEmployeeTaskStatusUpdate);
    return () => {
      app.eventBus.removeEventListener('ws:message:ai-employee-tasks:status', onAIEmployeeTaskStatusUpdate);
    };
  }, [app.eventBus, onAIEmployeeTaskStatusUpdate]);

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
  const api = useAPIClient();
  const t = useT();
  const { messagesService } = useChatMessageActions();
  const currentConversation = useChatConversationsStore.use.currentConversation?.();
  const currentEmployee = useChatBoxStore.use.currentEmployee?.();
  const messagesLength = useChatMessagesStore((state) => state.messages.length);
  const [show, setShow] = useState(false);
  const messageCount = useRef(0);

  const refreshMessages = useCallback(() => {
    if (currentConversation) {
      messagesService.run(currentConversation);
    }
  }, [messagesService, currentConversation]);

  const doStateCheck = useCallback(async () => {
    if (currentConversation) {
      const res = await api.resource('aiConversations').get({
        filter: { sessionId: currentConversation },
      });
      if (res.data?.data?.llmActiveState === 'invoking') {
        setShow(true);
      } else {
        setShow(false);
      }
    }
  }, [api, currentConversation]);

  useEffect(() => {
    if (messagesLength !== messageCount.current) {
      messageCount.current = messagesLength;
      doStateCheck().catch(console.error);
    }
  }, [messagesLength, doStateCheck]);

  if (!currentConversation) {
    return null;
  }

  const Content: React.FC = () => (
    <Typography>
      <Space>
        <Spin indicator={<LoadingOutlined spin />} />
        <Text type="secondary">
          {t('{{ nickname }} is working in background.', { ns: namespace, nickname: currentEmployee?.nickname })}
        </Text>
        <Link onClick={refreshMessages}>{t('Click', { ns: namespace })}</Link>
        <Text type="secondary">{t('to Refresh.', { ns: namespace })}</Text>
      </Space>
    </Typography>
  );

  return (
    show && (
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
    )
  );
};
